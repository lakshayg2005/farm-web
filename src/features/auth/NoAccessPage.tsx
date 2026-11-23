import { useAuth } from './authContext'
import { AuthShell } from './AuthShell'

/** Signed in, but without a website role (a delivery partner, for example): the website has nothing for them. */
export function NoAccessPage() {
  const { logout } = useAuth()
  return (
    <AuthShell title="This account is for the app" intro="Delivery partners use the delivery app. The website is for farmers, customers and admins.">
      <button type="button" onClick={() => void logout()} className="btn-secondary w-full min-h-11">
        Sign out
      </button>
    </AuthShell>
  )
}
