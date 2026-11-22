import { Link } from 'react-router'
import { useAuth } from './authContext'
import { AuthShell } from './AuthShell'

/** Signed in, but only as a delivery partner: the website has nothing for them. */
export function NoAccessPage() {
  const { logout } = useAuth()
  return (
    <AuthShell title="This account is for the app" intro="Delivery partners use the delivery app. The website is for farmers, customers, inspectors and admins.">
      <button type="button" onClick={() => void logout()} className="font-semibold text-primary underline">
        Sign out
      </button>{' '}
      <Link to="/" className="ml-4 underline">
        Back to start
      </Link>
    </AuthShell>
  )
}
