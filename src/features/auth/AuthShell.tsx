import { useEffect, type ReactNode } from 'react'
import { BrandMark } from '@/components/BrandMark'

export function AuthShell({ title, intro, children }: { title: string; intro: string; children: ReactNode }) {
  useEffect(() => {
    document.title = `${title} | Farm Platform`
  }, [title])
  return (
    <div className="mx-auto min-h-dvh max-w-5xl px-4 pt-5 pb-12 sm:px-8">
      <BrandMark />
      <div className="card mx-auto mt-8 max-w-lg p-6 sm:mt-14 sm:p-9">
        <h1 className="font-display text-[2.4rem] leading-[1.05] sm:text-[2.9rem]">{title}</h1>
        <p className="mt-3 text-ink-soft">{intro}</p>
        <div className="mt-7">{children}</div>
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
      <label htmlFor={id} className="block text-sm font-semibold">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className={`input mt-1.5 ${error ? 'border-danger' : ''}`}
        {...input}
      />
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1.5 text-sm text-ink-soft">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-sm font-semibold text-danger">
          {error}
        </p>
      )}
    </div>
  )
}

export const primaryButton = 'btn-primary w-full min-h-12 text-base'
