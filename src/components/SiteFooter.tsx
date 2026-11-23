import { Link } from 'react-router'
import { useI18n } from '@/i18n/i18n'

export function SiteFooter() {
  const { t } = useI18n()
  return (
    <footer className="mt-auto border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-sm text-on-surface-variant sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <p>{t('Farm Platform, a course project guided by Dr Gagan Sir.')}</p>
        <Link to="/team" className="underline-offset-2 hover:text-on-surface hover:underline">
          {t('The team')}
        </Link>
      </div>
    </footer>
  )
}
