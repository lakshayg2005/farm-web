import { createContext, useContext } from 'react'
import type { OtpRequestResponse, RegisterInput, User } from './types'

export type Status = 'loading' | 'signedOut' | 'signedIn'

export interface AuthValue {
  status: Status
  user: User | null
  login: (phone: string, password: string) => Promise<User>
  register: (input: RegisterInput) => Promise<User>
  requestOtp: (phone: string) => Promise<OtpRequestResponse>
  verifyOtp: (phone: string, code: string) => Promise<User>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthValue | null>(null)

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) throw new Error('useAuth must be used inside <AuthProvider>')
  return value
}
