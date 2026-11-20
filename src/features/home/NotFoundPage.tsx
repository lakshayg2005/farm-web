import { Link } from 'react-router'
import { SiteHeader } from '@/components/SiteHeader'

export function NotFoundPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex min-h-[calc(100vh-4.5rem)] items-center justify-center bg-black px-6 pb-24 text-white">
        <div className="text-center">
          <p className="text-sm tracking-widest text-gray-500 uppercase">404</p>
          <h1 className="mt-4 text-4xl font-bold">This page does not exist</h1>
          <p className="mt-4 text-gray-400">The link may be old or mistyped. Start again from the home page.</p>
          <div className="mt-8 flex justify-center gap-4">
            <Link to="/" className="rounded-xl bg-white px-6 py-3 font-semibold text-black hover:bg-gray-200">
              Home
            </Link>
            <Link to="/catalog" className="rounded-xl border border-gray-700 px-6 py-3 font-semibold hover:bg-gray-900">
              Fresh produce
            </Link>
          </div>
        </div>
      </main>
    </>
  )
}
