import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { vi } from 'vitest'
import { session } from '@/features/auth/session'
import type { User, UserRole } from '@/features/auth/types'
import { routes } from '@/routes/routes'

export function makeUser(roles: UserRole[]): User {
  return { id: 'u1', name: 'Asha Verma', phone: '+919876543210', email: null, roles, phoneVerified: true, farmerVerified: false }
}

export function tokens(roles: UserRole[]) {
  return { accessToken: 'access-1', refreshToken: 'refresh-2', expiresIn: 900, tokenType: 'bearer', user: makeUser(roles) }
}

export function jsonResponse(body: unknown, status = 200) {
  return new Response(status === 204 ? null : JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
}

/** Replaces fetch with a handler keyed by "METHOD /path" (the part after the API base URL). */
export function mockApi(handlers: Record<string, (body: unknown) => Response | Promise<Response>>) {
  const calls: { key: string; body: unknown; auth: string | null }[] = []
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const path = new URL(String(input), 'http://x').pathname.replace(/^\/api\/v1/, '')
    const key = `${init?.method ?? 'GET'} ${path}`
    const body = init?.body ? JSON.parse(String(init.body)) : undefined
    calls.push({ key, body, auth: new Headers(init?.headers).get('Authorization') })
    const handler = handlers[key]
    if (!handler) return jsonResponse({ error: { code: 'not_found', message: `unmocked ${key}` } }, 404)
    return handler(body)
  })
  vi.stubGlobal('fetch', fetchMock)
  return calls
}

/** Pretends the browser already holds a session: the first thing the app does is swap the refresh token. */
export function signedInAs(roles: UserRole[]) {
  session.refreshToken = 'refresh-1'
  return mockApi({ 'POST /identity/refresh': () => jsonResponse(tokens(roles)) })
}

export function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
  return router
}
