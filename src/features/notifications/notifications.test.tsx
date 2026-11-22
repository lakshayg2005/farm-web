import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { session } from '@/features/auth/session'
import { jsonResponse, mockApi, renderAt, tokens } from '@/test/auth'

const item = (id: string, title: string, readAt: string | null) => ({
  id, userId: 'u1', type: 'ORDER_CONFIRMED', title, body: 'Body of ' + title, payload: {}, readAt, createdAt: '2026-11-21T10:00:00Z',
})

beforeEach(() => {
  session.clear()
  session.refreshToken = 'refresh-1'
})

describe('notifications inbox', () => {
  it('marks unread items, marks one as read, and shows the badge', async () => {
    let read = false
    const calls = mockApi({
      'POST /identity/refresh': () => jsonResponse(tokens(['farmer'])),
      'GET /notification/notifications/unread-count': () => jsonResponse({ count: read ? 0 : 2 }),
      'GET /notification/notifications': () =>
        jsonResponse({ items: [item('n1', 'New order', read ? '2026-11-21T11:00:00Z' : null), item('n2', 'Paid', '2026-11-20T11:00:00Z')], unreadCount: read ? 0 : 1, nextCursor: null }),
      'POST /notification/notifications/n1/read': () => {
        read = true
        return jsonResponse({})
      },
    })
    renderAt('/farmer/notifications')
    const row = (await screen.findByText('New order')).closest('li')!
    expect(within(row).getByText(/Unread/)).toBeInTheDocument()
    expect(await screen.findAllByText('unread')).not.toHaveLength(0)
    await userEvent.click(within(row).getByRole('button', { name: 'Mark read' }))
    await waitFor(() => expect(calls.some((c) => c.key === 'POST /notification/notifications/n1/read')).toBe(true))
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Mark read' })).not.toBeInTheDocument())
  })

  it('says so when there is nothing', async () => {
    mockApi({
      'POST /identity/refresh': () => jsonResponse(tokens(['customer'])),
      'GET /notification/notifications': () => jsonResponse({ items: [], unreadCount: 0, nextCursor: null }),
    })
    renderAt('/customer/notifications')
    expect(await screen.findByText(/Nothing yet/)).toBeInTheDocument()
  })
})

describe('farmer earnings', () => {
  it('groups payouts by month and shows the total', async () => {
    mockApi({
      'POST /identity/refresh': () => jsonResponse(tokens(['farmer'])),
      'GET /order/orders/payouts': () =>
        jsonResponse({ total: 300, items: [{ orderId: 'aaaaaaaa-1', amount: 100, paidAt: '2026-10-02T00:00:00Z' }, { orderId: 'bbbbbbbb-2', amount: 200, paidAt: '2026-09-02T00:00:00Z' }] }),
      'GET /order/orders': () => jsonResponse({ items: [], nextCursor: null }),
    })
    renderAt('/farmer/earnings')
    expect(await screen.findByRole('region', { name: 'October 2026' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'September 2026' })).toBeInTheDocument()
    expect(screen.getByText('₹300')).toBeInTheDocument()
  })
})
