import type { UserRole } from '@/lib/types'
import { roleToPath } from '@/lib/permissions'

const NOTIFICATION_PATHS: Record<UserRole, string> = {
  admin: '/admin/notifications',
  distributor: '/distributor/notifications',
  sub_distributor: '/sub-distributor/notifications',
  retailer: '/retailer/notifications',
  salesman: '/salesman/notifications',
}

export function notificationsPath(role: UserRole): string {
  return NOTIFICATION_PATHS[role]
}

export function dashboardPath(role: UserRole): string {
  return roleToPath(role)
}
