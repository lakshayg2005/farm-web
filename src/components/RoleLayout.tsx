import { useEffect } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { useAuth } from '@/features/auth/authContext'
import { LanguageSwitch } from '@/i18n/I18nProvider'
import { useI18n } from '@/i18n/i18n'
import { useUnreadCount } from '@/features/notifications/notifications'
import { useCart } from '@/features/shop/shop'
import type { Section } from '@/routes/types'
import { materialIcon } from './materialIcon'
import { ThemeToggle } from './ThemeSwitch'

const ROLE_NAME: Record<string, string> = {
  farmer: 'Farmer Partner',
  customer: 'Customer',
  inspector: 'Field Inspector',
  admin: 'Operations Admin',
}

/**
 * Shell shared by every role section ("My workspace"): a fixed sidebar with the section's pages,
 * a top status bar, and the page. On small screens the sidebar becomes a bottom tab bar.
 */
export function RoleLayout({ section }: { section: Section }) {
  const { pathname } = useLocation()
  const current = section.pages.find((p) => pathname.endsWith(`/${p.path}`))
  const { user, logout } = useAuth()
  const { t } = useI18n()
  const unread = useUnreadCount().data?.count ?? 0
  const cartCount = useCart().length
  const inbox = section.pages.find((p) => p.path === 'notifications')
  const tabPages = section.pages.filter((p) => p.path !== 'notifications')
  const badge = (page: { path: string }) =>
    page.path === 'cart' && cartCount > 0 ? (
      <span className="ml-auto grid min-w-5 place-items-center rounded-full bg-secondary px-1.5 text-xs font-bold text-on-secondary">
        {cartCount}
        <span className="sr-only"> {t('items')}</span>
      </span>
    ) : page.path === 'notifications' && unread > 0 ? (
      <span className="ml-auto grid min-w-5 place-items-center rounded-full bg-primary px-1.5 text-xs font-bold text-on-primary">
        {unread > 99 ? '99+' : unread}
        <span className="sr-only"> {t('unread')}</span>
      </span>
    ) : null

  useEffect(() => {
    document.title = current ? `${current.label} | ${section.label} | Farm Platform` : 'Farm Platform'
  }, [current, section.label])

  const navItem = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all ${
      isActive ? 'border border-emerald-500/20 bg-[#1d3525] font-medium text-emerald-300' : 'border border-transparent text-[#9aa89e] hover:bg-[#152219] hover:text-[#ecf3ed]'
    }`

  return (
    <div className="flex min-h-dvh bg-background text-on-surface">
      {/* Sidebar (always dark, as in the prototype) */}
      <aside className="fixed top-0 left-0 z-50 hidden h-full w-64 flex-col justify-between border-r border-[#1b261f] bg-[#0d1611] px-4 py-6 lg:flex">
        <div className="flex flex-col gap-7">
          <Link to="/" className="flex items-center gap-3 px-2 pt-1">
            <div className="flex size-8 items-center justify-center rounded-lg border border-emerald-600/30 bg-emerald-700/20 text-emerald-400">
              <span className="material-symbols-outlined text-[19px]">potted_plant</span>
            </div>
            <div className="flex flex-col">
              <span className="font-serif text-lg leading-tight font-medium tracking-tight text-[#ecf3ed]">Farm Platform</span>
              <span className="text-[11px] font-semibold tracking-wider text-emerald-500 uppercase">{ROLE_NAME[section.role] ?? section.label} portal</span>
            </div>
          </Link>
          <nav aria-label={`${section.label} pages`} className="flex flex-col gap-1">
            <Link to="/" className="flex items-center gap-3 rounded-lg border border-transparent px-3 py-2 text-sm text-[#9aa89e] transition-all hover:bg-[#152219] hover:text-[#ecf3ed]">
              <span className="material-symbols-outlined text-[18px]">space_dashboard</span>
              <span>{t('All sections')}</span>
            </Link>
            {section.pages.map((page) => (
              <NavLink key={page.path} to={page.path} className={navItem}>
                <span className="material-symbols-outlined text-[18px]">{materialIcon(page.icon)}</span>
                <span>{t(page.label)}</span>
                {badge(page)}
              </NavLink>
            ))}
            <Link to="/catalog" className="flex items-center gap-3 rounded-lg border border-transparent px-3 py-2 text-sm text-[#9aa89e] transition-all hover:bg-[#152219] hover:text-[#ecf3ed]">
              <span className="material-symbols-outlined text-[18px]">storefront</span>
              <span>Marketplace</span>
            </Link>
          </nav>
        </div>

        <div className="flex flex-col gap-3 border-t border-[#1a261e] pt-4">
          <div className="flex items-center justify-between px-2 text-xs text-[#9aa89e]">
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              Farm network
            </span>
            <span className="text-[11px] text-emerald-400">Online</span>
          </div>
          <LanguageSwitch className="px-2" />
          <div className="flex items-center justify-between rounded-lg border border-[#1e2d22] bg-[#141f17] p-2.5">
            <span className="flex min-w-0 items-center gap-2.5 overflow-hidden">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-800/40 text-xs font-semibold text-emerald-300">
                {(user?.name ?? section.label).charAt(0)}
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-xs font-medium text-[#ecf3ed]">{user?.name ?? section.label}</span>
                <button type="button" onClick={() => void logout()} className="text-left text-[11px] text-[#9aa89e] hover:text-emerald-400">
                  {t('Sign out')}
                </button>
              </span>
            </span>
            <NavLink to="/profile" aria-label={t('Profile')} className="text-[#9aa89e] hover:text-[#ecf3ed]">
              <span className="material-symbols-outlined text-[16px]">open_in_new</span>
            </NavLink>
          </div>
        </div>
      </aside>

      {/* Main space */}
      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <header className="fixed top-0 right-0 left-0 z-40 flex h-14 items-center justify-between border-b border-border bg-header px-4 backdrop-blur-md sm:px-8 lg:left-64">
          <div className="flex items-center gap-3 text-xs text-on-surface-variant">
            <Link to="/" className="font-serif text-base text-on-surface lg:hidden">Farm Platform</Link>
            <span className="hidden lg:inline">Operations</span>
            <span className="hidden text-on-surface-variant/40 lg:inline">/</span>
            <span className="font-medium text-on-surface">{current ? t(current.label) : t(section.label)}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <ThemeToggle />
            <LanguageSwitch className="lg:hidden" />
            <NavLink
              to={inbox?.path ?? '/profile'}
              aria-label={unread > 0 ? t('Notifications, {n} unread', { n: unread }) : t('Notifications')}
              className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface-container text-on-surface-variant transition-colors hover:border-outline hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-[17px]">notifications</span>
              {unread > 0 && <span aria-hidden="true" className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-primary" />}
            </NavLink>
            <NavLink to="/profile" aria-label={t('Profile')} className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-surface-card text-on-surface-variant lg:hidden">
              <span className="material-symbols-outlined text-[17px]">person</span>
            </NavLink>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 pt-20 pb-28 sm:px-8 lg:pb-16">
          {section.role === 'farmer' && user && !user.farmerVerified && (
            <p role="note" className="mb-5 rounded-lg border border-border bg-surface-card p-3 text-xs text-secondary">
              <strong>{t('Waiting for verification')}.</strong> {t('An admin checks every new farmer before they can list produce or offer land. You will get a notification once you are verified.')}
            </p>
          )}
          <Outlet />
        </main>
      </div>

      {/* Mobile tab bar */}
      {tabPages.length > 1 && (
        <nav aria-label={`${section.label} pages (mobile)`} className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden">
          <ul className="grid" style={{ gridTemplateColumns: `repeat(${tabPages.length}, minmax(0, 1fr))` }}>
            {tabPages.map((page) => (
              <li key={page.path}>
                <NavLink
                  to={page.path}
                  className={({ isActive }) => `flex flex-col items-center gap-0.5 px-1 py-2 text-xs ${isActive ? 'font-semibold text-primary' : 'text-on-surface-variant'}`}
                >
                  <span className="relative"><span className="material-symbols-outlined text-[22px]">{materialIcon(page.icon)}</span>{page.path === 'cart' && cartCount > 0 && (<span aria-hidden="true" className="absolute -top-1.5 -right-2.5 grid min-w-4 place-items-center rounded-full bg-secondary px-1 text-[0.65rem] font-bold text-on-secondary">{cartCount}</span>)}</span>
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
