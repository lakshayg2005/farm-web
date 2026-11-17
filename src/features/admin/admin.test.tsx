import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { session } from '@/features/auth/session'
import { jsonResponse, makeUser, mockApi, renderAt, tokens } from '@/test/auth'
import { passRate, totalSavedKm } from './admin'

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
  it('says so when the logistics service is not there yet', async () => {
    mockApi({ 'POST /identity/refresh': adminLogin })
    renderAt('/admin/pooling')
    await screen.findByText(/Pooling is not available yet/)
  })

  it('shows pools and the kilometres saved', async () => {
    mockApi({
      'POST /identity/refresh': adminLogin,
      'GET /logistics/pools': () =>
        jsonResponse([{ id: 'p1', date: '2026-11-18', partnerId: null, status: 'ASSIGNED', totalKm: 12, savedKm: 7.5, route: null, stops: [] }]),
    })
    renderAt('/admin/pooling')
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('1 pools · 7.5 km saved'))
  })
})
