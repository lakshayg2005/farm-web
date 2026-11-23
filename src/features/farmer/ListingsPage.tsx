import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ListSkeleton, Rating, StatusChip } from '@/components/ui'
import { useI18n } from '@/i18n/i18n'
import { useAuth } from '@/features/auth/authContext'
import { AnimatePresence, motion } from 'motion/react'
import { useRef, useState, type FormEvent } from 'react'
import { ApiError } from '@/api/http'
import { geoProblem } from '@/api/geo'
import { newId } from '@/api/id'
import { MAX_PHOTOS, photoProblem, uploadPhoto } from '@/api/media'
import { OwnerPhotos } from '@/components/OwnerPhotos'
import {
  catalogApi,
  day,
  farmPayload,
  isLowStock,
  listingChanges,
  listingPayload,
  rupees,
  STATUS_TEXT,
  todayISO,
  UNITS,
  type CatalogCrop,
  type Farm,
  type FarmForm,
  type Listing,
  type ListingChanges,
  type ListingForm,
  type Unit,
} from './catalog'

const message = (e: unknown) =>
  e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'Could not reach the server. Try again.'

const input =
  'mt-1 w-full input font-normal disabled:bg-paper disabled:text-ink-soft'
const primary = 'btn-primary'
const quiet = 'btn-secondary min-h-9 px-3 py-1.5'
const panel = { initial: { opacity: 0, y: -8 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -8 }, transition: { duration: 0.2 } }

/** Order: on sale first, then sold out, then paused; newest change first within each. */
const ORDER: Record<string, number> = { ACTIVE: 0, SOLD_OUT: 1, PAUSED: 2 }

export function ListingsPage() {
  const { t } = useI18n()
  const { user } = useAuth()
  const verified = !!user?.farmerVerified
  const farms = useQuery({ queryKey: ['farms', 'mine'], queryFn: catalogApi.myFarms })
  const listings = useQuery({ queryKey: ['listings', 'mine'], queryFn: catalogApi.myListings, enabled: !!farms.data?.length })
  const crops = useQuery({ queryKey: ['catalog-crops'], queryFn: catalogApi.crops, staleTime: 3_600_000 })
  const [editing, setEditing] = useState<Listing | 'new' | null>(null)
  const [notice, setNotice] = useState<string>()
  const [editorError, setEditorError] = useState<string>()

  if (farms.isPending) return <ListSkeleton label="Loading your farms" />
  if (farms.isError)
    return (
      <p role="alert" className="mt-8 font-semibold text-danger">
        {t('Could not load your farms. Refresh to try again.')}
      </p>
    )
  // The catalog only lets an admin-verified farmer open a farm, so no form until then (the banner says why).
  if (farms.data.length === 0)
    return verified ? <FarmSetup /> : <p className="mt-8 max-w-xl text-ink-soft">{t('Once an admin verifies you, set up your farm here and list what you grow.')}</p>

  const live = (listings.data ?? [])
    .filter((l) => l.status !== 'ARCHIVED')
    .sort((a, b) => (ORDER[a.status] ?? 3) - (ORDER[b.status] ?? 3) || b.updatedAt.localeCompare(a.updatedAt))
  const onSale = live.filter((l) => l.status === 'ACTIVE').length

  return (
    <div className="mt-8 max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-ink-soft" role="status">
          {listings.isSuccess &&
            (live.length === 0 ? t('Nothing listed yet.') : t('{n} of {total} listings on sale.', { n: onSale, total: live.length }))}
          {notice && <span className="ml-2 font-semibold text-primary">{notice}</span>}
        </p>
        {editing === null && verified && (
          <button
            type="button"
            className={primary}
            onClick={() => {
              setNotice(undefined)
              setEditorError(undefined)
              setEditing('new')
            }}
          >
            {t('Add a listing')}
          </button>
        )}
      </div>

      <ul aria-label={t('Your farms')} className="flex flex-wrap gap-x-6 gap-y-1">
        {farms.data.map((f) => (
          <li key={f.id} className="flex flex-wrap items-center gap-x-2">
            <span className="font-semibold">{f.name}</span>
            <Rating value={f.rating} count={f.ratingCount ?? 0} />
          </li>
        ))}
      </ul>

      <AnimatePresence initial={false}>
        {editing !== null && (
          <motion.div key={editing === 'new' ? 'new' : editing.id} {...panel}>
            <ListingEditor
              farms={farms.data}
              crops={crops.data ?? []}
              listing={editing === 'new' ? null : editing}
              onSaved={(text) => {
                setNotice(text)
                setEditorError(undefined)
                setEditing(null)
              }}
              onSwitchToEdit={(l, error) => {
                setEditing(l)
                setEditorError(error)
              }}
              initialError={editorError}
              onCancel={() => {
                setEditorError(undefined)
                setEditing(null)
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {listings.isPending ? (
        <p className="text-ink-soft">{t('Loading your listings…')}</p>
      ) : listings.isError ? (
        <p role="alert" className="font-semibold text-danger">
          {t('Could not load your listings. Refresh to try again.')}
        </p>
      ) : live.length === 0 ? (
        editing === null && (
          <div className="card border-dashed p-6">
            <h2 className="text-lg font-semibold">{t('Put your first produce up for sale')}</h2>
            <p className="mt-1 text-ink-soft">
              {t('Add the crop, how much you have, your price and a photo taken at the farm. Customers nearby see it straight away.')}
            </p>
          </div>
        )
      ) : (
        <ul className="space-y-3" aria-label={t('Your listings')}>
          {live.map((l) => (
            <li key={l.id}>
              <ListingRow
                listing={l}
                onEdit={() => {
                  setEditorError(undefined)
                  setEditing(l)
                }}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function ListingRow({ listing: l, onEdit }: { listing: Listing; onEdit: () => void }) {
  const { t } = useI18n()
  const queryClient = useQueryClient()
  const [stock, setStock] = useState(String(l.qtyAvailable))
  const [confirmRemove, setConfirmRemove] = useState(false)
  const [error, setError] = useState<string>()
  const done = () => queryClient.invalidateQueries({ queryKey: ['listings', 'mine'] })
  const update = useMutation({
    mutationFn: (body: ListingChanges) => catalogApi.updateListing(l.id, body),
    onSuccess: (fresh) => {
      setError(undefined)
      setStock(String(fresh.qtyAvailable))
      queryClient.setQueryData<Listing[]>(['listings', 'mine'], (old) => old?.map((x) => (x.id === fresh.id ? fresh : x)))
    },
    onError: (e) => setError(message(e)),
  })
  const remove = useMutation({ mutationFn: () => catalogApi.removeListing(l.id), onSuccess: done, onError: (e) => setError(message(e)) })
  const status = STATUS_TEXT[l.status]
  const stockNumber = Number(stock)
  const stockChanged = stock.trim() !== '' && stockNumber >= 0 && stockNumber !== l.qtyAvailable

  function saveStock(e: FormEvent) {
    e.preventDefault()
    if (!(stockNumber >= 0) || stock.trim() === '') return setError('Stock must be zero or more.')
    update.mutate({ qtyAvailable: stockNumber })
  }

  return (
    <article className="card p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="sm:w-60 sm:shrink-0">
          {l.mediaIds.length > 0 ? (
            <OwnerPhotos ownerType="LISTING" ownerId={l.id} only={l.mediaIds.slice(0, 3)} size="sm" />
          ) : (
            <p className="rounded-md bg-paper-deep px-3 py-2 text-sm text-ink-soft">{t('No photos yet. Listings with a farm photo sell faster.')}</p>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h3 className="font-display text-lg leading-tight">
              {l.cropName}
              {l.variety && <span className="text-ink-soft">, {l.variety}</span>}
            </h3>
            <span className="flex flex-wrap gap-1.5">
              {isLowStock(l) && <StatusChip tone="warn">{t('Low stock')}</StatusChip>}
              <StatusChip tone={status.tone}>{t(status.label)}</StatusChip>
            </span>
          </div>
          <p className="mt-1 text-ink-soft">
            <span className="font-semibold text-ink">
              {rupees(l.pricePerUnit)} {t('per')} {t(l.unit)}
            </span>
            , {t('harvested')} {day(l.harvestDate)}
            {l.isOrganic && `, ${t('organic')}`}
          </p>

          <div className="mt-3 flex flex-wrap items-end gap-x-4 gap-y-3">
            <form onSubmit={saveStock} className="flex items-end gap-2">
              <label className="text-sm font-semibold">
                {t('In stock')} ({t(l.unit)})
                <input
                  type="number"
                  min="0"
                  step="any"
                  inputMode="decimal"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  className="mt-1 block w-28 input font-normal"
                />
              </label>
              {stockChanged && (
                <button type="submit" disabled={update.isPending} className={quiet}>
                  {update.isPending ? t('Saving…') : t('Update stock')}
                </button>
              )}
            </form>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={onEdit} className={quiet}>
                {t('Edit')}
              </button>
              {(l.status === 'ACTIVE' || l.status === 'SOLD_OUT') && (
                <button type="button" disabled={update.isPending} onClick={() => update.mutate({ status: 'PAUSED' })} className={quiet}>
                  {t('Pause')}
                </button>
              )}
              {l.status === 'PAUSED' && (
                <button type="button" disabled={update.isPending} onClick={() => update.mutate({ status: 'ACTIVE' })} className={quiet}>
                  {t('Resume')}
                </button>
              )}
              {confirmRemove ? (
                <span className="flex items-center gap-2">
                  <span className="text-sm">{t('Remove this listing?')}</span>
                  <button type="button" disabled={remove.isPending} onClick={() => remove.mutate()} className={`${quiet} text-danger`}>
                    {remove.isPending ? t('Removing…') : t('Remove')}
                  </button>
                  <button type="button" onClick={() => setConfirmRemove(false)} className="text-sm underline">
                    {t('Keep it')}
                  </button>
                </span>
              ) : (
                <button type="button" onClick={() => setConfirmRemove(true)} className="px-2 text-sm text-ink-soft underline">
                  {t('Remove')}
                </button>
              )}
            </div>
          </div>
          {isLowStock(l) && (
            <p className="mt-2 text-sm font-semibold text-warn" role="status">
              {t('Only {n} {unit} left. Add stock before it sells out.', { n: l.qtyAvailable, unit: t(l.unit) })}
            </p>
          )}
          {l.qtyAvailable === 0 && l.status !== 'PAUSED' && (
            <p className="mt-2 text-sm text-ink-soft">{t('Sold out. Add stock to put it back on sale.')}</p>
          )}
          {error && (
            <p role="alert" className="mt-2 font-semibold text-danger">
              {error}
            </p>
          )}
        </div>
      </div>
    </article>
  )
}

function formFrom(listing: Listing | null, farms: Farm[]): ListingForm {
  if (listing)
    return {
      farmId: listing.farmId,
      cropId: listing.cropId,
      variety: listing.variety ?? '',
      description: listing.description ?? '',
      qty: String(listing.qtyAvailable),
      unit: listing.unit,
      price: String(listing.pricePerUnit),
      harvestDate: listing.harvestDate,
      isOrganic: listing.isOrganic,
    }
  return {
    farmId: farms.length === 1 ? farms[0]!.id : '',
    cropId: '',
    variety: '',
    description: '',
    qty: '',
    unit: 'kg',
    price: '',
    harvestDate: todayISO(),
    isOrganic: false,
  }
}

export function ListingEditor({
  farms,
  crops,
  listing,
  onSaved,
  onSwitchToEdit,
  onCancel,
  initialError,
}: {
  farms: Farm[]
  crops: CatalogCrop[]
  listing: Listing | null
  onSaved: (notice: string) => void
  onSwitchToEdit: (l: Listing, error: string) => void
  onCancel: () => void
  initialError?: string
}) {
  const queryClient = useQueryClient()
  const [f, setF] = useState<ListingForm>(() => formFrom(listing, farms))
  const [kept, setKept] = useState<string[]>(listing?.mediaIds ?? [])
  const [files, setFiles] = useState<File[]>([])
  const [error, setError] = useState<string | undefined>(initialError)
  // One key per "Add a listing" form, so a retried request never lists the produce twice.
  const idempotencyKey = useRef(newId())
  // Set as soon as a new listing exists, so a failed photo upload can continue as an edit.
  const created = useRef<Listing | null>(null)

  const save = useMutation({
    mutationFn: async () => {
      let target = listing
      if (!target) {
        const body = listingPayload(f)
        if (typeof body === 'string') throw new Error(body)
        target = await catalogApi.createListing(body, idempotencyKey.current)
        created.current = target
      } else {
        const changes = listingChanges(target, f)
        if (typeof changes === 'string') throw new Error(changes)
        if (Object.keys(changes).length > 0) target = await catalogApi.updateListing(target.id, changes)
      }
      const saved = target
      const uploaded: string[] = []
      try {
        for (const file of files) uploaded.push(await uploadPhoto('LISTING', saved.id, file))
      } finally {
        // Keep whatever did upload, even if a later photo failed.
        const mediaIds = [...kept, ...uploaded]
        if (mediaIds.join() !== saved.mediaIds.join()) {
          target = await catalogApi.updateListing(saved.id, { mediaIds })
          if (created.current) created.current = target
        }
      }
      return target
    },
    onSuccess: (saved) => {
      void queryClient.invalidateQueries({ queryKey: ['listings', 'mine'] })
      void queryClient.invalidateQueries({ queryKey: ['media', 'LISTING', saved.id] })
      onSaved(listing ? 'Changes saved.' : `${saved.cropName} is listed.`)
    },
    onError: (e) => {
      // The listing exists even though a photo failed: carry on editing it rather than listing it twice.
      if (!listing && created.current) {
        void queryClient.invalidateQueries({ queryKey: ['listings', 'mine'] })
        onSwitchToEdit(created.current, `${created.current.cropName} is listed, but a photo did not upload: ${message(e)} Try adding it again.`)
      } else setError(message(e))
    },
  })

  const set = (k: keyof ListingForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setF((cur) => ({ ...cur, [k]: e.target.value }))

  function chooseCrop(cropId: string) {
    const crop = crops.find((c) => c.id === cropId)
    setF((cur) => ({ ...cur, cropId, unit: crop?.defaultUnit ?? cur.unit }))
  }

  function addFiles(list: FileList | null) {
    const picked = Array.from(list ?? [])
    const bad = picked.map(photoProblem).find(Boolean)
    if (bad) return setError(bad)
    const room = MAX_PHOTOS - kept.length - files.length
    if (picked.length > room) setError(`A listing can have ${MAX_PHOTOS} photos. Only the first ${Math.max(room, 0)} were added.`)
    else setError(undefined)
    setFiles((cur) => [...cur, ...picked.slice(0, Math.max(room, 0))])
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    setError(undefined)
    const check = listing ? listingChanges(listing, f) : listingPayload(f)
    if (typeof check === 'string') return setError(check)
    save.mutate()
  }

  const title = listing ? `Edit ${listing.cropName}` : 'Add a listing'
  return (
    <form onSubmit={submit} noValidate className="card p-4 sm:p-6" aria-label={title}>
      <h2 className="font-display text-2xl">{title}</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {farms.length > 1 && (
          <label className="font-semibold sm:col-span-2">
            Farm
            <select value={f.farmId} onChange={set('farmId')} disabled={!!listing} className={input}>
              <option value="">Choose a farm</option>
              {farms.map((farm) => (
                <option key={farm.id} value={farm.id}>
                  {farm.name}, {farm.district}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="font-semibold">
          Crop
          <select value={f.cropId} onChange={(e) => chooseCrop(e.target.value)} disabled={!!listing} className={input}>
            <option value="">{crops.length ? 'Choose a crop' : 'Loading crops…'}</option>
            {crops.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="font-semibold">
          Variety <span className="font-normal text-ink-soft">(optional)</span>
          <input value={f.variety} onChange={set('variety')} maxLength={80} placeholder="Hybrid 501" className={input} />
        </label>
        <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
          <label className="font-semibold">
            In stock
            <input type="number" min="0" step="any" inputMode="decimal" value={f.qty} onChange={set('qty')} className={input} />
          </label>
          <label className="font-semibold">
            Unit
            <select value={f.unit} onChange={(e) => setF({ ...f, unit: e.target.value as Unit })} disabled={!!listing} className={input}>
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="font-semibold">
          Price per {f.unit} (₹)
          <input type="number" min="0" step="0.01" inputMode="decimal" value={f.price} onChange={set('price')} className={input} />
        </label>
        <label className="font-semibold">
          Harvest date
          <input type="date" value={f.harvestDate} onChange={set('harvestDate')} className={input} />
        </label>
        <label className="flex items-center gap-3 self-end pb-2 font-semibold">
          <input type="checkbox" checked={f.isOrganic} onChange={(e) => setF({ ...f, isOrganic: e.target.checked })} className="size-5 accent-primary" />
          Grown organically
        </label>
        <label className="font-semibold sm:col-span-2">
          Description <span className="font-normal text-ink-soft">(optional)</span>
          <textarea value={f.description} onChange={set('description')} maxLength={2000} rows={3} className={input} />
        </label>

        <fieldset className="sm:col-span-2">
          <legend className="font-semibold">Photos</legend>
          <p className="text-sm text-ink-soft">
            Take them at the farm with location turned on. Photos taken there get a Verified badge that customers see.
          </p>
          {listing && kept.length > 0 && (
            <div className="mt-3">
              <OwnerPhotos ownerType="LISTING" ownerId={listing.id} only={kept} onRemove={(id) => setKept((cur) => cur.filter((x) => x !== id))} />
            </div>
          )}
          {files.length > 0 && (
            <ul className="mt-3 space-y-1 text-sm" aria-label="Photos to upload">
              {files.map((file, i) => (
                <li key={`${file.name}-${i}`} className="flex items-center gap-2">
                  <span className="truncate">{file.name}</span>
                  <button type="button" className="underline" onClick={() => setFiles((cur) => cur.filter((_, j) => j !== i))}>
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
          {kept.length + files.length < MAX_PHOTOS && (
            <label className="mt-3 inline-block cursor-pointer rounded-lg border border-dashed border-ink-soft px-4 py-2 font-semibold hover:bg-paper">
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
          <p className="mt-1 text-sm text-ink-soft">Up to {MAX_PHOTOS} photos, JPEG, PNG or WebP, 5 MB each.</p>
        </fieldset>
      </div>

      {error && (
        <p role="alert" className="mt-4 font-semibold text-danger">
          {error}
        </p>
      )}
      <div className="mt-5 flex flex-wrap gap-3">
        <button type="submit" disabled={save.isPending} className={primary}>
          {save.isPending ? (files.length ? 'Uploading photos…' : 'Saving…') : listing ? 'Save changes' : 'List this produce'}
        </button>
        <button type="button" onClick={onCancel} disabled={save.isPending} className="px-2 font-semibold text-ink-soft underline">
          Cancel
        </button>
      </div>
    </form>
  )
}

export function FarmSetup() {
  const queryClient = useQueryClient()
  const [f, setF] = useState<FarmForm>({ name: '', village: '', district: '', state: '', lat: '', lng: '' })
  const [error, setError] = useState<string>()
  const create = useMutation({
    mutationFn: catalogApi.createFarm,
    onSuccess: (farm) => queryClient.setQueryData(['farms', 'mine'], [farm]),
    onError: (e) => setError(message(e)),
  })
  const set = (k: keyof FarmForm) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value })

  function useMyLocation() {
    if (!navigator.geolocation) return setError('This browser cannot share your location. Type the coordinates instead.')
    setError(undefined)
    navigator.geolocation.getCurrentPosition(
      (pos) => setF((cur) => ({ ...cur, lat: pos.coords.latitude.toFixed(5), lng: pos.coords.longitude.toFixed(5) })),
      (err) => setError(geoProblem(err)),
      { timeout: 10_000, maximumAge: 600_000 },
    )
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    setError(undefined)
    const body = farmPayload(f)
    if (typeof body === 'string') return setError(body)
    create.mutate(body)
  }

  return (
    <form onSubmit={submit} noValidate className="mt-8 max-w-2xl card p-4 sm:p-6" aria-label="Add your farm">
      <h2 className="font-display text-2xl">Add your farm first</h2>
      <p className="mt-1 text-ink-soft">
        Produce is picked up from your farm gate, and photos are checked against its location. You only do this once.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="font-semibold sm:col-span-2">
          Farm name
          <input value={f.name} onChange={set('name')} maxLength={120} placeholder="Verma Farms" className={input} />
        </label>
        <label className="font-semibold">
          Village <span className="font-normal text-ink-soft">(optional)</span>
          <input value={f.village} onChange={set('village')} maxLength={80} className={input} />
        </label>
        <label className="font-semibold">
          District
          <input value={f.district} onChange={set('district')} maxLength={80} className={input} />
        </label>
        <label className="font-semibold sm:col-span-2">
          State <span className="font-normal text-ink-soft">(optional)</span>
          <input value={f.state} onChange={set('state')} maxLength={80} className={input} />
        </label>
        <fieldset className="grid gap-4 sm:col-span-2 sm:grid-cols-2">
          <legend className="font-semibold">Farm gate location</legend>
          <label className="font-semibold">
            Latitude
            <input value={f.lat} onChange={set('lat')} inputMode="decimal" placeholder="21.25" className={input} />
          </label>
          <label className="font-semibold">
            Longitude
            <input value={f.lng} onChange={set('lng')} inputMode="decimal" placeholder="81.63" className={input} />
          </label>
          <button type="button" onClick={useMyLocation} className="justify-self-start font-semibold text-primary underline sm:col-span-2">
            Use my location
          </button>
        </fieldset>
      </div>
      {error && (
        <p role="alert" className="mt-4 font-semibold text-danger">
          {error}
        </p>
      )}
      <button type="submit" disabled={create.isPending} className={`${primary} mt-5`}>
        {create.isPending ? 'Saving…' : 'Save farm'}
      </button>
    </form>
  )
}
