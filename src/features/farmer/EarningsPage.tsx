import { useQuery } from '@tanstack/react-query'
import { ErrorState, Figure, ListSkeleton } from '@/components/ui'
import { day, rupees } from '@/features/customer/land'
import { useI18n } from '@/i18n/i18n'
import { earnings, ordersApi } from './orders'

/** Month label for grouping, e.g. "November 2026". */
const month = (iso: string, lang = 'en') => new Date(iso).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', { month: 'long', year: 'numeric' })

/** What has been paid to the farmer (payouts endpoint) and what is still on its way (from the orders). */
export function EarningsPage() {
  const { t, lang } = useI18n()
  const payouts = useQuery({ queryKey: ['farmer-payouts'], queryFn: ordersApi.payouts })
  const orders = useQuery({ queryKey: ['farmer-orders'], queryFn: ordersApi.list })

  if (payouts.isPending) return <ListSkeleton label="Loading earnings" />
  if (payouts.isError) return <ErrorState title="Could not load your earnings" onRetry={() => void payouts.refetch()} />

  const rows = [...payouts.data.items].sort((a, b) => b.paidAt.localeCompare(a.paidAt))
  const thisMonth = rows.filter((p) => month(p.paidAt, lang) === month(new Date().toISOString(), lang)).reduce((sum, p) => sum + p.amount, 0)
  const groups = new Map<string, typeof rows>()
  for (const p of rows) groups.set(month(p.paidAt, lang), [...(groups.get(month(p.paidAt, lang)) ?? []), p])

  return (
    <div className="mt-8 max-w-4xl space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Figure label="Paid out, all time" value={rupees(payouts.data.total)} hint={`${rows.length} ${rows.length === 1 ? t('order') : t('orders')}`} />
        <Figure label="Paid out this month" value={rupees(Math.round(thisMonth * 100) / 100)} />
        <Figure
          label="On the way to you"
          value={orders.data ? rupees(earnings(orders.data.items).pending) : '…'}
          hint={t('Paid by the customer, not yet delivered')}
        />
      </div>

      {rows.length === 0 ? (
        <p className="card p-5 text-ink-soft">
          {t('No payouts yet. A payout is made for each order once it is delivered and the quality check has passed.')}
        </p>
      ) : (
        [...groups.entries()].map(([name, list]) => (
          <section key={name} aria-label={name}>
            <h2 className="mb-2 flex items-baseline justify-between font-bold">
              {name}
              <span className="text-sm font-semibold text-ink-soft tabular-nums">{rupees(list.reduce((sum, p) => sum + p.amount, 0))}</span>
            </h2>
            <div className="card overflow-x-auto">
              <table className="w-full min-w-80 text-left">
                <thead className="bg-paper text-sm text-ink-soft">
                  <tr>
                    <th scope="col" className="px-4 py-2 font-semibold">{t('Paid on')}</th>
                    <th scope="col" className="px-4 py-2 font-semibold">{t('Order')}</th>
                    <th scope="col" className="px-4 py-2 text-right font-semibold">{t('Amount')}</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((p) => (
                    <tr key={p.orderId} className="border-t border-line">
                      <td className="px-4 py-3 whitespace-nowrap">{day(p.paidAt)}</td>
                      <td className="px-4 py-3 text-ink-soft">{p.orderId.slice(0, 8)}</td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums">{rupees(p.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))
      )}
    </div>
  )
}
