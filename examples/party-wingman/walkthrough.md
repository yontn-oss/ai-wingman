# Building Party Wingman with ai-wingman

Party Wingman is a Next.js app that uses an AI agent to suggest the next track for a DJ mid-set. You describe a vibe — "dark, driving melodic techno, 132 BPM" — pick a discovery mode and curation engine, and the agent searches Spotify, reasons about fit, and surfaces one track. You act on it: Yes (play it), No (never again), Later (come back to this), or Artist (ban the whole artist). Then the next suggestion comes automatically.

The app demonstrates the ai-wingman `tools` pattern: an agentic API route where the model calls server-side functions and the result flows back to the UI as typed structured data — not parsed markdown.

The reason this example exists: most AI tool demos stop at "the model called a function." This one goes further — the tool call *is* the UI contract. `suggest_track` isn't a tool that does anything on the server. It's a typed delivery channel that moves a single `SetlistTrack` from the agent's reasoning loop into a React component. That pattern — using tool invocations as structured data delivery — is what this walkthrough is built to demonstrate.

---

## Architecture

```mermaid
graph TB
    subgraph client["Browser — session state lives here"]
        vibe["Vibe · Mode · Engine"]
        session["currentTrack · excluded\nbannedArtists · later"]
        card["TrackCard\n(Yes / No / Later / Artist)"]
    end

    subgraph server["Next.js Server  ·  trust boundary"]
        route["POST /api/suggest\napp/api/suggest/route.ts\nbuildPrompt() encodes session context"]

        subgraph loop["Agentic loop  ·  generateText  ·  stopWhen(8 steps)"]
            model["gpt-5.4-nano\n+ system prompt\n(engine rules + mode strategy)"]
        end

        ra["search_artist\nConfirm seed artist"]
        ck["check_key_compatibility\nCamelot wheel · pure fn"]
        sg["suggest_track\ntyped delivery channel\nexecute() → { success }"]
    end

        camelot["lib/camelot.ts"]
        spotifylib["lib/spotify.ts\nClient Credentials OAuth"]
    end

    spotifyapi[("Spotify\nWeb API")]
    openaiapi[("OpenAI\nAPI")]

    vibe -->|"POST { vibe, mode, engine,\ncurrentTrack, excluded,\nbannedArtists, later }"| route
    session --> vibe
    route --> model
    model -->|"tool calls"| tools
    tools -->|"results"| model
    st --> spotifylib
    ra --> spotifylib
    ck --> camelot
    spotifylib --> spotifyapi
    model <-->|"completions"| openaiapi
    sg -->|"toolCall.input\n(not execute output)"| route
    route -->|"{ track: SetlistTrack | null }"| card
    card --> session
```

**What wingman scaffolds:** `app/api/tools/route.ts` (the agentic POST endpoint) and `lib/tools/my-tool.tools.ts` (the typed tool stub). Phase 4 extends the endpoint to `app/api/suggest/route.ts`; Phase 3 replaces the stub with the four real tools in `lib/tools.ts`.

**The trust boundary:** Spotify credentials and the OpenAI key live exclusively in `process.env` on the server. The browser only ever sends the vibe, mode, engine, and session context — and receives one `SetlistTrack`.

**Session state on the client:** The browser owns the session — what's currently playing, what's been excluded, which artists are banned, which tracks are deferred. This all travels to the server on every request as structured context. The server is stateless.

**`suggest_track` as the exit:** The agentic loop ends when the model calls `suggest_track`. Its `execute()` returns `{ success: true }` — a no-op. The payload is in `toolCall.input`, extracted by the route handler and sent to the client as JSON. One track per request.

---

## Phase 1 — Foundation

### The moment

Before you can scaffold wingman patterns, you need a Next.js app. That sounds trivial but it's load-bearing: the wingman CLI detects Next.js version, installs into your existing `package.json`, and writes files into your app router structure. Getting a clean, opinionated baseline right upfront prevents a whole class of "this worked in the scaffold but not my app" bugs later.

The choice of flags matters here. `--app` for the App Router (wingman requires it), `--typescript` (strict type safety throughout), `--tailwind` (components are Tailwind-first), `--no-src-dir` and `--no-import-alias` (keeps paths clean and predictable for the generated files).

### Command

```bash
cd examples/
npx create-next-app@latest party-wingman \
  --typescript \
  --tailwind \
  --app \
  --no-src-dir \
  --no-import-alias \
  --eslint \
  --yes
```

### What was scaffolded

Standard App Router layout — `app/`, `public/`, config files. A `.env.example` was added immediately after:

```
OPENAI_API_KEY=
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
```

**Spotify app setup:** Create an app at [developer.spotify.com](https://developer.spotify.com). The Redirect URI field is mandatory — set it to `http://127.0.0.1`. This app uses Client Credentials flow (no user login), so the redirect URI is never actually used, but Spotify requires it.

---

## Phase 2 — Wingman Scaffold

### The moment

With a Next.js app in place, wingman adds the `tools` pattern — an agentic API route wired for multi-step tool calling, plus a typed tool stub. One command.

### Command

```bash
npx ai-wingman add tools --provider openai --yes
```

Wingman detects Next.js, installs `@ai-sdk/openai`, `ai`, and `zod`, and creates two files:

**`app/api/tools/route.ts`** — The agentic POST endpoint. Uses `streamText` with `stopWhen: stepCountIs(5)`. The model defaults to `gpt-5.4-nano` — **change this to your preferred model** (this app uses `gpt-5.4-nano`). The auth comment stub is a reminder that this route needs protection before production.

**`lib/tools/my-tool.tools.ts`** — A typed tool stub using `tool()` from the AI SDK with a Zod schema. This is the starting point — not the destination.

### One thing to do immediately after scaffolding

The `tools` pattern is backend-only — it generates an API route and a tool stub, no UI. Patterns that include UI components (chat, agent, generative-ui) run `npx shadcn@latest add` automatically, which sets up `lib/utils.ts` with the `cn()` helper. Tools skips this because there's nothing to add.

Since Party Wingman builds UI components, run shadcn manually to get the baseline:

```bash
npx shadcn@latest add button
```

This installs `clsx` and `tailwind-merge`, creates `lib/utils.ts`, and adds the Button component — all of which the card components use.

Replace the default Next.js template in `app/page.tsx` with a placeholder; fill it in Phase 5.

---

## Phase 3 — The Tools Layer

### The moment

The scaffold gave us a typed stub. Now we make it real. Three files come to life here: the Camelot mapping library, the Spotify API wrapper, and the tool definitions that expose both to the agent.

The question that shapes everything: what does the model actually need to know? Not your Spotify client secret. Not the endpoint URL. It needs: here are some tracks, here is whether transition A→B is harmonically sound, here is the chosen track when done. That delineation — what the model sees vs. what the server knows — is the trust boundary, and it determines the tool surface.

### `lib/camelot.ts` — pure, no I/O

Spotify's `key` integer (0–11, pitch class notation) maps to the Camelot wheel used by DJs. Edge case: `key = -1` means Spotify could not detect the key. That's valid data, not an error.

`toCamelot(key, mode)` returns `null` when `key === -1`. `checkCompatibility(keyA, keyB)` accepts `string | null` — null inputs always return incompatible, because you can't assess a transition without knowing the key.

Named relationships matter: `same key`, `adjacent (energy boost)`, `adjacent (energy drop)`, `relative major/minor`, `incompatible`. The names give the agent language to put in `transitionNote`.

Adjacency wraps at 12↔1 — `12A` and `1A` are adjacent. Easy to get wrong with naive modulo arithmetic.

### `lib/spotify.ts` — Spotify API wrapper

Three functions, one token cache. Client Credentials OAuth: fetch token on first request, cache with a 60-second safety buffer before expiry, reuse until near-expiry.

- `searchTracks(query, limit)` — returns `{ id, name, artist, artistId, releaseYear, durationMs }[]`. The `artistId` passthrough is deliberate: Artist Graph mode needs it without a separate lookup. `releaseYear` is parsed from `album.release_date.slice(0, 4)`.

### `lib/tools.ts` — four tools, one type

Replace `lib/tools.ts` with the DJ tools:

```ts
export interface SetlistTrack {
  spotifyId: string         // from search_tracks
  name: string
  artist: string
  releaseYear: number       // from search_tracks (album.release_date); 0 if unavailable
  camelotKey: string | null // null in Style engine or if key unknown
  bpm: number               // 0 in Style engine
  energy: number            // 0.0–1.0, model's knowledge
  transitionNote: string
}

export const djTools = {
  search_tracks:            // Discovery: find tracks by vibe. Returns id, name, artist, artistId, releaseYear, durationMs.
  search_artist:            // Confirm seed artist & get genres.
  check_key_compatibility:  // Pure, synchronous. Two Camelot keys → compatible + relationship string.
  suggest_track:            // Delivery. execute() returns { success: true }. Payload is in the tool input.
}
```

`suggest_track`'s `execute` is intentionally minimal:

```ts
async execute() {
  return { success: true }
}
```

The payload is not in the return value — it's in the tool's **input** (the args the model passed). The API route iterates `result.steps` to find the `suggest_track` tool call and extracts `toolCall.input` as the `SetlistTrack`. This is a common mistake: `execute()` returns the result, but the structured data you care about is in `input`.

The model gets `releaseYear` directly from `search_tracks` results and passes it through to `suggest_track`. It doesn't need to know anything about the year — it's just a field it reads from the search result and echoes into the delivery call.

---

## Phase 4 — The Suggest Endpoint

### The moment

Tools exist. The agent needs a job, a strategy, and an endpoint to run in. This is where the `tools` scaffold gets extended into the real API.

The scaffold generated `app/api/tools/route.ts` with `streamText`. We don't need streaming here — the UI waits for the full agent loop before rendering the card. Create `app/api/suggest/route.ts` using `generateText` instead.

### Why `generateText` not `streamText`

The card UI shows a loading skeleton, then a card. There's nothing to stream to. `generateText` runs the full agentic loop server-side, returns when done, and we extract the result from `result.steps`. Simpler, and the right tool for the job.

### Session context as the prompt

The request body carries the full session:

```ts
interface SuggestRequest {
  vibe: string
  mode?: 'vibe-search' | 'artist-graph' | 'tight-set'  // default: vibe-search
  engine?: 'camelot' | 'style'                          // default: camelot
  currentTrack?: SetlistTrack | null   // last yes'd track (transition reference)
  excluded?: string[]                  // spotifyIds: played + no'd + cooling-down tracks
  bannedArtists?: string[]             // artist names never to suggest
  later?: SetlistTrack[]               // deferred tracks eligible for re-suggestion
}
```

`buildPrompt()` encodes this into the user message sent to the model:

```
Vibe: {vibe}
Currently playing: {name} by {artist} — {camelotKey}, {bpm} BPM
  (or "No track playing yet")
Excluded spotifyIds: [...]
Banned artists: [...]
Later tracks: [{name} by {artist} — {camelotKey}, {bpm} BPM}, ...]
```

This is the model's "memory." There is no conversation history, no thread — just the structured context injected into each request. The model uses `currentTrack` as the transition reference, avoids excluded IDs and banned artists, and can choose to re-suggest a later track if it's genuinely the best fit.

### System prompt structure

```
[engine rules]
  camelot: use own knowledge for BPM/key/energy; Camelot wheel transitions; include spotifyId
  style:   vibe/energy arc only; camelotKey: null, bpm: 0; include spotifyId

[mode strategy appended]
  vibe-search:  search from 2–3 different angles → pick the single best → suggest_track
  artist-graph: search_artist → infer genres → expand pool by genre → suggest_track
  tight-set:    single focused search → pick best result → suggest_track
```

Mode strategies are discovery hints — they tell the model how to build a candidate pool. The agent always delivers exactly one track via `suggest_track`. `stopWhen: stepCountIs(8)` is the ceiling — generous enough for Artist Graph (seed + related + 1–2 artist searches + suggest), but catches runaway loops.

### Extracting the result

```ts
const result = await generateText({
  model: openai('gpt-5.4-nano'),
  system: buildSystemPrompt(mode, engine),
  prompt: buildPrompt(vibe, currentTrack, excluded, bannedArtists, later),
  tools: djTools,
  stopWhen: stepCountIs(8),
})

for (const step of result.steps) {
  for (const toolCall of step.toolCalls) {
    if (toolCall.toolName === 'suggest_track') {
      const track = toolCall.input as SetlistTrack
      return Response.json({ track })
    }
  }
}

return Response.json({ track: null })
```

Note `toolCall.input` — not `toolCall.args`, not `toolCall.output`. The AI SDK v6 uses `input` for tool call arguments.

---

## Phase 5 — The Card UI

### The moment

The backend returns `{ track: SetlistTrack | null }`. One track. Now the question is: how does the user act on it?

Not a queue. Not a setlist. One card — and four ways to respond. Each response immediately triggers the next suggestion. The session state that shapes the next suggestion lives entirely in the client.

### `components/track-card.tsx`

The card and its action column are a single component. The card shows the track data; the action column sits to its right.

**Card:** name (large), artist, release year (hidden when 0), Camelot key badge (hidden when null), BPM (hidden when 0), energy bar (inline style width = `energy * 100%`), transition note.

**Action column (right of card):**
- **Yes** (green, CheckIcon) — opens Spotify (`https://open.spotify.com/track/{spotifyId}`), sets as current track, fetches next suggestion
- **Later** (amber, ClockIcon) — defers the track with cooldown, fetches next
- **No** (red, XIcon) — permanently excludes the track, fetches next
- **Artist** (orange, UserXIcon, title="No more {artist}") — bans all tracks by this artist for the session, fetches next

No index counter or total — there's no queue to position within. Each suggestion is the only one on screen.

### `app/page.tsx` — session state

The page owns the full session:

```ts
const [suggestion, setSuggestion] = useState<SetlistTrack | null>(null)
const [currentTrack, setCurrentTrack] = useState<SetlistTrack | null>(null)
const [played, setPlayed] = useState<SetlistTrack[]>([])       // all yes'd tracks
const [banned, setBanned] = useState<SetlistTrack[]>([])       // all no'd tracks
const [later, setLater] = useState<LaterTrack[]>([])           // deferred with cooldown metadata
const [bannedArtists, setBannedArtists] = useState<string[]>([])
```

### The LaterTrack cooldown

`Later` doesn't just defer — it imposes a cooldown based on how many times you've pushed a track away:

```ts
interface LaterTrack {
  track: SetlistTrack
  dismissCount: number           // how many times "later" was clicked for this track
  playedCountAtDismissal: number // played.length when last dismissed
}

function isCoolingDown(lt: LaterTrack, playedCount: number): boolean {
  return playedCount - lt.playedCountAtDismissal < Math.ceil(lt.dismissCount / 2)
}
```

If you hit Later once, the track needs 1 more play before it's eligible again. Hit it twice, it needs 1 more. Three times, 2 more. The cooldown grows with repeat dismissals. Tracks in cooldown have their `spotifyId` added to `excluded`; tracks past cooldown are sent in the `later` array where the model can choose to re-suggest them.

### Building excluded at fetch time

```
availableLater  = later tracks where !isCoolingDown(lt, played.length)
coolingDown     = later tracks where isCoolingDown(lt, played.length)
excluded        = [...played, ...banned].map(t => t.spotifyId)
                  .concat(coolingDown.map(lt => lt.track.spotifyId))
```

The model receives `excluded` (spotifyIds to avoid), `bannedArtists` (artist names to never suggest), and `later` (the available deferred tracks with key/bpm info for the model to assess fit).

### The sessionRef pattern

`fetchSuggestion` uses a `sessionRef` to avoid stale closure bugs. Because React state updates are async, a `fetchSuggestion` called inside a handler would capture stale values if it read directly from state. Instead:

```ts
const sessionRef = useRef({ played, banned, later, bannedArtists, currentTrack })
// kept in sync on each render
```

Actions like `handleYes` pass override values for immediately-changed state (e.g., updated `currentTrack` and `played`) rather than relying on the ref being up to date in the same tick. This ensures the fetch that fires right after a Yes action includes the track that was just played.

### The four actions

- **handleYes:** opens Spotify, adds suggestion to `played`, sets `currentTrack`, fetches next (passing updated currentTrack + played as overrides)
- **handleNo:** adds suggestion to `banned`, fetches next
- **handleLater:** increments `dismissCount` for an existing LaterTrack (or adds a new one), updates `playedCountAtDismissal`, fetches next
- **handleBanArtist:** adds `suggestion.artist` to `bannedArtists`, fetches next

Changing the vibe input and hitting Suggest resets context — new vibe, fresh session.

### `components/mode-selector.tsx` and `components/engine-toggle.tsx`

Both are compact segmented controls with a dark theme and violet active state. They're stateless — they receive value and onChange, nothing else.

`ModeSelector` renders three options: Vibe Search / Artist Graph / Tight Set with short descriptors.
`EngineToggle` renders two: Camelot (Harmonic mixing) / Style (Energy & vibe).

They sit in the same flex row in the form, separated by a thin divider. On narrow screens they wrap naturally — mode selector takes the first line, engine toggle and Generate take the second.

---

## What This Demonstrates

Party Wingman isn't really about DJs. It's about the pattern:

1. **Tools as UI contracts.** `suggest_track` doesn't do anything on the server. Its value is structural: it forces the agent to produce a typed, Zod-validated `SetlistTrack` and routes that payload directly to a React component. No parsing. No regex. No "the model changed its formatting."

2. **Session context as the prompt.** The model has no memory between requests — no conversation thread, no history. Its "context" is the structured prompt: what's playing, what's excluded, who's banned, what's deferred. The client owns this state; the server receives it on every request. This is simpler and more predictable than maintaining server-side session state.

3. **`generateText` for agentic one-shot tasks.** Not everything needs streaming. When the output is a structured data payload and the UI just needs it when it's ready, `generateText` is the right primitive. The agent runs its loop — potentially many tool calls — and returns one track. `streamText` is for incremental display; `generateText` is for background work.

4. **Client-side rules, server-side intelligence.** The cooldown formula, exclusion list assembly, artist ban enforcement — all of this lives in the client. The server just receives the resulting lists. The model doesn't know about `LaterTrack` or `isCoolingDown` — it just sees "here are the tracks you can consider re-suggesting" and "here are the IDs to avoid." The intelligence boundary is clear: client handles state and rules, model handles musical reasoning.
