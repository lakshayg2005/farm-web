import { useI18n } from '@/i18n/i18n'
import { Icon, type IconName } from './Icon'

/** Says what the page is for and what to do next. */
export function EmptyState({ icon, title, body }: { icon: IconName; title: string; body: string }) {
  const { t } = useI18n()
  return (
    <div className="card mt-8 flex max-w-xl gap-4 border-dashed p-5 sm:p-6">
      <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-paper-deep text-ink">
        <Icon name={icon} />
      </span>
      <div>
        <h2 className="text-lg font-semibold leading-snug">{t(title)}</h2>
        <p className="mt-1 text-ink-soft">{t(body)}</p>
      </div>
    </div>
  )
}
