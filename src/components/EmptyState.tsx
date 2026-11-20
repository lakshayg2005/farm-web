import { Icon, type IconName } from './Icon'

export function EmptyState({ icon, title, body }: { icon: IconName; title: string; body: string }) {
  return (
    <div className="card mt-8 flex max-w-xl gap-4 p-5 sm:p-6">
      <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-lime/50 text-forest-deep">
        <Icon name={icon} />
      </span>
      <div>
        <h2 className="text-lg font-semibold leading-snug">{title}</h2>
        <p className="mt-1 text-ink-soft">{body}</p>
      </div>
    </div>
  )
}
