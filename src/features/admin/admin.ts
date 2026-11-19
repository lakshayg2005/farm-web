import type { LogisticsComponents } from '@/api/generated'
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

/** One delivery pool: nearby drop points grouped into a single vehicle route (HLD section 14).
 * The page's own shape; `toPool` builds it from the logistics contract (PoolOut). */
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

type PoolOut = LogisticsComponents['schemas']['PoolOut']
type PoolRunResponse = LogisticsComponents['schemas']['PoolRunResponse']

const round1 = (km: number) => Math.round(km * 10) / 10

/** Logistics sends flat lat/lng stops and no route line, so draw the route through the stops in order. */
export function toPool(out: PoolOut): Pool {
  const stops: PoolStop[] = (out.stops ?? [])
    .map((s) => ({
      orderId: s.orderId,
      kind: s.stopType,
      sequence: s.seq,
      eta: s.eta ?? null,
      location: { type: 'Point' as const, coordinates: [s.lng, s.lat] as [number, number] },
    }))
    .sort((a, b) => a.sequence - b.sequence)
  return {
    id: out.id,
    date: out.poolDate,
    partnerId: out.partnerId ?? null,
    status: out.status,
    totalKm: round1(out.totalKm ?? 0),
    savedKm: round1(out.kmSaved ?? 0),
    route: stops.length > 1 ? { type: 'LineString', coordinates: stops.map((s) => s.location.coordinates) } : null,
    stops,
  }
}

export const adminApi = {
  farmers: (verified: boolean) =>
    api<UserPage>(`/identity/users?role=farmer&farmerVerified=${verified}&limit=200`),
  verifyFarmer: (userId: string) => api<UserRow>(`/identity/users/${userId}/verify-farmer`, { method: 'POST' }),
  inspections: () => api<InspectionSummary[]>('/quality/inspections'),
  /** GET /logistics/pools?pool_date (admin): the pools saved for that date. */
  pools: (date: string) => api<PoolOut[]>(`/logistics/pools?pool_date=${date}`).then((rows) => rows.map(toPool)),
  /** POST /logistics/pools/run?pool_date (admin) answers { poolsCreated, pools } for that date. */
  runPooling: (date: string) =>
    api<PoolRunResponse>(`/logistics/pools/run?pool_date=${date}`, { method: 'POST' }).then((r) => r.pools.map(toPool)),
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
  PENDING: 'Planned',
  ASSIGNED: 'Partner assigned',
  IN_PROGRESS: 'On the road',
  COMPLETED: 'Delivered',
}

export const todayISO = () => new Date().toISOString().slice(0, 10)
export const tomorrowISO = () => new Date(Date.now() + 86_400_000).toISOString().slice(0, 10)
