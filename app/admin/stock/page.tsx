'use client'

import { AdminLayout } from '@/components/admin-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Search, Warehouse, Edit, Download, FileSpreadsheet } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

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
      if (orgsRes.ok) setOrganizations(await orgsRes.json())
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
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-600">Loading...</div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Stock & Ledger</h1>
            <p className="text-gray-600 mt-1">View and manage stock across all organizations</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportToExcel}>
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Export Excel
            </Button>
          </div>
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
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={orgFilter} onValueChange={setOrgFilter}>
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder="Organization" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Organizations</SelectItem>
                  {organizations.map(org => (
                    <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Button
                  variant={!showLedger ? "default" : "outline"}
                  onClick={() => setShowLedger(false)}
                >
                  Stock
                </Button>
                <Button
                  variant={showLedger ? "default" : "outline"}
                  onClick={() => setShowLedger(true)}
                >
                  Ledger
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {!showLedger ? (
          <Card>
            <CardHeader>
              <CardTitle>Current Stock ({filteredStock.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Product</th>
                      <th className="text-left py-3 px-4">Organization</th>
                      <th className="text-left py-3 px-4">Type</th>
                      <th className="text-right py-3 px-4">Quantity</th>
                      <th className="text-left py-3 px-4">Last Updated</th>
                      <th className="text-left py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStock.slice(0, 100).map((item) => (
                      <tr key={item.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4 font-medium">{item.productName}</td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {organizations.find(o => o.id === item.orgId)?.name || 'Unknown'}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline">{item.orgType}</Badge>
                        </td>
                        <td className="py-3 px-4 text-right font-bold">{item.quantity}</td>
                        <td className="py-3 px-4 text-muted-foreground text-xs">
                          {new Date(item.updatedAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredStock.length > 100 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Showing 100 of {filteredStock.length} stock records
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Stock Ledger ({filteredLedger.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Date</th>
                      <th className="text-left py-3 px-4">Product</th>
                      <th className="text-left py-3 px-4">Organization</th>
                      <th className="text-left py-3 px-4">User</th>
                      <th className="text-left py-3 px-4">Action</th>
                      <th className="text-right py-3 px-4">Qty In</th>
                      <th className="text-right py-3 px-4">Qty Out</th>
                      <th className="text-left py-3 px-4">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLedger.slice(0, 100).map((entry) => (
                      <tr key={entry.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4 text-muted-foreground text-xs">
                          {new Date(entry.dateTime).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 font-medium">{entry.productName}</td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {organizations.find(o => o.id === entry.orgId)?.name || 'Unknown'}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground text-xs">
                          {entry.userName}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant="outline">{entry.actionType}</Badge>
                        </td>
                        <td className="py-3 px-4 text-right text-green-600 font-medium">
                          {entry.quantityIn > 0 ? `+${entry.quantityIn}` : '-'}
                        </td>
                        <td className="py-3 px-4 text-right text-red-600 font-medium">
                          {entry.quantityOut > 0 ? `-${entry.quantityOut}` : '-'}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground text-xs max-w-[200px] truncate">
                          {entry.remarks || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredLedger.length > 100 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Showing 100 of {filteredLedger.length} ledger entries
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  )
}
