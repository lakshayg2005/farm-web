import { useState } from 'react'
import { Link, NavLink } from 'react-router'
import { useAuth } from '@/features/auth/authContext'
import { homePathFor } from '@/features/auth/roles'
import { LanguageSwitch } from '@/i18n/I18nProvider'
import { BrandMark } from './BrandMark'
import { ThemeSwitch } from './ThemeSwitch'

const links = [
  { to: '/', label: 'Home' },
  { to: '/catalog', label: 'Fresh produce' },
  { to: '/reserve-farmland', label: 'Reserve farmland' },
  { to: '/how-it-works', label: 'How it works' },
  { to: '/team', label: 'Our collective' },
]

/** Top navigation for the public pages: a fixed, blurred bar over the page. */
export function SiteHeader() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)
  const hub = user ? homePathFor(user) : '/login'
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `relative text-sm transition-colors ${
      isActive
        ? 'font-semibold text-on-surface after:absolute after:-bottom-1 after:right-0 after:left-0 after:h-0.5 after:bg-primary'
        : 'text-on-surface-variant hover:text-on-surface'
    }`

  return (
    <>
    <header className="fixed inset-x-0 top-0 z-50 border-b border-border bg-header backdrop-blur-md transition-colors">
      <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between gap-6 px-6 lg:px-12">
        <BrandMark />

        <nav aria-label="Main" className="hidden items-center gap-8 lg:flex">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} className={linkClass} end={l.to === '/'}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <ThemeSwitch />
          <LanguageSwitch className="hidden md:flex" />
          <Link
            to={hub}
            className="hidden items-center gap-2 rounded-full border border-border px-3.5 py-1.5 text-xs tracking-wide text-on-surface-variant transition-all hover:border-outline hover:text-on-surface md:inline-flex"
          >
            <span className="size-1.5 rounded-full bg-primary" />
            <span>{user ? 'My workspace' : 'Farmer Hub'}</span>
          </Link>
          {user ? (
            <button
              type="button"
              onClick={() => {
                close()
                void logout()
              }}
              className="rounded-full px-4 py-1.5 text-xs font-medium text-on-surface transition-colors hover:bg-surface-container"
            >
              Logout
            </button>
          ) : (
            <Link
              to="/login"
              onClick={close}
              className="rounded-full px-4 py-1.5 text-xs font-medium text-on-surface transition-colors hover:bg-surface-container"
            >
              Sign in
            </Link>
          )}
          <Link to={hub} aria-label="Account" className="grid size-8 shrink-0 place-items-center rounded-full border border-border bg-surface-card text-on-surface-variant">
            {user ? <span className="text-xs font-semibold text-on-surface">{user.name.charAt(0)}</span> : <span className="material-symbols-outlined text-[17px]">person</span>}
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? 'Close menu' : 'Open menu'}
            className="grid size-9 place-items-center rounded-lg border border-border bg-surface-card text-on-surface lg:hidden"
          >
            <span className="material-symbols-outlined text-[22px]">{open ? 'close' : 'menu'}</span>
          </button>
        </div>
      </div>

      {open && (
        <nav aria-label="Main mobile" className="mx-auto flex max-w-[1440px] flex-col gap-1 px-6 pb-4 lg:hidden">
          {links.map((l) => (
            <Link key={l.to} to={l.to} onClick={close} className="rounded-lg px-3 py-2.5 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface">
              {l.label}
            </Link>
          ))}
          {!user && (
            <Link to="/register" onClick={close} className="rounded-lg px-3 py-2.5 text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface">
              Register
            </Link>
          )}
        </nav>
      )}
    </header>
    <div className="h-20" aria-hidden />
    </>
  )
}
