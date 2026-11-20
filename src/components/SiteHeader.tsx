import { useState } from 'react'
import { Link, NavLink } from 'react-router'
import { useAuth } from '@/features/auth/authContext'
import { homePathFor } from '@/features/auth/roles'
import { BrandMark } from './BrandMark'

const links = [
  { to: '/', label: 'Home' },
  { to: '/catalog', label: 'Fresh produce' },
  { to: '/customer/plots', label: 'Reserve farmland' },
  { to: '/#how', label: 'How it works' },
  { to: '/team', label: 'Our team' },
]

/** Top navigation for the public pages (home, catalog, team). */
/** Always the black bar, as on AINow. */
export function SiteHeader() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)
  const linkClass = ({ isActive }: { isActive: boolean }) => (isActive ? 'text-white' : 'text-gray-400 hover:text-white')

  return (
    <nav className="border-b border-gray-800 bg-black py-4 text-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6">
        <BrandMark />

        <div className="hidden items-center gap-8 md:flex">
          {links.map((l) =>
            l.to.includes('#') ? (
              // a hash link is never "active": NavLink would light it up on the home page
              <Link key={l.to} to={l.to} className="text-gray-400 hover:text-white">
                {l.label}
              </Link>
            ) : (
              <NavLink key={l.to} to={l.to} className={linkClass} end>
                {l.label}
              </NavLink>
            ),
          )}
        </div>

        <div className="flex items-center gap-3 md:gap-4">
          {user ? (
            <>
              <Link to={homePathFor(user)} className="hidden max-w-[10rem] truncate text-sm text-gray-400 hover:text-white sm:inline">
                {user.name}
              </Link>
              <button
                type="button"
                onClick={() => {
                  close()
                  void logout()
                }}
                className="rounded-lg border border-gray-700 px-4 py-2 text-sm font-medium text-white hover:bg-gray-900"
              >
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" onClick={close} className="rounded-lg bg-white px-5 py-2 font-medium text-black hover:bg-gray-200">
              Login
            </Link>
          )}

          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-label={open ? 'Close menu' : 'Open menu'}
            className="rounded-lg border border-gray-800 p-2 text-gray-300 hover:text-white md:hidden"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              {open ? <path d="M5 5l10 10M15 5L5 15" /> : <path d="M3 6h14M3 10h14M3 14h14" />}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div aria-label="Main mobile" role="navigation" className="mx-auto mt-4 flex max-w-7xl flex-col gap-1 border-t border-gray-800 px-6 pt-3 md:hidden">
          {links.map((l) => (
            <Link key={l.to} to={l.to} onClick={close} className="py-2 text-gray-400 hover:text-white">
              {l.label}
            </Link>
          ))}
          {!user && (
            <Link to="/register" onClick={close} className="py-2 text-gray-400 hover:text-white">
              Register
            </Link>
          )}
        </div>
      )}
    </nav>
  )
}
