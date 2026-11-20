import { useEffect, type ReactNode } from 'react'
import { BrandMark } from '@/components/BrandMark'

export function AuthShell({ title, intro, children }: { title: string; intro: string; children: ReactNode }) {
  useEffect(() => {
    document.title = `${title} | Farm Platform`
  }, [title])
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_1.05fr]">
      <div className="flex flex-col px-4 pt-6 pb-12 sm:px-10 lg:px-16 lg:pt-10">
        <BrandMark />
        <div className="my-auto w-full max-w-md pt-12 lg:pt-0">
          <h1 className="font-display text-[2.4rem] leading-[1.08]">{title}</h1>
          <p className="mt-3 text-lg text-ink-soft">{intro}</p>
          <div className="mt-8">{children}</div>
        </div>
      </div>
      <aside className="mesh relative hidden overflow-hidden p-10 text-white lg:flex lg:flex-col lg:justify-end">
        <p className="absolute top-10 left-10 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-lime">
          🌱 Fresh from verified farms
        </p>
        <div className="relative grid max-w-md gap-3">
          {[
            ['🧑‍🌾', 'Farmers', 'List produce, open plots for the season and get paid on delivery.'],
            ['🛒', 'Customers', 'Buy fresh produce or reserve farmland and follow your crop.'],
            ['🔍', 'Inspectors', 'Grade batches on the spot with geo-tagged photos.'],
          ].map(([emoji, name, body]) => (
            <div key={name} className="flex items-start gap-3 rounded-2xl bg-white/95 p-4 text-ink shadow-lg">
              <span className="text-2xl" aria-hidden>
                {emoji}
              </span>
              <span>
                <strong className="block">{name}</strong>
                <span className="text-[0.95rem] text-ink-soft">{body}</span>
              </span>
            </div>
          ))}
        </div>
        <p className="relative mt-8 font-display text-3xl leading-tight">One account for every role on the farm.</p>
      </aside>
    </div>
  )
}

export function Field({
  label,
  error,
  hint,
  ...input
}: { label: string; error?: string; hint?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = input.id ?? input.name
  return (
    <div>
      <label htmlFor={id} className="block font-semibold">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className="mt-1 w-full rounded-xl border border-line bg-white px-3 py-2.5"
        {...input}
      />
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1 text-sm text-ink-soft">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1 text-sm font-semibold text-red-700">
          {error}
        </p>
      )}
    </div>
  )
}

export const primaryButton =
  'w-full rounded-full bg-indigo px-5 py-2.5 font-semibold text-white shadow-sm transition-colors hover:bg-forest transition-opacity disabled:opacity-60'
