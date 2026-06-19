'use client'

import { DashboardLayout } from '@/components/dashboard-layout'
import { DashboardHeader } from '@/components/dashboard-header'
import { NotificationsList } from '@/components/notifications-list'

export default function RetailerNotificationsPage() {
  return (
    <DashboardLayout role="retailer">
      <DashboardHeader title="Notifications" notificationsHref="/retailer/notifications" />
      <main className="p-4 lg:p-8"><NotificationsList /></main>
    </DashboardLayout>
  )
}
