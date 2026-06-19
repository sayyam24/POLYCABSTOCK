'use client'

import { DashboardLayout } from '@/components/dashboard-layout'
import { DashboardHeader } from '@/components/dashboard-header'
import { SendShipmentView } from '@/components/send-shipment-view'

export default function DepoSendPage() {
  return (
    <DashboardLayout role="depo">
      <DashboardHeader title="Send to Sub Distributor" />
      <main className="p-4 lg:p-8">
        <SendShipmentView title="Depo → Sub Distributor (bill / Excel)" />
      </main>
    </DashboardLayout>
  )
}
