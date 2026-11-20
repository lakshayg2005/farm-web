import { useEffect } from 'react'
import { Icon } from '@/components/Icon'
import { SiteFooter } from '@/components/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader'
import { CatalogBrowser } from './CatalogBrowser'

/** Public catalog page: anyone can browse what farmers are selling, no account needed. */
export function CatalogPage() {
  useEffect(() => {
    document.title = 'Fresh produce | Farm Platform'
  }, [])
  return (
    <div className="min-h-dvh">
      <div className="mesh relative overflow-hidden pb-24 text-white">
        <SiteHeader />
        <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-8 lg:pt-14">
          <p className="inline-flex items-center gap-2 rounded-full border border-neutral-700 px-4 py-2 text-sm text-neutral-300">
            <Icon name="sparkle" className="size-4" /> Live from verified farms
          </p>
          <h1 className="mt-8 max-w-3xl font-display text-5xl leading-tight sm:text-6xl">
            Fresh produce, <span className="block text-neutral-400">straight from the field.</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-neutral-400">
            See every crop farmers near you are offering, how many days ago it was harvested, and exactly when it will
            reach your door.
          </p>
          <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-neutral-400">
            {[
              ['shield', 'Inspector-graded quality'],
              ['clock', 'Freshness shown in days'],
              ['truck', 'Next-day pooled delivery'],
            ].map(([icon, label]) => (
              <li key={label} className="inline-flex items-center gap-2">
                <Icon name={icon as 'shield'} className="size-5 text-white" /> {label}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <main className="relative mx-auto -mt-16 max-w-7xl px-4 sm:px-8">
        <CatalogBrowser />
      </main>
      <SiteFooter />
    </div>
  )
}
