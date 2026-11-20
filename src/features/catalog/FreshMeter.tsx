import type { Freshness, FreshTone } from './catalog'

const TONE: Record<FreshTone, { bar: string; chip: string }> = {
  peak: { bar: 'bg-leaf', chip: 'bg-leaf/12 text-[#1d6b3a]' },
  fresh: { bar: 'bg-[#7cbf4b]', chip: 'bg-[#7cbf4b]/15 text-[#3f6d1f]' },
  good: { bar: 'bg-mustard', chip: 'bg-mustard/15 text-[#8a5c00]' },
  soon: { bar: 'bg-tomato', chip: 'bg-tomato/12 text-[#a5361a]' },
  upcoming: { bar: 'bg-sky', chip: 'bg-sky/12 text-[#245a99]' },
}

/** Freshness as a labelled bar: full while the crop is at its best, emptying as it ages. */
export function FreshMeter({ fresh, compact = false }: { fresh: Freshness; compact?: boolean }) {
  const tone = TONE[fresh.tone]
  return (
    <div>
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${tone.chip}`}>{fresh.label}</span>
        <span className="text-ink-soft">{fresh.detail}</span>
      </div>
      <div
        role="meter"
        aria-label="Freshness"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(fresh.score * 100)}
        className={`mt-2 overflow-hidden rounded-full bg-paper-deep ${compact ? 'h-1.5' : 'h-2.5'}`}
      >
        <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${Math.max(6, fresh.score * 100)}%` }} />
      </div>
    </div>
  )
}
