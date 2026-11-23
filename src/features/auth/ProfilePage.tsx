import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router'
import { ApiError } from '@/api/http'
import { SiteHeader } from '@/components/SiteHeader'
import { StatusChip } from '@/components/ui'
import { useI18n } from '@/i18n/i18n'
import { sectionByRole } from '@/routes/sections'
import { useAuth } from './authContext'
import { websiteRoles } from './roles'

/** Who you are on the platform: contact details, which roles you have, and how to get another one. */
export function ProfilePage() {
  const { t } = useI18n()
  const { status, user, updateProfile, addRole, logout } = useAuth()
  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  useEffect(() => {
    document.title = `${t('Profile')} | Farm Platform`
  }, [t])

  if (status === 'loading') return <div className="grid min-h-dvh place-items-center text-ink-soft" role="status">{t('Loading…')}</div>
  if (!user) return <Navigate to="/login" replace />

  const roles = websiteRoles(user)
  const can = (['farmer', 'customer'] as const).filter((r) => !user.roles.includes(r))
  const message = (e: unknown) => (e instanceof ApiError ? e.message : t('Could not reach the server. Try again.'))

  async function save(e: FormEvent) {
    e.preventDefault()
    setError('')
    setNotice('')
    if (!name.trim()) return setError(t('Enter your name.'))
    setBusy(true)
    try {
      await updateProfile({ name: name.trim(), email: email.trim() || null })
      setNotice(t('Saved.'))
    } catch (err) {
      setError(message(err))
    } finally {
      setBusy(false)
    }
  }

  async function become(role: 'farmer' | 'customer') {
    setError('')
    setNotice('')
    setBusy(true)
    try {
      await addRole(role)
      setNotice(t(role === 'farmer' ? 'You are now a farmer. An admin verifies new farmers before they can sell.' : 'You are now a customer.'))
    } catch (err) {
      setError(message(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto min-h-dvh max-w-2xl px-4 pb-16 sm:px-8">
      <SiteHeader />
      <h1 className="mt-6 font-display text-[2.4rem] leading-none">{t('Profile')}</h1>

      <form onSubmit={save} noValidate className="card mt-6 space-y-4 p-4 sm:p-6">
        <label className="grid gap-1 text-sm font-semibold">
          {t('Name')}
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} autoComplete="name" className="input font-normal" />
        </label>
        <div className="grid gap-1 text-sm font-semibold">
          {t('Phone')}
          <p className="flex items-center gap-2 font-normal">
            {user.phone}
            <StatusChip tone={user.phoneVerified ? 'good' : 'warn'}>{user.phoneVerified ? t('Verified') : t('Not verified')}</StatusChip>
          </p>
        </div>
        <label className="grid gap-1 text-sm font-semibold">
          {t('Email (optional)')}
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className="input font-normal" />
        </label>
        {notice && (
          <p role="status" className="font-semibold text-primary">
            {notice}
          </p>
        )}
        {error && (
          <p role="alert" className="font-semibold text-danger">
            {error}
          </p>
        )}
        <button type="submit" disabled={busy} className="btn-primary">
          {busy ? t('Saving…') : t('Save changes')}
        </button>
      </form>

      <section className="card mt-6 p-4 sm:p-6" aria-labelledby="roles-h">
        <h2 id="roles-h" className="font-display text-2xl">
          {t('Your roles')}
        </h2>
        <ul className="mt-3 space-y-2">
          {roles.map((r) => (
            <li key={r} className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-semibold">
                {t(sectionByRole[r].label)}
                {r === 'farmer' && (
                  <span className="ml-2">
                    <StatusChip tone={user.farmerVerified ? 'good' : 'warn'}>{user.farmerVerified ? t('Verified farmer') : t('Waiting for verification')}</StatusChip>
                  </span>
                )}
              </span>
              <Link to={`/${r}`} className="btn-secondary">
                {t('Open {section}', { section: t(sectionByRole[r].label) })}
              </Link>
            </li>
          ))}
        </ul>
        {can.length > 0 && (
          <div className="mt-5 border-t border-line pt-4">
            <p className="text-ink-soft">{t('Want to do more? Add a role to this account.')}</p>
            <div className="mt-2 flex flex-wrap gap-3">
              {can.map((r) => (
                <button key={r} type="button" disabled={busy} onClick={() => void become(r)} className="btn-secondary">
                  {t(r === 'farmer' ? 'Also sell as a farmer' : 'Also buy as a customer')}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      <button type="button" onClick={() => void logout()} className="btn-secondary mt-6">
        {t('Sign out')}
      </button>
    </div>
  )
}
