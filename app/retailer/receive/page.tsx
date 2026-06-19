'use client'

import { DashboardLayout } from '@/components/dashboard-layout'
import { DashboardHeader } from '@/components/dashboard-header'
import { ReceiveShipmentView } from '@/components/receive-shipment-view'

export default function RetailerReceivePage() {
  return (
    <DashboardLayout role="retailer">
      <DashboardHeader title="Receive & Confirm" />
      <main className="p-4 lg:p-8"><ReceiveShipmentView /></main>
    </DashboardLayout>
  )
}
