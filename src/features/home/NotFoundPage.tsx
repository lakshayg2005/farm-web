import { Link } from 'react-router'
import { BrandMark } from '@/components/BrandMark'

export function NotFoundPage() {
  return (
    <div className="mx-auto min-h-dvh max-w-6xl px-4 pt-6 sm:px-8 lg:pt-10">
      <BrandMark />
      <h1 className="mt-16 font-display text-[2.4rem] leading-tight">This page does not exist</h1>
      <p className="mt-3 max-w-md text-lg text-ink-soft">The link may be old or mistyped. Start again from the section list.</p>
      <Link
        to="/"
        className="mt-8 inline-block rounded-lg bg-indigo px-5 py-2.5 font-semibold text-white hover:bg-indigo/90"
      >
        Go to sections
      </Link>
    </div>
  )
}
