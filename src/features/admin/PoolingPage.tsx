import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { ApiError } from '@/api/http'
import { adminApi, tomorrowISO, totalSavedKm } from './admin'
import { PoolMap } from './PoolMap'

export function PoolingPage() {
  const queryClient = useQueryClient()
  const [date, setDate] = useState(tomorrowISO())
  const [selected, setSelected] = useState<string | null>(null)
  const pools = useQuery({ queryKey: ['pools', date], queryFn: () => adminApi.pools(date), retry: false })
  const run = useMutation({
    mutationFn: () => adminApi.runPooling(date),
    onSuccess: (data) => queryClient.setQueryData(['pools', date], data),
  })

  const list = pools.data ?? []
  const error = run.error ?? pools.error
  const unavailable = error instanceof ApiError && (error.status === 404 || error.status === 501)
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
            }}
            className="mt-1 rounded-lg border border-line bg-white px-3 py-2 font-normal"
          />
        </label>
        <button
          type="button"
          onClick={() => run.mutate()}
          disabled={run.isPending || !date}
          className="rounded-lg bg-indigo px-4 py-2 font-semibold text-white disabled:opacity-60"
        >
          {run.isPending ? 'Running…' : 'Run pooling'}
        </button>
      </div>

      {error && (
        <p role="alert" className="font-semibold text-red-700">
          {unavailable
            ? 'Pooling is not available yet: the logistics service is not running.'
            : error instanceof ApiError
              ? error.message
              : 'Could not reach the server. Try again.'}
        </p>
      )}

      {pools.isPending ? (
        <p className="text-ink-soft">Loading pools…</p>
      ) : (
        !error && (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
            <PoolMap pools={list} selectedId={selected} />
            <div>
              <p className="text-lg font-semibold" role="status">
                {list.length === 0 ? 'No pools for this date yet.' : `${list.length} pools · ${totalSavedKm(list)} km saved`}
              </p>
              <ul className="mt-3 space-y-2">
                {list.map((pool, i) => (
                  <li key={pool.id}>
                    <button
                      type="button"
                      onClick={() => setSelected(pool.id)}
                      aria-pressed={selected === pool.id}
                      className="w-full rounded-xl border border-line bg-white px-4 py-3 text-left hover:border-indigo aria-pressed:border-indigo"
                    >
                      <span className="font-semibold">Pool {i + 1}</span> · {pool.stops.length} stops
                      <br />
                      <span className="text-sm text-ink-soft">
                        {pool.totalKm} km route · {pool.savedKm} km saved · {pool.status}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )
      )}
    </div>
  )
}
