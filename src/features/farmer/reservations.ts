import { api } from '@/api/http'
import type { Reservation } from '@/features/customer/land'

export interface MyPlot {
  id: string
  title: string
  areaAcres: number
  status: string
}

export interface Season {
  id: string
  plotId: string
  season: string
  startDate: string
  endDate: string
  price: number
  allowedCrops: string[]
}

/** What a farmer needs to recognise a request: which plot, which season. */
export interface SeasonInfo {
  plotId: string
  plotTitle: string
  areaAcres: number
  season: string
  startDate: string
  endDate: string
  price: number
}

export const farmerLandApi = {
  reservations: () => api<Reservation[]>('/land/reservations/mine'),
  plots: () => api<MyPlot[]>('/land/plots/mine'),
  seasons: (plotId: string) => api<Season[]>(`/land/plots/${plotId}/seasons`),
  accept: (id: string) => api<Reservation>(`/land/reservations/${id}/accept`, { method: 'POST' }),
  reject: (id: string) => api<Reservation>(`/land/reservations/${id}/reject`, { method: 'POST' }),
}

/** All the farmer's plot-seasons by id, so a reservation (which only has plotSeasonId) can be named. */
export async function loadSeasonIndex(): Promise<Map<string, SeasonInfo>> {
  const plots = await farmerLandApi.plots()
  const lists = await Promise.all(
    plots.map(async (plot) => ({ plot, seasons: await farmerLandApi.seasons(plot.id).catch(() => [] as Season[]) })),
  )
  const index = new Map<string, SeasonInfo>()
  for (const { plot, seasons } of lists)
    for (const s of seasons)
      index.set(s.id, {
        plotId: plot.id,
        plotTitle: plot.title,
        areaAcres: plot.areaAcres,
        season: s.season,
        startDate: s.startDate,
        endDate: s.endDate,
        price: s.price,
      })
  return index
}

export const REQUEST_WINDOW_MS = 48 * 3_600_000

/** The land service does not expire requests itself; past expiresAt a pending request can no longer be accepted. */
export function isExpired(r: Reservation, now: number) {
  return r.status === 'EXPIRED' || (r.status === 'PENDING' && Date.parse(r.expiresAt) <= now)
}

export type Group = 'waiting' | 'agreement' | 'past'

export function groupOf(r: Reservation, now: number): Group {
  if (isExpired(r, now)) return 'past'
  if (r.status === 'PENDING') return 'waiting'
  if (['ACCEPTED', 'ACTIVE', 'HARVEST_READY', 'FULFILLING'].includes(r.status)) return 'agreement'
  return 'past'
}

/** "1 day 4 h left", "5 h 12 min left", "9 min left". */
export function timeLeft(expiresAt: string, now: number): string {
  const ms = Date.parse(expiresAt) - now
  if (ms <= 0) return 'Expired'
  const totalMin = Math.max(1, Math.floor(ms / 60_000))
  const days = Math.floor(totalMin / 1440)
  const hours = Math.floor((totalMin % 1440) / 60)
  const mins = totalMin % 60
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} ${hours} h left`
  if (hours > 0) return `${hours} h ${mins} min left`
  return `${mins} min left`
}

/** Share of the 48 h answer window still left, 0..1. */
export function windowLeft(expiresAt: string, now: number) {
  return Math.min(1, Math.max(0, (Date.parse(expiresAt) - now) / REQUEST_WINDOW_MS))
}

export const AGREEMENT_TEXT: Record<string, { label: string; next: string }> = {
  ACCEPTED: { label: 'Deposit due', next: 'Waiting for the customer to pay the deposit.' },
  ACTIVE: { label: 'Growing', next: 'Deposit paid. Post crop updates as the crop grows.' },
  HARVEST_READY: { label: 'Harvest ready', next: 'Waiting for the quality check and the customer’s delivery or buy-back choice.' },
  FULFILLING: { label: 'Harvest order', next: 'The harvest order is being delivered or bought back.' },
}

export const PAST_TEXT: Record<string, string> = {
  REJECTED: 'Declined',
  CANCELLED: 'Cancelled',
  EXPIRED: 'Expired',
  PENDING: 'Expired',
}
