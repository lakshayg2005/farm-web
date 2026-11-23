import { useEffect, type ReactNode } from 'react'
import { SiteHeader } from '@/components/SiteHeader'

export function AuthShell({ title, intro, children }: { title: string; intro: string; children: ReactNode }) {
  useEffect(() => {
    document.title = `${title} | Farm Platform`
  }, [title])
  return (
    <>
      <SiteHeader />
      <div className="flex min-h-[calc(100vh-4.5rem)] items-center justify-center bg-black px-6 py-16 text-white">
        <div className="w-full max-w-md">
          <h1 className="text-4xl font-bold">{title}</h1>
          <p className="mt-3 text-gray-400">{intro}</p>
          <div className="mt-10">{children}</div>
        </div>
      </div>
    </>
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
      <label htmlFor={id} className="block text-sm font-medium text-gray-300">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
        className="mt-2 w-full rounded-xl border border-gray-800 bg-transparent px-5 py-4 outline-none focus:border-primary"
        {...input}
      />
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1 text-sm text-ink-soft">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1 text-sm font-semibold text-red-400">
          {error}
        </p>
      )}
    </div>
  )
}

export const primaryButton =
  'w-full rounded-xl bg-primary py-4 font-semibold text-on-primary hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50'
