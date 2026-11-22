import { createElement } from 'react'
import type { Section } from '@/routes/types'
import { DashboardPage } from './DashboardPage'
import { AdminOrdersPage } from './OrdersPage'
import { PoolingPage } from './PoolingPage'
import { VerificationPage } from './VerificationPage'

export const adminSection: Section = {
  role: 'admin',
  label: 'Admin',
  audience: 'Verify farmers, plan delivery pools and watch the platform.',
  pages: [
    {
      path: 'dashboard',
      label: 'Dashboard',
      icon: 'grid',
      summary: 'How the platform is doing today.',
      empty: {
        title: 'No activity yet',
        body: 'Orders, reservations and sign-ups are counted here as they come in.',
      },
      element: createElement(DashboardPage),
    },
    {
      path: 'orders',
      label: 'Orders',
      icon: 'box',
      summary: 'Every order on the platform: where it is stuck, and a way to cancel and refund one.',
      empty: { title: 'No orders yet', body: 'Orders appear here as customers place them.' },
      element: createElement(AdminOrdersPage),
    },
    {
      path: 'verification',
      label: 'Verification',
      icon: 'shield',
      summary: 'Farmers waiting to be verified before they can sell or rent out land.',
      empty: {
        title: 'No farmers waiting',
        body: 'New farmer sign-ups appear here for you to check and verify.',
      },
      element: createElement(VerificationPage),
    },
    {
      path: 'pooling',
      label: 'Pooling',
      icon: 'route',
      summary: 'Group nearby deliveries into shared routes and see the distance saved.',
      empty: {
        title: 'No pools yet',
        body: 'Pick a delivery date and run pooling to group orders into shared routes.',
      },
      element: createElement(PoolingPage),
    },
  ],
}
