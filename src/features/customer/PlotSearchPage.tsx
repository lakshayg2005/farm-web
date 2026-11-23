import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { ApiError } from '@/api/http'
import { day, landApi, rupees, type Bounds, type PlotFeature } from './land'
import { getLeaflet } from './leaflet'
import { PlotMap } from './PlotMap'

const SEASONS = ['Kharif', 'Rabi', 'Zaid']

export function PlotSearchPage() {
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
  const selected = plots.find((p) => p.properties.plotSeasonId === selectedId) ?? null

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <label className="block">
            <span className="block text-sm font-semibold">Season</span>
            <select value={season} onChange={(e) => setSeason(e.target.value)} className="mt-1 input">
              <option value="">Any season</option>
              {SEASONS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="block text-sm font-semibold">Crop</span>
            <select value={crop} onChange={(e) => setCrop(e.target.value)} className="mt-1 input">
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
          <PlotMap plots={plots} selectedId={selectedId} onSelect={setSelectedId} onBoundsChange={setBounds} />
        ) : (
          <p role="note" className="rounded-lg bg-white px-3 py-2.5 text-sm">
            The map could not load, so these are plots within 200 km of central India. Refresh to try the map again.
          </p>
        )}
      </div>

      <div className="space-y-4">
        {selected ? (
          <ReservePanel plot={selected} cropName={cropName} onClose={() => setSelectedId(null)} />
        ) : (
          <>
            <p aria-live="polite" className="font-semibold">
              {search.isPending && ready ? 'Searching…' : `${plots.length} ${plots.length === 1 ? 'plot' : 'plots'} open in this area`}
            </p>
            {search.isError && (
              <p role="alert" className="font-semibold text-danger">
                Could not load plots. Move the map or refresh to try again.
              </p>
            )}
            <ul className="space-y-2 lg:max-h-[34rem] lg:overflow-y-auto lg:pr-1">
              {plots.map((p) => (
                <li key={p.properties.plotSeasonId}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(p.properties.plotSeasonId)}
                    className="min-h-11 w-full card px-4 py-3 text-left hover:border-primary"
                  >
                    <span className="block font-display text-lg">{p.properties.title}</span>
                    <span className="block text-sm text-ink-soft">
                      {Number(p.properties.areaAcres).toFixed(2)} acres · {p.properties.season}, {day(p.properties.startDate)} to {day(p.properties.endDate)}
                    </span>
                    <span className="mt-0.5 block text-sm">
                      <strong>{rupees(p.properties.price)}</strong> per kg of harvest
                      {p.properties.allowedCrops.length > 0 && (
                        <span className="text-ink-soft"> · {p.properties.allowedCrops.map((c) => cropName.get(c) ?? c).join(', ')}</span>
                      )}
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
        <dd>{Number(p.areaAcres).toFixed(2)} acres</dd>
        <dt className="text-ink-soft">Season</dt>
        <dd>
          {p.season}, {day(p.startDate)} to {day(p.endDate)}
        </dd>
        <dt className="text-ink-soft">Price</dt>
        <dd>{rupees(p.price)} per kg of harvest</dd>
      </dl>
      <label className="block">
        <span className="block font-semibold">Crop to grow</span>
        <select value={crop} onChange={(e) => setCrop(e.target.value)} className="input mt-1">
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
        <input type="number" min="1" step="any" inputMode="decimal" value={qty} onChange={(e) => setQty(e.target.value)} className="input mt-1" />
      </label>
      {total !== null && (
        <p>
          Estimated total <strong>{rupees(total)}</strong>. A deposit is asked once the farmer accepts.
        </p>
      )}
      {error && (
        <p role="alert" className="font-semibold text-danger">
          {error}
        </p>
      )}
      <button type="submit" disabled={reserve.isPending} className="w-full btn-primary">
        {reserve.isPending ? 'Sending…' : 'Request this plot'}
      </button>
    </form>
  )
}
