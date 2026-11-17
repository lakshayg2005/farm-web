import { api } from '@/api/http'
import type { User } from '@/features/auth/types'

export interface UserRow extends User {
  createdAt: string
}

export interface UserPage {
  items: UserRow[]
  nextCursor: string | null
}

export interface InspectionSummary {
  id: string
  status: string
  result: string | null
  grade: string | null
}

/** One delivery pool: nearby drop points grouped into a single vehicle route (HLD section 14). */
export interface PoolStop {
  orderId: string
  kind: 'PICKUP' | 'DROP'
  sequence: number
  eta: string | null
  location: { type: 'Point'; coordinates: [number, number] }
}

export interface Pool {
  id: string
  date: string
  partnerId: string | null
  status: string
  totalKm: number
  savedKm: number
  route: { type: 'LineString'; coordinates: [number, number][] } | null
  stops: PoolStop[]
}

export const adminApi = {
  farmers: (verified: boolean) =>
    api<UserPage>(`/identity/users?role=farmer&farmerVerified=${verified}&limit=200`),
  verifyFarmer: (userId: string) => api<UserRow>(`/identity/users/${userId}/verify-farmer`, { method: 'POST' }),
  inspections: () => api<InspectionSummary[]>('/quality/inspections'),
  pools: (date: string) => api<Pool[]>(`/logistics/pools?date=${date}`),
  /** HLD section 15: POST /logistics/pools/run?date (admin), answering with that date's pools. */
  runPooling: (date: string) => api<Pool[]>(`/logistics/pools/run?date=${date}`, { method: 'POST' }),
}

/** Share of finished inspections that passed, as a whole percent; null until one is finished. */
export function passRate(inspections: InspectionSummary[]): number | null {
  const done = inspections.filter((i) => i.result === 'PASS' || i.result === 'FAIL')
  if (done.length === 0) return null
  return Math.round((done.filter((i) => i.result === 'PASS').length / done.length) * 100)
}

export function totalSavedKm(pools: Pool[]): number {
  return Math.round(pools.reduce((sum, p) => sum + p.savedKm, 0) * 10) / 10
}

/** The day's totals. Separate trips would have driven totalKm + savedKm, so the share saved is savedKm of that. */
export function poolSummary(pools: Pool[]) {
  const routeKm = pools.reduce((sum, p) => sum + p.totalKm, 0)
  const savedKm = pools.reduce((sum, p) => sum + p.savedKm, 0)
  const separateKm = routeKm + savedKm
  return {
    pools: pools.length,
    deliveries: pools.reduce((n, p) => n + p.stops.filter((s) => s.kind === 'DROP').length, 0),
    routeKm: Math.round(routeKm * 10) / 10,
    savedKm: Math.round(savedKm * 10) / 10,
    savedPct: separateKm > 0 ? Math.round((savedKm / separateKm) * 100) : 0,
  }
}

/** Stops in driving order; pickups come before the drops that depend on them (HLD section 14). */
export const orderedStops = (pool: Pool) => [...pool.stops].sort((a, b) => a.sequence - b.sequence)

export const POOL_STATUS: Record<string, string> = {
  PLANNED: 'Planned',
  ASSIGNED: 'Partner assigned',
  IN_PROGRESS: 'On the road',
  COMPLETED: 'Delivered',
}

export const todayISO = () => new Date().toISOString().slice(0, 10)
export const tomorrowISO = () => new Date(Date.now() + 86_400_000).toISOString().slice(0, 10)
