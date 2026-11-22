import { useQuery } from '@tanstack/react-query'
import { AnimatePresence } from 'motion/react'
import { useMemo, useState } from 'react'
import { Icon } from '@/components/Icon'
import { PlaceSearch } from '@/components/PlaceSearch'
import {
  CATEGORIES,
  PLACES,
  type Produce,
  type SortKey,
  catalogApi,
  categoryOf,
  deliveryEstimate,
  formatKm,
  freshness,
  refine,
} from './catalog'
import { ProduceCard } from './ProduceCard'
import { ProduceDrawer } from './ProduceDrawer'
import { SAMPLE_FARMERS, sampleProduce } from './sample'

const SORTS: { id: SortKey; label: string }[] = [
  { id: 'distance', label: 'Nearest first' },
  { id: 'freshest', label: 'Freshest first' },
  { id: 'price', label: 'Lowest price' },
  { id: 'newest', label: 'Newly listed' },
]

const selectClass =
  'h-11 rounded-full border border-line bg-surface px-4 pr-9 text-[0.95rem] font-medium appearance-none bg-[length:12px] bg-[right_14px_center] bg-no-repeat'
const chevron = {
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2355645b' stroke-width='1.6' fill='none'/%3E%3C/svg%3E\")",
}

/** The produce catalog: what farmers near you are selling, how fresh it is and when it arrives. */
export function CatalogBrowser() {
  const [place, setPlace] = useState<{ name: string; lat: number; lng: number }>(PLACES[0])
  const [radiusKm, setRadiusKm] = useState(50)
  const [category, setCategory] = useState('all')
  const [text, setText] = useState('')
  const [sort, setSort] = useState<SortKey>('distance')
  const [organic, setOrganic] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null)
  const [locating, setLocating] = useState(false)

  const crops = useQuery({ queryKey: ['catalog', 'crops'], queryFn: catalogApi.crops, staleTime: Infinity, retry: false })
  const search = useQuery({
    queryKey: ['catalog', 'search', place.lat, place.lng, radiusKm, organic, sort === 'newest' ? 'newest' : 'distance'],
    queryFn: () => catalogApi.search({ lat: place.lat, lng: place.lng, radiusKm, organic, sort }),
    retry: false,
  })

  // When the catalog service is unreachable, show clearly labelled sample produce instead of an empty page.
  const offline = search.isError
  const source: Produce[] = useMemo(() => {
    if (!offline) return search.data ?? []
    return sampleProduce(place.lat, place.lng)
      .filter((p) => p.distanceM <= radiusKm * 1000)
      .filter((p) => !organic || p.isOrganic)
  }, [offline, search.data, place.lat, place.lng, radiusKm, organic])

  const items = useMemo(
    () => refine(source, { category, text, sort, crops: crops.data }),
    [source, category, text, sort, crops.data],
  )
  const view = useMemo(
    () =>
      items.map((item) => ({
        item,
        fresh: freshness(item.harvestDate, categoryOf(item.cropId, crops.data)),
        delivery: deliveryEstimate(item.distanceM, item.harvestDate),
      })),
    [items, crops.data],
  )
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: source.length }
    for (const p of source) {
      const k = categoryOf(p.cropId, crops.data)
      c[k] = (c[k] ?? 0) + 1
    }
    return c
  }, [source, crops.data])

  const farms = new Set(items.map((i) => i.farmId)).size
  const tomorrow = view.filter((v) => v.delivery.maxDays === 1).length
  const peak = view.filter((v) => v.fresh.tone === 'peak').length
  const nearest = items.length ? Math.min(...items.map((i) => i.distanceM)) : null
  const open = view.find((v) => v.item.id === openId)

  function locateMe() {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPlace({ name: 'My location', lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLocating(false)
      },
      () => setLocating(false),
      { timeout: 10_000 },
    )
  }

  return (
    <div>
      {/* Search and filters */}
      <div className="card p-3 sm:p-4">
        <div className="mb-3">
          <PlaceSearch
            placeholder="Find produce near any village, town or address…"
            onPick={(r) => setPlace({ name: r.name.split(',').slice(0, 2).join(',').trim(), lat: r.lat, lng: r.lng })}
          />
        </div>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <label className="relative flex-1">
            <span className="sr-only">Search produce or farms</span>
            <Icon name="search" className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-ink-soft" />
            <input
              type="search"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Search tomatoes, mangoes, a farm…"
              className="h-11 w-full rounded-full border border-line bg-paper pr-4 pl-11"
            />
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <label className="relative">
              <span className="sr-only">Deliver to</span>
              <select
                aria-label="Deliver to"
                value={place.name}
                onChange={(e) => setPlace(PLACES.find((p) => p.name === e.target.value) ?? PLACES[0])}
                className={selectClass}
                style={chevron}
              >
                {!PLACES.some((p) => p.name === place.name) && <option>{place.name}</option>}
                {PLACES.map((p) => (
                  <option key={p.name}>{p.name}</option>
                ))}
              </select>
            </label>
            <button type="button" onClick={locateMe} className="btn-ghost h-11 !px-4 !py-0" disabled={locating}>
              <Icon name="pin" className="size-4.5" />
              {locating ? 'Locating…' : 'Near me'}
            </button>
            <select
              aria-label="Distance"
              value={radiusKm}
              onChange={(e) => setRadiusKm(Number(e.target.value))}
              className={selectClass}
              style={chevron}
            >
              {[10, 25, 50, 100].map((r) => (
                <option key={r} value={r}>
                  Within {r} km
                </option>
              ))}
            </select>
            <select
              aria-label="Sort by"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className={selectClass}
              style={chevron}
            >
              {SORTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              aria-pressed={organic}
              onClick={() => setOrganic((v) => !v)}
              className={`inline-flex h-11 items-center gap-1.5 rounded-full border px-4 font-medium transition-colors ${
                organic ? 'border-white bg-white text-black' : 'border-line bg-surface hover:border-ink-soft'
              }`}
            >
              <Icon name="leaf" className="size-4.5" /> Organic
            </button>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="-mx-4 mt-5 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
        <ul className="flex gap-2" aria-label="Categories">
          {CATEGORIES.map((c) => {
            const active = category === c.id
            return (
              <li key={c.id}>
                <button
                  type="button"
                  aria-pressed={active}
                  onClick={() => setCategory(c.id)}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 whitespace-nowrap transition-all ${
                    active
                      ? 'border-white bg-white text-black'
                      : 'border-line bg-surface hover:-translate-y-0.5 hover:border-ink-soft'
                  }`}
                >
                  <span aria-hidden>{c.emoji}</span>
                  <span className="font-medium">{c.label}</span>
                  <span className={`text-sm ${active ? 'text-gray-600' : 'text-ink-soft'}`}>{counts[c.id] ?? 0}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>

      {offline && (
        <p role="status" className="mt-5 flex items-start gap-3 rounded-2xl border border-mustard/40 bg-mustard/10 px-4 py-3 text-[0.95rem]">
          <Icon name="sparkle" className="mt-0.5 size-5 shrink-0 text-amber-400" />
          <span>
            <strong>Showing sample produce.</strong> The live catalog could not be reached, so these listings are examples of
            what farmers near {place.name} offer. Start the backend to see real stock.
          </span>
        </p>
      )}

      {/* Summary */}
      <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ['Listings', String(items.length), 'basket'],
          ['Farms', String(farms), 'users'],
          ['Arrive tomorrow', String(tomorrow), 'truck'],
          ['Peak fresh', String(peak), 'leaf'],
        ].map(([label, value, icon]) => (
          <div key={label} className="card flex items-center gap-3 px-4 py-3">
            <span className="grid size-10 place-items-center rounded-xl bg-neutral-900 text-black">
              <Icon name={icon as 'basket'} className="size-5" />
            </span>
            <div>
              <dt className="text-sm text-ink-soft">{label}</dt>
              <dd className="font-display text-xl leading-tight">{value}</dd>
            </div>
          </div>
        ))}
      </dl>

      {/* Results */}
      {search.isPending ? (
        <ul className="mt-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4" aria-label="Loading produce">
          {Array.from({ length: 6 }, (_, i) => (
            <li key={i} className="card h-96 animate-pulse bg-paper-deep/60" />
          ))}
        </ul>
      ) : view.length === 0 ? (
        <div className="card mt-6 grid place-items-center px-6 py-16 text-center">
          <span className="text-5xl" aria-hidden>
            🌾
          </span>
          <p className="mt-4 font-display text-2xl">Nothing matches yet</p>
          <p className="mt-1 max-w-md text-ink-soft">
            No produce {category !== 'all' ? 'in this category ' : ''}within {radiusKm} km of {place.name}. Try a wider
            distance, another place or clear the search.
          </p>
          <button
            type="button"
            onClick={() => {
              setCategory('all')
              setText('')
              setRadiusKm(100)
            }}
            className="btn-primary mt-6"
          >
            Show everything within 100 km
          </button>
        </div>
      ) : (
        <>
          <p className="mt-6 text-ink-soft">
            {view.length} listing{view.length === 1 ? '' : 's'} near <strong className="text-ink">{place.name}</strong>
            {nearest !== null && <> · nearest farm {formatKm(nearest)} away</>}
          </p>
          <ul className="mt-3 grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {view.map((v, i) => (
              <ProduceCard key={v.item.id} {...v} index={i} onOpen={() => setOpenId(v.item.id)} />
            ))}
          </ul>
        </>
      )}

      <AnimatePresence>
        {open && (
          <ProduceDrawer
            key={open.item.id}
            {...open}
            farmer={SAMPLE_FARMERS[open.item.farmerId]}
            onClose={() => setOpenId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
