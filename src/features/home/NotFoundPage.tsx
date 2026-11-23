import { Link } from 'react-router'
import { BrandMark } from '@/components/BrandMark'

export function NotFoundPage() {
  return (
    <div className="mx-auto min-h-dvh max-w-6xl px-4 pt-6 sm:px-8 lg:pt-10">
      <BrandMark />
      <h1 className="mt-16 font-display text-[2.8rem] leading-none">This page does not exist</h1>
      <p className="mt-3 max-w-md text-lg text-ink-soft">The link may be old or mistyped. Start again from the section list.</p>
      <Link
        to="/"
        className="btn-primary mt-8"
      >
        Go to sections
      </Link>
    </div>
  )
}
