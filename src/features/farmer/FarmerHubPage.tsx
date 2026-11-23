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

  const [filter, setFilter] = useState('')
  const [newest, setNewest] = useState(true)
  const shown = live
    .filter((l) => !filter || `${l.cropName} ${l.variety ?? ''}`.toLowerCase().includes(filter.toLowerCase()))
    .sort((a, b) => (newest ? 0 : a.cropName.localeCompare(b.cropName)))
  const kpi = 'rounded-lg border border-border bg-surface-card p-4'
  const kpiLabel = 'mb-1 text-[11px] font-medium tracking-wider text-on-surface-variant uppercase'

  return (
    <div>
      <div className="mb-8 flex flex-col justify-between gap-4 border-b border-border pb-6 sm:flex-row sm:items-baseline">
        <div>
          <h1 className="font-serif text-3xl font-medium tracking-tight text-on-surface">Listings &amp; Orders</h1>
          <p className="mt-1 text-sm text-on-surface-variant">Real-time produce lot inventory, packaging queue, and direct buyer settlements.</p>
        </div>
        <button
          hidden={gate !== null}
          onClick={() => {
            setEditorError(undefined)
            setEditing('new')
          }}
          className="flex h-9 shrink-0 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-xs font-medium tracking-wide text-white shadow-sm transition-colors hover:bg-emerald-500"
        >
          <span className="material-symbols-outlined text-[16px]">add</span>
          <span>Add a listing</span>
        </button>
      </div>

      {gate === null && (
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className={kpi}>
            <div className={kpiLabel}>Active Listings</div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold tracking-tight text-on-surface">{live.filter((l) => l.status === 'ACTIVE').length}</span>
              <span className="text-xs font-medium text-primary">{inStock} in stock</span>
            </div>
            <div className="mt-2 border-t border-border pt-2 text-xs text-on-surface-variant">
              {farms.data?.[0]?.name ?? 'Your farm'} • harvest age ~{ageDays.toFixed(1)} days
            </div>
          </div>
          <button type="button" onClick={() => setTab('orders')} className={`${kpi} text-left transition-colors hover:border-outline`}>
            <div className={kpiLabel}>Orders to Pack</div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold tracking-tight text-on-surface">{toPack.length}</span>
              <span className="text-xs font-medium text-secondary">Waiting for you</span>
            </div>
            <div className="mt-2 border-t border-border pt-2 text-xs text-on-surface-variant">{shipping} more on the way to customers</div>
          </button>
          <div className={kpi}>
            <div className={kpiLabel}>Paid out to you</div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold tracking-tight text-on-surface">{rupees(payouts.data?.total ?? money.earned)}</span>
              <span className="text-xs text-on-surface-variant">INR</span>
            </div>
            <div className="mt-2 border-t border-border pt-2 text-xs text-on-surface-variant">
              {rupees(money.pending)} in transit • {payouts.data?.items[0] ? `last payout ${day(payouts.data.items[0].paidAt)}` : 'released when an order is delivered'}
            </div>
          </div>
        </div>
      )}

      {gate}

      {/* Segmented tab switcher */}
      {gate === null && (
        <div className="mb-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div role="tablist" className="inline-flex rounded-lg border border-border bg-surface-container p-0.5">
            {([
              ['listings', 'Produce Listings', live.length],
              ['orders', 'Orders to Pack', toPack.length],
            ] as const).map(([key, label, n]) => (
              <button
                key={key}
                role="tab"
                aria-selected={initialTab === key}
                onClick={() => setTab(key)}
                className={`rounded-md px-3.5 py-1.5 text-xs font-medium transition-all ${initialTab === key ? 'bg-surface-card text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
              >
                {label} <span className="ml-1 opacity-70">{n}</span>
              </button>
            ))}
          </div>
          {initialTab === 'listings' && (
            <div className="flex items-center gap-2">
              <div className="relative w-56">
                <span className="material-symbols-outlined absolute top-2 left-2.5 text-[15px] text-on-surface-variant">search</span>
                <input
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  aria-label="Filter crops"
                  className="h-8 w-full rounded-md border border-border bg-surface-container pr-3 pl-8 text-xs text-on-surface placeholder:text-on-surface-variant/50 focus:border-primary focus:outline-none"
                  placeholder="Filter crops..."
                  type="text"
                />
              </div>
              <button
                type="button"
                onClick={() => setNewest((v) => !v)}
                className="flex h-8 items-center gap-1 rounded-md border border-border bg-surface-container px-2.5 text-xs text-on-surface-variant transition-colors hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[15px]">sort</span>
                <span>{newest ? 'Newest' : 'A to Z'}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {gate === null && initialTab === 'listings' && (
        <div className="flex flex-col gap-3">
          <ul aria-label="Your farms" className="flex flex-wrap gap-x-6 gap-y-1 px-1 text-xs text-on-surface">
            {(farms.data ?? []).map((f) => (
              <li key={f.id} className="flex flex-wrap items-center gap-x-2">
                <span className="font-semibold">{f.name}</span>
                <Rating value={f.rating} count={f.ratingCount ?? 0} />
              </li>
            ))}
          </ul>
          {listings.isPending && <p className="text-sm text-on-surface-variant">Loading your listings…</p>}
          {listings.isError && <p role="alert" className="text-sm font-semibold text-error">Could not load your listings. Refresh to try again.</p>}
          {listings.isSuccess && live.length === 0 && (
            <div className="rounded-lg border border-dashed border-border bg-surface-card p-6">
              <h2 className="font-serif text-xl">Put your first produce up for sale</h2>
              <p className="mt-1 text-sm text-on-surface-variant">Add the crop, how much you have, your price and a photo taken at the farm. Customers nearby see it straight away.</p>
            </div>
          )}
          {shown.length > 0 && (
            <ul aria-label="Your listings" className="divide-y divide-border overflow-hidden rounded-lg border border-border">
              {shown.map((l) => (
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
            </ul>
          )}
        </div>
      )}

      {initialTab === 'orders' && <OrdersPage />}

      {/* Add / edit listing slide-over */}
      {editing !== null && (
        <div className="fixed inset-0 z-[1500] flex justify-end bg-black/60 backdrop-blur-xs">
          <div className="flex-1 cursor-pointer" onClick={() => setEditing(null)}></div>
          <div className="flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-border bg-surface-card p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between border-b border-border pb-3">
              <div>
                <h2 className="text-base font-semibold text-on-surface">{editing === 'new' ? 'New Produce Listing' : 'Edit Listing'}</h2>
                <span className="text-label-sm text-on-surface-variant">Post harvest lot for direct buyer orders</span>
              </div>
              <button onClick={() => setEditing(null)} aria-label="Close" className="flex size-7 items-center justify-center rounded text-on-surface-variant hover:bg-surface-container hover:text-on-surface">
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
    <article className="flex flex-col justify-between gap-4 bg-surface-card p-4 transition-colors hover:bg-surface-container md:flex-row md:items-center">
      <div className="flex min-w-0 items-center gap-3.5">
        <div className="relative size-12 shrink-0 overflow-hidden rounded-md border border-border bg-surface-container">
          {photo.thumbUrl ? (
            <img className="h-full w-full object-cover" alt={l.cropName} src={photo.thumbUrl} />
          ) : (
            <span aria-hidden className="grid h-full w-full place-items-center text-xl">{cropLook(l.cropId).emoji}</span>
          )}
        </div>
        <div className="flex min-w-0 flex-col">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-sm font-medium text-on-surface">
              {l.cropName}
              {l.variety ? `, ${l.variety}` : ''}
            </h3>
            <span className={`size-1.5 rounded-full ${l.status === 'ACTIVE' ? 'bg-primary' : 'bg-outline'}`} title={status} />
            <span className="text-[11px] text-on-surface-variant">{status}</span>
            {isLowStock(l) && <span className="rounded-full bg-secondary/15 px-2 py-0.5 text-[11px] text-secondary">Low stock</span>}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-on-surface-variant">
            <span className="font-medium text-on-surface">{rupees(l.pricePerUnit)} / {l.unit}</span>
            <span>•</span>
            <span>Harvested {day(l.harvestDate)}</span>
            <span>•</span>
            <span>{tag}</span>
          </div>
          {isLowStock(l) && <p className="mt-0.5 text-[11px] text-secondary">Only {l.qtyAvailable} {l.unit} left. Add stock before it sells out.</p>}
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-between gap-6 border-t border-border pt-2 md:justify-end md:border-t-0 md:pt-0">
        <div className="flex items-center gap-2">
          <span className="text-xs text-on-surface-variant">Available:</span>
          <div className="flex items-center rounded-md border border-border bg-surface p-0.5">
            <button aria-label="Decrease stock" disabled={update.isPending} onClick={() => adjust(-1)} className="flex size-6 items-center justify-center rounded text-on-surface-variant transition-colors hover:text-on-surface">
              <span className="material-symbols-outlined text-[14px]">remove</span>
            </button>
            <span className="w-12 text-center text-xs font-medium text-on-surface">{l.qtyAvailable}</span>
            <button aria-label="Increase stock" disabled={update.isPending} onClick={() => adjust(1)} className="flex size-6 items-center justify-center rounded text-on-surface-variant transition-colors hover:text-on-surface">
              <span className="material-symbols-outlined text-[14px]">add</span>
            </button>
          </div>
          <span className="text-xs text-on-surface-variant">{l.unit}</span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <button onClick={onEdit} className="font-medium text-on-surface-variant hover:text-on-surface hover:underline">Edit</button>
          {l.status !== 'PAUSED' ? (
            <button onClick={() => catalogApi.updateListing(l.id, { status: 'PAUSED' }).then(() => queryClient.invalidateQueries({ queryKey: ['listings', 'mine'] }))} className="font-medium text-on-surface-variant hover:text-on-surface hover:underline">Pause</button>
          ) : (
            <button onClick={() => catalogApi.updateListing(l.id, { status: 'ACTIVE' }).then(() => queryClient.invalidateQueries({ queryKey: ['listings', 'mine'] }))} className="font-medium text-primary hover:underline">Resume</button>
          )}
          <button
            aria-label={confirm ? 'Confirm remove' : 'Remove listing'}
            onClick={() => (confirm ? remove.mutate() : setConfirm(true))}
            onBlur={() => setConfirm(false)}
            className={`flex h-7 items-center justify-center rounded-md transition-colors ${confirm ? 'bg-error-container px-2 text-error' : 'w-7 text-on-surface-variant hover:text-error'}`}
          >
            {confirm ? <span className="text-xs">Remove?</span> : <span className="material-symbols-outlined text-[16px]">delete</span>}
          </button>
        </div>
      </div>
    </article>
  )
}
