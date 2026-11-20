import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { ApiError } from '@/api/http'
import { Icon } from '@/components/Icon'
import { day, landApi, rupees } from './land'

/** "View agreement": the price, deposit, balance and terms written when the farmer accepted. */
export function AgreementTerms({ reservationId }: { reservationId: string }) {
  const [open, setOpen] = useState(false)
  const agreement = useQuery({
    queryKey: ['agreement', reservationId],
    queryFn: () => landApi.agreement(reservationId),
    enabled: open,
    retry: false,
  })
  return (
    <div className="mt-4">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 font-semibold text-indigo"
      >
        <Icon name="clipboard" className="size-4.5" />
        {open ? 'Hide agreement' : 'View agreement'}
      </button>
      {open &&
        (agreement.isPending ? (
          <p className="mt-2 text-ink-soft">Loading the agreement…</p>
        ) : agreement.isError ? (
          <p className="mt-2 text-ink-soft">
            {agreement.error instanceof ApiError && agreement.error.status === 404
              ? 'This reservation was accepted before agreements were recorded.'
              : 'Could not load the agreement.'}
          </p>
        ) : (
          <section aria-label="Agreement" className="mt-3 rounded-2xl border border-line bg-paper p-4">
            <p className="font-semibold">
              {agreement.data.plotTitle} · {agreement.data.season} season
            </p>
            <p className="text-sm text-ink-soft">
              {day(agreement.data.startDate)} to {day(agreement.data.endDate)} · agreed {day(agreement.data.createdAt)}
            </p>
            <dl className="mt-3 grid grid-cols-3 gap-3">
              {(
                [
                  ['Total', agreement.data.total],
                  ['Deposit', agreement.data.deposit],
                  ['Balance at harvest', agreement.data.balance],
                ] as const
              ).map(([label, value]) => (
                <div key={label} className="rounded-xl bg-surface px-3 py-2">
                  <dt className="text-xs text-ink-soft">{label}</dt>
                  <dd className="font-display text-lg">{rupees(value)}</dd>
                </div>
              ))}
            </dl>
            <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-[0.95rem]">
              {agreement.data.terms.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ol>
          </section>
        ))}
    </div>
  )
}
