import { useEffect } from 'react'
import { SiteFooter } from '@/components/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader'
import { CatalogBrowser } from './CatalogBrowser'

/** Public catalog page, laid out like AINow's Newsletters page. */
export function CatalogPage() {
  useEffect(() => {
    document.title = 'Fresh produce | Farm Platform'
  }, [])
  return (
    <>
      <SiteHeader />
      <main className="mx-auto min-h-screen w-full max-w-[1440px] px-6 pt-8 pb-24 lg:px-12">
        <div className="mb-2 flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-label-sm tracking-widest text-primary uppercase">
            <span className="size-1.5 animate-pulse rounded-full bg-primary" /> Direct farm network
          </span>
          <span className="text-label-sm text-outline-variant">/</span>
          <span className="text-label-sm text-on-surface-variant">Live from verified farms</span>
        </div>
        <div className="mb-8 max-w-3xl">
          <h1 className="font-display-lg text-display-lg tracking-tight text-on-surface">What farmers near you are offering.</h1>
          <p className="mt-3 max-w-2xl text-body-xl text-on-surface-variant">
            Every crop, how many days ago it was harvested, and exactly when it will reach your kitchen door.
          </p>
        </div>
        <CatalogBrowser />
      </main>
      <SiteFooter />
    </>
  )
}
