import type { Section } from '@/routes/types'

export const adminSection: Section = {
  role: 'admin',
  label: 'Admin',
  audience: 'Verify farmers, plan delivery pools and watch the platform.',
  accent: 'var(--color-soil)',
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
    },
  ],
}
