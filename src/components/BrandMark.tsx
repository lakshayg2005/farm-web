import { Link } from 'react-router'

export function BrandMark({ className = '' }: { className?: string }) {
  return (
    <Link to="/" className={`inline-flex items-center gap-2.5 font-display text-lg leading-none ${className}`}>
      <svg viewBox="0 0 32 32" className="size-7 shrink-0 rounded-md" aria-hidden="true">
        <rect width="32" height="32" fill="var(--color-indigo)" />
        <path d="M-4 30 30-4M2 36 36 2M-10 24 24-10" stroke="var(--color-mustard)" strokeWidth="3.2" />
      </svg>
      Farm Platform
    </Link>
  )
}
