'use client'

import { DashboardLayout } from '@/components/dashboard-layout'
import { DashboardHeader } from '@/components/dashboard-header'
import { SendShipmentView } from '@/components/send-shipment-view'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function DistributorSendPage() {
  return (
    <DashboardLayout role="distributor">
      <DashboardHeader title="Send to Sub Distributor" />
      <main className="p-4 lg:p-8">
        <Card>
          <CardHeader>
            <CardTitle>Distributor → Sub Distributor (Single Invoice Upload)</CardTitle>
            <p className="text-sm text-muted-foreground">
              Upload single invoice PDF - Sub Distributor will receive bill and stock will be updated after parsing
            </p>
          </CardHeader>
          <CardContent>
            <SendShipmentView title="Distributor → Sub Distributor (bill copy required)" />
          </CardContent>
        </Card>
      </main>
    </DashboardLayout>
  )
}
