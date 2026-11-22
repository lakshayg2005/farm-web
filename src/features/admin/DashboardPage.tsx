import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import { Figure } from '@/components/ui'
import { adminApi, passRate, todayISO, totalSavedKm } from './admin'

const Tile = Figure

/** Each number comes from the service that owns it; one that is down shows a dash instead of breaking the page. */
export function DashboardPage() {
  const waiting = useQuery({ queryKey: ['farmers', 'waiting'], queryFn: () => adminApi.farmers(false), retry: false })
  const verified = useQuery({ queryKey: ['farmers', 'verified'], queryFn: () => adminApi.farmers(true), retry: false })
  const inspections = useQuery({ queryKey: ['inspections', 'all'], queryFn: adminApi.inspections, retry: false })
  const pools = useQuery({ queryKey: ['pools', todayISO()], queryFn: () => adminApi.pools(todayISO()), retry: false })

  const count = (q: typeof waiting) => (q.data ? String(q.data.items.length) : '–')
  const rate = inspections.data ? passRate(inspections.data) : null
  return (
    <div className="mt-8 grid max-w-4xl gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
      <p className="text-ink-soft sm:col-span-2 lg:col-span-4">
        <Link to="/admin/verification" className="font-semibold text-primary underline">
          Review farmers
        </Link>{' '}
        ·{' '}
        <Link to="/admin/pooling" className="font-semibold text-primary underline">
          Run pooling
        </Link>
      </p>
    </div>
  )
}
