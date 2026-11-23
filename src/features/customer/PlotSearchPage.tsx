import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { ApiError } from '@/api/http'
import { PlaceSearch } from '@/components/PlaceSearch'
import { useAuth } from '@/features/auth/authContext'
import { day, landApi, rupees, type Bounds, type PlotFeature } from './land'
import { getLeaflet } from './leaflet'
import { PlotMap } from './PlotMap'

const SEASONS = ['Kharif', 'Rabi', 'Zaid']

export function PlotSearchPage({ publicView = false }: { publicView?: boolean }) {
  const [focus, setFocus] = useState<{ lat: number; lng: number } | null>(null)
  const hasMap = getLeaflet() !== null
  const [bounds, setBounds] = useState<Bounds | null>(null)
  const [season, setSeason] = useState('')
  const [crop, setCrop] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const crops = useQuery({ queryKey: ['crops'], queryFn: landApi.crops, staleTime: 3_600_000 })
  const cropName = useMemo(() => new Map((crops.data ?? []).map((c) => [c.id, c.name])), [crops.data])
  // With a map we wait for its first view; without one we search a wide area straight away.
  const ready = !hasMap || bounds !== null
  const search = useQuery({
    queryKey: ['plots', bounds, season, crop],
    queryFn: () => landApi.searchPlots(bounds, { season, crop }),
    enabled: ready,
    placeholderData: (previous) => previous,
  })
  const plots = search.data ?? []
  const selected = plots.find((p) => p.id === selectedId) ?? null

  return (
    <div className={`${publicView ? '' : 'mt-8 '}grid items-start gap-6 lg:grid-cols-12`}>
      <div className="space-y-4 lg:sticky lg:top-24 lg:col-span-7">
        <PlaceSearch placeholder="Search a village, town or address to find land nearby…" onPick={(r) => setFocus({ lat: r.lat, lng: r.lng })} />
        <div className="flex flex-wrap gap-3">
          <label className="block">
            <span className="block text-sm font-semibold">Season</span>
            <select value={season} onChange={(e) => setSeason(e.target.value)} className="mt-1 h-12 rounded-xl bg-surface-container px-4 text-label-lg">
              <option value="">Any season</option>
              {SEASONS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="block text-sm font-semibold">Crop</span>
            <select value={crop} onChange={(e) => setCrop(e.target.value)} className="mt-1 h-12 rounded-xl bg-surface-container px-4 text-label-lg">
              <option value="">Any crop</option>
              {(crops.data ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        {hasMap ? (
          <PlotMap plots={plots} selectedId={selectedId} onSelect={setSelectedId} onBoundsChange={setBounds} focus={focus} />
        ) : (
          <p role="note" className="rounded-xl border border-gray-800 bg-neutral-950 px-4 py-3 text-sm text-gray-300">
            The map could not load, so these are plots within 200 km of central India. Refresh to try the map again.
          </p>
        )}
      </div>

      <div className="space-y-4 lg:col-span-5">
        {selected ? (
          <ReservePanel plot={selected} cropName={cropName} onClose={() => setSelectedId(null)} />
        ) : (
          <>
            <p aria-live="polite" className="font-semibold">
              {search.isPending && ready ? 'Searching…' : `${plots.length} ${plots.length === 1 ? 'plot' : 'plots'} open in this area`}
            </p>
            {search.isError && (
              <p role="alert" className="font-semibold text-red-400">
                Could not load plots. Move the map or refresh to try again.
              </p>
            )}
            <ul className="space-y-3 lg:max-h-[620px] lg:overflow-y-auto lg:pr-1">
              {plots.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(p.id)}
                    className="w-full rounded-2xl bg-surface-container p-5 text-left shadow-md transition-all hover:bg-surface-container-high"
                  >
                    <span className="flex items-start justify-between gap-3">
                      <span className="font-headline-sm text-headline-sm text-on-surface">{p.properties.title}</span>
                      <span className="shrink-0 rounded-full bg-primary/15 px-2.5 py-0.5 text-label-sm font-bold tracking-wider text-primary uppercase">
                        {p.properties.season}
                      </span>
                    </span>
                    <span className="mt-1 block text-body-sm text-on-surface-variant">
                      {p.properties.areaAcres} acres · {day(p.properties.startDate)} to {day(p.properties.endDate)}
                    </span>
                    <span className="mt-3 flex items-baseline gap-1">
                      <span className="font-headline-sm text-headline-sm font-bold text-secondary">{rupees(p.properties.price)}</span>
                      <span className="text-body-sm text-outline">per kg of harvest</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            {!search.isPending && plots.length === 0 && !search.isError && (
              <p className="text-ink-soft">No open plots here. Zoom out, move the map, or clear the filters.</p>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function ReservePanel({ plot, cropName, onClose }: { plot: PlotFeature; cropName: Map<string, string>; onClose: () => void }) {
  const p = plot.properties
  const [crop, setCrop] = useState(p.allowedCrops[0] ?? '')
  const [qty, setQty] = useState('')
  const [error, setError] = useState<string>()
  const reserve = useMutation({
    mutationFn: () => landApi.reserve(p.plotSeasonId, crop, Number(qty)),
    onError: (e) => setError(e instanceof ApiError ? e.message : 'Could not reach the server. Try again.'),
  })
  const { user } = useAuth()
  const quantity = Number(qty)
  const total = quantity > 0 ? quantity * p.price : null

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(undefined)
    if (!crop) return setError('Choose a crop.')
    if (!(quantity > 0)) return setError('Enter how many kilograms you expect.')
    reserve.mutate()
  }

  if (reserve.isSuccess) {
    return (
      <div className="card p-5" role="status">
        <h2 className="font-display text-2xl">Request sent</h2>
        <p className="mt-2 text-ink-soft">
          The farmer has 48 hours to accept. Once they do, pay the deposit from your reservations to confirm the plot.
        </p>
        <Link to="/customer/reservations" className="mt-4 inline-block font-semibold text-primary underline">
          Go to my reservations
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4 card p-5">
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-display text-2xl">{p.title}</h2>
        <button type="button" onClick={onClose} className="text-ink-soft underline">
          Back to results
        </button>
      </div>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        <dt className="text-ink-soft">Size</dt>
        <dd>{p.areaAcres} acres</dd>
        <dt className="text-ink-soft">Season</dt>
        <dd>
          {p.season}, {day(p.startDate)} to {day(p.endDate)}
        </dd>
        <dt className="text-ink-soft">Price</dt>
        <dd>{rupees(p.price)} per kg of harvest</dd>
      </dl>
      <label className="block">
        <span className="block font-semibold">Crop to grow</span>
        <select value={crop} onChange={(e) => setCrop(e.target.value)} className="mt-1 h-12 w-full rounded-xl bg-surface-container-high px-4">
          {p.allowedCrops.length === 0 && <option value="">No crops listed</option>}
          {p.allowedCrops.map((c) => (
            <option key={c} value={c}>
              {cropName.get(c) ?? c}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="block font-semibold">Expected harvest (kg)</span>
        <input type="number" min="1" step="any" inputMode="decimal" value={qty} onChange={(e) => setQty(e.target.value)} className="mt-1 h-12 w-full rounded-xl bg-surface-container-high px-4" />
      </label>
      {total !== null && (
        <p>
          Estimated total <strong>{rupees(total)}</strong>. A deposit is asked once the farmer accepts.
        </p>
      )}
      {error && (
        <p role="alert" className="font-semibold text-red-400">
          {error}
        </p>
      )}
      {!user && (
        <p className="rounded-lg bg-surface-container-high px-3 py-2 text-body-sm text-on-surface-variant">
          <Link to="/login" className="font-semibold text-primary underline">Sign in</Link> as a customer to request this plot.
        </p>
      )}
      <button type="submit" disabled={reserve.isPending || !user} className="w-full rounded-xl bg-primary px-5 py-2.5 font-semibold text-on-primary transition-colors hover:brightness-110 disabled:opacity-60">
        {reserve.isPending ? 'Sending…' : 'Request this plot'}
      </button>
    </form>
  )
}
