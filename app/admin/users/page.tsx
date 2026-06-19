'use client'

import { DashboardLayout } from '@/components/dashboard-layout'
import { DashboardHeader } from '@/components/dashboard-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CreateUserForm } from '@/components/create-user-form'
import { Button } from '@/components/ui/button'
import { electroTrackService } from '@/lib/services/electrotrack.service'
import { useStore } from '@/components/store-provider'
import { ROLE_LABELS } from '@/lib/permissions'
import { Badge } from '@/components/ui/badge'
import { DemoDataPanel } from '@/components/demo-data-panel'

export default function AdminUsersPage() {
  const { refresh } = useStore()
  const users = electroTrackService.getUsers().sort((a, b) =>
    a.role.localeCompare(b.role),
  )

  return (
    <DashboardLayout role="admin">
      <DashboardHeader title="User Management" notificationsHref="/admin/notifications" />
      <main className="p-4 lg:p-8 space-y-6">
        <DemoDataPanel />
        <Card>
          <CardHeader>
            <CardTitle>Create account</CardTitle>
            <CardDescription>
              Set email and password for each role. Share credentials with the user so they can sign
              in on the home page.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CreateUserForm onCreated={refresh} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>All accounts ({users.length})</CardTitle>
            <CardDescription>
              Depo → Distributor → Sub Distributor → Retailer hierarchy
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {users.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No users yet. Create a Depo account first, then build the chain down.
              </p>
            ) : (
              users.map((u) => (
                <div
                  key={u.id}
                  className="flex flex-wrap items-center justify-between gap-2 border-b pb-3 last:border-0"
                >
                  <div>
                    <p className="font-medium">{u.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {u.email} · {ROLE_LABELS[u.role]}
                      {u.location ? ` · ${u.location}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={u.status === 'approved' ? 'default' : 'secondary'}>
                      {u.status}
                    </Badge>
                    {u.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => {
                            void electroTrackService
                              .approveUser(u.id, true)
                              .then(() => refresh())
                          }}
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            void electroTrackService
                              .approveUser(u.id, false)
                              .then(() => refresh())
                          }}
                        >
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </main>
    </DashboardLayout>
  )
}
