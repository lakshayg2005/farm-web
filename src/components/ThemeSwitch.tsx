import { useTheme } from './theme'

/** Segmented Light / Dark switch for the public header. */
export function ThemeSwitch() {
  const { theme, setTheme } = useTheme()
  const seg = (mode: 'light' | 'dark', icon: string, label: string) => (
    <button
      type="button"
      onClick={() => setTheme(mode)}
      aria-pressed={theme === mode}
      className={`flex items-center gap-1.5 rounded-full px-3 py-1 transition-all duration-200 ${
        theme === mode ? 'bg-surface-container-high font-medium text-on-surface' : 'text-on-surface-variant hover:text-on-surface'
      }`}
    >
      <span className="material-symbols-outlined text-[15px]">{icon}</span>
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
  return (
    <div role="group" aria-label="Theme" className="flex items-center rounded-full border border-border bg-surface-container p-1 text-xs">
      {seg('light', 'light_mode', 'Light')}
      {seg('dark', 'dark_mode', 'Dark')}
    </div>
  )
}

/** One round button that flips the theme, for the workspace top bar. */
export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  return (
    <button
      type="button"
      title="Toggle light / dark mode"
      aria-label="Toggle light or dark mode"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-surface-container text-on-surface-variant transition-all hover:border-outline hover:text-on-surface"
    >
      <span className="material-symbols-outlined text-[18px]">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
    </button>
  )
}
