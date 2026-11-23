import { motion } from 'motion/react'
import { type Delivery, type Freshness, type Produce, cropLook, formatKm, rupees } from './catalog'
import { FreshMeter } from './FreshMeter'
import { useProducePhoto } from './useProducePhoto'

export function ProduceCard({
  item,
  fresh,
  delivery,
  index,
  onOpen,
}: {
  item: Produce
  fresh: Freshness
  delivery: Delivery
  index: number
  onOpen: () => void
}) {
  const look = cropLook(item.cropId)
  const photo = useProducePhoto(item.id, item.mediaIds)
  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index, 12) * 0.03, ease: [0.22, 1, 0.36, 1] }}
    >
      <button
        type="button"
        onClick={onOpen}
        aria-label={`${item.cropName} from ${item.farmName}`}
        className="group flex h-full w-full flex-col overflow-hidden rounded-2xl bg-surface-container text-left shadow-lg transition-all duration-300 hover:-translate-y-1 hover:bg-surface-container-high hover:shadow-2xl"
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-container-high">
          {photo.thumbUrl && (
            <img
              src={photo.thumbUrl}
              alt={`${item.cropName} from ${item.farmName}`}
              loading="lazy"
              className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          )}
          {!photo.thumbUrl && (
            <span aria-hidden className="grid size-full place-items-center text-[4.5rem] transition-transform duration-300 group-hover:scale-110">
              {look.emoji}
            </span>
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-surface-container via-transparent to-black/30" />
          <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5">
            {item.isOrganic && (
              <span className="flex items-center gap-1 rounded-full bg-primary/20 px-2.5 py-1 text-label-sm font-bold tracking-wide text-primary uppercase backdrop-blur-md">
                <span className="material-symbols-outlined text-[14px]">eco</span> Organic
              </span>
            )}
            {item.grade && (
              <span className="rounded-full bg-secondary/20 px-2.5 py-1 text-label-sm font-bold tracking-wide text-secondary uppercase backdrop-blur-md">
                Grade {item.grade}
              </span>
            )}
          </div>
          <span className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-surface-container-lowest/80 px-2.5 py-1 text-label-sm text-on-surface backdrop-blur-md">
            <span className="material-symbols-outlined text-[14px] text-primary">near_me</span> {formatKm(item.distanceM)}
          </span>
        </div>

        <div className="flex flex-1 flex-col justify-between gap-4 p-5">
          <div className="space-y-3">
            <div>
              <h3 className="font-headline-sm text-headline-sm font-semibold tracking-tight text-on-surface">{item.cropName}</h3>
              <p className="truncate text-body-sm text-on-surface-variant">
                {item.variety ? `${item.variety} · ` : ''}
                {item.farmName}, {item.village ?? item.district}
              </p>
            </div>
            <div className="rounded-xl bg-surface-container-low p-3">
              <FreshMeter fresh={fresh} compact />
            </div>
            <p className="flex items-center gap-2 text-body-sm text-on-surface-variant">
              <span className="material-symbols-outlined text-[18px] text-primary">local_shipping</span>
              <span>
                <span className="font-semibold text-on-surface">{delivery.label}</span>
                <span> · {delivery.by.replace('Arrives ', '')}</span>
              </span>
            </p>
          </div>
          <div className="flex items-end justify-between gap-2 border-t border-outline-variant/40 pt-4">
            <div>
              <p>
                <span className="font-headline-sm text-headline-sm font-bold text-secondary">{rupees(item.pricePerUnit)}</span>
                <span className="text-body-sm text-on-surface-variant"> / {item.unit}</span>
              </p>
              <p className="text-label-sm text-outline">
                {item.qtyAvailable} {item.unit} remaining
              </p>
            </div>
            <span className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-label-md font-bold text-on-primary">
              View <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </span>
          </div>
        </div>
      </button>
    </motion.li>
  )
}
