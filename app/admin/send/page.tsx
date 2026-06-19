'use client'

import { DashboardLayout } from '@/components/dashboard-layout'
import { DashboardHeader } from '@/components/dashboard-header'
import { SendShipmentView } from '@/components/send-shipment-view'

export default function AdminSendPage() {
  return (
    <DashboardLayout role="admin">
      <DashboardHeader title="Send to Depo" />
      <main className="p-4 lg:p-8">
        <SendShipmentView title="Factory → Depo (upload bill or Excel)" />
      </main>
    </DashboardLayout>
  )
}
