import { api } from '@/api/http'

export interface Inspection {
  id: string
  subjectType: string
  subjectId: string
  attempt: number
  inspectorId: string | null
  status: string
  grade: string | null
  moisturePct: number | null
  pestFound: boolean | null
  weightKg: number | null
  result: string | null
  resolution: string | null
  mediaIds: string[]
  createdAt: string
  reportedAt: string | null
}

export type Grade = 'A' | 'B' | 'C'

export interface ReportInput {
  grade: Grade
  moisturePct: number
  pestFound: boolean
  weightKg: number
  result: 'PASS' | 'FAIL'
  resolution?: 'REHARVEST' | 'ACCEPT_LOWER_GRADE'
  acceptedGrade?: Grade
  mediaIds: string[]
  note?: string
  location?: { type: 'Point'; coordinates: [number, number] }
}

export const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024

export const inspectorApi = {
  list: () => api<Inspection[]>('/quality/inspections'),
  claim: (id: string) => api<Inspection>(`/quality/inspections/${id}/claim`, { method: 'POST' }),
  report: (id: string, body: ReportInput) => api<Inspection>(`/quality/inspections/${id}/report`, { method: 'POST', body }),
  setLocation: (lng: number, lat: number) =>
    api('/quality/inspectors/me/location', {
      method: 'PUT',
      body: { location: { type: 'Point', coordinates: [lng, lat] }, available: true },
    }),
}

/** Why a photo cannot be uploaded, or null if it is fine. */
export function photoProblem(file: { type: string; size: number }): string | null {
  if (!PHOTO_TYPES.includes(file.type)) return 'Choose a JPEG, PNG or WebP photo.'
  if (file.size > MAX_PHOTO_BYTES) return 'Photos must be 5 MB or smaller.'
  return null
}

/** Uploads one photo for an inspection through the media service and returns its media id. */
export async function uploadInspectionPhoto(inspectionId: string, file: File): Promise<string> {
  const slot = await api<{ mediaId: string; uploadUrl: string; headers: Record<string, string> }>('/media/upload-url', {
    method: 'POST',
    body: { ownerType: 'INSPECTION', ownerId: inspectionId, contentType: file.type, sizeBytes: file.size, fileName: file.name },
  })
  const put = await fetch(slot.uploadUrl, { method: 'PUT', headers: slot.headers, body: file })
  if (!put.ok) throw new Error(`Photo upload failed (${put.status}).`)
  await api(`/media/${slot.mediaId}/complete`, { method: 'POST' })
  return slot.mediaId
}

/** The report the server expects: a failure must say what happens next, a lower grade must name the grade. */
export function reportPayload(form: {
  grade: Grade
  moisture: string
  pest: boolean
  weight: string
  result: 'PASS' | 'FAIL'
  resolution: '' | 'REHARVEST' | 'ACCEPT_LOWER_GRADE'
  acceptedGrade: Grade
  note: string
  mediaIds: string[]
}): ReportInput | string {
  const moisturePct = Number(form.moisture)
  const weightKg = Number(form.weight)
  if (form.moisture.trim() === '' || !(moisturePct >= 0 && moisturePct <= 100)) return 'Moisture must be between 0 and 100.'
  if (!(weightKg > 0)) return 'Enter the weight in kilograms.'
  if (form.result === 'FAIL' && !form.resolution) return 'Say what happens next for a failed inspection.'
  const body: ReportInput = { grade: form.grade, moisturePct, pestFound: form.pest, weightKg, result: form.result, mediaIds: form.mediaIds }
  if (form.result === 'FAIL' && form.resolution) {
    body.resolution = form.resolution
    if (form.resolution === 'ACCEPT_LOWER_GRADE') body.acceptedGrade = form.acceptedGrade
  }
  if (form.note.trim()) body.note = form.note.trim()
  return body
}
