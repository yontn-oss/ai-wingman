import { searchArtist } from '@/lib/spotify'

const PAGE_SIZE = 10

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q')?.trim()
  const offset = Number(searchParams.get('offset') ?? '0')

  if (!q) return Response.json({ artists: [], hasMore: false })

  const artists = await searchArtist(q, offset)
  return Response.json({
    artists,
    hasMore: artists.length === PAGE_SIZE,  // if we got a full page, assume there's more
  })
}
