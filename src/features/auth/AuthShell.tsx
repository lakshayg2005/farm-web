import { useEffect, type ReactNode } from 'react'
import { BrandMark } from '@/components/BrandMark'
import { CropRows } from '@/components/CropRows'

export function AuthShell({ title, intro, children }: { title: string; intro: string; children: ReactNode }) {
  useEffect(() => {
    document.title = `${title} | Farm Platform`
  }, [title])
  return (
    <div className="mx-auto grid min-h-dvh max-w-5xl content-start gap-10 px-4 pt-6 pb-12 sm:px-8 lg:grid-cols-[1fr_24rem] lg:pt-10">
      <div className="lg:col-span-2">
        <BrandMark />
      </div>
      <div className="max-w-md">
        <h1 className="font-display text-[2.2rem] leading-[1.1]">{title}</h1>
        <p className="mt-3 text-ink-soft">{intro}</p>
        <div className="mt-8">{children}</div>
      </div>
      <div className="relative hidden min-h-64 overflow-hidden rounded-xl lg:block" style={{ '--role': 'var(--color-leaf)' } as React.CSSProperties}>
        <CropRows className="absolute inset-0" />
      </div>
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
        className="mt-1 w-full rounded-lg border border-line bg-white px-3 py-2.5"
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
  'w-full rounded-lg bg-indigo px-4 py-2.5 font-semibold text-white transition-opacity disabled:opacity-60'
