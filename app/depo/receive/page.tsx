'use client'

import { DashboardLayout } from '@/components/dashboard-layout'
import { DashboardHeader } from '@/components/dashboard-header'
import { ReceiveShipmentView } from '@/components/receive-shipment-view'

export default function DepoReceivePage() {
  return (
    <DashboardLayout role="depo">
      <DashboardHeader title="Receive Shipments" />
      <main className="p-4 lg:p-8">
        <ReceiveShipmentView />
      </main>
    </DashboardLayout>
  )
}
