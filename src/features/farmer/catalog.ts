import type { Tone } from '@/components/ui'
import { api } from '@/api/http'

export type Unit = 'kg' | 'quintal' | 'dozen' | 'piece' | 'bunch' | 'litre'
export const UNITS: Unit[] = ['kg', 'quintal', 'dozen', 'piece', 'bunch', 'litre']
export type ListingStatus = 'ACTIVE' | 'PAUSED' | 'SOLD_OUT' | 'ARCHIVED'

export interface GeoPoint {
  type: 'Point'
  coordinates: [number, number]
}

export interface CatalogCrop {
  id: string
  name: string
  category: string
  defaultUnit: Unit
}

export interface Farm {
  id: string
  name: string
  village: string | null
  district: string
  state: string | null
  location: GeoPoint
}

export interface Listing {
  id: string
  farmId: string
  farmName: string
  cropId: string
  cropName: string
  variety: string | null
  description: string | null
  qtyAvailable: number
  unit: Unit
  pricePerUnit: number
  harvestDate: string
  grade: 'A' | 'B' | 'C' | null
  isOrganic: boolean
  status: ListingStatus
  mediaIds: string[]
  updatedAt: string
}

export interface FarmInput {
  name: string
  village?: string
  district: string
  state?: string
  location: GeoPoint
}

export interface ListingInput {
  farmId: string
  cropId: string
  variety?: string
  description?: string
  qtyAvailable: number
  unit: Unit
  pricePerUnit: number
  harvestDate: string
  isOrganic: boolean
}

/** PATCH body: crop, farm and unit are fixed once listed; null clears variety or description. */
export interface ListingChanges {
  qtyAvailable?: number
  pricePerUnit?: number
  harvestDate?: string
  isOrganic?: boolean
  variety?: string | null
  description?: string | null
  status?: 'ACTIVE' | 'PAUSED'
  mediaIds?: string[]
}

interface Page<T> {
  items: T[]
  nextCursor: string | null
}

export const catalogApi = {
  crops: () => api<CatalogCrop[]>('/catalog/crops'),
  myFarms: () => api<Page<Farm>>('/catalog/farms/mine?limit=50').then((r) => r.items),
  createFarm: (body: FarmInput) =>
    api<Farm>('/catalog/farms', { method: 'POST', body, headers: { 'Idempotency-Key': crypto.randomUUID() } }),
  myListings: () => api<Page<Listing>>('/catalog/listings/mine?limit=100').then((r) => r.items),
  createListing: (body: ListingInput, idempotencyKey: string) =>
    api<Listing>('/catalog/listings', { method: 'POST', body, headers: { 'Idempotency-Key': idempotencyKey } }),
  updateListing: (id: string, body: ListingChanges) => api<Listing>(`/catalog/listings/${id}`, { method: 'PATCH', body }),
  removeListing: (id: string) => api<void>(`/catalog/listings/${id}`, { method: 'DELETE' }),
}

export interface ListingForm {
  farmId: string
  cropId: string
  variety: string
  description: string
  qty: string
  unit: Unit
  price: string
  harvestDate: string
  isOrganic: boolean
}

/** Checks the form the way the catalog does, so the farmer sees the problem before sending. */
export function listingPayload(f: ListingForm): ListingInput | string {
  if (!f.farmId) return 'Choose the farm this produce comes from.'
  if (!f.cropId) return 'Choose a crop.'
  const qtyAvailable = Number(f.qty)
  const pricePerUnit = Number(f.price)
  if (f.qty.trim() === '' || !(qtyAvailable > 0) || qtyAvailable > 1_000_000) return 'Enter how much you have in stock.'
  if (f.price.trim() === '' || !(pricePerUnit > 0) || pricePerUnit > 1_000_000) return 'Enter a price per unit in rupees.'
  if (!/^\d{4}-\d{2}-\d{2}$/.test(f.harvestDate)) return 'Enter the harvest date.'
  const body: ListingInput = {
    farmId: f.farmId,
    cropId: f.cropId,
    qtyAvailable,
    unit: f.unit,
    pricePerUnit: Math.round(pricePerUnit * 100) / 100,
    harvestDate: f.harvestDate,
    isOrganic: f.isOrganic,
  }
  if (f.variety.trim()) body.variety = f.variety.trim()
  if (f.description.trim()) body.description = f.description.trim()
  return body
}

/** What changed on an existing listing; crop, farm and unit are fixed once listed. */
export function listingChanges(before: Listing, f: ListingForm): ListingChanges | string {
  const next = listingPayload({ ...f, farmId: before.farmId, cropId: before.cropId, unit: before.unit })
  if (typeof next === 'string') return next
  const changes: ListingChanges = {}
  if (next.qtyAvailable !== before.qtyAvailable) changes.qtyAvailable = next.qtyAvailable
  if (next.pricePerUnit !== before.pricePerUnit) changes.pricePerUnit = next.pricePerUnit
  if (next.harvestDate !== before.harvestDate) changes.harvestDate = next.harvestDate
  if (next.isOrganic !== before.isOrganic) changes.isOrganic = next.isOrganic
  if ((next.variety ?? null) !== before.variety) changes.variety = next.variety ?? null
  if ((next.description ?? null) !== before.description) changes.description = next.description ?? null
  return changes
}

export interface FarmForm {
  name: string
  village: string
  district: string
  state: string
  lat: string
  lng: string
}

export function farmPayload(f: FarmForm): FarmInput | string {
  if (!f.name.trim()) return 'Give your farm a name.'
  if (!f.district.trim()) return 'Enter the district.'
  const lat = Number(f.lat)
  const lng = Number(f.lng)
  if (f.lat.trim() === '' || f.lng.trim() === '' || !(lat >= -90 && lat <= 90) || !(lng >= -180 && lng <= 180))
    return 'Set the farm gate location with "Use my location", or type the latitude and longitude.'
  const body: FarmInput = { name: f.name.trim(), district: f.district.trim(), location: { type: 'Point', coordinates: [lng, lat] } }
  if (f.village.trim()) body.village = f.village.trim()
  if (f.state.trim()) body.state = f.state.trim()
  return body
}

export const STATUS_TEXT: Record<ListingStatus, { label: string; tone: Tone }> = {
  ACTIVE: { label: 'On sale', tone: 'good' },
  PAUSED: { label: 'Paused', tone: 'neutral' },
  SOLD_OUT: { label: 'Sold out', tone: 'warn' },
  ARCHIVED: { label: 'Removed', tone: 'neutral' },
}

export const rupees = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
export const day = (iso: string) =>
  new Date(`${iso.slice(0, 10)}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
export const todayISO = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
