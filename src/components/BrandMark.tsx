import { Link } from 'react-router'

/** Wordmark: a leaf tile and the name in Newsreader. */
export function BrandMark({ className = '' }: { className?: string; tone?: 'dark' | 'light' }) {
  return (
    <Link to="/" className={`flex shrink-0 items-center gap-3 ${className}`}>
      <span className="grid size-7 place-items-center rounded-lg bg-primary text-on-primary">
        <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
          eco
        </span>
      </span>
      <span className="font-serif text-2xl font-normal tracking-tight text-on-surface">Farm Platform</span>
    </Link>
  )
}
