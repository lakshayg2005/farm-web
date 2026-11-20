import { createElement } from 'react'
import { CatalogBrowser } from '@/features/catalog/CatalogBrowser'
import type { Section } from '@/routes/types'
import { PlotSearchPage } from './PlotSearchPage'
import { ReservationsPage } from './ReservationsPage'

export const customerSection: Section = {
  role: 'customer',
  label: 'Customer',
  audience: 'Buy fresh produce, or reserve a plot of farmland and follow your crop.',
  accent: 'var(--color-indigo)',
  pages: [
    {
      path: 'produce',
      label: 'Fresh produce',
      icon: 'basket',
      summary: 'What farmers near you are selling, how fresh it is and when it will reach you.',
      empty: { title: 'No produce yet', body: 'Listings from farmers near you will show here.' },
      element: createElement('div', { className: 'mt-8' }, createElement(CatalogBrowser)),
    },
    {
      path: 'plots',
      label: 'Find land',
      icon: 'search',
      summary: 'Search the map for plots near you and reserve one for the season.',
      empty: {
        title: 'Search for plots',
        body: 'Move the map to your area to see plots that are open for the coming season.',
      },
      element: createElement(PlotSearchPage),
    },
    {
      path: 'reservations',
      label: 'My reservations',
      icon: 'calendar',
      summary: 'Plots you have reserved, how each crop is growing, and how you get your harvest.',
      empty: {
        title: 'No reservations yet',
        body: 'Reserve a plot to follow its crop here and choose home delivery or buy-back at harvest.',
      },
      element: createElement(ReservationsPage),
    },
  ],
}
