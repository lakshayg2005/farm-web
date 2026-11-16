import type { ReactNode } from 'react'
import type { IconName } from '@/components/Icon'

export type Role = 'farmer' | 'customer' | 'inspector' | 'admin'

export interface SectionPage {
  /** Path segment under the section, e.g. "listings" → /farmer/listings */
  path: string
  /** Short name used in navigation and as the page title */
  label: string
  icon: IconName
  /** One sentence under the page title saying what the page is for */
  summary: string
  /** Shown until the page is built */
  empty: { title: string; body: string }
  /** The real page. Feature issues set this; until then a placeholder renders. */
  element?: ReactNode
}

export interface Section {
  role: Role
  /** Display name of the section */
  label: string
  /** Who the section is for, shown on the start page */
  audience: string
  /** CSS colour used for the section's crop rows and active states */
  accent: string
  pages: [SectionPage, ...SectionPage[]]
}
