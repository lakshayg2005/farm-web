import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ListSkeleton } from '@/components/ui'
import { AnimatePresence, motion } from 'motion/react'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { ApiError } from '@/api/http'
import { MAX_PHOTOS, photoProblem, uploadPhoto } from '@/api/media'
import { OwnerPhotos } from '@/components/OwnerPhotos'
import { day, landApi, type CropUpdate, type Reservation } from '@/features/customer/land'
import {
  farmerLandApi,
  loadSeasonIndex,
  STAGES,
  stageReached,
  suggestedStage,
  type CropUpdateInput,
  type SeasonInfo,
  type Stage,
} from './reservations'

const message = (e: unknown) =>
  e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'Could not reach the server. Try again.'
const primary = 'btn-primary'
const quiet = 'btn-secondary hover:border-ink-soft disabled:opacity-60'
const input = 'mt-1 w-full input font-normal'

/** Crops being grown for a customer: deposit paid (ACTIVE), harvest ready, or on its way. */
const GROWING = ['ACTIVE', 'HARVEST_READY', 'FULFILLING', 'COMPLETED']

export function CropsPage() {
  const reservations = useQuery({ queryKey: ['farmer-reservations'], queryFn: farmerLandApi.reservations })
  const seasons = useQuery({ queryKey: ['farmer-season-index'], queryFn: loadSeasonIndex, staleTime: 300_000 })
  const crops = useQuery({ queryKey: ['crops'], queryFn: landApi.crops, staleTime: 3_600_000 })
  const cropName = (id: string) => crops.data?.find((c) => c.id === id)?.name ?? id

  if (reservations.isPending) return <ListSkeleton label="Loading your crops" />
  if (reservations.isError)
    return (
      <p role="alert" className="mt-8 font-semibold text-danger">
        Could not load your crops. Refresh to try again.
      </p>
    )
  const growing = reservations.data.filter((r) => GROWING.includes(r.status))
  if (growing.length === 0)
    return (
      <div className="mt-8 max-w-xl card border-dashed p-6">
        <h2 className="text-lg font-semibold">No crops growing for customers yet</h2>
        <p className="mt-1 text-ink-soft">
          A crop shows up here once you accept a reservation and the customer pays the deposit.
        </p>
        <Link to="/farmer/reservations" className="mt-3 inline-block font-semibold text-primary underline">
          See reservation requests
        </Link>
      </div>
    )

  // Crops still growing (they need updates) first, then ready harvests, then harvests on their way.
  const ordered = [...growing].sort((a, b) => GROWING.indexOf(a.status) - GROWING.indexOf(b.status))
  return (
    <ul className="mt-8 max-w-3xl space-y-6">
      {ordered.map((r) => (
        <li key={r.id}>
          <CropCard reservation={r} info={seasons.data?.get(r.plotSeasonId)} cropName={cropName(r.cropId)} />
        </li>
      ))}
    </ul>
  )
}

function StageTrack({ reached }: { reached: number }) {
  const steps = [...STAGES.map((s) => s.label), 'Harvest ready']
  return (
    <ol className="mt-4 grid grid-cols-4 gap-1" aria-label="Crop stages">
      {steps.map((label, i) => {
        const done = i <= reached
        return (
          <li key={label} aria-current={i === reached ? 'step' : undefined}>
            <span className={`block h-1.5 rounded-full ${done ? 'crop-rows' : 'bg-paper-deep'}`} />
            <span className={`mt-1 block text-xs leading-tight sm:text-sm ${done ? 'font-semibold text-ink' : 'text-ink-soft'}`}>{label}</span>
          </li>
        )
      })}
    </ol>
  )
}

/** What happens to the harvest, from the harvest order: the customer's choice decides who acts next. */
function HarvestNote({ reservationId }: { reservationId: string }) {
  const order = useQuery({ queryKey: ['harvest-order', reservationId], queryFn: () => farmerLandApi.harvestOrder(reservationId) })
  const option = order.data?.harvestOption
  return (
    <p className="mt-4 rounded-lg bg-paper p-3">
      {option === 'DELIVERY'
        ? 'Harvested. The customer chose home delivery: a delivery partner collects it from this plot.'
        : option === 'BUYBACK'
          ? 'Harvested. The customer chose buy-back: sell the produce; they were credited 90% of its value.'
          : 'Harvested. Waiting for the customer to choose home delivery or buy-back.'}
    </p>
  )
}

function CropCard({ reservation: r, info, cropName }: { reservation: Reservation; info: SeasonInfo | undefined; cropName: string }) {
  const queryClient = useQueryClient()
  const updates = useQuery({ queryKey: ['crop-updates', r.id], queryFn: () => farmerLandApi.updates(r.id) })
  const [posting, setPosting] = useState(false)
  const [confirmReady, setConfirmReady] = useState(false)
  const [harvestedKg, setHarvestedKg] = useState(String(r.expectedQtyKg))
  const [error, setError] = useState<string>()
  const ready = useMutation({
    mutationFn: () => farmerLandApi.harvestReady(r.id, Number(harvestedKg)),
    onSuccess: (fresh) => {
      setConfirmReady(false)
      queryClient.setQueryData<Reservation[]>(['farmer-reservations'], (old) => old?.map((x) => (x.id === fresh.id ? fresh : x)))
    },
    onError: (e) => setError(message(e)),
  })
  const list = updates.data ?? []
  const canPost = r.status === 'ACTIVE' || r.status === 'HARVEST_READY'

  return (
    <article className="card p-4 sm:p-6" aria-label={`${cropName} for a customer`}>
      <h2 className="font-display text-2xl leading-tight">
        {cropName}, {r.expectedQtyKg} kg
      </h2>
      <p className="mt-0.5 text-ink-soft">
        {info ? `${info.plotTitle}, ${info.season} season until ${day(info.endDate)}` : 'One of your plots'}
      </p>
      <StageTrack reached={stageReached(r.status, list)} />

      {r.status === 'HARVEST_READY' && <p className="mt-4 rounded-lg bg-paper p-3">Harvested. The customer's harvest order is being made.</p>}
      {r.status === 'FULFILLING' && <HarvestNote reservationId={r.id} />}
      {r.status === 'COMPLETED' && <p className="mt-4 rounded-lg bg-paper p-3">Done: the harvest was delivered or bought back.</p>}

      <section className="mt-5" aria-label="Crop updates">
        {updates.isPending ? (
          <p className="text-ink-soft">Loading updates…</p>
        ) : updates.isError ? (
          <p className="text-danger">Could not load the updates.</p>
        ) : list.length === 0 ? (
          <p className="text-ink-soft">No updates yet. The customer sees each update you post, so start with a photo of the sowing.</p>
        ) : (
          <ol className="space-y-5 border-l-2 border-line pl-5">
            {[...list].reverse().map((u) => (
              <TimelineItem key={u.id} update={u} reservationId={r.id} />
            ))}
          </ol>
        )}
      </section>

      <AnimatePresence initial={false}>
        {posting && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            <UpdateForm
              reservationId={r.id}
              defaultStage={suggestedStage(list)}
              onDone={() => setPosting(false)}
              onCancel={() => setPosting(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {canPost && !posting && (
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button type="button" className={primary} onClick={() => setPosting(true)}>
            Post an update
          </button>
          {r.status === 'ACTIVE' &&
            (confirmReady ? (
              <span className="flex flex-wrap items-center gap-3">
                <label className="flex items-center gap-2">
                  <span>Harvested</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    min={1}
                    step="any"
                    value={harvestedKg}
                    onChange={(e) => setHarvestedKg(e.target.value)}
                    className="input w-28"
                    aria-describedby={`harvest-help-${r.id}`}
                  />
                  <span>kg</span>
                </label>
                <span id={`harvest-help-${r.id}`} className="text-sm text-ink-soft">
                  The customer pays for this weight and chooses delivery or buy-back.
                </span>
                <button
                  type="button"
                  disabled={ready.isPending || !(Number(harvestedKg) > 0)}
                  onClick={() => ready.mutate()}
                  className={quiet}
                >
                  {ready.isPending ? 'Saving…' : 'Yes, it is harvested'}
                </button>
                <button type="button" onClick={() => setConfirmReady(false)} className="underline">
                  Not yet
                </button>
              </span>
            ) : (
              <button type="button" className={quiet} onClick={() => setConfirmReady(true)}>
                Mark ready to harvest
              </button>
            ))}
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

function TimelineItem({ update: u, reservationId }: { update: CropUpdate; reservationId: string }) {
  const stage = STAGES.find((s) => s.id === u.stage)?.label ?? u.stage
  return (
    <li className="relative">
      <span aria-hidden="true" className="absolute top-1.5 -left-[1.6rem] size-3 rounded-full border-2 border-white bg-[var(--color-primary)]" />
      <p className="font-semibold">
        {stage} <span className="font-normal text-ink-soft">on {day(u.createdAt)}</span>
      </p>
      {u.note && <p className="mt-0.5">{u.note}</p>}
      {u.mediaIds.length > 0 && (
        <div className="mt-2">
          <OwnerPhotos ownerType="RESERVATION" ownerId={reservationId} only={u.mediaIds} />
        </div>
      )}
    </li>
  )
}

function UpdateForm({
  reservationId,
  defaultStage,
  onDone,
  onCancel,
}: {
  reservationId: string
  defaultStage: Stage
  onDone: () => void
  onCancel: () => void
}) {
  const queryClient = useQueryClient()
  const [stage, setStage] = useState<Stage>(defaultStage)
  const [note, setNote] = useState('')
  const [files, setFiles] = useState<File[]>([])
  // Photos already uploaded by an earlier attempt, so a retry does not upload them again.
  const [uploaded, setUploaded] = useState<{ file: File; id: string }[]>([])
  const [location, setLocation] = useState<[number, number] | null>(null)
  const [error, setError] = useState<string>()

  const post = useMutation({
    mutationFn: async () => {
      const done = [...uploaded]
      for (const file of files) {
        if (done.some((d) => d.file === file)) continue
        const id = await uploadPhoto('RESERVATION', reservationId, file)
        done.push({ file, id })
        setUploaded([...done])
      }
      const body: CropUpdateInput = { stage, mediaIds: files.map((f) => done.find((d) => d.file === f)!.id) }
      if (note.trim()) body.note = note.trim()
      if (location) body.location = { type: 'Point', coordinates: location }
      return farmerLandApi.addUpdate(reservationId, body)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['crop-updates', reservationId] })
      void queryClient.invalidateQueries({ queryKey: ['media', 'RESERVATION', reservationId] })
      onDone()
    },
    onError: (e) => setError(message(e)),
  })

  function addFiles(list: FileList | null) {
    const picked = Array.from(list ?? [])
    const bad = picked.map(photoProblem).find(Boolean)
    if (bad) return setError(bad)
    setError(undefined)
    setFiles((cur) => [...cur, ...picked].slice(0, MAX_PHOTOS))
  }

  function useMyLocation() {
    if (!navigator.geolocation) return setError('This browser cannot share your location.')
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation([Number(pos.coords.longitude.toFixed(6)), Number(pos.coords.latitude.toFixed(6))]),
      () => setError('Could not get your location. The update can go without it.'),
    )
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    setError(undefined)
    if (files.length === 0 && !note.trim()) return setError('Add a photo or a note so the customer can see the progress.')
    post.mutate()
  }

  return (
    <form onSubmit={submit} noValidate aria-label="Post an update" className="mt-5 space-y-4 rounded-lg bg-paper p-4">
      <fieldset>
        <legend className="font-semibold">Stage</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {STAGES.map((s) => (
            <label
              key={s.id}
              className="cursor-pointer rounded-full border border-line-strong bg-white px-4 py-1.5 min-h-10 has-checked:border-ink has-checked:bg-[#dff1e6] has-checked:font-semibold"
            >
              <input type="radio" name={`stage-${reservationId}`} value={s.id} checked={stage === s.id} onChange={() => setStage(s.id)} className="sr-only" />
              {s.label}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="block font-semibold">
        Note <span className="font-normal text-ink-soft">(optional)</span>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} maxLength={2000} placeholder="Watered on Monday, first flowers on the east rows." className={input} />
      </label>
      <div>
        <p className="font-semibold">Photos</p>
        <p className="text-sm text-ink-soft">Taken on the plot with location on, they get a Verified badge for the customer.</p>
        {files.length > 0 && (
          <ul className="mt-2 space-y-1 text-sm" aria-label="Photos to upload">
            {files.map((file, i) => (
              <li key={`${file.name}-${i}`} className="flex items-center gap-2">
                <span className="truncate">{file.name}</span>
                {uploaded.some((d) => d.file === file) ? (
                  <span className="text-ink-soft">uploaded</span>
                ) : (
                  <button type="button" className="underline" onClick={() => setFiles((cur) => cur.filter((_, j) => j !== i))}>
                    Remove
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
        {files.length < MAX_PHOTOS && (
          <label className="mt-2 inline-block cursor-pointer rounded-lg border border-dashed border-ink-soft bg-white px-4 py-2 font-semibold hover:bg-paper-deep">
            Add photos
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="sr-only"
              onChange={(e) => {
                addFiles(e.target.files)
                e.target.value = ''
              }}
            />
          </label>
        )}
      </div>
      <p className="text-sm">
        {location ? (
          <>
            Location attached.{' '}
            <button type="button" className="underline" onClick={() => setLocation(null)}>
              Remove it
            </button>
          </>
        ) : (
          <button type="button" className="font-semibold text-primary underline" onClick={useMyLocation}>
            Attach my location
          </button>
        )}
      </p>
      {error && (
        <p role="alert" className="font-semibold text-danger">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={post.isPending} className={primary}>
          {post.isPending ? (files.length > uploaded.length ? 'Uploading photos…' : 'Posting…') : 'Post update'}
        </button>
        <button type="button" onClick={onCancel} disabled={post.isPending} className="px-2 font-semibold text-ink-soft underline">
          Cancel
        </button>
      </div>
    </form>
  )
}
