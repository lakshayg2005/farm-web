import type { Role } from '@/routes/types'
import type { User } from './types'

/** Order decides where someone with several roles lands first. */
const landingOrder: Role[] = ['admin', 'farmer', 'customer']

export function websiteRoles(user: User): Role[] {
  return landingOrder.filter((role) => user.roles.includes(role))
}

/** Where to send a signed-in user: the section for their most privileged website role. */
export function homePathFor(user: User): string {
  const [first] = websiteRoles(user)
  return first ? `/${first}` : '/no-access'
}
