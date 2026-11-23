import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router'
import { SiteHeader } from '@/components/SiteHeader'
import { ErrorState, ListSkeleton, Rating } from '@/components/ui'
import { useAuth } from '@/features/auth/authContext'
import { useI18n } from '@/i18n/i18n'
import { ProduceCard } from './ProduceCard'
import { ProduceDialog } from './ProduceDialog'
import { shopApi, useCart } from './shop'

/** A farm's public page: who grows it, how customers rate it, and everything it has on sale. */
export function FarmPage() {
  const { t } = useI18n()
  const { user } = useAuth()
  const { id = '' } = useParams()
  const cart = useCart()
  const [openId, setOpenId] = useState<string | null>(null)
  const farm = useQuery({ queryKey: ['farm', id], queryFn: () => shopApi.farm(id), retry: false })
  const listings = useQuery({ queryKey: ['farm-listings', id], queryFn: () => shopApi.farmListings(id), retry: false })
  useEffect(() => {
    document.title = `${farm.data?.name ?? t('Farm')} | Farm Platform`
  }, [farm.data?.name, t])
  const open = listings.data?.find((p) => p.id === openId) ?? null
  const isCustomer = !!user?.roles.includes('customer')

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl px-4 pt-8 pb-16 sm:px-8">
      {farm.isPending ? (
        <ListSkeleton label="Loading the farm" rows={1} />
      ) : farm.isError ? (
        <ErrorState title="This farm could not be found" body="It may have been removed." />
      ) : (
        <>
          <h1 className="font-serif text-[2.5rem] leading-none sm:text-5xl">{farm.data.name}</h1>
          <p className="mt-2 text-ink-soft">{[farm.data.village, farm.data.district, farm.data.state].filter(Boolean).join(', ')}</p>
          <div className="mt-2">
            <Rating value={farm.data.rating} count={farm.data.ratingCount} />
          </div>
          <h2 className="mt-10 font-display text-lg">{t('On sale now')}</h2>
          {listings.isPending ? (
            <ListSkeleton label="Loading produce" />
          ) : listings.data && listings.data.length > 0 ? (
            <ul className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {listings.data.map((p) => (
                <li key={p.id}>
                  <ProduceCard item={p} inCart={cart.some((l) => l.listingId === p.id)} onOpen={() => setOpenId(p.id)} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-ink-soft">{t('Nothing is on sale from this farm right now.')}</p>
          )}
        </>
      )}
      </main>
      {open && <ProduceDialog key={open.id} item={open} cartPath={isCustomer ? '/customer/cart' : '/login'} onClose={() => setOpenId(null)} />}
    </div>
  )
}
