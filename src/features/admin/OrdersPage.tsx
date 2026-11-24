import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { ApiError } from '@/api/http'
import { ErrorState, ListSkeleton, StatusChip, StatusRail, type Tone } from '@/components/ui'
import { day, rupees } from '@/features/customer/land'
import { ordersApi, STAGES, stageOf, STATUS_TEXT, type OrderStatus, type OrderSummary } from '@/features/farmer/orders'
import { loadAllOrders } from './admin'

const FILTERS: { id: string; label: string; statuses: OrderStatus[] | null }[] = [
  { id: 'all', label: 'All', statuses: null },
  { id: 'stuck', label: 'Needs a step', statuses: ['CONFIRMED', 'PACKED'] },
  { id: 'moving', label: 'On the way', statuses: ['READY_FOR_DISPATCH', 'POOLED', 'IN_TRANSIT'] },
  { id: 'done', label: 'Delivered', statuses: ['DELIVERED', 'COMPLETED'] },
  { id: 'cancelled', label: 'Cancelled', statuses: ['CANCELLED'] },
]

const tone = (s: OrderStatus): Tone =>
  s === 'CANCELLED' ? 'danger' : s === 'DELIVERED' || s === 'COMPLETED' ? 'good' : s === 'CONFIRMED' || s === 'PACKED' ? 'warn' : 'info'

/** The order service lets an admin cancel until the delivery partner collects the order. */
const CANCELLABLE: OrderStatus[] = ['PLACED', 'CONFIRMED', 'PACKED', 'READY_FOR_DISPATCH', 'POOLED']

const message = (e: unknown) => (e instanceof ApiError ? e.message : 'Could not reach the server. Try again.')

/** Every order on the platform, with a way to cancel one (the customer is refunded). */
export function AdminOrdersPage() {
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const orders = useQuery({ queryKey: ['admin-orders'], queryFn: () => loadAllOrders() })

  if (orders.isPending) return <ListSkeleton label="Loading orders" />
  if (orders.isError) return <ErrorState title="Could not load orders" onRetry={() => void orders.refetch()} />

  const wanted = FILTERS.find((f) => f.id === filter)!.statuses
  const q = search.trim().toLowerCase()
  const shown = orders.data.filter((o) => (!wanted || wanted.includes(o.status)) && (!q || o.id.toLowerCase().startsWith(q)))
  return (
    <div className="mt-8 max-w-4xl space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div role="tablist" aria-label="Order status" className="inline-flex max-w-full flex-wrap gap-1 rounded-lg bg-paper-deep p-[3px]">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={filter === f.id}
              onClick={() => setFilter(f.id)}
              className="min-h-10 rounded-md px-3.5 py-1.5 text-[0.95rem] font-semibold aria-selected:bg-surface-card aria-selected:shadow-[0_1px_2px_rgba(23,26,29,.18)]"
            >
              {f.label} ({orders.data.filter((o) => !f.statuses || f.statuses.includes(o.status)).length})
            </button>
          ))}
        </div>
        <label className="sr-only" htmlFor="order-search">
          Find an order by its number
        </label>
        <input id="order-search" type="search" placeholder="Order number" value={search} onChange={(e) => setSearch(e.target.value)} className="input max-w-52" />
      </div>
      {shown.length === 0 ? (
        <p className="card p-5 text-ink-soft">No orders match.</p>
      ) : (
        <ul className="space-y-3">
          {shown.map((o) => (
            <li key={o.id}>
              <Row order={o} />
            </li>
          ))}
        </ul>
      )}
      <p className="text-sm text-ink-soft">Showing the newest {orders.data.length} orders.</p>
    </div>
  )
}

function Row({ order }: { order: OrderSummary }) {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string>()
  const detail = useQuery({ queryKey: ['admin-order', order.id], queryFn: () => ordersApi.get(order.id), enabled: open })
  const cancel = useMutation({
    mutationFn: () => ordersApi.cancel(order.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-orders'] })
      void queryClient.invalidateQueries({ queryKey: ['admin-order', order.id] })
    },
    onError: (e) => setError(message(e)),
  })
  const cancellable = CANCELLABLE.includes(order.status)
  const onARoute = order.status === 'READY_FOR_DISPATCH' || order.status === 'POOLED'
  const stage = stageOf(order.status)

  return (
    <div className="card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold">
            Order {order.id.slice(0, 8)} · {order.orderType === 'HARVEST' ? 'Harvest' : 'Produce'} · {order.itemCount}{' '}
            {order.itemCount === 1 ? 'item' : 'items'} · {rupees(order.total)}
          </p>
          <p className="text-sm text-ink-soft">Placed {day(order.createdAt)}</p>
        </div>
        <span className="flex flex-wrap gap-1.5">
          {order.deliveryMode === 'FLEXIBLE' && <StatusChip tone="neutral">Shared delivery</StatusChip>}
          <StatusChip tone={tone(order.status)}>{STATUS_TEXT[order.status]}</StatusChip>
        </span>
      </div>
      <div className="mt-3">
        <StatusRail stage={stage} total={STAGES.length} label={order.status === 'CANCELLED' ? 'Cancelled' : `Stage ${stage} of ${STAGES.length}: ${STAGES[stage - 1]}`} />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="btn-secondary min-h-10">
          {open ? 'Hide details' : 'Details'}
        </button>
        {cancellable && (
          <button
            type="button"
            disabled={cancel.isPending}
            onClick={() => {
              if (window.confirm(
                  `Cancel order ${order.id.slice(0, 8)}? The customer is refunded.` +
                    (onARoute ? ' The order is packed, so it is taken off its delivery route.' : ''),
                )) {
                setError(undefined)
                cancel.mutate()
              }
            }}
            className="btn-danger min-h-10"
          >
            {cancel.isPending ? 'Cancelling…' : 'Cancel and refund'}
          </button>
        )}
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
