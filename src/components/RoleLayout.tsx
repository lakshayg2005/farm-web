import { useEffect } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { useAuth } from '@/features/auth/authContext'
import { useUnreadCount } from '@/features/notifications/notifications'
import { useCart } from '@/features/shop/shop'
import { LanguageSwitch } from '@/i18n/I18nProvider'
import { useI18n } from '@/i18n/i18n'
import type { Section } from '@/routes/types'
import { materialIcon } from './materialIcon'

const ROLE_NAME: Record<string, string> = {
  farmer: 'Farmer Partner',
  customer: 'Customer',
  inspector: 'Field Inspector',
  admin: 'Operations Admin',
}

const navClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-label-lg transition-all ${
    isActive
      ? 'bg-primary-container font-bold text-on-primary-container shadow-[0_0_24px_rgba(46,196,122,0.18)]'
      : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
  }`

/**
 * Shell shared by every role section ("My workspace"): a fixed sidebar with the section's pages,
 * a top status bar, and the page. On small screens the sidebar becomes a bottom tab bar.
 */
export function RoleLayout({ section }: { section: Section }) {
  const { pathname } = useLocation()
  const { user, logout } = useAuth()
  const { t } = useI18n()
  const current = section.pages.find((p) => pathname.endsWith(`/${p.path}`))
  const unread = useUnreadCount().data?.count ?? 0
  const inbox = section.pages.find((p) => p.path === 'notifications')
  const tabPages = section.pages.filter((p) => p.path !== 'notifications')
  const cartCount = useCart().length

  useEffect(() => {
    document.title = current ? `${t(current.label)} | ${t(section.label)} | Farm Platform` : 'Farm Platform'
  }, [current, section.label, t])

  const badge = (page: { path: string }) =>
    page.path === 'cart' && cartCount > 0 ? (
      <span className="ml-auto grid min-w-5 place-items-center rounded-full bg-secondary px-1.5 text-xs font-bold text-on-secondary">
        {cartCount}
        <span className="sr-only"> {t('items')}</span>
      </span>
    ) : page.path === 'notifications' && unread > 0 ? (
      <span className="ml-auto grid min-w-5 place-items-center rounded-full bg-secondary px-1.5 text-xs font-bold text-on-secondary">
        {unread > 99 ? '99+' : unread}
        <span className="sr-only"> {t('unread')}</span>
      </span>
    ) : null

  return (
    <div className="flex min-h-dvh bg-background text-on-surface">
      {/* Sidebar */}
      <aside className="fixed top-0 left-0 z-50 hidden h-full w-72 flex-col justify-between overflow-y-auto bg-surface-container-low px-4 py-6 shadow-[0_1px_8px_rgba(0,0,0,0.3)] lg:flex">
        <div className="flex flex-col gap-6">
          <Link to="/" className="flex items-center gap-3 px-3">
            <span className="grid size-8 place-items-center rounded-lg bg-primary text-on-primary">
              <span aria-hidden="true" className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
            </span>
            <span className="flex flex-col">
              <span className="font-headline-sm text-headline-sm leading-none font-semibold tracking-tight text-on-surface">Farm Platform</span>
              <span className="mt-1 text-label-sm tracking-widest text-primary uppercase">{t('Operations Hub')}</span>
            </span>
          </Link>
          <div className="flex items-center gap-2 rounded-xl bg-surface-container px-3 py-2.5">
            <span className="size-2.5 rounded-full bg-secondary"></span>
            <span className="text-label-md text-on-surface">{t(ROLE_NAME[section.role] ?? section.label)}</span>
          </div>
          <nav aria-label={t('{section} pages', { section: t(section.label) })} className="flex flex-col gap-1.5">
            {section.pages.map((page) => (
              <NavLink key={page.path} to={page.path} className={navClass}>
                <span aria-hidden="true" className="material-symbols-outlined text-[20px]">{materialIcon(page.icon)}</span>
                <span>{t(page.label)}</span>
                {badge(page)}
              </NavLink>
            ))}
            <Link to="/catalog" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-label-lg text-on-surface-variant transition-all hover:bg-surface-container-high hover:text-on-surface">
              <span aria-hidden="true" className="material-symbols-outlined text-[20px]">storefront</span>
              <span>{t('Marketplace')}</span>
            </Link>
          </nav>
        </div>

        <div className="flex flex-col gap-2 pt-4">
          <Link to="/" className="flex items-center gap-3 rounded-xl px-3 py-2 text-label-md text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface">
            <span aria-hidden="true" className="material-symbols-outlined text-[18px]">home</span>
            <span>{t('All sections')}</span>
          </Link>
          <LanguageSwitch className="px-3" />
          <div className="flex items-center rounded-xl bg-surface-container p-3">
            <span className="flex min-w-0 items-center gap-3">
              <NavLink to="/profile" aria-label={t('Profile')} className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-on-primary">
                <span aria-hidden="true" className="material-symbols-outlined text-[18px]">person</span>
              </NavLink>
              <span className="flex min-w-0 flex-col overflow-hidden">
                <NavLink to="/profile" className="truncate text-label-md text-on-surface hover:underline">
                  {user?.name ?? t(section.label)}
                </NavLink>
                <button type="button" onClick={() => void logout()} className="text-left text-label-sm text-on-surface-variant hover:text-primary">
                  {t('Sign out')}
                </button>
              </span>
            </span>
          </div>
        </div>
      </aside>

      {/* Main space */}
      <div className="flex min-w-0 flex-1 flex-col lg:pl-72">
        <header className="fixed top-0 right-0 left-0 z-40 flex h-16 items-center justify-between bg-surface/85 px-4 shadow-[0_1px_8px_rgba(0,0,0,0.25)] backdrop-blur-xl sm:px-8 lg:left-72">
          <div className="flex items-center gap-4 text-on-surface-variant">
            <Link to="/" className="font-headline-sm text-headline-sm font-semibold text-on-surface lg:hidden">Farm Platform</Link>
            <span aria-hidden="true" className="material-symbols-outlined hidden text-[20px] sm:inline">agriculture</span>
            <span className="hidden text-label-sm tracking-wider uppercase sm:inline">{t(section.label)}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="lg:hidden"><LanguageSwitch /></span>
            {inbox && (
              <NavLink
                to={inbox.path}
                aria-label={unread > 0 ? t('Notifications, {n} unread', { n: unread }) : t('Notifications')}
                className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-surface-container text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
              >
                <span aria-hidden="true" className="material-symbols-outlined text-[20px]">notifications</span>
                {unread > 0 && <span aria-hidden="true" className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-secondary" />}
              </NavLink>
            )}
            <NavLink to="/profile" aria-label={t('Profile')} className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-on-primary">
              <span aria-hidden="true" className="material-symbols-outlined text-[18px]">person</span>
            </NavLink>
          </div>
        </header>

        <main className="w-full px-4 pt-20 pb-28 sm:px-8 sm:pt-24 lg:pb-12">
          {section.role === 'farmer' && user && !user.farmerVerified && (
            <p role="note" className="mx-auto mb-5 max-w-6xl rounded-xl bg-secondary-container/20 p-3 text-secondary">
              <strong>{t('Waiting for verification')}.</strong> {t('An admin checks every new farmer before they can list produce or offer land. You will get a notification once you are verified.')}
            </p>
          )}
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile tab bar */}
      {tabPages.length > 1 && (
        <nav aria-label={t('{section} pages', { section: t(section.label) })} className="fixed inset-x-0 bottom-0 z-40 bg-surface-container-low pb-[env(safe-area-inset-bottom)] lg:hidden">
          <ul className="grid" style={{ gridTemplateColumns: `repeat(${tabPages.length}, minmax(0, 1fr))` }}>
            {tabPages.map((page) => (
              <li key={page.path}>
                <NavLink
                  to={page.path}
                  className={({ isActive }) => `flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 py-1.5 text-xs leading-tight ${isActive ? 'font-semibold text-primary' : 'text-on-surface-variant'}`}
                >
                  <span className="relative">
                    <span aria-hidden="true" className="material-symbols-outlined text-[22px]">{materialIcon(page.icon)}</span>
                    {page.path === 'cart' && cartCount > 0 && (
                      <span aria-hidden="true" className="absolute -top-1.5 -right-2.5 grid min-w-4 place-items-center rounded-full bg-secondary px-1 text-[0.65rem] leading-4 font-bold text-on-secondary">
                        {cartCount}
                      </span>
                    )}
                  </span>
                  <span className="max-w-full truncate">{t(page.label)}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  )
}
