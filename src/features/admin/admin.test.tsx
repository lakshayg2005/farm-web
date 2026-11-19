import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { session } from '@/features/auth/session'
import { jsonResponse, makeUser, mockApi, renderAt, tokens } from '@/test/auth'
import { orderedStops, passRate, poolSummary, toPool, totalSavedKm, type Pool } from './admin'

const FARMER = { ...makeUser(['farmer']), id: 'f1', name: 'Ravi Patel', phone: '+919811111111', createdAt: '2026-11-10T08:00:00Z' }
const adminLogin = () => jsonResponse(tokens(['admin']))

beforeEach(() => {
  session.clear()
  session.refreshToken = 'refresh-1'
})

describe('numbers', () => {
  it('passRate counts only finished inspections', () => {
    expect(passRate([])).toBeNull()
    expect(
      passRate([
        { id: '1', status: 'REPORTED', result: 'PASS', grade: 'A' },
        { id: '2', status: 'REPORTED', result: 'FAIL', grade: 'C' },
        { id: '3', status: 'PENDING', result: null, grade: null },
      ]),
    ).toBe(50)
  })
  it('totalSavedKm adds the pools up', () => {
    const pool = { id: 'p', date: 'd', partnerId: null, status: 'ASSIGNED', totalKm: 9, route: null, stops: [] }
    expect(totalSavedKm([{ ...pool, savedKm: 4.25 }, { ...pool, savedKm: 2 }])).toBe(6.3)
  })
})

describe('farmer verification', () => {
  it('lists waiting farmers and verifies one', async () => {
    let waiting = [FARMER]
    const calls = mockApi({
      'POST /identity/refresh': adminLogin,
      'GET /identity/users': () => jsonResponse({ items: waiting, nextCursor: null }),
      'POST /identity/users/f1/verify-farmer': () => {
        waiting = []
        return jsonResponse({ ...FARMER, farmerVerified: true })
      },
    })
    renderAt('/admin/verification')
    await userEvent.click(await screen.findByRole('button', { name: 'Verify Ravi Patel' }))
    await screen.findByText(/No farmers are waiting/)
    expect(calls.some((c) => c.key === 'POST /identity/users/f1/verify-farmer')).toBe(true)
  })
})

describe('pooling', () => {
  it('says so when the logistics service is down', async () => {
    mockApi({
      'POST /identity/refresh': adminLogin,
      'GET /logistics/pools': () => jsonResponse({ error: { code: 'unavailable', message: 'down' } }, 503),
    })
    renderAt('/admin/pooling')
    await screen.findByText(/Pooling is not available yet/)
  })

  it('shows the day\'s totals, and a pool\'s stops in driving order when chosen', async () => {
    mockApi({
      'POST /identity/refresh': adminLogin,
      'GET /logistics/pools': () => jsonResponse([POOL_OUT, { ...POOL_OUT, id: 'p2', totalKm: 6, kmSaved: 0, stops: [] }]),
    })
    renderAt('/admin/pooling')
    const summary = await screen.findByLabelText('Pooling summary')
    expect(summary).toHaveTextContent('Pools2')
    expect(summary).toHaveTextContent('Deliveries2')
    expect(summary).toHaveTextContent('Route distance18 km')
    expect(summary).toHaveTextContent('Distance saved7.5 km')
    expect(summary).toHaveTextContent('29% less than separate trips')

    await userEvent.click(screen.getByRole('button', { name: /Pool 1/ }))
    const stops = within(screen.getByRole('list', { name: 'Stops in order' })).getAllByRole('listitem')
    expect(stops.map((li) => li.textContent?.slice(0, 10))).toEqual(['1. Pick up', '2. Deliver', '3. Deliver'])
  })

  it('runs pooling for the chosen date with the date in the query', async () => {
    const calls = mockApi({
      'POST /identity/refresh': adminLogin,
      'GET /logistics/pools': () => jsonResponse([]),
      'POST /logistics/pools/run': () => jsonResponse({ poolsCreated: 1, pools: [POOL_OUT] }),
    })
    const fetchMock = vi.mocked(fetch)
    renderAt('/admin/pooling')
    expect(await screen.findByText(/No pools for this date yet/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Run pooling' }))
    await waitFor(() => expect(calls.some((c) => c.key === 'POST /logistics/pools/run')).toBe(true))
    const runUrl = fetchMock.mock.calls.map(([u]) => String(u)).find((u) => u.includes('/pools/run'))
    expect(runUrl).toMatch(/\/logistics\/pools\/run\?pool_date=\d{4}-\d{2}-\d{2}$/)
    expect(await screen.findByRole('list', { name: 'Stops in order' })).toBeInTheDocument()
  })
})

const POOL: Pool = {
  id: 'p1',
  date: '2026-11-18',
  partnerId: null,
  status: 'ASSIGNED',
  totalKm: 12,
  savedKm: 7.5,
  route: null,
  stops: [
    { orderId: 'order-bbbbbbbb', kind: 'DROP', sequence: 3, eta: null, location: { type: 'Point', coordinates: [81.7, 21.3] } },
    { orderId: 'order-aaaaaaaa', kind: 'PICKUP', sequence: 1, eta: '2026-11-18T03:30:00Z', location: { type: 'Point', coordinates: [81.6, 21.2] } },
    { orderId: 'order-aaaaaaaa', kind: 'DROP', sequence: 2, eta: null, location: { type: 'Point', coordinates: [81.65, 21.25] } },
  ],
}

/** The same pool as logistics sends it (PoolOut): flat lat/lng stops, kmSaved, no route line. */
const stopOut = (orderId: string, stopType: 'PICKUP' | 'DROP', seq: number, lng: number, lat: number, eta: string | null = null) => ({
  id: `s${seq}`, poolId: 'p1', orderId, stopType, seq, lat, lng, eta, status: 'PENDING', otpVerified: false,
})
const POOL_OUT = {
  id: 'p1',
  poolDate: '2026-11-18',
  partnerId: null,
  status: 'ASSIGNED',
  totalKm: 12,
  kmSaved: 7.5,
  createdAt: '2026-11-17T20:00:00Z',
  assignedAt: null,
  stops: [
    stopOut('order-bbbbbbbb', 'DROP', 3, 81.7, 21.3),
    stopOut('order-aaaaaaaa', 'PICKUP', 1, 81.6, 21.2, '2026-11-18T03:30:00Z'),
    stopOut('order-aaaaaaaa', 'DROP', 2, 81.65, 21.25),
  ],
}

describe('pool numbers', () => {
  it('maps the logistics contract onto the page shape, with a route through the stops', () => {
    const pool = toPool(POOL_OUT as Parameters<typeof toPool>[0])
    expect({ ...pool, route: null }).toEqual({ ...POOL, stops: orderedStops(POOL) })
    expect(pool.route?.coordinates).toEqual([[81.6, 21.2], [81.65, 21.25], [81.7, 21.3]])
  })

  it('sums the day and compares with separate trips', () => {
    expect(poolSummary([POOL])).toEqual({ pools: 1, deliveries: 2, routeKm: 12, savedKm: 7.5, savedPct: 38 })
    expect(poolSummary([])).toEqual({ pools: 0, deliveries: 0, routeKm: 0, savedKm: 0, savedPct: 0 })
  })

  it('orders stops by sequence', () => {
    expect(orderedStops(POOL).map((s) => s.sequence)).toEqual([1, 2, 3])
  })
})
