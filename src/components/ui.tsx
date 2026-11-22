import type { ReactNode } from 'react'
import { useI18n } from '@/i18n/i18n'

/** Status colours: a tone is always shown with text and a dot, never as colour alone. */
export type Tone = 'neutral' | 'good' | 'info' | 'warn' | 'danger'

const CHIP: Record<Tone, { box: string; dot: string }> = {
  neutral: { box: 'bg-paper-deep text-ink', dot: 'bg-ink-soft' },
  good: { box: 'bg-[#dff1e6] text-[#12522f]', dot: 'bg-primary' },
  info: { box: 'bg-[#e1e9fb] text-[#1f43a0]', dot: 'bg-focus' },
  warn: { box: 'bg-[#f7ebd0] text-[#6f4a0e]', dot: 'bg-warn' },
  danger: { box: 'bg-[#f8e1dc] text-[#8e2c1c]', dot: 'bg-danger' },
}

export function StatusChip({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  const c = CHIP[tone]
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-sm font-semibold ${c.box}`}>
      <span aria-hidden="true" className={`size-2 rounded-full ${c.dot}`} />
      {children}
    </span>
  )
}

/**
 * The signature element: an 8-segment bar. Completed stages are green, the rest grey,
 * with the current stage written underneath by the caller.
 */
export function StatusRail({ stage, total = 8, label }: { stage: number; total?: number; label: string }) {
  return (
    <div role="img" aria-label={label} className="flex gap-[3px]">
      {Array.from({ length: total }, (_, i) => (
        <span key={i} className={`h-1.5 min-w-3 flex-1 rounded-[3px] ${i < stage ? 'bg-primary' : 'bg-line'}`} />
      ))}
    </div>
  )
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <span aria-hidden="true" className={`block animate-pulse rounded-lg bg-paper-deep motion-reduce:animate-none ${className}`} />
}

/** A list-shaped placeholder shown while a page's first request is in flight. */
export function ListSkeleton({ rows = 3, label = 'Loading' }: { rows?: number; label?: string }) {
  const { t } = useI18n()
  return (
    <div role="status" aria-label={t(label)} className="mt-8 space-y-3">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="card space-y-3 p-4">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-3 w-2/3" />
        </div>
      ))}
    </div>
  )
}

export function ErrorState({ title, body, onRetry }: { title: string; body?: string; onRetry?: () => void }) {
  const { t } = useI18n()
  return (
    <div role="alert" className="card mt-8 max-w-xl border-danger/40 p-5">
      <h2 className="font-semibold text-danger">{t(title)}</h2>
      {body && <p className="mt-1 text-ink-soft">{t(body)}</p>}
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-secondary mt-3">
          {t('Try again')}
        </button>
      )}
    </div>
  )
}

/** Label above a number, used for the summary figures at the top of a page. */
export function Figure({ label, value, hint }: { label: string; value: ReactNode; hint?: ReactNode }) {
  const { t } = useI18n()
  return (
    <div className="card p-4 sm:p-5">
      <p className="text-sm text-ink-soft">{t(label)}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-sm text-ink-soft">{hint}</p>}
    </div>
  )
}

/** A farm's average score: five stars, the number and how many ratings it rests on. */
export function Rating({ value, count }: { value: number | null | undefined; count: number }) {
  const { t } = useI18n()
  if (value == null || count === 0) return <span className="text-sm text-ink-soft">{t('Not rated yet')}</span>
  const filled = Math.round(value)
  return (
    <span className="inline-flex items-center gap-1.5 text-sm" title={t('{n} out of 5', { n: value.toFixed(1) })}>
      <span aria-hidden="true" className="tracking-tight text-warn">
        {'★'.repeat(filled)}
        <span className="text-line-strong">{'★'.repeat(5 - filled)}</span>
      </span>
      <span className="font-semibold tabular-nums">{value.toFixed(1)}</span>
      <span className="text-ink-soft">({t(count === 1 ? '{n} rating' : '{n} ratings', { n: count })})</span>
      <span className="sr-only">{t('{n} out of 5', { n: value.toFixed(1) })}</span>
    </span>
  )
}
