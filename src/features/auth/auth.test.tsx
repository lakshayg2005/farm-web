import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { jsonResponse, makeUser, mockApi, renderAt, signedInAs, tokens } from '@/test/auth'
import { session } from './session'

beforeEach(() => {
  session.clear()
})

describe('route guards', () => {
  it('sends a signed-out visitor to the login page', async () => {
    const router = renderAt('/farmer/listings')
    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/login')
  })

  it('sends a customer away from the farmer section to their own', async () => {
    signedInAs(['customer'])
    const router = renderAt('/farmer/listings')
    await waitFor(() => expect(router.state.location.pathname).toMatch(/^\/customer/))
  })

  it('keeps a signed-in session across reloads by renewing the refresh token', async () => {
    const calls = signedInAs(['farmer'])
    const router = renderAt('/farmer')
    await waitFor(() => expect(router.state.location.pathname).toBe('/farmer/listings'))
    expect(calls[0]).toMatchObject({ key: 'POST /identity/refresh', body: { refreshToken: 'refresh-1' } })
    expect(session.refreshToken).toBe('refresh-2')
  })

  it('signs out and returns to login when the refresh token is rejected', async () => {
    session.refreshToken = 'stale'
    mockApi({ 'POST /identity/refresh': () => jsonResponse({ error: { code: 'unauthorized', message: 'Session expired' } }, 401) })
    const router = renderAt('/customer')
    await waitFor(() => expect(router.state.location.pathname).toBe('/login'))
    expect(session.refreshToken).toBeNull()
  })

  it('tells a delivery-only account that the website is not for them', async () => {
    signedInAs(['delivery'])
    renderAt('/login')
    expect(await screen.findByRole('heading', { name: 'This account is for the app' })).toBeInTheDocument()
  })
})

describe('login', () => {
  it('signs in with a 10-digit number and lands in the role section', async () => {
    const calls = mockApi({ 'POST /identity/login': () => jsonResponse(tokens(['farmer'])) })
    const router = renderAt('/login')
    await userEvent.type(await screen.findByLabelText('Phone number'), '98765 43210')
    await userEvent.type(screen.getByLabelText('Password'), 'secret-pass')
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/farmer/listings'))
    expect(calls[0]!.body).toEqual({ phone: '+919876543210', password: 'secret-pass' })
    expect(session.accessToken).toBe('access-1')
  })

  it('shows the server message when the password is wrong', async () => {
    mockApi({ 'POST /identity/login': () => jsonResponse({ error: { code: 'unauthorized', message: 'Wrong phone or password' } }, 401) })
    renderAt('/login')
    await userEvent.type(await screen.findByLabelText('Phone number'), '9876543210')
    await userEvent.type(screen.getByLabelText('Password'), 'nope')
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(await screen.findByText('Wrong phone or password')).toBeInTheDocument()
  })

  it('validates before calling the server', async () => {
    const calls = mockApi({})
    renderAt('/login')
    await userEvent.click(await screen.findByRole('button', { name: 'Sign in' }))
    expect(screen.getByText(/Enter a 10-digit mobile number/)).toBeInTheDocument()
    expect(calls).toHaveLength(0)
  })
})

describe('register and verify', () => {
  it('registers, requests an OTP and shows the dev code on the verify page', async () => {
    const calls = mockApi({
      'POST /identity/register': () => jsonResponse(makeUser(['customer']), 201), // UserOut: no tokens
      'POST /identity/otp/request': () => jsonResponse({ devCode: '123456', expiresIn: 300, resendAfter: 30 }, 202),
      'POST /identity/otp/verify': () => jsonResponse(tokens(['customer'])),
    })
    const router = renderAt('/register')
    await userEvent.type(await screen.findByLabelText('Full name'), 'Asha Verma')
    await userEvent.type(screen.getByLabelText('Phone number'), '9876543210')
    await userEvent.type(screen.getByLabelText('Password'), 'secret-pass')
    await userEvent.click(screen.getByLabelText(/Farmer/))
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }))

    expect(await screen.findByText('123456')).toBeInTheDocument()
    expect(calls[0]!.body).toEqual({ name: 'Asha Verma', phone: '+919876543210', password: 'secret-pass', roles: ['customer', 'farmer'] })

    await userEvent.type(screen.getByLabelText('Code'), '123456')
    await userEvent.click(screen.getByRole('button', { name: 'Verify' }))
    await waitFor(() => expect(router.state.location.pathname).toMatch(/^\/customer/))
  })

  it('requires a password of 8 characters', async () => {
    const calls = mockApi({})
    renderAt('/register')
    await userEvent.type(await screen.findByLabelText('Full name'), 'Asha')
    await userEvent.type(screen.getByLabelText('Phone number'), '9876543210')
    await userEvent.type(screen.getByLabelText('Password'), 'short')
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }))
    expect(screen.getByText('Use at least 8 characters.')).toBeInTheDocument()
    expect(calls).toHaveLength(0)
  })
})

describe('api client', () => {
  it('renews an expired access token once and retries the request', async () => {
    const { api, setAuthHooks } = await import('@/api/http')
    let renewed = 0
    setAuthHooks({ getAccessToken: () => 'old', refresh: async () => (++renewed, 'new') })
    const seen: (string | null)[] = []
    vi.stubGlobal('fetch', async (_url: RequestInfo | URL, init?: RequestInit) => {
      const auth = new Headers(init?.headers).get('Authorization')
      seen.push(auth)
      return auth === 'Bearer new' ? jsonResponse({ ok: true }) : jsonResponse({ error: { code: 'unauthorized', message: 'expired' } }, 401)
    })
    await expect(api('/identity/me')).resolves.toEqual({ ok: true })
    expect(renewed).toBe(1)
    expect(seen).toEqual(['Bearer old', 'Bearer new'])
  })
})
