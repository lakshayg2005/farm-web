import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/http'
import type { Media } from '@/api/media'

/** The first ready photo of a listing, served from object storage (MinIO) through the media service. */
export function useProducePhoto(listingId: string, mediaIds: string[] | undefined) {
  const enabled = !!mediaIds?.length
  const photos = useQuery({
    queryKey: ['media', 'LISTING', listingId, 'public'],
    queryFn: () =>
      api<{ items: Media[] }>(`/media/owners/LISTING/${listingId}?limit=1`, { anonymous: true }).then((r) => r.items),
    enabled,
    staleTime: 5 * 60_000,
    retry: false,
  })
  const first = photos.data?.[0]
  return { url: first?.url ?? null, thumbUrl: first?.thumbUrl ?? first?.url ?? null }
}
