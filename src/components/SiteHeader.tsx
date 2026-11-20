import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { Link, NavLink } from 'react-router'
import { useAuth } from '@/features/auth/authContext'
import { homePathFor } from '@/features/auth/roles'
import { BrandMark } from './BrandMark'
import { Icon } from './Icon'

const links = [
  { to: '/catalog', label: 'Fresh produce' },
  { to: '/customer/plots', label: 'Reserve farmland' },
  { to: '/#how', label: 'How it works' },
  { to: '/team', label: 'Our team' },
]

/** Top navigation for the public pages (home, catalog, team). */
export function SiteHeader({ tone = 'dark' }: { tone?: 'dark' | 'light' }) {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const light = tone === 'light'
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `rounded-full px-3.5 py-1.5 text-[0.95rem] font-medium transition-colors ${
      light
        ? isActive
          ? 'bg-white/15 text-white'
          : 'text-white/80 hover:bg-white/10 hover:text-white'
        : isActive
          ? 'bg-ink/5 text-ink'
          : 'text-ink-soft hover:bg-ink/5 hover:text-ink'
    }`

  return (
    <header className="relative z-30">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between gap-4 px-4 sm:px-8">
        <BrandMark tone={tone} />
        <nav aria-label="Main" className="hidden items-center gap-1 md:flex">
          {links.map((l) =>
            l.to.includes('#') ? (
              // a hash link is never "active": NavLink would light it up on the home page
              <Link key={l.to} to={l.to} className={linkClass({ isActive: false })}>
                {l.label}
              </Link>
            ) : (
              <NavLink key={l.to} to={l.to} className={linkClass} end>
                {l.label}
              </NavLink>
            ),
          )}
        </nav>
        <div className="hidden items-center gap-2 md:flex">
          {user ? (
            <>
              <Link to={homePathFor(user)} className={light ? 'btn-ghost !border-white/20 !bg-white/10 !text-white' : 'btn-ghost'}>
                <span className="grid size-6 place-items-center rounded-full bg-lime text-xs font-bold text-forest-deep">
                  {user.name.charAt(0)}
                </span>
                {user.name}
              </Link>
              <button
                type="button"
                onClick={() => void logout()}
                className={`px-2 text-sm font-medium ${light ? 'text-white/75 hover:text-white' : 'text-ink-soft hover:text-ink'}`}
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className={`rounded-full px-4 py-2 font-semibold ${light ? 'text-white hover:bg-white/10' : 'hover:bg-ink/5'}`}
              >
                Sign in
              </Link>
              <Link to="/register" className="btn-primary !py-2">
                Get started
              </Link>
            </>
          )}
        </div>
        <button
          type="button"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className={`grid size-10 place-items-center rounded-full md:hidden ${light ? 'text-white hover:bg-white/10' : 'hover:bg-ink/5'}`}
        >
          <Icon name={open ? 'close' : 'sliders'} className="size-5" />
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            aria-label="Main mobile"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            className="card absolute inset-x-4 top-16 p-3 md:hidden"
          >
            <ul className="grid gap-1">
              {links.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} onClick={() => setOpen(false)} className="block rounded-xl px-4 py-2.5 font-medium hover:bg-paper">
                    {l.label}
                  </Link>
                </li>
              ))}
              <li className="mt-2 border-t border-line pt-3">
                {user ? (
                  <Link to={homePathFor(user)} className="btn-primary w-full">
                    Open my dashboard
                  </Link>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <Link to="/login" className="btn-ghost">
                      Sign in
                    </Link>
                    <Link to="/register" className="btn-primary">
                      Get started
                    </Link>
                  </div>
                )}
              </li>
            </ul>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  )
}
