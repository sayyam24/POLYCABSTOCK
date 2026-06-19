'use client'

import { DashboardLayout } from '@/components/dashboard-layout'
import { DashboardHeader } from '@/components/dashboard-header'
import { ReceiveShipmentView } from '@/components/receive-shipment-view'

export default function DistributorReceivePage() {
  return (
    <DashboardLayout role="distributor">
      <DashboardHeader title="Receive from Depo" />
      <main className="p-4 lg:p-8"><ReceiveShipmentView /></main>
    </DashboardLayout>
  )
}
