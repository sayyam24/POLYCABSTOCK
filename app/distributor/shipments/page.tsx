'use client'

import { DashboardLayout } from '@/components/dashboard-layout'
import { DashboardHeader } from '@/components/dashboard-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/components/auth-provider'
import { useState, useEffect } from 'react'
import type { Shipment, ShipmentStatus } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Search, Calendar, Package, Truck, CheckCircle, XCircle, RotateCcw, Clock, ChevronRight, Eye } from 'lucide-react'
import { electroTrackService } from '@/lib/services/electrotrack.service'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export default function ShipmentsPage() {
  const { session } = useAuth()
  const router = useRouter()
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<ShipmentStatus | 'all'>('all')
  const [filterDate, setFilterDate] = useState('')
  const [activeTab, setActiveTab] = useState<'sent' | 'received'>('sent')

  useEffect(() => {
    loadShipments()
  }, [session])

  const loadShipments = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/state', { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to load data')
      
      const data = await res.json()
      setShipments(data.shipments || [])
    } catch (err) {
      toast.error('Failed to load shipments')
    } finally {
      setLoading(false)
    }
  }

  const sentShipments = shipments.filter(s => s.senderOrgId === session?.orgId)
  const receivedShipments = shipments.filter(s => s.receiverOrgId === session?.orgId)

  const pendingReceives = receivedShipments.filter(s => s.status === 'sent')

  const getStatusColor = (status: ShipmentStatus) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-50'
      case 'sent':
        return 'text-blue-600 bg-blue-50'
      case 'received':
        return 'text-green-600 bg-green-50'
      case 'returned':
        return 'text-purple-600 bg-purple-50'
      case 'rejected':
        return 'text-red-600 bg-red-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const getStatusIcon = (status: ShipmentStatus) => {
    switch (status) {
      case 'pending':
        return Clock
      case 'sent':
        return Truck
      case 'received':
        return CheckCircle
      case 'returned':
        return RotateCcw
      case 'rejected':
        return XCircle
      default:
        return Package
    }
  }

  const handleReceiveShipment = (shipmentId: string) => {
    router.push(`/distributor/shipments/${shipmentId}/receive`)
  }

  const handleViewShipment = (shipmentId: string) => {
    router.push(`/distributor/shipments/${shipmentId}`)
  }

  const filterShipments = (shipmentsToFilter: Shipment[]) => {
    return shipmentsToFilter.filter(shipment => {
      const matchesSearch = 
        shipment.shipmentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shipment.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shipment.senderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        shipment.receiverName.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = filterStatus === 'all' || shipment.status === filterStatus
      const matchesDate = !filterDate || shipment.createdAt.startsWith(filterDate)

      return matchesSearch && matchesStatus && matchesDate
    })
  }

  const filteredSent = filterShipments(sentShipments)
  const filteredReceived = filterShipments(receivedShipments)

  const getShipmentStats = (shipmentList: Shipment[]) => {
    return {
      total: shipmentList.length,
      sent: shipmentList.filter(s => s.status === 'sent').length,
      received: shipmentList.filter(s => s.status === 'received').length,
      returned: shipmentList.filter(s => s.status === 'returned').length,
      pending: shipmentList.filter(s => s.status === 'pending').length,
    }
  }

  const sentStats = getShipmentStats(sentShipments)
  const receivedStats = getShipmentStats(receivedShipments)

  if (loading) {
    return (
      <DashboardLayout role="distributor">
        <DashboardHeader title="Shipments" />
        <main className="p-4 lg:p-8">
          <div>Loading...</div>
        </main>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout role="distributor">
      <DashboardHeader title="Shipments" />
      <main className="p-4 lg:p-8">
        {/* Pending Receives Widget */}
        {pendingReceives.length > 0 && (
          <Card className="mb-6 border-yellow-200 bg-yellow-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-800">
                <Clock className="h-5 w-5" />
                Pending Receives ({pendingReceives.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {pendingReceives.slice(0, 3).map(shipment => (
                  <div key={shipment.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                    <div>
                      <div className="font-medium">{shipment.invoiceNumber}</div>
                      <div className="text-sm text-muted-foreground">
                        From: {shipment.senderName} • {new Date(shipment.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewShipment(shipment.id)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleReceiveShipment(shipment.id)}
                      >
                        Receive
                      </Button>
                    </div>
                  </div>
                ))}
                {pendingReceives.length > 3 && (
                  <Button variant="link" className="w-full" onClick={() => setActiveTab('received')}>
                    View all {pendingReceives.length} pending receives
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Sent</p>
                  <p className="text-2xl font-bold">{sentStats.total}</p>
                </div>
                <Truck className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Received</p>
                  <p className="text-2xl font-bold text-green-600">{receivedStats.received}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{sentStats.sent + receivedStats.sent}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Returned</p>
                  <p className="text-2xl font-bold text-purple-600">{sentStats.returned + receivedStats.returned}</p>
                </div>
                <RotateCcw className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Shipments</CardTitle>
            <div className="flex flex-wrap gap-4 mt-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by invoice, sender, receiver..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Input
                type="date"
                placeholder="Filter by date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-[180px]"
              />
              <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as ShipmentStatus | 'all')}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="received">Received</SelectItem>
                  <SelectItem value="returned">Returned</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'sent' | 'received')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="sent">
                  Sent Shipments ({filteredSent.length})
                </TabsTrigger>
                <TabsTrigger value="received">
                  Received Shipments ({filteredReceived.length})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="sent" className="mt-4">
                {filteredSent.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No sent shipments found
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredSent.map(shipment => {
                      const StatusIcon = getStatusIcon(shipment.status)
                      return (
                        <div key={shipment.id} className="border rounded-lg p-4 hover:bg-muted/50 cursor-pointer transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className={`p-2 rounded-full ${getStatusColor(shipment.status)}`}>
                                <StatusIcon className="h-5 w-5" />
                              </div>
                              <div>
                                <div className="font-semibold">{shipment.invoiceNumber}</div>
                                <div className="text-sm text-muted-foreground">
                                  To: {shipment.receiverName} • {new Date(shipment.createdAt).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <div className="text-sm text-muted-foreground">Products</div>
                                <div className="font-medium">{shipment.items.length}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm text-muted-foreground">Quantity</div>
                                <div className="font-medium">{shipment.items.reduce((sum, i) => sum + i.quantity, 0)}</div>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleViewShipment(shipment.id)}
                              >
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="received" className="mt-4">
                {filteredReceived.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No received shipments found
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredReceived.map(shipment => {
                      const StatusIcon = getStatusIcon(shipment.status)
                      return (
                        <div key={shipment.id} className="border rounded-lg p-4 hover:bg-muted/50 cursor-pointer transition-colors">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className={`p-2 rounded-full ${getStatusColor(shipment.status)}`}>
                                <StatusIcon className="h-5 w-5" />
                              </div>
                              <div>
                                <div className="font-semibold">{shipment.invoiceNumber}</div>
                                <div className="text-sm text-muted-foreground">
                                  From: {shipment.senderName} • {new Date(shipment.createdAt).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <div className="text-sm text-muted-foreground">Products</div>
                                <div className="font-medium">{shipment.items.length}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm text-muted-foreground">Quantity</div>
                                <div className="font-medium">{shipment.items.reduce((sum, i) => sum + i.quantity, 0)}</div>
                              </div>
                              {shipment.status === 'sent' && (
                                <Button
                                  size="sm"
                                  onClick={() => handleReceiveShipment(shipment.id)}
                                >
                                  Receive
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleViewShipment(shipment.id)}
                              >
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </DashboardLayout>
  )
}
