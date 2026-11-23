import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { ApiError } from '@/api/http'
import { day, rupees } from '@/features/customer/land'
import { ErrorState, ListSkeleton, StatusRail } from '@/components/ui'
import { useI18n } from '@/i18n/i18n'
import { inTab, ordersApi, STAGES, stageOf, STATUS_TEXT, TABS, type OrderSummary, type TabId } from './orders'

const message = (e: unknown) => (e instanceof ApiError ? e.message : 'Could not reach the server. Try again.')

export function OrdersPage() {
  const { t } = useI18n()
  const [tab, setTab] = useState<TabId>('new')
  const orders = useQuery({ queryKey: ['farmer-orders'], queryFn: ordersApi.list })

  if (orders.isPending) return <ListSkeleton label="Loading orders" />
  if (orders.isError)
    return <ErrorState title="Could not load your orders" body="Check your connection and try again." onRetry={() => void orders.refetch()} />
  const all = orders.data.items
  const shown = all.filter((o) => inTab(o, tab))
  return (
    <div className="mt-8 max-w-4xl space-y-5">
      <div role="tablist" aria-label={t('Order status')} className="inline-flex max-w-full flex-wrap gap-0.5 rounded-md bg-paper-deep p-0.5">
        {TABS.map((tb) => {
          const count = all.filter((o) => inTab(o, tb.id)).length
          return (
            <button
              key={tb.id}
              type="button"
              role="tab"
              aria-selected={tab === tb.id}
              onClick={() => setTab(tb.id)}
              className="min-h-9 rounded px-3.5 py-1 text-sm font-medium text-on-surface-variant aria-selected:bg-surface-card aria-selected:text-on-surface aria-selected:shadow-xs"
            >
              {t(tb.label)} ({count})
            </button>
          )
        })}
      </div>

      {shown.length === 0 ? (
        <p className="card p-5 text-ink-soft">{t('Nothing in this tab. New orders appear under “To pack” as soon as a customer pays.')}</p>
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
  const { t } = useI18n()
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
  // the order service allows a cancel until the order is packed
  const cancellable = ['PLACED', 'CONFIRMED', 'PACKED'].includes(order.status)

  return (
    <div className="card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-semibold">
            {order.orderType === 'HARVEST' ? t('Harvest order') : t('Order')} · {order.itemCount} {order.itemCount === 1 ? t('item') : t('items')} ·{' '}
            {rupees(order.total)}
          </p>
          <p className="text-sm text-ink-soft">{t('Placed')} {day(order.createdAt)}</p>
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
              {pack.isPending ? t('Marking…') : t('Mark packed')}
            </button>
          )}
          {cancellable && (
            <button
              type="button"
              disabled={cancel.isPending}
              onClick={() => {
                if (window.confirm(t('Cancel this order? The customer is refunded.'))) {
                  setError(undefined)
                  cancel.mutate()
                }
              }}
              className="btn-danger"
            >
              {t('Cancel')}
            </button>
          )}
          <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="btn-secondary">
            {open ? t('Hide details') : t('Details')}
          </button>
        </div>
      </div>
      <div className="mt-3">
        <StatusRail
          stage={stageOf(order.status)}
          total={STAGES.length}
          label={
            order.status === 'CANCELLED'
              ? t('Cancelled')
              : t('Stage {n} of {total}: {name}', { n: stageOf(order.status), total: STAGES.length, name: t(STAGES[stageOf(order.status) - 1] ?? '') })
          }
        />
        <p className="mt-1.5 text-sm text-ink-soft">{t(STATUS_TEXT[order.status])}</p>
      </div>
      {error && (
        <p role="alert" className="mt-2 text-sm font-semibold text-danger">
          {error}
        </p>
      )}
      {open &&
        (detail.isPending ? (
          <p className="mt-3 text-ink-soft">{t('Loading…')}</p>
        ) : detail.isError ? (
          <p role="alert" className="mt-3 font-semibold text-danger">
            {t('Could not load the order.')}
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
                  {t(STATUS_TEXT[ev.status])} · {day(ev.occurredAt)}
                  {ev.note ? ` · ${ev.note}` : ''}
                </li>
              ))}
            </ol>
          </div>
        ))}
    </div>
  )
}
