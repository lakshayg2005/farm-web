import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { ErrorState } from '@/components/ui'
import { Icon } from '@/components/Icon'
import { useI18n } from '@/i18n/i18n'
import { ProduceCard } from './ProduceCard'
import { ProduceDialog } from './ProduceDialog'
import { CATEGORY_LABEL, DEFAULT_PLACE, PLACES, refine, shopApi, useCart, type SortKey } from './shop'

type Place = { name: string; lat: number; lng: number }
const PLACE_KEY = 'farm.place'

function savedPlace(): Place {
  try {
    const p = JSON.parse(localStorage.getItem(PLACE_KEY) ?? 'null') as Place | null
    if (p && typeof p.lat === 'number' && typeof p.lng === 'number') return p
  } catch {
    // fall through to the default
  }
  return DEFAULT_PLACE
}

const SORTS: { id: SortKey; label: string }[] = [
  { id: 'distance', label: 'Nearest first' },
  { id: 'price', label: 'Lowest price' },
  { id: 'newest', label: 'Newly listed' },
]
const RADII = [10, 25, 50, 100, 250]

/** The produce catalog: what farmers near you sell, how fresh it is, and a way to put it in the cart. Works signed out too. */
export function ShopBrowser({ cartPath }: { cartPath: string }) {
  const { t } = useI18n()
  const [place, setPlace] = useState<Place>(savedPlace)
  const [radiusKm, setRadiusKm] = useState(50)
  const [category, setCategory] = useState('all')
  const [text, setText] = useState('')
  const [sort, setSort] = useState<SortKey>('distance')
  const [organic, setOrganic] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null)
  const [locating, setLocating] = useState(false)
  const [locateError, setLocateError] = useState('')
  const cart = useCart()

  const crops = useQuery({ queryKey: ['shop-crops'], queryFn: shopApi.crops, staleTime: 3_600_000 })
  const search = useInfiniteQuery({
    queryKey: ['shop-search', place.lat, place.lng, radiusKm, organic, sort],
    queryFn: ({ pageParam }) => shopApi.search({ lat: place.lat, lng: place.lng, radiusKm, organic, sort }, pageParam),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor,
    placeholderData: (previous) => previous,
  })

  const all = useMemo(() => search.data?.pages.flatMap((p) => p.items) ?? [], [search.data])
  const items = useMemo(() => refine(all, { category, text, crops: crops.data }), [all, category, text, crops.data])
  const categories = useMemo(() => {
    const byId = new Map((crops.data ?? []).map((c) => [c.id, c.category]))
    const count = new Map<string, number>()
    for (const p of all) {
      const k = byId.get(p.cropId)
      if (k) count.set(k, (count.get(k) ?? 0) + 1)
    }
    return [...count.entries()].sort((a, b) => b[1] - a[1])
  }, [all, crops.data])
  const open = items.find((p) => p.id === openId) ?? all.find((p) => p.id === openId) ?? null

  function choose(p: Place) {
    setPlace(p)
    setLocateError('')
    try {
      localStorage.setItem(PLACE_KEY, JSON.stringify(p))
    } catch {
      // not saved; the choice still applies now
    }
  }

  function locate() {
    if (!('geolocation' in navigator)) return setLocateError(t('This browser cannot share your location. Pick a town instead.'))
    setLocating(true)
    setLocateError('')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false)
        choose({ name: 'My location', lat: pos.coords.latitude, lng: pos.coords.longitude })
      },
      () => {
        setLocating(false)
        setLocateError(t('Could not get your location. Pick a town instead.'))
      },
      { timeout: 8000, maximumAge: 600_000 },
    )
  }

  const select = 'input w-auto min-w-0 py-1.5'
  return (
    <div className="mt-6">
      <div className="card space-y-4 p-3.5 sm:p-4">
        <label className="relative block">
          <span className="sr-only">{t('Search produce, farms or villages')}</span>
          <Icon name="search" className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-ink-soft" />
          <input type="search" value={text} onChange={(e) => setText(e.target.value)} placeholder={t('Search tomato, a farm, a village…')} className="input pl-10" />
        </label>

        <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
          <label className="grid gap-1 text-sm font-semibold">
            {t('Deliver to')}
            <select
              value={PLACES.some((p) => p.name === place.name) ? place.name : '__mine'}
              onChange={(e) => {
                const p = PLACES.find((x) => x.name === e.target.value)
                if (p) choose(p)
              }}
              className={select}
            >
              {!PLACES.some((p) => p.name === place.name) && <option value="__mine">{t('My location')}</option>}
              {PLACES.map((p) => (
                <option key={p.name}>{p.name}</option>
              ))}
            </select>
          </label>
          <button type="button" onClick={locate} disabled={locating} className="btn-secondary min-h-11">
            {locating ? t('Finding you…') : t('Use my location')}
          </button>
          <label className="grid gap-1 text-sm font-semibold">
            {t('Within')}
            <select value={radiusKm} onChange={(e) => setRadiusKm(Number(e.target.value))} className={select}>
              {RADII.map((r) => (
                <option key={r} value={r}>
                  {r} km
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            {t('Sort by')}
            <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className={select}>
              {SORTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {t(s.label)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex min-h-11 items-center gap-2 font-semibold">
            <input type="checkbox" checked={organic} onChange={(e) => setOrganic(e.target.checked)} className="size-5 accent-[var(--color-primary)]" />
            {t('Organic only')}
          </label>
        </div>
        {locateError && (
          <p role="alert" className="text-sm font-semibold text-danger">
            {locateError}
          </p>
        )}

        {categories.length > 0 && (
          <div role="group" aria-label={t('Category')} className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {[['all', all.length] as const, ...categories].map(([id, n]) => (
              <button
                key={id}
                type="button"
                aria-pressed={category === id}
                onClick={() => setCategory(id)}
                className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border-[1.5px] px-4 text-sm font-semibold transition-colors duration-150 ${
                  category === id ? 'border-ink bg-ink text-background' : 'border-line-strong bg-surface-card hover:bg-paper'
                }`}
              >
                {id === 'all' ? t('All') : t(CATEGORY_LABEL[id] ?? id)}
                <span className={category === id ? 'text-background/70' : 'text-ink-soft'}>{n}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <p aria-live="polite" className="mt-5 font-semibold">
        {search.isPending ? t('Searching…') : t(items.length === 1 ? '{n} item near {place}' : '{n} items near {place}', { n: items.length, place: place.name })}
      </p>

      {search.isError && <ErrorState title="Could not load produce" body="Check your connection and try again." onRetry={() => void search.refetch()} />}

      {search.isPending ? (
        <ul className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-hidden="true">
          {Array.from({ length: 8 }, (_, i) => (
            <li key={i} className="card h-72 animate-pulse bg-paper-deep motion-reduce:animate-none" />
          ))}
        </ul>
      ) : items.length === 0 && !search.isError ? (
        <div className="card mt-3 border-dashed p-6 text-center">
          <p className="font-display text-xl">{t('Nothing matches yet')}</p>
          <p className="mx-auto mt-1 max-w-md text-ink-soft">{t('Try a wider distance, another town, or clear the search and filters.')}</p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            {radiusKm < 250 && (
              <button type="button" className="btn-secondary" onClick={() => setRadiusKm(250)}>
                {t('Search within 250 km')}
              </button>
            )}
            {(text || category !== 'all' || organic) && (
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setText('')
                  setCategory('all')
                  setOrganic(false)
                }}
              >
                {t('Clear filters')}
              </button>
            )}
          </div>
        </div>
      ) : (
        <ul className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((p) => (
            <li key={p.id}>
              <ProduceCard item={p} inCart={cart.some((l) => l.listingId === p.id)} onOpen={() => setOpenId(p.id)} />
            </li>
          ))}
        </ul>
      )}

      {search.hasNextPage && (
        <div className="mt-6 text-center">
          <button type="button" className="btn-secondary" disabled={search.isFetchingNextPage} onClick={() => void search.fetchNextPage()}>
            {search.isFetchingNextPage ? t('Searching…') : t('Show more')}
          </button>
        </div>
      )}

      {open && <ProduceDialog key={open.id} item={open} cartPath={cartPath} onClose={() => setOpenId(null)} />}
    </div>
  )
}
