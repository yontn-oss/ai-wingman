import { tool } from 'ai'
import { z } from 'zod'
import { searchTracks, getRelatedArtists } from './spotify'
import { checkCompatibility } from './camelot'

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
    description:
      'Search Spotify for tracks matching a vibe, genre, or description. Returns id, name, artist, artistId, and popularity.',
    inputSchema: z.object({
      query: z.string().describe('Search query describing the vibe, genre, or track'),
      limit: z
        .number()
        .min(1)
        .max(20)
        .optional()
        .default(10)
        .describe('Number of results to return (default 10, max 20)'),
    }),
    async execute({ query, limit }) {
      const tracks = await searchTracks(query, limit ?? 10)
      return tracks.map(({ id, name, artist, artistId, popularity, releaseYear, durationMs }) => ({
        id,
        name,
        artist,
        artistId,
        popularity,
        releaseYear,
        durationMs,
      }))
    },
  }),

  get_related_artists: tool({
    description:
      'Get artists similar to a given Spotify artist ID. Useful for finding artists in the same vibe space as the current track\'s artist. Returns top 10 by popularity.',
    inputSchema: z.object({
      artistId: z.string().describe('Spotify artist ID from search_tracks results'),
    }),
    async execute({ artistId }) {
      try {
        const artists = await getRelatedArtists(artistId)
        const sorted = artists.sort((a, b) => b.popularity - a.popularity).slice(0, 10)
        return sorted.map(({ id, name, genres, popularity }) => ({ id, name, genres, popularity }))
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        return { error: message, fallback: 'Use additional search_tracks calls instead' }
      }
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
    async execute() {
      return { success: true }
    },
  }),
}
