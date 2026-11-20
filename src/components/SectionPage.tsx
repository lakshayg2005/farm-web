import type { SectionPage as Page } from '@/routes/types'
import { EmptyState } from './EmptyState'
import { Icon } from './Icon'

/** Page frame inside a section: title, one-line summary, then the page body (or its empty state). */
export function SectionPage({ page }: { page: Page }) {
  return (
    <>
      <header className="flex max-w-3xl items-start gap-4">
        <span className="mt-1 hidden size-12 shrink-0 place-items-center rounded-2xl bg-indigo text-white shadow-[var(--shadow-card)] sm:grid">
          <Icon name={page.icon} className="size-6" />
        </span>
        <div>
          <h1 className="font-display text-[2rem] leading-tight sm:text-[2.5rem]">{page.label}</h1>
          <p className="mt-1 text-lg text-ink-soft">{page.summary}</p>
        </div>
      </header>
      {page.element ?? <EmptyState icon={page.icon} {...page.empty} />}
    </>
  )
}
