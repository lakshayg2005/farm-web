import { Link } from 'react-router'

/** Wordmark: a leaf in a mint tile and the name in Newsreader. */
export function BrandMark({ className = '' }: { className?: string; tone?: 'dark' | 'light' }) {
  return (
    <Link to="/" className={`flex shrink-0 items-center gap-3 ${className}`}>
      <span className="grid size-8 place-items-center rounded-lg bg-primary text-on-primary">
        <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
          eco
        </span>
      </span>
      <span className="font-headline-sm text-headline-sm font-semibold tracking-tight text-on-surface">Farm Platform</span>
    </Link>
  )
}
