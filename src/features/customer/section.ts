import { createElement } from 'react'
import type { Section } from '@/routes/types'
import { PlotSearchPage } from './PlotSearchPage'
import { ReservationsPage } from './ReservationsPage'

export const customerSection: Section = {
  role: 'customer',
  label: 'Customer',
  audience: 'Find farmland near you, reserve a plot and follow your crop.',
  accent: 'var(--color-indigo)',
  pages: [
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
