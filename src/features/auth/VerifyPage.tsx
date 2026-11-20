import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'
import { ApiError } from '@/api/http'
import { useAuth } from './authContext'
import { AuthShell, Field, primaryButton } from './AuthShell'
import { homePathFor } from './roles'

interface VerifyState {
  phone?: string
  devCode?: string | null
  resendAfter?: number
}

/** Phone verification after sign-up. While the backend runs in OTP_DEV_MODE the code is shown on screen (mock SMS). */
export function VerifyPage() {
  const { user, status, verifyOtp, requestOtp } = useAuth()
  const navigate = useNavigate()
  const state = (useLocation().state as VerifyState | null) ?? {}
  const phone = state.phone ?? user?.phone
  const [devCode, setDevCode] = useState(state.devCode)
  const [wait, setWait] = useState(state.resendAfter ?? 0)
  const [code, setCode] = useState('')
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (wait <= 0) return
    const timer = setTimeout(() => setWait((w) => w - 1), 1000)
    return () => clearTimeout(timer)
  }, [wait])

  if (status === 'loading') return null
  if (!phone) return <Navigate to="/login" replace />

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (!/^\d{6}$/.test(code)) return setError('Enter the 6-digit code.')
    setBusy(true)
    setError(undefined)
    try {
      const verified = await verifyOtp(phone!, code)
      navigate(homePathFor(verified), { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reach the server. Try again.')
      setBusy(false)
    }
  }

  async function resend() {
    setError(undefined)
    try {
      const otp = await requestOtp(phone!)
      setDevCode(otp.devCode)
      setWait(otp.resendAfter)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reach the server. Try again.')
    }
  }

  return (
    <AuthShell title="Verify your phone" intro={`We sent a 6-digit code to ${phone}.`}>
      {devCode && (
        <p className="mb-5 rounded-xl border border-gray-800 bg-neutral-950 px-4 py-3 text-sm text-gray-300" role="note">
          Test mode: no SMS is sent. Your code is <strong className="font-mono text-base">{devCode}</strong>.
        </p>
      )}
      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <Field label="Code" name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} error={error} />
        <button type="submit" disabled={busy} className={primaryButton}>
          {busy ? 'Verifying…' : 'Verify'}
        </button>
      </form>
      <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-ink-soft">
        <button type="button" onClick={resend} disabled={wait > 0} className="font-semibold text-indigo underline disabled:text-ink-soft disabled:no-underline">
          {wait > 0 ? `Send a new code in ${wait}s` : 'Send a new code'}
        </button>
        {user && (
          <Link to={homePathFor(user)} className="underline">
            Skip for now
          </Link>
        )}
      </div>
    </AuthShell>
  )
}
