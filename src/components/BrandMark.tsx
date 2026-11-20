import { Link } from 'react-router'

/** Logo: a sprout over field rows, in a rounded tile. `tone="light"` for dark backgrounds. */
export function BrandMark({ className = '', tone = 'dark' }: { className?: string; tone?: 'dark' | 'light' }) {
  return (
    <Link
      to="/"
      className={`inline-flex items-center gap-2.5 font-display text-lg leading-none ${tone === 'light' ? 'text-white' : 'text-ink'} ${className}`}
    >
      <svg viewBox="0 0 32 32" className="size-8 shrink-0" aria-hidden="true">
        <rect width="32" height="32" rx="9" fill="var(--color-indigo)" />
        <path d="M5 24.5c7-2.2 15-2.2 22 0M7 28c6-1.6 12-1.6 18 0" stroke="var(--color-lime)" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        <path d="M16 21v-7" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
        <path d="M16 14c0-3.6-2.4-5.6-6-5.6 0 3.6 2.4 5.6 6 5.6Z" fill="var(--color-lime)" />
        <path d="M16 12.2c0-3.2 2.2-5.2 6-5.2 0 3.2-2.2 5.2-6 5.2Z" fill="var(--color-mustard)" />
      </svg>
      Farm Platform
    </Link>
  )
}
