import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { Rating, StatusChip } from '@/components/ui'
import { useI18n } from '@/i18n/i18n'
import { cartStore, formatKm, freshness, rupees, stepOf, useCart, type Produce } from './shop'
import { ProducePhoto } from './ProducePhoto'

/** Everything about one listing, with a quantity and "Add to cart". A native dialog gives focus trapping and Esc for free. */
export function ProduceDialog({ item, cartPath, onClose }: { item: Produce; cartPath: string; onClose: () => void }) {
  const { t } = useI18n()
  const ref = useRef<HTMLDialogElement>(null)
  const cart = useCart()
  const step = stepOf(item.unit)
  const inCart = cart.find((l) => l.listingId === item.id)
  const [qty, setQty] = useState(step >= 1 ? 1 : 1)
  const fresh = freshness(item.harvestDate)
  const room = item.qtyAvailable - (inCart?.qty ?? 0)

  useEffect(() => {
    const d = ref.current
    if (d && !d.open) d.showModal()
  }, [])

  const clamp = (n: number) => Math.min(Math.max(step, Math.round(n / step) * step), Math.max(step, room))
  const added = inCart && qty > 0

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && ref.current?.close()}
      aria-label={item.cropName}
      className="m-auto w-[min(42rem,calc(100vw-1.5rem))] max-w-none rounded-2xl border border-line bg-surface-card p-0 text-ink backdrop:bg-ink/50"
    >
      <div className="max-h-[90dvh] overflow-y-auto">
        <div className="relative aspect-[16/9] w-full bg-paper-deep sm:aspect-[2/1]">
          <ProducePhoto listingId={item.id} big alt={item.cropName} />
          <button type="button" onClick={() => ref.current?.close()} aria-label={t('Close')} className="absolute top-3 right-3 grid size-11 place-items-center rounded-full bg-surface-card/90 text-xl text-ink shadow">
            ×
          </button>
        </div>
        <div className="space-y-4 p-5 sm:p-6">
          <div>
            <h2 className="font-display text-3xl leading-tight">
              {item.cropName}
              {item.variety && <span className="text-ink-soft">, {item.variety}</span>}
            </h2>
            <p className="mt-1 text-2xl font-bold tabular-nums">
              {rupees(item.pricePerUnit)} <span className="text-base font-medium text-ink-soft">{t('per {unit}', { unit: item.unit })}</span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusChip tone={fresh.tone}>{t(fresh.days > 1 ? 'Harvested {n} days ago' : fresh.label, { n: fresh.days })}</StatusChip>
            {item.isOrganic && <StatusChip tone="good">{t('Organic')}</StatusChip>}
            <StatusChip tone={item.qtyAvailable <= 10 ? 'warn' : 'neutral'}>{t('{n} {unit} in stock', { n: item.qtyAvailable, unit: item.unit })}</StatusChip>
          </div>
          {item.description && <p className="text-ink-soft">{item.description}</p>}
          <div className="rounded-lg bg-paper p-3.5">
            <p className="font-semibold">
              <Link to={`/farm/${item.farmId}`} className="underline decoration-line-strong underline-offset-2 hover:text-primary">
                {item.farmName}
              </Link>
            </p>
            <p className="text-sm text-ink-soft">
              {[item.village, item.district].filter(Boolean).join(', ')}
              {item.distanceM !== undefined && ` · ${t('{d} from you', { d: formatKm(item.distanceM) })}`}
            </p>
            <div className="mt-1">
              <Rating value={item.farmRating} count={item.farmRatingCount} />
            </div>
          </div>

          {room <= 0 ? (
            <p className="font-semibold text-ink-soft">{t('All the stock is already in your cart.')}</p>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center rounded-lg border-[1.5px] border-line-strong" role="group" aria-label={t('Quantity')}>
                <button type="button" className="grid size-11 place-items-center text-xl" onClick={() => setQty(clamp(qty - step))} aria-label={t('Less')}>
                  −
                </button>
                <input
                  type="number"
                  inputMode="decimal"
                  aria-label={t('Quantity in {unit}', { unit: item.unit })}
                  min={step}
                  max={room}
                  step={step}
                  value={qty}
                  onChange={(e) => setQty(Number(e.target.value))}
                  onBlur={() => setQty(clamp(qty || step))}
                  className="h-11 w-16 border-x border-line text-center font-semibold tabular-nums"
                />
                <button type="button" className="grid size-11 place-items-center text-xl" onClick={() => setQty(clamp(qty + step))} aria-label={t('More')}>
                  +
                </button>
              </div>
              <span className="text-ink-soft">{item.unit}</span>
              <button
                type="button"
                className="btn-primary flex-1 sm:flex-none"
                onClick={() => {
                  cartStore.add(item, clamp(qty))
                }}
              >
                {t('Add to cart')} · {rupees(clamp(qty) * item.pricePerUnit)}
              </button>
            </div>
          )}
          {added && (
            <p role="status" className="flex flex-wrap items-center gap-x-3 font-semibold text-primary">
              {t('{n} {unit} in your cart.', { n: inCart.qty, unit: item.unit })}
              <Link to={cartPath} className="underline">
                {t('Go to cart')}
              </Link>
            </p>
          )}
        </div>
      </div>
    </dialog>
  )
}
