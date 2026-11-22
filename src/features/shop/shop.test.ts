import { beforeEach, describe, expect, it } from 'vitest'
import { addressPayload, cartStore, cartTotals, freshness, journeyStep, refine, searchQuery, stepOf, type Produce } from './shop'

const produce = (over: Partial<Produce>): Produce => ({
  id: 'l1', farmId: 'f1', farmName: 'Sahu Farm', farmRating: null, farmRatingCount: 0, district: 'Durg', village: 'Patan',
  cropId: 'tomato', cropName: 'Tomato', variety: 'Hybrid', description: null, qtyAvailable: 20, unit: 'kg', pricePerUnit: 30,
  harvestDate: '2026-11-20', grade: null, isOrganic: false, mediaIds: [], createdAt: '', distanceM: 1000, ...over,
})

describe('cart', () => {
  beforeEach(() => cartStore.clear())

  it('adds, merges and caps at the stock', () => {
    cartStore.add(produce({}), 5)
    cartStore.add(produce({}), 30)
    expect(cartStore.get()).toHaveLength(1)
    expect(cartStore.get()[0]!.qty).toBe(20)
  })

  it('removes a line when its quantity reaches zero', () => {
    cartStore.add(produce({}), 2)
    cartStore.setQty('l1', 0)
    expect(cartStore.get()).toEqual([])
  })

  it('charges one delivery fee per farm', () => {
    cartStore.add(produce({}), 2)
    cartStore.add(produce({ id: 'l2', farmId: 'f2' }), 1)
    cartStore.add(produce({ id: 'l3', farmId: 'f2' }), 1)
    expect(cartTotals(cartStore.get())).toEqual({ subtotal: 120, farms: 2, delivery: 40, total: 160 })
  })
})

describe('search', () => {
  it('builds the query the catalog expects', () => {
    const q = new URLSearchParams(searchQuery({ lat: 21.2, lng: 81.3, radiusKm: 25, organic: true, sort: 'price' }, 'abc'))
    expect(Object.fromEntries(q)).toMatchObject({ lat: '21.2', lng: '81.3', radius_km: '25', organic: 'true', sort: 'price', cursor: 'abc' })
    expect(Number(q.get('limit'))).toBeLessThanOrEqual(50)
  })

  it('filters by category and by words in the crop, farm or village', () => {
    const crops = [{ id: 'tomato', name: 'Tomato', category: 'vegetable', defaultUnit: 'kg' as const }, { id: 'wheat', name: 'Wheat', category: 'grain', defaultUnit: 'quintal' as const }]
    const items = [produce({}), produce({ id: 'l2', cropId: 'wheat', cropName: 'Wheat', variety: null, farmName: 'Tandon Grains' })]
    expect(refine(items, { category: 'grain', text: '', crops }).map((p) => p.id)).toEqual(['l2'])
    expect(refine(items, { category: 'all', text: 'patan', crops }).map((p) => p.id)).toEqual(['l1', 'l2'])
    expect(refine(items, { category: 'all', text: 'tandon', crops }).map((p) => p.id)).toEqual(['l2'])
  })
})

describe('freshness and steps', () => {
  const now = new Date('2026-11-22T12:00:00').getTime()
  it('labels the age of the harvest', () => {
    expect(freshness('2026-11-22', now).label).toBe('Harvested today')
    expect(freshness('2026-11-21', now).label).toBe('Harvested yesterday')
    expect(freshness('2026-11-10', now)).toMatchObject({ tone: 'neutral', days: 12 })
  })
  it('sells weight in half units and countables whole', () => {
    expect(stepOf('kg')).toBe(0.5)
    expect(stepOf('dozen')).toBe(1)
  })
  it('places statuses on the journey', () => {
    expect(journeyStep('CONFIRMED')).toBe(1)
    expect(journeyStep('COMPLETED')).toBe(7)
  })
})

describe('addressPayload', () => {
  const ok = { line1: '12 Test Road', line2: '', city: 'Bhilai', pincode: '490006', phone: '+91 98765 43210', lat: '21.2', lng: '81.3' }
  it('builds the order service body, longitude first', () => {
    expect(addressPayload(ok)).toEqual({ line1: '12 Test Road', city: 'Bhilai', pincode: '490006', contactPhone: '+919876543210', location: { type: 'Point', coordinates: [81.3, 21.2] } })
  })
  it('explains what is wrong', () => {
    expect(addressPayload({ ...ok, pincode: '49' })).toMatch(/pincode/)
    expect(addressPayload({ ...ok, line1: '' })).toMatch(/street/)
    expect(addressPayload({ ...ok, lat: '' })).toMatch(/location/)
  })
})
