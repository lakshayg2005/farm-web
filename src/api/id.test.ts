import { afterEach, describe, expect, it, vi } from 'vitest'
import { newId } from './id'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

describe('newId', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('works when crypto.randomUUID is missing (plain HTTP origin)', () => {
    vi.stubGlobal('crypto', { getRandomValues: crypto.getRandomValues.bind(crypto) })
    expect(newId()).toMatch(UUID)
    expect(newId()).not.toBe(newId())
  })

  it('works with no crypto at all', () => {
    vi.stubGlobal('crypto', undefined)
    expect(newId()).toMatch(UUID)
  })

  it('uses randomUUID when it exists', () => {
    vi.stubGlobal('crypto', { randomUUID: () => 'fixed' })
    expect(newId()).toBe('fixed')
  })
})
