import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { ApiError } from '@/api/http'
import { adminApi, orderedStops, POOL_STATUS, poolSummary, todayISO, type Pool } from './admin'
import { PoolMap } from './PoolMap'

/** The gateway answers 404 for a route the logistics service does not have yet, 502/503 when it is down. */
const isUnavailable = (e: unknown) => e instanceof ApiError && [404, 501, 502, 503].includes(e.status)
const time = (iso: string | null) =>
  iso ? new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }) : null

export function PoolingPage() {
  const queryClient = useQueryClient()
  const [date, setDate] = useState(todayISO())
  const [selected, setSelected] = useState<string | null>(null)
  const pools = useQuery({ queryKey: ['pools', date], queryFn: () => adminApi.pools(date), retry: false })
  const run = useMutation({
    mutationFn: () => adminApi.runPooling(date),
    onSuccess: (data) => {
      queryClient.setQueryData(['pools', date], data)
      setSelected(data[0]?.id ?? null)
    },
  })

  const list = pools.data ?? []
  const error = run.error ?? pools.error
  const summary = poolSummary(list)
  const chosen = list.find((p) => p.id === selected) ?? null

  return (
    <div className="mt-8 space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col text-sm font-semibold">
          Delivery date
          <input
            type="date"
            value={date}
            onChange={(e) => {
              setDate(e.target.value)
              setSelected(null)
              run.reset()
            }}
            className="mt-1 input font-normal"
          />
        </label>
        <button
          type="button"
          onClick={() => run.mutate()}
          disabled={run.isPending || !date}
          className="btn-primary"
        >
          {run.isPending ? 'Running…' : list.length ? 'Run pooling again' : 'Run pooling'}
        </button>
        <p className="basis-full text-sm text-ink-soft">
          Groups orders due on this date whose drop points are within about 3 km into one route per vehicle.
        </p>
      </div>

      {error && (
        <p role="alert" className="font-semibold text-danger">
          {isUnavailable(error)
            ? 'Pooling is not available yet: the logistics service is not running. Try again once it is deployed.'
            : error instanceof ApiError
              ? error.message
              : 'Could not reach the server. Try again.'}
        </p>
      )}

      {pools.isPending ? (
        <p className="text-ink-soft">Loading pools…</p>
      ) : (
        !error && (
          <>
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="Pooling summary">
              <Stat label="Pools" value={String(summary.pools)} />
              <Stat label="Deliveries" value={String(summary.deliveries)} />
              <Stat label="Route distance" value={`${summary.routeKm} km`} />
              <Stat
                label="Distance saved"
                value={`${summary.savedKm} km`}
                note={summary.pools ? `${summary.savedPct}% less than separate trips` : undefined}
                strong
              />
            </dl>
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
              <PoolMap pools={list} selectedId={selected} />
              <div>
                {list.length === 0 ? (
                  <p className="text-ink-soft">No pools for this date yet. Run pooling to group the day’s orders.</p>
                ) : (
                  <ul className="space-y-2" aria-label="Pools">
                    {list.map((pool, i) => (
                      <li key={pool.id}>
                        <button
                          type="button"
                          onClick={() => setSelected(pool.id === selected ? null : pool.id)}
                          aria-pressed={selected === pool.id}
                          className="w-full card px-4 py-3 text-left transition-colors duration-150 hover:border-primary aria-pressed:border-primary aria-pressed:bg-primary/15"
                        >
                          <span className="flex items-baseline justify-between gap-2">
                            <span className="font-semibold">Pool {i + 1}</span>
                            <span className="text-sm text-ink-soft">{POOL_STATUS[pool.status] ?? pool.status}</span>
                          </span>
                          <span className="block text-sm text-ink-soft">
                            {pool.stops.filter((s) => s.kind === 'DROP').length === 1 ? '1 delivery' : `${pool.stops.filter((s) => s.kind === 'DROP').length} deliveries`}, {pool.totalKm} km route,{' '}
                            <span className="font-semibold text-primary">{pool.savedKm} km saved</span>
                          </span>
                        </button>
                        {selected === pool.id && <StopList pool={pool} />}
                      </li>
                    ))}
                  </ul>
                )}
                {list.length > 0 && !chosen && <p className="mt-3 text-sm text-ink-soft">Choose a pool to see its stops in order.</p>}
              </div>
            </div>
          </>
        )
      )}
    </div>
  )
}

function Stat({ label, value, note, strong }: { label: string; value: string; note?: string; strong?: boolean }) {
  return (
    <div className="card px-4 py-3">
      <dt className="text-sm text-ink-soft">{label}</dt>
      <dd className={`text-xl font-bold tabular-nums ${strong ? 'text-primary' : ''}`}>{value}</dd>
      {note && <dd className="text-sm text-ink-soft">{note}</dd>}
    </div>
  )
}

function StopList({ pool }: { pool: Pool }) {
  return (
    <ol className="mt-2 mb-1 space-y-1 border-l-2 border-line pl-4 text-sm" aria-label="Stops in order">
      {orderedStops(pool).map((stop) => (
        <li key={`${stop.orderId}-${stop.kind}-${stop.sequence}`} className="flex items-baseline gap-2">
          <span
            aria-hidden="true"
            className={`inline-block size-2.5 shrink-0 rounded-full ${stop.kind === 'PICKUP' ? 'bg-warn' : 'bg-primary'}`}
          />
          <span>
            <span className="font-semibold">
              {stop.sequence}. {stop.kind === 'PICKUP' ? 'Pick up' : 'Deliver'}
            </span>{' '}
            order {stop.orderId.slice(0, 8)}
            {time(stop.eta) && <span className="text-ink-soft">, around {time(stop.eta)}</span>}
          </span>
        </li>
      ))}
    </ol>
  )
}
