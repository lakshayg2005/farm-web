import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { searchPlaces } from '@/api/geocode'
import { ApiError } from '@/api/http'
import { SiteFooter } from '@/components/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader'
import { useToast } from '@/components/Toast'
import { useAuth } from '@/features/auth/authContext'
import { day, landApi, rupees, type Bounds, type PlotFeature } from './land'
import { getLeaflet } from './leaflet'
import { PlotMap } from './PlotMap'

const SEASONS = [
  { value: '', label: 'Any season' },
  { value: 'Kharif', label: 'Kharif (Monsoon)' },
  { value: 'Rabi', label: 'Rabi (Winter)' },
  { value: 'Zaid', label: 'Zaid (Summer)' },
]

const plotCode = (id: string) => `Plot #${id.slice(0, 4).toUpperCase()}`

export function FarmlandPage() {
  const notify = useToast()
  const { user } = useAuth()
  const hasMap = getLeaflet() !== null
  const [bounds, setBounds] = useState<Bounds | null>(null)
  const [season, setSeason] = useState('')
  const [crop, setCrop] = useState('')
  const [placeText, setPlaceText] = useState('')
  const [focus, setFocus] = useState<{ lat: number; lng: number } | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    document.title = 'Reserve farmland | Farm Platform'
  }, [])

  const crops = useQuery({ queryKey: ['crops'], queryFn: landApi.crops, staleTime: 3_600_000 })
  const cropName = useMemo(() => new Map((crops.data ?? []).map((c) => [c.id, c.name])), [crops.data])
  const ready = !hasMap || bounds !== null
  const search = useQuery({
    queryKey: ['plots', bounds, season, crop],
    queryFn: () => landApi.searchPlots(bounds, { season, crop }),
    enabled: ready,
    placeholderData: (previous) => previous,
  })
  const plots = search.data ?? []
  const selected = plots.find((p) => p.properties.plotSeasonId === selectedId) ?? null
  const acres = plots.reduce((sum, p) => sum + p.properties.areaAcres, 0)
  const avgRate = plots.length ? plots.reduce((sum, p) => sum + p.properties.price, 0) / plots.length : 0

  async function findPlace() {
    const q = placeText.trim()
    if (q.length < 3) return notify('Type a village, town or address first.')
    try {
      const [hit] = await searchPlaces(q)
      if (!hit) return notify('No place found. Try a nearby town.')
      setFocus({ lat: hit.lat, lng: hit.lng })
    } catch {
      notify('Place search is unavailable. Check your internet connection.')
    }
  }

  const input = 'h-10 w-full appearance-none rounded-xl border border-border bg-surface px-3 pr-8 text-xs text-on-surface outline-none transition-colors hover:border-outline focus:border-primary'

  return (
    <>
      <SiteHeader />
      <main className="flex w-full flex-1 flex-col bg-background">
        <section className="mx-auto w-full max-w-[1440px] px-6 pt-8 pb-4 lg:px-12">
          <div className="flex flex-col justify-between gap-4 border-b border-border pb-6 md:flex-row md:items-end">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-primary" />
                <span className="text-xs font-medium tracking-[0.2em] text-on-surface-variant uppercase">Cadastral Registry Protocol</span>
                <span className="text-xs text-outline/60">/</span>
                <span className="text-xs text-on-surface-variant">Live plots on the map</span>
              </div>
              <h1 className="font-serif text-3xl font-normal tracking-tight text-on-surface sm:text-4xl">Find &amp; reserve farmland.</h1>
              <p className="mt-1.5 max-w-xl text-sm font-light text-on-surface-variant">
                Audited boundaries, a clear season window, and a transparent deposit before cultivation.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3 text-xs text-on-surface-variant">
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-primary" />
                <strong className="font-medium text-on-surface">{plots.length} plots</strong> in view
              </span>
              <span className="text-outline/50">•</span>
              <span>{acres.toFixed(1)} acres open</span>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1440px] px-6 pb-20 lg:px-12">
          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
            {/* Map and controls */}
            <div className="flex flex-col gap-4 lg:col-span-7">
              <div className="flex flex-col items-stretch gap-2.5 rounded-2xl border border-border bg-surface-card p-3.5 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <span className="material-symbols-outlined absolute top-1/2 left-3.5 -translate-y-1/2 text-[18px] text-on-surface-variant">search</span>
                  <input
                    className="h-10 w-full rounded-xl border border-border bg-surface pr-3 pl-10 text-xs text-on-surface transition-colors placeholder:text-on-surface-variant/60 focus:border-primary focus:outline-none"
                    placeholder="Search village, tehsil, or address..."
                    aria-label="Search a place"
                    value={placeText}
                    onChange={(e) => setPlaceText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') void findPlace()
                    }}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <select value={season} onChange={(e) => setSeason(e.target.value)} aria-label="Season" className={input}>
                      {SEASONS.map((x) => (
                        <option key={x.value} value={x.value}>
                          {x.label}
                        </option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-[16px] text-on-surface-variant">expand_more</span>
                  </div>
                  <div className="relative">
                    <select value={crop} onChange={(e) => setCrop(e.target.value)} aria-label="Crop" className={input}>
                      <option value="">Any crop</option>
                      {(crops.data ?? []).map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-[16px] text-on-surface-variant">expand_more</span>
                  </div>
                  <button
                    onClick={() => {
                      setSeason('')
                      setCrop('')
                      setPlaceText('')
                      notify('Filters reset')
                    }}
                    title="Reset filters"
                    aria-label="Reset filters"
                    className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-surface text-on-surface-variant transition-colors hover:border-outline hover:text-on-surface"
                  >
                    <span className="material-symbols-outlined text-[17px]">tune</span>
                  </button>
                </div>
              </div>

              <div className="relative h-[580px] w-full overflow-hidden rounded-2xl border border-border bg-surface-container">
                {hasMap ? (
                  <div className="h-full w-full [&>div]:!h-full [&>div]:!rounded-none">
                    <PlotMap plots={plots} selectedId={selectedId} onSelect={(id) => setSelectedId(id)} onBoundsChange={setBounds} focus={focus} />
                  </div>
                ) : (
                  <p className="grid h-full place-items-center px-6 text-center text-on-surface-variant">The map could not load. Refresh the page to try again.</p>
                )}
                <div className="pointer-events-none absolute inset-x-4 top-4 z-[500] flex items-center justify-between">
                  <div className="pointer-events-auto ml-12 flex items-center gap-2 rounded-full border border-border bg-header px-3 py-1.5 backdrop-blur-md">
                    <span className="size-2 rounded-full bg-primary" />
                    <span className="text-xs font-medium text-on-surface">Layer: Open plots in view</span>
                  </div>
                  <div className="pointer-events-auto flex items-center gap-3 rounded-full border border-border bg-header px-3 py-1.5 text-xs backdrop-blur-md">
                    <span className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-primary" />
                      <span className="text-on-surface">Open plot</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-secondary" />
                      <span className="text-on-surface">Selected</span>
                    </span>
                  </div>
                </div>
                <div className="pointer-events-none absolute right-4 bottom-4 left-4 z-[500] flex items-center justify-between">
                  <div className="pointer-events-auto flex items-center gap-2 rounded-xl border border-border bg-header px-3 py-1.5 text-xs text-on-surface-variant backdrop-blur-md">
                    <span className="font-mono text-[11px]">
                      {bounds
                        ? `${((bounds.north + bounds.south) / 2).toFixed(4)}° N, ${((bounds.east + bounds.west) / 2).toFixed(4)}° E`
                        : 'Move the map to search an area'}
                    </span>
                    <span className="text-outline">•</span>
                    <span className="font-medium text-on-surface">{plots.length} plots in view</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-border bg-surface-card p-3.5">
                  <span className="mb-1 block text-[11px] tracking-wider text-on-surface-variant uppercase">Plots in view</span>
                  <div className="flex items-baseline gap-1">
                    <span className="font-serif text-lg text-on-surface">{plots.length}</span>
                    <span className="text-xs font-medium text-primary">open</span>
                  </div>
                  <span className="mt-0.5 block text-[11px] text-on-surface-variant">Updates as you move the map</span>
                </div>
                <div className="rounded-xl border border-border bg-surface-card p-3.5">
                  <span className="mb-1 block text-[11px] tracking-wider text-on-surface-variant uppercase">Open acreage</span>
                  <div className="flex items-baseline gap-1">
                    <span className="font-serif text-lg text-on-surface">{acres.toFixed(1)}</span>
                    <span className="text-xs font-medium text-secondary">acres</span>
                  </div>
                  <span className="mt-0.5 block text-[11px] text-on-surface-variant">From the drawn boundaries</span>
                </div>
                <div className="rounded-xl border border-border bg-surface-card p-3.5">
                  <span className="mb-1 block text-[11px] tracking-wider text-on-surface-variant uppercase">Avg season rate</span>
                  <div className="flex items-baseline gap-1">
                    <span className="font-serif text-lg text-on-surface">{rupees(Math.round(avgRate))}</span>
                    <span className="text-xs text-on-surface-variant">/ kg</span>
                  </div>
                  <span className="mt-0.5 block text-[11px] text-on-surface-variant">Paid on the harvest you take</span>
                </div>
              </div>
            </div>

            {/* Plot record panel */}
            <aside className="sticky top-28 flex max-h-[calc(100vh-8rem)] flex-col gap-6 overflow-y-auto rounded-2xl border border-border bg-surface-card p-6 lg:col-span-5 lg:p-7">
              {selected ? (
                <PlotRecord plot={selected} cropName={cropName} signedIn={!!user} onBack={() => setSelectedId(null)} />
              ) : (
                <>
                  <div className="flex items-center justify-between border-b border-border pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="size-1.5 rounded-full bg-primary" />
                        <span className="text-[11px] font-medium tracking-widest text-on-surface-variant uppercase">Available plots</span>
                      </div>
                      <h2 className="mt-0.5 font-serif text-2xl font-normal text-on-surface">Pick a plot to inspect</h2>
                    </div>
                    <span className="rounded-lg border border-border bg-surface px-2.5 py-1 font-mono text-xs text-on-surface-variant" aria-live="polite">
                      {search.isPending && ready ? '…' : plots.length}
                    </span>
                  </div>
                  {search.isError && (
                    <p role="alert" className="text-sm font-semibold text-error">
                      Could not load plots. Move the map or refresh to try again.
                    </p>
                  )}
                  <div className="flex flex-col gap-3">
                    {plots.map((item) => {
                      const p = item.properties
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setSelectedId(p.plotSeasonId)}
                          className="group rounded-xl border border-border bg-surface p-4 text-left transition-colors hover:border-outline"
                        >
                          <span className="flex items-start justify-between gap-3">
                            <span>
                              <span className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[10px] text-on-surface">
                                  <span className="size-1.5 rounded-full bg-primary" /> Boundary verified
                                </span>
                                <span className="font-mono text-[11px] text-on-surface-variant">{plotCode(item.id)}</span>
                              </span>
                              <span className="mt-1.5 block font-serif text-lg text-on-surface">{p.title}</span>
                              <span className="block text-xs font-light text-on-surface-variant">
                                {p.areaAcres} acres • {p.season} • {day(p.startDate)} to {day(p.endDate)}
                              </span>
                            </span>
                            <span className="shrink-0 text-right">
                              <span className="block font-serif text-xl text-on-surface">{rupees(p.price)}</span>
                              <span className="block text-[11px] text-on-surface-variant">per kg of harvest</span>
                            </span>
                          </span>
                          <span className="mt-3 flex flex-wrap gap-1.5">
                            {p.allowedCrops.length === 0 && <span className="text-[11px] text-on-surface-variant">Crops decided with the farmer</span>}
                            {p.allowedCrops.map((c) => (
                              <span key={c} className="rounded-md border border-border px-2 py-0.5 text-[11px] text-on-surface-variant">
                                {cropName.get(c) ?? c}
                              </span>
                            ))}
                          </span>
                          <span className="mt-3 flex items-center justify-between text-xs">
                            <span className="text-on-surface-variant">Reservation ends {day(p.endDate)}</span>
                            <span className="flex items-center gap-1 font-medium text-primary">
                              View &amp; Reserve <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                            </span>
                          </span>
                        </button>
                      )
                    })}
                    {!search.isPending && plots.length === 0 && !search.isError && (
                      <p className="text-sm text-on-surface-variant">No open plots here. Zoom out, move the map, or reset the filters.</p>
                    )}
                  </div>
                </>
              )}
            </aside>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  )
}

/** One plot's record and the request to reserve it, in the side panel. */
function PlotRecord({ plot, cropName, signedIn, onBack }: { plot: PlotFeature; cropName: Map<string, string>; signedIn: boolean; onBack: () => void }) {
  const notify = useToast()
  const p = plot.properties
  const [crop, setCrop] = useState(p.allowedCrops[0] ?? '')
  const [qty, setQty] = useState('')
  const [error, setError] = useState<string>()
  const reserve = useMutation({
    mutationFn: () => landApi.reserve(p.plotSeasonId, crop, Number(qty)),
    onSuccess: () => notify('Reservation request sent. The farmer has 48 hours to accept.'),
    onError: (e) => setError(e instanceof ApiError ? e.message : 'Could not reach the server. Try again.'),
  })
  const quantity = Number(qty)
  const total = quantity > 0 ? quantity * p.price : 0
  const deposit = total * 0.2

  function submit() {
    setError(undefined)
    if (!crop) return setError('Choose a crop.')
    if (!(quantity > 0)) return setError('Enter how many kilograms you expect.')
    reserve.mutate()
  }

  const field = 'mt-1 h-10 w-full rounded-xl border border-border bg-surface px-3 text-xs text-on-surface outline-none focus:border-primary'

  return (
    <>
      <div className="flex items-start justify-between gap-3 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-primary" />
            <span className="text-[11px] font-medium tracking-widest text-on-surface-variant uppercase">Plot Inspection Record</span>
          </div>
          <h2 className="mt-0.5 font-serif text-2xl font-normal text-on-surface">{p.title}</h2>
        </div>
        <span className="rounded-lg border border-border bg-surface px-2.5 py-1 font-mono text-xs text-on-surface-variant">{plotCode(plot.id).replace('Plot ', '')}</span>
      </div>

      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl border border-border bg-surface-container">
        <img alt="Farmland plot" className="h-full w-full object-cover" src="/img/p15.jpg" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        <div className="absolute right-3 bottom-3 left-3 flex items-center justify-between text-xs text-white">
          <span className="flex items-center gap-1.5 rounded-md border border-white/10 bg-black/60 px-2.5 py-1 font-mono text-[11px] backdrop-blur-md">
            <span className="size-1.5 rounded-full bg-emerald-400" />
            Boundary verified
          </span>
          <span className="rounded-md border border-white/10 bg-black/60 px-2.5 py-1 font-medium backdrop-blur-md">{p.areaAcres} Net Acres</span>
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[11px] font-medium tracking-wider text-on-surface-variant uppercase">Season window ({p.season})</span>
          <span className="font-mono text-[11px] text-on-surface-variant">Registry</span>
        </div>
        <div className="grid grid-cols-4 gap-2 text-center">
          {[
            ['Season', p.season, ''],
            ['Starts', day(p.startDate), ''],
            ['Ends', day(p.endDate), ''],
            ['Crops', String(p.allowedCrops.length), 'allowed'],
          ].map(([k, v, n]) => (
            <div key={k} className="rounded-xl border border-border bg-surface p-2.5">
              <span className="mb-1 block text-[11px] text-on-surface-variant">{k}</span>
              <span className="block font-serif text-sm leading-tight text-on-surface">{v}</span>
              {n && <span className="mt-0.5 block text-[10px] text-primary">{n}</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3 rounded-xl border border-border bg-surface p-3.5">
        <span className="text-[11px] font-medium tracking-wider text-on-surface-variant uppercase">Your request</span>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-[11px] text-on-surface-variant">
            Crop to grow
            <select value={crop} onChange={(e) => setCrop(e.target.value)} className={field}>
              {p.allowedCrops.length === 0 && <option value="">No crops listed</option>}
              {p.allowedCrops.map((c) => (
                <option key={c} value={c}>
                  {cropName.get(c) ?? c}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-[11px] text-on-surface-variant">
            Expected harvest (kg)
            <input type="number" min="1" step="any" inputMode="decimal" value={qty} onChange={(e) => setQty(e.target.value)} className={field} />
          </label>
        </div>
      </div>

      <div className="space-y-2.5 border-t border-border pt-4">
        <span className="block text-[11px] font-medium tracking-wider text-on-surface-variant uppercase">Settlement &amp; deposit</span>
        <div className="space-y-1.5 text-xs font-light text-on-surface-variant">
          <div className="flex justify-between">
            <span>Price per kg of harvest</span>
            <span className="font-mono text-on-surface">{rupees(p.price)}</span>
          </div>
          <div className="flex items-baseline justify-between border-t border-border pt-2 text-on-surface">
            <span className="text-xs font-medium">Estimated seasonal value</span>
            <span className="font-serif text-2xl font-normal">{total ? rupees(total) : '—'}</span>
          </div>
        </div>

        {error && (
          <p role="alert" className="text-xs font-semibold text-error">
            {error}
          </p>
        )}
        {!signedIn && (
          <p className="rounded-lg border border-border bg-surface px-3 py-2 text-xs text-on-surface-variant">
            <Link to="/login" className="font-semibold text-primary underline">Sign in</Link> as a customer to request this plot.
          </p>
        )}
        {reserve.isSuccess && (
          <p role="status" className="rounded-lg bg-primary/10 px-3 py-2 text-xs text-primary">
            Request sent. <Link to="/customer/reservations" className="font-semibold underline">Go to my reservations</Link>
          </p>
        )}

        <button
          onClick={submit}
          disabled={reserve.isPending || reserve.isSuccess || !signedIn}
          className="mt-2 flex h-11 w-full items-center justify-between rounded-xl bg-primary px-4 text-xs font-medium text-on-primary transition-all hover:opacity-95 active:scale-[0.99] disabled:opacity-60"
        >
          <span className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">lock</span>
            <span>{reserve.isPending ? 'Sending…' : 'Authorize 20% deposit to lock parcel'}</span>
          </span>
          <span className="font-mono font-semibold">{total ? rupees(deposit) : '—'}</span>
        </button>
        <p className="mt-1 flex items-center justify-center gap-1 text-center text-[11px] text-on-surface-variant">
          <span className="material-symbols-outlined text-xs text-primary">verified_user</span>
          The farmer has 48 hours to accept before any deposit is asked
        </p>
        <button type="button" onClick={onBack} className="w-full text-center text-xs text-on-surface-variant underline hover:text-on-surface">
          Back to all plots
        </button>
      </div>
    </>
  )
}
