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
  FileText,
  Settings,
  UploadCloud,
  ClipboardList,
  PackageSearch,
  Activity,
  AlertTriangle,
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

const settingsNav = (base: string): NavItem => ({
  title: 'Settings',
  href: `${base}/settings/product-aliases`,
  icon: Settings,
})

const bulkUploadHistoryNav = (base: string): NavItem => ({
  title: 'Upload History',
  href: `${base}/bulk-upload-history`,
  icon: UploadCloud,
})

const stockVerificationNav = (base: string): NavItem => ({
  title: 'Stock Verification',
  href: `${base}/stock-verification`,
  icon: ClipboardList,
})

const shipmentsNav = (base: string): NavItem => ({
  title: 'Shipments',
  href: `${base}/shipments`,
  icon: PackageSearch,
})

const stockHealthNav = (base: string): NavItem => ({
  title: 'Stock Health',
  href: `${base}/stock-health`,
  icon: Activity,
})

const shortagesNav = (base: string): NavItem => ({
  title: 'Shortages',
  href: `${base}/shortages`,
  icon: AlertTriangle,
})

export const ROLE_NAV: Record<UserRole, NavItem[]> = {
  distributor: [
    { title: 'Dashboard', href: '/distributor', icon: LayoutDashboard },
    { title: 'Sub Distributors', href: '/distributor/sub-distributors', icon: Users },
    { title: 'Retailers', href: '/distributor/retailers', icon: Store },
    { title: 'Stock', href: '/distributor/stock', icon: Package },
    { title: 'Send', href: '/distributor/send', icon: Send },
    { title: 'Receive', href: '/distributor/receive', icon: ClipboardCheck },
    returnsNav('/distributor'),
    { title: 'Ledger', href: '/distributor/ledger', icon: FileText },
    { title: 'History', href: '/distributor/history', icon: History },
    bulkUploadHistoryNav('/distributor'),
    stockVerificationNav('/distributor'),
    shipmentsNav('/distributor'),
    stockHealthNav('/distributor'),
    shortagesNav('/distributor'),
    settingsNav('/distributor'),
    { title: 'Alerts', href: '/distributor/notifications', icon: Bell },
  ],
  sub_distributor: [
    { title: 'Dashboard', href: '/sub-distributor', icon: LayoutDashboard },
    { title: 'Retailers', href: '/sub-distributor/retailers', icon: Users },
    { title: 'Stock', href: '/sub-distributor/stock', icon: Package },
    { title: 'Send', href: '/sub-distributor/send', icon: Send },
    { title: 'Receive', href: '/sub-distributor/receive', icon: ClipboardCheck },
    returnsNav('/sub-distributor'),
    { title: 'Ledger', href: '/sub-distributor/ledger', icon: FileText },
    { title: 'History', href: '/sub-distributor/history', icon: History },
    stockVerificationNav('/sub-distributor'),
    shipmentsNav('/sub-distributor'),
    stockHealthNav('/sub-distributor'),
    shortagesNav('/sub-distributor'),
    { title: 'Alerts', href: '/sub-distributor/notifications', icon: Bell },
  ],
  retailer: [
    { title: 'Dashboard', href: '/retailer', icon: LayoutDashboard },
    { title: 'Stock', href: '/retailer/stock', icon: Package },
    { title: 'Receive', href: '/retailer/receive', icon: Truck },
    returnsNav('/retailer'),
    { title: 'Ledger', href: '/retailer/ledger', icon: FileText },
    { title: 'History', href: '/retailer/history', icon: History },
    { title: 'Alerts', href: '/retailer/notifications', icon: Bell },
  ],
}

export const ROLE_LABELS = PERM_LABELS

export const ROLE_ICONS: Record<UserRole, LucideIcon> = {
  distributor: Truck,
  sub_distributor: Warehouse,
  retailer: Store,
}
