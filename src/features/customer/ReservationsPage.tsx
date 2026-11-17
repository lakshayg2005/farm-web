import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { ApiError } from '@/api/http'
import { day, landApi, rupees, type CropUpdate, type Reservation } from './land'

const STATUS_TEXT: Record<string, { label: string; tone: string }> = {
  PENDING: { label: 'Waiting for the farmer', tone: 'bg-amber-100' },
  ACCEPTED: { label: 'Accepted: deposit due', tone: 'bg-sky-100' },
  ACTIVE: { label: 'Growing', tone: 'bg-green-100' },
  HARVEST_READY: { label: 'Harvest ready', tone: 'bg-green-200' },
  FULFILLING: { label: 'Harvest on its way', tone: 'bg-green-200' },
  REJECTED: { label: 'Declined', tone: 'bg-neutral-200' },
  CANCELLED: { label: 'Cancelled', tone: 'bg-neutral-200' },
  EXPIRED: { label: 'Expired', tone: 'bg-neutral-200' },
}
const STAGE_TEXT = { SOWN: 'Sown', GROWING: 'Growing', FLOWERING: 'Flowering' } as const
const FOLLOWED = ['ACTIVE', 'HARVEST_READY', 'FULFILLING']

const message = (e: unknown) => (e instanceof ApiError ? e.message : 'Could not reach the server. Try again.')

export function ReservationsPage() {
  const list = useQuery({ queryKey: ['reservations'], queryFn: landApi.myReservations })
  const crops = useQuery({ queryKey: ['crops'], queryFn: landApi.crops, staleTime: 3_600_000 })
  const names = new Map((crops.data ?? []).map((c) => [c.id, c.name]))

  if (list.isPending) return <p className="mt-8 text-ink-soft">Loading your reservations…</p>
  if (list.isError)
    return (
      <p role="alert" className="mt-8 font-semibold text-red-700">
        Could not load your reservations. Refresh to try again.
      </p>
    )
  if (list.data.length === 0)
    return (
      <p className="mt-8 text-ink-soft">
        No reservations yet.{' '}
        <Link to="/customer/plots" className="font-semibold text-indigo underline">
          Find a plot
        </Link>
      </p>
    )
  return (
    <ul className="mt-8 space-y-4">
      {list.data.map((r) => (
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
  const status = STATUS_TEXT[r.status] ?? { label: r.status, tone: 'bg-neutral-200' }

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
    <article className="rounded-xl border border-line bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h2 className="font-display text-xl">
          {cropName}, {r.expectedQtyKg} kg
        </h2>
        <span className={`rounded-full px-3 py-0.5 text-sm font-semibold ${status.tone}`}>{status.label}</span>
      </div>
      <p className="mt-1 text-sm text-ink-soft">
        {r.total !== null && <>Estimated total {rupees(r.total)}. </>}
        {r.status === 'PENDING' && <>The farmer can answer until {day(r.expiresAt)}.</>}
      </p>

      {r.status === 'ACCEPTED' && r.deposit !== null && (
        <div className="mt-4">
          <button type="button" disabled={pay.isPending} onClick={() => pay.mutate()} className="rounded-lg bg-indigo px-4 py-2 font-semibold text-white disabled:opacity-60">
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
      {r.status === 'HARVEST_READY' && <HarvestChoice reservationId={r.id} onDone={refresh} />}
      {r.status === 'FULFILLING' && <p className="mt-4">Your harvest order is in progress. Track it under your orders.</p>}
      {error && (
        <p role="alert" className="mt-3 font-semibold text-red-700">
          {error}
        </p>
      )}
    </article>
  )
}

function Timeline({ reservationId }: { reservationId: string }) {
  const updates = useQuery({ queryKey: ['crop-updates', reservationId], queryFn: () => landApi.updates(reservationId) })
  if (updates.isPending) return <p className="mt-4 text-ink-soft">Loading crop updates…</p>
  if (updates.isError) return <p className="mt-4 text-red-700">Could not load crop updates.</p>
  if (updates.data.length === 0) return <p className="mt-4 text-ink-soft">No updates from the farmer yet. They will appear here.</p>
  return (
    <ol aria-label="Crop updates" className="mt-4 space-y-3 border-l-2 border-line pl-4">
      {updates.data.map((u: CropUpdate) => (
        <li key={u.id}>
          <p className="font-semibold">
            {STAGE_TEXT[u.stage]} <span className="font-normal text-ink-soft">· {day(u.createdAt)}</span>
          </p>
          {u.note && <p>{u.note}</p>}
          {u.mediaIds.length > 0 && <p className="text-sm text-ink-soft">{u.mediaIds.length} photo(s) attached</p>}
        </li>
      ))}
    </ol>
  )
}

function HarvestChoice({ reservationId, onDone }: { reservationId: string; onDone: () => void }) {
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

  const input = 'mt-1 w-full rounded-lg border border-line px-3 py-2'
  return (
    <form onSubmit={onSubmit} noValidate className="mt-5 space-y-3 rounded-lg bg-paper p-4">
      <fieldset>
        <legend className="font-semibold">Your harvest is ready. What should happen to it?</legend>
        <label className="mt-2 flex items-start gap-3">
          <input type="radio" name={`opt-${reservationId}`} checked={option === 'DELIVERY'} onChange={() => setOption('DELIVERY')} className="mt-1.5" />
          <span>
            <span className="block font-semibold">Deliver it to me</span>
            <span className="text-sm text-ink-soft">Pooled delivery; the balance is paid when it arrives.</span>
          </span>
        </label>
        <label className="mt-2 flex items-start gap-3">
          <input type="radio" name={`opt-${reservationId}`} checked={option === 'BUYBACK'} onChange={() => setOption('BUYBACK')} className="mt-1.5" />
          <span>
            <span className="block font-semibold">Let the farmer buy it back</span>
            <span className="text-sm text-ink-soft">The farmer buys the harvest and you are credited.</span>
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
          <button type="button" onClick={useMyLocation} className="text-left font-semibold text-indigo underline sm:col-span-2">
            Use my location
          </button>
        </div>
      )}
      {error && (
        <p role="alert" className="font-semibold text-red-700">
          {error}
        </p>
      )}
      <button type="submit" disabled={choose.isPending} className="rounded-lg bg-indigo px-4 py-2 font-semibold text-white disabled:opacity-60">
        {choose.isPending ? 'Saving…' : 'Confirm my choice'}
      </button>
    </form>
  )
}
