import { DashboardSidebar } from '@/components/dashboard-sidebar'
import { DashboardBottomNav } from '@/components/dashboard-bottom-nav'
import type { UserRole } from '@/lib/types'

interface DashboardLayoutProps {
  children: React.ReactNode
  role: UserRole
}

export function DashboardLayout({ children, role }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar role={role} />
      <div className="lg:pl-64 pb-20 lg:pb-0">{children}</div>
      <DashboardBottomNav role={role} />
    </div>
  )
}
