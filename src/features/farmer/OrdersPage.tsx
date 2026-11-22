import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { ApiError } from '@/api/http'
import { day, rupees } from '@/features/customer/land'
import { ErrorState, Figure, ListSkeleton, StatusRail } from '@/components/ui'
import { earnings, inTab, ordersApi, STAGES, stageOf, STATUS_TEXT, TABS, type OrderSummary, type TabId } from './orders'

const message = (e: unknown) => (e instanceof ApiError ? e.message : 'Could not reach the server. Try again.')

export function OrdersPage() {
  const [tab, setTab] = useState<TabId>('new')
  const orders = useQuery({ queryKey: ['farmer-orders'], queryFn: ordersApi.list })
  const payouts = useQuery({ queryKey: ['farmer-payouts'], queryFn: ordersApi.payouts })

  if (orders.isPending) return <ListSkeleton label="Loading orders" />
  if (orders.isError)
    return <ErrorState title="Could not load your orders" body="Check your connection and try again." onRetry={() => void orders.refetch()} />
  const all = orders.data.items
  const money = earnings(all)
  const shown = all.filter((o) => inTab(o, tab))
  return (
    <div className="mt-8 max-w-4xl space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Figure
          label="Paid out to you"
          value={payouts.isPending ? '…' : payouts.isError ? 'Unavailable' : rupees(payouts.data.total)}
          hint={payouts.isError ? 'Could not load payouts. Refresh to try again.' : undefined}
        />
        <Figure label="On the way to you" value={rupees(money.pending)} hint="Paid by the customer, not yet delivered" />
        <Figure label="To pack now" value={String(all.filter((o) => inTab(o, 'new')).length)} hint="Orders waiting for you" />
      </div>

      {payouts.data && payouts.data.items.length > 0 && (
        <section aria-label="Recent payouts" className="card p-4 sm:p-5">
          <h2 className="font-bold">Recent payouts</h2>
          <ul className="mt-2 divide-y divide-line">
            {payouts.data.items.slice(0, 5).map((p) => (
              <li key={p.orderId} className="flex items-center justify-between py-2">
                <span className="text-ink-soft">
                  Order {p.orderId.slice(0, 8)}, {day(p.paidAt)}
                </span>
                <span className="font-semibold">{rupees(p.amount)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div role="tablist" aria-label="Order status" className="inline-flex max-w-full flex-wrap gap-1 rounded-lg bg-paper-deep p-[3px]">
        {TABS.map((t) => {
          const count = all.filter((o) => inTab(o, t.id)).length
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className="min-h-10 rounded-md px-4 py-1.5 text-[0.95rem] font-semibold aria-selected:bg-white aria-selected:shadow-[0_1px_2px_rgba(23,26,29,.18)]"
            >
              {t.label} ({count})
            </button>
          )
        })}
      </div>

      {shown.length === 0 ? (
        <p className="card p-5 text-ink-soft">Nothing in this tab. New orders appear under “To pack” as soon as a customer pays.</p>
      ) : (
        <ul className="space-y-3">
          {shown.map((o) => (
            <li key={o.id}>
              <OrderRow order={o} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function OrderRow({ order }: { order: OrderSummary }) {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string>()
  const detail = useQuery({ queryKey: ['farmer-order', order.id], queryFn: () => ordersApi.get(order.id), enabled: open })
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['farmer-orders'] })
    void queryClient.invalidateQueries({ queryKey: ['farmer-order', order.id] })
  }
  const pack = useMutation({ mutationFn: () => ordersApi.pack(order.id), onSuccess: refresh, onError: (e) => setError(message(e)) })
  const cancel = useMutation({ mutationFn: () => ordersApi.cancel(order.id), onSuccess: refresh, onError: (e) => setError(message(e)) })
  const cancellable = ['PLACED', 'CONFIRMED', 'PACKED', 'QC_PASSED', 'READY_FOR_DISPATCH'].includes(order.status)

  return (
    <div className="card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-semibold">
            {order.orderType === 'HARVEST' ? 'Harvest order' : 'Order'} · {order.itemCount} {order.itemCount === 1 ? 'item' : 'items'} ·{' '}
            {rupees(order.total)}
          </p>
          <p className="text-sm text-ink-soft">Placed {day(order.createdAt)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {order.status === 'CONFIRMED' && (
            <button
              type="button"
              disabled={pack.isPending}
              onClick={() => {
                setError(undefined)
                pack.mutate()
              }}
              className="btn-primary"
            >
              {pack.isPending ? 'Marking…' : 'Mark packed'}
            </button>
          )}
          {cancellable && (
            <button
              type="button"
              disabled={cancel.isPending}
              onClick={() => {
                if (window.confirm('Cancel this order? The customer is refunded.')) {
                  setError(undefined)
                  cancel.mutate()
                }
              }}
              className="btn-danger"
            >
              Cancel
            </button>
          )}
          <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="btn-secondary">
            {open ? 'Hide details' : 'Details'}
          </button>
        </div>
      </div>
      <div className="mt-3">
        <StatusRail
          stage={stageOf(order.status)}
          label={order.status === 'CANCELLED' ? 'Cancelled' : `Stage ${stageOf(order.status)} of ${STAGES.length}: ${STAGES[stageOf(order.status) - 1]}`}
        />
        <p className="mt-1.5 text-sm text-ink-soft">{STATUS_TEXT[order.status]}</p>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm font-semibold text-danger">
          {error}
        </p>
      )}
      {open &&
        (detail.isPending ? (
          <p className="mt-3 text-ink-soft">Loading…</p>
        ) : detail.isError ? (
          <p role="alert" className="mt-3 font-semibold text-danger">
            Could not load the order.
          </p>
        ) : (
          <div className="mt-4 grid gap-4 border-t border-line pt-4 sm:grid-cols-2">
            <ul className="space-y-1">
              {detail.data.items.map((item, i) => (
                <li key={i}>
                  {item.name}: {item.qty} {item.unit} × {rupees(item.unitPrice)} = {rupees(item.lineTotal)}
                </li>
              ))}
            </ul>
            <ol className="space-y-1 text-sm text-ink-soft">
              {detail.data.events.map((ev, i) => (
                <li key={i}>
                  {STATUS_TEXT[ev.status]} · {day(ev.occurredAt)}
                  {ev.note ? ` · ${ev.note}` : ''}
                </li>
              ))}
            </ol>
          </div>
        ))}
    </div>
  )
}
