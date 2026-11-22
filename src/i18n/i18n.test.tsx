import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { I18nProvider, LanguageSwitch } from './I18nProvider'
import { fill, translate, useI18n } from './i18n'
import { HI } from './hi'

/** The text of every source file except tests, generated clients and this folder. */
const files = import.meta.glob(['/src/**/*.{ts,tsx}', '!/src/**/*.test.*', '!/src/api/generated/**', '!/src/i18n/**'], {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

describe('translate', () => {
  it('returns the English text for English and for anything without a Hindi entry', () => {
    expect(translate('en', 'Sign in')).toBe('Sign in')
    expect(translate('hi', 'A sentence nobody translated')).toBe('A sentence nobody translated')
  })

  it('translates to Hindi and fills placeholders', () => {
    expect(translate('hi', 'Sign in')).toBe(HI['Sign in'])
    expect(translate('hi', 'Send a new code in {n}s', { n: 12 })).toBe('12 सेकंड में नया कोड भेजें')
    expect(fill('{a} and {b}', { a: 1 })).toBe('1 and {b}')
  })

  it('keeps every placeholder in the Hindi text that the English text has', () => {
    for (const [english, hindi] of Object.entries(HI)) {
      const placeholders = (text: string) => (text.match(/\{\w+\}/g) ?? []).sort().join()
      expect(placeholders(hindi), english).toBe(placeholders(english))
    }
  })
})

describe('coverage', () => {
  it('has a Hindi entry for every t("...") literal in the code', () => {
    const missing = new Set<string>()
    for (const text of Object.values(files)) {
      for (const match of text.matchAll(/\bt\(\s*'((?:[^'\\]|\\.)*)'/g)) {
        const key = match[1]!.replace(/\\'/g, "'")
        if (!(key in HI)) missing.add(key)
      }
    }
    expect([...missing].sort()).toEqual([])
  })
})

function Probe() {
  const { t, lang } = useI18n()
  return (
    <>
      <p>{t('Sign in')}</p>
      <p data-testid="lang">{lang}</p>
      <LanguageSwitch />
    </>
  )
}

describe('language switch', () => {
  beforeEach(() => localStorage.clear())

  it('switches the text, remembers the choice and sets the page language', async () => {
    const { unmount } = render(
      <I18nProvider>
        <Probe />
      </I18nProvider>,
    )
    expect(screen.getByText('Sign in')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'हिन्दी' }))
    expect(screen.getByText(HI['Sign in']!)).toBeInTheDocument()
    expect(document.documentElement.lang).toBe('hi')
    expect(localStorage.getItem('farm.lang')).toBe('hi')

    unmount()
    render(
      <I18nProvider>
        <Probe />
      </I18nProvider>,
    )
    expect(screen.getByTestId('lang')).toHaveTextContent('hi')
  })
})
