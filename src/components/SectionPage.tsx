import type { SectionPage as Page } from '@/routes/types'
import { EmptyState } from './EmptyState'

/** Page frame inside a section, laid out like AINow's pages: small grey caps label, big bold title, grey text. */
export function SectionPage({ page }: { page: Page }) {
  return (
    <>
      <header className="max-w-3xl">
        <h1 className="text-4xl font-bold md:text-5xl">{page.label}</h1>
        <p className="mt-4 text-lg leading-8 text-gray-400">{page.summary}</p>
      </header>
      {page.element ?? <EmptyState icon={page.icon} {...page.empty} />}
    </>
  )
}
