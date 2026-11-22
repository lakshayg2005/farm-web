import { motion } from 'motion/react'
import { useEffect } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router'
import { useAuth } from '@/features/auth/authContext'
import { LanguageSwitch } from '@/i18n/I18nProvider'
import { useI18n } from '@/i18n/i18n'
import { useUnreadCount } from '@/features/notifications/notifications'
import { useCart } from '@/features/shop/shop'
import type { Section } from '@/routes/types'
import { BrandMark } from './BrandMark'
import { Icon } from './Icon'

const quick = { type: 'tween', duration: 0.2, ease: [0.25, 0.8, 0.3, 1] } as const

/**
 * Shell shared by every role section.
 * Desktop: a white sidebar with the section's pages. Mobile: a top bar and a bottom tab bar.
 */
export function RoleLayout({ section }: { section: Section }) {
  const { pathname } = useLocation()
  const { user, logout } = useAuth()
  const { t } = useI18n()
  const current = section.pages.find((p) => pathname.endsWith(`/${p.path}`))
  const unread = useUnreadCount().data?.count ?? 0
  const inbox = section.pages.find((p) => p.path === 'notifications')
  const tabPages = section.pages.filter((p) => p.path !== 'notifications')
  const hasTabs = tabPages.length > 1
  const cartCount = useCart().length
  const badge = (page: { path: string }) =>
    page.path === 'cart' && cartCount > 0 ? (
      <span className="relative ml-auto grid min-w-5 place-items-center rounded-full bg-ink px-1.5 text-xs font-bold text-white">
        {cartCount}
        <span className="sr-only"> {t('items')}</span>
      </span>
    ) : page.path === 'notifications' && unread > 0 ? (
      <span className="relative ml-auto grid min-w-5 place-items-center rounded-full bg-primary px-1.5 text-xs font-bold text-white">
        {unread > 99 ? '99+' : unread}
        <span className="sr-only"> {t('unread')}</span>
      </span>
    ) : null

  useEffect(() => {
    document.title = current ? `${t(current.label)} | ${t(section.label)} | Farm Platform` : 'Farm Platform'
  }, [current, section.label, t])

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[15rem_minmax(0,1fr)]">
      {/* Desktop sidebar */}
      <aside className="hidden border-r border-line bg-white lg:block">
        <div className="sticky top-0 flex h-dvh flex-col px-3 py-5">
          <div className="px-3 pb-6">
            <BrandMark />
          </div>
          <p className="px-3 pb-2 text-sm font-semibold text-ink-soft">{t(section.label)}</p>
          <nav aria-label={t('{section} pages', { section: t(section.label) })} className="flex-1">
            <ul className="space-y-0.5">
              {section.pages.map((page) => (
                <li key={page.path}>
                  <NavLink
                    to={page.path}
                    className={({ isActive }) =>
                      `relative flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 transition-colors duration-150 ${
                        isActive ? 'font-bold text-ink' : 'font-medium text-ink-soft hover:bg-paper hover:text-ink'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <motion.span layoutId="rail-active" transition={quick} className="absolute inset-0 rounded-lg bg-paper-deep" />
                        )}
                        <Icon name={page.icon} className="relative size-5" />
                        <span className="relative">{t(page.label)}</span>
                        {badge(page)}
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <div className="border-t border-line px-3 pt-4">
            {user && (
              <NavLink to="/profile" className="block truncate font-semibold hover:underline">
                {user.name}
              </NavLink>
            )}
            <div className="mt-1 flex gap-4 text-sm text-ink-soft">
              <NavLink to="/" className="hover:text-ink hover:underline">
                {t('All sections')}
              </NavLink>
              <button type="button" onClick={() => void logout()} className="hover:text-ink hover:underline">
                {t('Sign out')}
              </button>
            </div>
            <LanguageSwitch className="mt-3" />
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-20 border-b border-line bg-white lg:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <BrandMark className="text-base" />
          <span className="flex items-center gap-3 text-sm">
            {inbox && (
              <NavLink to={inbox.path} aria-label={unread > 0 ? t('Notifications, {n} unread', { n: unread }) : t('Notifications')} className="relative grid size-10 place-items-center">
                <Icon name="bell" className="size-5" />
                {unread > 0 && <span aria-hidden="true" className="absolute top-1.5 right-1.5 size-2.5 rounded-full bg-primary ring-2 ring-white" />}
              </NavLink>
            )}
            <LanguageSwitch />
            <span className="hidden font-semibold sm:inline">{t(section.label)}</span>
            <NavLink to="/profile" aria-label={t('Profile')} className="grid size-10 place-items-center">
              <Icon name="user" className="size-5" />
            </NavLink>
          </span>
        </div>
      </header>

      <main className={`min-w-0 px-4 py-6 sm:px-8 lg:px-10 lg:py-10 ${hasTabs ? 'pb-28 lg:pb-10' : ''}`}>
        {section.role === 'farmer' && user && !user.farmerVerified && (
          <p role="note" className="mx-auto mb-5 max-w-6xl rounded-lg border border-warn/40 bg-[#f7ebd0] p-3 text-[#6f4a0e]">
            <strong>{t('Waiting for verification')}.</strong> {t('You can set up your farm and listings now. An admin checks new farmers before customers can buy from them.')}
          </p>
        )}
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={quick}
          className="mx-auto max-w-6xl"
        >
          <Outlet />
        </motion.div>
      </main>

      {/* Mobile tab bar */}
      {hasTabs && (
        <nav
          aria-label={t('{section} pages', { section: t(section.label) })}
          className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] lg:hidden"
        >
          <ul className="grid" style={{ gridTemplateColumns: `repeat(${tabPages.length}, minmax(0, 1fr))` }}>
            {tabPages.map((page) => (
              <li key={page.path}>
                <NavLink
                  to={page.path}
                  className={({ isActive }) =>
                    `flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 py-1.5 text-xs leading-tight ${
                      isActive ? 'font-bold text-primary' : 'font-medium text-ink-soft'
                    }`
                  }
                >
                  <span className="relative">
                    <Icon name={page.icon} className="size-5" />
                    {page.path === 'cart' && cartCount > 0 && (
                      <span aria-hidden="true" className="absolute -top-1.5 -right-2.5 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[0.65rem] leading-4 font-bold text-white">
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
