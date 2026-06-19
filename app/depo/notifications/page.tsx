'use client'

import { DashboardLayout } from '@/components/dashboard-layout'
import { DashboardHeader } from '@/components/dashboard-header'
import { NotificationsList } from '@/components/notifications-list'

export default function DepoNotificationsPage() {
  return (
    <DashboardLayout role="depo">
      <DashboardHeader title="Notifications" notificationsHref="/depo/notifications" />
      <main className="p-4 lg:p-8">
        <NotificationsList />
      </main>
    </DashboardLayout>
  )
}
