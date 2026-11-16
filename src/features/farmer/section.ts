import type { Section } from '@/routes/types'

export const farmerSection: Section = {
  role: 'farmer',
  label: 'Farmer',
  audience: 'List produce for sale, rent out plots and post crop updates.',
  accent: 'var(--color-mustard)',
  pages: [
    {
      path: 'listings',
      label: 'Listings',
      icon: 'tag',
      summary: 'Produce you have up for sale, with photos, price and stock.',
      empty: {
        title: 'No listings yet',
        body: 'Add your first produce listing with a photo, price and how much you have in stock.',
      },
    },
    {
      path: 'orders',
      label: 'Orders',
      icon: 'box',
      summary: 'Orders from customers to accept and pack, and the payouts you have earned.',
      empty: {
        title: 'No orders yet',
        body: 'When a customer buys from your listings, the order shows here for you to accept and pack.',
      },
    },
    {
      path: 'plots',
      label: 'Plots',
      icon: 'plot',
      summary: 'Land you offer for reservation, drawn on the map with its growing seasons.',
      empty: {
        title: 'No plots yet',
        body: 'Draw the boundary of a plot on the map and choose the seasons it is available.',
      },
    },
    {
      path: 'reservations',
      label: 'Requests',
      icon: 'calendar',
      summary: 'Reservation requests for your plots and the agreements you have signed.',
      empty: {
        title: 'No reservation requests',
        body: 'Customers who want to reserve one of your plots show up here. Each request expires after 48 hours.',
      },
    },
    {
      path: 'crops',
      label: 'Crops',
      icon: 'sprout',
      summary: 'Photo updates on each reserved crop, from sowing to harvest.',
      empty: {
        title: 'No crops growing',
        body: 'Once a reservation is accepted, post photos here as the crop grows and mark it ready to harvest.',
      },
    },
  ],
}
