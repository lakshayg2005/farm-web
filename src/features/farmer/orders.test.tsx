import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { session } from '@/features/auth/session'
import { jsonResponse, mockApi, renderAt, tokens } from '@/test/auth'
import { earnings, inTab, type OrderSummary } from './orders'

const order = (id: string, status: OrderSummary['status'], total: number): OrderSummary => ({
  id, orderType: 'PRODUCE', status, itemCount: 2, total, createdAt: '2026-11-16T09:00:00Z',
})

beforeEach(() => {
  session.clear()
  session.refreshToken = 'refresh-1'
})

describe('earnings', () => {
  it('splits delivered money from money still on its way', () => {
    const list = [order('1', 'COMPLETED', 500), order('2', 'DELIVERED', 250.5), order('3', 'PACKED', 100), order('4', 'CANCELLED', 900), order('5', 'PLACED', 70)]
    expect(earnings(list)).toEqual({ earned: 750.5, pending: 100 })
  })
  it('groups statuses into tabs', () => {
    expect(inTab(order('1', 'CONFIRMED', 1), 'new')).toBe(true)
    expect(inTab(order('1', 'POOLED', 1), 'progress')).toBe(true)
    expect(inTab(order('1', 'CANCELLED', 1), 'done')).toBe(false)
  })
})

describe('farmer orders page', () => {
  it('lists orders to pack and marks one packed', async () => {
    let status: OrderSummary['status'] = 'CONFIRMED'
    const calls = mockApi({
      'POST /identity/refresh': () => jsonResponse(tokens(['farmer'])),
      'GET /order/orders': () => jsonResponse({ items: [order('o1', status, 300)], nextCursor: null }),
      'POST /order/orders/o1/pack': () => {
        status = 'READY_FOR_DISPATCH' // packing hands the order to logistics: no quality check
        return jsonResponse({ ...order('o1', 'READY_FOR_DISPATCH', 300), items: [], events: [], deliveryDate: null })
      },
    })
    renderAt('/farmer/orders')
    await userEvent.click(await screen.findByRole('button', { name: 'Mark packed' }))
    await waitFor(() => expect(calls.some((c) => c.key === 'POST /order/orders/o1/pack')).toBe(true))
    await userEvent.click(await screen.findByRole('tab', { name: /In progress \(1\)/ }))
    expect(await screen.findByText(/Packed: waiting for a delivery partner/)).toBeInTheDocument()
    expect(calls.find((c) => c.key === 'GET /order/orders')).toBeDefined()
  })

  it('shows what has been paid out on the earnings page', async () => {
    mockApi({
      'POST /identity/refresh': () => jsonResponse(tokens(['farmer'])),
      'GET /order/orders': () => jsonResponse({ items: [order('o1', 'COMPLETED', 300)], nextCursor: null }),
      'GET /order/orders/payouts': () =>
        jsonResponse({ items: [{ orderId: 'abcdef12-0000', amount: 285, currency: 'INR', paidAt: '2026-11-18T10:00:00Z' }], total: 285 }),
    })
    renderAt('/farmer/earnings')
    expect(await screen.findByText('Paid out, all time')).toBeInTheDocument()
    expect(await screen.findByText(/abcdef12/)).toBeInTheDocument()
    expect(screen.getAllByText('₹285').length).toBeGreaterThan(0)
  })

  it('says so when payouts cannot be loaded, instead of showing a made-up total', async () => {
    mockApi({
      'POST /identity/refresh': () => jsonResponse(tokens(['farmer'])),
      'GET /order/orders': () => jsonResponse({ items: [], nextCursor: null }),
      'GET /order/orders/payouts': () => jsonResponse({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } }, 500),
    })
    renderAt('/farmer/earnings')
    expect(await screen.findByText(/Could not load your earnings/)).toBeInTheDocument()
  })

  it('shows the items and timeline in details', async () => {
    mockApi({
      'POST /identity/refresh': () => jsonResponse(tokens(['farmer'])),
      'GET /order/orders': () => jsonResponse({ items: [order('o1', 'CONFIRMED', 300)], nextCursor: null }),
      'GET /order/orders/o1': () =>
        jsonResponse({
          ...order('o1', 'CONFIRMED', 300),
          deliveryDate: null,
          items: [{ name: 'Tomato', unit: 'kg', qty: 5, unitPrice: 60, lineTotal: 300 }],
          events: [{ status: 'PLACED', occurredAt: '2026-11-16T09:00:00Z', note: null }],
        }),
    })
    renderAt('/farmer/orders')
    await userEvent.click(await screen.findByRole('button', { name: 'Details' }))
    expect(await screen.findByText(/Tomato: 5 kg/)).toBeInTheDocument()
  })
})
