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
        status = 'PACKED'
        return jsonResponse({ ...order('o1', 'PACKED', 300), items: [], events: [], deliveryDate: null })
      },
    })
    renderAt('/farmer/orders')
    await userEvent.click(await screen.findByRole('button', { name: 'Mark packed' }))
    await waitFor(() => expect(calls.some((c) => c.key === 'POST /order/orders/o1/pack')).toBe(true))
    await userEvent.click(await screen.findByRole('tab', { name: /In progress \(1\)/ }))
    expect(await screen.findByText(/Packed: waiting for quality check/)).toBeInTheDocument()
    expect(calls.find((c) => c.key === 'GET /order/orders')).toBeDefined()
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
