import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { ApiError } from '@/api/http'
import { useAuth } from '@/features/auth/authContext'
import {
  inspectorApi,
  photoProblem,
  reportPayload,
  uploadInspectionPhoto,
  type Grade,
  type Inspection,
} from './inspector'

const message = (e: unknown) => (e instanceof ApiError || e instanceof Error ? e.message : 'Could not reach the server. Try again.')
const field = 'mt-1 w-full rounded-xl border border-line bg-transparent px-3 py-2 font-normal'
const subjectText: Record<string, string> = { ORDER: 'Packed order', HARVEST: 'Harvest', RESERVATION: 'Harvest' }

export function InspectionsPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const list = useQuery({ queryKey: ['inspections'], queryFn: inspectorApi.list })
  const [located, setLocated] = useState<string>()
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['inspections'] })

  const share = () => {
    if (!navigator.geolocation) return setLocated('This browser cannot share a location.')
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        inspectorApi
          .setLocation(pos.coords.longitude, pos.coords.latitude)
          .then(() => setLocated('Location saved. New inspections near you can be assigned to you.'))
          .catch((e) => setLocated(message(e))),
      () => setLocated('Location permission was denied.'),
    )
  }

  if (list.isPending) return <p className="mt-8 text-ink-soft">Loading inspections…</p>
  if (list.isError)
    return (
      <p role="alert" className="mt-8 font-semibold text-red-400">
        Could not load inspections. Refresh to try again.
      </p>
    )
  const open = list.data.filter((i) => i.status === 'PENDING')
  const mine = open.filter((i) => i.inspectorId === user?.id)
  const unassigned = open.filter((i) => i.inspectorId === null)
  const done = list.data.filter((i) => i.status !== 'PENDING')
  return (
    <div className="mt-8 max-w-3xl space-y-8">
      <div>
        <button type="button" onClick={share} className="rounded-xl border border-line bg-transparent px-3 py-2 font-semibold">
          Share my location
        </button>
        {located && (
          <p role="status" className="mt-2 text-sm text-ink-soft">
            {located}
          </p>
        )}
      </div>

      <section aria-labelledby="mine">
        <h2 id="mine" className="font-display text-2xl">
          Assigned to me
        </h2>
        {mine.length === 0 ? (
          <p className="mt-2 text-ink-soft">Nothing assigned. Claim one below.</p>
        ) : (
          <ul className="mt-3 space-y-4">
            {mine.map((i) => (
              <li key={i.id}>
                <ReportCard inspection={i} onDone={refresh} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="open">
        <h2 id="open" className="font-display text-2xl">
          Waiting for an inspector
        </h2>
        {unassigned.length === 0 ? (
          <p className="mt-2 text-ink-soft">No unassigned inspections.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {unassigned.map((i) => (
              <li key={i.id}>
                <ClaimRow inspection={i} onDone={refresh} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {done.length > 0 && (
        <section aria-labelledby="done">
          <h2 id="done" className="font-display text-2xl">
            Reported
          </h2>
          <ul className="mt-3 space-y-2">
            {done.map((i) => (
              <li key={i.id} className="card px-4 py-3">
                {subjectText[i.subjectType] ?? i.subjectType} · grade {i.grade ?? '–'} · {i.result ?? i.status}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

function ClaimRow({ inspection: i, onDone }: { inspection: Inspection; onDone: () => void }) {
  const [error, setError] = useState<string>()
  const claim = useMutation({ mutationFn: () => inspectorApi.claim(i.id), onSuccess: onDone, onError: (e) => setError(message(e)) })
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 card px-4 py-3">
      <div>
        <p className="font-semibold">
          {subjectText[i.subjectType] ?? i.subjectType}
          {i.attempt > 1 ? ` · attempt ${i.attempt}` : ''}
        </p>
        <p className="text-sm text-ink-soft">Waiting since {new Date(i.createdAt).toLocaleString('en-IN')}</p>
        {error && (
          <p role="alert" className="text-sm font-semibold text-red-400">
            {error}
          </p>
        )}
      </div>
      <button type="button" disabled={claim.isPending} onClick={() => claim.mutate()} className="rounded-xl bg-white px-5 py-2 font-semibold text-black transition-colors hover:bg-gray-200 disabled:opacity-60">
        Claim
      </button>
    </div>
  )
}

function ReportCard({ inspection: i, onDone }: { inspection: Inspection; onDone: () => void }) {
  const [grade, setGrade] = useState<Grade>('A')
  const [moisture, setMoisture] = useState('')
  const [weight, setWeight] = useState('')
  const [pest, setPest] = useState(false)
  const [result, setResult] = useState<'PASS' | 'FAIL'>('PASS')
  const [resolution, setResolution] = useState<'' | 'REHARVEST' | 'ACCEPT_LOWER_GRADE'>('')
  const [acceptedGrade, setAcceptedGrade] = useState<Grade>('B')
  const [note, setNote] = useState('')
  const [photos, setPhotos] = useState<File[]>([])
  const [error, setError] = useState<string>()

  const submit = useMutation({
    mutationFn: async () => {
      const mediaIds: string[] = []
      for (const photo of photos) mediaIds.push(await uploadInspectionPhoto(i.id, photo))
      const body = reportPayload({ grade, moisture, pest, weight, result, resolution, acceptedGrade, note, mediaIds })
      if (typeof body === 'string') throw new Error(body)
      return inspectorApi.report(i.id, body)
    },
    onSuccess: onDone,
    onError: (e) => setError(message(e)),
  })

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(undefined)
    for (const photo of photos) {
      const problem = photoProblem(photo)
      if (problem) return setError(problem)
    }
    submit.mutate()
  }

  return (
    <form onSubmit={onSubmit} noValidate aria-label={`Report for ${subjectText[i.subjectType] ?? i.subjectType}`} className="space-y-4 card p-5">
      <p className="font-semibold">
        {subjectText[i.subjectType] ?? i.subjectType}
        {i.attempt > 1 ? ` · attempt ${i.attempt}` : ''}
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold">
          Grade
          <select value={grade} onChange={(e) => setGrade(e.target.value as Grade)} className={field}>
            <option>A</option>
            <option>B</option>
            <option>C</option>
          </select>
        </label>
        <label className="text-sm font-semibold">
          Result
          <select value={result} onChange={(e) => setResult(e.target.value as 'PASS' | 'FAIL')} className={field}>
            <option value="PASS">Pass</option>
            <option value="FAIL">Fail</option>
          </select>
        </label>
        <label className="text-sm font-semibold">
          Moisture (%)
          <input inputMode="decimal" value={moisture} onChange={(e) => setMoisture(e.target.value)} className={field} />
        </label>
        <label className="text-sm font-semibold">
          Weight (kg)
          <input inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} className={field} />
        </label>
      </div>
      <label className="flex items-center gap-2 font-semibold">
        <input type="checkbox" checked={pest} onChange={(e) => setPest(e.target.checked)} />
        Pests found
      </label>
      {result === 'FAIL' && (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold">
            What happens next
            <select value={resolution} onChange={(e) => setResolution(e.target.value as typeof resolution)} className={field}>
              <option value="">Choose…</option>
              <option value="REHARVEST">Harvest again</option>
              <option value="ACCEPT_LOWER_GRADE">Accept a lower grade</option>
            </select>
          </label>
          {resolution === 'ACCEPT_LOWER_GRADE' && (
            <label className="text-sm font-semibold">
              Accepted grade
              <select value={acceptedGrade} onChange={(e) => setAcceptedGrade(e.target.value as Grade)} className={field}>
                <option>A</option>
                <option>B</option>
                <option>C</option>
              </select>
            </label>
          )}
        </div>
      )}
      <label className="block text-sm font-semibold">
        Notes
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={2000} className={field} />
      </label>
      <label className="block text-sm font-semibold">
        Photos
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={(e) => setPhotos(Array.from(e.target.files ?? []).slice(0, 10))}
          className="mt-1 block font-normal"
        />
        <span className="text-xs font-normal text-ink-soft">Up to 10 photos, JPEG, PNG or WebP, 5 MB each.</span>
      </label>
      {error && (
        <p role="alert" className="font-semibold text-red-400">
          {error}
        </p>
      )}
      <button type="submit" disabled={submit.isPending} className="rounded-xl bg-white px-5 py-2 font-semibold text-black transition-colors hover:bg-gray-200 disabled:opacity-60">
        {submit.isPending ? 'Submitting…' : 'Submit report'}
      </button>
    </form>
  )
}
