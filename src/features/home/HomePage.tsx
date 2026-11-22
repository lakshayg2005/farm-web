import { useEffect } from 'react'
import { Link } from 'react-router'
import { BrandMark } from '@/components/BrandMark'
import { StatusRail } from '@/components/ui'
import { useAuth } from '@/features/auth/authContext'
import { homePathFor } from '@/features/auth/roles'
import { LanguageSwitch } from '@/i18n/I18nProvider'
import { useI18n } from '@/i18n/i18n'
import { STAGES } from '@/features/farmer/orders'
import { sections } from '@/routes/sections'

/** An example order, to show what "one clear status" means. The real thing lives on the Orders pages. */
const EXAMPLE: readonly (readonly [string, string])[] = [
  ['Customer', 'Thu 7:12 pm'],
  ['Payment taken', 'Thu 7:12 pm'],
  ['Farmer', 'Sat 6:40 am'],
  ['Inspector, grade A', 'Sat 9:05 am'],
  ['System', 'Sat 9:05 am'],
  ['Shared route with 4 stops', ''],
  ['Delivery partner', ''],
  ['Photo and OTP', ''],
]
const DONE = 4

export function HomePage() {
  const { user, logout } = useAuth()
  const { t } = useI18n()
  useEffect(() => {
    document.title = 'Farm Platform'
  }, [])

  return (
    <div className="mx-auto min-h-dvh max-w-6xl px-4 pb-14 sm:px-8 lg:px-10">
      <header className="flex flex-wrap items-center gap-x-7 gap-y-3 py-5">
        <BrandMark />
        <nav aria-label={t('Site')} className="ml-auto flex items-center gap-5 text-[0.95rem] font-medium">
          <LanguageSwitch />
          <Link to="/team" className="hover:text-primary">
            {t('Team')}
          </Link>
          {user ? (
            <>
              <Link to={homePathFor(user)} className="font-semibold hover:text-primary">
                {user.name}
              </Link>
              <button type="button" onClick={() => void logout()} className="text-ink-soft hover:text-ink">
                {t('Sign out')}
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="font-semibold hover:text-primary">
                {t('Sign in')}
              </Link>
              <Link to="/register" className="btn-primary min-h-10 px-4 py-1.5">
                {t('Register')}
              </Link>
            </>
          )}
        </nav>
      </header>

      <section className="grid gap-6 pt-6 pb-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-8 lg:pt-10">
        <div className="card p-6 sm:p-9">
          <h1 className="font-display text-[2.6rem] leading-[1.03] sm:text-[3.2rem]">{t('From the farmer’s field to your table')}</h1>
          <p className="mt-4 max-w-md text-ink-soft">
            {t('Farmers sell fresh produce and rent out plots of their land. Customers buy produce, or reserve a plot and follow their crop until harvest. One account for selling, buying, inspecting and running deliveries.')}
          </p>
          <h2 className="mt-8 text-lg font-bold">{t('Choose your workspace')}</h2>
          <nav aria-label={t('Sections')}>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {sections.map((section) => (
                <li key={section.role}>
                  <Link
                    to={`/${section.role}`}
                    className="group block h-full rounded-lg border border-line-strong bg-white px-4 py-3 transition-colors duration-150 hover:border-ink hover:bg-paper"
                  >
                    <span className="flex items-center justify-between font-bold">
                      {t(section.label)}
                      <span aria-hidden="true" className="text-ink-soft transition-transform duration-150 group-hover:translate-x-0.5">
                        →
                      </span>
                    </span>
                    <span className="mt-0.5 block text-sm leading-snug text-ink-soft">{t(section.audience)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="card p-6 sm:p-9">
          <h2 className="text-lg font-bold">{t('Every order has one clear status')}</h2>
          <p className="mt-1 text-ink-soft">{t('Example: tomato 12 kg and brinjal 5 kg, due Sunday.')}</p>
          <div className="mt-5">
            <StatusRail stage={DONE} label={t('Stage {n} of {total}: {name}', { n: DONE, total: STAGES.length, name: t(STAGES[DONE - 1] ?? '') })} />
          </div>
          <ol className="mt-6">
            {STAGES.map((name, i) => {
              const done = i < DONE
              const current = i === DONE
              return (
                <li key={name} className="flex min-h-[3.1rem] gap-4">
                  <div className="flex flex-col items-center">
                    <span
                      aria-hidden="true"
                      className={`size-4 shrink-0 rounded-full border-2 ${done ? 'border-primary bg-primary' : current ? 'border-primary bg-white' : 'border-line-strong bg-white'}`}
                    />
                    {i < STAGES.length - 1 && <span aria-hidden="true" className={`w-0.5 flex-1 ${done ? 'bg-primary' : 'bg-line'}`} />}
                  </div>
                  <div className="-mt-0.5 flex flex-1 flex-wrap justify-between gap-x-3 pb-3">
                    <div>
                      <p className={current ? 'font-bold' : 'font-medium'}>
                        {t(name)}
                        {current && <span className="sr-only"> {t('(current stage)')}</span>}
                      </p>
                      <p className="text-sm text-ink-soft">{t(EXAMPLE[i]?.[0] ?? '')}</p>
                    </div>
                    <p className="text-sm whitespace-nowrap text-ink-soft">{t(EXAMPLE[i]?.[1] ?? '')}</p>
                  </div>
                </li>
              )
            })}
          </ol>
        </div>
      </section>
    </div>
  )
}
