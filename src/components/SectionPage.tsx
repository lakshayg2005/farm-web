import type { SectionPage as Page } from '@/routes/types'
import { EmptyState } from './EmptyState'

/** Page frame inside a section: title, one-line summary, then the page body (or its empty state). */
export function SectionPage({ page }: { page: Page }) {
  return (
    <>
      <header className="max-w-2xl">
        <h1 className="font-display text-[2rem] leading-tight sm:text-[2.5rem]">{page.label}</h1>
        <p className="mt-2 text-lg text-ink-soft">{page.summary}</p>
      </header>
      {page.element ?? <EmptyState icon={page.icon} {...page.empty} />}
    </>
  )
}
