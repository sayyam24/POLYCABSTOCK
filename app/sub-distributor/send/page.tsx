'use client'

import { DashboardLayout } from '@/components/dashboard-layout'
import { DashboardHeader } from '@/components/dashboard-header'
import { SendShipmentView } from '@/components/send-shipment-view'

export default function SubDistributorSendPage() {
  return (
    <DashboardLayout role="sub_distributor">
      <DashboardHeader title="Send to Distributor" />
      <main className="p-4 lg:p-8">
        <SendShipmentView title="Sub Distributor → Distributor (bill / Excel)" />
      </main>
    </DashboardLayout>
  )
}
