import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { session } from '@/features/auth/session'
import { jsonResponse, mockApi, renderAt, signedInAs } from '@/test/auth'
import { searchQuery } from './land'

const PLOT = {
  type: 'Feature',
  id: 'plot-1',
  geometry: { type: 'Polygon', coordinates: [[[79, 22], [79.01, 22], [79.01, 22.01], [79, 22]]] },
  properties: {
    title: 'Riverside plot',
    areaAcres: 2.5,
    farmerId: 'f1',
    plotSeasonId: 'ps-1',
    season: 'Kharif',
    startDate: '2026-06-15',
    endDate: '2026-10-30',
    price: 40,
    allowedCrops: ['tomato', 'onion'],
  },
}
const CROPS = [
  { id: 'tomato', name: 'Tomato', category: 'vegetable', defaultUnit: 'kg' },
  { id: 'onion', name: 'Onion', category: 'vegetable', defaultUnit: 'kg' },
]
const RESERVATION = {
  id: 'r1',
  plotSeasonId: 'ps-1',
  customerId: 'u1',
  farmerId: 'f1',
  cropId: 'tomato',
  expectedQtyKg: 100,
  deposit: null,
  total: 4000,
  status: 'PENDING',
  expiresAt: '2026-11-19T10:00:00Z',
}

beforeEach(() => {
  session.clear()
})

describe('searchQuery', () => {
  it('uses the visible map area and the filters', () => {
    const q = new URLSearchParams(searchQuery({ west: 1, south: 2, east: 3, north: 4 }, { season: 'Rabi', crop: 'onion' }))
    expect(Object.fromEntries(q)).toMatchObject({ west: '1', south: '2', east: '3', north: '4', season: 'Rabi', crop: 'onion' })
  })
  it('falls back to a wide radius search without a map', () => {
    const q = new URLSearchParams(searchQuery(null, {}))
    expect(q.get('radius_km')).toBe('200')
    expect(q.has('west')).toBe(false)
  })
})

describe('find land', () => {
  it('lists plots and sends a reservation request for the chosen crop and quantity', async () => {
    signedInAs(['customer'])
    const calls = mockApi({
      'POST /identity/refresh': () => jsonResponse({ accessToken: 'a', refreshToken: 'r', expiresIn: 900, user: { id: 'u1', name: 'A', phone: '+919876543210', email: null, roles: ['customer'], phoneVerified: true, farmerVerified: false } }),
      'GET /catalog/crops': () => jsonResponse(CROPS),
      'GET /land/plots/search': () => jsonResponse({ type: 'FeatureCollection', features: [PLOT] }),
      'POST /land/reservations': () => jsonResponse(RESERVATION, 201),
    })
    renderAt('/customer/plots')
    await userEvent.click(await screen.findByRole('button', { name: /Riverside plot/ }))
    await userEvent.selectOptions(screen.getByLabelText('Crop to grow'), 'onion')
    await userEvent.type(screen.getByLabelText('Expected harvest (kg)'), '50')
    expect(screen.getByText('₹2,000')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Request this plot' }))

    expect(await screen.findByText('Request sent')).toBeInTheDocument()
    const post = calls.find((c) => c.key === 'POST /land/reservations')!
    expect(post.body).toEqual({ plotSeasonId: 'ps-1', cropId: 'onion', expectedQtyKg: 50 })
  })

  it('reserves the season that was clicked when a plot has several seasons', async () => {
    signedInAs(['customer'])
    const rabi = { ...PLOT, properties: { ...PLOT.properties, plotSeasonId: 'ps-2', season: 'Rabi', price: 25 } }
    const calls = mockApi({
      'POST /identity/refresh': () => jsonResponse({ accessToken: 'a', refreshToken: 'r', expiresIn: 900, user: { id: 'u1', name: 'A', phone: '+919876543210', email: null, roles: ['customer'], phoneVerified: true, farmerVerified: false } }),
      'GET /catalog/crops': () => jsonResponse(CROPS),
      // The same plot id comes back once per season.
      'GET /land/plots/search': () => jsonResponse({ type: 'FeatureCollection', features: [PLOT, rabi] }),
      'POST /land/reservations': () => jsonResponse({ ...RESERVATION, plotSeasonId: 'ps-2' }, 201),
    })
    renderAt('/customer/plots')
    await userEvent.click(await screen.findByRole('button', { name: /Rabi/ }))
    await userEvent.type(screen.getByLabelText('Expected harvest (kg)'), '10')
    await userEvent.click(screen.getByRole('button', { name: 'Request this plot' }))
    await screen.findByText('Request sent')
    expect(calls.find((c) => c.key === 'POST /land/reservations')!.body).toMatchObject({ plotSeasonId: 'ps-2' })
  })

  it('shows the server message when the plot was taken meanwhile', async () => {
    signedInAs(['customer'])
    mockApi({
      'POST /identity/refresh': () => jsonResponse({ accessToken: 'a', refreshToken: 'r', expiresIn: 900, user: { id: 'u1', name: 'A', phone: '+919876543210', email: null, roles: ['customer'], phoneVerified: true, farmerVerified: false } }),
      'GET /catalog/crops': () => jsonResponse(CROPS),
      'GET /land/plots/search': () => jsonResponse({ type: 'FeatureCollection', features: [PLOT] }),
      'POST /land/reservations': () => jsonResponse({ error: { code: 'PLOT_SEASON_ALREADY_RESERVED', message: 'This plot-season already has a live reservation' } }, 409),
    })
    renderAt('/customer/plots')
    await userEvent.click(await screen.findByRole('button', { name: /Riverside plot/ }))
    await userEvent.type(screen.getByLabelText('Expected harvest (kg)'), '50')
    await userEvent.click(screen.getByRole('button', { name: 'Request this plot' }))
    expect(await screen.findByText('This plot-season already has a live reservation')).toBeInTheDocument()
  })

  it('says so when no plots are open', async () => {
    signedInAs(['customer'])
    mockApi({
      'POST /identity/refresh': () => jsonResponse({ accessToken: 'a', refreshToken: 'r', expiresIn: 900, user: { id: 'u1', name: 'A', phone: '+919876543210', email: null, roles: ['customer'], phoneVerified: true, farmerVerified: false } }),
      'GET /catalog/crops': () => jsonResponse(CROPS),
      'GET /land/plots/search': () => jsonResponse({ type: 'FeatureCollection', features: [] }),
    })
    renderAt('/customer/plots')
    expect(await screen.findByText(/No open plots here/)).toBeInTheDocument()
  })
})

function customerSession(extra: Record<string, (b: unknown) => Response>) {
  signedInAs(['customer'])
  return mockApi({
    'POST /identity/refresh': () => jsonResponse({ accessToken: 'a', refreshToken: 'r', expiresIn: 900, user: { id: 'u1', name: 'A', phone: '+919876543210', email: null, roles: ['customer'], phoneVerified: true, farmerVerified: false } }),
    'GET /catalog/crops': () => jsonResponse(CROPS),
    ...extra,
  })
}

describe('my reservations', () => {
  it('lets the customer pay the deposit after the farmer accepts', async () => {
    const calls = customerSession({
      'GET /land/reservations/mine': () => jsonResponse([{ ...RESERVATION, status: 'ACCEPTED', deposit: 800 }]),
      'POST /order/orders/payments/intent': () => jsonResponse({ id: 'pi1', amount: 800, status: 'SUCCEEDED' }, 201),
    })
    renderAt('/customer/reservations')
    await userEvent.click(await screen.findByRole('button', { name: 'Pay deposit ₹800' }))
    await waitFor(() => expect(calls.some((c) => c.key === 'POST /order/orders/payments/intent')).toBe(true))
    expect(calls.find((c) => c.key === 'POST /order/orders/payments/intent')!.body).toEqual({ amount: 800, kind: 'DEPOSIT', referenceId: 'r1' })
  })

  it('shows the farmer’s crop updates for a growing crop', async () => {
    customerSession({
      'GET /land/reservations/mine': () => jsonResponse([{ ...RESERVATION, status: 'ACTIVE', deposit: 800 }]),
      'GET /land/reservations/r1/updates': () =>
        jsonResponse([
          { id: 'u1', stage: 'SOWN', note: 'Seeds in the ground', mediaIds: [], createdAt: '2026-07-01T08:00:00Z' },
          { id: 'u2', stage: 'FLOWERING', note: null, mediaIds: ['m1', 'm2'], createdAt: '2026-08-20T08:00:00Z' },
        ]),
    })
    renderAt('/customer/reservations')
    const timeline = await screen.findByRole('list', { name: 'Crop updates' })
    expect(within(timeline).getByText('Seeds in the ground')).toBeInTheDocument()
    expect(within(timeline).getByText('2 photo(s) attached')).toBeInTheDocument()
  })

  it('sends a buy-back choice without an address', async () => {
    const calls = customerSession({
      'GET /land/reservations/mine': () => jsonResponse([{ ...RESERVATION, status: 'HARVEST_READY', deposit: 800 }]),
      'GET /land/reservations/r1/updates': () => jsonResponse([]),
      'POST /order/orders/harvest': () => jsonResponse({ id: 'o1' }, 201),
    })
    renderAt('/customer/reservations')
    await userEvent.click(await screen.findByLabelText(/Let the farmer buy it back/))
    await userEvent.click(screen.getByRole('button', { name: 'Confirm my choice' }))
    await waitFor(() => expect(calls.some((c) => c.key === 'POST /order/orders/harvest')).toBe(true))
    expect(calls.find((c) => c.key === 'POST /order/orders/harvest')!.body).toEqual({ reservationId: 'r1', option: 'BUYBACK' })
  })

  it('asks for a valid address before choosing delivery', async () => {
    const calls = customerSession({
      'GET /land/reservations/mine': () => jsonResponse([{ ...RESERVATION, status: 'HARVEST_READY' }]),
      'GET /land/reservations/r1/updates': () => jsonResponse([]),
    })
    renderAt('/customer/reservations')
    await userEvent.click(await screen.findByRole('button', { name: 'Confirm my choice' }))
    expect(screen.getByText('Enter the delivery address.')).toBeInTheDocument()
    expect(calls.some((c) => c.key === 'POST /order/orders/harvest')).toBe(false)
  })

  it('cancels a pending request', async () => {
    const calls = customerSession({
      'GET /land/reservations/mine': () => jsonResponse([RESERVATION]),
      'POST /land/reservations/r1/cancel': () => jsonResponse({ ...RESERVATION, status: 'CANCELLED' }),
    })
    renderAt('/customer/reservations')
    await userEvent.click(await screen.findByRole('button', { name: 'Cancel this reservation' }))
    await waitFor(() => expect(calls.some((c) => c.key === 'POST /land/reservations/r1/cancel')).toBe(true))
  })
})
