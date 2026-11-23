import { Link } from 'react-router'
import { SiteFooter } from '@/components/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader'
import { useI18n } from '@/i18n/i18n'

export function NotFoundPage() {
  const { t } = useI18n()
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-20 sm:px-8">
        <p className="text-sm text-on-surface-variant">404</p>
        <h1 className="mt-2 font-serif text-4xl">{t('This page does not exist')}</h1>
        <p className="mt-3 max-w-md text-on-surface-variant">{t('The link may be old or mistyped.')}</p>
        <Link to="/" className="btn-primary mt-8">
          {t('Go to the start page')}
        </Link>
      </main>
      <SiteFooter />
    </div>
  )
}
