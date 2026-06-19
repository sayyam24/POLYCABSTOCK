'use client'

import { DashboardLayout } from '@/components/dashboard-layout'
import { DashboardHeader } from '@/components/dashboard-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { StatusBadge } from '@/components/status-badge'
import { useStore } from '@/components/store-provider'

export default function AdminShipmentsPage() {
  const { shipments } = useStore()

  return (
    <DashboardLayout role="admin">
      <DashboardHeader title="All Shipments" />
      <main className="p-4 lg:p-8">
        <Card>
          <CardHeader><CardTitle>Supply Chain Monitor</CardTitle></CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shipments.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{s.invoiceNumber}</TableCell>
                    <TableCell>{s.senderName}</TableCell>
                    <TableCell>{s.receiverName}</TableCell>
                    <TableCell className="max-w-xs truncate">{s.items.map((i) => `${i.quantity} ${i.productName}`).join(', ')}</TableCell>
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
