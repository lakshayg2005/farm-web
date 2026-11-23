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
  const [modalOpen, setModalOpen] = useState(false)

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
  const selected = plots.find((p) => p.id === selectedId) ?? null
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

  function open(plot: PlotFeature) {
    setSelectedId(plot.id)
    setModalOpen(true)
  }

  return (
    <>
      <SiteHeader />
      <div className="flex w-full flex-col">
        <section className="w-full bg-surface-container-low px-6 py-8 shadow-sm lg:px-12">
          <div className="mx-auto flex max-w-[1440px] flex-col justify-between gap-6 xl:flex-row xl:items-end">
            <div className="max-w-2xl space-y-2">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 animate-pulse rounded-full bg-primary"></span>
                <span className="text-label-sm tracking-widest text-primary uppercase">Seasonal Land Protocol · Live Plots</span>
              </div>
              <h1 className="font-headline-xl text-headline-xl text-on-surface">Find land</h1>
              <p className="text-body-md text-on-surface-variant">
                Search the verified grid for nutrient-dense plots near you and secure acreage for the impending cultivation cycle.
              </p>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-[260px] flex-1 sm:flex-initial">
                <span className="material-symbols-outlined absolute top-1/2 left-3.5 -translate-y-1/2 text-[20px] text-outline">pin_drop</span>
                <input
                  className="h-12 w-full rounded-xl bg-surface-container pr-4 pl-10 text-body-sm text-on-surface outline-none transition-all placeholder:text-outline focus:bg-surface-container-highest"
                  placeholder="Search a village, town or address"
                  value={placeText}
                  onChange={(e) => setPlaceText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void findPlace()
                  }}
                />
              </div>
              <div className="relative min-w-[150px]">
                <select
                  value={season}
                  onChange={(e) => setSeason(e.target.value)}
                  aria-label="Season"
                  className="h-12 w-full cursor-pointer appearance-none rounded-xl bg-surface-container px-4 pr-10 text-label-lg text-on-surface outline-none hover:bg-surface-container-high"
                >
                  {SEASONS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-outline">expand_more</span>
              </div>
              <div className="relative min-w-[150px]">
                <select
                  value={crop}
                  onChange={(e) => setCrop(e.target.value)}
                  aria-label="Crop"
                  className="h-12 w-full cursor-pointer appearance-none rounded-xl bg-surface-container px-4 pr-10 text-label-lg text-on-surface outline-none hover:bg-surface-container-high"
                >
                  <option value="">Any crop</option>
                  {(crops.data ?? []).map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-outline">expand_more</span>
              </div>
              <button
                onClick={() => {
                  setSeason('')
                  setCrop('')
                  setPlaceText('')
                  notify('Filters reset to default')
                }}
                aria-label="Reset filters"
                className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-container text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[20px]">filter_alt_off</span>
              </button>
            </div>
          </div>
        </section>

        {/* Map and Plot Cards */}
        <section className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-12">
          <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
            {/* Map Left View */}
            <div className="sticky top-24 flex flex-col gap-4 lg:col-span-7">
              <div className="relative h-[620px] w-full overflow-hidden rounded-2xl bg-surface-container shadow-xl">
                {hasMap ? (
                  <div className="h-full w-full [&>div]:!h-full [&>div]:!rounded-none">
                    <PlotMap plots={plots} selectedId={selectedId} onSelect={(id) => setSelectedId(id)} onBoundsChange={setBounds} focus={focus} />
                  </div>
                ) : (
                  <p className="grid h-full place-items-center px-6 text-center text-on-surface-variant">
                    The map could not load. Refresh the page to try again.
                  </p>
                )}
                <div className="pointer-events-none absolute inset-x-4 top-4 z-[500] flex items-center justify-between">
                  <div className="pointer-events-auto ml-12 flex items-center gap-2 rounded-full bg-surface/90 px-3 py-1.5 shadow-md backdrop-blur-md">
                    <span className="h-2 w-2 rounded-full bg-secondary"></span>
                    <span className="text-label-sm text-on-surface">Layer: Open plots in view</span>
                  </div>
                  <div className="pointer-events-auto flex items-center gap-3 rounded-full bg-surface/90 px-3 py-1.5 text-label-sm shadow-md backdrop-blur-md">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-primary/30"></span>
                      <span className="text-on-surface">Open Plot</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-secondary"></span>
                      <span className="text-on-surface">Selected</span>
                    </div>
                  </div>
                </div>
                <div className="pointer-events-none absolute right-4 bottom-4 left-4 z-[500] flex items-center justify-between">
                  <div className="pointer-events-auto flex items-center gap-3 rounded-xl bg-surface-container-high/90 px-3 py-1.5 shadow-lg backdrop-blur-md">
                    <span className="text-label-sm text-outline">
                      {bounds
                        ? `Lat ${((bounds.north + bounds.south) / 2).toFixed(4)}° N, Lon ${((bounds.east + bounds.west) / 2).toFixed(4)}° E`
                        : 'Move the map to search an area'}
                    </span>
                    <span className="text-outline-variant">•</span>
                    <span className="text-label-sm text-primary">{plots.length} plots in view</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col justify-between rounded-xl bg-surface-container p-4 shadow-sm">
                  <span className="text-label-sm tracking-wider text-on-surface-variant uppercase">Plots In View</span>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="font-headline-sm text-headline-sm font-bold text-on-surface">{plots.length}</span>
                    <span className="text-label-sm text-primary">open</span>
                  </div>
                  <span className="mt-1 text-label-sm text-outline">Updates as you move the map</span>
                </div>
                <div className="flex flex-col justify-between rounded-xl bg-surface-container p-4 shadow-sm">
                  <span className="text-label-sm tracking-wider text-on-surface-variant uppercase">Open Acreage</span>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="font-headline-sm text-headline-sm font-bold text-on-surface">{acres.toFixed(1)}</span>
                    <span className="text-label-sm text-secondary">acres</span>
                  </div>
                  <span className="mt-1 text-label-sm text-outline">Measured from the drawn boundaries</span>
                </div>
                <div className="flex flex-col justify-between rounded-xl bg-surface-container p-4 shadow-sm">
                  <span className="text-label-sm tracking-wider text-on-surface-variant uppercase">Avg Season Rate</span>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="font-headline-sm text-headline-sm font-bold text-primary">{rupees(Math.round(avgRate))}</span>
                    <span className="text-label-sm text-on-surface-variant">/ kg</span>
                  </div>
                  <span className="mt-1 text-label-sm text-outline">Paid on the harvest you take</span>
                </div>
              </div>
            </div>

            {/* Right Plot List */}
            <div className="flex flex-col gap-4 lg:col-span-5">
              <div className="flex items-center justify-between pb-1">
                <div>
                  <span className="font-headline-sm text-headline-sm text-on-surface">Available plots</span>
                  <p className="text-label-sm text-on-surface-variant" aria-live="polite">
                    {search.isPending && ready ? 'Searching…' : `${plots.length} plots open in this area`}
                  </p>
                </div>
                <div className="flex items-center gap-1 rounded-xl bg-surface-container-high p-1">
                  <button className="rounded-lg bg-surface-container-highest px-2.5 py-1 text-label-sm text-primary">Active</button>
                </div>
              </div>

              {search.isError && (
                <p role="alert" className="font-semibold text-error">
                  Could not load plots. Move the map or refresh to try again.
                </p>
              )}

              <div className="flex max-h-[760px] flex-col gap-3.5 overflow-y-auto pr-1">
                {plots.map((item, idx) => {
                  const p = item.properties
                  return (
                    <div
                      key={item.id}
                      onClick={() => open(item)}
                      className={`group relative cursor-pointer rounded-2xl bg-surface-container p-4 shadow-md transition-all hover:bg-surface-container-high ${
                        idx === 0 || item.id === selectedId ? 'bg-gradient-to-r from-surface-container via-surface-container to-primary/5 ring-1 ring-primary/40' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-label-sm font-bold text-primary">
                              <span className="material-symbols-outlined text-[14px]">verified</span>
                              Boundary Verified
                            </span>
                            <span className="text-label-sm text-outline">{plotCode(item.id)}</span>
                          </div>
                          <h2 className="font-headline-sm text-headline-sm text-on-surface transition-colors group-hover:text-primary">{p.title}</h2>
                          <p className="text-body-sm text-on-surface-variant">
                            {p.areaAcres} acres • {p.season} Season • {day(p.startDate)} to {day(p.endDate)}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <span className="font-headline-sm text-headline-sm font-bold text-primary">{rupees(p.price)}</span>
                          <span className="block text-label-sm text-on-surface-variant">per kg of harvest</span>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-1.5 rounded-xl bg-surface-container-lowest/40 p-2.5 pt-3">
                        {p.allowedCrops.length === 0 && <span className="text-label-sm text-on-surface-variant">Crops decided with the farmer</span>}
                        {p.allowedCrops.map((c) => (
                          <span key={c} className="inline-flex items-center gap-1 rounded-lg bg-surface-container px-2.5 py-1 text-label-sm text-on-surface">
                            <span className="material-symbols-outlined text-[14px] text-secondary">water_drop</span> {cropName.get(c) ?? c}
                          </span>
                        ))}
                      </div>

                      <div className="mt-3 flex items-center justify-between pt-1">
                        <span className="text-label-sm text-on-surface-variant">Reservation ends {day(p.endDate)}</span>
                        <button className="flex items-center gap-1 rounded-xl bg-primary px-3 py-1.5 text-label-sm font-bold text-on-primary shadow-sm transition-all hover:brightness-110">
                          <span>View & Reserve</span>
                          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                        </button>
                      </div>
                    </div>
                  )
                })}
                {!search.isPending && plots.length === 0 && !search.isError && (
                  <p className="text-on-surface-variant">No open plots here. Zoom out, move the map, or reset the filters.</p>
                )}
              </div>
            </div>
          </div>
        </section>

        {modalOpen && selected && (
          <PlotModal plot={selected} cropName={cropName} signedIn={!!user} onClose={() => setModalOpen(false)} />
        )}
      </div>
      <SiteFooter />
    </>
  )
}

/** Slide-over for one plot: its record and the request to reserve it. */
function PlotModal({ plot, cropName, signedIn, onClose }: { plot: PlotFeature; cropName: Map<string, string>; signedIn: boolean; onClose: () => void }) {
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

  return (
    <div className="fixed inset-0 z-[1500] flex justify-end bg-background/80 backdrop-blur-md">
      <div className="flex-1 cursor-pointer" onClick={onClose}></div>
      <div className="flex h-full w-full max-w-2xl flex-col justify-between overflow-y-auto bg-surface-container-low p-6 shadow-2xl lg:p-8" role="dialog" aria-label={p.title}>
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-4">
            <div className="flex items-center gap-3">
              <span className="h-3 w-3 rounded-full bg-primary shadow-[0_0_8px_#2ec47a]"></span>
              <div>
                <span className="text-label-sm font-bold tracking-wider text-primary uppercase">Plot Record</span>
                <h2 className="font-headline-md text-headline-md text-on-surface">{p.title}</h2>
              </div>
            </div>
            <button onClick={onClose} aria-label="Close" className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface">
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          <div className="relative h-48 w-full overflow-hidden rounded-2xl bg-surface-container shadow-md">
            <img className="h-full w-full object-cover" alt="Farmland" src="/img/p15.jpg" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent"></div>
            <div className="absolute right-4 bottom-3 left-4 flex items-center justify-between">
              <span className="rounded-full bg-primary/20 px-2.5 py-1 text-label-sm font-bold text-primary backdrop-blur-md">✓ Boundary verified · {plotCode(plot.id)}</span>
              <span className="text-label-sm font-semibold text-on-surface">{p.areaAcres} Net Acres</span>
            </div>
          </div>

          {/* Season profile */}
          <div className="space-y-3 rounded-2xl bg-surface-container p-4">
            <div className="flex items-center justify-between">
              <span className="text-label-md tracking-wider text-on-surface uppercase">Season Profile</span>
              <span className="text-label-sm text-primary">{p.season}</span>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="rounded-xl bg-surface-container-high p-2.5">
                <span className="block text-label-sm text-on-surface-variant">Season</span>
                <span className="font-headline-sm text-headline-sm font-bold text-on-surface">{p.season}</span>
              </div>
              <div className="rounded-xl bg-surface-container-high p-2.5">
                <span className="block text-label-sm text-on-surface-variant">Starts</span>
                <span className="font-headline-sm text-headline-sm font-bold text-on-surface">{day(p.startDate)}</span>
              </div>
              <div className="rounded-xl bg-surface-container-high p-2.5">
                <span className="block text-label-sm text-on-surface-variant">Ends</span>
                <span className="font-headline-sm text-headline-sm font-bold text-on-surface">{day(p.endDate)}</span>
              </div>
              <div className="rounded-xl bg-surface-container-high p-2.5">
                <span className="block text-label-sm text-on-surface-variant">Crops</span>
                <span className="font-headline-sm text-headline-sm font-bold text-on-surface">{p.allowedCrops.length}</span>
                <span className="block text-label-sm text-secondary">allowed</span>
              </div>
            </div>
          </div>

          {/* Request */}
          <div className="space-y-3 rounded-2xl bg-surface-container-high p-4">
            <span className="text-label-md tracking-wider text-on-surface uppercase">Your Request</span>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-label-sm text-on-surface-variant">
                Crop to grow
                <select value={crop} onChange={(e) => setCrop(e.target.value)} className="mt-1 h-12 w-full rounded-xl bg-surface-container px-4 text-body-md text-on-surface">
                  {p.allowedCrops.length === 0 && <option value="">No crops listed</option>}
                  {p.allowedCrops.map((c) => (
                    <option key={c} value={c}>
                      {cropName.get(c) ?? c}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-label-sm text-on-surface-variant">
                Expected harvest (kg)
                <input type="number" min="1" step="any" inputMode="decimal" value={qty} onChange={(e) => setQty(e.target.value)} className="mt-1 h-12 w-full rounded-xl bg-surface-container px-4 text-body-md text-on-surface" />
              </label>
            </div>
            <div className="space-y-1.5 pt-1 text-sm">
              <div className="flex justify-between text-on-surface-variant">
                <span>Price per kg of harvest</span>
                <span className="font-semibold text-on-surface">{rupees(p.price)}</span>
              </div>
              <div className="flex justify-between text-on-surface-variant">
                <span>Estimated seasonal value</span>
                <span className="text-on-surface">{total ? rupees(total) : '—'}</span>
              </div>
              <div className="mt-2 flex items-center justify-between rounded-xl bg-primary/10 p-3 text-primary">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">lock</span>
                  <span className="text-label-md font-bold">Deposit once accepted (20%)</span>
                </div>
                <span className="font-headline-sm text-headline-sm font-bold">{total ? rupees(deposit) : '—'}</span>
              </div>
            </div>
            {error && (
              <p role="alert" className="font-semibold text-error">
                {error}
              </p>
            )}
            {!signedIn && (
              <p className="rounded-lg bg-surface-container px-3 py-2 text-body-sm text-on-surface-variant">
                <Link to="/login" className="font-semibold text-primary underline">Sign in</Link> as a customer to request this plot.
              </p>
            )}
            {reserve.isSuccess && (
              <p role="status" className="rounded-lg bg-primary/10 px-3 py-2 text-body-sm text-primary">
                Request sent. <Link to="/customer/reservations" className="font-semibold underline">Go to my reservations</Link>
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 flex items-center gap-4 border-t border-surface-container pt-6">
          <button onClick={onClose} className="h-12 flex-1 rounded-xl bg-surface-container text-label-lg text-on-surface transition-colors hover:bg-surface-container-high">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={reserve.isPending || reserve.isSuccess || !signedIn}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-primary text-label-lg font-bold text-on-primary shadow-lg transition-all hover:brightness-110 disabled:opacity-60"
          >
            <span>{reserve.isPending ? 'Sending…' : total ? `Request plot · ${rupees(deposit)} deposit` : 'Request this plot'}</span>
            <span className="material-symbols-outlined text-[18px]">verified_user</span>
          </button>
        </div>
      </div>
    </div>
  )
}
