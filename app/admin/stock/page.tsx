'use client'

import { AdminLayout } from '@/components/admin-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Search, Warehouse, Edit, Download, FileSpreadsheet, Package, TrendingUp, Filter, ArrowUpDown, Sparkles, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'

export default function AdminStockPage() {
  const [stock, setStock] = useState<any[]>([])
  const [ledger, setLedger] = useState<any[]>([])
  const [organizations, setOrganizations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [orgFilter, setOrgFilter] = useState('all')
  const [showLedger, setShowLedger] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [stockRes, ledgerRes, orgsRes] = await Promise.all([
        fetch('/api/admin/stock'),
        fetch('/api/admin/stock-ledger'),
        fetch('/api/admin/organizations'),
      ])
      
      if (stockRes.ok) setStock(await stockRes.json())
      if (ledgerRes.ok) setLedger(await ledgerRes.json())
      if (orgsRes.ok) {
        const orgs = await orgsRes.json()
        console.log('Organizations loaded:', orgs.map((o: any) => ({ id: o.id, name: o.name, type: o.type })))
        setOrganizations(orgs)
      }
    } catch (err) {
      console.error('Failed to load data:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredStock = stock.filter(s => {
    const orgName = organizations.find(o => o.id === s.orgId)?.name || ''
    const matchesSearch = searchTerm === '' || 
      s.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      orgName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesOrg = orgFilter === 'all' || s.orgId === orgFilter
    return matchesSearch && matchesOrg
  })

  const filteredLedger = ledger.filter(l => {
    const orgName = organizations.find(o => o.id === l.orgId)?.name || ''
    const matchesSearch = searchTerm === '' || 
      l.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      orgName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesOrg = orgFilter === 'all' || l.orgId === orgFilter
    return matchesSearch && matchesOrg
  })

  const exportToExcel = () => {
    const data = showLedger ? filteredLedger : filteredStock
    const headers = showLedger 
      ? ['Date', 'Product', 'Organization', 'User', 'Action', 'Qty In', 'Qty Out', 'Remarks']
      : ['Product', 'Organization', 'Type', 'Quantity', 'Updated']
    
    const rows = data.map((item: any) => 
      showLedger
        ? [
            new Date(item.dateTime).toLocaleDateString(),
            item.productName,
            organizations.find(o => o.id === item.orgId)?.name || 'Unknown',
            item.userName,
            item.actionType,
            item.quantityIn,
            item.quantityOut,
            item.remarks || ''
          ]
        : [
            item.productName,
            organizations.find(o => o.id === item.orgId)?.name || 'Unknown',
            item.orgType,
            item.quantity,
            new Date(item.updatedAt).toLocaleDateString()
          ]
    )

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${showLedger ? 'stock_ledger' : 'stock'}_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    toast.success('Exported successfully')
  }

  if (loading) {
    return (
      <AdminLayout>
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-10 w-64 mb-2" />
              <Skeleton className="h-5 w-96" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
          <div className="grid grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="border-border/50">
                <CardContent className="p-6">
                  <Skeleton className="h-4 w-24 mb-3" />
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Card className="border-border/50">
            <CardContent className="p-6">
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Stock & Ledger
            </h1>
            <p className="text-lg text-muted-foreground mt-2">
              View and manage stock across all organizations
            </p>
          </div>
          <Button
            onClick={exportToExcel}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/25"
          >
            <FileSpreadsheet className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg">
                  <Package className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Total Products</p>
                  <p className="text-3xl font-bold">{stock.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 shadow-lg">
                  <Warehouse className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Total Stock</p>
                  <p className="text-3xl font-bold">{stock.reduce((sum, s) => sum + s.quantity, 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Organizations</p>
                  <p className="text-3xl font-bold">{organizations.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-lg">
                  <ArrowUpDown className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Ledger Entries</p>
                  <p className="text-3xl font-bold">{ledger.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters Card */}
        <Card className="border-border/50 shadow-lg bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-indigo-500" />
              <CardTitle className="text-xl font-semibold">Filters & Search</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="relative flex-1 min-w-[250px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products or organizations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-12 pl-12 border-border/50 focus:border-indigo-500 focus:ring-indigo-500/20"
                />
              </div>
              <Select value={orgFilter} onValueChange={setOrgFilter}>
                <SelectTrigger className="h-12 w-[280px] border-border/50 focus:border-indigo-500 focus:ring-indigo-500/20">
                  <SelectValue placeholder="Filter by Distributor/Sub-Distributor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Organizations</SelectItem>
                  {organizations.filter(org => org.type === 'distributor' || org.type === 'sub_distributor').map(org => (
                    <SelectItem key={org.id} value={org.id}>{org.name} ({org.type.replace('_', ' ')})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Button
                  variant={!showLedger ? "default" : "outline"}
                  onClick={() => setShowLedger(false)}
                  className={`h-12 ${!showLedger ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/25' : 'border-border/50'}`}
                >
                  <Warehouse className="h-4 w-4 mr-2" />
                  Stock
                </Button>
                <Button
                  variant={showLedger ? "default" : "outline"}
                  onClick={() => setShowLedger(true)}
                  className={`h-12 ${showLedger ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/25' : 'border-border/50'}`}
                >
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  Ledger
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Table */}
        {!showLedger ? (
          <Card className="border-border/50 shadow-lg bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-indigo-500" />
                  <CardTitle className="text-xl font-semibold">
                    Current Stock ({filteredStock.length})
                  </CardTitle>
                </div>
                {filteredStock.length > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-100 dark:bg-green-950/30 border border-green-200 dark:border-green-900/50">
                    <Sparkles className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">
                      {filteredStock.length} records
                    </span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left py-4 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Product</th>
                      <th className="text-left py-4 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Organization</th>
                      <th className="text-left py-4 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</th>
                      <th className="text-right py-4 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quantity</th>
                      <th className="text-left py-4 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Last Updated</th>
                      <th className="text-left py-4 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStock.slice(0, 100).map((item) => (
                      <tr key={item.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                        <td className="py-4 px-4 font-medium">{item.productName}</td>
                        <td className="py-4 px-4 text-muted-foreground">
                          {organizations.find(o => o.id === item.orgId)?.name || 'Unknown'}
                        </td>
                        <td className="py-4 px-4">
                          <Badge className="bg-indigo-100 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/50">
                            {item.orgType}
                          </Badge>
                        </td>
                        <td className="py-4 px-4 text-right font-bold text-lg">{item.quantity}</td>
                        <td className="py-4 px-4 text-muted-foreground text-sm">
                          {new Date(item.updatedAt).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4">
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-indigo-100 dark:hover:bg-indigo-950/30">
                            <Edit className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredStock.length === 0 && (
                  <div className="text-center py-12">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No stock records found</p>
                  </div>
                )}
                {filteredStock.length > 100 && (
                  <div className="mt-4 p-4 rounded-xl bg-muted/30 border border-border/50">
                    <p className="text-sm text-muted-foreground text-center">
                      Showing 100 of {filteredStock.length} stock records
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border/50 shadow-lg bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="h-5 w-5 text-indigo-500" />
                  <CardTitle className="text-xl font-semibold">
                    Stock Ledger ({filteredLedger.length})
                  </CardTitle>
                </div>
                {filteredLedger.length > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-100 dark:bg-green-950/30 border border-green-200 dark:border-green-900/50">
                    <Sparkles className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">
                      {filteredLedger.length} entries
                    </span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left py-4 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                      <th className="text-left py-4 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Product</th>
                      <th className="text-left py-4 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Organization</th>
                      <th className="text-left py-4 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">User</th>
                      <th className="text-left py-4 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Action</th>
                      <th className="text-right py-4 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Qty In</th>
                      <th className="text-right py-4 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Qty Out</th>
                      <th className="text-left py-4 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLedger.slice(0, 100).map((entry) => (
                      <tr key={entry.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                        <td className="py-4 px-4 text-muted-foreground text-sm">
                          {new Date(entry.dateTime).toLocaleString()}
                        </td>
                        <td className="py-4 px-4 font-medium">{entry.productName}</td>
                        <td className="py-4 px-4 text-muted-foreground">
                          {organizations.find(o => o.id === entry.orgId)?.name || 'Unknown'}
                        </td>
                        <td className="py-4 px-4 text-muted-foreground text-sm">
                          {entry.userName}
                        </td>
                        <td className="py-4 px-4">
                          <Badge className="bg-indigo-100 text-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/50">
                            {entry.actionType}
                          </Badge>
                        </td>
                        <td className="py-4 px-4 text-right text-green-600 font-semibold">
                          {entry.quantityIn > 0 ? `+${entry.quantityIn}` : '-'}
                        </td>
                        <td className="py-4 px-4 text-right text-red-600 font-semibold">
                          {entry.quantityOut > 0 ? `-${entry.quantityOut}` : '-'}
                        </td>
                        <td className="py-4 px-4 text-muted-foreground text-sm max-w-[200px] truncate">
                          {entry.remarks || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredLedger.length === 0 && (
                  <div className="text-center py-12">
                    <ArrowUpDown className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No ledger entries found</p>
                  </div>
                )}
                {filteredLedger.length > 100 && (
                  <div className="mt-4 p-4 rounded-xl bg-muted/30 border border-border/50">
                    <p className="text-sm text-muted-foreground text-center">
                      Showing 100 of {filteredLedger.length} ledger entries
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  )
}
