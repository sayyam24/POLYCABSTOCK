'use client'

import { useAuth } from '@/components/auth-provider'
import { useStore } from '@/components/store-provider'
import { electroTrackService } from '@/lib/services/electrotrack.service'
import { ShipmentReceiveCard } from '@/components/shipment-receive-card'
import { toast } from 'sonner'

export function ReceiveShipmentView() {
  const { session } = useAuth()
  const { refresh, getIncomingShipments } = useStore()

  if (!session) return null

  const incoming = getIncomingShipments(session.orgId).filter(
    (s) => s.status === 'sent' || s.status === 'in_transit',
  )

  const handleReceive = async (id: string) => {
    try {
      await electroTrackService.receiveShipment(session, id)
      refresh()
      toast.success('Confirmed — your stock is updated from this bill')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to receive')
    }
  }

  const handleReject = async (id: string) => {
    try {
      await electroTrackService.rejectShipment(session, id)
      refresh()
      toast.info('Shipment rejected')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to reject')
    }
  }

  if (incoming.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-12">
        No pending shipments to receive.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {incoming.map((s) => (
        <ShipmentReceiveCard
          key={s.id}
          shipment={s}
          onReceive={handleReceive}
          onReject={handleReject}
        />
      ))}
    </div>
  )
}
