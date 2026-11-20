import '@testing-library/jest-dom/vitest'

// jsdom has no matchMedia; Motion reads it for prefers-reduced-motion.
if (!window.matchMedia) {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList
}

// jsdom has no IntersectionObserver; the scroll-in animations (motion's whileInView) need one.
class NoopIntersectionObserver {
  readonly root = null
  readonly rootMargin = ''
  readonly thresholds = []
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return []
  }
}
globalThis.IntersectionObserver ??= NoopIntersectionObserver as unknown as typeof IntersectionObserver

// findBy*/waitFor give up after 1 s by default, which is too tight when the whole suite runs on a
// busy machine (tests then fail at random). 5 s keeps them reliable without slowing passing tests.
import { configure } from '@testing-library/react'
configure({ asyncUtilTimeout: 5000 })
