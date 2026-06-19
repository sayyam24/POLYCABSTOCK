'use client'

import { DashboardLayout } from '@/components/dashboard-layout'
import { DashboardHeader } from '@/components/dashboard-header'
import { NotificationsList } from '@/components/notifications-list'

export default function SubDistributorNotificationsPage() {
  return (
    <DashboardLayout role="sub_distributor">
      <DashboardHeader title="Notifications" notificationsHref="/sub-distributor/notifications" />
      <main className="p-4 lg:p-8"><NotificationsList /></main>
    </DashboardLayout>
  )
}
