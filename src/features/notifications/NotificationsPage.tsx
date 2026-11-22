import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router'
import { ErrorState, ListSkeleton } from '@/components/ui'
import { useI18n } from '@/i18n/i18n'
import { notificationsApi, notificationTarget, type AppNotification } from './notifications'

const when = (iso: string, lang: string) =>
  new Date(iso).toLocaleString(lang === 'hi' ? 'hi-IN' : 'en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })

/** Everything the platform told this user, newest first, with the unread ones marked. */
export function NotificationsPage({ role }: { role: string }) {
  const { t, lang } = useI18n()
  const queryClient = useQueryClient()
  const [unreadOnly, setUnreadOnly] = useState(false)
  const list = useQuery({ queryKey: ['notifications', 'list', unreadOnly], queryFn: () => notificationsApi.list(unreadOnly) })
  const refresh = () => void queryClient.invalidateQueries({ queryKey: ['notifications'] })
  const readOne = useMutation({ mutationFn: notificationsApi.markRead, onSuccess: refresh })
  const readAll = useMutation({ mutationFn: notificationsApi.markAllRead, onSuccess: refresh })

  if (list.isPending) return <ListSkeleton label="Loading notifications" />
  if (list.isError) return <ErrorState title="Could not load notifications" onRetry={() => void list.refetch()} />

  const { items, unreadCount } = list.data
  return (
    <div className="mt-8 max-w-3xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="group" aria-label={t('Filter')} className="inline-flex gap-1 rounded-lg bg-paper-deep p-[3px]">
          {[
            [false, t('All')],
            [true, t('Unread ({n})', { n: unreadCount })],
          ].map(([value, label]) => (
            <button
              key={String(value)}
              type="button"
              aria-pressed={unreadOnly === value}
              onClick={() => setUnreadOnly(value as boolean)}
              className="min-h-10 rounded-md px-4 text-[0.95rem] font-semibold aria-pressed:bg-white aria-pressed:shadow-[0_1px_2px_rgba(23,26,29,.18)]"
            >
              {label as string}
            </button>
          ))}
        </div>
        <button type="button" className="btn-secondary" disabled={unreadCount === 0 || readAll.isPending} onClick={() => readAll.mutate()}>
          {t('Mark all as read')}
        </button>
      </div>

      {items.length === 0 ? (
        <p className="card p-5 text-ink-soft">
          {unreadOnly ? t('You are all caught up.') : t('Nothing yet. Order, payment and reservation updates show up here.')}
        </p>
      ) : (
        <ul className="card divide-y divide-line">
          {items.map((n) => (
            <Row key={n.id} n={n} role={role} lang={lang} onRead={() => readOne.mutate(n.id)} />
          ))}
        </ul>
      )}
    </div>
  )
}

function Row({ n, role, lang, onRead }: { n: AppNotification; role: string; lang: string; onRead: () => void }) {
  const { t } = useI18n()
  const unread = !n.readAt
  const target = notificationTarget(n, role)
  return (
    <li className="flex items-start gap-3 p-4">
      <span
        aria-hidden="true"
        className={`mt-2 size-2.5 shrink-0 rounded-full ${unread ? 'bg-primary' : 'border border-line-strong'}`}
      />
      <div className="min-w-0 flex-1">
        <p className={unread ? 'font-bold' : 'font-medium'}>
          {unread && <span className="sr-only">{t('Unread:')} </span>}
          {t(n.title)}
        </p>
        <p className="text-ink-soft">{n.body}</p>
        <p className="mt-1 flex flex-wrap gap-x-4 text-sm text-ink-soft">
          <span>{when(n.createdAt, lang)}</span>
          {target && (
            <Link to={target} onClick={unread ? onRead : undefined} className="font-semibold text-primary underline">
              {t('Open')}
            </Link>
          )}
        </p>
      </div>
      {unread && (
        <button type="button" onClick={onRead} className="btn-secondary min-h-9 shrink-0 px-3 py-1 text-sm">
          {t('Mark read')}
        </button>
      )}
    </li>
  )
}
