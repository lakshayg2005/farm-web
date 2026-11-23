import { useEffect } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { useAuth } from '@/features/auth/authContext'
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
  const current = section.pages.find((p) => pathname.endsWith(`/${p.path}`))
  const { user, logout } = useAuth()

  useEffect(() => {
    document.title = current ? `${current.label} | ${section.label} | Farm Platform` : 'Farm Platform'
  }, [current, section.label])

  return (
    <div className="flex min-h-dvh bg-background text-on-surface">
      {/* Sidebar */}
      <aside className="fixed top-0 left-0 z-50 hidden h-full w-72 flex-col justify-between bg-surface-container-low px-4 py-6 shadow-[0_1px_8px_rgba(0,0,0,0.3)] lg:flex">
        <div className="flex flex-col gap-6">
          <Link to="/" className="flex items-center gap-3 px-3">
            <span className="grid size-8 place-items-center rounded-lg bg-primary text-on-primary">
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>eco</span>
            </span>
            <span className="flex flex-col">
              <span className="font-headline-sm text-headline-sm leading-none font-semibold tracking-tight text-on-surface">Farm Platform</span>
              <span className="mt-1 text-label-sm tracking-widest text-primary uppercase">Operations Hub</span>
            </span>
          </Link>
          <div className="flex items-center justify-between rounded-xl bg-surface-container px-3 py-2.5">
            <span className="flex items-center gap-2">
              <span className="size-2.5 rounded-full bg-secondary"></span>
              <span className="text-label-md text-on-surface">Role: {ROLE_NAME[section.role] ?? section.label}</span>
            </span>
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant">expand_more</span>
          </div>
          <nav aria-label={`${section.label} pages`} className="flex flex-col gap-1.5">
            {section.pages.map((page) => (
              <NavLink key={page.path} to={page.path} className={navClass}>
                <span className="material-symbols-outlined text-[20px]">{materialIcon(page.icon)}</span>
                <span>{page.label}</span>
              </NavLink>
            ))}
            <Link to="/catalog" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-label-lg text-on-surface-variant transition-all hover:bg-surface-container-high hover:text-on-surface">
              <span className="material-symbols-outlined text-[20px]">storefront</span>
              <span>Marketplace</span>
            </Link>
          </nav>
        </div>

        <div className="flex flex-col gap-2 pt-4">
          <Link to="/" className="flex items-center gap-3 rounded-xl px-3 py-2 text-label-md text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface">
            <span className="material-symbols-outlined text-[18px]">home</span>
            <span>Back to Home</span>
          </Link>
          <div className="flex items-center justify-between rounded-xl bg-surface-container p-3">
            <span className="flex min-w-0 items-center gap-3">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-on-primary">
                <span className="material-symbols-outlined text-[18px]">person</span>
              </span>
              <span className="flex min-w-0 flex-col overflow-hidden">
                <span className="truncate text-label-md text-on-surface">{user?.name ?? section.label}</span>
                <button type="button" onClick={() => void logout()} className="text-left text-label-sm text-on-surface-variant hover:text-primary">
                  Sign out
                </button>
              </span>
            </span>
            <span className="material-symbols-outlined text-[18px] text-on-surface-variant">unfold_more</span>
          </div>
        </div>
      </aside>

      {/* Main space */}
      <div className="flex min-w-0 flex-1 flex-col lg:pl-72">
        <header className="fixed top-0 right-0 left-0 z-40 flex h-16 items-center justify-between bg-surface/85 px-4 shadow-[0_1px_8px_rgba(0,0,0,0.25)] backdrop-blur-xl sm:px-8 lg:left-72">
          <div className="flex items-center gap-4 text-on-surface-variant">
            <Link to="/" className="font-headline-sm text-headline-sm font-semibold text-on-surface lg:hidden">Farm Platform</Link>
            <span className="material-symbols-outlined hidden text-[20px] sm:inline">agriculture</span>
            <span className="hidden text-label-sm tracking-wider uppercase sm:inline">Soil Station Network: Online</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="rounded-full bg-surface-container-high px-3 py-0.5 text-sm text-on-surface-variant lg:hidden">{section.label}</span>
            <button type="button" aria-label="Notifications" className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-surface-container text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface">
              <span className="material-symbols-outlined text-[20px]">notifications</span>
              <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-secondary"></span>
            </button>
            <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-on-primary">
              <span className="material-symbols-outlined text-[18px]">person</span>
            </span>
          </div>
        </header>

        <main className="w-full px-4 pt-20 pb-28 sm:px-8 sm:py-8 sm:pt-24 lg:pb-12">
          <Outlet />
        </main>
      </div>

      {/* Mobile tab bar */}
      {section.pages.length > 1 && (
        <nav aria-label={`${section.label} pages (mobile)`} className="fixed inset-x-0 bottom-0 z-40 bg-surface-container-low pb-[env(safe-area-inset-bottom)] lg:hidden">
          <ul className="grid" style={{ gridTemplateColumns: `repeat(${section.pages.length}, minmax(0, 1fr))` }}>
            {section.pages.map((page) => (
              <li key={page.path}>
                <NavLink
                  to={page.path}
                  className={({ isActive }) => `flex flex-col items-center gap-0.5 px-1 py-2 text-xs ${isActive ? 'font-semibold text-primary' : 'text-on-surface-variant'}`}
                >
                  <span className="material-symbols-outlined text-[22px]">{materialIcon(page.icon)}</span>
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
