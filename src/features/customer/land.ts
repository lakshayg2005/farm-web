import { api } from '@/api/http'

export interface Crop {
  id: string
  name: string
  category: string
  defaultUnit: string
}

export interface PlotProperties {
  title: string
  areaAcres: number
  farmerId: string
  plotSeasonId: string
  season: string
  startDate: string
  endDate: string
  price: number
  allowedCrops: string[]
}

export interface PlotFeature {
  type: 'Feature'
  id: string
  geometry: { type: 'Polygon'; coordinates: number[][][] }
  properties: PlotProperties
}

export interface Bounds {
  west: number
  south: number
  east: number
  north: number
}

export type ReservationStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'ACTIVE'
  | 'HARVEST_READY'
  | 'FULFILLING'
  | 'REJECTED'
  | 'CANCELLED'
  | 'EXPIRED'
  | (string & {})

export interface Reservation {
  id: string
  plotSeasonId: string
  customerId: string
  farmerId: string
  cropId: string
  expectedQtyKg: number
  deposit: number | null
  total: number | null
  status: ReservationStatus
  expiresAt: string
}

export interface CropUpdate {
  id: string
  stage: 'SOWN' | 'GROWING' | 'FLOWERING'
  note: string | null
  mediaIds: string[]
  createdAt: string
}

export interface PaymentIntent {
  id: string
  amount: number
  status: 'PENDING' | 'SUCCEEDED' | 'FAILED'
}

export interface DeliveryAddress {
  line1: string
  city: string
  pincode: string
  contactPhone?: string
  location: { type: 'Point'; coordinates: [number, number] }
}

/** The map shows plots in view; with no map (script blocked) we search 200 km around central India. */
export function searchQuery(bounds: Bounds | null, filters: { season?: string; crop?: string }) {
  const q = new URLSearchParams()
  if (bounds) {
    q.set('west', String(bounds.west))
    q.set('south', String(bounds.south))
    q.set('east', String(bounds.east))
    q.set('north', String(bounds.north))
  } else {
    q.set('lat', '22.5')
    q.set('lng', '79')
    q.set('radius_km', '200')
  }
  if (filters.season) q.set('season', filters.season)
  if (filters.crop) q.set('crop', filters.crop)
  q.set('limit', '50')
  return q.toString()
}

export const landApi = {
  crops: () => api<Crop[]>('/catalog/crops'),
  searchPlots: (bounds: Bounds | null, filters: { season?: string; crop?: string }) =>
    api<{ features: PlotFeature[] }>(`/land/plots/search?${searchQuery(bounds, filters)}`).then((r) => r.features),
  reserve: (plotSeasonId: string, cropId: string, expectedQtyKg: number) =>
    api<Reservation>('/land/reservations', { method: 'POST', body: { plotSeasonId, cropId, expectedQtyKg } }),
  myReservations: () => api<Reservation[]>('/land/reservations/mine'),
  cancel: (id: string) => api<Reservation>(`/land/reservations/${id}/cancel`, { method: 'POST' }),
  updates: (id: string) => api<CropUpdate[]>(`/land/reservations/${id}/updates`),
  payDeposit: (reservationId: string, amount: number) =>
    api<PaymentIntent>('/orders/payments/intent', {
      method: 'POST',
      body: { amount, kind: 'DEPOSIT', referenceId: reservationId },
    }),
  chooseHarvest: (reservationId: string, option: 'DELIVERY' | 'BUYBACK', deliveryAddress?: DeliveryAddress) =>
    api('/orders/harvest', {
      method: 'POST',
      body: { reservationId, option, ...(option === 'DELIVERY' ? { deliveryAddress } : {}) },
    }),
}

export const rupees = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
export const day = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
