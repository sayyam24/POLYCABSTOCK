'use client'

import { DashboardLayout } from '@/components/dashboard-layout'
import { DashboardHeader } from '@/components/dashboard-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { OpeningStockUpload } from '@/components/opening-stock-upload'
import { useAuth } from '@/components/auth-provider'
import { useStore } from '@/components/store-provider'
import { electroTrackService } from '@/lib/services/electrotrack.service'

export default function AdminStockPage() {
  const { session } = useAuth()
  const { stock, getOrgStock } = useStore()
  const factoryStock = session ? getOrgStock(session.orgId) : []
  const orgs = Object.fromEntries(
    electroTrackService.getOrganizations().map((o) => [o.id, o.name]),
  )

  return (
    <DashboardLayout role="admin">
      <DashboardHeader title="Factory Stock" />
      <main className="p-4 lg:p-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Update factory stock (manual or Excel/CSV)</CardTitle>
          </CardHeader>
          <CardContent>
            <OpeningStockUpload />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Factory inventory</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {factoryStock.length === 0 ? (
              <p className="text-sm text-muted-foreground">No stock recorded yet.</p>
            ) : (
              factoryStock.map((s) => (
                <p key={s.id} className="flex justify-between text-sm">
                  <span>{s.productName}</span>
                  <span className="font-bold">{s.quantity} units</span>
                </p>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>All branch inventory</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stock.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>{orgs[s.orgId] ?? s.orgId}</TableCell>
                    <TableCell>{s.productName}</TableCell>
                    <TableCell className="text-right font-semibold">
                      {s.quantity}
                    </TableCell>
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
