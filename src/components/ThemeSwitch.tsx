import { useI18n } from '@/i18n/i18n'
import { useTheme } from './theme'

/** A small text button that flips between the light and dark theme. */
export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, setTheme } = useTheme()
  const { t } = useI18n()
  return (
    <button
      type="button"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className={`rounded-md px-2 py-1 text-sm whitespace-nowrap text-on-surface-variant transition-colors hover:bg-surface-container hover:text-on-surface ${className}`}
    >
      {theme === 'dark' ? t('Light theme') : t('Dark theme')}
    </button>
  )
}
