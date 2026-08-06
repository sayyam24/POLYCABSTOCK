'use client'

import { DashboardLayout } from '@/components/dashboard-layout'
import { DashboardHeader } from '@/components/dashboard-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/components/auth-provider'
import { useState, useEffect } from 'react'
import type { ShipmentShortage } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Package, ArrowLeft, CheckCircle, XCircle } from 'lucide-react'
import { electroTrackService } from '@/lib/services/electrotrack.service'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'

export default function PendingShortagesPage() {
  const { session } = useAuth()
  const router = useRouter()
  const [shortages, setShortages] = useState<ShipmentShortage[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'resolved' | 'closed'>('all')
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false)
  const [selectedShortage, setSelectedShortage] = useState<ShipmentShortage | null>(null)
  const [resolveRemarks, setResolveRemarks] = useState('')

  useEffect(() => {
    loadShortages()
  }, [session])

  const loadShortages = () => {
    if (!session) return
    const allShortages = electroTrackService.getShipmentShortages(session.orgId)
    setShortages(allShortages)
    setLoading(false)
  }

  const handleResolve = () => {
    if (!selectedShortage || !session) return

    try {
      electroTrackService.resolveShortage(session, selectedShortage.id, resolveRemarks)
      toast.success('Shortage resolved successfully')
      setResolveDialogOpen(false)
      setResolveRemarks('')
      setSelectedShortage(null)
      loadShortages()
    } catch (err) {
      toast.error('Failed to resolve shortage')
    }
  }

  const filteredShortages = shortages.filter(shortage => {
    if (filterStatus === 'all') return true
    return shortage.status === filterStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-500">Pending</Badge>
      case 'resolved':
        return <Badge className="bg-blue-500">Resolved</Badge>
      case 'closed':
        return <Badge className="bg-gray-500">Closed</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const getReasonLabel = (reason: string) => {
    switch (reason) {
      case 'damaged_during_transport':
        return 'Damaged During Transport'
      case 'missing_items':
        return 'Missing Items'
      case 'wrong_quantity_sent':
        return 'Wrong Quantity Sent'
      case 'other':
        return 'Other'
      default:
        return reason
    }
  }

  if (loading) {
    return (
      <DashboardLayout role="distributor">
        <DashboardHeader title="Pending Shortages" />
        <main className="p-4 lg:p-8">
          <div>Loading...</div>
        </main>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="distributor">
      <DashboardHeader title="Pending Shortages" />
      <main className="p-4 lg:p-8">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Shipment Shortages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label>Filter by Status</Label>
                <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as any)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="text-sm text-muted-foreground">
                Showing {filteredShortages.length} of {shortages.length} shortages
              </div>
            </div>
          </CardContent>
        </Card>

        {filteredShortages.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8 text-muted-foreground">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <div>No shortages found</div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredShortages.map((shortage) => (
              <Card key={shortage.id} className={shortage.status === 'pending' ? 'border-yellow-200' : ''}>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    <div>
                      <div className="text-sm text-muted-foreground">Shipment ID</div>
                      <div className="font-medium">{shortage.shipmentNumber}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Invoice Number</div>
                      <div className="font-medium">{shortage.invoiceNumber}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Receiver</div>
                      <div className="font-medium">{shortage.receiverName}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Product</div>
                      <div className="font-medium">{shortage.productName}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Dispatched</div>
                      <div className="font-medium">{shortage.dispatchedQuantity}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Received</div>
                      <div className="font-medium">{shortage.receivedQuantity}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Shortage</div>
                      <div className="font-medium text-red-600">{shortage.shortageQuantity}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Reason</div>
                      <div className="font-medium">{getReasonLabel(shortage.reason)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-muted-foreground">Status</div>
                      <div className="font-medium">{getStatusBadge(shortage.status)}</div>
                    </div>
                  </div>
                  
                  {shortage.remarks && (
                    <div className="mb-4">
                      <div className="text-sm text-muted-foreground">Remarks</div>
                      <div className="text-sm">{shortage.remarks}</div>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Created: {new Date(shortage.createdAt).toLocaleString()}
                      {shortage.resolvedDate && (
                        <span className="ml-4">
                          Resolved: {new Date(shortage.resolvedDate).toLocaleString()} by {shortage.resolvedByName}
                        </span>
                      )}
                    </div>
                    {shortage.status === 'pending' && (
                      <Dialog open={resolveDialogOpen && selectedShortage?.id === shortage.id} onOpenChange={(open) => {
                        setResolveDialogOpen(open)
                        if (!open) setSelectedShortage(null)
                      }}>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            onClick={() => setSelectedShortage(shortage)}
                          >
                            Resolve Shortage
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Resolve Shortage</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <div className="text-sm text-muted-foreground">Product</div>
                              <div className="font-medium">{shortage.productName}</div>
                            </div>
                            <div>
                              <div className="text-sm text-muted-foreground">Shortage Quantity</div>
                              <div className="font-medium text-red-600">{shortage.shortageQuantity}</div>
                            </div>
                            <div>
                              <Label>Remarks (Optional)</Label>
                              <Textarea
                                value={resolveRemarks}
                                onChange={(e) => setResolveRemarks(e.target.value)}
                                placeholder="Add any notes about the resolution..."
                                className="mt-1"
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setResolveDialogOpen(false)
                                  setSelectedShortage(null)
                                  setResolveRemarks('')
                                }}
                                className="flex-1"
                              >
                                Cancel
                              </Button>
                              <Button
                                onClick={handleResolve}
                                className="flex-1"
                              >
                                Resolve
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </DashboardLayout>
  )
}
