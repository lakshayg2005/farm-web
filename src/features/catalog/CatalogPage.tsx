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
        <SiteHeader tone="light" />
        <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-8 lg:pt-14">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-lime">
            <Icon name="sparkle" className="size-4" /> Live from verified farms
          </p>
          <h1 className="mt-4 max-w-3xl font-display text-[2.6rem] leading-[1.05] sm:text-6xl">
            Fresh produce, <span className="text-gradient">straight from the field</span>
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-white/75">
            See every crop farmers near you are offering, how many days ago it was harvested, and exactly when it will
            reach your door.
          </p>
          <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-white/80">
            {[
              ['shield', 'Inspector-graded quality'],
              ['clock', 'Freshness shown in days'],
              ['truck', 'Next-day pooled delivery'],
            ].map(([icon, label]) => (
              <li key={label} className="inline-flex items-center gap-2">
                <Icon name={icon as 'shield'} className="size-5 text-lime" /> {label}
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
