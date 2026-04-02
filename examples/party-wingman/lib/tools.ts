import { tool } from 'ai'
import { z } from 'zod'
import { searchTracks, searchArtist } from './spotify'
import { checkCompatibility } from './camelot'

const DEBUG = process.env.WINGMAN_DEBUG === '1'
function dbg(label: string, data: unknown) {
  if (DEBUG) console.log(`[wingman:tool] ${label}`, JSON.stringify(data, null, 2))
}

export interface SetlistTrack {
  spotifyId: string
  name: string
  artist: string
  releaseYear: number
  durationMs: number
  camelotKey: string
  bpm: number
  energy: number
  transitionNote: string
}

export const djTools = {
  search_tracks: tool({
    description: [
      'Search Spotify for tracks. Returns id, name, artist, artistId, releaseYear, durationMs.',
      'Supports Spotify field filters in the query string:',
      '  - artist:ArtistName  — tracks by a specific artist (e.g. "artist:Autechre")',
      '  - Use field filters for artist-graph mode to get tracks by a named artist precisely.',
    ].join('\n'),
    inputSchema: z.object({
      query: z.string().describe(
        'Search query. Use plain text for vibe/genre searches. Use artist:Name syntax to find tracks by a specific artist.'
      ),
      limit: z
        .number()
        .min(1)
        .max(10)
        .optional()
        .default(10)
        .describe('Number of results to return (1–10, default 10)'),
      offset: z
        .number()
        .min(0)
        .optional()
        .default(0)
        .describe('Pagination offset — use multiples of limit to fetch the next page'),
    }),
    async execute({ query, limit, offset }) {
      dbg('search_tracks:input', { query, limit, offset })
      const tracks = await searchTracks(query, limit ?? 10, offset ?? 0)
      const result = tracks.map(({ id, name, artist, artistId, releaseYear, durationMs }) => ({
        id, name, artist, artistId, releaseYear, durationMs,
      }))
      dbg('search_tracks:output', result)
      return result
    },
  }),

  search_artist: tool({
    description:
      'Search Spotify for an artist by name (type=artist). Returns matching artists with their Spotify ID and genres. Use this in artist-graph mode to confirm the seed artist and get their genres.',
    inputSchema: z.object({
      name: z.string().describe('Artist name to search for'),
    }),
    async execute({ name }) {
      dbg('search_artist:input', { name })
      const artists = await searchArtist(name)
      const result = artists.map(({ id, name, genres }) => ({ id, name, genres }))
      dbg('search_artist:output', result)
      return result
    },
  }),

  check_key_compatibility: tool({
    description:
      'Check whether two tracks in Camelot notation are harmonically compatible for a smooth transition',
    inputSchema: z.object({
      keyA: z.string().describe('Camelot key of the first track (e.g. "8A")'),
      keyB: z.string().describe('Camelot key of the second track (e.g. "9A")'),
    }),
    execute({ keyA, keyB }) {
      return checkCompatibility(keyA, keyB)
    },
  }),

  suggest_track: tool({
    description:
      'Call this when you have selected the single best next track. This delivers your suggestion to the UI.',
    inputSchema: z.object({
      spotifyId: z.string().describe('Spotify track ID from search_tracks results'),
      name: z.string(),
      artist: z.string(),
      releaseYear: z.number().describe('Release year from search_tracks results'),
      durationMs: z.number().describe('Track duration in milliseconds from search_tracks results'),
      camelotKey: z.string().describe('Camelot key estimated from musical knowledge (e.g. "8A", "10B")'),
      bpm: z.number(),
      energy: z.number(),
      transitionNote: z.string().describe('Why this track fits here — harmonic move, energy shift, vibe connection'),
    }),
    async execute(input) {
      dbg('suggest_track:input', input)
      return { success: true }
    },
  }),
}
