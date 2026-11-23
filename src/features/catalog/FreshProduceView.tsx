import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { cartStore, type Produce as CartProduce } from '@/features/shop/shop'
import { searchPlaces } from '@/api/geocode'
import { useToast } from '@/components/Toast'
import {
  PLACES,
  type Produce,
  catalogApi,
  categoryOf,
  deliveryEstimate,
  formatKm,
  freshness,
} from './catalog'
import { sampleProduce, SAMPLE_FARMERS } from './sample'
import { useProducePhoto } from './useProducePhoto'

type Place = { name: string; lat: number; lng: number }

const TABS = [
  { key: 'all', label: 'All produce' },
  { key: 'vegetables', label: 'Vegetables' },
  { key: 'fruits', label: 'Orchard fruits' },
  { key: 'grains', label: 'Whole grains' },
]

/** Prototype categories: leafy greens count as vegetables; pulses, spices and oilseeds only appear under "All". */
function tabOf(category: string) {
  if (category === 'vegetable' || category === 'leafy') return 'vegetables'
  if (category === 'fruit') return 'fruits'
  if (category === 'grain') return 'grains'
  return 'other'
}

function Photo({ item, className, big = false }: { item: Produce; className: string; big?: boolean }) {
  const photo = useProducePhoto(item.id, item.mediaIds)
  const src = big ? photo.url : photo.thumbUrl
  if (!src) {
    return (
      <div className={`${className} grid place-items-center bg-surface-container text-5xl`} aria-hidden>
        🌱
      </div>
    )
  }
  return <img className={className} alt={item.cropName} src={src} loading="lazy" />
}

export function FreshProduceView() {
  const notify = useToast()
  const navigate = useNavigate()
  const addToCart = (item: Produce, qty: number, goToCart: boolean) => {
    if (offline) return notify('Showing sample produce. Real listings can be added to the cart once the server is reachable.')
    cartStore.add(
      { ...item, farmRating: null, farmRatingCount: 0, mediaIds: item.mediaIds ?? [], createdAt: item.updatedAt, unit: item.unit as CartProduce['unit'] },
      qty,
    )
    if (goToCart) navigate('/customer/cart')
    else notify(`${item.cropName} added to your cart.`)
  }
  const [category, setCategory] = useState('all')
  const [organicOnly, setOrganicOnly] = useState(false)
  const [drawerQty, setDrawerQty] = useState(5)
  const [searchTerm, setSearchTerm] = useState('')
  const [place, setPlace] = useState<Place>(PLACES[0])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const search = useQuery({
    queryKey: ['catalog', 'search', place.lat, place.lng, 100, false, 'distance'],
    queryFn: () => catalogApi.search({ lat: place.lat, lng: place.lng, radiusKm: 100, sort: 'distance' }),
    retry: false,
  })
  const crops = useQuery({ queryKey: ['catalog', 'crops'], queryFn: catalogApi.crops, staleTime: Infinity, retry: false })

  const offline = search.isError
  const all: Produce[] = useMemo(
    () => (offline ? sampleProduce(place.lat, place.lng) : (search.data ?? [])),
    [offline, search.data, place.lat, place.lng],
  )
  const rows = useMemo(
    () =>
      all.map((item) => {
        const cat = categoryOf(item.cropId, crops.data)
        return {
          item,
          tab: tabOf(cat),
          fresh: freshness(item.harvestDate, cat),
          delivery: deliveryEstimate(item.distanceM, item.harvestDate),
        }
      }),
    [all, crops.data],
  )
  const filtered = rows.filter((r) => {
    if (organicOnly && !r.item.isOrganic) return false
    if (category !== 'all' && r.tab !== category) return false
    if (searchTerm && !r.item.cropName.toLowerCase().includes(searchTerm.toLowerCase())) return false
    return true
  })

  const selected = filtered.find((r) => r.item.id === selectedId) ?? filtered[0]
  const farms = new Set(all.map((i) => i.farmId)).size
  const districts = new Set(all.map((i) => i.district)).size
  const tomorrow = rows.filter((r) => r.delivery.maxDays === 1).length
  const peak = rows.filter((r) => r.fresh.tone === 'peak').length
  const nearest = filtered.length ? Math.min(...filtered.map((r) => r.item.distanceM)) : null
  const count = (key: string) => (key === 'all' ? rows.length : rows.filter((r) => r.tab === key).length)

  async function findPlace() {
    const q = searchTerm.trim()
    if (q.length < 3) return notify('Type a village, town or address first.')
    setBusy(true)
    try {
      const [hit] = await searchPlaces(q)
      if (!hit) return notify('No place found. Try a nearby town.')
      setPlace({ name: hit.name.split(',').slice(0, 2).join(',').trim(), lat: hit.lat, lng: hit.lng })
      setSearchTerm('')
      setCategory('all')
    } catch {
      notify('Place search is unavailable. Check your internet connection.')
    } finally {
      setBusy(false)
    }
  }

  function nearMe() {
    if (!navigator.geolocation) return notify('This browser cannot share your location.')
    navigator.geolocation.getCurrentPosition(
      (pos) => setPlace({ name: 'My location', lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => notify('Could not get your location.'),
      { timeout: 10_000 },
    )
  }

  function nextPlace() {
    const i = PLACES.findIndex((p) => p.name === place.name)
    setPlace(PLACES[(i + 1) % PLACES.length]!)
  }

  const sel = selected?.item
  const lot = (id: string) => `Lot #${id.slice(0, 4).toUpperCase()}`

  return (
    <div className="flex w-full flex-col">
      {/* Editorial header zone */}
      <section className="mx-auto w-full max-w-[1440px] px-6 pt-12 pb-8 lg:px-12">
        <div className="mb-3 flex items-center gap-2.5">
          <span className="flex items-center gap-2 text-xs font-medium tracking-[0.2em] text-on-surface-variant uppercase">
            <span className="size-1.5 rounded-full bg-primary" />
            Direct Harvest Stream
          </span>
          <span className="text-xs text-outline/60">/</span>
          <span className="text-xs tracking-wider text-on-surface-variant">Live listings from verified farms</span>
        </div>
        <div className="flex flex-col justify-between gap-6 border-b border-border pb-8 lg:flex-row lg:items-end">
          <div className="max-w-3xl">
            <h1 className="font-serif text-4xl leading-[1.08] font-normal tracking-tight text-on-surface sm:text-5xl lg:text-6xl">
              What farmers near you are offering today.
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-relaxed font-light text-on-surface-variant sm:text-lg">
              Transparent harvest timestamps, exact field origin, and direct dispatch straight to your pantry.
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-start gap-4 text-sm sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 text-on-surface-variant">
              <span className="size-2 rounded-full bg-primary" />
              <span className="font-medium text-on-surface">{rows.length} active lots</span>
              <span>ready for transit</span>
            </div>
            <span className="hidden text-outline/50 sm:inline">•</span>
            <span className="text-xs tracking-wider text-on-surface-variant">Next dispatch in 4 hrs</span>
          </div>
        </div>

        {offline && (
          <p role="status" className="mt-6 rounded-xl border border-border bg-surface-card px-4 py-3 text-xs text-secondary">
            <strong>Showing sample produce.</strong> The live catalog could not be reached.
          </p>
        )}

        {/* Telemetry */}
        <div className="grid grid-cols-2 gap-4 border-b border-border py-6 md:grid-cols-4">
          {[
            { label: 'Available Lots', value: rows.length, note: 'harvest batches' },
            { label: 'Partner Farms', value: farms, note: districts === 1 ? 'family holdings' : `across ${districts} districts` },
            { label: 'Delivering Tomorrow', value: tomorrow, note: 'scheduled runs' },
            { label: 'Peak Fresh (<48h)', value: peak, note: 'field packed' },
          ].map((t) => (
            <div key={t.label} className="flex flex-col">
              <span className="mb-1 text-xs tracking-wider text-on-surface-variant uppercase">{t.label}</span>
              <span className="font-serif text-2xl text-on-surface">
                {t.value} <span className="font-sans text-xs font-normal text-on-surface-variant">{t.note}</span>
              </span>
            </div>
          ))}
        </div>

        {/* Filter bar */}
        <div className="space-y-4 pt-6">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute top-1/2 left-4 -translate-y-1/2 text-lg text-on-surface-variant">search</span>
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void findPlace()
                }}
                aria-label="Search produce or a place"
                className="h-11 w-full rounded-xl border border-border bg-surface pr-4 pl-11 text-sm text-on-surface transition-colors placeholder:text-on-surface-variant/70 focus:border-primary focus:outline-none"
                placeholder="Search heirloom tomatoes, winter carrots, or a village near you..."
                type="text"
              />
            </div>
            <div className="flex items-center gap-2 overflow-x-auto">
              <button
                onClick={() => void findPlace()}
                disabled={busy}
                className="flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-xs font-medium whitespace-nowrap text-on-primary transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                <span className="material-symbols-outlined text-[16px]">search</span>
                <span>{busy ? 'Searching…' : 'Search Lots'}</span>
              </button>
              <button onClick={nextPlace} title="Change place" className="flex h-11 items-center gap-2 rounded-xl border border-border bg-surface px-4 text-xs font-medium whitespace-nowrap text-on-surface transition-colors hover:border-outline">
                <span className="material-symbols-outlined text-[16px] text-primary">location_on</span>
                <span>{place.name} (100 km)</span>
                <span className="material-symbols-outlined text-[14px] text-on-surface-variant">expand_more</span>
              </button>
              <button onClick={nearMe} className="flex h-11 items-center gap-2 rounded-xl border border-border bg-surface px-4 text-xs font-medium whitespace-nowrap text-on-surface transition-colors hover:border-outline">
                <span className="material-symbols-outlined text-[16px] text-on-surface-variant">my_location</span>
                <span>Near me</span>
              </button>
              <label className="flex h-11 cursor-pointer items-center gap-2 rounded-xl border border-border bg-surface px-4 text-xs whitespace-nowrap text-on-surface transition-colors select-none hover:border-outline">
                <input type="checkbox" checked={organicOnly} onChange={(e) => setOrganicOnly(e.target.checked)} className="size-3.5 rounded accent-primary" />
                <span>Organic certified only</span>
              </label>
            </div>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setCategory(tab.key)}
                className={`rounded-full px-3.5 py-1.5 whitespace-nowrap transition-all ${
                  category === tab.key ? 'bg-primary font-medium text-on-primary' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                }`}
              >
                {tab.label} ({count(tab.key)})
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Grid and inspection panel */}
      <section className="mx-auto w-full max-w-[1440px] px-6 pb-24 lg:px-12">
        <div className="flex items-center gap-2 pb-4 text-xs text-on-surface-variant">
          <span className="font-semibold text-on-surface">{filtered.length} listings</span>
          <span>near</span>
          <span className="font-semibold text-primary">{place.name}</span>
          {nearest !== null && <span>• nearest farm is {formatKm(nearest)} away</span>}
        </div>

        {search.isPending && <p className="py-16 text-center text-on-surface-variant">Loading produce…</p>}
        {!search.isPending && filtered.length === 0 && (
          <div className="rounded-2xl border border-border bg-surface-card p-12 text-center">
            <p className="font-serif text-2xl">Nothing matches yet</p>
            <p className="mt-2 text-sm text-on-surface-variant">Try another place, clear the search, or switch off “Organic only”.</p>
          </div>
        )}

        {filtered.length > 0 && (
          <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-12">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:col-span-7 xl:col-span-8">
              {filtered.map(({ item, fresh, delivery }) => {
                const isSel = sel?.id === item.id
                return (
                  <article
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                    className={`group flex cursor-pointer flex-col overflow-hidden rounded-2xl border bg-surface-card transition-all duration-300 ${
                      isSel ? 'border-2 border-primary/60' : 'border-border hover:border-outline'
                    }`}
                  >
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-container">
                      <Photo item={item} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
                      <div className="absolute top-3 left-3">
                        <span className="rounded-full border border-border bg-surface/90 px-2.5 py-1 text-[11px] font-medium text-on-surface backdrop-blur-md">
                          {fresh.label}
                        </span>
                      </div>
                      {item.isOrganic && (
                        <div className="absolute top-3 right-3">
                          <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold tracking-wider text-on-primary uppercase">Organic</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col justify-between p-5">
                      <div>
                        <div className="mb-1 flex items-baseline justify-between gap-2">
                          <h3 className="font-serif text-xl font-normal text-on-surface">
                            {item.variety ? `${item.cropName}, ${item.variety}` : item.cropName}
                          </h3>
                          <span className="shrink-0 text-xs text-on-surface-variant">{lot(item.id)}</span>
                        </div>
                        <p className="text-xs font-light text-on-surface-variant">
                          {item.farmName}, {item.village ?? item.district} • {formatKm(item.distanceM)}
                        </p>
                        <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-xs text-on-surface-variant">
                          <span className="flex items-center gap-1.5">
                            <span className="size-1.5 rounded-full bg-primary" />
                            {item.isOrganic ? 'Organically farmed' : 'Field graded'}
                          </span>
                          <span>
                            {delivery.label}, {delivery.by.replace('Arrives ', '')}
                          </span>
                        </div>
                      </div>
                      <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                        <div>
                          <span className="font-serif text-2xl text-on-surface">₹{item.pricePerUnit.toLocaleString('en-IN')}</span>
                          <span className="text-xs font-light text-on-surface-variant"> / {item.unit}</span>
                          <span className="block text-[11px] text-on-surface-variant">
                            {item.qtyAvailable} {item.unit} available
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedId(item.id)
                            }}
                            className={`h-9 rounded-xl px-4 text-xs font-medium transition-colors ${
                              isSel ? 'bg-primary text-on-primary' : 'border border-border text-on-surface hover:border-outline'
                            }`}
                          >
                            {isSel ? 'Selected' : 'Inspect Lot'}
                          </button>
                          <button
                            aria-label={`Add ${item.cropName} to cart`}
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedId(item.id)
                              addToCart(item, 1, false)
                            }}
                            className="flex size-9 items-center justify-center rounded-xl border border-border text-on-surface-variant transition-colors hover:border-outline hover:text-on-surface"
                          >
                            <span className="material-symbols-outlined text-base">add_shopping_cart</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>

            {/* Batch inspection panel */}
            {sel && selected && (
              <aside className="sticky top-28 flex flex-col gap-6 rounded-2xl border border-border bg-surface-card p-7 lg:col-span-5 xl:col-span-4">
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <div>
                    <span className="text-[11px] font-medium tracking-widest text-on-surface-variant uppercase">Batch Inspection</span>
                    <p className="mt-0.5 font-mono text-xs text-on-surface">{lot(sel.id).toUpperCase()} • AUDIT #{sel.id.slice(4, 8).toUpperCase()}</p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-[11px] text-on-surface">
                    <span className="size-1.5 rounded-full bg-primary" />
                    {sel.isOrganic ? 'Verified organic' : 'Farm verified'}
                  </span>
                </div>

                <div>
                  <div className="relative mb-4 aspect-[16/10] overflow-hidden rounded-xl bg-surface-container">
                    <Photo item={sel} big className="h-full w-full object-cover" />
                  </div>
                  <h2 className="font-serif text-3xl leading-tight font-normal text-on-surface">
                    {sel.variety ? `${sel.variety} ${sel.cropName}` : sel.cropName}
                  </h2>
                  <p className="mt-1.5 text-sm leading-relaxed font-light text-on-surface-variant">
                    {sel.description ?? `Picked fresh at ${sel.farmName}. ${selected.fresh.detail}.`}
                  </p>
                </div>

                <div className="flex items-center justify-between border-y border-border py-4">
                  <div className="flex items-center gap-3">
                    <div className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-full border border-border bg-surface font-serif text-lg text-primary">
                      {(SAMPLE_FARMERS[sel.farmerId] ?? sel.farmName).charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-on-surface">{SAMPLE_FARMERS[sel.farmerId] ?? sel.farmName}</p>
                      <p className="text-xs font-light text-on-surface-variant">
                        {sel.farmName} • {formatKm(sel.distanceM)} away
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="block font-mono text-xs font-medium text-on-surface">Verified</span>
                    <span className="text-[11px] text-on-surface-variant">{sel.village ?? sel.district}</span>
                  </div>
                </div>

                <div>
                  <span className="mb-3 block text-[11px] font-medium tracking-wider text-on-surface-variant uppercase">Field Verification</span>
                  <div className="grid grid-cols-3 gap-2.5">
                    {[
                      ['Farming', sel.isOrganic ? 'Organic' : 'Standard', sel.isOrganic ? 'Pesticide free' : 'Field graded'],
                      ['Since harvest', selected.fresh.ageDays < 0 ? 'Soon' : `${selected.fresh.ageDays}d`, selected.fresh.label],
                      ['Inspection', sel.grade ? `Grade ${sel.grade}` : 'Ungraded', 'Lab validated'],
                    ].map(([k, v, n]) => (
                      <div key={k} className="rounded-xl border border-border bg-surface p-3">
                        <span className="block text-[11px] text-on-surface-variant">{k}</span>
                        <span className="mt-0.5 block font-serif text-lg text-on-surface">{v}</span>
                        <span className="text-[10px] font-light text-on-surface-variant">{n}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="mb-3 block text-[11px] font-medium tracking-wider text-on-surface-variant uppercase">Transit Chain</span>
                  <div className="ml-1 space-y-3 border-l border-border pl-2 text-xs">
                    {[
                      ['bg-primary', 'Harvested at dawn', `${selected.fresh.detail} • ${sel.village ?? sel.district} field`],
                      ['bg-primary', 'Washed & crated', `${sel.farmName} packhouse`],
                      ['bg-outline', 'Scheduled doorstep drop', `${selected.delivery.label}, ${selected.delivery.by.replace('Arrives ', '')}`],
                    ].map(([dot, t, sub]) => (
                      <div key={t} className="relative pl-3">
                        <div className={`absolute top-1 -left-[19px] size-1.5 rounded-full ${dot}`} />
                        <span className="block font-medium text-on-surface">{t}</span>
                        <span className="text-[11px] text-on-surface-variant">{sub}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 border-t border-border pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-serif text-3xl text-on-surface">₹{sel.pricePerUnit.toLocaleString('en-IN')}</span>
                      <span className="text-xs font-light text-on-surface-variant"> / {sel.unit}</span>
                    </div>
                    <div className="flex items-center rounded-xl border border-border bg-surface p-1">
                      <button aria-label="Less" onClick={() => setDrawerQty((q) => Math.max(1, q - 1))} className="flex size-8 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface">
                        <span className="material-symbols-outlined text-sm">remove</span>
                      </button>
                      <span className="w-12 text-center font-mono text-xs font-semibold text-on-surface">
                        {drawerQty} {sel.unit}
                      </span>
                      <button aria-label="More" onClick={() => setDrawerQty((q) => q + 1)} className="flex size-8 items-center justify-center rounded-lg text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface">
                        <span className="material-symbols-outlined text-sm">add</span>
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => addToCart(sel, drawerQty, true)}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-medium text-on-primary transition-all hover:opacity-95 active:scale-[0.99]"
                  >
                    <span className="material-symbols-outlined text-base">shopping_bag</span>
                    <span>
                      Reserve {drawerQty} {sel.unit} • ₹{(drawerQty * sel.pricePerUnit).toLocaleString('en-IN')}
                    </span>
                  </button>
                  <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-on-surface-variant">
                    <span className="material-symbols-outlined text-xs text-primary">verified_user</span>
                    Field guarantee: 100% refund if not pristine on arrival
                  </p>
                </div>
              </aside>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
