import type { SectionPage as Page } from '@/routes/types'
import { EmptyState } from './EmptyState'

/** Page frame inside a section: serif title, one-line summary, then the page body (or its empty state). */
export function SectionPage({ page }: { page: Page }) {
  return (
    <>
      <header className="max-w-2xl">
        <h1 className="font-display text-[2.25rem] leading-none sm:text-[2.75rem]">{page.label}</h1>
        <p className="mt-2 text-ink-soft">{page.summary}</p>
      </header>
      {page.element ?? <EmptyState icon={page.icon} {...page.empty} />}
    </>
  )
}
