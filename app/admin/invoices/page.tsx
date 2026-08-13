'use client'

import { AdminLayout } from '@/components/admin-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Search, FileText, Download, RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

export default function AdminInvoicesPage() {
  const [batches, setBatches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    loadBatches()
  }, [])

  const loadBatches = async () => {
    try {
      const res = await fetch('/api/admin/invoices')
      if (res.ok) setBatches(await res.json())
    } catch (err) {
      console.error('Failed to load batches:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredBatches = batches.filter(batch => {
    const matchesSearch = searchTerm === '' || 
      batch.batchId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      batch.uploadedByName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || batch.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'processing':
        return 'bg-blue-100 text-blue-800'
      case 'partial_success':
        return 'bg-yellow-100 text-yellow-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
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
          <h1 className="text-3xl font-bold text-gray-900">Invoices & Parsing</h1>
          <p className="text-gray-600 mt-1">Monitor bulk invoice uploads and parsing status</p>
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
                  placeholder="Search batches..."
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
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="partial_success">Partial Success</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bulk Upload Batches ({filteredBatches.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Batch ID</th>
                    <th className="text-left py-3 px-4">Uploaded By</th>
                    <th className="text-left py-3 px-4">Date</th>
                    <th className="text-right py-3 px-4">Total</th>
                    <th className="text-right py-3 px-4">Success</th>
                    <th className="text-right py-3 px-4">Failed</th>
                    <th className="text-right py-3 px-4">Duplicates</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBatches.map((batch) => (
                    <tr key={batch.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4 font-mono text-xs">{batch.batchId}</td>
                      <td className="py-3 px-4">{batch.uploadedByName}</td>
                      <td className="py-3 px-4 text-muted-foreground text-xs">
                        {new Date(batch.uploadDate).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right">{batch.totalInvoices}</td>
                      <td className="py-3 px-4 text-right text-green-600">{batch.successCount}</td>
                      <td className="py-3 px-4 text-right text-red-600">{batch.failedCount}</td>
                      <td className="py-3 px-4 text-right text-yellow-600">{batch.duplicateCount}</td>
                      <td className="py-3 px-4">
                        <Badge className={getStatusColor(batch.status)}>
                          {batch.status.replace('_', ' ')}
                        </Badge>
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
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
