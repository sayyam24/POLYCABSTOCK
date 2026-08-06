'use client'

import { useMemo } from 'react'
import { useAuth } from '@/components/auth-provider'
import { useStore } from '@/components/store-provider'
import { electroTrackService } from '@/lib/services/electrotrack.service'
import { ShipmentForm, type ShipmentFormData } from '@/components/shipment-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getReceiversForRole, getSendStepLabel } from '@/lib/permissions'
import { toast } from 'sonner'

interface SendShipmentViewProps {
  title?: string
}

export function SendShipmentView({ title }: SendShipmentViewProps) {
  const { session } = useAuth()
  const { refresh, getOrgStock } = useStore()

  const receiverRole = session ? getReceiversForRole(session.role) : null

  const receivers = useMemo(() => {
    if (!session || !receiverRole) return []
    const orgs = electroTrackService.getOrganizations(receiverRole)
    if (session.role === 'admin') {
      return orgs.filter(
        (o) => o.parentId === session.orgId || o.type === 'depo',
      )
    }
    return orgs.filter((o) => o.parentId === session.orgId)
  }, [session, receiverRole])

  const products = electroTrackService.getProducts()
  const orgStock = session ? getOrgStock(session.orgId) : []
  const stockMap = Object.fromEntries(orgStock.map((s) => [s.productId, s.quantity]))

  const handleSubmit = async (data: ShipmentFormData) => {
    if (!session) return
    
    try {
      // Get receiver details from the receivers array
      const receiver = receivers.find(r => r.id === data.receiverOrgId)
      
      // Use MongoDB API instead of client-side service
      const res = await fetch('/api/create-shipment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderOrgId: session.orgId,
          senderRole: session.role,
          senderName: session.name,
          senderId: session.userId,
          receiverOrgId: data.receiverOrgId,
          receiverRole: receiver?.type || 'depo',
          receiverName: receiver?.name || 'Unknown',
          receiverId: receiver?.ownerUserId || null,
          items: data.items,
          invoiceNumber: data.invoiceNumber,
          invoiceFileName: data.invoiceFileName,
          invoiceDataUrl: data.invoiceDataUrl
        })
      })

      if (res.ok) {
        refresh()
        toast.success(`Bill ${data.invoiceNumber} sent — waiting for receiver to confirm`)
      } else {
        const errorData = await res.json()
        toast.error(errorData.error || 'Failed to send shipment')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send shipment')
    }
  }

  if (!session || !receiverRole) return null

  const displayTitle = title ?? getSendStepLabel(session.role)
  const requireBill = session.role === 'distributor'

  return (
    <Card>
      <CardHeader>
        <CardTitle>{displayTitle}</CardTitle>
        <CardDescription>
          Upload bill or Excel with products. Stock updates when the receiver confirms.
          {requireBill && ' Bill copy is required for each retailer.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {receivers.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            No receivers yet. Create accounts under Users / Network first.
          </p>
        ) : (
          <ShipmentForm
            receivers={receivers}
            products={products}
            stockQuantities={stockMap}
            onSubmit={handleSubmit}
            requireBillCopy={requireBill}
          />
        )}
      </CardContent>
    </Card>
  )
}
