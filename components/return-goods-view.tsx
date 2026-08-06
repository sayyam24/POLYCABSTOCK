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
import { RotateCcw, Upload, Plus } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export function ReturnGoodsView() {
  const { session } = useAuth()
  const { refresh, getIncomingShipments, getProducts } = useStore()
  const [selectedId, setSelectedId] = useState<string>('')
  const [returnQty, setReturnQty] = useState<Record<string, number>>({})
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)

  // Manual entry state
  const [manualItems, setManualItems] = useState<ShipmentItem[]>([])
  const [selectedProduct, setSelectedProduct] = useState<string>('')
  const [manualQty, setManualQty] = useState<number>(1)
  const [manualReason, setManualReason] = useState('')
  const [manualLoading, setManualLoading] = useState(false)
  const [manualInvoice, setManualInvoice] = useState('')

  if (!session) return null

  const received = getIncomingShipments(session.orgId).filter(
    (s) => s.status === 'received',
  )

  const products = getProducts()
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

  // Manual entry functions
  const addManualItem = () => {
    if (!selectedProduct || manualQty <= 0) {
      toast.error('Select a product and enter quantity')
      return
    }

    const product = products.find((p: any) => p.id === selectedProduct)
    if (!product) return

    const existingIndex = manualItems.findIndex(item => item.productId === selectedProduct)
    if (existingIndex >= 0) {
      const updated = [...manualItems]
      updated[existingIndex].quantity += manualQty
      setManualItems(updated)
    } else {
      setManualItems([...manualItems, {
        productId: product.id,
        productName: product.name,
        quantity: manualQty,
      }])
    }

    setManualQty(1)
    setSelectedProduct('')
  }

  const removeManualItem = (productId: string) => {
    setManualItems(manualItems.filter(item => item.productId !== productId))
  }

  const handleManualReturn = async () => {
    if (!manualInvoice.trim()) {
      toast.error('Enter invoice number')
      return
    }

    if (manualItems.length === 0) {
      toast.error('Add at least one product')
      return
    }

    setManualLoading(true)
    try {
      // Create a manual return shipment
      await electroTrackService.createManualReturn(session, {
        invoiceNumber: manualInvoice.trim(),
        items: manualItems,
        reason: manualReason.trim() || undefined,
      })
      refresh()
      setManualItems([])
      setManualInvoice('')
      setManualReason('')
      toast.success('Manual return recorded — stock increased')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Manual return failed')
    } finally {
      setManualLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="from-shipment" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="from-shipment">Return from Received Shipment</TabsTrigger>
          <TabsTrigger value="manual">Manual Return Entry</TabsTrigger>
        </TabsList>

        <TabsContent value="from-shipment" className="space-y-4">
          {received.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">
              No received shipments available for return.
            </p>
          ) : (
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
          )}
        </TabsContent>

        <TabsContent value="manual" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Manual Return Entry</CardTitle>
              <CardDescription>
                Enter return details manually when you receive returned goods. Your stock
                will increase for the returned items.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Invoice Number</Label>
                <Input
                  value={manualInvoice}
                  onChange={(e) => setManualInvoice(e.target.value)}
                  placeholder="RET-001 or similar"
                />
              </div>

              <div className="space-y-2">
                <Label>Add Products</Label>
                <div className="flex gap-2">
                  <select
                    className="flex h-12 rounded-md border border-input bg-background px-3 text-sm flex-1"
                    value={selectedProduct}
                    onChange={(e) => setSelectedProduct(e.target.value)}
                  >
                    <option value="">Select product…</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code} - {p.name}
                      </option>
                    ))}
                  </select>
                  <Input
                    type="number"
                    min={1}
                    className="w-24 h-12"
                    value={manualQty}
                    onChange={(e) => setManualQty(Number(e.target.value) || 1)}
                  />
                  <Button onClick={addManualItem} size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {manualItems.length > 0 && (
                <div className="rounded-lg border p-4 space-y-2">
                  <Label>Products to Add to Stock</Label>
                  {manualItems.map((item) => (
                    <div
                      key={item.productId}
                      className="flex items-center justify-between gap-4 text-sm"
                    >
                      <span>
                        {item.productName} × {item.quantity}
                      </span>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeManualItem(item.productId)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                <Label>Reason (optional)</Label>
                <Textarea
                  value={manualReason}
                  onChange={(e) => setManualReason(e.target.value)}
                  rows={2}
                  placeholder="Customer return, damaged goods, etc."
                />
              </div>

              <Button
                className="w-full"
                disabled={manualLoading || manualItems.length === 0}
                onClick={handleManualReturn}
              >
                <Upload className="h-4 w-4 mr-2" />
                {manualLoading ? 'Processing…' : 'Record return & increase stock'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
