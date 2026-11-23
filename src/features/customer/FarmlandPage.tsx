import { useEffect } from 'react'
import { SiteFooter } from '@/components/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader'
import { PlotSearchPage } from './PlotSearchPage'

/** Public "Reserve farmland": search the map for open plots, then request one (sign-in needed to send). */
export function FarmlandPage() {
  useEffect(() => {
    document.title = 'Reserve farmland | Farm Platform'
  }, [])
  return (
    <>
      <SiteHeader />
      <section className="w-full bg-surface-container-low px-6 py-8 shadow-sm lg:px-12">
        <div className="mx-auto max-w-[1440px] space-y-2">
          <div className="flex items-center gap-2">
            <span className="size-2 animate-pulse rounded-full bg-primary" />
            <span className="text-label-sm tracking-widest text-primary uppercase">Seasonal land · live plots</span>
          </div>
          <h1 className="font-headline-xl text-headline-xl text-on-surface">Find land</h1>
          <p className="max-w-2xl text-body-md text-on-surface-variant">
            Search any village or town, pick a plot on the map, and reserve it for the coming season. The farmer
            tends it and posts photo updates until harvest.
          </p>
        </div>
      </section>
      <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-6 sm:px-6 lg:px-12">
        <PlotSearchPage publicView />
      </main>
      <SiteFooter />
    </>
  )
}
