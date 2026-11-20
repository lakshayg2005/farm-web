import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { ApiError } from '@/api/http'
import { farmerLandApi, type MyPlot, type Season } from './reservations'

const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })
const field = 'rounded-lg border border-line px-3 py-2 font-normal'
const primary = 'rounded-lg bg-ink px-4 py-2 font-semibold text-white disabled:opacity-50'
const quiet = 'rounded-lg border border-line bg-white px-4 py-2 font-semibold hover:border-ink-soft disabled:opacity-60'
const link = 'font-semibold text-indigo underline'

const errorText = (e: unknown) =>
  e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'Could not save. Try again.'

function SeasonRow({ plotId, season: s }: { plotId: string; season: Season }) {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState('')
  const [f, setF] = useState({
    season: s.season,
    startDate: s.startDate,
    endDate: s.endDate,
    price: String(s.price),
    crops: s.allowedCrops.join(', '),
  })
  const save = useMutation({
    mutationFn: () =>
      farmerLandApi.updateSeason(plotId, s.id, {
        season: f.season.trim(),
        startDate: f.startDate,
        endDate: f.endDate,
        price: Number(f.price),
        allowedCrops: f.crops.split(',').map((c) => c.trim()).filter(Boolean),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['farmer-plot-seasons', plotId] })
      setEditing(false)
    },
    onError: (e) => setError(errorText(e)),
  })
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value })

  function submit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (!f.season.trim() || !f.startDate || !f.endDate) return setError('Fill in the season name and both dates.')
    if (f.endDate < f.startDate) return setError('The season cannot end before it starts.')
    if (!(Number(f.price) > 0)) return setError('Enter a price above zero.')
    save.mutate()
  }

  if (!editing)
    return (
      <li className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
        <span>
          <span className="font-semibold">{s.season}</span> · {s.startDate} to {s.endDate} · {inr.format(Number(s.price))}
        </span>
        <button type="button" className={link} onClick={() => setEditing(true)} aria-label={`Edit ${s.season} season`}>
          Edit
        </button>
      </li>
    )
  return (
    <li>
      <form onSubmit={submit} noValidate className="grid gap-3 rounded-lg bg-paper-deep p-3 sm:grid-cols-2" aria-label={`Edit ${s.season} season`}>
        <label className="grid gap-1 text-sm font-semibold">
          Season
          <input value={f.season} onChange={set('season')} className={field} />
        </label>
        <label className="grid gap-1 text-sm font-semibold">
          Price (INR)
          <input type="number" min="0.01" step="0.01" value={f.price} onChange={set('price')} className={field} />
        </label>
        <label className="grid gap-1 text-sm font-semibold">
          Start
          <input type="date" value={f.startDate} onChange={set('startDate')} className={field} />
        </label>
        <label className="grid gap-1 text-sm font-semibold">
          End
          <input type="date" min={f.startDate || undefined} value={f.endDate} onChange={set('endDate')} className={field} />
        </label>
        <label className="grid gap-1 text-sm font-semibold sm:col-span-2">
          Allowed crops
          <input value={f.crops} onChange={set('crops')} className={field} />
        </label>
        {error && (
          <p role="alert" className="text-sm font-semibold text-red-700 sm:col-span-2">
            {error}
          </p>
        )}
        <div className="flex gap-2 sm:col-span-2">
          <button type="submit" disabled={save.isPending} className={primary}>
            {save.isPending ? 'Saving…' : 'Save season'}
          </button>
          <button type="button" className={quiet} onClick={() => setEditing(false)}>
            Cancel
          </button>
        </div>
      </form>
    </li>
  )
}

function PlotSeasons({ plotId }: { plotId: string }) {
  const seasons = useQuery({ queryKey: ['farmer-plot-seasons', plotId], queryFn: () => farmerLandApi.seasons(plotId) })
  if (seasons.isPending) return <p className="mt-2 text-sm text-ink-soft">Loading seasons…</p>
  if (seasons.isError) return <p className="mt-2 text-sm text-red-700">Could not load seasons.</p>
  if (seasons.data.length === 0) return <p className="mt-2 text-sm text-ink-soft">No seasons added yet.</p>
  return (
    <ul className="mt-2 space-y-2">
      {seasons.data.map((s) => (
        <SeasonRow key={s.id} plotId={plotId} season={s} />
      ))}
    </ul>
  )
}

function PlotRow({ plot }: { plot: MyPlot }) {
  const queryClient = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState('')
  const [f, setF] = useState({
    title: plot.title,
    soilType: plot.soilType ?? '',
    waterSource: plot.waterSource ?? '',
    description: plot.description ?? '',
  })
  const save = useMutation({
    mutationFn: () =>
      farmerLandApi.updatePlot(plot.id, {
        title: f.title.trim(),
        soilType: f.soilType.trim() || null,
        waterSource: f.waterSource.trim() || null,
        description: f.description.trim() || null,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['farmer-plots'] })
      setEditing(false)
    },
    onError: (e) => setError(errorText(e)),
  })
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setF({ ...f, [k]: e.target.value })

  function submit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (f.title.trim().length < 2) return setError('Give the plot a name of at least 2 characters.')
    save.mutate()
  }

  return (
    <li className="py-4">
      {editing ? (
        <form onSubmit={submit} noValidate className="grid gap-3 sm:grid-cols-2" aria-label={`Edit ${plot.title}`}>
          <label className="grid gap-1 text-sm font-semibold">
            Plot name
            <input value={f.title} onChange={set('title')} maxLength={120} className={field} />
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            Soil type
            <input value={f.soilType} onChange={set('soilType')} maxLength={60} className={field} />
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            Water source
            <input value={f.waterSource} onChange={set('waterSource')} maxLength={60} className={field} />
          </label>
          <label className="grid gap-1 text-sm font-semibold sm:col-span-2">
            Description
            <textarea value={f.description} onChange={set('description')} rows={2} className={field} />
          </label>
          <p className="text-xs text-ink-soft sm:col-span-2">
            The boundary cannot be redrawn here. To change it, add the plot again.
          </p>
          {error && (
            <p role="alert" className="text-sm font-semibold text-red-700 sm:col-span-2">
              {error}
            </p>
          )}
          <div className="flex gap-2 sm:col-span-2">
            <button type="submit" disabled={save.isPending} className={primary}>
              {save.isPending ? 'Saving…' : 'Save plot'}
            </button>
            <button type="button" className={quiet} onClick={() => setEditing(false)}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <>
          <p className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="font-semibold">{plot.title}</span>
            <span className="flex items-baseline gap-3 text-sm text-ink-soft">
              {Number(plot.areaAcres).toFixed(2)} acres · {plot.status}
              <button type="button" className={link} onClick={() => setEditing(true)} aria-label={`Edit ${plot.title}`}>
                Edit
              </button>
            </span>
          </p>
          {(plot.soilType || plot.waterSource) && (
            <p className="mt-1 text-sm text-ink-soft">{[plot.soilType, plot.waterSource].filter(Boolean).join(' · ')}</p>
          )}
        </>
      )}
      <PlotSeasons plotId={plot.id} />
    </li>
  )
}

export function MyPlots() {
  const plots = useQuery({ queryKey: ['farmer-plots'], queryFn: farmerLandApi.plots })
  return (
    <div className="rounded-xl border border-line bg-white p-4 sm:p-6">
      <h2 className="font-display text-xl">Your plots</h2>
      {plots.isPending && <p className="mt-3 text-ink-soft">Loading your plots…</p>}
      {plots.isError && (
        <p role="alert" className="mt-3 font-semibold text-red-700">
          Could not load your plots. Refresh to try again.
        </p>
      )}
      {plots.data && plots.data.length === 0 && <p className="mt-3 text-ink-soft">You have not added a plot yet.</p>}
      {plots.data && plots.data.length > 0 && (
        <ul className="mt-3 divide-y divide-line">
          {plots.data.map((plot) => (
            <PlotRow key={plot.id} plot={plot} />
          ))}
        </ul>
      )}
    </div>
  )
}
