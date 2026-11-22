import { createElement } from 'react'
import type { Section } from '@/routes/types'
import { InspectionsPage } from './InspectionsPage'

export const inspectorSection: Section = {
  role: 'inspector',
  label: 'Inspector',
  audience: 'Check packed produce and harvests, then grade them with photos.',
  pages: [
    {
      path: 'inspections',
      label: 'Inspections',
      icon: 'clipboard',
      summary: 'Packed orders and harvests waiting for a quality check.',
      empty: {
        title: 'Nothing to inspect',
        body: 'Packed orders and ready harvests are added here when they need a grade.',
      },
      element: createElement(InspectionsPage),
    },
  ],
}
