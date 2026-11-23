import { useCallback, useSyncExternalStore } from 'react'

export type Theme = 'dark' | 'light'
const KEY = 'farm.theme'
const listeners = new Set<() => void>()

function read(): Theme {
  try {
    return localStorage.getItem(KEY) === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

let current: Theme = typeof window === 'undefined' ? 'light' : read()

function apply(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  document.documentElement.style.colorScheme = theme
}

if (typeof document !== 'undefined') apply(current)

/** The light or dark theme (light by default); the choice is remembered in this browser. */
export function useTheme() {
  const theme = useSyncExternalStore(
    (fn) => {
      listeners.add(fn)
      return () => listeners.delete(fn)
    },
    () => current,
    () => 'light' as Theme,
  )
  const setTheme = useCallback((next: Theme) => {
    current = next
    apply(next)
    try {
      localStorage.setItem(KEY, next)
    } catch {
      // private mode: the theme still changes until the page is closed
    }
    listeners.forEach((l) => l())
  }, [])
  return { theme, setTheme }
}
