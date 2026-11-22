import { Link } from 'react-router'

export function BrandMark({ className = '' }: { className?: string }) {
  return (
    <Link to="/" className={`inline-flex items-center gap-2.5 text-lg leading-none font-bold ${className}`}>
      <svg viewBox="0 0 26 26" className="size-[26px] shrink-0" aria-hidden="true">
        <rect width="26" height="26" rx="6" fill="var(--color-ink)" />
        <path d="M7 18V8m6 10v-6m6 6V10" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
      Farm Platform
    </Link>
  )
}
