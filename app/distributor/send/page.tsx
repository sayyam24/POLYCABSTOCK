'use client'

import { DashboardLayout } from '@/components/dashboard-layout'
import { DashboardHeader } from '@/components/dashboard-header'
import { SendShipmentView } from '@/components/send-shipment-view'

export default function DistributorSendPage() {
  return (
    <DashboardLayout role="distributor">
      <DashboardHeader title="Send to Retailer" />
      <main className="p-4 lg:p-8">
        <SendShipmentView title="Distributor → Retailer (bill copy required)" />
      </main>
    </DashboardLayout>
  )
}
