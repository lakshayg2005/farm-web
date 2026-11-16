import { useEffect, useRef, useState, type FormEvent } from 'react'
import { api, ApiError } from '@/api/http'

type Polygon = { type: 'Polygon'; coordinates: number[][][] }
type PlotCreated = { id: string; areaAcres: number }
type SeasonInput = {
  season: string
  start_date: string
  end_date: string
  price: number
  allowed_crops: string[]
}

function errorMessage(error: unknown) {
  if (error instanceof ApiError) {
    const details = error.details as { plotId?: string } | undefined
    return details?.plotId
      ? `${error.message} (overlapping plot: ${details.plotId})`
      : error.message
  }
  return error instanceof Error ? error.message : 'Could not save the plot. Please try again.'
}

export function PlotListingPage() {
  const mapElement = useRef<HTMLDivElement>(null)
  const drawnLayers = useRef<LeafletFeatureGroup | null>(null)
  const [boundary, setBoundary] = useState<Polygon | null>(null)
  const [mapError, setMapError] = useState(() =>
    typeof window === 'undefined' || !window.L
      ? 'The map library could not load. Refresh the page and try again.'
      : '',
  )
  const [title, setTitle] = useState('')
  const [soilType, setSoilType] = useState('')
  const [waterSource, setWaterSource] = useState('')
  const [season, setSeason] = useState('Kharif')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [price, setPrice] = useState('')
  const [crops, setCrops] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [savedPlot, setSavedPlot] = useState<PlotCreated | null>(null)

  useEffect(() => {
    const L = window.L
    if (!mapElement.current || !L) return

    const map = L.map(mapElement.current).setView([20.5937, 78.9629], 5)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map)
    const drawn = new L.FeatureGroup()
    drawnLayers.current = drawn
    map.addLayer(drawn)
    const drawControl = new L.Control.Draw({
      draw: {
        polygon: { allowIntersection: false, showArea: true },
        polyline: false,
        rectangle: false,
        circle: false,
        marker: false,
        circlemarker: false,
      },
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
      map.remove()
    }
  }, [])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('')
    setSavedPlot(null)
    if (!boundary) {
      setMessage('Draw a plot boundary on the map before saving.')
      return
    }
    if (!startDate || !endDate || !price) {
      setMessage('Complete the season dates and price as well as the plot details.')
      return
    }
    setSaving(true)
    try {
      const plot = await api<PlotCreated>('/land/plots', {
        method: 'POST',
        body: {
          title: title.trim(),
          soil_type: soilType.trim() || null,
          water_source: waterSource.trim() || null,
          boundary,
        },
      })
      const seasonBody: SeasonInput = {
        season: season.trim(),
        start_date: startDate,
        end_date: endDate,
        price: Number(price),
        allowed_crops: crops.split(',').map((crop) => crop.trim()).filter(Boolean),
      }
      await api('/land/plots/' + plot.id + '/seasons', {
        method: 'POST',
        body: seasonBody,
      })
      let photoMessage = ''
      if (photo) {
        try {
          if (photo.size > 5 * 1024 * 1024) throw new Error('Photos must be 5 MB or smaller.')
          if (!['image/jpeg', 'image/png', 'image/webp'].includes(photo.type)) {
            throw new Error('Choose a JPEG, PNG or WebP photo.')
          }
          const upload = await api<{ mediaId: string; uploadUrl: string; headers: Record<string, string> }>('/media/upload-url', {
            method: 'POST',
            body: {
              owner_type: 'PLOT',
              owner_id: plot.id,
              content_type: photo.type,
              size_bytes: photo.size,
              file_name: photo.name,
            },
          })
          const uploaded = await fetch(upload.uploadUrl, {
            method: 'PUT',
            headers: upload.headers,
            body: photo,
          })
          if (!uploaded.ok) throw new Error(`Photo upload failed (${uploaded.status}).`)
          await api('/media/' + upload.mediaId + '/complete', { method: 'POST' })
          photoMessage = ' Photo is processing and will appear once verified.'
        } catch (photoError) {
          photoMessage = ` Plot and season saved, but photo upload failed: ${errorMessage(photoError)}`
        }
      }
      setSavedPlot(plot)
      setMessage(`Plot saved successfully. Calculated area: ${Number(plot.areaAcres).toFixed(2)} acres.${photoMessage}`)
      setTitle('')
      setBoundary(null)
      drawnLayers.current?.clearLayers()
      setPhoto(null)
    } catch (error) {
      setMessage(errorMessage(error))
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="mt-8 max-w-5xl space-y-6">
      <div className="rounded-xl border border-line bg-white p-4 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-xl">Draw your plot boundary</h2>
            <p className="mt-1 text-sm text-ink-soft">Use the polygon tool on the map. Click to add corners and close the shape to finish.</p>
          </div>
          <span className="rounded-full bg-paper-deep px-3 py-1 text-sm">{boundary ? 'Boundary drawn' : 'No boundary yet'}</span>
        </div>
        <div ref={mapElement} className="mt-4 h-[360px] w-full overflow-hidden rounded-lg border border-line" />
        {mapError && <p role="alert" className="mt-2 text-sm text-red-700">{mapError}</p>}
        <p className="mt-2 text-xs text-ink-soft">Map data &copy; OpenStreetMap contributors. The backend checks polygon validity, overlap and area.</p>
      </div>

      <form onSubmit={submit} className="rounded-xl border border-line bg-white p-4 sm:p-6">
        <h2 className="font-display text-xl">Plot details and growing season</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1 text-sm font-semibold">
            Plot name
            <input required minLength={2} maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} className="rounded-lg border border-line px-3 py-2 font-normal" placeholder="North field" />
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            Soil type
            <input value={soilType} onChange={(e) => setSoilType(e.target.value)} className="rounded-lg border border-line px-3 py-2 font-normal" placeholder="Black soil" />
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            Water source
            <input value={waterSource} onChange={(e) => setWaterSource(e.target.value)} className="rounded-lg border border-line px-3 py-2 font-normal" placeholder="Borewell, canal, rain-fed..." />
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            Season
            <select value={season} onChange={(e) => setSeason(e.target.value)} className="rounded-lg border border-line px-3 py-2 font-normal">
              <option>Kharif</option><option>Rabi</option><option>Zaid</option><option>Summer</option><option>Winter</option>
            </select>
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            Season start
            <input required type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="rounded-lg border border-line px-3 py-2 font-normal" />
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            Season end
            <input required type="date" min={startDate || undefined} value={endDate} onChange={(e) => setEndDate(e.target.value)} className="rounded-lg border border-line px-3 py-2 font-normal" />
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            Season price (INR)
            <input required type="number" min="0.01" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className="rounded-lg border border-line px-3 py-2 font-normal" placeholder="12000" />
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            Allowed crops
            <input value={crops} onChange={(e) => setCrops(e.target.value)} className="rounded-lg border border-line px-3 py-2 font-normal" placeholder="rice, maize, soybean" />
            <span className="font-normal text-xs text-ink-soft">Separate crop IDs with commas.</span>
          </label>
          <label className="grid gap-1 text-sm font-semibold sm:col-span-2">
            Plot photo (optional)
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} className="rounded-lg border border-line px-3 py-2 font-normal" />
            <span className="font-normal text-xs text-ink-soft">JPEG, PNG or WebP, up to 5 MB. Uploaded securely through the media service.</span>
          </label>
        </div>
        {message && <p role="status" className="mt-4 rounded-lg bg-paper-deep p-3 text-sm">{message}</p>}
        {savedPlot && <p className="mt-2 text-xs text-ink-soft">Plot ID: {savedPlot.id}</p>}
        <button disabled={saving} type="submit" className="mt-5 rounded-lg bg-ink px-5 py-3 font-semibold text-white disabled:opacity-50">
          {saving ? 'Saving plot and season…' : 'Save plot and season'}
        </button>
      </form>
    </section>
  )
}
