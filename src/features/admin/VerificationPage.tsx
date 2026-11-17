import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { ApiError } from '@/api/http'
import { adminApi, type UserRow } from './admin'

const message = (e: unknown) => (e instanceof ApiError ? e.message : 'Could not reach the server. Try again.')

export function VerificationPage() {
  const waiting = useQuery({ queryKey: ['farmers', 'waiting'], queryFn: () => adminApi.farmers(false) })

  if (waiting.isPending) return <p className="mt-8 text-ink-soft">Loading farmers…</p>
  if (waiting.isError)
    return (
      <p role="alert" className="mt-8 font-semibold text-red-700">
        Could not load the farmers. Refresh to try again.
      </p>
    )
  if (waiting.data.items.length === 0)
    return <p className="mt-8 text-ink-soft">No farmers are waiting. New farmer sign-ups appear here.</p>
  return (
    <ul className="mt-8 max-w-3xl space-y-3">
      {waiting.data.items.map((farmer) => (
        <li key={farmer.id}>
          <FarmerRow farmer={farmer} />
        </li>
      ))}
    </ul>
  )
}

function FarmerRow({ farmer }: { farmer: UserRow }) {
  const queryClient = useQueryClient()
  const [error, setError] = useState<string>()
  const verify = useMutation({
    mutationFn: () => adminApi.verifyFarmer(farmer.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['farmers'] }),
    onError: (e) => setError(message(e)),
  })
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-white px-4 py-3">
      <div>
        <p className="font-semibold">{farmer.name}</p>
        <p className="text-sm text-ink-soft">
          {farmer.phone}
          {farmer.email ? ` · ${farmer.email}` : ''} · joined {new Date(farmer.createdAt).toLocaleDateString('en-IN')}
          {farmer.phoneVerified ? '' : ' · phone not verified'}
        </p>
        {error && (
          <p role="alert" className="mt-1 text-sm font-semibold text-red-700">
            {error}
          </p>
        )}
      </div>
      <button
        type="button"
        disabled={verify.isPending}
        onClick={() => {
          setError(undefined)
          verify.mutate()
        }}
        className="rounded-lg bg-indigo px-4 py-2 font-semibold text-white disabled:opacity-60"
      >
        {verify.isPending ? 'Verifying…' : `Verify ${farmer.name}`}
      </button>
    </div>
  )
}
