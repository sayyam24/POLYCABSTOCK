'use client'

import { DashboardLayout } from '@/components/dashboard-layout'
import { DashboardHeader } from '@/components/dashboard-header'
import { ReceiveShipmentView } from '@/components/receive-shipment-view'

export default function SubDistributorReceivePage() {
  return (
    <DashboardLayout role="sub_distributor">
      <DashboardHeader title="Receive from Distributor" />
      <main className="p-4 lg:p-8"><ReceiveShipmentView /></main>
    </DashboardLayout>
  )
}
