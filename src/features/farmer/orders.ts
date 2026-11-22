import { api } from '@/api/http'
import type { OrderComponents } from '@/api/generated'

/** Straight from the generated order contract, so a new status in the backend fails the build here. */
export type OrderStatus = OrderComponents['schemas']['OrderStatus']

export interface OrderSummary {
  id: string
  orderType: 'PRODUCE' | 'HARVEST'
  status: OrderStatus
  itemCount: number
  total: number
  createdAt: string
}

export interface OrderItem {
  name: string
  unit: string
  qty: number
  unitPrice: number
  lineTotal: number
}

export interface OrderEvent {
  status: OrderStatus
  occurredAt: string
  note: string | null
}

export interface OrderDetail extends OrderSummary {
  items: OrderItem[]
  events: OrderEvent[]
  deliveryDate: string | null
}

/** One paid-out order, from GET /order/orders/payouts. */
export interface Payout {
  orderId: string
  amount: number
  currency?: string
  paidAt: string
}

export const ordersApi = {
  payouts: () => api<{ items: Payout[]; total: number }>('/order/orders/payouts?limit=500'),
  list: () => api<{ items: OrderSummary[]; nextCursor: string | null }>('/order/orders?role=farmer&limit=100'),
  get: (id: string) => api<OrderDetail>(`/order/orders/${id}`),
  pack: (id: string) => api<OrderDetail>(`/order/orders/${id}/pack`, { method: 'POST' }),
  cancel: (id: string) => api<OrderDetail>(`/order/orders/${id}/cancel`, { method: 'POST', body: {} }),
}

/** The tabs of the orders page, each a set of statuses. */
export const TABS = [
  { id: 'new', label: 'To pack', statuses: ['PLACED', 'CONFIRMED'] },
  { id: 'progress', label: 'In progress', statuses: ['PACKED', 'QC_PASSED', 'READY_FOR_DISPATCH', 'POOLED', 'IN_TRANSIT'] },
  { id: 'done', label: 'Delivered', statuses: ['DELIVERED', 'COMPLETED'] },
  { id: 'cancelled', label: 'Cancelled', statuses: ['CANCELLED'] },
] as const

export type TabId = (typeof TABS)[number]['id']

export const STATUS_TEXT: Record<OrderStatus, string> = {
  PLACED: 'Waiting for payment',
  CONFIRMED: 'Ready to pack',
  PACKED: 'Packed: waiting for quality check',
  QC_PASSED: 'Quality check passed',
  READY_FOR_DISPATCH: 'Ready for pickup',
  POOLED: 'Assigned to a delivery route',
  IN_TRANSIT: 'On its way',
  DELIVERED: 'Delivered',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
}

/** The eight stages shown on the status rail; COMPLETED shares the last one with DELIVERED. */
export const STAGES = ['Placed', 'Confirmed', 'Packed', 'Graded', 'Ready for dispatch', 'Pooled', 'In transit', 'Delivered'] as const

/** How many stages are done: 0 for a cancelled order, otherwise the status' position. */
export function stageOf(status: OrderStatus): number {
  const order: Partial<Record<OrderStatus, number>> = {
    PLACED: 1, CONFIRMED: 2, PACKED: 3, QC_PASSED: 4, READY_FOR_DISPATCH: 5, POOLED: 6, IN_TRANSIT: 7, DELIVERED: 8, COMPLETED: 8,
  }
  return order[status] ?? 0
}

export const inTab = (order: { status: OrderStatus }, tab: TabId) =>
  TABS.find((t) => t.id === tab)!.statuses.some((s) => s === order.status)

/**
 * Money still on its way, worked out from the farmer's own orders. What has been paid out comes from
 * the payouts endpoint, which is the source of truth for `earned`.
 */
export function earnings(orders: OrderSummary[]) {
  const sum = (statuses: OrderStatus[]) =>
    Math.round(orders.filter((o) => statuses.includes(o.status)).reduce((t, o) => t + o.total, 0) * 100) / 100
  return {
    earned: sum(['DELIVERED', 'COMPLETED']),
    pending: sum(['CONFIRMED', 'PACKED', 'QC_PASSED', 'READY_FOR_DISPATCH', 'POOLED', 'IN_TRANSIT']),
  }
}
