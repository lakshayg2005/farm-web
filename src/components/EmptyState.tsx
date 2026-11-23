import { useI18n } from '@/i18n/i18n'
import type { IconName } from './Icon'

/** Says what the page is for and what to do next. */
export function EmptyState({ title, body }: { icon?: IconName; title: string; body: string }) {
  const { t } = useI18n()
  return (
    <div className="mt-8 max-w-xl rounded-lg border border-dashed border-line-strong p-5 sm:p-6">
      <div>
        <h2 className="font-semibold">{t(title)}</h2>
        <p className="mt-1 text-ink-soft">{t(body)}</p>
      </div>
    </div>
  )
}
