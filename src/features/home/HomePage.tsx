import { useEffect } from 'react'
import { Link } from 'react-router'
import { BrandMark } from '@/components/BrandMark'
import { StatusRail } from '@/components/ui'
import { useAuth } from '@/features/auth/authContext'
import { websiteRoles } from '@/features/auth/roles'
import { STAGES } from '@/features/farmer/orders'
import { LanguageSwitch } from '@/i18n/I18nProvider'
import { useI18n } from '@/i18n/i18n'
import { sectionByRole } from '@/routes/sections'

const EXAMPLE_STAGE = 4

/** The start page: what this is, and one way in. Everything else lives behind the sign-in. */
export function HomePage() {
  const { user, logout } = useAuth()
  const { t } = useI18n()
  useEffect(() => {
    document.title = 'Farm Platform'
  }, [])
  const roles = user ? websiteRoles(user) : []

  return (
    <div className="mx-auto flex min-h-dvh max-w-5xl flex-col px-4 sm:px-8">
      <header className="flex items-center gap-4 py-5">
        <BrandMark />
        <nav aria-label={t('Site')} className="ml-auto flex items-center gap-4 text-[0.95rem] font-medium">
          <LanguageSwitch />
          {user ? (
            <button type="button" onClick={() => void logout()} className="text-ink-soft hover:text-ink">
              {t('Sign out')}
            </button>
          ) : (
            <Link to="/login" className="font-semibold hover:text-primary">
              {t('Sign in')}
            </Link>
          )}
        </nav>
      </header>

      <main className="grid flex-1 content-center gap-10 py-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-center lg:gap-14 lg:py-16">
        <div>
          <h1 className="font-display text-[2.9rem] leading-[1.02] sm:text-[4.2rem]">{t('From the farmer’s field to your table')}</h1>
          <p className="mt-5 max-w-md text-lg text-ink-soft">
            {t('Buy fresh produce straight from farmers, or reserve a plot and follow your crop until harvest.')}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {user && roles.length > 0 ? (
              roles.map((role, i) => (
                <Link key={role} to={`/${role}`} className={`${i === 0 ? 'btn-primary' : 'btn-secondary'} min-h-12 px-6 text-base`}>
                  {t('Open {section}', { section: t(sectionByRole[role].label) })}
                </Link>
              ))
            ) : (
              <>
                <Link to="/catalog" className="btn-primary min-h-12 px-6 text-base">
                  {t('Browse fresh produce')}
                </Link>
                <Link to="/register" className="btn-secondary min-h-12 px-6 text-base">
                  {t('Create an account')}
                </Link>
                <Link to="/login" className="btn-secondary min-h-12 px-6 text-base">
                  {t('Sign in')}
                </Link>
              </>
            )}
          </div>
        </div>

        <div className="card p-6 sm:p-7" aria-label={t('Example order')}>
          <p className="text-sm font-semibold text-ink-soft">{t('Example order')}</p>
          <p className="mt-1 font-display text-2xl leading-tight">{t('Tomato 12 kg and brinjal 5 kg')}</p>
          <div className="mt-6">
            <StatusRail
              stage={EXAMPLE_STAGE}
              total={STAGES.length}
              label={t('Stage {n} of {total}: {name}', { n: EXAMPLE_STAGE, total: STAGES.length, name: t(STAGES[EXAMPLE_STAGE - 1] ?? '') })}
            />
          </div>
          <p className="mt-2 font-bold">{t(STAGES[EXAMPLE_STAGE - 1] ?? '')}</p>
          <p className="text-sm text-ink-soft">{t('Every order has one clear status, from payment to the door.')}</p>
        </div>
      </main>

      <section aria-label={t('Who it is for')} className="grid gap-6 border-t border-line py-8 sm:grid-cols-3 sm:gap-8">
        {[
          ['Farmers', 'List your produce, rent out plots and get paid for every delivered order.'],
          ['Customers', 'Buy fresh produce nearby, or reserve a plot and watch your crop grow.'],
          ['Delivery', 'Nearby orders share one route, so they arrive sooner. Partners use the delivery app.'],
        ].map(([title, body]) => (
          <div key={title}>
            <h2 className="font-bold">{t(title!)}</h2>
            <p className="mt-1 text-ink-soft">{t(body!)}</p>
          </div>
        ))}
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-line py-5 text-sm text-ink-soft">
        <span>Farm Platform</span>
        <Link to="/catalog" className="hover:text-ink hover:underline">
          {t('Browse produce')}
        </Link>
        <Link to="/team" className="hover:text-ink hover:underline">
          {t('Team')}
        </Link>
      </footer>
    </div>
  )
}
