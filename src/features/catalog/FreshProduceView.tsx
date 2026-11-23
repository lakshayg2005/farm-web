import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
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
  { key: 'vegetables', label: '🥕 Vegetables' },
  { key: 'fruits', label: '🥭 Fruits' },
  { key: 'grains', label: '🌾 Grains' },
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
      <div className={`${className} grid place-items-center bg-surface-container-high text-6xl`} aria-hidden>
        🌱
      </div>
    )
  }
  return <img className={className} alt={item.cropName} src={src} loading="lazy" />
}

function Segments({ score }: { score: number }) {
  const on = score > 0.66 ? 3 : score > 0.33 ? 2 : 1
  return (
    <div className="grid w-full grid-cols-3 gap-1">
      {[0, 1, 2].map((i) => (
        <div key={i} className={`h-1.5 rounded-full ${i < on ? 'bg-primary' : 'bg-surface-container-highest'}`} />
      ))}
    </div>
  )
}

export function FreshProduceView() {
  const notify = useToast()
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
      <section className="mx-auto w-full max-w-[1440px] px-6 pt-8 pb-6 lg:px-12">
        <div className="mb-2 flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-label-sm tracking-widest text-primary uppercase">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary"></span>
            Direct Farm Network
          </span>
          <span className="text-label-sm text-outline-variant">/</span>
          <span className="text-label-sm text-on-surface-variant">Live listings from verified farms</span>
        </div>

        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="font-display-lg text-display-lg leading-none tracking-tight text-on-surface">
              What farmers near you are offering.
            </h1>
            <p className="mt-3 max-w-2xl text-body-xl text-on-surface-variant">
              Every crop, how many days ago it was harvested, and exactly when it will reach your kitchen door.
            </p>
          </div>
          <div className="inline-flex items-center gap-2.5 self-start rounded-full border-0 bg-surface-container px-4 py-2 md:self-auto">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary"></span>
            </span>
            <span className="text-label-md text-on-surface">{rows.length} active lots ready for dispatch</span>
          </div>
        </div>

        {offline && (
          <p role="status" className="mb-6 rounded-xl bg-secondary/10 px-4 py-3 text-body-sm text-secondary">
            <strong>Showing sample produce.</strong> The live catalog could not be reached.
          </p>
        )}

        {/* Telemetry */}
        <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          {[
            { label: 'Listings', value: rows.length, icon: 'dataset', tone: 'text-primary', badge: 'Active', badgeTone: 'text-primary bg-primary/10' },
            { label: 'Farms', value: farms, icon: 'agriculture', tone: 'text-secondary', badge: `${districts} ${districts === 1 ? 'District' : 'Districts'}`, badgeTone: 'text-on-surface-variant bg-surface-container-high' },
            { label: 'Arrive Tomorrow', value: tomorrow, icon: 'local_shipping', tone: 'text-primary', badge: 'Next 18 hrs', badgeTone: 'text-primary bg-primary/10' },
            { label: 'Peak Fresh (<48h)', value: peak, icon: 'spa', tone: 'text-secondary', badge: 'Field Packed', badgeTone: 'text-secondary bg-secondary/10' },
          ].map((t) => (
            <div key={t.label} className="flex items-center justify-between rounded-xl bg-surface-container p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-surface-container-high ${t.tone}`}>
                  <span className="material-symbols-outlined text-2xl">{t.icon}</span>
                </div>
                <div>
                  <span className="block text-label-sm tracking-wider text-on-surface-variant uppercase">{t.label}</span>
                  <span className={`text-headline-md font-semibold ${t.label.startsWith('Peak') ? 'text-secondary' : 'text-on-surface'}`}>{t.value}</span>
                </div>
              </div>
              <span className={`rounded px-2 py-0.5 text-label-sm ${t.badgeTone}`}>{t.badge}</span>
            </div>
          ))}
        </div>

        {/* Filter and Category Strip */}
        <div className="space-y-3 rounded-2xl bg-surface-container-low p-3 shadow-md lg:p-4">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute top-1/2 left-4 -translate-y-1/2 text-xl text-outline">search</span>
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void findPlace()
                }}
                className="h-12 w-full rounded-xl bg-surface-container pr-4 pl-12 text-body-md text-on-surface shadow-inner placeholder:text-outline focus:ring-1 focus:ring-primary focus:outline-none"
                placeholder="Find produce near any village, town or address..."
                type="text"
              />
            </div>
            <button
              onClick={() => void findPlace()}
              disabled={busy}
              className="flex h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 text-label-lg text-on-primary transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              <span className="material-symbols-outlined text-lg">search</span>
              <span>{busy ? 'Searching…' : 'Search Lots'}</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button onClick={nextPlace} title="Change place" className="flex h-10 items-center gap-2 rounded-lg bg-surface-container px-3.5 text-label-md text-on-surface">
              <span className="material-symbols-outlined text-base text-primary">location_on</span>
              <span>{place.name}</span>
            </button>
            <button onClick={nearMe} className="flex h-10 items-center gap-2 rounded-lg bg-surface-container px-3.5 text-label-md text-on-surface">
              <span className="material-symbols-outlined text-base text-secondary">my_location</span>
              <span>Near me</span>
            </button>
            <div className="mx-1 hidden h-6 w-px bg-surface-container-high md:block"></div>
            <label className="flex h-10 cursor-pointer items-center gap-2 rounded-lg bg-surface-container px-3.5 transition-colors select-none hover:bg-surface-container-high">
              <span className="material-symbols-outlined text-base text-primary">eco</span>
              <span className="text-label-md text-on-surface">Organic only</span>
              <input type="checkbox" checked={organicOnly} onChange={(e) => setOrganicOnly(e.target.checked)} className="ml-1 h-4 w-4 rounded accent-primary" />
            </label>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pt-2 pb-1">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setCategory(tab.key)}
                className={`flex h-9 shrink-0 items-center gap-2 rounded-full px-4 text-label-md whitespace-nowrap transition-colors ${
                  category === tab.key ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                <span>{tab.label}</span>
                <span className="rounded-full bg-surface-container-highest px-1.5 text-[10px] text-on-surface">{count(tab.key)}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* TWO COLUMN CATALOG + DOCKED INSPECTION PANEL */}
      <section className="mx-auto w-full max-w-[1440px] px-6 pb-24 lg:px-12">
        <div className="flex items-center justify-between pb-4">
          <div className="flex items-center gap-2 text-label-md text-on-surface-variant">
            <span className="font-semibold text-on-surface">{filtered.length} listings</span>
            <span>near</span>
            <span className="font-semibold text-primary">{place.name}</span>
            {nearest !== null && <span>• nearest farm is {formatKm(nearest)} away</span>}
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 animate-ping rounded-full bg-primary"></span>
            <span className="text-label-md text-primary">Logistics live</span>
          </div>
        </div>

        {search.isPending && <p className="py-16 text-center text-on-surface-variant">Loading produce…</p>}
        {!search.isPending && filtered.length === 0 && (
          <div className="rounded-2xl bg-surface-container p-12 text-center">
            <p className="font-headline-md text-headline-md">Nothing matches yet</p>
            <p className="mt-2 text-on-surface-variant">Try another place, clear the search, or switch off “Organic only”.</p>
          </div>
        )}

        {filtered.length > 0 && (
          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
            {/* Left Produce Grid */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:col-span-8">
              {filtered.map(({ item, fresh, delivery }) => (
                <article
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  className={`group flex cursor-pointer flex-col overflow-hidden rounded-2xl bg-surface-container shadow-lg transition-all duration-300 hover:shadow-2xl ${
                    sel?.id === item.id ? 'ring-1 ring-primary' : ''
                  }`}
                >
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-surface-container-high">
                    <Photo item={item} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-surface-container via-transparent to-black/30"></div>
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      {item.isOrganic && (
                        <span className="flex items-center gap-1 rounded-full bg-primary/20 px-2.5 py-1 text-label-sm text-primary uppercase shadow-sm backdrop-blur-md">
                          <span className="material-symbols-outlined text-[14px]">eco</span>
                          Organic
                        </span>
                      )}
                      <span className="flex items-center gap-1 rounded-full bg-secondary/20 px-2.5 py-1 text-label-sm text-secondary uppercase backdrop-blur-md">
                        {item.grade ? `Grade ${item.grade}` : 'Field Grade'}
                      </span>
                    </div>
                    <div className="absolute top-3 right-3">
                      <span className="flex items-center gap-1 rounded-full bg-surface-container-lowest/80 px-2.5 py-1 text-label-sm text-on-surface backdrop-blur-md">
                        <span className="material-symbols-outlined text-[14px] text-primary">near_me</span>
                        {formatKm(item.distanceM)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col justify-between p-5">
                    <div>
                      <div className="mb-1 flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-headline-sm text-headline-sm font-semibold tracking-tight text-on-surface">
                            {item.variety ? `${item.cropName} · ${item.variety}` : item.cropName}
                          </h3>
                          <p className="text-body-sm text-on-surface-variant">
                            {item.farmName}, {item.village ?? item.district}
                          </p>
                        </div>
                        <span className="rounded bg-surface-container-high px-2 py-0.5 text-label-sm text-primary">{lot(item.id)}</span>
                      </div>
                      <div className="my-3 rounded-xl bg-surface-container-low px-3 py-2">
                        <div className="mb-1.5 flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1 text-label-sm text-primary">
                            <span className="h-1.5 w-1.5 rounded-full bg-primary"></span>
                            {fresh.label}
                          </span>
                          <span className="text-body-sm text-on-surface-variant">{fresh.detail}</span>
                        </div>
                        <Segments score={fresh.score} />
                      </div>
                      <div className="mb-4 flex items-center gap-2 text-body-sm text-on-surface-variant">
                        <span className="material-symbols-outlined text-base text-primary">local_shipping</span>
                        <span>
                          {delivery.label}, {delivery.by.replace('Arrives ', '')}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-surface-container-high/60 pt-3">
                      <div>
                        <div className="flex items-baseline gap-1">
                          <span className="font-headline-lg text-headline-lg font-bold text-secondary">₹{item.pricePerUnit}</span>
                          <span className="text-body-sm text-on-surface-variant">/ {item.unit}</span>
                        </div>
                        <span className="block text-label-sm text-outline">
                          {item.qtyAvailable} {item.unit} remaining
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedId(item.id)
                          notify(`${item.cropName} selected. Orders are placed in the Farm customer app.`)
                        }}
                        className="flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-label-md text-on-primary shadow-sm transition-transform hover:opacity-90 active:scale-95"
                      >
                        <span className="material-symbols-outlined text-base">add_shopping_cart</span>
                        <span>Add</span>
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {/* Right Inspection Drawer Feature */}
            {sel && selected && (
              <aside className="sticky top-28 flex flex-col gap-6 rounded-3xl bg-surface-container-low p-6 shadow-2xl lg:col-span-4">
                <div className="flex items-center justify-between border-b border-surface-container-high/70 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-primary"></span>
                    <span className="text-label-sm font-bold tracking-widest text-primary uppercase">Verified Traceability</span>
                  </div>
                  <span className="rounded bg-surface-container px-2.5 py-1 text-label-sm text-on-surface-variant">Audit: {lot(sel.id)}</span>
                </div>

                <div>
                  <div className="relative mb-4 aspect-[16/9] overflow-hidden rounded-2xl shadow-md">
                    <Photo item={sel} big className="h-full w-full object-cover" />
                    <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-xl bg-surface/90 px-3 py-1.5 backdrop-blur-md">
                      <span className="material-symbols-outlined text-sm text-primary">verified</span>
                      <span className="text-label-sm font-semibold text-on-surface">
                        {sel.cropName} ({lot(sel.id)})
                      </span>
                    </div>
                  </div>
                  <h2 className="mb-1 font-headline-md text-headline-md font-semibold text-on-surface">
                    {sel.variety ? `${sel.variety} ${sel.cropName}` : sel.cropName}
                  </h2>
                  <p className="text-body-sm text-on-surface-variant">
                    {sel.description ?? `Picked fresh at ${sel.farmName}. ${selected.fresh.detail}.`}
                  </p>
                </div>

                {/* Farmer Identity */}
                <div className="flex items-center gap-4 rounded-2xl bg-surface-container p-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-surface-container-highest text-xl font-bold text-primary">
                    {(SAMPLE_FARMERS[sel.farmerId] ?? sel.farmName).charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="truncate text-label-lg font-bold text-on-surface">{SAMPLE_FARMERS[sel.farmerId] ?? sel.farmName}</span>
                      <span className="material-symbols-outlined shrink-0 text-base text-primary">verified</span>
                    </div>
                    <p className="truncate text-body-sm text-on-surface-variant">
                      {sel.farmName}, {sel.village ?? sel.district}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="block text-label-sm font-bold text-secondary">Verified</span>
                    <span className="text-label-sm text-outline">{formatKm(sel.distanceM)} away</span>
                  </div>
                </div>

                {/* Lab matrix */}
                <div className="space-y-3">
                  <span className="block text-label-sm tracking-wider text-outline uppercase">Field Verification Matrix</span>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-xl bg-surface-container p-3">
                      <span className="block font-headline-sm text-headline-sm font-bold text-primary">{sel.isOrganic ? 'Organic' : 'Standard'}</span>
                      <span className="text-label-sm text-on-surface-variant">Farming</span>
                    </div>
                    <div className="rounded-xl bg-surface-container p-3">
                      <span className="block font-headline-sm text-headline-sm font-bold text-secondary">
                        {selected.fresh.ageDays < 0 ? 'Soon' : `${selected.fresh.ageDays}d`}
                      </span>
                      <span className="text-label-sm text-on-surface-variant">Since harvest</span>
                    </div>
                    <div className="rounded-xl bg-surface-container p-3">
                      <span className="block font-headline-sm text-headline-sm font-bold text-on-surface">{sel.grade ? `Grade ${sel.grade}` : 'Ungraded'}</span>
                      <span className="text-label-sm text-on-surface-variant">Inspection</span>
                    </div>
                  </div>
                </div>

                {/* Interactive Order Block */}
                <div className="space-y-3 rounded-2xl bg-surface-container-high p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-headline-lg text-headline-lg font-bold text-secondary">₹{sel.pricePerUnit}</span>
                      <span className="text-body-sm text-on-surface-variant">/ {sel.unit}</span>
                    </div>
                    <div className="inline-flex items-center rounded-xl bg-surface-container p-1">
                      <button onClick={() => setDrawerQty((q) => Math.max(1, q - 1))} className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-container-high text-on-surface transition-colors hover:text-primary">
                        <span className="material-symbols-outlined text-sm">remove</span>
                      </button>
                      <span className="w-12 text-center text-label-md font-bold text-on-surface">
                        {drawerQty} {sel.unit}
                      </span>
                      <button onClick={() => setDrawerQty((q) => q + 1)} className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-container-high text-on-surface transition-colors hover:text-primary">
                        <span className="material-symbols-outlined text-sm">add</span>
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => notify(`${drawerQty} ${sel.unit} of ${sel.cropName} for ₹${drawerQty * sel.pricePerUnit}. Orders are placed in the Farm customer app.`)}
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-label-lg text-on-primary transition-opacity hover:opacity-95"
                  >
                    <span className="material-symbols-outlined text-xl">shopping_bag</span>
                    <span>
                      Reserve {drawerQty} {sel.unit} • ₹{drawerQty * sel.pricePerUnit}
                    </span>
                  </button>
                </div>

                <div className="flex items-center justify-center gap-2 text-label-sm text-outline">
                  <span className="material-symbols-outlined text-base text-primary">verified_user</span>
                  <span>{selected.delivery.label}, {selected.delivery.by.replace('Arrives ', '')}</span>
                </div>
              </aside>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
