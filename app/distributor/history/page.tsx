'use client'

import { DashboardLayout } from '@/components/dashboard-layout'
import { DashboardHeader } from '@/components/dashboard-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { StatusBadge } from '@/components/status-badge'
import { useAuth } from '@/components/auth-provider'
import { useStore } from '@/components/store-provider'

export default function DistributorHistoryPage() {
  const { session } = useAuth()
  const { getOutgoingShipments, getIncomingShipments } = useStore()
  const all = session
    ? [...getOutgoingShipments(session.orgId), ...getIncomingShipments(session.orgId)]
    : []

  return (
    <DashboardLayout role="distributor">
      <DashboardHeader title="History" />
      <main className="p-4 lg:p-8">
        <Card>
          <CardHeader><CardTitle>Shipments</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Party</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {all.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{s.invoiceNumber}</TableCell>
                    <TableCell>{s.senderOrgId === session?.orgId ? `→ ${s.receiverName}` : `← ${s.senderName}`}</TableCell>
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
