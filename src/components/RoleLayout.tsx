import { motion } from 'motion/react'
import { useEffect, type CSSProperties } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router'
import { useAuth } from '@/features/auth/authContext'
import type { Section } from '@/routes/types'
import { BrandMark } from './BrandMark'
import { CropRows } from './CropRows'
import { Icon } from './Icon'

const quick = { type: 'tween', duration: 0.22, ease: [0.25, 0.8, 0.3, 1] } as const

/**
 * Shell shared by every role section.
 * Desktop: a left rail edged with the section's crop rows. Mobile: a top bar and a bottom tab bar.
 */
export function RoleLayout({ section }: { section: Section }) {
  const { pathname } = useLocation()
  const current = section.pages.find((p) => pathname.endsWith(`/${p.path}`))
  const hasTabs = section.pages.length > 1
  const { user, logout } = useAuth()

  useEffect(() => {
    document.title = current ? `${current.label} | ${section.label} | Farm Platform` : 'Farm Platform'
  }, [current, section.label])

  return (
    <div
      style={{ '--role': section.accent } as CSSProperties}
      className="min-h-dvh lg:grid lg:grid-cols-[17rem_1fr]"
    >
      {/* Desktop rail */}
      <aside className="relative hidden bg-forest-deep text-white lg:block">
        <div className="sticky top-0 flex h-dvh flex-col pr-3">
          <CropRows direction="vertical" className="absolute inset-y-0 right-0 w-3" />
          <div className="px-6 pt-6">
            <BrandMark tone="light" />
          </div>
          <p className="px-6 pt-10 text-xs font-semibold tracking-[0.18em] text-white/45 uppercase">Workspace</p>
          <p className="px-6 pt-1 font-display text-[2rem] leading-none">{section.label}</p>
          <nav aria-label={`${section.label} pages`} className="mt-6 flex-1 px-3">
            <ul className="space-y-1">
              {section.pages.map((page) => (
                <li key={page.path}>
                  <NavLink
                    to={page.path}
                    className={({ isActive }) =>
                      `relative flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors duration-200 ${
                        isActive ? 'font-semibold text-forest-deep' : 'text-white/70 hover:bg-white/8 hover:text-white'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <motion.span
                            layoutId="rail-active"
                            transition={quick}
                            className="absolute inset-0 rounded-lg bg-lime"
                          />
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
          <div className="mx-3 mb-4 rounded-2xl bg-white/6 p-3">
            {user && (
              <div className="flex items-center gap-3 px-1 pb-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-lime font-bold text-forest-deep">
                  {user.name.charAt(0)}
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{user.name}</span>
                  <button type="button" onClick={() => void logout()} className="text-sm text-white/60 hover:text-white">
                    Sign out
                  </button>
                </span>
              </div>
            )}
            <NavLink to="/" className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-white/70 hover:bg-white/8 hover:text-white">
              <Icon name="back" className="size-4" />
              All sections
            </NavLink>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-20 border-b border-line bg-paper/85 backdrop-blur-lg lg:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <BrandMark className="text-base" />
          <span className="rounded-full bg-[color-mix(in_oklab,var(--role)_20%,white)] px-3 py-0.5 text-sm font-semibold">
            {section.label}
          </span>
        </div>
        <CropRows className="h-1.5" />
      </header>

      <main className={`px-4 py-8 sm:px-8 lg:px-14 lg:py-14 ${hasTabs ? 'pb-28 lg:pb-14' : ''}`}>
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={quick}
        >
          <Outlet />
        </motion.div>
      </main>

      {/* Mobile tab bar */}
      {hasTabs && (
        <nav
          aria-label={`${section.label} pages`}
          className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
        >
          <ul className="grid" style={{ gridTemplateColumns: `repeat(${section.pages.length}, minmax(0, 1fr))` }}>
            {section.pages.map((page) => (
              <li key={page.path}>
                <NavLink
                  to={page.path}
                  className={({ isActive }) =>
                    `flex flex-col items-center gap-0.5 px-1 pt-2 pb-2 text-xs leading-tight ${
                      isActive ? 'font-semibold text-ink' : 'text-ink-soft'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span className="relative grid h-8 w-14 place-items-center">
                        {isActive && (
                          <motion.span
                            layoutId="tab-active"
                            transition={quick}
                            className="absolute inset-0 rounded-full bg-neutral-200"
                          />
                        )}
                        <Icon name={page.icon} className="relative size-5" />
                      </span>
                      <span className="max-w-full truncate">{page.label}</span>
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  )
}
