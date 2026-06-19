'use client'

import { DashboardLayout } from '@/components/dashboard-layout'
import { DashboardHeader } from '@/components/dashboard-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { StatusBadge } from '@/components/status-badge'
import { useAuth } from '@/components/auth-provider'
import { useStore } from '@/components/store-provider'

export default function DepoHistoryPage() {
  const { session } = useAuth()
  const { getOutgoingShipments } = useStore()
  const shipments = session ? getOutgoingShipments(session.orgId) : []

  return (
    <DashboardLayout role="depo">
      <DashboardHeader title="Shipment History" />
      <main className="p-4 lg:p-8">
        <Card>
          <CardHeader><CardTitle>Outgoing Shipments</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shipments.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{s.invoiceNumber}</TableCell>
                    <TableCell>{s.receiverName}</TableCell>
                    <TableCell>{s.items.map((i) => `${i.quantity} ${i.productName}`).join(', ')}</TableCell>
                    <TableCell><StatusBadge status={s.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </DashboardLayout>
  )
}
