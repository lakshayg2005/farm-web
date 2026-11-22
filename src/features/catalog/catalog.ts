import { api } from '@/api/http'

/** One produce listing as the catalog page shows it (a flattened search result). */
export interface Produce {
  id: string
  cropId: string
  cropName: string
  variety: string | null
  description: string | null
  farmId: string
  farmName: string
  farmerId: string
  village: string | null
  district: string
  pricePerUnit: number
  unit: string
  qtyAvailable: number
  harvestDate: string
  grade: 'A' | 'B' | 'C' | null
  isOrganic: boolean
  distanceM: number
  lat: number
  lng: number
  /** Photos held by the media service (object storage); empty for sample produce */
  mediaIds?: string[]
  updatedAt: string
}

export interface CatalogCrop {
  id: string
  name: string
  category: string
}

export type SortKey = 'distance' | 'price' | 'newest' | 'freshest'

export interface SearchParams {
  lat: number
  lng: number
  radiusKm: number
  organic?: boolean
  sort?: SortKey
}

interface SearchFeature {
  id: string
  geometry: { coordinates: [number, number] }
  properties: Omit<Produce, 'lat' | 'lng'>
}

/** Places customers can search around without sharing their location (the seeded districts). */
export const PLACES = [
  { name: 'Bhilai / Durg', lat: 21.1904, lng: 81.2849 },
  { name: 'Raipur', lat: 21.2514, lng: 81.6296 },
  { name: 'Bilaspur', lat: 22.0797, lng: 82.1409 },
  { name: 'Nashik', lat: 19.9975, lng: 73.7898 },
  { name: 'Pune', lat: 18.5204, lng: 73.8567 },
  { name: 'Indore', lat: 22.7196, lng: 75.8577 },
  { name: 'Jaipur', lat: 26.9124, lng: 75.7873 },
  { name: 'Ludhiana', lat: 30.901, lng: 75.8573 },
] as const

export const catalogApi = {
  crops: () => api<CatalogCrop[]>('/catalog/crops', { anonymous: true }),
  async search({ lat, lng, radiusKm, organic, sort }: SearchParams): Promise<Produce[]> {
    const q = new URLSearchParams({
      lat: String(lat),
      lng: String(lng),
      radius_km: String(radiusKm),
      // "freshest" is sorted here, on the newest results
      sort: sort === 'freshest' || !sort ? 'distance' : sort,
      limit: '50',
    })
    if (organic) q.set('organic', 'true')
    const page = await api<{ features: SearchFeature[] }>(`/catalog/listings/search?${q}`, { anonymous: true })
    return page.features.map((f) => ({
      ...f.properties,
      id: f.id,
      lng: f.geometry.coordinates[0],
      lat: f.geometry.coordinates[1],
    }))
  },
}

// ---------------------------------------------------------------------------------------------
// Categories and how each crop looks (no photos needed: an emoji on a crop-coloured tile)
// ---------------------------------------------------------------------------------------------

export const CATEGORIES = [
  { id: 'all', label: 'All produce', emoji: '🧺' },
  { id: 'vegetable', label: 'Vegetables', emoji: '🥕' },
  { id: 'leafy', label: 'Leafy greens', emoji: '🥬' },
  { id: 'fruit', label: 'Fruits', emoji: '🥭' },
  { id: 'grain', label: 'Grains', emoji: '🌾' },
  { id: 'pulse', label: 'Pulses', emoji: '🫘' },
  { id: 'spice', label: 'Spices', emoji: '🧄' },
  { id: 'oilseed', label: 'Oilseeds & cane', emoji: '🌻' },
] as const

/** Category of every crop in the catalog's crop list (kept here so the page works offline too). */
export const CROP_CATEGORY: Record<string, string> = {
  tomato: 'vegetable', onion: 'vegetable', potato: 'vegetable', brinjal: 'vegetable', okra: 'vegetable',
  cauliflower: 'vegetable', cabbage: 'vegetable', carrot: 'vegetable', 'green-chilli': 'vegetable',
  'bottle-gourd': 'vegetable', 'bitter-gourd': 'vegetable', cucumber: 'vegetable', pumpkin: 'vegetable',
  peas: 'vegetable', spinach: 'leafy', coriander: 'leafy', methi: 'leafy', mango: 'fruit', banana: 'fruit',
  guava: 'fruit', papaya: 'fruit', watermelon: 'fruit', rice: 'grain', wheat: 'grain', maize: 'grain',
  millet: 'grain', arhar: 'pulse', chana: 'pulse', moong: 'pulse', soybean: 'oilseed', groundnut: 'oilseed',
  mustard: 'oilseed', sugarcane: 'oilseed', garlic: 'spice', ginger: 'spice', turmeric: 'spice',
}

const LOOK: Record<string, [emoji: string, hue: string]> = {
  tomato: ['🍅', '#fde2dc'], onion: ['🧅', '#f6e3ef'], potato: ['🥔', '#f3e6cf'], brinjal: ['🍆', '#ebe2f6'],
  okra: ['🫛', '#e3f1d9'], cauliflower: ['🥦', '#eef1e2'], cabbage: ['🥬', '#e2f2dc'], carrot: ['🥕', '#fde7d4'],
  'green-chilli': ['🌶️', '#e1f0d6'], 'bottle-gourd': ['🥒', '#e4f2dd'], 'bitter-gourd': ['🥒', '#dcefd5'],
  cucumber: ['🥒', '#e2f3df'], pumpkin: ['🎃', '#fde6cc'], peas: ['🫛', '#e0f1d6'], spinach: ['🥬', '#dbf0d6'],
  coriander: ['🌿', '#ddf1db'], methi: ['🌿', '#e2f2d8'], mango: ['🥭', '#fff0c9'], banana: ['🍌', '#fff4c4'],
  guava: ['🍐', '#e6f4d4'], papaya: ['🍈', '#fee8cf'], watermelon: ['🍉', '#fde0e0'], rice: ['🍚', '#f5f1e4'],
  wheat: ['🌾', '#f8ecc9'], maize: ['🌽', '#fff0bf'], millet: ['🌾', '#f3e9cf'], arhar: ['🫘', '#f6e8cf'],
  chana: ['🫘', '#f2e4cc'], moong: ['🫘', '#e4f0d4'], soybean: ['🫘', '#f1ead2'], groundnut: ['🥜', '#f4e3c9'],
  mustard: ['🌼', '#fff3c2'], sugarcane: ['🎋', '#e3f0d6'], garlic: ['🧄', '#f4f0e8'], ginger: ['🫚', '#f6e8cf'],
  turmeric: ['🟠', '#fde9c4'],
}

export function cropLook(cropId: string): { emoji: string; hue: string } {
  const [emoji, hue] = LOOK[cropId] ?? ['🌱', '#e6f0dc']
  return { emoji, hue }
}

export function categoryOf(cropId: string, crops?: CatalogCrop[]): string {
  return crops?.find((c) => c.id === cropId)?.category ?? CROP_CATEGORY[cropId] ?? 'vegetable'
}

// ---------------------------------------------------------------------------------------------
// Freshness and delivery time
// ---------------------------------------------------------------------------------------------

/** How many days produce of each category stays at its best after harvest. */
const SHELF_DAYS: Record<string, number> = {
  leafy: 4, vegetable: 7, fruit: 8, spice: 30, cash: 14, grain: 180, pulse: 180, oilseed: 120,
}

const DAY = 86_400_000

function dayStart(d: Date) {
  return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())
}

function daysBetween(fromIso: string, today: Date) {
  const [y = 1970, m = 1, d = 1] = fromIso.split('-').map(Number)
  return Math.round((dayStart(today) - Date.UTC(y, m - 1, d)) / DAY)
}

export type FreshTone = 'peak' | 'fresh' | 'good' | 'soon' | 'upcoming'

export interface Freshness {
  /** 0..1 share of the shelf life still ahead */
  score: number
  label: string
  detail: string
  tone: FreshTone
  /** Days since harvest; negative while the crop is still in the field */
  ageDays: number
}

export function freshness(harvestDate: string, category: string, today = new Date()): Freshness {
  const age = daysBetween(harvestDate, today)
  if (age < 0) {
    const n = -age
    return {
      score: 1,
      label: 'Harvest soon',
      detail: `Picked to order in ${n} day${n === 1 ? '' : 's'}`,
      tone: 'upcoming',
      ageDays: age,
    }
  }
  const shelf = SHELF_DAYS[category] ?? 7
  const score = Math.max(0, Math.min(1, 1 - age / shelf))
  const detail = age === 0 ? 'Harvested today' : age === 1 ? 'Harvested yesterday' : `Harvested ${age} days ago`
  if (age <= 1 || score >= 0.8) return { score, label: 'Peak fresh', detail, tone: 'peak', ageDays: age }
  if (score >= 0.55) return { score, label: 'Farm fresh', detail, tone: 'fresh', ageDays: age }
  if (score >= 0.25) return { score, label: 'Good', detail, tone: 'good', ageDays: age }
  return { score, label: 'Use soon', detail, tone: 'soon', ageDays: age }
}

export interface Delivery {
  minDays: number
  maxDays: number
  /** "Tomorrow", "In 2–3 days", ... */
  label: string
  /** Arrival date (or range) in words */
  by: string
  /** Why it takes this long */
  detail: string
}

const fmtDay = (d: Date) => d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })

/**
 * Orders are packed by the farmer, quality-checked, then pooled into shared delivery routes every
 * night, so most orders arrive the next day; farther farms add a day or two on the road. Crops
 * still in the field arrive the day after harvest.
 */
export function deliveryEstimate(distanceM: number, harvestDate: string, today = new Date()): Delivery {
  const km = distanceM / 1000
  let [minDays, maxDays] = km <= 25 ? [1, 1] : km <= 60 ? [1, 2] : km <= 150 ? [2, 3] : [3, 5]
  const untilHarvest = -daysBetween(harvestDate, today)
  if (untilHarvest > 0) {
    minDays += untilHarvest
    maxDays += untilHarvest
  }
  const from = new Date(dayStart(today) + minDays * DAY)
  const to = new Date(dayStart(today) + maxDays * DAY)
  const label =
    minDays === 1 && maxDays === 1 ? 'Tomorrow' : minDays === maxDays ? `In ${minDays} days` : `In ${minDays}–${maxDays} days`
  const by = minDays === maxDays ? `Arrives ${fmtDay(from)}${km <= 25 ? ', by 11 am' : ''}` : `Arrives ${fmtDay(from)} – ${fmtDay(to)}`
  const detail =
    untilHarvest > 0
      ? `Harvested in ${untilHarvest} day${untilHarvest === 1 ? '' : 's'}, then checked and delivered`
      : km <= 25
        ? 'Nearby farm: packed, checked and on tomorrow’s morning route'
        : 'Packed, quality-checked and pooled into a shared route'
  return { minDays, maxDays, label, by, detail }
}

export function formatKm(distanceM: number) {
  const km = distanceM / 1000
  return km < 1 ? `${Math.round(distanceM)} m` : `${km < 10 ? km.toFixed(1) : Math.round(km)} km`
}

export const rupees = (n: number) =>
  n.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: n % 1 ? 2 : 0 })

/** Filters and sorts on the page (category, text, freshest) after the search. */
export function refine(
  items: Produce[],
  { category, text, sort, crops }: { category: string; text: string; sort: SortKey; crops?: CatalogCrop[] },
  today = new Date(),
): Produce[] {
  const needle = text.trim().toLowerCase()
  const out = items.filter(
    (p) =>
      (category === 'all' || categoryOf(p.cropId, crops) === category) &&
      (!needle || [p.cropName, p.variety, p.farmName, p.village, p.district].some((v) => v?.toLowerCase().includes(needle))),
  )
  if (sort === 'freshest')
    out.sort(
      (a, b) =>
        freshness(b.harvestDate, categoryOf(b.cropId, crops), today).score -
          freshness(a.harvestDate, categoryOf(a.cropId, crops), today).score || a.distanceM - b.distanceM,
    )
  if (sort === 'price') out.sort((a, b) => a.pricePerUnit - b.pricePerUnit)
  if (sort === 'distance') out.sort((a, b) => a.distanceM - b.distanceM)
  return out
}
