import { Link } from 'react-router'

/** The furrow-and-sprout mark from the favicon, drawn in the theme's green. */
export function Logo({ className = 'size-7' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <rect width="32" height="32" rx="7" className="fill-primary" />
      <g className="stroke-on-primary" fill="none" strokeLinecap="round" strokeWidth="1.8">
        <path d="M5 24.5c7-2.2 15-2.2 22 0M7 28c6-1.6 12-1.6 18 0" strokeOpacity="0.55" />
        <path d="M16 21v-7" />
      </g>
      <path d="M16 14c0-3.6-2.4-5.6-6-5.6 0 3.6 2.4 5.6 6 5.6Z" className="fill-on-primary" />
      <path d="M16 12.2c0-3.2 2.2-5.2 6-5.2 0 3.2-2.2 5.2-6 5.2Z" className="fill-on-primary" fillOpacity="0.65" />
    </svg>
  )
}

/** Logo and name, linking to the start page. */
export function BrandMark({ className = '' }: { className?: string }) {
  return (
    <Link to="/" className={`flex shrink-0 items-center gap-2.5 ${className}`}>
      <Logo />
      <span className="text-[1.05rem] font-semibold tracking-tight text-on-surface">Farm Platform</span>
    </Link>
  )
}
