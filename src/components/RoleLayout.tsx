import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState, type ReactNode } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { useAuth } from '@/features/auth/authContext'
import { websiteRoles } from '@/features/auth/roles'
import { useUnreadCount } from '@/features/notifications/notifications'
import { useCart } from '@/features/shop/shop'
import { LanguageSwitch } from '@/i18n/I18nProvider'
import { useI18n } from '@/i18n/i18n'
import type { Section, SectionPage } from '@/routes/types'
import { sectionByRole } from '@/routes/sections'
import { Logo } from './BrandMark'
import { Icon } from './Icon'
import { ThemeToggle } from './ThemeSwitch'

/** The most tabs the phone bar shows; the rest go under "More". */
const MAX_TABS = 5

function Count({ n, label }: { n: number; label: string }) {
  if (n <= 0) return null
  return (
    <span className="ml-auto min-w-5 rounded-full bg-primary px-1.5 text-center text-xs leading-5 font-semibold text-on-primary tabular-nums">
      {n > 99 ? '99+' : n}
      <span className="sr-only"> {label}</span>
    </span>
  )
}

/** Farmer / Customer / Admin, for people who hold more than one role. */
function WorkspaceSwitch({ current }: { current: Section }) {
  const { user } = useAuth()
  const { t } = useI18n()
  const roles = user ? websiteRoles(user) : []
  if (roles.length < 2) return null
  return (
    <nav aria-label={t('Workspace')} className="flex rounded-md border border-border bg-surface-container p-0.5">
      {roles.map((role) => (
        <Link
          key={role}
          to={`/${role}`}
          aria-current={role === current.role ? 'page' : undefined}
          className={`flex-1 rounded px-2 py-1 text-center text-xs font-semibold transition-colors ${
            role === current.role ? 'bg-surface-card text-on-surface shadow-xs' : 'text-on-surface-variant hover:text-on-surface'
          }`}
        >
          {t(sectionByRole[role].label)}
        </Link>
      ))}
    </nav>
  )
}

/** Name, profile, sign out, theme and language: the same block in the sidebar and the phone menu. */
function Account({ onNavigate }: { onNavigate?: () => void }) {
  const { user, logout } = useAuth()
  const { t } = useI18n()
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2.5">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-surface-container-high text-sm font-semibold">
          {(user?.name ?? '?').charAt(0).toUpperCase()}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium">{user?.name}</span>
          <span className="block truncate text-xs text-on-surface-variant">{user?.phone}</span>
        </span>
      </div>
      <div className="flex gap-1 text-sm">
        <Link to="/profile" onClick={onNavigate} className="rounded-md px-2 py-1 text-on-surface-variant hover:bg-surface-container hover:text-on-surface">
          {t('Profile')}
        </Link>
        <button type="button" onClick={() => void logout()} className="rounded-md px-2 py-1 text-on-surface-variant hover:bg-surface-container hover:text-on-surface">
          {t('Sign out')}
        </button>
      </div>
      <div className="flex items-center justify-between gap-2">
        <ThemeToggle className="-ml-2" />
        <LanguageSwitch />
      </div>
    </div>
  )
}

/**
 * Shell shared by every workspace (farmer, customer, admin): a sidebar with the section's pages on
 * wide screens; a top bar, a bottom tab bar and a "More" sheet on phones.
 */
export function RoleLayout({ section }: { section: Section }) {
  const { pathname } = useLocation()
  const { user } = useAuth()
  const { t } = useI18n()
  const [menuOpen, setMenuOpen] = useState(false)
  const current = section.pages.find((p) => pathname.endsWith(`/${p.path}`))
  const unread = useUnreadCount().data?.count ?? 0
  const cartCount = useCart().length

  useEffect(() => {
    document.title = current ? `${t(current.label)} | Farm Platform` : 'Farm Platform'
  }, [current, t])

  const count = (page: SectionPage): ReactNode =>
    page.path === 'cart' ? <Count n={cartCount} label={t('items')} /> : page.path === 'notifications' ? <Count n={unread} label={t('unread')} /> : null

  const sideItem = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-md px-2.5 py-2 text-sm transition-colors ${
      isActive ? 'bg-surface-card font-semibold text-on-surface shadow-xs' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
    }`

  // Phone tabs: everything but the inbox (it sits in the top bar); overflow goes under More.
  const tabPages = section.pages.filter((p) => p.path !== 'notifications')
  const tabs = tabPages.length > MAX_TABS ? tabPages.slice(0, MAX_TABS - 1) : tabPages
  const overflow = tabPages.slice(tabs.length)
  const inbox = section.pages.find((p) => p.path === 'notifications')

  return (
    <div className="min-h-dvh bg-background text-on-surface">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col gap-6 border-r border-border bg-surface px-3 py-5 lg:flex">
        <Link to="/" className="flex items-center gap-2.5 px-2">
          <Logo />
          <span className="font-semibold tracking-tight">Farm Platform</span>
        </Link>
        <WorkspaceSwitch current={section} />
        <nav aria-label={t('{section} pages', { section: t(section.label) })} className="flex flex-col gap-0.5">
          {section.pages.map((page) => (
            <NavLink key={page.path} to={page.path} className={sideItem}>
              <Icon name={page.icon} className="size-[18px] shrink-0 opacity-80" />
              <span>{t(page.label)}</span>
              {count(page)}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto border-t border-border px-2 pt-4">
          <Account />
        </div>
      </aside>

      {/* Phone top bar */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-3 border-b border-border bg-header px-4 backdrop-blur lg:hidden">
        <Link to="/" className="flex min-w-0 items-center gap-2.5">
          <Logo className="size-7 shrink-0" />
          <span className="truncate text-sm font-semibold">{t(section.label)}</span>
        </Link>
        <div className="flex items-center gap-1">
          {inbox && (
            <NavLink
              to={inbox.path}
              aria-label={unread > 0 ? t('Notifications, {n} unread', { n: unread }) : t('Notifications')}
              className="relative grid size-10 place-items-center rounded-md text-on-surface-variant hover:bg-surface-container"
            >
              <Icon name="bell" className="size-5" />
              {unread > 0 && <span aria-hidden="true" className="absolute top-2 right-2 size-2 rounded-full bg-primary" />}
            </NavLink>
          )}
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label={t('Account')}
            className="grid size-9 place-items-center rounded-full bg-surface-container-high text-sm font-semibold"
          >
            {(user?.name ?? '?').charAt(0).toUpperCase()}
          </button>
        </div>
      </header>

      <div className="lg:pl-60">
        <main className="mx-auto w-full max-w-6xl px-4 pt-6 pb-28 sm:px-8 lg:pt-10 lg:pb-16">
          {section.role === 'farmer' && user && !user.farmerVerified && (
            <p role="note" className="mb-6 rounded-md border border-secondary/30 bg-secondary/8 px-4 py-3 text-sm">
              <strong className="font-semibold">{t('Waiting for verification')}.</strong>{' '}
              <span className="text-on-surface-variant">
                {t('An admin checks every new farmer before they can list produce or offer land. You will get a notification once you are verified.')}
              </span>
            </p>
          )}
          <Outlet />
        </main>
      </div>

      {/* Phone tab bar */}
      {tabPages.length > 1 && (
        <nav
          aria-label={t('{section} pages', { section: t(section.label) }) + ' (mobile)'}
          className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden"
        >
          <ul className="grid" style={{ gridTemplateColumns: `repeat(${tabs.length + (overflow.length ? 1 : 0)}, minmax(0, 1fr))` }}>
            {tabs.map((page) => (
              <li key={page.path}>
                <NavLink
                  to={page.path}
                  className={({ isActive }) =>
                    `flex flex-col items-center gap-1 px-1 pt-2 pb-1.5 text-[0.7rem] ${isActive ? 'font-semibold text-primary' : 'text-on-surface-variant'}`
                  }
                >
                  <span className="relative">
                    <Icon name={page.icon} className="size-5" />
                    {page.path === 'cart' && cartCount > 0 && (
                      <span aria-hidden="true" className="absolute -top-1.5 -right-2.5 min-w-4 rounded-full bg-primary px-1 text-center text-[0.65rem] leading-4 font-semibold text-on-primary">
                        {cartCount}
                      </span>
                    )}
                  </span>
                  <span className="max-w-full truncate">{t(page.label)}</span>
                </NavLink>
              </li>
            ))}
            {overflow.length > 0 && (
              <li>
                <button
                  type="button"
                  onClick={() => setMenuOpen(true)}
                  className={`flex w-full flex-col items-center gap-1 px-1 pt-2 pb-1.5 text-[0.7rem] ${
                    overflow.some((p) => pathname.endsWith(`/${p.path}`)) ? 'font-semibold text-primary' : 'text-on-surface-variant'
                  }`}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5" fill="currentColor">
                    <circle cx="5" cy="12" r="1.6" />
                    <circle cx="12" cy="12" r="1.6" />
                    <circle cx="19" cy="12" r="1.6" />
                  </svg>
                  <span>{t('More')}</span>
                </button>
              </li>
            )}
          </ul>
        </nav>
      )}

      {/* Phone menu: pages that did not fit, workspace switch and account */}
      <AnimatePresence>
        {menuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.button
              type="button"
              aria-label={t('Close')}
              onClick={() => setMenuOpen(false)}
              className="absolute inset-0 bg-black/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={t('Menu')}
              className="absolute inset-x-0 bottom-0 max-h-[85dvh] space-y-5 overflow-y-auto rounded-t-xl border-t border-border bg-surface-card px-5 pt-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)]"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.25, ease: [0.2, 0, 0, 1] }}
            >
              <WorkspaceSwitch current={section} />
              {overflow.length > 0 && (
                <nav aria-label={t('More pages')} className="flex flex-col gap-0.5">
                  {overflow.map((page) => (
                    <NavLink key={page.path} to={page.path} onClick={() => setMenuOpen(false)} className={sideItem}>
                      <Icon name={page.icon} className="size-[18px] shrink-0 opacity-80" />
                      <span>{t(page.label)}</span>
                      {count(page)}
                    </NavLink>
                  ))}
                </nav>
              )}
              <div className="border-t border-border pt-4">
                <Account onNavigate={() => setMenuOpen(false)} />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
