import { api } from './http'

/** Photos go straight to object storage through a signed URL; the media service then checks EXIF/GPS. */
export type OwnerType = 'FARM' | 'LISTING' | 'PLOT' | 'RESERVATION' | 'INSPECTION' | 'DELIVERY' | 'USER'
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

/** The badge a photo carries: verified, unverified (with the reason) or still being checked. */
export function photoBadge(m: Media): { kind: 'checking' | 'verified' | 'unverified' | 'failed'; label: string; detail: string } {
  if (isProcessing(m)) return { kind: 'checking', label: 'Checking', detail: 'Reading the photo’s location and time.' }
  if (m.status !== 'READY') return { kind: 'failed', label: 'Not accepted', detail: m.rejectReason ?? 'The photo could not be processed.' }
  if (m.isGeoVerified) return { kind: 'verified', label: 'Verified', detail: 'Taken at the farm.' }
  const detail =
    m.geoStatus === 'TOO_FAR' && m.distanceM !== null
      ? `Taken ${formatDistance(m.distanceM)} from the farm.`
      : m.geoStatus === 'NO_GPS'
        ? 'The photo has no location. Turn on location for your camera.'
        : 'The location could not be checked.'
  return { kind: 'unverified', label: 'Unverified', detail }
}

export function formatDistance(metres: number) {
  return metres >= 1000 ? `${(metres / 1000).toFixed(1)} km` : `${Math.round(metres)} m`
}
