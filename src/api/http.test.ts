import { afterEach, describe, expect, it, vi } from 'vitest'
import { api, ApiError, setAuthHooks } from './http'

const notVerified = () =>
  new Response(JSON.stringify({ error: { code: 'FARMER_NOT_VERIFIED', message: 'Waiting for an admin' } }), {
    status: 403,
    headers: { 'Content-Type': 'application/json' },
  })
const created = () => new Response(JSON.stringify({ id: 'farm-1' }), { status: 201, headers: { 'Content-Type': 'application/json' } })

afterEach(() => vi.unstubAllGlobals())

describe('a farmer verified after signing in', () => {
  it('gets a fresh token (which says verified) and the request is retried once', async () => {
    const auth = (init?: RequestInit) => (init?.headers as Record<string, string>).Authorization
    const fetchMock = vi.fn(async (_url: string, init?: RequestInit) => (auth(init) === 'Bearer new' ? created() : notVerified()))
    vi.stubGlobal('fetch', fetchMock)
    const refresh = vi.fn(async () => 'new')
    setAuthHooks({ getAccessToken: () => 'old', refresh })

    await expect(api('/catalog/farms', { method: 'POST', body: {} })).resolves.toEqual({ id: 'farm-1' })
    expect(refresh).toHaveBeenCalledOnce()
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('still not verified: the error reaches the page', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => notVerified()))
    setAuthHooks({ getAccessToken: () => 'old', refresh: async () => 'new' })

    const error = await api('/catalog/farms', { method: 'POST', body: {} }).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).code).toBe('FARMER_NOT_VERIFIED')
  })
})
