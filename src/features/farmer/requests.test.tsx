import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { session } from '@/features/auth/session'
import { jsonResponse, mockApi, renderAt, tokens } from '@/test/auth'
import { groupOf, timeLeft, windowLeft } from './reservations'

const NOW = Date.parse('2026-11-17T10:00:00Z')
const R = (o: Record<string, unknown>) => ({
  id: 'r1',
  plotSeasonId: 'ps-1',
  customerId: 'c1',
  farmerId: 'u1',
  cropId: 'tomato',
  expectedQtyKg: 100,
  deposit: null,
  total: 4000,
  status: 'PENDING',
  expiresAt: '2026-11-18T22:00:00Z',
  ...o,
})

function farmer(handlers: Record<string, (body: unknown) => Response>) {
  session.refreshToken = 'refresh-1'
  return mockApi({
    'POST /identity/refresh': () => jsonResponse(tokens(['farmer'])),
    'GET /catalog/crops': () => jsonResponse([{ id: 'tomato', name: 'Tomato', category: 'vegetable', defaultUnit: 'kg' }, { id: 'onion', name: 'Onion', category: 'vegetable', defaultUnit: 'kg' }]),
    'GET /land/plots/mine': () => jsonResponse([{ id: 'p1', title: 'Riverside plot', areaAcres: 2.5, status: 'ACTIVE' }]),
    'GET /land/plots/p1/seasons': () =>
      jsonResponse([{ id: 'ps-1', plotId: 'p1', season: 'Rabi', startDate: '2026-11-20', endDate: '2027-03-15', price: 40, allowedCrops: ['tomato'] }]),
    ...handlers,
  })
}

beforeEach(() => {
  session.clear()
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(NOW)
})
afterEach(() => vi.useRealTimers())

describe('request countdown', () => {
  it('counts down the 48 hour window', () => {
    expect(timeLeft('2026-11-18T22:00:00Z', NOW)).toBe('1 day 12 h left')
    expect(timeLeft('2026-11-17T15:12:30Z', NOW)).toBe('5 h 12 min left')
    expect(timeLeft('2026-11-17T10:09:00Z', NOW)).toBe('9 min left')
    expect(timeLeft('2026-11-17T09:00:00Z', NOW)).toBe('Expired')
    expect(windowLeft('2026-11-18T22:00:00Z', NOW)).toBeCloseTo(0.75)
  })

  it('treats a pending request past its deadline as expired', () => {
    expect(groupOf(R({}) as never, NOW)).toBe('waiting')
    expect(groupOf(R({ expiresAt: '2026-11-17T09:00:00Z' }) as never, NOW)).toBe('past')
    expect(groupOf(R({ status: 'ACTIVE' }) as never, NOW)).toBe('agreement')
    expect(groupOf(R({ status: 'REJECTED' }) as never, NOW)).toBe('past')
  })
})

describe('farmer reservation requests', () => {
  it('shows a pending request with its plot, season and time left, and accepts it', async () => {
    const calls = farmer({
      'GET /land/reservations/mine': () => jsonResponse([R({})]),
      'POST /land/reservations/r1/accept': () => jsonResponse(R({ status: 'ACCEPTED', deposit: 800 })),
    })
    renderAt('/farmer/reservations')
    const waiting = await screen.findByRole('region', { name: 'Waiting for your answer' })
    expect(within(waiting).getByText('Tomato, 100 kg')).toBeInTheDocument()
    expect(await within(waiting).findByText('Riverside plot, 2.5 acres')).toBeInTheDocument()
    expect(within(waiting).getByText(/Rabi season/)).toBeInTheDocument()
    expect(within(waiting).getByText(/1 day 12 h left to answer/)).toBeInTheDocument()

    await userEvent.click(within(waiting).getByRole('button', { name: 'Accept' }))
    await waitFor(() => expect(calls.some((c) => c.key === 'POST /land/reservations/r1/accept')).toBe(true))
    const agreements = screen.getByRole('region', { name: 'Agreements' })
    expect(await within(agreements).findByText('Deposit due')).toBeInTheDocument()
    expect(within(agreements).getByText('₹800')).toBeInTheDocument()
    expect(within(waiting).getByText('No requests need an answer right now.')).toBeInTheDocument()
  })

  it('asks before declining', async () => {
    const calls = farmer({
      'GET /land/reservations/mine': () => jsonResponse([R({})]),
      'POST /land/reservations/r1/reject': () => jsonResponse(R({ status: 'REJECTED' })),
    })
    renderAt('/farmer/reservations')
    await userEvent.click(await screen.findByRole('button', { name: 'Decline' }))
    expect(calls.some((c) => c.key === 'POST /land/reservations/r1/reject')).toBe(false)
    expect(screen.getByText(/Decline this request\?/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Decline' }))
    await waitFor(() => expect(calls.some((c) => c.key === 'POST /land/reservations/r1/reject')).toBe(true))
    expect(await screen.findByText('Past requests (1)')).toBeInTheDocument()
  })

  it('shows the server message when the request expired meanwhile', async () => {
    farmer({
      'GET /land/reservations/mine': () => jsonResponse([R({})]),
      'POST /land/reservations/r1/accept': () =>
        jsonResponse({ error: { code: 'RESERVATION_NOT_PENDING', message: 'Only an unexpired pending reservation can be accepted' } }, 409),
    })
    renderAt('/farmer/reservations')
    await userEvent.click(await screen.findByRole('button', { name: 'Accept' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Only an unexpired pending reservation can be accepted')
  })

  it('lists agreements with their next step and moves expired requests to the past', async () => {
    farmer({
      'GET /land/reservations/mine': () =>
        jsonResponse([
          R({ id: 'r2', status: 'ACTIVE', deposit: 800 }),
          R({ id: 'r3', cropId: 'onion', expiresAt: '2026-11-16T10:00:00Z' }),
        ]),
    })
    renderAt('/farmer/reservations')
    const agreements = await screen.findByRole('region', { name: 'Agreements' })
    expect(within(agreements).getByText('Growing')).toBeInTheDocument()
    expect(within(agreements).getByRole('link', { name: 'Open crop updates' })).toHaveAttribute('href', '/farmer/crops')
    expect(screen.getByText('Past requests (1)')).toBeInTheDocument()
    expect(screen.getByText('Expired')).toBeInTheDocument()
  })

  it('points to plots when there are no requests', async () => {
    farmer({ 'GET /land/reservations/mine': () => jsonResponse([]) })
    renderAt('/farmer/reservations')
    expect(await screen.findByText('No reservation requests yet')).toBeInTheDocument()
  })
})
