import { motion } from 'motion/react'
import { useEffect, useRef } from 'react'
import { Link } from 'react-router'
import { Icon, type IconName } from '@/components/Icon'
import { type Delivery, type Freshness, type Produce, cropLook, formatKm, rupees } from './catalog'
import { FreshMeter } from './FreshMeter'

/** Side panel with everything about one listing: freshness, the delivery timeline and the farm. */
export function ProduceDrawer({
  item,
  fresh,
  delivery,
  farmer,
  onClose,
}: {
  item: Produce
  fresh: Freshness
  delivery: Delivery
  farmer?: string
  onClose: () => void
}) {
  const look = cropLook(item.cropId)
  const closeRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const day = (offset: number) => {
    const d = new Date()
    d.setDate(d.getDate() + offset)
    return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
  }
  const harvestIn = Math.max(0, -fresh.ageDays)
  const steps: { icon: IconName; title: string; when: string }[] = [
    {
      icon: 'sprout',
      title: harvestIn ? 'Harvested for you' : 'Harvested',
      when: harvestIn ? day(harvestIn) : fresh.detail,
    },
    { icon: 'box', title: 'Packed by the farmer', when: day(harvestIn) },
    { icon: 'shield', title: 'Quality checked by an inspector', when: day(harvestIn) },
    { icon: 'route', title: 'Pooled into a shared delivery route', when: `${day(harvestIn)}, overnight` },
    { icon: 'truck', title: 'At your door', when: delivery.by.replace('Arrives ', '') },
  ]

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="produce-title">
      <motion.button
        type="button"
        aria-label="Close details"
        tabIndex={-1}
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-forest-deep/40 backdrop-blur-[2px]"
      />
      <motion.aside
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'tween', duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-y-0 right-0 flex w-full max-w-lg flex-col overflow-y-auto bg-paper shadow-2xl"
      >
        <div className="relative grid h-56 shrink-0 place-items-center" style={{ background: look.hue }}>
          <span aria-hidden className="animate-float text-[6.5rem] drop-shadow-[0_12px_16px_rgb(0_0_0/0.18)]">
            {look.emoji}
          </span>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="glass absolute top-4 right-4 grid size-10 place-items-center rounded-full"
          >
            <Icon name="close" className="size-5" />
          </button>
        </div>

        <div className="space-y-6 p-6">
          <div>
            <div className="flex flex-wrap gap-2">
              {item.isOrganic && (
                <span className="inline-flex items-center gap-1 rounded-full bg-leaf/12 px-2.5 py-0.5 text-sm font-semibold text-[#1d6b3a]">
                  <Icon name="leaf" className="size-4" /> Certified organic
                </span>
              )}
              {item.grade && (
                <span className="inline-flex items-center gap-1 rounded-full bg-mustard/15 px-2.5 py-0.5 text-sm font-semibold text-[#8a5c00]">
                  <Icon name="star" className="size-4" /> Grade {item.grade} (inspected)
                </span>
              )}
            </div>
            <h2 id="produce-title" className="mt-3 font-display text-3xl leading-tight">
              {item.cropName}
            </h2>
            {item.variety && <p className="text-ink-soft">Variety: {item.variety}</p>}
            {item.description && <p className="mt-2">{item.description}</p>}
          </div>

          <div className="card grid grid-cols-2 divide-x divide-line">
            <div className="p-4">
              <p className="text-sm text-ink-soft">Price</p>
              <p className="font-display text-2xl">
                {rupees(item.pricePerUnit)}
                <span className="font-sans text-base text-ink-soft"> / {item.unit}</span>
              </p>
            </div>
            <div className="p-4">
              <p className="text-sm text-ink-soft">Available</p>
              <p className="font-display text-2xl">
                {item.qtyAvailable}
                <span className="font-sans text-base text-ink-soft"> {item.unit}</span>
              </p>
            </div>
          </div>

          <section aria-labelledby="fresh-h" className="card p-4">
            <h3 id="fresh-h" className="mb-3 flex items-center gap-2 font-semibold">
              <Icon name="thermometer" className="size-5 text-indigo" /> How fresh is it?
            </h3>
            <FreshMeter fresh={fresh} />
          </section>

          <section aria-labelledby="eta-h" className="card p-4">
            <h3 id="eta-h" className="flex items-center gap-2 font-semibold">
              <Icon name="clock" className="size-5 text-indigo" /> When will it arrive?
            </h3>
            <p className="mt-1">
              <span className="font-display text-xl">{delivery.label}</span>{' '}
              <span className="text-ink-soft">· {delivery.by}</span>
            </p>
            <p className="text-sm text-ink-soft">{delivery.detail}</p>
            <ol className="mt-4 space-y-0">
              {steps.map((s, i) => (
                <li key={s.title} className="relative flex gap-3 pb-4 last:pb-0">
                  {i < steps.length - 1 && <span aria-hidden className="absolute top-8 bottom-0 left-4 w-px bg-line" />}
                  <span className="relative grid size-8 shrink-0 place-items-center rounded-full bg-indigo/10 text-indigo">
                    <Icon name={s.icon} className="size-4" />
                  </span>
                  <div className="pt-1">
                    <p className="leading-tight font-medium">{s.title}</p>
                    <p className="text-sm text-ink-soft">{s.when}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section aria-labelledby="farm-h" className="card flex items-center gap-4 p-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-lime/50 text-2xl" aria-hidden>
              👩‍🌾
            </span>
            <div className="min-w-0">
              <h3 id="farm-h" className="font-semibold">
                {item.farmName}
              </h3>
              <p className="text-sm text-ink-soft">
                {farmer ? `${farmer} · ` : ''}
                {item.village ? `${item.village}, ` : ''}
                {item.district} · {formatKm(item.distanceM)} away
              </p>
              <p className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-indigo">
                <Icon name="shield" className="size-4" /> Verified farmer
              </p>
            </div>
          </section>

          <div className="rounded-2xl bg-forest p-5 text-white">
            <p className="font-semibold">Ready to order?</p>
            <p className="mt-1 text-sm text-white/75">
              Add it to your basket in the Farm customer app: pay once, track the delivery live and confirm it with an OTP.
            </p>
            <Link to="/register" className="btn-primary mt-4 !bg-lime !text-forest-deep hover:!bg-white">
              Create a customer account <Icon name="arrow" className="size-4" />
            </Link>
          </div>
        </div>
      </motion.aside>
    </div>
  )
}
