import { api } from './http'

/** Photos go straight to object storage through a signed URL; the media service then checks EXIF/GPS. */
export type OwnerType = 'FARM' | 'LISTING' | 'PLOT' | 'RESERVATION' | 'DELIVERY' | 'USER'
export type MediaStatus = 'PENDING_UPLOAD' | 'PROCESSING' | 'READY' | 'REJECTED' | 'FAILED' | 'DELETED'
export type GeoStatus = 'PENDING' | 'VERIFIED' | 'TOO_FAR' | 'NO_GPS' | 'NO_REFERENCE' | 'NOT_APPLICABLE'

export interface Media {
  id: string
  ownerType: OwnerType
  ownerId: string
  status: MediaStatus
  url: string | null
  thumbUrl: string | null
  isGeoVerified: boolean
  geoStatus: GeoStatus
  /** Metres from the farm or plot; 0 means inside it */
  distanceM: number | null
  exifTime: string | null
  rejectReason: string | null
  createdAt: string
}

export const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024
export const MAX_PHOTOS = 10

/** Why a photo cannot be uploaded, or null if it is fine. */
export function photoProblem(file: { type: string; size: number }): string | null {
  if (!PHOTO_TYPES.includes(file.type)) return 'Choose a JPEG, PNG or WebP photo.'
  if (file.size > MAX_PHOTO_BYTES) return 'Photos must be 5 MB or smaller.'
  return null
}

/** Uploads one photo for its owner (a listing, a reservation, ...) and returns the media id. */
export async function uploadPhoto(ownerType: OwnerType, ownerId: string, file: File): Promise<string> {
  const slot = await api<{ mediaId: string; uploadUrl: string; headers: Record<string, string> }>('/media/upload-url', {
    method: 'POST',
    body: { ownerType, ownerId, contentType: file.type, sizeBytes: file.size, fileName: file.name },
  })
  const put = await fetch(slot.uploadUrl, { method: 'PUT', headers: slot.headers, body: file })
  if (!put.ok) throw new Error(`Photo upload failed (${put.status}).`)
  await api(`/media/${slot.mediaId}/complete`, { method: 'POST' })
  return slot.mediaId
}

export const mediaApi = {
  forOwner: (ownerType: OwnerType, ownerId: string) =>
    api<{ items: Media[]; nextCursor: string | null }>(`/media/owners/${ownerType}/${ownerId}?limit=50`).then((r) => r.items),
}

/** Still being checked: poll until every photo has a verdict. */
export const isProcessing = (m: Media) => m.status === 'PENDING_UPLOAD' || m.status === 'PROCESSING'

/** How close (metres) a photo's GPS must be to the farm or plot to count as taken there (the server's rule). */
export const VERIFY_RADIUS_M = 2000

/**
 * The badge a photo carries. "Verified" only when the camera's GPS point in the photo lies within
 * 2 km of the farm (or inside / near the plot). A photo without a location — a screenshot, an
 * edited or a downloaded image — or one taken somewhere else is "Unverified", with the reason.
 */
export function photoBadge(m: Media): { kind: 'checking' | 'verified' | 'unverified' | 'failed'; label: string; detail: string } {
  if (isProcessing(m)) return { kind: 'checking', label: 'Checking', detail: 'Reading the photo’s location.' }
  if (m.status !== 'READY') return { kind: 'failed', label: 'Not accepted', detail: m.rejectReason ?? 'The photo could not be processed.' }
  // Listing and farm photos are checked against the farm, crop photos against the plot.
  const place = m.ownerType === 'PLOT' || m.ownerType === 'RESERVATION' ? 'plot' : 'farm'
  if (m.isGeoVerified) {
    return { kind: 'verified', label: 'Verified', detail: `Taken at the ${place}: the camera’s location matches the ${place}.` }
  }
  const detail =
    m.geoStatus === 'TOO_FAR' && m.distanceM !== null
      ? `Taken ${formatDistance(m.distanceM)} from the ${place}, not at it.`
      : m.geoStatus === 'NO_GPS'
        ? 'The photo has no camera location (a screenshot, edited or downloaded image), so it cannot be matched to the ' + place + '.'
        : m.geoStatus === 'NO_REFERENCE'
          ? `The ${place}’s location is not set, so the photo could not be checked.`
          : 'The location could not be checked.'
  return { kind: 'unverified', label: 'Unverified', detail }
}

/** What the upload form says about a photo before it is sent, from its own GPS data. */
export function photoLocationHint(hasGps: boolean | undefined): { ok: boolean; text: string } | null {
  if (hasGps === undefined) return null
  return hasGps
    ? { ok: true, text: 'Has a camera location: it will be checked against the farm.' }
    : { ok: false, text: 'No camera location (screenshot or downloaded image): it will show as Unverified.' }
}

export function formatDistance(metres: number) {
  return metres >= 1000 ? `${(metres / 1000).toFixed(1)} km` : `${Math.round(metres)} m`
}
