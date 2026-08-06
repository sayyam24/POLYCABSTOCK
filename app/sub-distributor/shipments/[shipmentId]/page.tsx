'use client'

import { DashboardLayout } from '@/components/dashboard-layout'
import { DashboardHeader } from '@/components/dashboard-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/components/auth-provider'
import { useState, useEffect } from 'react'
import type { Shipment, ShipmentTimeline, ShipmentShortage } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Package, Truck, CheckCircle, Clock, RotateCcw, XCircle, FileText, Calendar, User, Building2 } from 'lucide-react'
import { electroTrackService } from '@/lib/services/electrotrack.service'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export default function SubDistributorShipmentDetailPage({ params }: { params: { shipmentId: string } }) {
  const { session } = useAuth()
  const router = useRouter()
  const [shipment, setShipment] = useState<Shipment | null>(null)
  const [shortages, setShortages] = useState<ShipmentShortage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadShipment()
  }, [params.shipmentId])

  const loadShipment = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/state', { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to load data')
      
      const data = await res.json()
      const found = (data.shipments || []).find((s: Shipment) => s.id === params.shipmentId)
      
      if (!found) {
        toast.error('Shipment not found')
        router.back()
        return
      }
      
      setShipment(found)
      
      const allShortages = (data.shipmentShortages || []).filter((s: ShipmentShortage) => s.shipmentId === params.shipmentId)
      setShortages(allShortages)
    } catch (err) {
      toast.error('Failed to load shipment')
      router.back()
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'sent':
        return 'bg-blue-100 text-blue-800'
      case 'received':
        return 'bg-green-100 text-green-800'
      case 'partially_received':
        return 'bg-orange-100 text-orange-800'
      case 'returned':
        return 'bg-purple-100 text-purple-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return Clock
      case 'sent':
        return Truck
      case 'received':
        return CheckCircle
      case 'partially_received':
        return Package
      case 'returned':
        return RotateCcw
      case 'rejected':
        return XCircle
      default:
        return Package
    }
  }

  const getTimelineIcon = (event: ShipmentTimeline['event']) => {
    switch (event) {
      case 'invoice_uploaded':
        return FileText
      case 'parsed_successfully':
        return CheckCircle
      case 'shipment_created':
        return Truck
      case 'shipment_received':
        return Package
      case 'shipment_returned':
        return RotateCcw
      case 'shipment_cancelled':
        return XCircle
      default:
        return Clock
    }
  }

  const getTimelineLabel = (event: ShipmentTimeline['event']) => {
    switch (event) {
      case 'invoice_uploaded':
        return 'Invoice Uploaded'
      case 'parsed_successfully':
        return 'Parsed Successfully'
      case 'shipment_created':
        return 'Shipment Created'
      case 'shipment_received':
        return 'Shipment Received'
      case 'shipment_returned':
        return 'Shipment Returned'
      case 'shipment_cancelled':
        return 'Shipment Cancelled'
      default:
        return event
    }
  }

  if (loading) {
    return (
      <DashboardLayout role="sub_distributor">
        <DashboardHeader title="Shipment Details" />
        <main className="p-4 lg:p-8">
          <div>Loading...</div>
        </main>
      </DashboardLayout>
    )
  }

  if (!shipment) {
    return null
  }

  const StatusIcon = getStatusIcon(shipment.status)
  const isReceiver = shipment.receiverOrgId === session?.orgId
  const canReceive = isReceiver && shipment.status === 'sent'

  return (
    <DashboardLayout role="sub_distributor">
      <DashboardHeader title="Shipment Details" />
      <main className="p-4 lg:p-8">
        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">{shipment.invoiceNumber}</CardTitle>
                <div className="text-sm text-muted-foreground mt-1">
                  Shipment ID: {shipment.shipmentNumber}
                </div>
              </div>
              <Badge className={getStatusColor(shipment.status)}>
                <StatusIcon className="h-4 w-4 mr-1" />
                {shipment.status.charAt(0).toUpperCase() + shipment.status.slice(1)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-muted-foreground mt-1" />
                <div>
                  <div className="text-sm text-muted-foreground">Sender</div>
                  <div className="font-medium">{shipment.senderName}</div>
                  <div className="text-xs text-muted-foreground">{shipment.senderRole}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Building2 className="h-5 w-5 text-muted-foreground mt-1" />
                <div>
                  <div className="text-sm text-muted-foreground">Receiver</div>
                  <div className="font-medium">{shipment.receiverName}</div>
                  <div className="text-xs text-muted-foreground">{shipment.receiverRole}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-1" />
                <div>
                  <div className="text-sm text-muted-foreground">Shipment Date</div>
                  <div className="font-medium">{new Date(shipment.createdAt).toLocaleString()}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Package className="h-5 w-5 text-muted-foreground mt-1" />
                <div>
                  <div className="text-sm text-muted-foreground">Total Items</div>
                  <div className="font-medium">{shipment.items.length} products</div>
                  <div className="text-xs text-muted-foreground">{shipment.items.reduce((sum, i) => sum + i.quantity, 0)} units</div>
                </div>
              </div>
            </div>
            {shipment.notes && (
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <div className="text-sm text-muted-foreground">Notes</div>
                <div className="text-sm">{shipment.notes}</div>
              </div>
            )}
          </CardContent>
        </Card>

        {shortages.length > 0 && (
          <Card className="mb-6 border-orange-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-800">
                <XCircle className="h-5 w-5" />
                Shortages ({shortages.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {shortages.map((shortage, index) => (
                  <div key={index} className="border rounded-lg p-3 bg-orange-50">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <div className="text-xs text-muted-foreground">Product</div>
                        <div className="font-medium">{shortage.productName}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Dispatched</div>
                        <div className="font-medium">{shortage.dispatchedQuantity}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Received</div>
                        <div className="font-medium">{shortage.receivedQuantity}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Shortage</div>
                        <div className="font-medium text-red-600">{shortage.shortageQuantity}</div>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">
                        Reason: {shortage.reason} • Status: {shortage.status}
                      </div>
                      {shortage.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push('/sub-distributor/shortages')}
                        >
                          View in Shortages
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Shipment Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(shipment.timeline || []).map((event, index) => {
                const TimelineIcon = getTimelineIcon(event.event)
                return (
                  <div key={index} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="p-2 bg-primary/10 rounded-full">
                        <TimelineIcon className="h-4 w-4 text-primary" />
                      </div>
                      {index < (shipment.timeline?.length || 0) - 1 && (
                        <div className="w-0.5 h-full bg-border mt-2" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{getTimelineLabel(event.event)}</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(event.timestamp).toLocaleString()}
                        </div>
                      </div>
                      {event.userName && (
                        <div className="text-sm text-muted-foreground">
                          By: {event.userName}
                        </div>
                      )}
                      {event.notes && (
                        <div className="text-sm text-muted-foreground mt-1">
                          {event.notes}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Shipment Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Product</th>
                    <th className="text-left py-3 px-4">Quantity</th>
                    <th className="text-left py-3 px-4">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {shipment.items.map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-3 px-4 font-medium">{item.productName}</td>
                      <td className="py-3 px-4">{item.quantity}</td>
                      <td className="py-3 px-4 text-muted-foreground">{item.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {canReceive && (
          <Card>
            <CardContent className="pt-6">
              <Button
                onClick={() => router.push(`/sub-distributor/shipments/${shipment.id}/receive`)}
                className="w-full"
              >
                Receive Shipment
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </DashboardLayout>
  )
}
