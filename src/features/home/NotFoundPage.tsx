import { Link } from 'react-router'
import { SiteHeader } from '@/components/SiteHeader'

export function NotFoundPage() {
  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <div className="mx-auto max-w-3xl px-4 pt-20 text-center sm:px-8">
        <p className="text-7xl" aria-hidden>
          🌾
        </p>
        <h1 className="mt-6 font-display text-[2.6rem] leading-tight">This page does not exist</h1>
        <p className="mx-auto mt-3 max-w-md text-lg text-ink-soft">
          The link may be old or mistyped. Start again from the home page.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link to="/" className="btn-primary">
            Go to sections
          </Link>
          <Link to="/catalog" className="btn-ghost">
            Browse produce
          </Link>
        </div>
      </div>
    </div>
  )
}
