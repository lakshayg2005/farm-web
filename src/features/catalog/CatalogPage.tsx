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
      <main className="min-h-screen bg-black px-6 py-24 text-white">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold tracking-widest text-gray-500 uppercase">Fresh produce</p>
            <h1 className="mt-4 text-5xl font-bold md:text-6xl">What farmers near you are offering.</h1>
            <p className="mt-6 text-lg leading-8 text-gray-400">
              Every crop, how many days ago it was harvested, and exactly when it will reach your door.
            </p>
          </div>
          <div className="mt-12">
            <CatalogBrowser />
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  )
}
