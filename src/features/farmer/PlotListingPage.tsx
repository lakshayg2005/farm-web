import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { api, ApiError } from '@/api/http'
import { OwnerPhotos } from '@/components/OwnerPhotos'
import { PlaceSearch } from '@/components/PlaceSearch'
import { ErrorState, ListSkeleton, StatusChip } from '@/components/ui'
import { useAuth } from '@/features/auth/authContext'
import { day, landApi, rupees, type Crop } from '@/features/customer/land'
import { farmerLandApi, loadMyPlots, type PlotWithSeasons, type Season } from './reservations'
import { mediaUploadPayload, plotCreatePayload, seasonCreatePayload, seasonProblem, type Polygon } from './plotPayloads'

type PlotCreated = { id: string; areaAcres: number }

const SEASON_NAMES = ['Kharif', 'Rabi', 'Zaid', 'Summer', 'Winter']

function errorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (Array.isArray(error.details) && error.details.length) {
      const fields = (error.details as { field?: string; message?: string }[])
        .map((d) => `${(d.field ?? '').replace(/^body\./, '')}: ${d.message ?? ''}`)
        .join('; ')
      return `${error.message} (${fields})`
    }
    const details = error.details as { plotId?: string } | undefined
    return details?.plotId ? `${error.message} (overlapping plot: ${details.plotId})` : error.message
  }
  return error instanceof Error ? error.message : 'Could not save the plot. Please try again.'
}

/** Keeps the map and season lists current after anything changes a plot. */
function useRefreshPlots() {
  const queryClient = useQueryClient()
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['farmer-plots'] }),
      queryClient.invalidateQueries({ queryKey: ['farmer-season-index'] }),
    ])
}

export function PlotListingPage() {
  const plots = useQuery({ queryKey: ['farmer-plots'], queryFn: loadMyPlots })
  const crops = useQuery({ queryKey: ['crops'], queryFn: landApi.crops, staleTime: 3_600_000 })
  const [adding, setAdding] = useState(false)
  const [notice, setNotice] = useState('')
  const [highlight, setHighlight] = useState<string | null>(null)
  const verified = !!useAuth().user?.farmerVerified
  const cropName = (id: string) => crops.data?.find((c) => c.id === id)?.name ?? id

  if (plots.isPending) return <ListSkeleton label="Loading your plots" />
  if (plots.isError)
    return <ErrorState title="Could not load your plots" body="Check your connection and try again." onRetry={() => void plots.refetch()} />

  const list = plots.data
  // Land only lets an admin-verified farmer offer a plot, so no form until then (the banner says why).
  if (!verified && list.length === 0)
    return <p className="mt-8 max-w-xl text-ink-soft">Once an admin verifies you, list your plots here with their seasons and prices.</p>
  // A farmer with no plots goes straight to the form; everyone else sees what they have first.
  const showForm = adding || list.length === 0

  return (
    <section className="mt-8 max-w-5xl space-y-6">
      {notice && (
        <p role="status" className="card border-primary/40 bg-[#dff1e6] p-3 text-sm font-semibold text-[#12522f]">
          {notice}
        </p>
      )}

      {showForm ? (
        <NewPlotForm
          crops={crops.data ?? []}
          cropsFailed={crops.isError}
          hasPlots={list.length > 0}
          onCancel={() => setAdding(false)}
          onSaved={(plot, message) => {
            setAdding(false)
            setHighlight(plot.id)
            setNotice(message)
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
        />
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-2xl">
              Your plots <span className="text-ink-soft">({list.length})</span>
            </h2>
            {verified && (
              <button
                type="button"
                className="btn-primary"
                onClick={() => {
                  setNotice('')
                  setAdding(true)
                }}
              >
                List a new plot
              </button>
            )}
          </div>
          <ul className="space-y-4">
            {list.map((entry) => (
              <li key={entry.plot.id}>
                <PlotCard entry={entry} crops={crops.data ?? []} cropName={cropName} isNew={entry.plot.id === highlight} />
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}

/* ---------------------------------------------------------------- one plot in the list */

function PlotCard({ entry, crops, cropName, isNew }: { entry: PlotWithSeasons; crops: Crop[]; cropName: (id: string) => string; isNew: boolean }) {
  const { plot, seasons } = entry
  const refresh = useRefreshPlots()
  const [addingSeason, setAddingSeason] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState(false)
  const [error, setError] = useState('')
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    if (isNew) ref.current?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [isNew])

  const remove = useMutation({
    mutationFn: () => farmerLandApi.removePlot(plot.id),
    onSuccess: () => void refresh(),
    onError: (e) => {
      setError(errorMessage(e))
      setConfirmRemove(false)
    },
  })
  const removeSeason = useMutation({
    mutationFn: (s: Season) => farmerLandApi.removeSeason(plot.id, s.id),
    onSuccess: () => void refresh(),
    onError: (e) => setError(errorMessage(e)),
  })

  const details = [plot.soilType, plot.waterSource].filter(Boolean).join(' · ')
  return (
    <article ref={ref} className={`card p-4 sm:p-5 ${isNew ? 'border-primary ring-2 ring-primary/30' : ''}`}>
      <div className="flex gap-4">
        <div className="hidden shrink-0 empty:hidden sm:block">
          <OwnerPhotos ownerType="PLOT" ownerId={plot.id} size="sm" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 className="font-display text-xl leading-tight">{plot.title}</h3>
            <span className="flex items-center gap-2">
              {isNew && <StatusChip tone="info">Just added</StatusChip>}
              <StatusChip tone={plot.status === 'ACTIVE' ? 'good' : 'neutral'}>{plot.status === 'ACTIVE' ? 'Listed' : plot.status}</StatusChip>
            </span>
          </div>
          <p className="mt-0.5 text-ink-soft">
            {Number(plot.areaAcres).toFixed(2)} acres{details && ` · ${details}`}
          </p>
          <div className="mt-3 empty:hidden sm:hidden">
            <OwnerPhotos ownerType="PLOT" ownerId={plot.id} size="sm" />
          </div>
        </div>
      </div>

      <h4 className="mt-4 text-sm font-semibold">Growing seasons</h4>
      {seasons.length === 0 ? (
        <p className="mt-1 text-ink-soft">No season yet. Customers can only find a plot once it has a season.</p>
      ) : (
        <ul className="mt-2 divide-y divide-line rounded-lg border border-line">
          {seasons.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-3 py-2.5">
              <div className="min-w-0">
                <p className="font-semibold">
                  {s.season} <span className="font-normal text-ink-soft">· {day(s.startDate)} to {day(s.endDate)}</span>
                </p>
                <p className="text-sm text-ink-soft">
                  {rupees(s.price)} per kg · {s.allowedCrops.length > 0 ? s.allowedCrops.map(cropName).join(', ') : 'no crops chosen'}
                </p>
              </div>
              <button
                type="button"
                disabled={removeSeason.isPending}
                onClick={() => {
                  setError('')
                  removeSeason.mutate(s)
                }}
                className="min-h-11 px-1 text-sm text-ink-soft underline hover:text-danger"
                aria-label={`Remove the ${s.season} season of ${plot.title}`}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      {addingSeason ? (
        <AddSeasonForm plotId={plot.id} crops={crops} onDone={() => setAddingSeason(false)} />
      ) : (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button type="button" className="btn-secondary" onClick={() => setAddingSeason(true)}>
            Add a season
          </button>
          {confirmRemove ? (
            <>
              <span className="text-sm">Remove this plot and its seasons?</span>
              <button type="button" disabled={remove.isPending} onClick={() => remove.mutate()} className="btn-danger">
                {remove.isPending ? 'Removing…' : 'Yes, remove'}
              </button>
              <button type="button" onClick={() => setConfirmRemove(false)} className="underline">
                Keep it
              </button>
            </>
          ) : (
            <button type="button" onClick={() => setConfirmRemove(true)} className="min-h-11 px-1 text-ink-soft underline hover:text-danger">
              Remove plot
            </button>
          )}
        </div>
      )}
      {error && (
        <p role="alert" className="mt-3 font-semibold text-danger">
          {error}
        </p>
      )}
    </article>
  )
}

function AddSeasonForm({ plotId, crops, onDone }: { plotId: string; crops: Crop[]; onDone: () => void }) {
  const refresh = useRefreshPlots()
  const [f, setF] = useState<SeasonFields>(emptySeason)
  const [error, setError] = useState('')
  const save = useMutation({
    mutationFn: () => farmerLandApi.addSeason(plotId, seasonCreatePayload(f.season, f.startDate, f.endDate, f.price, f.crops)),
    onSuccess: async () => {
      await refresh()
      onDone()
    },
    onError: (e) => setError(errorMessage(e)),
  })
  function submit(e: FormEvent) {
    e.preventDefault()
    const problem = seasonProblem(f) ?? (f.crops.length === 0 ? 'Choose at least one crop that can be grown.' : null)
    if (problem) return setError(problem)
    setError('')
    save.mutate()
  }
  return (
    <form onSubmit={submit} noValidate className="mt-4 rounded-lg bg-paper p-3 sm:p-4">
      <h4 className="font-semibold">Add a season</h4>
      <SeasonInputs value={f} onChange={setF} crops={crops} />
      {error && (
        <p role="alert" className="mt-3 font-semibold text-danger">
          {error}
        </p>
      )}
      <div className="mt-4 flex gap-3">
        <button type="submit" disabled={save.isPending} className="btn-primary">
          {save.isPending ? 'Saving…' : 'Save season'}
        </button>
        <button type="button" onClick={onDone} className="btn-secondary">
          Cancel
        </button>
      </div>
    </form>
  )
}

/* ---------------------------------------------------------------- season fields, shared */

interface SeasonFields {
  season: string
  startDate: string
  endDate: string
  price: string
  crops: string[]
}
const emptySeason: SeasonFields = { season: 'Kharif', startDate: '', endDate: '', price: '', crops: [] }

function SeasonInputs({ value: f, onChange, crops, cropsFailed }: { value: SeasonFields; onChange: (v: SeasonFields) => void; crops: Crop[]; cropsFailed?: boolean }) {
  const set = (patch: Partial<SeasonFields>) => onChange({ ...f, ...patch })
  const toggle = (id: string) => set({ crops: f.crops.includes(id) ? f.crops.filter((c) => c !== id) : [...f.crops, id] })
  return (
    <div className="mt-3 grid gap-4 sm:grid-cols-2">
      <label className="grid gap-1 text-sm font-semibold">
        Season
        <select value={f.season} onChange={(e) => set({ season: e.target.value })} className="input font-normal">
          {SEASON_NAMES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </label>
      <label className="grid gap-1 text-sm font-semibold">
        Price per kg of harvest (INR)
        <input type="number" inputMode="decimal" min="0.01" step="0.01" value={f.price} onChange={(e) => set({ price: e.target.value })} className="input font-normal" placeholder="14" />
      </label>
      <label className="grid gap-1 text-sm font-semibold">
        Season start
        <input type="date" value={f.startDate} onChange={(e) => set({ startDate: e.target.value, endDate: f.endDate && f.endDate <= e.target.value ? '' : f.endDate })} className="input font-normal" />
      </label>
      <label className="grid gap-1 text-sm font-semibold">
        Season end
        <input type="date" min={f.startDate || undefined} value={f.endDate} onChange={(e) => set({ endDate: e.target.value })} className="input font-normal" />
      </label>
      <fieldset className="sm:col-span-2">
        <legend className="text-sm font-semibold">Crops customers can choose</legend>
        {cropsFailed && <p className="mt-1 text-sm text-danger">The crop list could not load. Refresh the page to try again.</p>}
        <div className="mt-2 flex flex-wrap gap-2">
          {crops.map((c) => {
            const on = f.crops.includes(c.id)
            return (
              <label
                key={c.id}
                className={`inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border-[1.5px] px-3.5 text-sm font-medium transition-colors duration-150 has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-focus ${
                  on ? 'border-primary bg-[#dff1e6] text-[#12522f]' : 'border-line-strong bg-white hover:bg-paper'
                }`}
              >
                <input type="checkbox" className="sr-only" checked={on} onChange={() => toggle(c.id)} />
                <span aria-hidden="true">{on ? '✓' : '+'}</span>
                {c.name}
              </label>
            )
          })}
        </div>
        <p className="mt-2 text-xs text-ink-soft">{f.crops.length === 0 ? 'Choose at least one.' : `${f.crops.length} chosen.`}</p>
      </fieldset>
    </div>
  )
}

/* ---------------------------------------------------------------- list a new plot */

function NewPlotForm({
  crops,
  cropsFailed,
  hasPlots,
  onCancel,
  onSaved,
}: {
  crops: Crop[]
  cropsFailed: boolean
  hasPlots: boolean
  onCancel: () => void
  onSaved: (plot: PlotCreated, message: string) => void
}) {
  const refresh = useRefreshPlots()
  const mapElement = useRef<HTMLDivElement>(null)
  const drawnLayers = useRef<LeafletFeatureGroup | null>(null)
  const mapRef = useRef<LeafletMap | null>(null)
  const [boundary, setBoundary] = useState<Polygon | null>(null)
  const [mapError, setMapError] = useState(() =>
    typeof window === 'undefined' || !window.L ? 'The map library could not load. Refresh the page and try again.' : '',
  )
  const [title, setTitle] = useState('')
  const [soilType, setSoilType] = useState('')
  const [waterSource, setWaterSource] = useState('')
  const [season, setSeason] = useState<SeasonFields>(emptySeason)
  const [photo, setPhoto] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const L = window.L
    if (!mapElement.current || !L) return

    const map = L.map(mapElement.current).setView([20.5937, 78.9629], 5)
    mapRef.current = map
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map)
    const drawn = new L.FeatureGroup()
    drawnLayers.current = drawn
    map.addLayer(drawn)
    const drawControl = new L.Control.Draw({
      draw: { polygon: { allowIntersection: false, showArea: false }, polyline: false, rectangle: false, circle: false, marker: false, circlemarker: false },
      edit: { featureGroup: drawn, edit: false, remove: true },
    })
    map.addControl(drawControl)
    map.on(L.Draw.Event.CREATED, (event: { layer: { toGeoJSON: () => { geometry: Polygon } } }) => {
      drawn.clearLayers()
      drawn.addLayer(event.layer)
      setBoundary(event.layer.toGeoJSON().geometry)
      setMapError('')
    })
    map.on(L.Draw.Event.DELETED, () => setBoundary(null))

    return () => {
      drawnLayers.current = null
      mapRef.current = null
      map.remove()
    }
  }, [])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    if (title.trim().length < 2) return setMessage('Give the plot a name of at least 2 letters.')
    if (!boundary) return setMessage('Draw the plot boundary on the map before saving.')
    const problem = seasonProblem(season) ?? (season.crops.length === 0 ? 'Choose at least one crop that can be grown.' : null)
    if (problem) return setMessage(problem)

    setSaving(true)
    let plot: PlotCreated | null = null
    try {
      plot = await api<PlotCreated>('/land/plots', { method: 'POST', body: plotCreatePayload(title, soilType, waterSource, boundary) })
      await api('/land/plots/' + plot.id + '/seasons', {
        method: 'POST',
        body: seasonCreatePayload(season.season, season.startDate, season.endDate, season.price, season.crops),
      })
      let photoMessage = ''
      if (photo) {
        try {
          if (photo.size > 5 * 1024 * 1024) throw new Error('Photos must be 5 MB or smaller.')
          if (!['image/jpeg', 'image/png', 'image/webp'].includes(photo.type)) throw new Error('Choose a JPEG, PNG or WebP photo.')
          const upload = await api<{ mediaId: string; uploadUrl: string; headers: Record<string, string> }>('/media/upload-url', {
            method: 'POST',
            body: mediaUploadPayload(plot.id, photo.type, photo.size, photo.name),
          })
          const uploaded = await fetch(upload.uploadUrl, { method: 'PUT', headers: upload.headers, body: photo })
          if (!uploaded.ok) throw new Error(`Photo upload failed (${uploaded.status}).`)
          await api('/media/' + upload.mediaId + '/complete', { method: 'POST' })
        } catch (photoError) {
          photoMessage = ` The photo could not be added: ${errorMessage(photoError)}`
        }
      }
      await refresh()
      onSaved(plot, `“${title.trim()}” is listed: ${Number(plot.areaAcres).toFixed(2)} acres.${photoMessage}`)
    } catch (error) {
      if (plot) {
        // The plot exists but its season failed: show it in the list so the farmer can add the season there.
        await refresh()
        onSaved(plot, `“${title.trim()}” was saved, but its season was not: ${errorMessage(error)} Use “Add a season” on the plot to finish.`)
      } else {
        setMessage(errorMessage(error))
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="card p-4 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-xl">Draw your plot boundary</h2>
            <p className="mt-1 text-sm text-ink-soft">Use the polygon tool on the map. Tap to add corners, then tap the first corner again to close the shape.</p>
          </div>
          <StatusChip tone={boundary ? 'good' : 'neutral'}>{boundary ? 'Boundary drawn' : 'No boundary yet'}</StatusChip>
        </div>
        <div className="mt-4">
          <PlaceSearch onPick={(place) => mapRef.current?.flyTo([place.lat, place.lng], 16)} />
        </div>
        <div ref={mapElement} className="mt-4 h-[320px] w-full overflow-hidden rounded-lg border border-line sm:h-[360px]" />
        {mapError && (
          <p role="alert" className="mt-2 text-sm text-danger">
            {mapError}
          </p>
        )}
        <p className="mt-2 text-xs text-ink-soft">Map data &copy; OpenStreetMap contributors. The backend checks polygon validity, overlap and area.</p>
      </div>

      <form onSubmit={submit} noValidate className="card p-4 sm:p-6">
        <h2 className="font-display text-xl">Plot details and growing season</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1 text-sm font-semibold">
            Plot name
            <input required minLength={2} maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} className="input font-normal" placeholder="North field" />
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            Soil type
            <input value={soilType} onChange={(e) => setSoilType(e.target.value)} className="input font-normal" placeholder="Black soil" />
          </label>
          <label className="grid gap-1 text-sm font-semibold sm:col-span-2">
            Water source
            <input value={waterSource} onChange={(e) => setWaterSource(e.target.value)} className="input font-normal" placeholder="Borewell, canal, rain-fed..." />
          </label>
        </div>
        <SeasonInputs value={season} onChange={(v) => { setSeason(v); setMessage("") }} crops={crops} cropsFailed={cropsFailed} />
        <label className="mt-4 grid gap-1 text-sm font-semibold">
          Plot photo (optional)
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} className="input font-normal" />
          <span className="text-xs font-normal text-ink-soft">JPEG, PNG or WebP, up to 5 MB. Take it at the plot so it shows as verified.</span>
        </label>
        {message && (
          <p role="alert" className="mt-4 rounded-lg bg-[#f8e1dc] p-3 text-sm font-semibold text-[#8e2c1c]">
            {message}
          </p>
        )}
        <div className="mt-5 flex flex-wrap gap-3">
          <button disabled={saving} type="submit" className="btn-primary">
            {saving ? 'Saving plot and season…' : 'Save plot and season'}
          </button>
          {hasPlots && (
            <button type="button" disabled={saving} onClick={onCancel} className="btn-secondary">
              Cancel
            </button>
          )}
        </div>
      </form>
    </>
  )
}
