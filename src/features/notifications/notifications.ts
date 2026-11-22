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
  if (n.type.startsWith('ORDER_') || n.type === 'PAYMENT_SUCCEEDED') return role === 'farmer' ? '/farmer/orders' : null
  if (n.type === 'RESERVATION_ACCEPTED' || n.type === 'HARVEST_READY')
    return role === 'farmer' ? '/farmer/crops' : role === 'customer' ? '/customer/reservations' : null
  return null
}
