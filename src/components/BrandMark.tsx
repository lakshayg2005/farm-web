import { Link } from 'react-router'

/** Wordmark, plain bold text like "AINow" in the AINow navbar. */
export function BrandMark({ className = '' }: { className?: string; tone?: 'dark' | 'light' }) {
  return (
    <Link to="/" className={`text-xl font-bold text-white ${className}`}>
      Farm Platform
    </Link>
  )
}
