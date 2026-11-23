import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { ApiError } from '@/api/http'
import { useToast } from '@/components/Toast'
import { categoryOf, cropLook } from '@/features/catalog/catalog'
import { useProducePhoto } from '@/features/catalog/useProducePhoto'
import { catalogApi, day, isLowStock, rupees, type Listing } from './catalog'
import { Rating } from '@/components/ui'
import { useAuth } from '@/features/auth/authContext'
import { FarmSetup, ListingEditor } from './ListingsPage'
import { OrdersPage } from './OrdersPage'
import { earnings, ordersApi } from './orders'

const message = (e: unknown) =>
  e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'Could not reach the server. Try again.'

const TAG: Record<string, string> = { vegetable: 'Veg', leafy: 'Leafy', fruit: 'Fruit', grain: 'Grain', pulse: 'Pulse', spice: 'Spice', oilseed: 'Oilseed' }
const ORDER: Record<string, number> = { ACTIVE: 0, SOLD_OUT: 1, PAUSED: 2 }
const IN_PROGRESS = ['CONFIRMED', 'PACKED', 'QC_PASSED', 'READY_FOR_DISPATCH', 'POOLED', 'IN_TRANSIT']

type Tab = 'listings' | 'orders'

/** "Listings & Orders": the farmer's hub for produce on sale, the packing queue and what they have earned. */
export function FarmerHubPage({ tab: initialTab }: { tab: Tab }) {
  const navigate = useNavigate()
  const notify = useToast()
  const { user } = useAuth()
  const [editing, setEditing] = useState<Listing | 'new' | null>(null)
  const [editorError, setEditorError] = useState<string>()
  const [now] = useState(() => Date.now())

  const farms = useQuery({ queryKey: ['farms', 'mine'], queryFn: catalogApi.myFarms })
  const listings = useQuery({ queryKey: ['listings', 'mine'], queryFn: catalogApi.myListings, enabled: !!farms.data?.length })
  const crops = useQuery({ queryKey: ['catalog-crops'], queryFn: catalogApi.crops, staleTime: 3_600_000 })
  const orders = useQuery({ queryKey: ['farmer-orders'], queryFn: ordersApi.list })
  const payouts = useQuery({ queryKey: ['farmer-payouts'], queryFn: ordersApi.payouts, retry: false })

  const live = (listings.data ?? [])
    .filter((l) => l.status !== 'ARCHIVED')
    .sort((a, b) => (ORDER[a.status] ?? 3) - (ORDER[b.status] ?? 3) || b.updatedAt.localeCompare(a.updatedAt))
  const allOrders = orders.data?.items ?? []
  const toPack = allOrders.filter((o) => o.status === 'CONFIRMED')
  const money = earnings(allOrders)
  const shipping = allOrders.filter((o) => IN_PROGRESS.includes(o.status)).length
  const inStock = live.filter((l) => l.qtyAvailable > 0).length
  const ageDays = live.length
    ? live.reduce((sum, l) => sum + Math.max(0, (now - new Date(`${l.harvestDate}T00:00:00`).getTime()) / 86_400_000), 0) / live.length
    : 0

  let gate: ReactNode = null
  if (initialTab === 'listings') {
    if (farms.isPending) gate = <p className="text-on-surface-variant">Loading your farm…</p>
    else if (farms.isError) gate = <p role="alert" className="font-semibold text-error">Could not load your farm. Refresh to try again.</p>
    else if (farms.data.length === 0)
      gate = user?.farmerVerified ? <FarmSetup /> : <p className="max-w-xl text-on-surface-variant">Once an admin verifies you, set up your farm here and list what you grow.</p>
  }

  const setTab = (t: Tab) => navigate(`/farmer/${t}`)

  return (
    <div>
      <div className="mb-8 flex flex-col gap-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-headline-xl text-headline-xl tracking-tight text-on-surface">Listings & Orders</h1>
              <span className="flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-label-sm tracking-wider text-primary uppercase">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary"></span>
                Live Hub
              </span>
            </div>
            <p className="max-w-2xl text-body-md text-on-surface-variant">
              Produce currently listed for sale, farm-gate lot inspection statuses, packing queues, and automated escrow payouts.
            </p>
          </div>
          <button
            hidden={gate !== null}
            onClick={() => {
              setEditorError(undefined)
              setEditing('new')
            }}
            className="flex h-12 items-center gap-2 rounded-xl bg-primary-container px-6 text-label-lg text-on-primary-container shadow-[0_0_24px_rgba(46,196,122,0.2)] transition-all hover:bg-primary"
          >
            <span className="material-symbols-outlined text-[20px]">add_circle</span>
            <span>Add a listing</span>
          </button>
        </div>

        {gate === null && (<>
        {/* Metrics */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="relative flex flex-col justify-between overflow-hidden rounded-xl bg-surface-container p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-2">
              <span className="text-label-sm tracking-wider text-on-surface-variant uppercase">
                Paid out to you ({payouts.data?.items.length ?? 0} completed)
              </span>
              <span className="flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-label-sm text-primary">
                <span className="material-symbols-outlined text-[14px]">check_circle</span>
                Settled
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-headline-xl text-headline-xl text-secondary">{rupees(payouts.data?.total ?? money.earned)}</span>
              <span className="text-label-sm text-on-surface-variant">INR • Direct to Bank</span>
            </div>
            <div className="mt-3 flex items-center justify-between pt-3 text-label-sm text-on-surface-variant">
              <span>{payouts.data?.items[0] ? `Last payout ${day(payouts.data.items[0].paidAt)}` : 'Paid when an order is delivered'}</span>
            </div>
          </div>

          <div className="relative flex flex-col justify-between overflow-hidden rounded-xl bg-surface-container p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-2">
              <span className="text-label-sm tracking-wider text-on-surface-variant uppercase">On the way (escrow held)</span>
              <span className="flex items-center gap-1 rounded-full bg-secondary/15 px-2 py-0.5 text-label-sm text-secondary">
                <span className="material-symbols-outlined text-[14px]">lock_clock</span>
                Escrow Held
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-headline-xl text-headline-xl text-secondary">{rupees(money.pending)}</span>
              <span className="text-label-sm text-on-surface-variant">INR • {shipping} pending shipments</span>
            </div>
            <div className="mt-3 flex items-center justify-between pt-3 text-label-sm text-on-surface-variant">
              <span>Releases upon delivery</span>
              <span className="flex items-center gap-1 text-label-md text-secondary">Next: Tomorrow 11:00 AM</span>
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-xl bg-surface-container p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-2">
              <span className="text-label-sm tracking-wider text-on-surface-variant uppercase">Stock & Freshness</span>
              <span className="rounded-full bg-surface-container-high px-2 py-0.5 text-label-sm text-on-surface">{farms.data?.[0]?.name ?? 'Farm'}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-surface-container-low p-3">
                <span className="mb-1 block text-label-sm text-on-surface-variant">Lots In Stock</span>
                <span className="font-headline-sm text-headline-sm font-bold text-on-surface">{inStock} / {live.length}</span>
              </div>
              <div className="rounded-lg bg-surface-container-low p-3">
                <span className="mb-1 block text-label-sm text-on-surface-variant">Harvest Age</span>
                <span className="font-headline-sm text-headline-sm font-bold text-primary">~{ageDays.toFixed(1)} Days</span>
              </div>
            </div>
          </div>
        </div>
        </>)}
      </div>

      {gate}

      {/* Tabs Switcher */}
      {gate === null && <div className="mb-6 flex flex-col justify-between gap-4 pb-2 lg:flex-row lg:items-center">
        <div role="tablist" className="flex max-w-fit items-center rounded-xl bg-surface-container p-1 shadow-inner">
          <button
            role="tab"
            aria-selected={initialTab === 'listings'}
            onClick={() => setTab('listings')}
            className={`flex items-center gap-2.5 rounded-lg px-5 py-2.5 text-label-lg transition-all ${initialTab === 'listings' ? 'bg-primary-container font-bold text-on-primary-container shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
            <span className="material-symbols-outlined text-[18px]">inventory_2</span>
            <span>Produce Listings</span>
            <span className="rounded-full bg-on-primary-container/20 px-2 py-0.5 text-label-sm">{live.length}</span>
          </button>
          <button
            role="tab"
            aria-selected={initialTab === 'orders'}
            onClick={() => setTab('orders')}
            className={`flex items-center gap-2.5 rounded-lg px-5 py-2.5 text-label-lg transition-all ${initialTab === 'orders' ? 'bg-primary-container font-bold text-on-primary-container shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
            <span className="material-symbols-outlined text-[18px]">shopping_basket</span>
            <span>Orders to Pack</span>
            <span className="rounded-full bg-surface-container-highest px-2 py-0.5 text-label-sm font-bold text-secondary">{toPack.length} Ready</span>
          </button>
        </div>
      </div>}

      {gate === null && initialTab === 'listings' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between px-2">
            <span className="text-label-sm tracking-wider text-on-surface-variant uppercase">Active Inventory Catalogue ({live.filter((l) => l.status === 'ACTIVE').length} on sale)</span>
            <span className="text-label-sm text-on-surface-variant">Live Stock Synchronization: Enabled</span>
          </div>
          <ul aria-label="Your farms" className="flex flex-wrap gap-x-6 gap-y-1 px-2 text-on-surface">
            {(farms.data ?? []).map((f) => (
              <li key={f.id} className="flex flex-wrap items-center gap-x-2">
                <span className="font-semibold">{f.name}</span>
                <Rating value={f.rating} count={f.ratingCount ?? 0} />
              </li>
            ))}
          </ul>
          {listings.isPending && <p className="text-on-surface-variant">Loading your listings…</p>}
          {listings.isError && <p role="alert" className="font-semibold text-error">Could not load your listings. Refresh to try again.</p>}
          {listings.isSuccess && live.length === 0 && (
            <div className="rounded-xl bg-surface-container p-6">
              <h2 className="font-headline-sm text-headline-sm">Put your first produce up for sale</h2>
              <p className="mt-1 text-on-surface-variant">Add the crop, how much you have, your price and a photo taken at the farm. Customers nearby see it straight away.</p>
            </div>
          )}
          {live.length > 0 && <ul aria-label="Your listings" className="grid grid-cols-1 gap-3.5">
            {live.map((l) => (
              <li key={l.id}>
              <ListingRow
                listing={l}
                tag={TAG[categoryOf(l.cropId, crops.data)] ?? 'Veg'}
                onEdit={() => {
                  setEditorError(undefined)
                  setEditing(l)
                }}
              />
              </li>
            ))}
          </ul>}
        </div>
      )}

      {initialTab === 'orders' && <OrdersPage />}

      {/* Add / edit listing slide-over */}
      {editing !== null && (
        <div className="fixed inset-0 z-[1500] flex justify-end bg-surface-container-lowest/70 backdrop-blur-sm">
          <div className="flex-1 cursor-pointer" onClick={() => setEditing(null)}></div>
          <div className="flex h-full w-full max-w-xl flex-col overflow-y-auto bg-surface-container p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b border-surface-variant/40 pb-4">
              <div>
                <h2 className="font-headline-sm text-headline-sm text-on-surface">{editing === 'new' ? 'New Produce Listing' : 'Edit Listing'}</h2>
                <span className="text-label-sm text-on-surface-variant">Post harvest lot for direct buyer orders</span>
              </div>
              <button onClick={() => setEditing(null)} aria-label="Close" className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-container-high text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <ListingEditor
              key={editing === 'new' ? 'new' : editing.id}
              farms={farms.data ?? []}
              crops={crops.data ?? []}
              listing={editing === 'new' ? null : editing}
              initialError={editorError}
              onSaved={(text) => {
                setEditing(null)
                setEditorError(undefined)
                notify(text)
              }}
              onSwitchToEdit={(l, error) => {
                setEditing(l)
                setEditorError(error)
              }}
              onCancel={() => setEditing(null)}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function ListingRow({ listing: l, tag, onEdit }: { listing: Listing; tag: string; onEdit: () => void }) {
  const queryClient = useQueryClient()
  const notify = useToast()
  const photo = useProducePhoto(l.id, l.mediaIds)
  const [confirm, setConfirm] = useState(false)
  const update = useMutation({
    mutationFn: (qty: number) => catalogApi.updateListing(l.id, { qtyAvailable: qty }),
    onSuccess: (fresh) => {
      queryClient.setQueryData<Listing[]>(['listings', 'mine'], (old) => old?.map((x) => (x.id === fresh.id ? fresh : x)))
      notify(`Updated stock of ${fresh.cropName} to ${fresh.qtyAvailable}`)
    },
    onError: (e) => notify(message(e)),
  })
  const remove = useMutation({
    mutationFn: () => catalogApi.removeListing(l.id),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['listings', 'mine'] }),
    onError: (e) => notify(message(e)),
  })
  const status = l.status === 'ACTIVE' ? 'On sale' : l.status === 'PAUSED' ? 'Paused' : 'Sold out'
  const adjust = (delta: number) => update.mutate(Math.max(0, l.qtyAvailable + delta))

  return (
    <article className="group flex flex-col items-start justify-between gap-4 rounded-xl bg-surface-container p-4 shadow-sm transition-all hover:bg-surface-container-high/80 md:flex-row md:items-center">
      <div className="flex min-w-0 items-center gap-4">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-surface-container-lowest">
          {photo.thumbUrl ? (
            <img className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" alt={l.cropName} src={photo.thumbUrl} />
          ) : (
            <span aria-hidden className="grid h-full w-full place-items-center text-3xl">{cropLook(l.cropId).emoji}</span>
          )}
          <span className="absolute right-1 bottom-1 rounded bg-surface-container-lowest/80 px-1.5 py-0.5 text-label-sm text-on-surface-variant backdrop-blur">{tag}</span>
        </div>
        <div className="flex min-w-0 flex-col">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <h3 className="truncate font-headline-sm text-headline-sm text-on-surface">
              {l.cropName}
              {l.variety ? `, ${l.variety}` : ''}
            </h3>
            <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-label-sm ${l.status === 'ACTIVE' ? 'bg-primary/10 text-primary' : 'bg-surface-container-highest text-on-surface-variant'}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${l.status === 'ACTIVE' ? 'bg-primary' : 'bg-outline'}`}></span>
              {status}
            </span>
            {isLowStock(l) && <span className="rounded-full bg-secondary/15 px-2 py-0.5 text-label-sm text-secondary">Low stock</span>}
          </div>
          {isLowStock(l) && <p className="mb-1 text-body-sm text-secondary">Only {l.qtyAvailable} {l.unit} left. Add stock before it sells out.</p>}
          <div className="flex items-center gap-3 text-body-sm text-on-surface-variant">
            <span className="text-body-xl font-bold text-secondary">{rupees(l.pricePerUnit)}</span>
            <span>/ {l.unit}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px]">event</span> {day(l.harvestDate)}
            </span>
          </div>
        </div>
      </div>

      <div className="flex w-full shrink-0 items-center justify-between gap-6 border-t border-surface-variant/30 pt-3 md:w-auto md:justify-end md:border-t-0 md:pt-0">
        <div className="flex flex-col">
          <span className="mb-1 text-label-sm text-on-surface-variant">In stock ({l.unit})</span>
          <div className="flex items-center rounded-lg bg-surface-container-lowest p-1">
            <button aria-label="Decrease stock" disabled={update.isPending} onClick={() => adjust(-1)} className="flex h-7 w-7 items-center justify-center rounded text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface">
              <span className="material-symbols-outlined text-[16px]">remove</span>
            </button>
            <span className="w-16 bg-transparent text-center text-label-lg text-on-surface">{l.qtyAvailable}</span>
            <button aria-label="Increase stock" disabled={update.isPending} onClick={() => adjust(1)} className="flex h-7 w-7 items-center justify-center rounded text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface">
              <span className="material-symbols-outlined text-[16px]">add</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={onEdit} className="h-9 rounded-lg bg-surface-container-high px-3 text-label-md text-on-surface transition-colors hover:bg-surface-bright">Edit</button>
          {l.status !== 'PAUSED' ? (
            <button onClick={() => catalogApi.updateListing(l.id, { status: 'PAUSED' }).then(() => queryClient.invalidateQueries({ queryKey: ['listings', 'mine'] }))} className="h-9 rounded-lg bg-surface-container-high px-3 text-label-md text-on-surface transition-colors hover:bg-surface-bright">Pause</button>
          ) : (
            <button onClick={() => catalogApi.updateListing(l.id, { status: 'ACTIVE' }).then(() => queryClient.invalidateQueries({ queryKey: ['listings', 'mine'] }))} className="h-9 rounded-lg bg-surface-container-high px-3 text-label-md text-primary transition-colors hover:bg-surface-bright">Resume</button>
          )}
          <button
            aria-label={confirm ? 'Confirm remove' : 'Remove listing'}
            onClick={() => (confirm ? remove.mutate() : setConfirm(true))}
            onBlur={() => setConfirm(false)}
            className={`flex h-9 items-center justify-center rounded-lg transition-colors ${confirm ? 'bg-error-container px-3 text-error' : 'w-9 bg-surface-container-high text-on-surface-variant hover:bg-error-container hover:text-error'}`}
          >
            {confirm ? <span className="text-label-md">Remove?</span> : <span className="material-symbols-outlined text-[18px]">delete</span>}
          </button>
        </div>
      </div>
    </article>
  )
}
