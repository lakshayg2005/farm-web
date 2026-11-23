import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { ApiError } from '@/api/http'
import { ErrorState, ListSkeleton, StatusChip } from '@/components/ui'
import { api } from '@/api/http'
import { useI18n } from '@/i18n/i18n'
import { adminApi, type UserPage, type UserRow } from './admin'

const ROLES = ['all', 'customer', 'farmer', 'admin', 'delivery'] as const
const when = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

/** Everyone on the platform: find a person by name or phone, see their roles, verify a farmer. */
export function UsersPage() {
  const { t } = useI18n()
  const [role, setRole] = useState<(typeof ROLES)[number]>('all')
  const [text, setText] = useState('')
  const users = useQuery({
    queryKey: ['users', role],
    queryFn: () => api<UserPage>(`/identity/users?limit=200${role === 'all' ? '' : `&role=${role}`}`),
  })
  const shown = useMemo(() => {
    const needle = text.trim().toLowerCase()
    return (users.data?.items ?? []).filter((u) => !needle || u.name.toLowerCase().includes(needle) || u.phone.includes(needle) || u.email?.toLowerCase().includes(needle))
  }, [users.data, text])

  return (
    <div className="mt-6 max-w-4xl">
      <div className="flex flex-wrap items-end gap-3">
        <label className="min-w-0 flex-1 basis-60">
          <span className="sr-only">{t('Search by name, phone or email')}</span>
          <input type="search" value={text} onChange={(e) => setText(e.target.value)} placeholder={t('Search by name, phone or email')} className="input" />
        </label>
        <div role="group" aria-label={t('Role')} className="flex gap-2 overflow-x-auto">
          {ROLES.map((r) => (
            <button
              key={r}
              type="button"
              aria-pressed={role === r}
              onClick={() => setRole(r)}
              className={`min-h-11 shrink-0 rounded-full border-[1.5px] px-4 text-sm font-semibold ${role === r ? 'border-ink bg-ink text-background' : 'border-line-strong bg-surface-card hover:bg-paper'}`}
            >
              {r === 'all' ? t('All') : t(r === 'admin' ? 'Admin' : r === 'farmer' ? 'Farmer' : r === 'customer' ? 'Customer' : 'Delivery')}
            </button>
          ))}
        </div>
      </div>
      {users.isPending ? (
        <ListSkeleton label="Loading people" />
      ) : users.isError ? (
        <ErrorState title="Could not load people" onRetry={() => void users.refetch()} />
      ) : (
        <>
          <p aria-live="polite" className="mt-4 font-semibold">
            {t(shown.length === 1 ? '{n} person' : '{n} people', { n: shown.length })}
          </p>
          <ul className="mt-3 space-y-2">
            {shown.map((u) => (
              <li key={u.id}>
                <UserLine user={u} />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}

function UserLine({ user: u }: { user: UserRow }) {
  const { t } = useI18n()
  const queryClient = useQueryClient()
  const [error, setError] = useState('')
  const verify = useMutation({
    mutationFn: () => adminApi.verifyFarmer(u.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
    onError: (e) => setError(e instanceof ApiError ? e.message : t('Could not reach the server. Try again.')),
  })
  return (
    <div className="card flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3">
      <div className="min-w-0">
        <p className="font-semibold">{u.name}</p>
        <p className="truncate text-sm text-ink-soft">
          {u.phone}
          {u.email ? ` · ${u.email}` : ''} · {t('joined {d}', { d: when(u.createdAt) })}
        </p>
        <p className="mt-1.5 flex flex-wrap gap-1.5">
          {u.roles.map((r) => (
            <StatusChip key={r} tone={r === 'admin' ? 'info' : 'neutral'}>
              {r}
            </StatusChip>
          ))}
          {u.roles.includes('farmer') && <StatusChip tone={u.farmerVerified ? 'good' : 'warn'}>{u.farmerVerified ? t('Verified farmer') : t('Waiting for verification')}</StatusChip>}
        </p>
        {error && (
          <p role="alert" className="mt-1 text-sm font-semibold text-danger">
            {error}
          </p>
        )}
      </div>
      {u.roles.includes('farmer') && !u.farmerVerified && (
        <button type="button" disabled={verify.isPending} onClick={() => verify.mutate()} className="btn-primary">
          {verify.isPending ? t('Verifying…') : t('Verify farmer')}
        </button>
      )}
    </div>
  )
}
