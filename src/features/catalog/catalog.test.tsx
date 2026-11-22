import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { session } from '@/features/auth/session'
import { jsonResponse, mockApi, renderAt } from '@/test/auth'
import { deliveryEstimate, freshness, refine, type Produce } from './catalog'

const TODAY = new Date(2026, 10, 20, 9)

const listing = (over: Partial<Produce> = {}): Produce => ({
  id: 'l1',
  cropId: 'tomato',
  cropName: 'Tomato',
  variety: 'Desi',
  description: null,
  farmId: 'f1',
  farmName: 'Hariyali Farms',
  farmerId: 'u1',
  village: 'Kumhari',
  district: 'Durg',
  pricePerUnit: 32,
  unit: 'kg',
  qtyAvailable: 40,
  harvestDate: '2026-11-19',
  grade: 'A',
  isOrganic: true,
  distanceM: 6000,
  lat: 21.2,
  lng: 81.3,
  updatedAt: '2026-11-19T10:00:00Z',
  ...over,
})

beforeEach(() => session.clear())

describe('freshness', () => {
  it('is peak right after harvest and fades with the shelf life of the category', () => {
    expect(freshness('2026-11-19', 'vegetable', TODAY)).toMatchObject({ tone: 'peak', detail: 'Harvested yesterday' })
    expect(freshness('2026-11-15', 'vegetable', TODAY).tone).toBe('good')
    expect(freshness('2026-11-15', 'leafy', TODAY).tone).toBe('soon')
    expect(freshness('2026-10-01', 'grain', TODAY).tone).toBe('fresh') // grain keeps for months
  })

  it('says when a crop is still to be harvested', () => {
    expect(freshness('2026-11-22', 'fruit', TODAY)).toMatchObject({ tone: 'upcoming', detail: 'Picked to order in 2 days' })
  })
})

describe('delivery estimate', () => {
  it('is next morning for nearby farms and longer for far ones', () => {
    expect(deliveryEstimate(6000, '2026-11-19', TODAY)).toMatchObject({ label: 'Tomorrow', minDays: 1, maxDays: 1 })
    expect(deliveryEstimate(6000, '2026-11-19', TODAY).by).toContain('by 11 am')
    expect(deliveryEstimate(90_000, '2026-11-19', TODAY).label).toBe('In 2–3 days')
  })

  it('waits for the harvest first', () => {
    expect(deliveryEstimate(6000, '2026-11-22', TODAY)).toMatchObject({ minDays: 3, maxDays: 3, label: 'In 3 days' })
  })
})

describe('refine', () => {
  const items = [
    listing(),
    listing({ id: 'l2', cropId: 'spinach', cropName: 'Spinach', harvestDate: '2026-11-17', distanceM: 2000, pricePerUnit: 18 }),
    listing({ id: 'l3', cropId: 'mango', cropName: 'Mango', farmName: 'Sunrise', distanceM: 30000, pricePerUnit: 90 }),
  ]
  it('filters by category and text and sorts', () => {
    expect(refine(items, { category: 'leafy', text: '', sort: 'distance' }).map((p) => p.id)).toEqual(['l2'])
    expect(refine(items, { category: 'all', text: 'sunrise', sort: 'distance' }).map((p) => p.id)).toEqual(['l3'])
    expect(refine(items, { category: 'all', text: '', sort: 'price' }).map((p) => p.id)).toEqual(['l2', 'l1', 'l3'])
    expect(refine(items, { category: 'all', text: '', sort: 'freshest' }, TODAY)[0]!.id).not.toBe('l2')
  })
})

describe('catalog page', () => {
  it('shows live listings with freshness and arrival, and opens the details', async () => {
    mockApi({
      'GET /catalog/crops': () => jsonResponse([{ id: 'tomato', name: 'Tomato', category: 'vegetable', defaultUnit: 'kg' }]),
      'GET /catalog/listings/search': () =>
        jsonResponse({
          type: 'FeatureCollection',
          features: [{ type: 'Feature', id: 'l1', geometry: { type: 'Point', coordinates: [81.3, 21.2] }, properties: listing() }],
        }),
    })
    renderAt('/catalog')
    const card = await screen.findByRole('button', { name: 'Tomato from Hariyali Farms' })
    expect(within(card).getByRole('meter', { name: 'Freshness' })).toBeInTheDocument()
    expect(screen.queryByText(/Showing sample produce/)).not.toBeInTheDocument()
    await userEvent.click(card)
    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'When will it arrive?' })).toBeInTheDocument()
  })

  it('falls back to labelled sample produce when the catalog is unreachable', async () => {
    mockApi({
      'GET /catalog/crops': () => jsonResponse({ error: { code: 'down', message: 'down' } }, 503),
      'GET /catalog/listings/search': () => jsonResponse({ error: { code: 'down', message: 'down' } }, 503),
    })
    renderAt('/catalog')
    expect(await screen.findByText(/Showing sample produce/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /Leafy greens/ }))
    expect(screen.getByRole('button', { name: /Spinach \(Palak\) from/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Tomato from/ })).not.toBeInTheDocument()
  })
})
