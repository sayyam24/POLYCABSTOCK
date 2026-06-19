'use client'

import { useState } from 'react'
import { useAuth } from '@/components/auth-provider'
import { useStore } from '@/components/store-provider'
import { electroTrackService } from '@/lib/services/electrotrack.service'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type { Shipment, ShipmentItem } from '@/lib/types'
import { toast } from 'sonner'
import { RotateCcw } from 'lucide-react'

export function ReturnGoodsView() {
  const { session } = useAuth()
  const { refresh, getIncomingShipments } = useStore()
  const [selectedId, setSelectedId] = useState<string>('')
  const [returnQty, setReturnQty] = useState<Record<string, number>>({})
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)

  if (!session) return null

  const received = getIncomingShipments(session.orgId).filter(
    (s) => s.status === 'received',
  )

  const selected: Shipment | undefined = received.find((s) => s.id === selectedId)

  const handleSelect = (id: string) => {
    setSelectedId(id)
    const sh = received.find((s) => s.id === id)
    if (sh) {
      const qty: Record<string, number> = {}
      for (const item of sh.items) {
        qty[item.productId] = item.quantity
      }
      setReturnQty(qty)
    }
  }

  const buildReturnItems = (): ShipmentItem[] => {
    if (!selected) return []
    return selected.items
      .map((item) => ({
        ...item,
        quantity: returnQty[item.productId] ?? 0,
      }))
      .filter((i) => i.quantity > 0)
  }

  const handleReturn = async () => {
    if (!selected) return
    const items = buildReturnItems()
    if (!items.length) {
      toast.error('Enter quantity to return for at least one product')
      return
    }
    setLoading(true)
    try {
      await electroTrackService.processReturn(session, {
        shipmentId: selected.id,
        items,
        reason: reason.trim() || undefined,
      })
      refresh()
      setSelectedId('')
      setReason('')
      toast.success('Return recorded — stock updated')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Return failed')
    } finally {
      setLoading(false)
    }
  }

  if (received.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-12">
        No received shipments available for return.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Return goods to sender</CardTitle>
          <CardDescription>
            Select a received bill, choose return quantities, and confirm. Your stock
            decreases and the sender&apos;s stock increases.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Received shipment (bill)</Label>
            <select
              className="flex h-12 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={selectedId}
              onChange={(e) => handleSelect(e.target.value)}
            >
              <option value="">Select invoice…</option>
              {received.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.invoiceNumber} — from {s.senderName} ({s.createdAt.slice(0, 10)})
                </option>
              ))}
            </select>
          </div>

          {selected && (
            <>
              <div className="rounded-lg border p-4 space-y-3">
                <p className="text-sm font-medium">
                  Return to {selected.senderName} · Invoice {selected.invoiceNumber}
                </p>
                {selected.items.map((item) => (
                  <div
                    key={item.productId}
                    className="flex items-center justify-between gap-4 text-sm"
                  >
                    <span>
                      {item.productName}{' '}
                      <span className="text-muted-foreground">
                        (received {item.quantity})
                      </span>
                    </span>
                    <Input
                      type="number"
                      min={0}
                      max={item.quantity}
                      className="w-24 h-10"
                      value={returnQty[item.productId] ?? 0}
                      onChange={(e) =>
                        setReturnQty((prev) => ({
                          ...prev,
                          [item.productId]: Number(e.target.value) || 0,
                        }))
                      }
                    />
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <Label>Reason (optional)</Label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={2}
                  placeholder="Damaged, wrong item, etc."
                />
              </div>
              <Button
                className="w-full"
                disabled={loading}
                onClick={handleReturn}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                {loading ? 'Processing…' : 'Confirm return & update stock'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
