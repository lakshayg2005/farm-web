import type { SectionPage as Page } from '@/routes/types'
import { EmptyState } from './EmptyState'

/** Page frame inside a section: a serif title, a short line about the page, then the page. */
export function SectionPage({ page }: { page: Page }) {
  if (page.bare && page.element) return <>{page.element}</>
  return (
    <>
      <header className="max-w-3xl">
        <h1 className="font-headline-xl text-headline-xl tracking-tight text-on-surface">{page.label}</h1>
        <p className="mt-2 text-body-md text-on-surface-variant">{page.summary}</p>
      </header>
      {page.element ?? <EmptyState icon={page.icon} {...page.empty} />}
    </>
  )
}
