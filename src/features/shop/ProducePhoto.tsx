import { useQuery } from '@tanstack/react-query'
import { mediaApi } from '@/api/media'

/** The first ready photo of a listing, or the crop's initial on a plain tile. */
export function ProducePhoto({ listingId, big = false, alt = '' }: { listingId: string; big?: boolean; alt?: string }) {
  const photos = useQuery({
    queryKey: ['media', 'LISTING', listingId],
    queryFn: () => mediaApi.forOwner('LISTING', listingId),
    staleTime: 300_000,
    retry: false,
  })
  const urls = (photos.data ?? []).filter((m) => m.status === 'READY').map((m) => (big ? (m.url ?? m.thumbUrl) : (m.thumbUrl ?? m.url)))
  const first = urls[0]
  return first ? (
    <img src={first} alt={alt} loading="lazy" className="size-full object-cover" />
  ) : (
    <span aria-hidden="true" className="grid size-full place-items-center bg-paper-deep font-serif text-[2em] text-ink-soft/60">
      {photos.isPending ? '' : alt.charAt(0)}
    </span>
  )
}
