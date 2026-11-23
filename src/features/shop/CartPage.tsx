import { useMutation } from '@tanstack/react-query'
import { useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { ApiError } from '@/api/http'
import { EmptyState } from '@/components/EmptyState'
import { useAuth } from '@/features/auth/authContext'
import { useI18n } from '@/i18n/i18n'
import { ProducePhoto } from './ProducePhoto'
import {
  addressPayload,
  cartStore,
  cartTotals,
  customerOrdersApi,
  DELIVERY_FEE_PER_FARM,
  newCheckoutKey,
  PLACES,
  rupees,
  stepOf,
  useCart,
  type Address,
  type AddressForm,
  type Checkout,
} from './shop'

export function CartPage() {
  const { t } = useI18n()
  const { user } = useAuth()
  const lines = useCart()
  const [placed, setPlaced] = useState<Checkout | null>(null)
  const [form, setForm] = useState<AddressForm>(() => {
    const saved = (() => {
      try {
        return JSON.parse(localStorage.getItem('farm.address') ?? 'null') as Partial<AddressForm> | null
      } catch {
        return null
      }
    })()
    const place = (() => {
      try {
        return JSON.parse(localStorage.getItem('farm.place') ?? 'null') as { lat: number; lng: number; name: string } | null
      } catch {
        return null
      }
    })() ?? PLACES[0]!
    return { line1: '', line2: '', city: '', pincode: '', phone: user?.phone ?? '', lat: String(place.lat), lng: String(place.lng), ...saved }
  })
  const [error, setError] = useState('')
  const [locating, setLocating] = useState(false)
  const key = useRef(newCheckoutKey())
  const totals = cartTotals(lines)
  const over = lines.filter((l) => l.qty > l.maxQty)

  const order = useMutation({
    mutationFn: (address: Address) => customerOrdersApi.checkout(lines, address, '', key.current),
    onSuccess: (checkout) => {
      try {
        localStorage.setItem('farm.address', JSON.stringify(form))
      } catch {
        // the address is only a convenience for next time
      }
      cartStore.clear()
      key.current = newCheckoutKey()
      setPlaced(checkout)
    },
    onError: (e) => {
      // A declined payment or a stock problem needs a fresh key to try again; a dropped connection keeps the key so nothing is ordered twice.
      if (e instanceof ApiError) key.current = newCheckoutKey()
      setError(e instanceof ApiError ? e.message : t('Could not reach the server. Your order was not placed twice; try again.'))
    },
  })

  if (placed)
    return (
      <div className="card mt-8 max-w-xl p-6" role="status">
        <h2 className="font-display text-3xl">{placed.paymentStatus === 'FAILED' ? t('Payment did not go through') : t('Order placed')}</h2>
        <p className="mt-2 text-ink-soft">
          {placed.paymentStatus === 'FAILED'
            ? t('Nothing was charged and your cart is empty. Add the items again to retry.')
            : t('The farmer has been told. You can follow every step, and the delivery code, under My orders.')}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link to="/customer/orders" className="btn-primary">
            {t('Track my orders')}
          </Link>
          <Link to="/customer/shop" className="btn-secondary">
            {t('Keep shopping')}
          </Link>
        </div>
      </div>
    )

  if (lines.length === 0)
    return (
      <div className="mt-8 max-w-xl">
        <EmptyState icon="cart" title="Your cart is empty" body="Browse produce from farmers near you and add what you like." />
        <Link to="/customer/shop" className="btn-primary mt-4">
          {t('Browse produce')}
        </Link>
      </div>
    )

  function submit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (over.length > 0) return setError(t('Lower the quantity of the items marked above.'))
    const a = addressPayload(form)
    if (typeof a === 'string') return setError(t(a))
    order.mutate(a)
  }

  function locate() {
    if (!('geolocation' in navigator)) return setError(t('This browser cannot share your location. Pick a nearby town instead.'))
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setLocating(false)
        setForm((f) => ({ ...f, lat: String(p.coords.latitude), lng: String(p.coords.longitude) }))
      },
      () => {
        setLocating(false)
        setError(t('Could not get your location. Pick a nearby town instead.'))
      },
      { timeout: 8000 },
    )
  }

  const set = (patch: Partial<AddressForm>) => setForm((f) => ({ ...f, ...patch }))
  const townValue = PLACES.find((p) => String(p.lat) === form.lat && String(p.lng) === form.lng)?.name ?? ''

  return (
    <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <ul className="space-y-3">
        {lines.map((l) => {
          const step = stepOf(l.unit)
          return (
            <li key={l.listingId} className="card flex gap-3 p-3 sm:gap-4 sm:p-4">
              <span className="block size-20 shrink-0 overflow-hidden rounded-lg bg-paper-deep sm:size-24">
                <ProducePhoto listingId={l.listingId} alt={l.name} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-display text-lg leading-tight">{l.name}</p>
                <p className="text-sm text-ink-soft">
                  {l.farmName} · {rupees(l.unitPrice)} {t('per {unit}', { unit: l.unit })}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                  <div className="inline-flex items-center rounded-lg border-[1.5px] border-line-strong" role="group" aria-label={t('Quantity of {name}', { name: l.name })}>
                    <button type="button" className="grid size-11 place-items-center text-xl" aria-label={t('Less')} onClick={() => cartStore.setQty(l.listingId, Math.max(0, l.qty - step))}>
                      −
                    </button>
                    <span className="min-w-14 text-center font-semibold tabular-nums">
                      {l.qty} {l.unit}
                    </span>
                    <button type="button" className="grid size-11 place-items-center text-xl" aria-label={t('More')} onClick={() => cartStore.setQty(l.listingId, l.qty + step)}>
                      +
                    </button>
                  </div>
                  <span className="font-bold tabular-nums">{rupees(Math.round(l.unitPrice * l.qty * 100) / 100)}</span>
                  <button type="button" onClick={() => cartStore.remove(l.listingId)} className="min-h-11 text-sm text-ink-soft underline hover:text-danger">
                    {t('Remove')}
                  </button>
                </div>
                {l.qty > l.maxQty && (
                  <p role="alert" className="mt-1 text-sm font-semibold text-danger">
                    {t('Only {n} {unit} were in stock when you added this.', { n: l.maxQty, unit: l.unit })}
                  </p>
                )}
              </div>
            </li>
          )
        })}
      </ul>

      <form onSubmit={submit} noValidate className="card space-y-4 p-4 sm:p-5 lg:sticky lg:top-6">
        <h2 className="font-display text-2xl">{t('Delivery address')}</h2>
        <label className="grid gap-1 text-sm font-semibold">
          {t('House number and street')}
          <input value={form.line1} onChange={(e) => set({ line1: e.target.value })} autoComplete="address-line1" className="input font-normal" />
        </label>
        <label className="grid gap-1 text-sm font-semibold">
          {t('Area or landmark (optional)')}
          <input value={form.line2} onChange={(e) => set({ line2: e.target.value })} autoComplete="address-line2" className="input font-normal" />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="grid gap-1 text-sm font-semibold">
            {t('City or town')}
            <input value={form.city} onChange={(e) => set({ city: e.target.value })} autoComplete="address-level2" className="input font-normal" />
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            {t('Pincode')}
            <input value={form.pincode} onChange={(e) => set({ pincode: e.target.value })} inputMode="numeric" maxLength={6} autoComplete="postal-code" className="input font-normal" />
          </label>
        </div>
        <label className="grid gap-1 text-sm font-semibold">
          {t('Phone for the delivery partner')}
          <input value={form.phone} onChange={(e) => set({ phone: e.target.value })} inputMode="tel" autoComplete="tel" className="input font-normal" />
        </label>
        <div className="grid gap-1 text-sm font-semibold">
          {t('Where should it be delivered on the map?')}
          <div className="flex flex-wrap gap-2">
            <select
              aria-label={t('Nearby town')}
              value={townValue}
              onChange={(e) => {
                const p = PLACES.find((x) => x.name === e.target.value)
                if (p) set({ lat: String(p.lat), lng: String(p.lng), city: form.city || p.name })
              }}
              className="input w-auto font-normal"
            >
              <option value="">{townValue === '' ? t('Custom location') : t('Pick a nearby town')}</option>
              {PLACES.map((p) => (
                <option key={p.name}>{p.name}</option>
              ))}
            </select>
            <button type="button" onClick={locate} disabled={locating} className="btn-secondary">
              {locating ? t('Finding you…') : t('Use my location')}
            </button>
          </div>
          <span className="text-xs font-normal text-ink-soft">
            {Number(form.lat).toFixed(4)}, {Number(form.lng).toFixed(4)}
          </span>
        </div>

        <dl className="space-y-1.5 border-t border-line pt-4">
          <div className="flex justify-between">
            <dt className="text-ink-soft">{t('Items')}</dt>
            <dd className="tabular-nums">{rupees(totals.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-soft">
              {t(totals.farms === 1 ? 'Delivery ({n} farm)' : 'Delivery ({n} farms)', { n: totals.farms })}
            </dt>
            <dd className="tabular-nums">{rupees(totals.delivery)}</dd>
          </div>
          <div className="flex justify-between text-lg font-bold">
            <dt>{t('Total')}</dt>
            <dd className="tabular-nums">{rupees(totals.total)}</dd>
          </div>
          <p className="text-xs text-ink-soft">{t('Each farm packs and ships its own order, with a delivery fee of {fee} each. Payments are simulated in this project.', { fee: rupees(DELIVERY_FEE_PER_FARM) })}</p>
        </dl>

        {error && (
          <p role="alert" className="rounded-lg bg-error/15 p-3 text-sm font-semibold text-error">
            {error}
          </p>
        )}
        <button type="submit" disabled={order.isPending} className="btn-primary w-full">
          {order.isPending ? t('Placing your order…') : t('Pay {total} and place order', { total: rupees(totals.total) })}
        </button>
      </form>
    </div>
  )
}
