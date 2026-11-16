import type { Role as SectionRole } from '@/routes/types'

/** Roles the identity service knows. The website serves all but `delivery` (that is the delivery app). */
export type UserRole = SectionRole | 'delivery'

export interface User {
  id: string
  name: string
  phone: string
  email: string | null
  roles: UserRole[]
  phoneVerified: boolean
  farmerVerified: boolean
}

export interface TokenResponse {
  accessToken: string
  refreshToken: string
  expiresIn: number
  user: User
}

export interface OtpRequestResponse {
  /** Only present while the backend runs with OTP_DEV_MODE=true (mock SMS) */
  devCode?: string | null
  expiresIn: number
  resendAfter: number
}

export interface RegisterInput {
  name: string
  phone: string
  password: string
  email?: string
  roles: UserRole[]
}
