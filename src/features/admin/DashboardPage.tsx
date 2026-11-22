import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import { Figure } from '@/components/ui'
import { rupees } from '@/features/customer/land'
import { adminApi, dailyStats, loadAllOrders, passRate, todayISO, totalSavedKm } from './admin'

/** Each number comes from the service that owns it; one that is down shows a dash instead of breaking the page. */
export function DashboardPage() {
  const waiting = useQuery({ queryKey: ['farmers', 'waiting'], queryFn: () => adminApi.farmers(false), retry: false })
  const verified = useQuery({ queryKey: ['farmers', 'verified'], queryFn: () => adminApi.farmers(true), retry: false })
  const inspections = useQuery({ queryKey: ['inspections', 'all'], queryFn: adminApi.inspections, retry: false })
  const pools = useQuery({ queryKey: ['pools', todayISO()], queryFn: () => adminApi.pools(todayISO()), retry: false })
  const orders = useQuery({ queryKey: ['admin-orders'], queryFn: () => loadAllOrders(), retry: false })

  const count = (q: typeof waiting) => (q.data ? String(q.data.items.length) : '–')
  const rate = inspections.data ? passRate(inspections.data) : null
  const days = orders.data ? dailyStats(orders.data) : null
  const today = days?.at(-1)
  const sales = days?.reduce((t, d) => t + d.sales, 0)
  const placed = days?.reduce((t, d) => t + d.orders, 0)
  const toPack = orders.data?.filter((o) => o.status === 'CONFIRMED').length
  const toGrade = orders.data?.filter((o) => o.status === 'PACKED').length

  return (
    <div className="mt-8 max-w-5xl space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Figure label="Orders today" value={today ? String(today.orders) : '–'} hint={today ? `${rupees(today.sales)} in sales` : undefined} />
        <Figure label="Sales, last 14 days" value={sales === undefined ? '–' : rupees(sales)} hint={placed === undefined ? undefined : `${placed} orders`} />
        <Figure
          label="Inspection pass rate"
          value={rate === null ? '–' : `${rate}%`}
          hint={inspections.data ? `${inspections.data.length} inspections` : undefined}
        />
        <Figure
          label="Kilometres saved today"
          value={pools.data ? `${totalSavedKm(pools.data)} km` : '–'}
          hint={pools.data ? `${pools.data.length} pools` : undefined}
        />
      </div>

      <section aria-labelledby="per-day" className="card p-4 sm:p-5">
        <h2 id="per-day" className="font-bold">
          Orders per day
        </h2>
        {days ? <Bars days={days} /> : <p className="mt-3 text-ink-soft">{orders.isError ? 'Orders could not be loaded.' : 'Loading…'}</p>}
      </section>

      <div className="grid gap-3 sm:grid-cols-3">
        <Figure label="Farmers waiting to be verified" value={count(waiting)} hint={<Link to="/admin/verification" className="font-semibold text-primary underline">Review farmers</Link>} />
        <Figure label="Verified farmers" value={count(verified)} />
        <Figure
          label="Orders needing a step"
          value={toPack === undefined ? '–' : String((toPack ?? 0) + (toGrade ?? 0))}
          hint={
            toPack === undefined ? undefined : (
              <>
                {toPack} to pack, {toGrade} to grade ·{' '}
                <Link to="/admin/orders" className="font-semibold text-primary underline">
                  See orders
                </Link>
              </>
            )
          }
        />
      </div>
    </div>
  )
}

/** A plain bar chart: one bar per day, the number above it, the day below. Values are also in the table for screen readers. */
function Bars({ days }: { days: ReturnType<typeof dailyStats> }) {
  const max = Math.max(1, ...days.map((d) => d.orders))
  return (
    <>
      <div className="mt-4 flex h-40 items-end gap-1.5 sm:gap-2" aria-hidden="true">
        {days.map((d) => (
          <div key={d.date} className="flex h-full min-w-0 flex-1 flex-col justify-end text-center">
            <span className="text-xs font-semibold tabular-nums">{d.orders || ''}</span>
            <span className="block rounded-t bg-primary" style={{ height: `${(d.orders / max) * 100}%`, minHeight: d.orders ? 4 : 2, opacity: d.orders ? 1 : 0.25 }} />
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex gap-1.5 sm:gap-2" aria-hidden="true">
        {days.map((d) => (
          <span key={d.date} className="min-w-0 flex-1 text-center text-[0.7rem] text-ink-soft">
            {new Date(`${d.date}T00:00:00`).getDate()}
          </span>
        ))}
      </div>
      <table className="sr-only">
        <caption>Orders and sales per day, last 14 days</caption>
        <thead>
          <tr>
            <th scope="col">Day</th>
            <th scope="col">Orders</th>
            <th scope="col">Sales</th>
          </tr>
        </thead>
        <tbody>
          {days.map((d) => (
            <tr key={d.date}>
              <th scope="row">{d.date}</th>
              <td>{d.orders}</td>
              <td>{rupees(d.sales)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}
