import { API_BASE_URL } from './config'

/** The platform's standard error body: { error: { code, message, correlationId, details? } } */
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message)
  }
}

/** Auth wiring lives in features/auth; http.ts only knows how to ask for a token and to renew it. */
interface AuthHooks {
  getAccessToken: () => string | null
  /** Returns a fresh access token, or null if the session is over. */
  refresh: () => Promise<string | null>
}

let hooks: AuthHooks = { getAccessToken: () => null, refresh: async () => null }

export function setAuthHooks(next: AuthHooks) {
  hooks = next
}

interface RequestOptions {
  method?: string
  body?: unknown
  /** Skip the Authorization header and the refresh-on-401 retry (login, register, refresh itself). */
  anonymous?: boolean
  headers?: Record<string, string>
}

async function send(path: string, { method = 'GET', body, anonymous, headers = {} }: RequestOptions, token: string | null) {
  const finalHeaders: Record<string, string> = { Accept: 'application/json', ...headers }
  if (body !== undefined) finalHeaders['Content-Type'] = 'application/json'
  if (token && !anonymous) finalHeaders.Authorization = `Bearer ${token}`
  return fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: finalHeaders,
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

async function toError(response: Response) {
  let code = 'unknown'
  let message = `Request failed (${response.status})`
  let details: unknown
  try {
    const json = await response.json()
    if (json?.error) {
      code = json.error.code ?? code
      message = json.error.message ?? message
      details = json.error.details
    }
  } catch {
    // not JSON: keep the generic message
  }
  return new ApiError(response.status, code, message, details)
}

/**
 * Calls the gateway, e.g. api('/identity/me'). On a 401 it renews the access token once and retries.
 * A 403 FARMER_NOT_VERIFIED is retried once with a fresh token too: the token says whether the farmer
 * is verified, so one issued before an admin verified them is out of date.
 */
export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let response = await send(path, options, hooks.getAccessToken())
  if (response.status === 401 && !options.anonymous) {
    const fresh = await hooks.refresh()
    if (fresh) response = await send(path, options, fresh)
  } else if (response.status === 403 && !options.anonymous) {
    const error = await toError(response.clone())
    if (error.code === 'FARMER_NOT_VERIFIED') {
      const fresh = await hooks.refresh()
      if (fresh) response = await send(path, options, fresh)
    }
  }
  if (!response.ok) throw await toError(response)
  return response.status === 204 ? (undefined as T) : ((await response.json()) as T)
}
