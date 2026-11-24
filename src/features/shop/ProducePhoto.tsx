import { useQuery } from '@tanstack/react-query'
import { mediaApi, photoBadge } from '@/api/media'

/** The first ready photo of a listing, or the crop's initial on a plain tile. The big one says whether it was taken at the farm. */
export function ProducePhoto({ listingId, big = false, alt = '' }: { listingId: string; big?: boolean; alt?: string }) {
  const photos = useQuery({
    queryKey: ['media', 'LISTING', listingId],
    queryFn: () => mediaApi.forOwner('LISTING', listingId),
    staleTime: 300_000,
    retry: false,
  })
  const ready = (photos.data ?? []).filter((m) => m.status === 'READY')
  const cover = ready[0]
  const first = cover ? (big ? (cover.url ?? cover.thumbUrl) : (cover.thumbUrl ?? cover.url)) : null
  if (first && cover && big) {
    const badge = photoBadge(cover)
    return (
      <>
        <img src={first} alt={alt} loading="lazy" className="size-full object-cover" />
        <span
          title={badge.detail}
          className={`absolute bottom-3 left-3 rounded-full px-2.5 py-1 text-xs font-semibold shadow ${badge.kind === 'verified' ? 'bg-primary text-on-primary' : 'bg-danger text-white'}`}
        >
          {badge.kind === 'verified' ? 'Verified farm photo' : 'Unverified photo'}
          <span className="sr-only">: {badge.detail}</span>
        </span>
      </>
    )
  }
  return first ? (
    <img src={first} alt={alt} loading="lazy" className="size-full object-cover" />
  ) : (
    <span aria-hidden="true" className="grid size-full place-items-center bg-paper-deep font-serif text-[2em] text-ink-soft/60">
      {photos.isPending ? '' : alt.charAt(0)}
    </span>
  )
}
