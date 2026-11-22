import { createElement } from 'react'
import { notificationsPage } from '@/features/notifications/page'
import type { Section } from '@/routes/types'
import { PlotSearchPage } from './PlotSearchPage'
import { ReservationsPage } from './ReservationsPage'
import { CartPage } from '@/features/shop/CartPage'
import { CustomerOrdersPage } from '@/features/shop/OrdersPage'
import { ShopPage } from '@/features/shop/ShopPage'

export const customerSection: Section = {
  role: 'customer',
  label: 'Customer',
  audience: 'Buy fresh produce from farms near you, or reserve a plot and follow your crop.',
  pages: [
    {
      path: 'shop',
      label: 'Shop',
      icon: 'basket',
      summary: 'Fresh produce from farms near you, with how fresh it is and how far it travels.',
      empty: { title: 'Nothing to show yet', body: 'Produce from farms near you shows here.' },
      element: createElement(ShopPage),
    },
    {
      path: 'cart',
      label: 'Cart',
      icon: 'cart',
      summary: 'Check what you picked, add your address and pay.',
      empty: { title: 'Your cart is empty', body: 'Add produce from the shop.' },
      element: createElement(CartPage),
    },
    {
      path: 'orders',
      label: 'Orders',
      icon: 'box',
      summary: 'Follow every order from the farm to your door, and rate it when it arrives.',
      empty: { title: 'No orders yet', body: 'Orders you place show here.' },
      element: createElement(CustomerOrdersPage),
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
      label: 'Reservations',
      icon: 'calendar',
      summary: 'Plots you have reserved, how each crop is growing, and how you get your harvest.',
      empty: {
        title: 'No reservations yet',
        body: 'Reserve a plot to follow its crop here and choose home delivery or buy-back at harvest.',
      },
      element: createElement(ReservationsPage),
    },
    notificationsPage('customer'),
  ],
}
