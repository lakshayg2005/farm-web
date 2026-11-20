import { Link } from 'react-router'

/** Logo: a sprout over field rows, in a rounded tile. `tone="light"` for dark backgrounds. */
export function BrandMark({ className = '', tone = 'dark' }: { className?: string; tone?: 'dark' | 'light' }) {
  const light = tone === 'light'
  const tile = light ? '#ffffff' : '#0a0a0a'
  const mark = light ? '#0a0a0a' : '#ffffff'
  return (
    <Link
      to="/"
      className={`inline-flex items-center gap-2.5 text-lg leading-none font-bold tracking-tight ${tone === 'light' ? 'text-white' : 'text-ink'} ${className}`}
    >
      <svg viewBox="0 0 32 32" className="size-8 shrink-0" aria-hidden="true">
        <rect width="32" height="32" rx="8" fill={tile} />
        <path d="M5 24.5c7-2.2 15-2.2 22 0M7 28c6-1.6 12-1.6 18 0" stroke={mark} strokeOpacity="0.5" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        <path d="M16 21v-7" stroke={mark} strokeWidth="1.8" strokeLinecap="round" />
        <path d="M16 14c0-3.6-2.4-5.6-6-5.6 0 3.6 2.4 5.6 6 5.6Z" fill={mark} />
        <path d="M16 12.2c0-3.2 2.2-5.2 6-5.2 0 3.2-2.2 5.2-6 5.2Z" fill={mark} fillOpacity="0.6" />
      </svg>
      Farm Platform
    </Link>
  )
}
