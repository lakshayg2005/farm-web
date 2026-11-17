import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import { adminApi, passRate, todayISO, totalSavedKm } from './admin'

function Tile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-line bg-white p-5">
      <p className="text-sm text-ink-soft">{label}</p>
      <p className="mt-1 font-display text-4xl">{value}</p>
      {hint && <p className="mt-1 text-sm text-ink-soft">{hint}</p>}
    </div>
  )
}

/** Each number comes from the service that owns it; one that is down shows a dash instead of breaking the page. */
export function DashboardPage() {
  const waiting = useQuery({ queryKey: ['farmers', 'waiting'], queryFn: () => adminApi.farmers(false), retry: false })
  const verified = useQuery({ queryKey: ['farmers', 'verified'], queryFn: () => adminApi.farmers(true), retry: false })
  const inspections = useQuery({ queryKey: ['inspections', 'all'], queryFn: adminApi.inspections, retry: false })
  const pools = useQuery({ queryKey: ['pools', todayISO()], queryFn: () => adminApi.pools(todayISO()), retry: false })

  const count = (q: typeof waiting) => (q.data ? String(q.data.items.length) : '–')
  const rate = inspections.data ? passRate(inspections.data) : null
  return (
    <div className="mt-8 grid max-w-3xl gap-4 sm:grid-cols-2">
      <Tile label="Farmers waiting to be verified" value={count(waiting)} />
      <Tile label="Verified farmers" value={count(verified)} />
      <Tile
        label="Inspection pass rate"
        value={rate === null ? '–' : `${rate}%`}
        hint={inspections.data ? `${inspections.data.length} inspections` : undefined}
      />
      <Tile
        label="Kilometres saved today"
        value={pools.data ? `${totalSavedKm(pools.data)} km` : '–'}
        hint={pools.data ? `${pools.data.length} pools` : undefined}
      />
      <p className="text-ink-soft sm:col-span-2">
        <Link to="/admin/verification" className="font-semibold text-indigo underline">
          Review farmers
        </Link>{' '}
        ·{' '}
        <Link to="/admin/pooling" className="font-semibold text-indigo underline">
          Run pooling
        </Link>
      </p>
    </div>
  )
}
