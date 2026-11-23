import { useState } from 'react'
import { Link, NavLink } from 'react-router'
import { useAuth } from '@/features/auth/authContext'
import { homePathFor } from '@/features/auth/roles'
import { BrandMark } from './BrandMark'

const links = [
  { to: '/', label: 'Home' },
  { to: '/catalog', label: 'Fresh produce' },
  { to: '/reserve-farmland', label: 'Reserve farmland' },
  { to: '/how-it-works', label: 'How it works' },
  { to: '/team', label: 'Our team' },
]

/** Top navigation for the public pages: a fixed, blurred bar over the page. */
export function SiteHeader() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)
  const hub = user ? homePathFor(user) : '/login'
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `transition-colors ${isActive ? 'font-bold text-primary' : 'text-label-lg text-on-surface-variant hover:text-on-surface'}`

  return (
    <>
    <header className="fixed inset-x-0 top-0 z-50 bg-surface/85 shadow-[0_1px_8px_rgba(0,0,0,0.25)] backdrop-blur-xl">
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
          <Link
            to={hub}
            className="hidden items-center gap-2 rounded-full bg-surface-container-high px-3 py-1.5 text-label-md text-on-surface-variant transition-colors hover:bg-surface-container-highest hover:text-on-surface sm:inline-flex"
          >
            <span className="size-2 animate-pulse rounded-full bg-primary" />
            <span>{user ? 'My workspace' : 'Get started'}</span>
          </Link>
          {user ? (
            <button
              type="button"
              onClick={() => {
                close()
                void logout()
              }}
              className="rounded-xl bg-surface-container-high px-4 py-2 text-label-lg text-on-surface transition-colors hover:bg-surface-container-highest"
            >
              Logout
            </button>
          ) : (
            <Link
              to="/login"
              onClick={close}
              className="rounded-xl bg-surface-container-high px-4 py-2 text-label-lg text-on-surface transition-colors hover:bg-surface-container-highest"
            >
              Login
            </Link>
          )}
          <Link to={hub} aria-label="Account" className="grid size-8 shrink-0 place-items-center rounded-full bg-primary font-bold text-on-primary">
            {user ? user.name.charAt(0) : <span className="material-symbols-outlined text-[18px]">person</span>}
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={open ? 'Close menu' : 'Open menu'}
            className="grid size-9 place-items-center rounded-lg bg-surface-container-high text-on-surface lg:hidden"
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
