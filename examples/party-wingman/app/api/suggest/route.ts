import { generateText, stepCountIs, type StepResult } from 'ai'
import { openai } from '@ai-sdk/openai'
import { djTools } from '@/lib/tools'
import type { SetlistTrack } from '@/lib/tools'

export const maxDuration = 60

type DiscoveryMode = 'vibe-search' | 'artist-graph' | 'tight-set'
type CurationEngine = 'camelot' | 'style'

interface SuggestRequest {
  vibe: string
  mode?: DiscoveryMode
  engine?: CurationEngine
  currentTrack?: SetlistTrack | null
  excluded?: string[]     // spotifyIds never to suggest (played + banned)
  bannedArtists?: string[] // artist names never to suggest
  later?: SetlistTrack[]  // deferred tracks — only re-suggest if best fit
  feedback?: 'on-track' | 'off-track' // directional signal from the user about the last suggestion
}

function buildPrompt({ vibe, currentTrack, excluded, bannedArtists, later, feedback }: SuggestRequest): string {
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
    lines.push('The user said the last suggestion was on the right track — stay in this space and vibe.')
  } else if (feedback === 'off-track') {
    lines.push('The user said the last suggestion missed the mark — try a clearly different direction, genre, or energy level.')
  }

  if (later && later.length > 0) {
    const laterList = later.map((t) => {
      const key = t.camelotKey ? ` — ${t.camelotKey}` : ''
      const bpm = t.bpm > 0 ? `, ${t.bpm} BPM` : ''
      return `"${t.name}" by ${t.artist}${key}${bpm} (${t.spotifyId})`
    }).join('; ')
    lines.push(`May re-suggest only if genuinely the best fit: ${laterList}`)
  }

  return lines.join('\n')
}

const modeStrategy: Record<DiscoveryMode, string> = {
  'vibe-search': 'Search from 2–3 different angles (genre descriptors, mood words, artist references) to build a candidate pool, then pick the single best.',
  'artist-graph': 'Search for a seed track to get the artistId, call get_related_artists to find artists in the same space, then search for tracks by the most relevant related artists. Strongly prefer tracks by related artists over the seed artist — the seed is a reference point, not the target. Only suggest a track by the seed artist if nothing from the related artists is a better fit.',
  'tight-set': 'Make one focused search and pick the best result. No gap-filling.',
}

function getSystemPrompt(engine: CurationEngine, mode: DiscoveryMode): string {
  const engineRules: Record<CurationEngine, string> = {
    camelot: `You are an expert DJ advisor. The user is building a live set and needs your single best next track suggestion.

Rules:
- Use your own musical knowledge for BPM, Camelot key, and energy
- Prioritize harmonic compatibility with the current track (same key, adjacent key, or +7 energy jump)
- Match BPM within ±8 BPM of the current track, or note a pitch shift in transitionNote
- Never suggest any track whose Spotify ID appears in the excluded list
- Only re-suggest a deferred track if it is genuinely the best option
- transitionNote must be 1–3 short sentences max — no long explanations
- Call suggest_track with exactly one track when ready`,

    style: `You are an expert DJ advisor. The user is building a live set and needs your single best next track suggestion.

Rules:
- Focus on vibe, genre fit, and energy arc — not key or BPM matching
- Estimate camelotKey and bpm from musical knowledge; use your knowledge for energy (0–1)
- Never suggest any track whose Spotify ID appears in the excluded list
- Only re-suggest a deferred track if it is genuinely the best option
- transitionNote must be 1–3 short sentences max — no long explanations
- Call suggest_track with exactly one track when ready`,
  }

  return `${engineRules[engine]}\n\nDiscovery strategy: ${modeStrategy[mode]}`
}

export async function POST(req: Request) {
  const body = (await req.json()) as SuggestRequest
  const { mode = 'vibe-search', engine = 'camelot' } = body

  const result = await generateText({
    model: openai('gpt-5.4-nano'),
    system: getSystemPrompt(engine, mode),
    prompt: buildPrompt(body),
    tools: djTools,
    stopWhen: stepCountIs(8),
  })

  for (const step of result.steps as StepResult<typeof djTools>[]) {
    for (const toolCall of step.toolCalls) {
      if (toolCall.toolName === 'suggest_track') {
        const track = toolCall.input as SetlistTrack
        return Response.json({ track })
      }
    }
  }

  return Response.json({ track: null })
}
