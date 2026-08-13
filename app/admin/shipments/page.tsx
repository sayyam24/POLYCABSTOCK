'use client'

import { AdminLayout } from '@/components/admin-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Search, Truck, Download, FileText } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

export default function AdminShipmentsPage() {
  const [shipments, setShipments] = useState<any[]>([])
  const [organizations, setOrganizations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [shipRes, orgsRes] = await Promise.all([
        fetch('/api/admin/shipments'),
        fetch('/api/admin/organizations'),
      ])
      
      if (shipRes.ok) setShipments(await shipRes.json())
      if (orgsRes.ok) setOrganizations(await orgsRes.json())
    } catch (err) {
      console.error('Failed to load data:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredShipments = shipments.filter(shipment => {
    const senderOrg = organizations.find(o => o.id === shipment.senderOrgId)?.name || ''
    const receiverOrg = organizations.find(o => o.id === shipment.receiverOrgId)?.name || ''
    const matchesSearch = searchTerm === '' || 
      shipment.shipmentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shipment.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      senderOrg.toLowerCase().includes(searchTerm.toLowerCase()) ||
      receiverOrg.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || shipment.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'received':
        return 'bg-green-100 text-green-800'
      case 'sent':
      case 'in_transit':
        return 'bg-blue-100 text-blue-800'
      case 'rejected':
      case 'returned':
        return 'bg-red-100 text-red-800'
      case 'partially_received':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Loading...</div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Shipments</h1>
          <p className="text-gray-600 mt-1">Monitor all shipments across the system</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search shipments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="in_transit">In Transit</SelectItem>
                  <SelectItem value="received">Received</SelectItem>
                  <SelectItem value="partially_received">Partially Received</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="returned">Returned</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Shipments ({filteredShipments.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Shipment #</th>
                    <th className="text-left py-3 px-4">Invoice #</th>
                    <th className="text-left py-3 px-4">From</th>
                    <th className="text-left py-3 px-4">To</th>
                    <th className="text-left py-3 px-4">Items</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Created</th>
                    <th className="text-left py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredShipments.slice(0, 50).map((shipment) => (
                    <tr key={shipment.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4 font-mono text-xs">{shipment.shipmentNumber}</td>
                      <td className="py-3 px-4 font-mono text-xs">{shipment.invoiceNumber}</td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {organizations.find(o => o.id === shipment.senderOrgId)?.name || 'Unknown'}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {organizations.find(o => o.id === shipment.receiverOrgId)?.name || 'Unknown'}
                      </td>
                      <td className="py-3 px-4">{shipment.items.length}</td>
                      <td className="py-3 px-4">
                        <Badge className={getStatusColor(shipment.status)}>
                          {shipment.status.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground text-xs">
                        {new Date(shipment.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <Button variant="ghost" size="sm">
                          <FileText className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredShipments.length > 50 && (
                <p className="text-xs text-muted-foreground mt-2">
                  Showing 50 of {filteredShipments.length} shipments
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
