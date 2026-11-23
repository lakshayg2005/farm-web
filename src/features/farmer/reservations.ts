import { api } from '@/api/http'
import type { CropUpdate, Reservation } from '@/features/customer/land'

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
  addSeason: (plotId: string, body: Omit<Season, 'id' | 'plotId'>) =>
    api<Season>(`/land/plots/${plotId}/seasons`, { method: 'POST', body }),
  removeSeason: (plotId: string, seasonId: string) => api<void>(`/land/plots/${plotId}/seasons/${seasonId}`, { method: 'DELETE' }),
  removePlot: (plotId: string) => api<void>(`/land/plots/${plotId}`, { method: 'DELETE' }),
  accept: (id: string) => api<Reservation>(`/land/reservations/${id}/accept`, { method: 'POST' }),
  reject: (id: string) => api<Reservation>(`/land/reservations/${id}/reject`, { method: 'POST' }),
  updates: (id: string) => api<CropUpdate[]>(`/land/reservations/${id}/updates`),
  addUpdate: (id: string, body: CropUpdateInput) => api<CropUpdate>(`/land/reservations/${id}/updates`, { method: 'POST', body }),
  /** The harvest order of one of my reservations (its option is null until the customer chooses). */
  harvestOrder: async (reservationId: string) => {
    const page = await api<{ items: { id: string; reservationId?: string | null; harvestOption?: 'DELIVERY' | 'BUYBACK' | null; status: string }[] }>(
      '/order/orders?role=farmer&limit=100',
    )
    return page.items.find((o) => o.reservationId === reservationId) ?? null
  },
  /** The farmer harvested `harvestedQtyKg`; the harvest order is priced on it (no quality check). */
  harvestReady: (id: string, harvestedQtyKg?: number) =>
    api<Reservation>(`/land/reservations/${id}/harvest-ready`, {
      method: 'POST',
      body: harvestedQtyKg ? { harvestedQtyKg } : {},
    }),
}

export type Stage = 'SOWN' | 'GROWING' | 'FLOWERING'

export interface CropUpdateInput {
  stage: Stage
  note?: string
  mediaIds: string[]
  location?: { type: 'Point'; coordinates: [number, number] }
}

export const STAGES: { id: Stage; label: string }[] = [
  { id: 'SOWN', label: 'Sown' },
  { id: 'GROWING', label: 'Growing' },
  { id: 'FLOWERING', label: 'Flowering' },
]

/** How far the crop has come: the latest stage posted, or harvest ready. */
export function stageReached(status: string, updates: { stage: Stage }[]): number {
  if (status === 'HARVEST_READY' || status === 'FULFILLING' || status === 'COMPLETED') return STAGES.length
  return updates.reduce((max, u) => Math.max(max, STAGES.findIndex((s) => s.id === u.stage)), -1)
}

/** The stage a new update most likely reports: the latest one posted, or Sown for the first. */
export function suggestedStage(updates: { stage: Stage }[]): Stage {
  return updates.at(-1)?.stage ?? 'SOWN'
}

export interface PlotWithSeasons {
  plot: MyPlot & { soilType: string | null; waterSource: string | null; createdAt: string }
  seasons: Season[]
}

/** Every plot the farmer has listed, newest first, with its growing seasons. */
export async function loadMyPlots(): Promise<PlotWithSeasons[]> {
  const plots = (await farmerLandApi.plots()) as PlotWithSeasons['plot'][]
  const lists = await Promise.all(
    plots.map(async (plot) => ({ plot, seasons: await farmerLandApi.seasons(plot.id).catch(() => [] as Season[]) })),
  )
  return lists
    .map((x) => ({ ...x, seasons: [...x.seasons].sort((a, b) => a.startDate.localeCompare(b.startDate)) }))
    .sort((a, b) => (b.plot.createdAt ?? '').localeCompare(a.plot.createdAt ?? ''))
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

/** Land marks unanswered requests EXPIRED within a minute of expiresAt; until then a pending one past it is shown as expired too. */
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
  HARVEST_READY: { label: 'Harvested', next: 'The harvest order is being made for the customer.' },
  FULFILLING: { label: 'Harvest order', next: 'The customer chooses delivery or buy-back; then it is delivered or bought back.' },
  COMPLETED: { label: 'Completed', next: 'The harvest was delivered or bought back. The customer can rate it.' },
}

export const PAST_TEXT: Record<string, string> = {
  REJECTED: 'Declined',
  CANCELLED: 'Cancelled',
  EXPIRED: 'Expired',
  PENDING: 'Expired',
  COMPLETED: 'Completed',
}
