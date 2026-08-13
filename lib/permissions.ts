import type { UserRole } from '@/lib/types'

/** Who can create which roles (distributor → sub_distributor → retailer) */
export const ROLE_CREATION_PERMISSIONS: Record<UserRole, UserRole[]> = {
  admin: ['admin', 'distributor', 'sub_distributor', 'retailer', 'salesman'],
  distributor: ['salesman'],
  sub_distributor: [],
  retailer: [],
  salesman: [],
}

/** Valid shipment routes in the supply chain */
export const SHIPMENT_ROUTES: [UserRole, UserRole][] = [
  ['distributor', 'sub_distributor'],
  ['sub_distributor', 'retailer'],
]

export function canCreateRole(creatorRole: UserRole, targetRole: UserRole): boolean {
  return ROLE_CREATION_PERMISSIONS[creatorRole]?.includes(targetRole) ?? false
}

export function canShip(fromRole: UserRole, toRole: UserRole): boolean {
  return SHIPMENT_ROUTES.some(([from, to]) => from === fromRole && to === toRole)
}

export function getReceiversForRole(role: UserRole): UserRole | null {
  const route = SHIPMENT_ROUTES.find(([from]) => from === role)
  return route ? route[1] : null
}

export function getSendersForRole(role: UserRole): UserRole | null {
  const route = SHIPMENT_ROUTES.find(([, to]) => to === role)
  return route ? route[0] : null
}

export function roleToPath(role: UserRole): string {
  if (role === 'admin') return '/admin'
  if (role === 'sub_distributor') return '/sub-distributor'
  if (role === 'salesman') return '/salesman'
  return `/${role}`
}

export function pathToRole(path: string): UserRole | null {
  const segment = path.split('/').filter(Boolean)[0]
  if (segment === 'sub-distributor') return 'sub_distributor'
  const roles: UserRole[] = ['distributor', 'retailer']
  return roles.includes(segment as UserRole) ? (segment as UserRole) : null
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Admin',
  distributor: 'Distributor',
  sub_distributor: 'Sub Distributor',
  retailer: 'Retailer',
  salesman: 'Salesman',
}

/** Human-readable send step label */
export function getSendStepLabel(role: UserRole): string {
  const receiver = getReceiversForRole(role)
  if (!receiver) return 'Send material'
  return `Send to ${ROLE_LABELS[receiver]}`
}
