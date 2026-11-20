import { motion } from 'motion/react'
import { Icon } from '@/components/Icon'
import { type Delivery, type Freshness, type Produce, cropLook, formatKm, rupees } from './catalog'
import { FreshMeter } from './FreshMeter'

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
        className="card group flex h-full w-full flex-col overflow-hidden text-left transition-[transform,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-[var(--shadow-lift)]"
      >
        <div className="relative grid h-40 place-items-center overflow-hidden bg-neutral-100">
          <span
            aria-hidden
            className="text-[4.5rem] drop-shadow-[0_8px_12px_rgb(0_0_0/0.15)] transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6"
          >
            {look.emoji}
          </span>
          <div className="absolute inset-x-3 top-3 flex flex-wrap gap-1.5">
            {item.isOrganic && (
              <span className="glass inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold text-[#1d6b3a]">
                <Icon name="leaf" className="size-3.5" /> Organic
              </span>
            )}
            {item.grade && (
              <span className="glass inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold">
                <Icon name="star" className="size-3.5 text-mustard" /> Grade {item.grade}
              </span>
            )}
          </div>
          <span className="glass absolute right-3 bottom-3 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold">
            <Icon name="pin" className="size-3.5" /> {formatKm(item.distanceM)}
          </span>
        </div>

        <div className="flex flex-1 flex-col gap-3 p-4">
          <div>
            <p className="text-lg leading-tight font-semibold">{item.cropName}</p>
            <p className="truncate text-sm text-ink-soft">
              {item.variety ? `${item.variety} · ` : ''}
              {item.farmName}, {item.village ?? item.district}
            </p>
          </div>
          <FreshMeter fresh={fresh} compact />
          <p className="flex items-center gap-2 rounded-xl bg-paper px-3 py-2 text-sm">
            <Icon name="truck" className="size-4.5 shrink-0 text-indigo" />
            <span>
              <span className="font-semibold">{delivery.label}</span>
              <span className="text-ink-soft"> · {delivery.by.replace('Arrives ', '')}</span>
            </span>
          </p>
          <div className="mt-auto flex items-end justify-between gap-2 pt-1">
            <p>
              <span className="font-display text-2xl">{rupees(item.pricePerUnit)}</span>
              <span className="text-sm text-ink-soft"> / {item.unit}</span>
            </p>
            <p className="text-right text-xs text-ink-soft">
              {item.qtyAvailable} {item.unit} left
            </p>
          </div>
        </div>
      </button>
    </motion.li>
  )
}
