import { motion } from 'motion/react'
import { useEffect, type ReactNode } from 'react'
import { Link } from 'react-router'
import { BrandMark } from '@/components/BrandMark'
import { ThemeToggle } from '@/components/ThemeSwitch'
import { LanguageSwitch } from '@/i18n/I18nProvider'
import { useI18n } from '@/i18n/i18n'

const ROLES = [
  { name: 'Farmers', body: 'List produce, pack orders and let out plots for a season.' },
  { name: 'Customers', body: 'Buy from farms near you, or reserve a plot and follow the crop to harvest.' },
]

/** Rows of a ploughed field running to the horizon: the one decorative element on the page. */
function Furrows() {
  const rows = Array.from({ length: 9 }, (_, i) => i)
  return (
    <svg viewBox="0 0 600 160" preserveAspectRatio="none" aria-hidden="true" className="absolute inset-x-0 bottom-0 h-40 w-full text-on-primary/15">
      {rows.map((i) => {
        const x = -260 + i * 140
        return <path key={i} d={`M300 0 Q ${300 + (x - 300) * 0.35} 90 ${x} 160`} fill="none" stroke="currentColor" strokeWidth="1.2" />
      })}
      <line x1="0" y1="0.5" x2="600" y2="0.5" stroke="currentColor" strokeWidth="1" />
    </svg>
  )
}

/**
 * The page everyone lands on: what the platform is on one side, the form (sign in, create an
 * account, verify the phone) on the other.
 */
export function AuthShell({ title, intro, children }: { title: string; intro: string; children: ReactNode }) {
  const { t } = useI18n()
  const shown = t(title)
  useEffect(() => {
    document.title = `${shown} | Farm Platform`
  }, [shown])

  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="relative hidden overflow-hidden bg-primary px-12 pt-12 pb-48 text-on-primary lg:flex lg:flex-col">
        <Link to="/" className="flex items-center gap-2.5 text-[1.05rem] font-semibold tracking-tight">
          Farm Platform
        </Link>
        <div className="mt-auto max-w-md">
          <p className="font-serif text-[2.75rem] leading-[1.05]">{t('Produce and farmland, straight from the farmer.')}</p>
          <dl className="mt-10 space-y-5 text-[0.95rem]">
            {ROLES.map((r) => (
              <div key={r.name} className="border-t border-on-primary/20 pt-4">
                <dt className="font-semibold">{t(r.name)}</dt>
                <dd className="mt-0.5 text-on-primary/75">{t(r.body)}</dd>
              </div>
            ))}
          </dl>
        </div>
        <Furrows />
      </aside>

      <div className="flex min-h-dvh flex-col px-5 py-5 sm:px-10">
        <div className="flex items-center justify-between gap-3">
          <BrandMark className="lg:invisible" />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageSwitch />
          </div>
        </div>

        <motion.main
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: [0.2, 0, 0, 1] }}
          className="mx-auto my-auto w-full max-w-sm py-10"
        >
          <h1 className="font-serif text-[2.5rem] leading-none">{shown}</h1>
          <p className="mt-3 text-on-surface-variant">{t(intro)}</p>
          <div className="mt-8">{children}</div>
        </motion.main>

        <dl className="mx-auto mb-6 w-full max-w-sm space-y-3 border-t border-border pt-5 text-sm lg:hidden">
          {ROLES.map((r) => (
            <div key={r.name}>
              <dt className="font-semibold">{t(r.name)}</dt>
              <dd className="text-on-surface-variant">{t(r.body)}</dd>
            </div>
          ))}
        </dl>

        <footer className="flex flex-wrap justify-between gap-2 text-xs text-on-surface-variant">
          <span>{t('A course project guided by Dr Gagan Sir.')}</span>
          <Link to="/team" className="hover:text-on-surface hover:underline">
            {t('The team')}
          </Link>
        </footer>
      </div>
    </div>
  )
}

export function Field({
  label,
  error,
  hint,
  ...input
}: { label: string; error?: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  const { t } = useI18n()
  const id = input.id ?? input.name
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium">
        {t(label)}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={`input mt-1.5 ${error ? 'border-danger' : ''}`}
        {...input}
      />
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1.5 text-sm text-ink-soft">
          {t(hint)}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-sm font-medium text-danger">
          {t(error)}
        </p>
      )}
    </div>
  )
}

export const primaryButton = 'btn-primary w-full min-h-11'
