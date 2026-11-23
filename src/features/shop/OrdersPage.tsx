import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router'
import { ApiError } from '@/api/http'
import { EmptyState } from '@/components/EmptyState'
import { ErrorState, ListSkeleton, StatusChip, StatusRail } from '@/components/ui'
import type { OrderStatus, OrderSummary } from '@/features/farmer/orders'
import { useI18n } from '@/i18n/i18n'
import { canCancel, customerOrdersApi, JOURNEY, journeyStep, ORDER_TEXT, rupees } from './shop'

const TABS = [
  { id: 'open', label: 'In progress', test: (s: OrderStatus) => s !== 'COMPLETED' && s !== 'CANCELLED' && s !== 'DELIVERED' },
  { id: 'done', label: 'Delivered', test: (s: OrderStatus) => s === 'COMPLETED' || s === 'DELIVERED' },
  { id: 'cancelled', label: 'Cancelled', test: (s: OrderStatus) => s === 'CANCELLED' },
] as const

const when = (iso: string) => new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
const message = (e: unknown, fallback: string) => (e instanceof ApiError ? e.message : fallback)

export function CustomerOrdersPage() {
  const { t } = useI18n()
  const orders = useQuery({ queryKey: ['customer-orders'], queryFn: customerOrdersApi.list, refetchInterval: 30_000 })
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('open')
  const [openId, setOpenId] = useState<string | null>(null)

  if (orders.isPending) return <ListSkeleton label="Loading your orders" />
  if (orders.isError) return <ErrorState title="Could not load your orders" body="Check your connection and try again." onRetry={() => void orders.refetch()} />
  if (orders.data.length === 0)
    return (
      <div className="mt-8 max-w-xl">
        <EmptyState icon="box" title="No orders yet" body="Orders you place show here with every step, from the farmer to your door." />
        <Link to="/customer/shop" className="btn-primary mt-4">
          {t('Browse produce')}
        </Link>
      </div>
    )

  const shown = orders.data.filter((o) => TABS.find((x) => x.id === tab)!.test(o.status))
  const count = (id: (typeof TABS)[number]['id']) => orders.data.filter((o) => TABS.find((x) => x.id === id)!.test(o.status)).length

  return (
    <div className="mt-6 max-w-3xl">
      <div role="tablist" aria-label={t('Order status')} className="flex gap-2 overflow-x-auto">
        {TABS.map((x) => (
          <button
            key={x.id}
            role="tab"
            type="button"
            aria-selected={tab === x.id}
            onClick={() => setTab(x.id)}
            className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border-[1.5px] px-4 text-sm font-semibold ${
              tab === x.id ? 'border-ink bg-ink text-background' : 'border-line-strong bg-surface-card hover:bg-paper'
            }`}
          >
            {t(x.label)} <span className={tab === x.id ? 'text-background/70' : 'text-ink-soft'}>{count(x.id)}</span>
          </button>
        ))}
      </div>
      {shown.length === 0 ? (
        <p className="mt-6 text-ink-soft">{t('No orders here.')}</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {shown.map((o) => (
            <li key={o.id}>
              <OrderCard summary={o} open={openId === o.id} onToggle={() => setOpenId(openId === o.id ? null : o.id)} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function OrderCard({ summary: o, open, onToggle }: { summary: OrderSummary; open: boolean; onToggle: () => void }) {
  const { t } = useI18n()
  const text = ORDER_TEXT[o.status]
  const step = journeyStep(o.status)
  return (
    <article className="card overflow-hidden">
      <button type="button" onClick={onToggle} aria-expanded={open} className="w-full p-4 text-left sm:p-5">
        <span className="flex flex-wrap items-start justify-between gap-2">
          <span>
            <span className="block font-display text-xl leading-tight">
              {o.orderType === 'HARVEST' ? t('Harvest order') : t(o.itemCount === 1 ? '{n} item' : '{n} items', { n: o.itemCount })}
              <span className="font-sans text-base font-semibold"> · {rupees(o.total)}</span>
            </span>
            <span className="text-sm text-ink-soft">
              {t('Placed {d}', { d: when(o.createdAt) })} · #{o.id.slice(0, 8)}
            </span>
          </span>
          <StatusChip tone={text.tone}>{t(text.label)}</StatusChip>
        </span>
        {o.status !== 'CANCELLED' && (
          <span className="mt-3 block">
            <StatusRail stage={step} total={JOURNEY.length} label={t(text.label)} />
          </span>
        )}
        <span className="mt-2 block text-sm text-ink-soft">{t(text.next)}</span>
      </button>
      {open && <OrderDetailPanel id={o.id} />}
    </article>
  )
}

function OrderDetailPanel({ id }: { id: string }) {
  const { t } = useI18n()
  const queryClient = useQueryClient()
  const order = useQuery({ queryKey: ['customer-order', id], queryFn: () => customerOrdersApi.get(id) })
  const live = order.data && ['POOLED', 'IN_TRANSIT'].includes(order.data.status)
  const track = useQuery({ queryKey: ['order-track', id], queryFn: () => customerOrdersApi.track(id), enabled: !!live, refetchInterval: 20_000, retry: false })
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [error, setError] = useState('')
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['customer-orders'] })
    void queryClient.invalidateQueries({ queryKey: ['customer-order', id] })
  }
  const cancel = useMutation({
    mutationFn: () => customerOrdersApi.cancel(id),
    onSuccess: refresh,
    onError: (e) => {
      setConfirmCancel(false)
      setError(message(e, t('Could not reach the server. Try again.')))
    },
  })

  if (order.isPending) return <p className="border-t border-line p-4 text-ink-soft">{t('Loading…')}</p>
  if (order.isError) return <p role="alert" className="border-t border-line p-4 font-semibold text-danger">{t('Could not load this order.')}</p>
  const d = order.data

  return (
    <div className="space-y-5 border-t border-line p-4 sm:p-5">
      <table className="w-full text-left">
        <caption className="sr-only">{t('Items in this order')}</caption>
        <tbody className="divide-y divide-line">
          {d.items.map((i, n) => (
            <tr key={n}>
              <td className="py-2 pr-3">
                {i.name}
                <span className="block text-sm text-ink-soft">
                  {i.qty} {i.unit} × {rupees(i.unitPrice)}
                </span>
              </td>
              <td className="py-2 text-right font-semibold tabular-nums">{rupees(i.lineTotal)}</td>
            </tr>
          ))}
          {d.deliveryFee > 0 && (
            <tr>
              <td className="py-2 text-ink-soft">{t('Delivery')}</td>
              <td className="py-2 text-right tabular-nums">{rupees(d.deliveryFee)}</td>
            </tr>
          )}
          <tr className="font-bold">
            <td className="py-2">{t('Total')}</td>
            <td className="py-2 text-right tabular-nums">{rupees(d.total)}</td>
          </tr>
        </tbody>
      </table>

      {d.deliveryAddress && (
        <p className="text-sm text-ink-soft">
          {t('Delivering to')}: {[d.deliveryAddress.line1, d.deliveryAddress.line2, d.deliveryAddress.city, d.deliveryAddress.pincode].filter(Boolean).join(', ')}
        </p>
      )}

      {live && (
        <div className="rounded-lg bg-paper p-3.5">
          <h3 className="font-semibold">{t('Delivery')}</h3>
          {track.data?.partnerName ? (
            <p className="mt-1 text-sm">
              {t('{name} is bringing your order.', { name: track.data.partnerName })}{' '}
              {track.data.partnerPhone && (
                <a href={`tel:${track.data.partnerPhone}`} className="font-semibold text-primary underline">
                  {t('Call')} {track.data.partnerPhone}
                </a>
              )}
            </p>
          ) : (
            <p className="mt-1 text-sm text-ink-soft">{t('A delivery partner will be assigned soon.')}</p>
          )}
          {(track.data?.eta ?? track.data?.stop?.eta) && (
            <p className="text-sm">
              {t('Expected around')} <strong>{when((track.data?.eta ?? track.data?.stop?.eta)!)}</strong>
            </p>
          )}
          {track.data?.stop?.otp && (
            <p className="mt-2">
              {t('Delivery code')}: <strong className="rounded bg-surface-card px-2 py-0.5 font-mono text-lg tracking-widest">{track.data.stop.otp}</strong>
              <span className="block text-sm text-ink-soft">{t('Tell the delivery partner this code when you receive the order.')}</span>
            </p>
          )}
        </div>
      )}

      <div>
        <h3 className="text-sm font-semibold">{t('History')}</h3>
        <ol className="mt-2 space-y-2 border-l-2 border-line pl-4">
          {[...d.events].reverse().map((e, n) => (
            <li key={n} className="relative">
              <span aria-hidden="true" className={`absolute top-1.5 -left-[1.4rem] size-2.5 rounded-full ${n === 0 ? 'bg-primary' : 'bg-line-strong'}`} />
              <span className="font-semibold">{t(ORDER_TEXT[e.status]?.label ?? e.status)}</span>
              <span className="text-sm text-ink-soft"> · {when(e.occurredAt)}</span>
              {e.note && <span className="block text-sm text-ink-soft">{e.note}</span>}
            </li>
          ))}
        </ol>
      </div>

      {d.status === 'COMPLETED' && <RatingBox orderId={id} existing={d.rating} onDone={refresh} />}

      {canCancel(d.status) && (
        <div className="flex flex-wrap items-center gap-3">
          {confirmCancel ? (
            <>
              <span className="text-sm">{t('Cancel this order? You are refunded in full.')}</span>
              <button type="button" disabled={cancel.isPending} onClick={() => cancel.mutate()} className="btn-danger">
                {cancel.isPending ? t('Cancelling…') : t('Yes, cancel')}
              </button>
              <button type="button" onClick={() => setConfirmCancel(false)} className="underline">
                {t('Keep it')}
              </button>
            </>
          ) : (
            <button type="button" onClick={() => setConfirmCancel(true)} className="btn-secondary">
              {t('Cancel order')}
            </button>
          )}
        </div>
      )}
      {error && (
        <p role="alert" className="font-semibold text-danger">
          {error}
        </p>
      )}
    </div>
  )
}

function RatingBox({ orderId, existing, onDone }: { orderId: string; existing: { score: number; comment: string | null } | null; onDone: () => void }) {
  const { t } = useI18n()
  const [score, setScore] = useState(0)
  const [comment, setComment] = useState('')
  const [error, setError] = useState('')
  const rate = useMutation({
    mutationFn: () => customerOrdersApi.rate(orderId, score, comment),
    onSuccess: onDone,
    onError: (e) => setError(message(e, t('Could not reach the server. Try again.'))),
  })
  if (existing)
    return (
      <p className="rounded-lg bg-paper p-3.5">
        {t('You rated this order')} <span className="text-warn">{'★'.repeat(existing.score)}</span>
        <span className="text-line-strong">{'★'.repeat(5 - existing.score)}</span>
        {existing.comment && <span className="block text-sm text-ink-soft">“{existing.comment}”</span>}
      </p>
    )
  return (
    <div className="rounded-lg bg-paper p-3.5">
      <h3 className="font-semibold">{t('How was this order?')}</h3>
      <div role="radiogroup" aria-label={t('Rating')} className="mt-1 flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={score === n}
            aria-label={t(n === 1 ? '{n} star' : '{n} stars', { n })}
            onClick={() => setScore(n)}
            className={`grid size-11 place-items-center text-3xl leading-none ${n <= score ? 'text-warn' : 'text-line-strong'}`}
          >
            ★
          </button>
        ))}
      </div>
      <label className="mt-2 block">
        <span className="sr-only">{t('Comment (optional)')}</span>
        <textarea value={comment} onChange={(e) => setComment(e.target.value)} maxLength={500} rows={2} placeholder={t('Anything to tell the farmer? (optional)')} className="input" />
      </label>
      {error && (
        <p role="alert" className="mt-2 font-semibold text-danger">
          {error}
        </p>
      )}
      <button type="button" disabled={score === 0 || rate.isPending} onClick={() => rate.mutate()} className="btn-primary mt-3">
        {rate.isPending ? t('Sending…') : t('Send rating')}
      </button>
    </div>
  )
}
