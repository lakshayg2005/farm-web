import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { I18nContext, LANGS, STORAGE_KEY, translate, useI18n, type I18n, type Lang } from './i18n'

function initial(): Lang {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'hi' ? 'hi' : 'en'
  } catch {
    return 'en'
  }
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initial)
  const setLang = useCallback((next: Lang) => {
    setLangState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // private mode: the choice lasts until the tab closes
    }
  }, [])
  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])
  const value = useMemo<I18n>(() => ({ lang, setLang, t: (text, vars) => translate(lang, text, vars) }), [lang, setLang])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

/** Two-button switch, always visible in the shell. */
export function LanguageSwitch({ className = '' }: { className?: string }) {
  const { lang, setLang } = useI18n()
  return (
    <div role="group" aria-label="Language" className={`inline-flex rounded-md border border-line p-0.5 ${className}`}>
      {LANGS.map((l) => (
        <button
          key={l.id}
          type="button"
          lang={l.id}
          aria-pressed={lang === l.id}
          aria-label={l.name}
          onClick={() => setLang(l.id)}
          className={`min-h-7 min-w-8 rounded px-2 text-xs font-semibold transition-colors duration-150 ${
            lang === l.id ? 'bg-surface-container-high text-ink' : 'text-ink-soft hover:text-ink'
          }`}
        >
          {l.short}
        </button>
      ))}
    </div>
  )
}
