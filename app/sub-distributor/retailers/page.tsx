'use client'

import { DashboardLayout } from '@/components/dashboard-layout'
import { DashboardHeader } from '@/components/dashboard-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CreateUserForm } from '@/components/create-user-form'
import { electroTrackService } from '@/lib/services/electrotrack.service'
import { useStore } from '@/components/store-provider'

export default function SubDistributorRetailersPage() {
  const { refresh } = useStore()
  const retailers = electroTrackService.getOrganizations('retailer')

  return (
    <DashboardLayout role="sub_distributor">
      <DashboardHeader title="Retailers" />
      <main className="p-4 lg:p-8 space-y-6">
        <Card>
          <CardHeader><CardTitle>Add Retailer</CardTitle></CardHeader>
          <CardContent>
            <CreateUserForm allowedRoles={['retailer']} onCreated={refresh} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Retailer network</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {retailers.map((r) => (
              <p key={r.id} className="text-sm flex justify-between"><span>{r.name}</span><span className="text-muted-foreground">{r.location}</span></p>
            ))}
          </CardContent>
        </Card>
      </main>
    </DashboardLayout>
  )
}
