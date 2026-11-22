import type { ReactNode } from 'react'

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
  return (
    <div role="status" aria-label={label} className="mt-8 space-y-3">
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
  return (
    <div role="alert" className="card mt-8 max-w-xl border-danger/40 p-5">
      <h2 className="font-semibold text-danger">{title}</h2>
      {body && <p className="mt-1 text-ink-soft">{body}</p>}
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-secondary mt-3">
          Try again
        </button>
      )}
    </div>
  )
}

/** Label above a number, used for the summary figures at the top of a page. */
export function Figure({ label, value, hint }: { label: string; value: ReactNode; hint?: ReactNode }) {
  return (
    <div className="card p-4 sm:p-5">
      <p className="text-sm text-ink-soft">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-sm text-ink-soft">{hint}</p>}
    </div>
  )
}
