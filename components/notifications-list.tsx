'use client'

import { useAuth } from '@/components/auth-provider'
import { useUserNotifications } from '@/components/store-provider'
import { electroTrackService } from '@/lib/services/electrotrack.service'
import { useStore } from '@/components/store-provider'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export function NotificationsList() {
  const { session } = useAuth()
  const { refresh } = useStore()
  const notifications = useUserNotifications(session?.userId)

  if (!notifications.length) {
    return <p className="text-center text-muted-foreground py-8">No notifications</p>
  }

  return (
    <div className="space-y-3">
      {notifications.map((n) => (
        <Card
          key={n.id}
          className={cn(!n.read && 'border-primary/40 bg-primary/5')}
          onClick={() => {
            void electroTrackService.markNotificationRead(n.id).then(() => refresh())
          }}
        >
          <CardContent className="p-4">
            <p className="font-medium text-sm">{n.title}</p>
            <p className="text-sm text-muted-foreground whitespace-pre-line mt-1">{n.message}</p>
            <p className="text-xs text-muted-foreground mt-2">{new Date(n.createdAt).toLocaleString()}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
