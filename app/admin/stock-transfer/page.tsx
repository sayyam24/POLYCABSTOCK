'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { DashboardHeader } from '@/components/dashboard-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ArrowRight,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Truck,
  X,
} from 'lucide-react'

const transferHistory = [
  {
    id: 'TRF-2024-001',
    from: 'Factory A',
    fromType: 'factory',
    to: 'Distributor X',
    toType: 'distributor',
    items: 500,
    product: 'Circuit Board CB-500',
    date: '2024-01-15',
    status: 'completed',
  },
  {
    id: 'TRF-2024-002',
    from: 'Distributor X',
    fromType: 'distributor',
    to: 'RetailMax',
    toType: 'retailer',
    items: 120,
    product: 'LED Panel LP-200',
    date: '2024-01-14',
    status: 'in-transit',
  },
  {
    id: 'TRF-2024-003',
    from: 'Factory B',
    fromType: 'factory',
    to: 'Distributor Y',
    toType: 'distributor',
    items: 250,
    product: 'Power Supply PS-100',
    date: '2024-01-14',
    status: 'pending',
  },
  {
    id: 'TRF-2024-004',
    from: 'Distributor Y',
    fromType: 'distributor',
    to: 'TechMart',
    toType: 'retailer',
    items: 80,
    product: 'Connector Set CS-50',
    date: '2024-01-13',
    status: 'completed',
  },
  {
    id: 'TRF-2024-005',
    from: 'Factory A',
    fromType: 'factory',
    to: 'Distributor Z',
    toType: 'distributor',
    items: 300,
    product: 'Capacitor Kit CK-25',
    date: '2024-01-13',
    status: 'completed',
  },
]

const sources = [
  { value: 'factory-a', label: 'Factory A', type: 'factory' },
  { value: 'factory-b', label: 'Factory B', type: 'factory' },
  { value: 'distributor-x', label: 'Distributor X', type: 'distributor' },
  { value: 'distributor-y', label: 'Distributor Y', type: 'distributor' },
  { value: 'distributor-z', label: 'Distributor Z', type: 'distributor' },
]

const destinations = [
  { value: 'distributor-x', label: 'Distributor X', type: 'distributor' },
  { value: 'distributor-y', label: 'Distributor Y', type: 'distributor' },
  { value: 'distributor-z', label: 'Distributor Z', type: 'distributor' },
  { value: 'retailmax', label: 'RetailMax', type: 'retailer' },
  { value: 'techmart', label: 'TechMart', type: 'retailer' },
  { value: 'electroshop', label: 'ElectroShop', type: 'retailer' },
]

const products = [
  { value: 'cb-500', label: 'Circuit Board CB-500', stock: 5000 },
  { value: 'lp-200', label: 'LED Panel LP-200', stock: 3200 },
  { value: 'ps-100', label: 'Power Supply PS-100', stock: 1800 },
  { value: 'cs-50', label: 'Connector Set CS-50', stock: 8500 },
  { value: 'ck-25', label: 'Capacitor Kit CK-25', stock: 12000 },
]

export default function StockTransferPage() {
  const [showForm, setShowForm] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filteredTransfers = transferHistory.filter((transfer) => {
    const matchesSearch =
      transfer.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transfer.product.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transfer.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transfer.to.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || transfer.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-success/10 text-success hover:bg-success/20">Completed</Badge>
      case 'in-transit':
        return <Badge className="bg-warning/10 text-warning hover:bg-warning/20">In Transit</Badge>
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <DashboardLayout role="admin">
      <DashboardHeader title="Stock Transfer" userName="Admin User" />

      <main className="p-4 lg:p-8 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10">
                <CheckCircle2 className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">156</p>
                <p className="text-sm text-muted-foreground">Completed Today</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-warning/10">
                <Truck className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">23</p>
                <p className="text-sm text-muted-foreground">In Transit</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">8</p>
                <p className="text-sm text-muted-foreground">Pending Approval</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* New Transfer Form */}
        {showForm ? (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>New Stock Transfer</CardTitle>
                <CardDescription>Create a new transfer request</CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setShowForm(false)}>
                <X className="h-5 w-5" />
              </Button>
            </CardHeader>
            <CardContent>
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="source">Source</Label>
                    <Select>
                      <SelectTrigger id="source" className="h-12">
                        <SelectValue placeholder="Select source" />
                      </SelectTrigger>
                      <SelectContent>
                        {sources.map((source) => (
                          <SelectItem key={source.value} value={source.value}>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {source.type}
                              </Badge>
                              {source.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="destination">Destination</Label>
                    <Select>
                      <SelectTrigger id="destination" className="h-12">
                        <SelectValue placeholder="Select destination" />
                      </SelectTrigger>
                      <SelectContent>
                        {destinations.map((dest) => (
                          <SelectItem key={dest.value} value={dest.value}>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {dest.type}
                              </Badge>
                              {dest.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="product">Product</Label>
                    <Select>
                      <SelectTrigger id="product" className="h-12">
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.value} value={product.value}>
                            <div className="flex items-center justify-between w-full">
                              <span>{product.label}</span>
                              <span className="text-xs text-muted-foreground ml-2">
                                Stock: {product.stock}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input id="quantity" type="number" placeholder="Enter quantity" className="h-12" />
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <Button type="submit" size="lg" className="px-8">
                    <ArrowRight className="mr-2 h-5 w-5" />
                    Create Transfer
                  </Button>
                  <Button type="button" variant="outline" size="lg" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Button size="lg" onClick={() => setShowForm(true)} className="gap-2">
            <Plus className="h-5 w-5" />
            New Transfer
          </Button>
        )}

        {/* Transfer History */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Transfer History</CardTitle>
                <CardDescription>All stock transfers and their status</CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search transfers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-full sm:w-64"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-40">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Filter status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="in-transit">In Transit</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transfer ID</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead></TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransfers.map((transfer) => (
                    <TableRow key={transfer.id}>
                      <TableCell className="font-medium">{transfer.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {transfer.fromType}
                          </Badge>
                          {transfer.from}
                        </div>
                      </TableCell>
                      <TableCell>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {transfer.toType}
                          </Badge>
                          {transfer.to}
                        </div>
                      </TableCell>
                      <TableCell>{transfer.product}</TableCell>
                      <TableCell className="text-right font-medium">{transfer.items}</TableCell>
                      <TableCell>{transfer.date}</TableCell>
                      <TableCell>{getStatusBadge(transfer.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </DashboardLayout>
  )
}
