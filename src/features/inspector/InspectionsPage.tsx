import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ListSkeleton } from '@/components/ui'
import { useEffect, useId, useMemo, useRef, useState, type FormEvent } from 'react'
import { ApiError } from '@/api/http'
import { useAuth } from '@/features/auth/authContext'
import { useI18n } from '@/i18n/i18n'
import {
  inspectorApi,
  photoProblem,
  reportPayload,
  uploadInspectionPhoto,
  type Grade,
  type Inspection,
} from './inspector'

const message = (e: unknown) => (e instanceof ApiError || e instanceof Error ? e.message : 'Could not reach the server. Try again.')
const field = 'mt-1 w-full input font-normal'
const subjectText: Record<string, string> = { ORDER: 'Packed order', HARVEST: 'Harvest', RESERVATION: 'Harvest' }
const MAX_PHOTOS = 10

export function InspectionsPage() {
  const { t } = useI18n()
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

  if (list.isPending) return <ListSkeleton label="Loading inspections" />
  if (list.isError)
    return (
      <p role="alert" className="mt-8 font-semibold text-danger">
        {t('Could not load inspections. Refresh to try again.')}
      </p>
    )
  const open = list.data.filter((i) => i.status === 'PENDING')
  const mine = open.filter((i) => i.inspectorId === user?.id)
  const unassigned = open.filter((i) => i.inspectorId === null)
  const done = list.data.filter((i) => i.status !== 'PENDING')
  return (
    <div className="mt-6 max-w-3xl space-y-8 sm:mt-8">
      <div>
        <button type="button" onClick={share} className="btn-secondary min-h-12 w-full sm:w-auto">
          {t('Share my location')}
        </button>
        {located && (
          <p role="status" className="mt-2 text-sm text-ink-soft">
            {t(located)}
          </p>
        )}
      </div>

      <section aria-labelledby="mine">
        <h2 id="mine" className="font-display text-2xl">
          {t('Assigned to me')}
        </h2>
        {mine.length === 0 ? (
          <p className="mt-2 text-ink-soft">{t('Nothing assigned. Claim one below.')}</p>
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
          {t('Waiting for an inspector')}
        </h2>
        {unassigned.length === 0 ? (
          <p className="mt-2 text-ink-soft">{t('No unassigned inspections.')}</p>
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
            {t('Reported')}
          </h2>
          <ul className="mt-3 space-y-2">
            {done.map((i) => (
              <li key={i.id} className="card px-4 py-3">
                {t(subjectText[i.subjectType] ?? i.subjectType)} · {t('grade')} {i.grade ?? '–'} · {t(i.result ?? i.status)}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

function ClaimRow({ inspection: i, onDone }: { inspection: Inspection; onDone: () => void }) {
  const { t, lang } = useI18n()
  const [error, setError] = useState<string>()
  const claim = useMutation({ mutationFn: () => inspectorApi.claim(i.id), onSuccess: onDone, onError: (e) => setError(message(e)) })
  return (
    <div className="card flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-semibold">
          {t(subjectText[i.subjectType] ?? i.subjectType)}
          {i.attempt > 1 ? ` · ${t('attempt {n}', { n: i.attempt })}` : ''}
        </p>
        <p className="text-sm text-ink-soft">
          {t('Waiting since {when}', { when: new Date(i.createdAt).toLocaleString(lang === 'hi' ? 'hi-IN' : 'en-IN') })}
        </p>
        {error && (
          <p role="alert" className="text-sm font-semibold text-danger">
            {error}
          </p>
        )}
      </div>
      <button type="button" disabled={claim.isPending} onClick={() => claim.mutate()} className="btn-primary min-h-12 sm:min-h-11">
        {t('Claim')}
      </button>
    </div>
  )
}

/** Big tap targets for a short list of options: easier than a dropdown with gloves on. */
function Choice<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: readonly { value: T; text: string }[]
  onChange: (value: T) => void
}) {
  const id = useId()
  return (
    <div role="radiogroup" aria-labelledby={id}>
      <span id={id} className="text-sm font-semibold">
        {label}
      </span>
      <div className="mt-1 grid gap-1 rounded-lg bg-paper-deep p-[3px]" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={value === o.value}
            onClick={() => onChange(o.value)}
            className="min-h-12 rounded-md px-3 font-semibold text-ink-soft transition-colors duration-150 aria-checked:bg-white aria-checked:text-ink aria-checked:shadow-[0_1px_2px_rgba(23,26,29,.18)]"
          >
            {o.text}
          </button>
        ))}
      </div>
    </div>
  )
}

/** Thumbnails of the photos picked so far, each removable. */
function PhotoStrip({ photos, onRemove }: { photos: File[]; onRemove: (index: number) => void }) {
  const { t } = useI18n()
  const urls = useMemo(() => photos.map((p) => (typeof URL.createObjectURL === 'function' ? URL.createObjectURL(p) : '')), [photos])
  useEffect(() => () => urls.forEach((u) => u && URL.revokeObjectURL(u)), [urls])
  if (photos.length === 0) return null
  return (
    <ul className="mt-2 flex flex-wrap gap-2">
      {photos.map((p, i) => (
        <li key={`${p.name}-${i}`} className="relative">
          {urls[i] ? (
            <img src={urls[i]} alt={t('Photo {n}', { n: i + 1 })} className="size-16 rounded-lg border border-line object-cover" />
          ) : (
            <span className="grid size-16 place-items-center rounded-lg border border-line text-xs">{i + 1}</span>
          )}
          <button
            type="button"
            onClick={() => onRemove(i)}
            aria-label={t('Remove photo {n}', { n: i + 1 })}
            className="absolute -top-2 -right-2 grid size-7 place-items-center rounded-full border border-line-strong bg-white text-sm font-bold"
          >
            ×
          </button>
        </li>
      ))}
    </ul>
  )
}

function ReportCard({ inspection: i, onDone }: { inspection: Inspection; onDone: () => void }) {
  const { t } = useI18n()
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
  const camera = useRef<HTMLInputElement>(null)
  const gallery = useRef<HTMLInputElement>(null)

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

  const addPhotos = (files: FileList | null) => {
    setPhotos((old) => [...old, ...Array.from(files ?? [])].slice(0, MAX_PHOTOS))
  }
  const grades = (['A', 'B', 'C'] as const).map((g) => ({ value: g, text: g }))

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      aria-label={`Report for ${subjectText[i.subjectType] ?? i.subjectType}`}
      className="card space-y-5 p-4 sm:p-5"
    >
      <p className="font-semibold">
        {t(subjectText[i.subjectType] ?? i.subjectType)}
        {i.attempt > 1 ? ` · ${t('attempt {n}', { n: i.attempt })}` : ''}
      </p>

      <Choice label={t('Grade')} value={grade} options={grades} onChange={setGrade} />
      <Choice
        label={t('Result')}
        value={result}
        options={[
          { value: 'PASS', text: t('Pass') },
          { value: 'FAIL', text: t('Fail') },
        ]}
        onChange={setResult}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold">
          {t('Moisture (%)')}
          <input inputMode="decimal" enterKeyHint="next" value={moisture} onChange={(e) => setMoisture(e.target.value)} className={field} />
        </label>
        <label className="text-sm font-semibold">
          {t('Weight (kg)')}
          <input inputMode="decimal" enterKeyHint="next" value={weight} onChange={(e) => setWeight(e.target.value)} className={field} />
        </label>
      </div>

      <label className="input flex min-h-12 items-center gap-3 font-semibold">
        <input type="checkbox" className="size-5" checked={pest} onChange={(e) => setPest(e.target.checked)} />
        {t('Pests found')}
      </label>

      {result === 'FAIL' && (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold">
            {t('What happens next')}
            <select value={resolution} onChange={(e) => setResolution(e.target.value as typeof resolution)} className={`${field} min-h-12`}>
              <option value="">{t('Choose…')}</option>
              <option value="REHARVEST">{t('Harvest again')}</option>
              <option value="ACCEPT_LOWER_GRADE">{t('Accept a lower grade')}</option>
            </select>
          </label>
          {resolution === 'ACCEPT_LOWER_GRADE' && (
            <Choice label={t('Accepted grade')} value={acceptedGrade} options={grades} onChange={setAcceptedGrade} />
          )}
        </div>
      )}

      <label className="block text-sm font-semibold">
        {t('Notes')}
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={2000} className={field} />
      </label>

      <div>
        <p className="text-sm font-semibold">{t('Photos')}</p>
        <div className="mt-1 grid grid-cols-2 gap-2">
          <button type="button" className="btn-secondary min-h-12" onClick={() => camera.current?.click()}>
            {t('Take photo')}
          </button>
          <button type="button" className="btn-secondary min-h-12" onClick={() => gallery.current?.click()}>
            {t('Choose photos')}
          </button>
        </div>
        {/* capture opens the rear camera on a phone; the second input picks from the gallery */}
        <input
          ref={camera}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          aria-label={t('Take photo')}
          className="sr-only"
          tabIndex={-1}
          onChange={(e) => {
            addPhotos(e.target.files)
            e.target.value = ''
          }}
        />
        <input
          ref={gallery}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          aria-label={t('Choose photos')}
          className="sr-only"
          tabIndex={-1}
          onChange={(e) => {
            addPhotos(e.target.files)
            e.target.value = ''
          }}
        />
        <PhotoStrip photos={photos} onRemove={(index) => setPhotos((old) => old.filter((_, n) => n !== index))} />
        <p className="mt-1.5 text-xs text-ink-soft">
          {t('{n} of {max} photos. JPEG, PNG or WebP, 5 MB each.', { n: photos.length, max: MAX_PHOTOS })}
        </p>
      </div>

      {error && (
        <p role="alert" className="font-semibold text-danger">
          {t(error)}
        </p>
      )}
      {/* stays in reach while scrolling a long form on a phone */}
      <div className="sticky bottom-0 -mx-4 -mb-4 rounded-b-xl border-t border-line bg-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:static sm:m-0 sm:border-0 sm:p-0">
        <button type="submit" disabled={submit.isPending} className="btn-primary min-h-12 w-full sm:w-auto">
          {submit.isPending ? t('Submitting…') : t('Submit report')}
        </button>
      </div>
    </form>
  )
}
