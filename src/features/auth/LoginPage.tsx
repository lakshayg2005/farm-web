import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { ApiError } from '@/api/http'
import { useI18n } from '@/i18n/i18n'
import { useAuth } from './authContext'
import { AuthShell, Field, primaryButton } from './AuthShell'
import { toE164 } from './phone'
import { homePathFor } from './roles'

export function LoginPage() {
  const { login } = useAuth()
  const { t } = useI18n()
  const navigate = useNavigate()
  const from = (useLocation().state as { from?: string } | null)?.from
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ phone?: string; password?: string; form?: string }>({})
  const [busy, setBusy] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const e164 = toE164(phone)
    const next = {
      phone: e164 ? undefined : 'Enter a 10-digit mobile number, or a number with country code like +91 98765 43210.',
      password: password ? undefined : 'Enter your password.',
    }
    setErrors(next)
    if (next.phone || next.password || !e164) return
    setBusy(true)
    try {
      const user = await login(e164, password)
      navigate(from && from !== '/login' ? from : homePathFor(user), { replace: true })
    } catch (err) {
      setErrors({ form: err instanceof ApiError ? err.message : 'Could not reach the server. Try again.' })
      setBusy(false)
    }
  }

  return (
    <AuthShell title="Sign in" intro="Use the phone number and password you registered with.">
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <Field label="Phone number" name="phone" type="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} error={errors.phone} />
        <Field label="Password" name="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} />
        {errors.form && (
          <p role="alert" className="text-sm font-medium text-danger">
            {t(errors.form)}
          </p>
        )}
        <button type="submit" disabled={busy} className={primaryButton}>
          {busy ? t('Signing in…') : t('Sign in')}
        </button>
      </form>
      <div className="mt-8 border-t border-border pt-6">
        <p className="text-sm text-ink-soft">{t('New here?')}</p>
        <Link to="/register" className="btn-secondary mt-2 w-full min-h-11">
          {t('Create an account')}
        </Link>
      </div>
    </AuthShell>
  )
}
