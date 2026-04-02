export interface SpotifyTrack {
  id: string
  name: string
  artistId: string      // primary artist ID
  artistIds: string[]   // all artist IDs (includes features/collaborators)
  artist: string
  releaseYear: number
  durationMs: number
}

export interface SpotifyArtist {
  id: string
  name: string
  genres: string[]
  imageUrl?: string
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
    const errorBody = await response.text()
    console.error(`Spotify Token Request Failed (${response.status}):`, errorBody)
    throw new Error(`Spotify token request failed: ${response.status} ${response.statusText}`)
  }

  const data = (await response.json()) as { access_token: string; expires_in: number }

  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  }

  return tokenCache.token
}

export async function searchArtist(name: string, offset = 0): Promise<SpotifyArtist[]> {
  const token = await getToken()
  const params = new URLSearchParams({
    q: `artist:${name}`, type: 'artist', limit: '10', offset: String(offset), market: 'US'
  })

  const response = await fetch(`https://api.spotify.com/v1/search?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!response.ok) {
    const errorBody = await response.text()
    console.error(`Spotify Artist Search Failed (${response.status}):`, errorBody)
    throw new Error(`Spotify artist search failed: ${response.status} ${response.statusText} — ${errorBody}`)
  }

  const data = (await response.json()) as {
    artists: {
      total: number
      items: Array<{
        id: string
        name: string
        genres: string[]
        images: Array<{ url: string }>
      }>
    }
  }

  return data.artists.items.map((a) => ({
    id: a.id,
    name: a.name,
    genres: a.genres,
    imageUrl: a.images?.[0]?.url,
  }))
}

export async function searchTracks(query: string, limit: number, offset = 0): Promise<SpotifyTrack[]> {
  const token = await getToken()
  const params = new URLSearchParams({ q: query, type: 'track', limit: String(limit), offset: String(offset) })

  const response = await fetch(`https://api.spotify.com/v1/search?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!response.ok) {
    const errorBody = await response.text()
    console.error(`Spotify Track Search Failed (${response.status}):`, errorBody, { query, limit })
    throw new Error(`Spotify search failed: ${response.status} ${response.statusText} — ${errorBody}`)
  }

  const data = (await response.json()) as {
    tracks: {
      items: Array<{
        id: string
        name: string
        artists: Array<{ id: string; name: string }>
        duration_ms: number
        album: { release_date: string }
      }>
    }
  }

  return data.tracks.items.map((item) => ({
    id: item.id,
    name: item.name,
    artistId: item.artists[0]?.id ?? '',
    artistIds: item.artists.map(a => a.id),
    artist: item.artists[0]?.name ?? 'Unknown',
    releaseYear: parseInt(item.album.release_date.slice(0, 4), 10),
    durationMs: item.duration_ms,
  }))
}

export async function getArtist(artistId: string): Promise<SpotifyArtist> {
  const token = await getToken()
  const response = await fetch(`https://api.spotify.com/v1/artists/${artistId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Spotify getArtist failed: ${response.status} ${response.statusText} — ${errorBody}`)
  }
  const a = (await response.json()) as { id: string; name: string; genres: string[] }
  return { id: a.id, name: a.name, genres: a.genres }
}

export interface SpotifyAlbum {
  id: string
  name: string
  releaseYear: number
}

export async function getArtistAlbums(artistId: string, limit = 10): Promise<SpotifyAlbum[]> {
  const token = await getToken()
  const params = new URLSearchParams({
    include_groups: 'album,single',
    limit: String(limit),
    offset: '0',
  })
  const response = await fetch(`https://api.spotify.com/v1/artists/${artistId}/albums?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Spotify getArtistAlbums failed: ${response.status} ${response.statusText} — ${errorBody}`)
  }
  const data = (await response.json()) as {
    items: Array<{ id: string; name: string; release_date: string }>
  }
  return data.items.map((a) => ({
    id: a.id,
    name: a.name,
    releaseYear: parseInt(a.release_date.slice(0, 4), 10),
  }))
}

export async function getAlbumTracks(albumId: string): Promise<Array<{ id: string; name: string; durationMs: number }>> {
  const token = await getToken()
  const params = new URLSearchParams({ limit: '50' })
  const response = await fetch(`https://api.spotify.com/v1/albums/${albumId}/tracks?${params}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Spotify getAlbumTracks failed: ${response.status} ${response.statusText} — ${errorBody}`)
  }
  const data = (await response.json()) as {
    items: Array<{ id: string; name: string; duration_ms: number }>
  }
  return data.items.map((t) => ({ id: t.id, name: t.name, durationMs: t.duration_ms }))
}
