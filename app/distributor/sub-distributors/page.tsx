'use client'

import { DashboardLayout } from '@/components/dashboard-layout'
import { DashboardHeader } from '@/components/dashboard-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CreateUserForm } from '@/components/create-user-form'
import { electroTrackService } from '@/lib/services/electrotrack.service'
import { useStore } from '@/components/store-provider'

export default function DistributorSubDistributorsPage() {
  const { refresh } = useStore()
  const retailers = electroTrackService.getOrganizations('retailer')

  return (
    <DashboardLayout role="distributor">
      <DashboardHeader title="Retailers" />
      <main className="p-4 lg:p-8 space-y-6">
        <Card>
          <CardHeader><CardTitle>Add Retailer</CardTitle></CardHeader>
          <CardContent>
            <CreateUserForm allowedRoles={['retailer']} onCreated={refresh} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Retail network</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {retailers.map((s) => (
              <p key={s.id} className="text-sm flex justify-between"><span>{s.name}</span><span className="text-muted-foreground">{s.location}</span></p>
            ))}
          </CardContent>
        </Card>
      </main>
    </DashboardLayout>
  )
}
