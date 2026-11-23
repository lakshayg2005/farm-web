import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { OwnerPhotos } from '@/components/OwnerPhotos'
import { ListSkeleton, StatusChip, type Tone } from '@/components/ui'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { ApiError } from '@/api/http'
import { day, landApi, rupees, type CropUpdate, type HarvestOrder, type Reservation } from './land'

const STATUS_TEXT: Record<string, { label: string; tone: Tone }> = {
  PENDING: { label: 'Waiting for the farmer', tone: 'warn' },
  ACCEPTED: { label: 'Accepted: deposit due', tone: 'info' },
  ACTIVE: { label: 'Growing', tone: 'good' },
  HARVEST_READY: { label: 'Harvested', tone: 'good' },
  FULFILLING: { label: 'Harvest ready', tone: 'good' },
  COMPLETED: { label: 'Completed', tone: 'good' },
  REJECTED: { label: 'Declined', tone: 'neutral' },
  CANCELLED: { label: 'Cancelled', tone: 'neutral' },
  EXPIRED: { label: 'Expired', tone: 'neutral' },
}
const STAGE_TEXT = { SOWN: 'Sown', GROWING: 'Growing', FLOWERING: 'Flowering' } as const
const FOLLOWED = ['ACTIVE', 'HARVEST_READY', 'FULFILLING', 'COMPLETED']

const message = (e: unknown) => (e instanceof ApiError ? e.message : 'Could not reach the server. Try again.')

export function ReservationsPage() {
  const list = useQuery({ queryKey: ['reservations'], queryFn: landApi.myReservations })
  const crops = useQuery({ queryKey: ['crops'], queryFn: landApi.crops, staleTime: 3_600_000 })
  const names = new Map((crops.data ?? []).map((c) => [c.id, c.name]))

  if (list.isPending) return <ListSkeleton label="Loading your reservations" />
  if (list.isError)
    return (
      <p role="alert" className="mt-8 font-semibold text-danger">
        Could not load your reservations. Refresh to try again.
      </p>
    )
  if (list.data.length === 0)
    return (
      <p className="mt-8 text-ink-soft">
        No reservations yet.{' '}
        <Link to="/customer/plots" className="font-semibold text-primary underline">
          Find a plot
        </Link>
      </p>
    )
  // What needs the customer first: pay a deposit, choose a harvest option, then the rest.
  const order = ['ACCEPTED', 'FULFILLING', 'HARVEST_READY', 'ACTIVE', 'PENDING']
  const rank = (r: Reservation) => (order.includes(r.status) ? order.indexOf(r.status) : order.length)
  const sorted = [...list.data].sort((a, b) => rank(a) - rank(b))
  return (
    <ul className="mt-8 max-w-3xl space-y-4">
      {sorted.map((r) => (
        <li key={r.id}>
          <ReservationCard reservation={r} cropName={names.get(r.cropId) ?? r.cropId} />
        </li>
      ))}
    </ul>
  )
}

function ReservationCard({ reservation: r, cropName }: { reservation: Reservation; cropName: string }) {
  const queryClient = useQueryClient()
  const [error, setError] = useState<string>()
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['reservations'] })
  const status = STATUS_TEXT[r.status] ?? { label: r.status, tone: 'neutral' }
  // Only an accepted reservation has an agreement that names the plot.
  const named = ['ACCEPTED', 'ACTIVE', 'HARVEST_READY', 'FULFILLING', 'COMPLETED'].includes(r.status)
  const agreement = useQuery({ queryKey: ['agreement', r.id], queryFn: () => landApi.agreement(r.id), enabled: named, staleTime: 300_000, retry: false })

  const cancel = useMutation({ mutationFn: () => landApi.cancel(r.id), onSuccess: refresh, onError: (e) => setError(message(e)) })
  const pay = useMutation({
    mutationFn: () => landApi.payDeposit(r.id, r.deposit ?? 0),
    onSuccess: (intent) => {
      if (intent.status === 'FAILED') setError('The payment did not go through. Try again.')
      // Land confirms the reservation when it hears about the payment, which takes a moment.
      else setTimeout(refresh, 1500)
      void refresh()
    },
    onError: (e) => setError(message(e)),
  })

  return (
    <article className="card p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h2 className="font-display text-xl">
          {cropName}, {r.expectedQtyKg} kg
        </h2>
        <StatusChip tone={status.tone}>{status.label}</StatusChip>
      </div>
      {agreement.data && (
        <p className="mt-0.5 font-semibold">
          {agreement.data.plotTitle}
          <span className="font-normal text-ink-soft">
            {' '}· {agreement.data.season}, {day(agreement.data.startDate)} to {day(agreement.data.endDate)}
          </span>
        </p>
      )}
      <p className="mt-1 text-sm text-ink-soft">
        {r.total !== null && <>Estimated total {rupees(r.total)}. </>}
        {r.status === 'PENDING' && <>The farmer can answer until {day(r.expiresAt)}.</>}
      </p>

      {r.status === 'ACCEPTED' && r.deposit !== null && (
        <div className="mt-4">
          <button type="button" disabled={pay.isPending} onClick={() => pay.mutate()} className="btn-primary">
            {pay.isPending ? 'Paying…' : `Pay deposit ${rupees(r.deposit)}`}
          </button>
          <p className="mt-1 text-sm text-ink-soft">Payments are simulated in this project. Pay before {day(r.expiresAt)}.</p>
        </div>
      )}
      {(r.status === 'PENDING' || r.status === 'ACCEPTED') && (
        <button type="button" disabled={cancel.isPending} onClick={() => cancel.mutate()} className="mt-3 text-ink-soft underline">
          Cancel this reservation
        </button>
      )}
      {FOLLOWED.includes(r.status) && <Timeline reservationId={r.id} />}
      {r.status === 'HARVEST_READY' && <p className="mt-4 text-ink-soft">The farmer has harvested. Your harvest order is being prepared…</p>}
      {(r.status === 'FULFILLING' || r.status === 'COMPLETED') && <Harvest reservationId={r.id} onDone={refresh} />}
      {error && (
        <p role="alert" className="mt-3 font-semibold text-danger">
          {error}
        </p>
      )}
    </article>
  )
}

function Timeline({ reservationId }: { reservationId: string }) {
  const updates = useQuery({ queryKey: ['crop-updates', reservationId], queryFn: () => landApi.updates(reservationId) })
  if (updates.isPending) return <p className="mt-4 text-ink-soft">Loading crop updates…</p>
  if (updates.isError) return <p className="mt-4 text-danger">Could not load crop updates.</p>
  if (updates.data.length === 0) return <p className="mt-4 text-ink-soft">No updates from the farmer yet. They will appear here.</p>
  return (
    <ol aria-label="Crop updates" className="mt-4 space-y-3 border-l-2 border-line pl-4">
      {updates.data.map((u: CropUpdate) => (
        <li key={u.id}>
          <p className="font-semibold">
            {STAGE_TEXT[u.stage]} <span className="font-normal text-ink-soft">· {day(u.createdAt)}</span>
          </p>
          {u.note && <p>{u.note}</p>}
          {u.mediaIds.length > 0 && (
            <div className="mt-2">
              <OwnerPhotos ownerType="RESERVATION" ownerId={reservationId} only={u.mediaIds} />
            </div>
          )}
        </li>
      ))}
    </ol>
  )
}

/** The harvest order: the choice while it waits for one, then where it stands. */
function Harvest({ reservationId, onDone }: { reservationId: string; onDone: () => void }) {
  const queryClient = useQueryClient()
  const harvest = useQuery({ queryKey: ['harvest-order', reservationId], queryFn: () => landApi.harvestOrder(reservationId) })
  if (harvest.isPending) return <p className="mt-4 text-ink-soft">Loading your harvest order…</p>
  if (harvest.isError || !harvest.data) return <p className="mt-4 text-ink-soft">Your harvest order is being prepared. Refresh in a moment.</p>
  const h = harvest.data
  const item = h.items[0]
  const summary = item && (
    <p className="mt-4">
      <strong>{item.qty} kg harvested</strong>, worth {rupees(item.qty * item.unitPrice)} at {rupees(item.unitPrice)} a kg.
    </p>
  )
  if (h.harvestOption === null && h.status === 'PLACED')
    return (
      <>
        {summary}
        <HarvestChoice
          reservationId={reservationId}
          order={h}
          onDone={() => {
            void queryClient.invalidateQueries({ queryKey: ['harvest-order', reservationId] })
            onDone()
          }}
        />
      </>
    )
  const done = h.status === 'COMPLETED'
  return (
    <>
      {summary}
      <p className="mt-1">
        {h.harvestOption === 'BUYBACK'
          ? 'You chose buy-back: the farmer sold the harvest and you were credited.'
          : done
            ? 'Your harvest was delivered.'
            : 'Your harvest is on its way.'}{' '}
        <Link to="/customer/orders" className="font-semibold text-primary underline">
          {done ? 'See the order and rate it' : 'Track it under your orders'}
        </Link>
      </p>
    </>
  )
}

function HarvestChoice({ reservationId, order, onDone }: { reservationId: string; order: HarvestOrder; onDone: () => void }) {
  const [option, setOption] = useState<'DELIVERY' | 'BUYBACK'>('DELIVERY')
  const [f, setF] = useState({ line1: '', city: '', pincode: '', phone: '', lat: '', lng: '' })
  const [error, setError] = useState<string>()
  const choose = useMutation({
    mutationFn: () =>
      landApi.chooseHarvest(
        reservationId,
        option,
        option === 'DELIVERY'
          ? {
              line1: f.line1.trim(),
              city: f.city.trim(),
              pincode: f.pincode.trim(),
              ...(f.phone.trim() ? { contactPhone: f.phone.trim() } : {}),
              location: { type: 'Point', coordinates: [Number(f.lng), Number(f.lat)] },
            }
          : undefined,
      ),
    onSuccess: onDone,
    onError: (e) => setError(message(e)),
  })
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value })

  function useMyLocation() {
    navigator.geolocation?.getCurrentPosition(
      (pos) => setF((cur) => ({ ...cur, lat: pos.coords.latitude.toFixed(5), lng: pos.coords.longitude.toFixed(5) })),
      () => setError('Could not get your location. Type the coordinates instead.'),
    )
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(undefined)
    if (option === 'DELIVERY') {
      if (!f.line1.trim() || !f.city.trim()) return setError('Enter the delivery address.')
      if (!/^\d{6}$/.test(f.pincode.trim())) return setError('Enter a 6-digit pincode.')
      if (!f.lat || !f.lng || Number.isNaN(Number(f.lat)) || Number.isNaN(Number(f.lng))) return setError('Set the delivery location on the map or with "Use my location".')
    }
    choose.mutate()
  }

  const input = 'mt-1 w-full input'
  return (
    <form onSubmit={onSubmit} noValidate className="mt-5 space-y-3 rounded-lg bg-paper p-4">
      <fieldset>
        <legend className="font-semibold">Your harvest is ready. What should happen to it?</legend>
        <label className="mt-2 flex items-start gap-3">
          <input type="radio" name={`opt-${reservationId}`} checked={option === 'DELIVERY'} onChange={() => setOption('DELIVERY')} className="mt-1.5" />
          <span>
            <span className="block font-semibold">Deliver it to me</span>
            <span className="text-sm text-ink-soft">Pooled delivery; the balance of {rupees(order.balanceDue)} plus delivery is paid when it arrives.</span>
          </span>
        </label>
        <label className="mt-2 flex items-start gap-3">
          <input type="radio" name={`opt-${reservationId}`} checked={option === 'BUYBACK'} onChange={() => setOption('BUYBACK')} className="mt-1.5" />
          <span>
            <span className="block font-semibold">Let the farmer buy it back</span>
            <span className="text-sm text-ink-soft">
              You pay the balance of {rupees(order.balanceDue)} now; the farmer sells the harvest and credits you {rupees(Math.round(order.total * 90) / 100)} (90%).
            </span>
          </span>
        </label>
      </fieldset>
      {option === 'DELIVERY' && (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className="font-semibold">Address</span>
            <input value={f.line1} onChange={set('line1')} autoComplete="address-line1" className={input} />
          </label>
          <label>
            <span className="font-semibold">City</span>
            <input value={f.city} onChange={set('city')} autoComplete="address-level2" className={input} />
          </label>
          <label>
            <span className="font-semibold">Pincode</span>
            <input value={f.pincode} onChange={set('pincode')} inputMode="numeric" maxLength={6} autoComplete="postal-code" className={input} />
          </label>
          <label>
            <span className="font-semibold">Latitude</span>
            <input value={f.lat} onChange={set('lat')} inputMode="decimal" className={input} />
          </label>
          <label>
            <span className="font-semibold">Longitude</span>
            <input value={f.lng} onChange={set('lng')} inputMode="decimal" className={input} />
          </label>
          <button type="button" onClick={useMyLocation} className="text-left font-semibold text-primary underline sm:col-span-2">
            Use my location
          </button>
        </div>
      )}
      {error && (
        <p role="alert" className="font-semibold text-danger">
          {error}
        </p>
      )}
      <button type="submit" disabled={choose.isPending} className="btn-primary">
        {choose.isPending ? 'Saving…' : 'Confirm my choice'}
      </button>
    </form>
  )
}
