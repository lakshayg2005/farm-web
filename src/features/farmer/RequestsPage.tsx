import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { ApiError } from '@/api/http'
import { AgreementTerms } from '@/features/customer/AgreementTerms'
import { day, landApi, rupees, type Reservation } from '@/features/customer/land'
import {
  AGREEMENT_TEXT,
  farmerLandApi,
  groupOf,
  loadSeasonIndex,
  PAST_TEXT,
  timeLeft,
  windowLeft,
  type SeasonInfo,
} from './reservations'

const message = (e: unknown) => (e instanceof ApiError ? e.message : 'Could not reach the server. Try again.')
const primary = 'rounded-xl bg-indigo px-5 py-2 font-semibold text-white shadow-sm transition-colors hover:bg-forest hover:bg-indigo/90 disabled:opacity-60'
const quiet = 'rounded-xl border border-line bg-white px-4 py-2 font-semibold hover:border-ink-soft disabled:opacity-60'

/** Re-renders every `ms` so countdowns stay current. */
function useNow(ms: number) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms)
    return () => clearInterval(t)
  }, [ms])
  return now
}

export function RequestsPage() {
  const now = useNow(30_000)
  const reservations = useQuery({ queryKey: ['farmer-reservations'], queryFn: farmerLandApi.reservations })
  const seasons = useQuery({ queryKey: ['farmer-season-index'], queryFn: loadSeasonIndex, staleTime: 300_000 })
  const crops = useQuery({ queryKey: ['crops'], queryFn: landApi.crops, staleTime: 3_600_000 })
  const cropName = (id: string) => crops.data?.find((c) => c.id === id)?.name ?? id

  if (reservations.isPending) return <p className="mt-8 text-ink-soft">Loading reservation requests…</p>
  if (reservations.isError)
    return (
      <p role="alert" className="mt-8 font-semibold text-red-700">
        Could not load reservation requests. Refresh to try again.
      </p>
    )

  const all = reservations.data
  if (all.length === 0)
    return (
      <div className="mt-8 max-w-xl rounded-xl border border-dashed border-line bg-white/60 p-6">
        <h2 className="text-lg font-semibold">No reservation requests yet</h2>
        <p className="mt-1 text-ink-soft">
          Customers find your plots on the map when a season is open. Each request waits 48 hours for your answer.
        </p>
        <Link to="/farmer/plots" className="mt-3 inline-block font-semibold text-indigo underline">
          Add a plot and season
        </Link>
      </div>
    )

  const byExpiry = (a: Reservation, b: Reservation) => a.expiresAt.localeCompare(b.expiresAt)
  const waiting = all.filter((r) => groupOf(r, now) === 'waiting').sort(byExpiry)
  const agreements = all.filter((r) => groupOf(r, now) === 'agreement')
  const past = all.filter((r) => groupOf(r, now) === 'past')
  const info = (r: Reservation) => seasons.data?.get(r.plotSeasonId)

  return (
    <div className="mt-8 max-w-3xl space-y-10">
      <section aria-labelledby="waiting-heading">
        <h2 id="waiting-heading" className="font-display text-2xl">
          Waiting for your answer
        </h2>
        {waiting.length === 0 ? (
          <p className="mt-2 text-ink-soft">No requests need an answer right now.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {waiting.map((r) => (
              <li key={r.id}>
                <RequestCard reservation={r} info={info(r)} cropName={cropName(r.cropId)} now={now} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="agreements-heading">
        <h2 id="agreements-heading" className="font-display text-2xl">
          Agreements
        </h2>
        <p className="mt-1 text-ink-soft">Requests you accepted. The customer pays a deposit, then you grow the crop for them.</p>
        {agreements.length === 0 ? (
          <p className="mt-3 text-ink-soft">None yet. Accept a request to start one.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {agreements.map((r) => (
              <li key={r.id}>
                <AgreementCard reservation={r} info={info(r)} cropName={cropName(r.cropId)} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {past.length > 0 && (
        <details className="group">
          <summary className="cursor-pointer font-semibold text-ink-soft hover:text-ink">Past requests ({past.length})</summary>
          <ul className="mt-3 divide-y divide-line card">
            {past.map((r) => {
              const s = info(r)
              return (
                <li key={r.id} className="flex flex-wrap items-baseline justify-between gap-x-4 px-4 py-3">
                  <span>
                    {cropName(r.cropId)}, {r.expectedQtyKg} kg{s && <span className="text-ink-soft"> on {s.plotTitle}</span>}
                  </span>
                  <span className="text-sm text-ink-soft">{PAST_TEXT[r.status] ?? r.status}</span>
                </li>
              )
            })}
          </ul>
        </details>
      )}
    </div>
  )
}

function SeasonLine({ info }: { info: SeasonInfo | undefined }) {
  if (!info) return null
  return (
    <p className="text-ink-soft">
      {info.season} season, {day(info.startDate)} to {day(info.endDate)}
    </p>
  )
}

function RequestCard({
  reservation: r,
  info,
  cropName,
  now,
}: {
  reservation: Reservation
  info: SeasonInfo | undefined
  cropName: string
  now: number
}) {
  const queryClient = useQueryClient()
  const [confirmDecline, setConfirmDecline] = useState(false)
  const [error, setError] = useState<string>()
  const done = (fresh: Reservation) => {
    queryClient.setQueryData<Reservation[]>(['farmer-reservations'], (old) => old?.map((x) => (x.id === fresh.id ? fresh : x)))
  }
  const accept = useMutation({ mutationFn: () => farmerLandApi.accept(r.id), onSuccess: done, onError: (e) => setError(message(e)) })
  const reject = useMutation({ mutationFn: () => farmerLandApi.reject(r.id), onSuccess: done, onError: (e) => setError(message(e)) })
  const left = windowLeft(r.expiresAt, now)
  const urgent = left < 0.125 // under 6 hours
  const busy = accept.isPending || reject.isPending

  return (
    <article className="card p-4 sm:p-5">
      <h3 className="font-display text-xl leading-tight">
        {cropName}, {r.expectedQtyKg} kg
      </h3>
      <p className="mt-0.5 font-semibold">{info ? `${info.plotTitle}, ${info.areaAcres} acres` : 'One of your plots'}</p>
      <SeasonLine info={info} />
      {r.total !== null && <p className="mt-1">Estimated value {rupees(r.total)}</p>}

      <div className="mt-4">
        <p className={`text-sm font-semibold ${urgent ? 'text-red-700' : ''}`}>
          {timeLeft(r.expiresAt, now)} to answer
          <span className="font-normal text-ink-soft">, until {new Date(r.expiresAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</span>
        </p>
        <div aria-hidden="true" className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-paper-deep">
          <div
            className={`h-full origin-left rounded-full transition-transform duration-300 ${urgent ? 'bg-red-600' : 'bg-[var(--role)]'}`}
            style={{ transform: `scaleX(${left})` }}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        {confirmDecline ? (
          <>
            <span>Decline this request? The customer is told and the season opens again.</span>
            <button type="button" disabled={busy} onClick={() => reject.mutate()} className={`${quiet} text-red-700`}>
              {reject.isPending ? 'Declining…' : 'Decline'}
            </button>
            <button type="button" onClick={() => setConfirmDecline(false)} className="underline">
              Keep it
            </button>
          </>
        ) : (
          <>
            <button type="button" disabled={busy} onClick={() => accept.mutate()} className={primary}>
              {accept.isPending ? 'Accepting…' : 'Accept'}
            </button>
            <button type="button" disabled={busy} onClick={() => setConfirmDecline(true)} className={quiet}>
              Decline
            </button>
          </>
        )}
      </div>
      {error && (
        <p role="alert" className="mt-3 font-semibold text-red-700">
          {error}
        </p>
      )}
    </article>
  )
}

function AgreementCard({ reservation: r, info, cropName }: { reservation: Reservation; info: SeasonInfo | undefined; cropName: string }) {
  const status = AGREEMENT_TEXT[r.status] ?? { label: r.status, next: '' }
  return (
    <article className="card p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="font-display text-xl leading-tight">
          {cropName}, {r.expectedQtyKg} kg
        </h3>
        <span className="rounded-full bg-[color-mix(in_oklab,var(--role)_22%,white)] px-3 py-0.5 text-sm font-semibold">{status.label}</span>
      </div>
      <p className="mt-0.5 font-semibold">{info ? `${info.plotTitle}, ${info.areaAcres} acres` : 'One of your plots'}</p>
      <SeasonLine info={info} />
      <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 sm:flex sm:flex-wrap">
        {r.total !== null && (
          <div>
            <dt className="text-sm text-ink-soft">Agreed value</dt>
            <dd className="font-semibold">{rupees(r.total)}</dd>
          </div>
        )}
        {r.deposit !== null && (
          <div>
            <dt className="text-sm text-ink-soft">Deposit</dt>
            <dd className="font-semibold">{rupees(r.deposit)}</dd>
          </div>
        )}
      </dl>
      <p className="mt-3 text-ink-soft">{status.next}</p>
      <AgreementTerms reservationId={r.id} />
      {(r.status === 'ACTIVE' || r.status === 'HARVEST_READY') && (
        <Link to="/farmer/crops" className="mt-2 inline-block font-semibold text-indigo underline">
          Open crop updates
        </Link>
      )}
    </article>
  )
}
