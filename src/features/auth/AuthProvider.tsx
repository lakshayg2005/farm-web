import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { api, setAuthHooks } from '@/api/http'
import { AuthContext, type AuthValue, type Status } from './authContext'
import { session } from './session'
import type { OtpRequestResponse, TokenResponse, User } from './types'

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [state, setState] = useState<{ status: Status; user: User | null }>({
    status: session.refreshToken ? 'loading' : 'signedOut',
    user: null,
  })
  /** All callers that hit a 401 at the same moment share one refresh: each refresh token works once. */
  const inflight = useRef<Promise<string | null> | null>(null)

  const accept = useCallback((tokens: TokenResponse) => {
    session.accessToken = tokens.accessToken
    session.refreshToken = tokens.refreshToken
    setState({ status: 'signedIn', user: tokens.user })
    return tokens.user
  }, [])

  const endSession = useCallback(() => {
    session.clear()
    setState({ status: 'signedOut', user: null })
    queryClient.clear()
  }, [queryClient])

  const refresh = useCallback(() => {
    inflight.current ??= (async () => {
      const refreshToken = session.refreshToken
      if (!refreshToken) return null
      try {
        const tokens = await api<TokenResponse>('/identity/refresh', { method: 'POST', body: { refreshToken }, anonymous: true })
        accept(tokens)
        return tokens.accessToken
      } catch {
        endSession()
        return null
      } finally {
        inflight.current = null
      }
    })()
    return inflight.current
  }, [accept, endSession])

  useEffect(() => {
    setAuthHooks({ getAccessToken: () => session.accessToken, refresh })
    if (session.refreshToken && !session.accessToken) void refresh()
  }, [refresh])

  const value = useMemo<AuthValue>(
    () => ({
      ...state,
      login: async (phone, password) =>
        accept(await api<TokenResponse>('/identity/login', { method: 'POST', body: { phone, password }, anonymous: true })),
      // Register answers with the new user only (no tokens): the OTP step that follows signs in.
      register: (input) => {
        const { email, ...rest } = input
        return api<User>('/identity/register', {
          method: 'POST',
          body: { ...rest, ...(email ? { email } : {}) },
          anonymous: true,
        })
      },
      requestOtp: (phone) => api<OtpRequestResponse>('/identity/otp/request', { method: 'POST', body: { phone }, anonymous: true }),
      verifyOtp: async (phone, code) =>
        accept(await api<TokenResponse>('/identity/otp/verify', { method: 'POST', body: { phone, code }, anonymous: true })),
      logout: async () => {
        const refreshToken = session.refreshToken
        endSession()
        if (refreshToken) {
          try {
            await api('/identity/logout', { method: 'POST', body: { refreshToken }, anonymous: true })
          } catch {
            // already signed out locally; the server session expires on its own
          }
        }
      },
    }),
    [state, accept, endSession],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
