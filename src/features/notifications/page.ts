import { createElement } from 'react'
import type { Role, SectionPage } from '@/routes/types'
import { NotificationsPage } from './NotificationsPage'

/** Every section ends with the same inbox page. */
export const notificationsPage = (role: Role): SectionPage => ({
  path: 'notifications',
  label: 'Notifications',
  icon: 'bell',
  summary: 'Orders, payments and reservations that need your attention.',
  empty: { title: 'No notifications', body: 'Updates about your orders and reservations show up here.' },
  element: createElement(NotificationsPage, { role }),
})
