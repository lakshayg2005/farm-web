import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { ApiError } from '@/api/http'
import { day, rupees } from '@/features/customer/land'
import { earnings, inTab, ordersApi, STATUS_TEXT, TABS, type OrderSummary, type TabId } from './orders'

const message = (e: unknown) => (e instanceof ApiError ? e.message : 'Could not reach the server. Try again.')

export function OrdersPage() {
  const [tab, setTab] = useState<TabId>('new')
  const orders = useQuery({ queryKey: ['farmer-orders'], queryFn: ordersApi.list })

  if (orders.isPending) return <p className="mt-8 text-ink-soft">Loading orders…</p>
  if (orders.isError)
    return (
      <p role="alert" className="mt-8 font-semibold text-red-700">
        Could not load your orders. Refresh to try again.
      </p>
    )
  const all = orders.data.items
  const money = earnings(all)
  const shown = all.filter((o) => inTab(o, tab))
  return (
    <div className="mt-8 max-w-3xl space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card p-5">
          <p className="text-sm text-ink-soft">Earned (delivered orders)</p>
          <p className="mt-1 font-display text-4xl">{rupees(money.earned)}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-ink-soft">On the way to you (paid, not delivered)</p>
          <p className="mt-1 font-display text-4xl">{rupees(money.pending)}</p>
        </div>
      </div>

      <div role="tablist" aria-label="Order status" className="flex flex-wrap gap-2">
        {TABS.map((t) => {
          const count = all.filter((o) => inTab(o, t.id)).length
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className="rounded-full border border-line bg-white px-4 py-1.5 font-semibold aria-selected:border-indigo aria-selected:bg-indigo aria-selected:text-white"
            >
              {t.label} ({count})
            </button>
          )
        })}
      </div>

      {shown.length === 0 ? (
        <p className="text-ink-soft">No orders here.</p>
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
          <p className="text-sm text-ink-soft">
            {STATUS_TEXT[order.status]} · placed {day(order.createdAt)}
          </p>
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
              className="rounded-full bg-indigo px-5 py-2 font-semibold text-white shadow-sm transition-colors hover:bg-forest disabled:opacity-60"
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
              className="rounded-lg border border-line px-4 py-2 font-semibold"
            >
              Cancel
            </button>
          )}
          <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="rounded-lg border border-line px-4 py-2 font-semibold">
            {open ? 'Hide details' : 'Details'}
          </button>
        </div>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm font-semibold text-red-700">
          {error}
        </p>
      )}
      {open &&
        (detail.isPending ? (
          <p className="mt-3 text-ink-soft">Loading…</p>
        ) : detail.isError ? (
          <p role="alert" className="mt-3 font-semibold text-red-700">
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
