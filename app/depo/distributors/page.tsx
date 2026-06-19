'use client'

import { DashboardLayout } from '@/components/dashboard-layout'
import { DashboardHeader } from '@/components/dashboard-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CreateUserForm } from '@/components/create-user-form'
import { electroTrackService } from '@/lib/services/electrotrack.service'
import { useStore } from '@/components/store-provider'

export default function DepoDistributorsPage() {
  const { refresh } = useStore()
  const subs = electroTrackService.getOrganizations('sub_distributor')

  return (
    <DashboardLayout role="depo">
      <DashboardHeader title="Sub Distributors" />
      <main className="p-4 lg:p-8 space-y-6">
        <Card>
          <CardHeader><CardTitle>Add Sub Distributor</CardTitle></CardHeader>
          <CardContent>
            <CreateUserForm allowedRoles={['sub_distributor']} onCreated={refresh} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Network</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {subs.map((d) => (
              <div key={d.id} className="flex justify-between border-b pb-2 text-sm">
                <span className="font-medium">{d.name}</span>
                <span className="text-muted-foreground">{d.location}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </main>
    </DashboardLayout>
  )
}
