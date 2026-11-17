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
  runPooling: (date: string) => api<Pool[]>('/logistics/pools/run', { method: 'POST', body: { date } }),
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

export const todayISO = () => new Date().toISOString().slice(0, 10)
export const tomorrowISO = () => new Date(Date.now() + 86_400_000).toISOString().slice(0, 10)
