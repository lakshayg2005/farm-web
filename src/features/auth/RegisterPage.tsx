import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { ApiError } from '@/api/http'
import { useI18n } from '@/i18n/i18n'
import { useAuth } from './authContext'
import { AuthShell, Field, primaryButton } from './AuthShell'
import { toE164 } from './phone'
import type { UserRole } from './types'

/** Inspectors and admins are created by an admin, delivery partners use the app. */
const choices: { role: UserRole; label: string; body: string }[] = [
  { role: 'farmer', label: 'Farmer', body: 'Sell produce and rent out plots' },
  { role: 'customer', label: 'Customer', body: 'Buy produce and reserve plots' },
]

export function RegisterPage() {
  const { register, requestOtp } = useAuth()
  const { t } = useI18n()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', phone: '', email: '', password: '' })
  const [roles, setRoles] = useState<UserRole[]>(['customer'])
  const [errors, setErrors] = useState<Record<string, string | undefined>>({})
  const [busy, setBusy] = useState(false)

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [key]: e.target.value })
  const toggle = (role: UserRole) => setRoles(roles.includes(role) ? roles.filter((r) => r !== role) : [...roles, role])

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    const e164 = toE164(form.phone)
    const next = {
      name: form.name.trim() ? undefined : 'Enter your name.',
      phone: e164 ? undefined : 'Enter a 10-digit mobile number, or a number with country code like +91 98765 43210.',
      password: form.password.length >= 8 ? undefined : 'Use at least 8 characters.',
      roles: roles.length ? undefined : 'Choose at least one.',
    }
    setErrors(next)
    if (Object.values(next).some(Boolean) || !e164) return
    setBusy(true)
    try {
      await register({ name: form.name.trim(), phone: e164, password: form.password, email: form.email.trim() || undefined, roles })
      const otp = await requestOtp(e164)
      navigate('/verify', { state: { phone: e164, devCode: otp.devCode, resendAfter: otp.resendAfter } })
    } catch (err) {
      setErrors({ form: err instanceof ApiError ? err.message : 'Could not reach the server. Try again.' })
      setBusy(false)
    }
  }

  return (
    <AuthShell title="Create an account" intro="One account works for buying produce and for reserving land.">
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <Field label="Full name" name="name" autoComplete="name" value={form.name} onChange={set('name')} error={errors.name} />
        <Field label="Phone number" name="phone" type="tel" autoComplete="tel" value={form.phone} onChange={set('phone')} error={errors.phone} />
        <Field label="Email (optional)" name="email" type="email" autoComplete="email" value={form.email} onChange={set('email')} />
        <Field label="Password" name="password" type="password" autoComplete="new-password" hint="At least 8 characters." value={form.password} onChange={set('password')} error={errors.password} />
        <fieldset>
          <legend className="font-semibold">{t('I want to')}</legend>
          <div className="mt-2 space-y-2">
            {choices.map((c) => (
              <label key={c.role} className="flex items-start gap-3 input">
                <input type="checkbox" className="mt-1.5" checked={roles.includes(c.role)} onChange={() => toggle(c.role)} />
                <span>
                  <span className="block font-semibold">{t(c.label)}</span>
                  <span className="text-sm text-ink-soft">{t(c.body)}</span>
                </span>
              </label>
            ))}
          </div>
          {errors.roles && (
            <p role="alert" className="mt-1 text-sm font-semibold text-danger">
              {t(errors.roles)}
            </p>
          )}
        </fieldset>
        {errors.form && (
          <p role="alert" className="font-semibold text-danger">
            {t(errors.form)}
          </p>
        )}
        <button type="submit" disabled={busy} className={primaryButton}>
          {busy ? t('Creating account…') : t('Create account')}
        </button>
      </form>
      <p className="mt-6 text-ink-soft">
        {t('Already registered?')}{' '}
        <Link to="/login" className="font-semibold text-primary underline">
          {t('Sign in')}
        </Link>
      </p>
    </AuthShell>
  )
}
