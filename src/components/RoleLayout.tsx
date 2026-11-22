import { motion } from 'motion/react'
import { useEffect } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router'
import { useAuth } from '@/features/auth/authContext'
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
  const current = section.pages.find((p) => pathname.endsWith(`/${p.path}`))
  const hasTabs = section.pages.length > 1

  useEffect(() => {
    document.title = current ? `${current.label} | ${section.label} | Farm Platform` : 'Farm Platform'
  }, [current, section.label])

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[15rem_minmax(0,1fr)]">
      {/* Desktop sidebar */}
      <aside className="hidden border-r border-line bg-white lg:block">
        <div className="sticky top-0 flex h-dvh flex-col px-3 py-5">
          <div className="px-3 pb-6">
            <BrandMark />
          </div>
          <p className="px-3 pb-2 text-sm font-semibold text-ink-soft">{section.label}</p>
          <nav aria-label={`${section.label} pages`} className="flex-1">
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
                        <span className="relative">{page.label}</span>
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <div className="border-t border-line px-3 pt-4">
            {user && <p className="truncate font-semibold">{user.name}</p>}
            <div className="mt-1 flex gap-4 text-sm text-ink-soft">
              <NavLink to="/" className="hover:text-ink hover:underline">
                All sections
              </NavLink>
              <button type="button" onClick={() => void logout()} className="hover:text-ink hover:underline">
                Sign out
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-20 border-b border-line bg-white lg:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <BrandMark className="text-base" />
          <span className="flex items-center gap-3 text-sm">
            <span className="font-semibold">{section.label}</span>
            <button type="button" onClick={() => void logout()} className="text-ink-soft underline">
              Sign out
            </button>
          </span>
        </div>
      </header>

      <main className={`min-w-0 px-4 py-6 sm:px-8 lg:px-10 lg:py-10 ${hasTabs ? 'pb-28 lg:pb-10' : ''}`}>
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
          aria-label={`${section.label} pages`}
          className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] lg:hidden"
        >
          <ul className="grid" style={{ gridTemplateColumns: `repeat(${section.pages.length}, minmax(0, 1fr))` }}>
            {section.pages.map((page) => (
              <li key={page.path}>
                <NavLink
                  to={page.path}
                  className={({ isActive }) =>
                    `flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 py-1.5 text-xs leading-tight ${
                      isActive ? 'font-bold text-primary' : 'font-medium text-ink-soft'
                    }`
                  }
                >
                  <Icon name={page.icon} className="size-5" />
                  <span className="max-w-full truncate">{page.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  )
}
