import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/http'
import type { NotificationComponents } from '@/api/generated'

export type AppNotification = NotificationComponents['schemas']['NotificationOut']
export type NotificationType = NotificationComponents['schemas']['NotificationType']

export const notificationsApi = {
  list: (unreadOnly: boolean) =>
    api<{ items: AppNotification[]; unreadCount: number; nextCursor?: string | null }>(
      `/notification/notifications?limit=50${unreadOnly ? '&unreadOnly=true' : ''}`,
    ),
  unread: () => api<{ count: number }>('/notification/notifications/unread-count'),
  markRead: (id: string) => api<unknown>(`/notification/notifications/${id}/read`, { method: 'POST' }),
  markAllRead: () => api<unknown>('/notification/notifications/read-all', { method: 'POST' }),
}

/** The number on the sidebar badge; refreshed every 30 s while the tab is open. */
export function useUnreadCount() {
  return useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: notificationsApi.unread,
    refetchInterval: 30_000,
    retry: false,
  })
}

/** Where a notification leads, by its type and the section the reader is in. */
export function notificationTarget(n: AppNotification, role: string): string | null {
  const farmer = role === 'farmer'
  const customer = role === 'customer'
  if (n.type.startsWith('ORDER_') || n.type === 'PAYMENT_SUCCEEDED')
    return farmer ? '/farmer/orders' : customer ? '/customer/orders' : null
  if (n.type === 'LOW_STOCK' || n.type === 'RATING_RECEIVED' || n.type === 'FARMER_VERIFIED') return farmer ? '/farmer/listings' : null
  // a new request waits for the farmer's answer on the requests page
  if (n.type === 'RESERVATION_REQUESTED' || n.type === 'RESERVATION_EXPIRED' || n.type === 'RESERVATION_CANCELLED')
    return farmer ? '/farmer/reservations' : customer ? '/customer/reservations' : null
  if (n.type.startsWith('RESERVATION_') || n.type === 'HARVEST_READY' || n.type === 'CROP_UPDATE')
    return farmer ? '/farmer/crops' : customer ? '/customer/reservations' : null
  return null
}
