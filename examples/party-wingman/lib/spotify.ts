export interface SpotifyTrack {
  id: string
  name: string
  artistId: string
  artist: string
  popularity: number
  releaseYear: number
  durationMs: number
}

export interface SpotifyArtist {
  id: string
  name: string
  genres: string[]
  popularity: number
}

interface TokenCache {
  token: string
  expiresAt: number
}

let tokenCache: TokenCache | null = null

async function getToken(): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expiresAt) {
    return tokenCache.token
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET must be set')
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })

  if (!response.ok) {
    throw new Error(`Spotify token request failed: ${response.status} ${response.statusText}`)
  }

  const data = (await response.json()) as { access_token: string; expires_in: number }

  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  }

  return tokenCache.token
}

export async function searchTracks(query: string, limit: number): Promise<SpotifyTrack[]> {
  const token = await getToken()
  const params = new URLSearchParams({ q: query, type: 'track', limit: String(limit) })

  const response = await fetch(`https://api.spotify.com/v1/search?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Spotify search failed: ${response.status} ${response.statusText} — ${body}`)
  }

  const data = (await response.json()) as {
    tracks: {
      items: Array<{
        id: string
        name: string
        artists: Array<{ id: string; name: string }>
        popularity: number
        duration_ms: number
        album: { release_date: string }
      }>
    }
  }

  return data.tracks.items.map((item) => ({
    id: item.id,
    name: item.name,
    artistId: item.artists[0]?.id ?? '',
    artist: item.artists[0]?.name ?? 'Unknown',
    popularity: item.popularity,
    releaseYear: parseInt(item.album.release_date.slice(0, 4), 10),
    durationMs: item.duration_ms,
  }))
}

export async function getRelatedArtists(artistId: string): Promise<SpotifyArtist[]> {
  const token = await getToken()

  const response = await fetch(`https://api.spotify.com/v1/artists/${artistId}/related-artists`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!response.ok) {
    throw new Error(`Spotify related-artists failed: ${response.status} ${response.statusText}`)
  }

  const data = (await response.json()) as {
    artists: Array<{
      id: string
      name: string
      genres: string[]
      popularity: number
    }>
  }

  return data.artists.map((a) => ({
    id: a.id,
    name: a.name,
    genres: a.genres,
    popularity: a.popularity,
  }))
}
