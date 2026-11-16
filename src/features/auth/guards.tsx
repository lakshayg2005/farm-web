import { Navigate, Outlet, useLocation } from 'react-router'
import type { Role } from '@/routes/types'
import { useAuth } from './authContext'
import { homePathFor } from './roles'

function Checking() {
  return (
    <div className="grid min-h-dvh place-items-center text-ink-soft" role="status">
      Checking your sign-in…
    </div>
  )
}

/** Wraps a role section: signed-out users go to /login, people without the role go to their own section. */
export function RequireRole({ role }: { role: Role }) {
  const { status, user } = useAuth()
  const location = useLocation()
  if (status === 'loading') return <Checking />
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />
  if (!user.roles.includes(role)) return <Navigate to={homePathFor(user)} replace />
  return <Outlet />
}

/** Login and register pages: signed-in users skip them. */
export function RedirectIfSignedIn() {
  const { status, user } = useAuth()
  if (status === 'loading') return <Checking />
  if (user) return <Navigate to={homePathFor(user)} replace />
  return <Outlet />
}
