/**
 * The access token (15 min) lives only in memory. The refresh token (7 days, single use) is kept in
 * localStorage so a reload keeps you signed in. Anything in localStorage can be read by injected
 * scripts, so we never log tokens and rely on the single-use refresh rotation to limit a leak.
 */
const KEY = 'farm.refreshToken'

let accessToken: string | null = null

export const session = {
  get accessToken() {
    return accessToken
  },
  set accessToken(token: string | null) {
    accessToken = token
  },
  get refreshToken(): string | null {
    try {
      return localStorage.getItem(KEY)
    } catch {
      return null
    }
  },
  set refreshToken(token: string | null) {
    try {
      if (token) localStorage.setItem(KEY, token)
      else localStorage.removeItem(KEY)
    } catch {
      // storage blocked: the user simply has to sign in again after a reload
    }
  },
  clear() {
    accessToken = null
    this.refreshToken = null
  },
}
