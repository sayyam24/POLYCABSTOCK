import type { UserRole } from '@/lib/types'
import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  Package,
  Boxes,
  Send,
  BarChart3,
  Bell,
  Warehouse,
  Truck,
  Store,
  History,
  Users,
  ClipboardCheck,
  UserPlus,
  ArrowLeftRight,
  RotateCcw,
} from 'lucide-react'
import { ROLE_LABELS as PERM_LABELS } from '@/lib/permissions'

export interface NavItem {
  title: string
  href: string
  icon: LucideIcon
}

const returnsNav = (base: string): NavItem => ({
  title: 'Returns',
  href: `${base}/returns`,
  icon: RotateCcw,
})

export const ROLE_NAV: Record<UserRole, NavItem[]> = {
  admin: [
    { title: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { title: 'Users', href: '/admin/users', icon: UserPlus },
    { title: 'Products', href: '/admin/products', icon: Package },
    { title: 'Factory Stock', href: '/admin/stock', icon: Boxes },
    { title: 'Send to Depo', href: '/admin/send', icon: Send },
    { title: 'Shipments', href: '/admin/shipments', icon: ArrowLeftRight },
    { title: 'Reports', href: '/admin/reports', icon: BarChart3 },
    { title: 'Alerts', href: '/admin/notifications', icon: Bell },
  ],
  depo: [
    { title: 'Dashboard', href: '/depo', icon: LayoutDashboard },
    { title: 'Stock', href: '/depo/stock', icon: Boxes },
    { title: 'Sub Distributors', href: '/depo/distributors', icon: Users },
    { title: 'Send', href: '/depo/send', icon: Send },
    { title: 'Receive', href: '/depo/receive', icon: ClipboardCheck },
    returnsNav('/depo'),
    { title: 'History', href: '/depo/history', icon: History },
    { title: 'Alerts', href: '/depo/notifications', icon: Bell },
  ],
  sub_distributor: [
    { title: 'Dashboard', href: '/sub-distributor', icon: LayoutDashboard },
    { title: 'Distributors', href: '/sub-distributor/retailers', icon: Users },
    { title: 'Stock', href: '/sub-distributor/stock', icon: Package },
    { title: 'Send', href: '/sub-distributor/send', icon: Send },
    { title: 'Receive', href: '/sub-distributor/receive', icon: ClipboardCheck },
    returnsNav('/sub-distributor'),
    { title: 'History', href: '/sub-distributor/history', icon: History },
    { title: 'Alerts', href: '/sub-distributor/notifications', icon: Bell },
  ],
  distributor: [
    { title: 'Dashboard', href: '/distributor', icon: LayoutDashboard },
    { title: 'Retailers', href: '/distributor/sub-distributors', icon: Store },
    { title: 'Stock', href: '/distributor/stock', icon: Package },
    { title: 'Send', href: '/distributor/send', icon: Send },
    { title: 'Receive', href: '/distributor/receive', icon: ClipboardCheck },
    returnsNav('/distributor'),
    { title: 'History', href: '/distributor/history', icon: History },
    { title: 'Alerts', href: '/distributor/notifications', icon: Bell },
  ],
  retailer: [
    { title: 'Dashboard', href: '/retailer', icon: LayoutDashboard },
    { title: 'Stock', href: '/retailer/stock', icon: Package },
    { title: 'Receive', href: '/retailer/receive', icon: Truck },
    returnsNav('/retailer'),
    { title: 'History', href: '/retailer/history', icon: History },
    { title: 'Alerts', href: '/retailer/notifications', icon: Bell },
  ],
}

export const ROLE_LABELS = PERM_LABELS

export const ROLE_ICONS: Record<UserRole, LucideIcon> = {
  admin: LayoutDashboard,
  depo: Warehouse,
  distributor: Truck,
  sub_distributor: Warehouse,
  retailer: Store,
}
