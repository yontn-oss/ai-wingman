import { generateText, stepCountIs, type StepResult } from 'ai'
import { openai } from '@ai-sdk/openai'
import { djTools } from '@/lib/tools'
import type { SetlistTrack } from '@/lib/tools'
import { searchArtist, getArtistAlbums, getAlbumTracks, searchTracks } from '@/lib/spotify'
import type { SpotifyTrack } from '@/lib/spotify'
import { SPOTIFY_GENRES } from '@/lib/genres'

export const maxDuration = 60

type DiscoveryMode = 'vibe-search' | 'artist-graph' | 'tight-set'
type CurationEngine = 'camelot' | 'style'

// Session context returned to client and echoed back on subsequent calls
export interface ArtistGraphCtx {
  artistId: string
  artistName: string
  genres: string[]              // e.g. ["idm", "ambient techno"]
  artistTrackIds: string[]      // all known tracks by the seed artist (reference set)
  genreOffset: number           // how many pages of genre results already fetched
  candidatePool: SpotifyTrack[] // genre-filtered tracks fetched so far
}

interface SuggestRequest {
  vibe: string
  mode?: DiscoveryMode
  engine?: CurationEngine
  currentTrack?: SetlistTrack | null
  excluded?: string[]
  bannedArtists?: string[]
  later?: SetlistTrack[]
  feedback?: 'on-track' | 'off-track'
  ratedHistory?: { name: string; artist: string; feedback: 'on-track' | 'off-track' }[]
  artistGraphCtx?: ArtistGraphCtx  // echoed back from client for mid-session calls
  confirmedArtistId?: string        // set by picker UI — skips artist search step
  confirmedArtistName?: string
}

const DEBUG = process.env.WINGMAN_DEBUG === '1'
function dbg(label: string, data: unknown) {
  if (DEBUG) console.log(`[wingman:route] ${label}`, JSON.stringify(data, null, 2))
}

// ── Artist-graph initialization ──────────────────────────────────────────────

function extractArtistFromVibe(vibe: string): string {
  const match = vibe.match(/(?:sounds?\s+like|in\s+the\s+style\s+of|inspired?\s+by|similar\s+to|like)\s+(.+)/i)
  if (match) return match[1].trim().replace(/[.,;!?]$/, '')
  return vibe.trim()
}

const POOL_PAGE_SIZE = 10  // Spotify search limit max is 10

// Build a lookup set of valid genre names (lowercase) from the curated list
const VALID_GENRE_NAMES = new Set(SPOTIFY_GENRES.map(g => g.name.toLowerCase()))

// Infer Spotify-compatible genre keywords for an artist using a fast LLM call.
// Returns 1–3 genre names that are guaranteed to exist in SPOTIFY_GENRES.
async function inferGenres(artistName: string): Promise<string[]> {
  const genreList = SPOTIFY_GENRES.map(g => g.name).join(', ')

  const result = await generateText({
    model: openai('gpt-5.4-nano'),
    prompt: `You are given the following complete list of valid Spotify genre tags:\n${genreList}\n\nFrom this list only, pick the 1-2 most specific genres that best match the artist "${artistName}". Prefer niche/specific genres over broad ones. Reply with only genre names from the list above, separated by commas, exactly as written, no explanation.`,
    maxOutputTokens: 60,
  }).catch(() => ({ text: '' }))

  const genres = result.text
    .split(',')
    .map(g => g.trim().toLowerCase())
    .filter(g => VALID_GENRE_NAMES.has(g))  // drop anything not in the list
    .slice(0, 3)

  dbg('artist-graph:genres-raw', result.text)
  dbg('artist-graph:genres-validated', genres)
  return genres
}

async function fetchGenreTracks(genres: string[], offset: number, bannedArtists: string[]): Promise<SpotifyTrack[]> {
  const results = await Promise.all(
    genres.map((genre, i) => {
      // Quote multi-word genres so Spotify treats them as a phrase, not separate keywords
      const q = genre.includes(' ') ? `genre:"${genre}"` : `genre:${genre}`
      return searchTracks(q, POOL_PAGE_SIZE, offset + i * POOL_PAGE_SIZE).catch(() => [])
    })
  )
  return results.flat().filter(t => !bannedArtists.includes(t.artist))
}

function getFingerprint(t: { name: string; artist: string }) {
  const norm = (s: string) => s.toLowerCase().replace(/[^\w\s]/g, '').trim()
  return `${norm(t.name)}|${norm(t.artist)}`
}

async function initArtistGraph(artistId: string, artistName: string, bannedArtists: string[]): Promise<ArtistGraphCtx> {
  dbg('artist-graph:init', { artistId, artistName })

  // 1. Get artist's albums
  const albums = await getArtistAlbums(artistId, 10)
  dbg('artist-graph:albums', albums.map(a => a.name))

  // 2. Get tracks for each album and reconstruct full track info
  const albumTrackLists = await Promise.all(
    albums.map(async (album) => {
      const tracks = await getAlbumTracks(album.id).catch(() => [])
      return tracks.map(t => ({
        id: t.id,
        name: t.name,
        artistId: artistId,
        artistIds: [artistId],
        artist: artistName,
        releaseYear: album.releaseYear,
        durationMs: t.durationMs,
      }))
    })
  )
  const artistOwnTracks = albumTrackLists.flat()
  const artistTrackIds = artistOwnTracks.map(t => t.id)
  dbg('artist-graph:artist-track-count', artistTrackIds.length)

  // 3. Infer genres via fast LLM call, then search each genre for a candidate pool
  const genres = await inferGenres(artistName)
  dbg('artist-graph:genres-inferred', genres)

  // 4. Initial candidate pool (Discovery style search + genre discovery + interleave target)
  // Combine artist name with top genre for a tighter stylistic search, excluding the artist themselves.
  const topGenre = genres[0] || ''
  const styleResults = await searchTracks(`${artistName} ${topGenre} -artist:"${artistName}"`, 10)
  const genreTracks = await fetchGenreTracks(genres, 0, bannedArtists)
  const others = [...styleResults, ...genreTracks]
    .filter((t, i, self) => {
      const finger = getFingerprint(t)
      return self.findIndex(s => getFingerprint(s) === finger) === i
    })

  // Interleave to maintain a ~1:7 ratio in the candidate list
  const interleaved: SpotifyTrack[] = []
  let aPtr = 0
  let oPtr = 0
  const RATIO = 7

  while (aPtr < artistOwnTracks.length || oPtr < others.length) {
    if (aPtr < artistOwnTracks.length) interleaved.push(artistOwnTracks[aPtr++])
    for (let i = 0; i < RATIO - 1 && oPtr < others.length; i++) {
      interleaved.push(others[oPtr++])
    }
    if (oPtr >= others.length && aPtr < artistOwnTracks.length) {
      interleaved.push(...artistOwnTracks.slice(aPtr))
      break
    }
  }

  let rawPool = interleaved.filter((t, i, self) => {
    const finger = getFingerprint(t)
    return self.findIndex(s => getFingerprint(s) === finger) === i
  })

  // Fallback: if specific genres returned nothing, retry with the last word of each genre
  // (e.g. "experimental dubstep" → "dubstep") to find at least some stylistically related tracks.
  if (rawPool.length === 0 && genres.length > 0) {
    dbg('artist-graph:pool-empty-broadening', genres)
    const broadGenres = [...new Set(genres.map(g => g.split(' ').at(-1)!))]
    rawPool = (await fetchGenreTracks(broadGenres, 0, bannedArtists))
    dbg('artist-graph:broad-genres', broadGenres)
  }

  dbg('artist-graph:initial-pool', rawPool.map(t => `${t.name} — ${t.artist}`))

  return {
    artistId,
    artistName,
    genres,
    artistTrackIds,
    genreOffset: 1,
    candidatePool: rawPool,
  }
}

async function expandPool(ctx: ArtistGraphCtx, excluded: string[], bannedArtists: string[]): Promise<ArtistGraphCtx> {
  const available = ctx.candidatePool.filter(t => !excluded.includes(t.id))
  if (available.length >= 5 || ctx.genres.length === 0) return ctx

  dbg('artist-graph:expand-pool', { page: ctx.genreOffset })
  const newTracks = await fetchGenreTracks(ctx.genres, ctx.genreOffset * POOL_PAGE_SIZE, bannedArtists)
  const existingKeys = new Set(ctx.candidatePool.map(getFingerprint))
  const filtered = newTracks.filter(t => !existingKeys.has(getFingerprint(t)))
  return {
    ...ctx,
    genreOffset: ctx.genreOffset + 1,
    candidatePool: [...ctx.candidatePool, ...filtered],
  }
}

async function followAcceptedArtist(ctx: ArtistGraphCtx, accepted: SetlistTrack, bannedArtists: string[]): Promise<ArtistGraphCtx> {
  dbg('artist-graph:follow-artist', { artist: accepted.artist })

  // Fetch more from this specific artist. 
  // We search for the artist name directly to find their most relevant tracks.
  const artistTracks = await searchTracks(`artist:"${accepted.artist}"`, 10)
  dbg('artist-graph:follow-artist-search-results', artistTracks.map(t => `${t.name} — ${t.artist}`))

  // Filter out:
  // 1. The seed artist (don't loop back to it)
  // 2. Already existing tracks in the pool
  // 3. User banned artists
  const existingKeys = new Set(ctx.candidatePool.map(getFingerprint))
  const filtered = artistTracks.filter(t => {
    const finger = getFingerprint(t)
    return !existingKeys.has(finger) && !bannedArtists.includes(t.artist)
  })

  if (filtered.length === 0) return ctx

  dbg('artist-graph:follow-artist-added', { count: filtered.length, artist: accepted.artist })
  return {
    ...ctx,
    candidatePool: [...filtered, ...ctx.candidatePool]
  }
}

// ── Prompt builder ───────────────────────────────────────────────────────────

function buildPrompt(body: SuggestRequest, candidatesBlock?: string): string {
  const { vibe, currentTrack, excluded, bannedArtists, later, feedback, ratedHistory } = body
  const lines: string[] = [`Vibe: ${vibe}`]

  if (currentTrack) {
    const key = currentTrack.camelotKey ? ` — ${currentTrack.camelotKey}` : ''
    const bpm = currentTrack.bpm > 0 ? `, ${currentTrack.bpm} BPM` : ''
    lines.push(`Currently playing: "${currentTrack.name}" by ${currentTrack.artist}${key}${bpm}`)
  } else {
    lines.push('No track playing yet — this is the opening suggestion.')
  }

  if (excluded && excluded.length > 0) {
    lines.push(`Do not suggest these Spotify IDs (already played or rejected): ${excluded.join(', ')}`)
  }

  if (bannedArtists && bannedArtists.length > 0) {
    lines.push(`Do not suggest any tracks by these artists: ${bannedArtists.join(', ')}`)
  }

  if (feedback === 'on-track') {
    lines.push('User said last suggestion was on track — stay in this space.')
  } else if (feedback === 'off-track') {
    lines.push('User said last suggestion missed — try a different direction or energy.')
  }

  if (ratedHistory && ratedHistory.length > 0) {
    const liked = ratedHistory.filter(r => r.feedback === 'on-track')
    const disliked = ratedHistory.filter(r => r.feedback === 'off-track')
    if (liked.length > 0) lines.push(`User liked: ${liked.map(r => `"${r.name}" by ${r.artist}`).join('; ')}`)
    if (disliked.length > 0) lines.push(`User disliked: ${disliked.map(r => `"${r.name}" by ${r.artist}`).join('; ')}`)
  }

  if (later && later.length > 0) {
    const laterList = later.map((t) => {
      const key = t.camelotKey ? ` — ${t.camelotKey}` : ''
      const bpm = t.bpm > 0 ? `, ${t.bpm} BPM` : ''
      return `"${t.name}" by ${t.artist}${key}${bpm} (${t.spotifyId})`
    }).join('; ')
    lines.push(`May re-suggest only if genuinely best fit: ${laterList}`)
  }

  if (candidatesBlock) lines.push(candidatesBlock)

  return lines.join('\n')
}

function getSystemPrompt(engine: CurationEngine, mode: DiscoveryMode): string {
  const rubric = `
Musical Inference Rubric:
- Techno: 125–135 BPM | Driving, repetitive energy (0.7-0.9)
- House: 118–126 BPM | Groovy, soulful energy (0.5-0.7)
- Ambient/Downtempo: 60–100 BPM | Cinematic, atmospheric (0.1-0.3)
- Drum & Bass: 170–175 BPM | High-intensity breakbeats (0.8-1.0)
- Melodic Techno: 122–126 BPM | Emotional, synth-driven (0.6-0.8)

Style Reference Tracks (Global Calibration):
- "Windowlicker" (Aphex Twin): 126 BPM | 9A | Energy: 0.65
- "Innerbloom" (RÜFÜS DU SOL): 122 BPM | 5A | Energy: 0.72
- "Xpander" (Sasha): 128 BPM | 12B | Energy: 0.85
- "Weightless" (Marconi Union): 60 BPM | 1A | Energy: 0.05
- "Circles" (Adam F): 174 BPM | 11B | Energy: 0.92

DE-DUPLICATION GATES (STRICT):
- NEVER suggest a track ID included in the Excluded/Played IDs list.
- NEVER suggest any track from an artist in the Banned Artists list.
- If your chosen candidate violates these, pick a different one or search again.`

  const base = engine === 'camelot'
    ? `You are an expert DJ advisor. The user is building a live set and needs your single best next track suggestion.

${rubric}

Instructions:
- Use the candidate pool if provided; otherwise use your own musical knowledge.
- IMPORTANT: All musical attributes (BPM, Key, Energy) are ESTIMATED. Be as accurate as possible using the rubric.
- Prioritize harmonic compatibility: same key, adjacent key (±1), or +7 energy jump.
- Match BPM within ±8 BPM, or note a pitch shift in transitionNote.
- Calibrate Energy relative to currentTrack: if next is a "peak" track, increase energy by 0.1-0.2.
- transitionNote: 1–3 short sentences max.
- Call suggest_track with exactly one track when ready.`
    : `You are an expert DJ advisor. The user is building a live set and needs your single best next track suggestion.

${rubric}

Instructions:
- Focus on vibe, genre fit, and energy arc — not key matching.
- IMPORTANT: All musical attributes (BPM, Key, Energy) are ESTIMATED. 
- Calibrate Energy relative to currentTrack: if next is more intense, use a higher value.
- transitionNote: 1–3 short sentences max.
- Call suggest_track with exactly one track when ready.`

  const strategies: Record<DiscoveryMode, string> = {
    'vibe-search': 'Follow the DE-DUPLICATION GATES. Search from 2–3 different angles to build a candidate pool, then pick the single best.',
    'artist-graph': 'Follow the DE-DUPLICATION GATES. A pre-built candidate pool has been provided. You MUST choose from this pool ONLY and strictly follow the exclusion list! Copy the spotifyId exactly.',
    'tight-set': 'Follow the DE-DUPLICATION GATES. Make one focused search and pick the best result.',
  }

  return `${base}\n\nDiscovery strategy: ${strategies[mode]}`
}

// ── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const body = (await req.json()) as SuggestRequest
  const { mode = 'vibe-search', engine = 'camelot' } = body
  const excluded = body.excluded ?? []

  if (DEBUG) console.log(`\n[wingman:suggest] mode=${mode} engine=${engine} vibe="${body.vibe}"`)

  let ctx: ArtistGraphCtx | undefined
  let candidatesBlock: string | undefined

  if (mode === 'artist-graph') {
    try {
      if (body.artistGraphCtx) {
        // Mid-session: use existing context
        ctx = body.artistGraphCtx

        // If user just accepted a track, follow that artist and add their music to the pool
        if (body.feedback === 'on-track' && body.currentTrack) {
          ctx = await followAcceptedArtist(ctx, body.currentTrack, body.bannedArtists ?? [])
        }

        // Expand pool if depleted (genre-based)
        ctx = await expandPool(ctx, excluded, body.bannedArtists ?? [])
      } else {
        // First call: initialize with the artist confirmed by the user in the picker
        const artistId = body.confirmedArtistId
        const artistName = body.confirmedArtistName ?? extractArtistFromVibe(body.vibe)
        if (!artistId) throw new Error('confirmedArtistId required for artist-graph init')
        ctx = await initArtistGraph(artistId, artistName, body.bannedArtists ?? [])
      }

      if (ctx) {
        const available = ctx.candidatePool.filter(t =>
          !excluded.includes(t.id) &&
          !(body.bannedArtists ?? []).includes(t.artist)
        )
        const targetName = ctx.artistName.toLowerCase().trim()
        const artistMatches = available.filter(t => t.artist.toLowerCase().trim() === targetName)
        const otherMatches = available.filter(t => t.artist.toLowerCase().trim() !== targetName)

        // Dynamic Ratio Throttle: 
        // Calculate how many of the (played + skipped) tracks in this session are the target artist.
        // If the ratio is above 20% (1 in 5), we withhold the artist to force discovery.
        const excludedArtistIds = new Set(ctx.artistTrackIds)
        const excludedArtistCount = excluded.filter(id => excludedArtistIds.has(id)).length
        const totalExcluded = excluded.length
        const artistRatio = totalExcluded > 0 ? excludedArtistCount / totalExcluded : 0

        // Show the artist only if we haven't hit the 1:5 limit yet
        const includeArtist = artistRatio < 0.2 && artistMatches.length > 0
        const artistToInclude = includeArtist ? artistMatches.slice(0, 1) : []

        const visible = [
          ...artistToInclude,
          ...otherMatches.slice(0, 10),
        ].sort(() => Math.random() - 0.5)

        if (visible.length > 0) {
          const lines = visible
            .map(t => `- SPOTIFY_ID=${t.id} name="${t.name}" artist="${t.artist}" year=${t.releaseYear} duration=${t.durationMs}ms`)
            .join('\n')
          candidatesBlock = `Candidate pool — musical discovery based on the style of ${ctx.artistName} (related artists and ${ctx.genres.join(', ')})
${lines}

For suggest_track, set spotifyId = the exact SPOTIFY_ID value from the line above (copy character-for-character).`
        }
      }
    } catch (err) {
      console.error('[wingman:suggest] artist-graph init failed:', err)
      // Fall through to vibe-search behavior
    }
  }

  const prompt = buildPrompt(body, candidatesBlock)

  if (DEBUG) {
    console.log(`[wingman:suggest] prompt:\n${prompt}\n`)
  }

  // In artist-graph mode, always restrict to suggest_track only.
  // This prevents the model from calling search_tracks with the vibe text when the pool is empty,
  // which would return tracks named after the target artist (e.g. search_tracks("MUTO")).
  const tools = (mode === 'artist-graph')
    ? { suggest_track: djTools.suggest_track }
    : djTools

  const result = await generateText({
    model: openai('gpt-5.4-nano'),
    system: getSystemPrompt(engine, mode),
    prompt,
    tools,
    stopWhen: stepCountIs(8),
  })

  if (DEBUG) {
    const steps = result.steps as StepResult<typeof djTools>[]
    console.log(`[wingman:suggest] model used ${steps.length} step(s):`)
    steps.forEach((step, i) => {
      step.toolCalls.forEach(tc => console.log(`  step ${i + 1}: ${tc.toolName}()`))
    })
  }

  for (const step of result.steps as StepResult<typeof djTools>[]) {
    for (const toolCall of step.toolCalls) {
      if (toolCall.toolName === 'suggest_track') {
        const track = toolCall.input as SetlistTrack

        // If artist-graph mode: enforce that the spotifyId came from the pool.
        // If the model hallucinated an ID, substitute the pool track's real data.
        let finalTrack = track

        // 1. Mandatory Gate: Filter out excluded tracks or banned artists
        if (excluded.includes(track.spotifyId ?? '') || (body.bannedArtists ?? []).includes(track.artist)) {
          dbg('gate:dedupe-violation', { id: track.spotifyId, artist: track.artist })

          if (ctx) {
            // Remediation for Artist-Graph: pick the first available candidate that is not banned
            const available = ctx.candidatePool.filter(t =>
              !excluded.includes(t.id) &&
              !(body.bannedArtists ?? []).includes(t.artist)
            )
            const substitute = available[0]
            if (substitute) {
              dbg('gate:substituted', { name: substitute.name })
              finalTrack = {
                ...track,
                name: substitute.name,
                artist: substitute.artist,
                spotifyId: substitute.id,
                // keep the LLM's transitionNote as it was likely written for the vibe
              }
            }
          } else {
            // Remediation for Vibe-Search: we can only hope the next try is better or return an error
            // (In a future version, we could retry the LLM call)
            console.warn('[wingman:gate] dedupe violation in vibe-search — LLM ignored instructions')
          }
        }

        // 2. Artist-Graph specific: Enforce that the spotifyId came from the pool.
        if (ctx && finalTrack.spotifyId) {
          const poolTrack = ctx.candidatePool.find(t => t.id === finalTrack.spotifyId)
          if (!poolTrack) {
            dbg('artist-graph:id-mismatch', { hallucinated: finalTrack.spotifyId, name: finalTrack.name })
            const available = ctx.candidatePool.filter(t =>
              !excluded.includes(t.id) &&
              !(body.bannedArtists ?? []).includes(t.artist)
            )
            const substitute = available[0]
            if (substitute) {
              finalTrack = {
                ...finalTrack,
                name: substitute.name,
                artist: substitute.artist,
                spotifyId: substitute.id,
                releaseYear: substitute.releaseYear,
                durationMs: substitute.durationMs,
              }
              dbg('artist-graph:id-substituted', { id: substitute.id, name: substitute.name })
            }
          }
        }

        // Strip the suggested track from the pool
        const usedId = finalTrack.spotifyId
        const updatedCtx = ctx
          ? { ...ctx, candidatePool: ctx.candidatePool.filter(t => t.id !== usedId) }
          : null
        return Response.json({ track: finalTrack, artistGraphCtx: updatedCtx })
      }
    }
  }

  console.warn('API /suggest: No track suggestion generated.')
  return Response.json({ track: null, artistGraphCtx: ctx ?? null })
}
