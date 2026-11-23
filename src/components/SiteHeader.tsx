import { Link } from 'react-router'
import { useAuth } from '@/features/auth/authContext'
import { homePathFor } from '@/features/auth/roles'
import { LanguageSwitch } from '@/i18n/I18nProvider'
import { useI18n } from '@/i18n/i18n'
import { BrandMark } from './BrandMark'
import { ThemeToggle } from './ThemeSwitch'

/** Header for the pages outside a workspace (team, a farm's page, profile): the name and a way in. */
export function SiteHeader() {
  const { user, logout } = useAuth()
  const { t } = useI18n()
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-8">
        <BrandMark />
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle className="hidden whitespace-nowrap sm:inline-flex" />
          <LanguageSwitch />
          {user ? (
            <>
              <Link to={homePathFor(user)} className="btn-primary min-h-9 px-3 whitespace-nowrap">
                {t('My workspace')}
              </Link>
              <button type="button" onClick={() => void logout()} className="btn-ghost hidden min-h-9 px-3 whitespace-nowrap sm:inline-flex">
                {t('Sign out')}
              </button>
            </>
          ) : (
            <Link to="/" className="btn-primary min-h-9 px-3 whitespace-nowrap">
              {t('Sign in')}
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
