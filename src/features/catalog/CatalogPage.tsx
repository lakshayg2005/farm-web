import { useEffect } from 'react'
import { SiteFooter } from '@/components/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader'
import { FreshProduceView } from './FreshProduceView'

/** Public fresh-produce page. */
export function CatalogPage() {
  useEffect(() => {
    document.title = 'Fresh produce | Farm Platform'
  }, [])
  return (
    <>
      <SiteHeader />
      <FreshProduceView />
      <SiteFooter />
    </>
  )
}
