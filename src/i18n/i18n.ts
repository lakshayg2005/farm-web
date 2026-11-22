import { createContext, useContext } from 'react'
import { HI } from './hi'

export type Lang = 'en' | 'hi'
export const LANGS: readonly { id: Lang; short: string; name: string }[] = [
  { id: 'en', short: 'EN', name: 'English' },
  { id: 'hi', short: 'हि', name: 'हिन्दी' },
]
export const STORAGE_KEY = 'farm.lang'

/** Replaces `{name}` placeholders. Unknown placeholders stay as written so a typo is visible, not silent. */
export function fill(text: string, vars?: Record<string, string | number>): string {
  if (!vars) return text
  return text.replace(/\{(\w+)\}/g, (whole, name: string) => (name in vars ? String(vars[name]) : whole))
}

/**
 * Translates an English sentence. The English text is the key, so the code reads as it did before and a
 * missing Hindi entry falls back to English instead of showing a key or a blank.
 */
export function translate(lang: Lang, text: string, vars?: Record<string, string | number>): string {
  return fill(lang === 'hi' ? (HI[text] ?? text) : text, vars)
}

export interface I18n {
  lang: Lang
  setLang: (lang: Lang) => void
  t: (text: string, vars?: Record<string, string | number>) => string
}

export const I18nContext = createContext<I18n>({ lang: 'en', setLang: () => {}, t: (text, vars) => translate('en', text, vars) })

export const useI18n = () => useContext(I18nContext)
