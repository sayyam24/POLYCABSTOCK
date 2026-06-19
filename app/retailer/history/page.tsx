'use client'

import { DashboardLayout } from '@/components/dashboard-layout'
import { DashboardHeader } from '@/components/dashboard-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { StatusBadge } from '@/components/status-badge'
import { useAuth } from '@/components/auth-provider'
import { useStore } from '@/components/store-provider'

export default function RetailerHistoryPage() {
  const { session } = useAuth()
  const { getIncomingShipments, transactions } = useStore()
  const inbound = session ? getIncomingShipments(session.orgId) : []

  return (
    <DashboardLayout role="retailer">
      <DashboardHeader title="Purchase History" />
      <main className="p-4 lg:p-8 space-y-6">
        <Card>
          <CardHeader><CardTitle>Inbound Shipments</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inbound.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{s.invoiceNumber}</TableCell>
                    <TableCell>{s.senderName}</TableCell>
                    <TableCell>{s.items.map((i) => `${i.quantity} ${i.productName}`).join(', ')}</TableCell>
                    <TableCell><StatusBadge status={s.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Transaction Log</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.filter((t) => t.receiverOrgId === session?.orgId).map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>{t.invoiceNumber}</TableCell>
                    <TableCell>{t.senderName}</TableCell>
                    <TableCell>{new Date(t.createdAt).toLocaleString()}</TableCell>
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
