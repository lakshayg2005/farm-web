import { useQuery } from '@tanstack/react-query'
import { isProcessing, mediaApi, photoBadge, type Media, type OwnerType } from '@/api/media'

const BADGE_TONE = {
  verified: 'bg-leaf text-white',
  unverified: 'bg-amber-900/50 text-amber-300 text-ink',
  checking: 'bg-black/80 text-white',
  failed: 'bg-red-950/40 text-red-300 text-red-400',
} as const

/** The photos attached to a listing, reservation, ...; each shows whether its location was verified. */
export function OwnerPhotos({
  ownerType,
  ownerId,
  only,
  onRemove,
  size = 'md',
}: {
  ownerType: OwnerType
  ownerId: string
  /** Show only these media ids (e.g. the photos a listing currently uses), in this order */
  only?: string[]
  onRemove?: (mediaId: string) => void
  size?: 'sm' | 'md'
}) {
  const photos = useQuery({
    queryKey: ['media', ownerType, ownerId],
    queryFn: () => mediaApi.forOwner(ownerType, ownerId),
    // Thumbnails and the location check finish a few seconds after upload.
    refetchInterval: (q) => (q.state.data?.some(isProcessing) ? 3000 : false),
  })
  if (only && only.length === 0) return null
  if (photos.isPending) return <p className="text-sm text-ink-soft">Loading photos…</p>
  if (photos.isError) return <p className="text-sm text-ink-soft">Photos could not be loaded.</p>

  const byId = new Map(photos.data.map((m) => [m.id, m]))
  const list: Media[] = only ? only.flatMap((id) => byId.get(id) ?? []) : photos.data.filter((m) => m.status !== 'DELETED')
  if (list.length === 0) return null

  const box = size === 'sm' ? 'size-[4.5rem]' : 'size-24 sm:size-28'
  return (
    <ul className="flex flex-wrap gap-2" aria-label="Photos">
      {list.map((m) => {
        const badge = photoBadge(m)
        return (
          <li key={m.id} className={`relative ${box} shrink-0 overflow-hidden rounded-lg bg-paper-deep`}>
            {m.thumbUrl ?? m.url ? (
              <img src={m.thumbUrl ?? m.url ?? ''} alt="" loading="lazy" className="size-full object-cover" />
            ) : (
              <span className="block size-full animate-pulse bg-paper-deep motion-reduce:animate-none" />
            )}
            <span
              title={badge.detail}
              className={`absolute bottom-1 left-1 rounded-full px-1.5 py-px text-[0.7rem] font-semibold leading-tight ${BADGE_TONE[badge.kind]}`}
            >
              {badge.label}
              <span className="sr-only">: {badge.detail}</span>
            </span>
            {onRemove && (
              <button
                type="button"
                onClick={() => onRemove(m.id)}
                aria-label="Remove photo"
                className="absolute top-1 right-1 grid size-6 place-items-center rounded-full bg-ink/75 text-sm leading-none text-white hover:bg-ink"
              >
                ×
              </button>
            )}
          </li>
        )
      })}
    </ul>
  )
}
