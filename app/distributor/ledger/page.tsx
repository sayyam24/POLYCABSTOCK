'use client'

import { DashboardLayout } from '@/components/dashboard-layout'
import { DashboardHeader } from '@/components/dashboard-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/components/auth-provider'
import { useState, useEffect } from 'react'
import type { StockLedger } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, FileSpreadsheet, FileText } from 'lucide-react'

export default function DistributorLedgerPage() {
  const { session } = useAuth()
  const [ledger, setLedger] = useState<StockLedger[]>([])
  const [loading, setLoading] = useState(true)
  const [filteredLedger, setFilteredLedger] = useState<StockLedger[]>([])
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [actionType, setActionType] = useState<string>('all')

  useEffect(() => {
    if (!session) return

    const loadLedger = async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/state', { cache: 'no-store' })
        if (!res.ok) {
          throw new Error(`Failed to load data: ${res.status}`)
        }
        
        const data = await res.json()
        const orgLedger = (data.stockLedger || []).filter((entry: StockLedger) => entry.orgId === session.orgId)
        setLedger(orgLedger)
        setFilteredLedger(orgLedger)
      } catch (err) {
        console.error('Failed to load ledger:', err)
      } finally {
        setLoading(false)
      }
    }

    loadLedger()
  }, [session])

  useEffect(() => {
    let filtered = ledger

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(entry =>
        entry.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.productCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.referenceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.userName.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Date filter
    if (dateFrom) {
      filtered = filtered.filter(entry => entry.dateTime >= dateFrom)
    }
    if (dateTo) {
      filtered = filtered.filter(entry => entry.dateTime <= dateTo)
    }

    // Action type filter
    if (actionType !== 'all') {
      filtered = filtered.filter(entry => entry.actionType === actionType)
    }

    setFilteredLedger(filtered)
  }, [searchTerm, dateFrom, dateTo, actionType, ledger])

  const exportToExcel = () => {
    const headers = ['Date', 'Product', 'Product Code', 'User', 'Role', 'Action', 'Reference', 'Qty In', 'Qty Out', 'Balance', 'Remarks']
    const rows = filteredLedger.map(entry => [
      new Date(entry.dateTime).toLocaleString(),
      entry.productName,
      entry.productCode,
      entry.userName,
      entry.userRole,
      entry.actionType,
      entry.referenceNumber,
      entry.quantityIn,
      entry.quantityOut,
      entry.closingBalance,
      entry.remarks || ''
    ])

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `stock_ledger_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  const exportToPDF = () => {
    const content = filteredLedger.map(entry => 
      `${new Date(entry.dateTime).toLocaleString()} | ${entry.productName} | ${entry.productCode} | ${entry.userName} | ${entry.userRole} | ${entry.actionType} | ${entry.referenceNumber} | In: ${entry.quantityIn} | Out: ${entry.quantityOut} | Balance: ${entry.closingBalance} | ${entry.remarks || ''}`
    ).join('\n')

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `stock_ledger_${new Date().toISOString().split('T')[0]}.txt`
    link.click()
  }

  const getActionTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      opening_stock: 'Opening Stock',
      sent: 'Sent',
      received: 'Received',
      return: 'Return',
      manual_entry: 'Manual Entry',
      invoice_upload: 'Invoice Upload',
      manual_return: 'Manual Return'
    }
    return labels[type] || type
  }

  return (
    <DashboardLayout role="distributor">
      <DashboardHeader title="Stock Ledger" />
      <main className="p-4 lg:p-8">
        <Card>
          <CardHeader>
            <CardTitle>Stock Movement History</CardTitle>
            <div className="flex flex-wrap gap-4 mt-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search product, invoice, user..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Input
                type="date"
                placeholder="From date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-[180px]"
              />
              <Input
                type="date"
                placeholder="To date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-[180px]"
              />
              <Select value={actionType} onValueChange={setActionType}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Action Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="opening_stock">Opening Stock</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="received">Received</SelectItem>
                  <SelectItem value="return">Return</SelectItem>
                  <SelectItem value="manual_entry">Manual Entry</SelectItem>
                  <SelectItem value="invoice_upload">Invoice Upload</SelectItem>
                  <SelectItem value="manual_return">Manual Return</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={exportToExcel} variant="outline">
                <FileSpreadsheet className="h-4 w-4 mr-2" />
                Export Excel
              </Button>
              <Button onClick={exportToPDF} variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div>Loading...</div>
            ) : filteredLedger.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No ledger entries found matching your filters
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Date & Time</th>
                      <th className="text-left py-3 px-4">Product</th>
                      <th className="text-left py-3 px-4">Code</th>
                      <th className="text-left py-3 px-4">User</th>
                      <th className="text-left py-3 px-4">Action</th>
                      <th className="text-left py-3 px-4">Reference</th>
                      <th className="text-right py-3 px-4">Qty In</th>
                      <th className="text-right py-3 px-4">Qty Out</th>
                      <th className="text-right py-3 px-4">Balance</th>
                      <th className="text-left py-3 px-4">Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLedger.map((entry) => (
                      <tr key={entry.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4">{new Date(entry.dateTime).toLocaleString()}</td>
                        <td className="py-3 px-4 font-medium">{entry.productName}</td>
                        <td className="py-3 px-4 text-muted-foreground">{entry.productCode}</td>
                        <td className="py-3 px-4">
                          <div>{entry.userName}</div>
                          <div className="text-xs text-muted-foreground">{entry.userRole}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 rounded-full text-xs bg-muted">
                            {getActionTypeLabel(entry.actionType)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">{entry.referenceNumber}</td>
                        <td className="py-3 px-4 text-right text-green-600 font-medium">
                          {entry.quantityIn > 0 ? `+${entry.quantityIn}` : '-'}
                        </td>
                        <td className="py-3 px-4 text-right text-red-600 font-medium">
                          {entry.quantityOut > 0 ? `-${entry.quantityOut}` : '-'}
                        </td>
                        <td className="py-3 px-4 text-right font-bold">{entry.closingBalance}</td>
                        <td className="py-3 px-4 text-muted-foreground text-xs max-w-[200px] truncate">
                          {entry.remarks || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="mt-4 text-sm text-muted-foreground">
              Showing {filteredLedger.length} of {ledger.length} entries
            </div>
          </CardContent>
        </Card>
      </main>
    </DashboardLayout>
  )
}
