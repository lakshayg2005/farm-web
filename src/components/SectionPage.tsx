import { useI18n } from '@/i18n/i18n'
import type { SectionPage as Page } from '@/routes/types'
import { EmptyState } from './EmptyState'

/** Page frame inside a section: serif title, one-line summary, then the page body (or its empty state). */
export function SectionPage({ page }: { page: Page }) {
  const { t } = useI18n()
  if (page.bare && page.element) return <>{page.element}</>
  return (
    <>
      <header className="max-w-2xl">
        <h1 className="font-headline-xl text-headline-xl tracking-tight text-on-surface">{t(page.label)}</h1>
        <p className="mt-2 text-body-md text-on-surface-variant">{t(page.summary)}</p>
      </header>
      {page.element ?? <EmptyState icon={page.icon} {...page.empty} />}
    </>
  )
}
