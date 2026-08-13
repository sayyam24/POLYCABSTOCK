'use client'

import { AdminLayout } from '@/components/admin-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, BarChart3, Download, FileSpreadsheet, FileText } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

export default function AdminReportsPage() {
  const [organizations, setOrganizations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [reportType, setReportType] = useState('stock')
  const [orgFilter, setOrgFilter] = useState('all')
  const [dateRange, setDateRange] = useState('30')

  useEffect(() => {
    loadOrganizations()
  }, [])

  const loadOrganizations = async () => {
    try {
      const res = await fetch('/api/admin/organizations')
      if (res.ok) setOrganizations(await res.json())
    } catch (err) {
      console.error('Failed to load organizations:', err)
    } finally {
      setLoading(false)
    }
  }

  const generateReport = async () => {
    toast.loading('Generating report...')
    
    try {
      const res = await fetch('/api/admin/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: reportType,
          orgId: orgFilter === 'all' ? null : orgFilter,
          dateRange,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        toast.success('Report generated successfully')
        
        // Download the report
        const blob = new Blob([data.csv], { type: 'text/csv;charset=utf-8;' })
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = `${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`
        link.click()
      } else {
        toast.error('Failed to generate report')
      }
    } catch (err) {
      console.error('Failed to generate report:', err)
      toast.error('Failed to generate report')
    } finally {
      toast.dismiss()
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
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-600 mt-1">Generate and export system reports</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Report Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Report Type</label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stock">Stock Report</SelectItem>
                    <SelectItem value="shipments">Shipments Report</SelectItem>
                    <SelectItem value="invoices">Invoices Report</SelectItem>
                    <SelectItem value="ledger">Stock Ledger Report</SelectItem>
                    <SelectItem value="users">Users Report</SelectItem>
                    <SelectItem value="payments">Payments Report</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Organization</label>
                <Select value={orgFilter} onValueChange={setOrgFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Organizations</SelectItem>
                    {organizations.map(org => (
                      <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Date Range</label>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">Last 7 Days</SelectItem>
                    <SelectItem value="30">Last 30 Days</SelectItem>
                    <SelectItem value="90">Last 90 Days</SelectItem>
                    <SelectItem value="365">Last Year</SelectItem>
                    <SelectItem value="all">All Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <Button onClick={generateReport} className="w-full">
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Stock Report</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Current stock levels across all organizations with product details.
              </p>
              <Button variant="outline" size="sm" onClick={() => setReportType('stock')}>
                <Download className="h-4 w-4 mr-2" />
                Generate
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Shipments Report</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                All shipments with status, sender/receiver details and items.
              </p>
              <Button variant="outline" size="sm" onClick={() => setReportType('shipments')}>
                <Download className="h-4 w-4 mr-2" />
                Generate
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Invoices Report</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Bulk invoice uploads with parsing status and results.
              </p>
              <Button variant="outline" size="sm" onClick={() => setReportType('invoices')}>
                <Download className="h-4 w-4 mr-2" />
                Generate
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Stock Ledger Report</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Complete stock movement history with quantity in/out tracking.
              </p>
              <Button variant="outline" size="sm" onClick={() => setReportType('ledger')}>
                <Download className="h-4 w-4 mr-2" />
                Generate
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Users Report</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                All users with roles, status and organization details.
              </p>
              <Button variant="outline" size="sm" onClick={() => setReportType('users')}>
                <Download className="h-4 w-4 mr-2" />
                Generate
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Payments Report</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                All payment transactions with status and subscription details.
              </p>
              <Button variant="outline" size="sm" onClick={() => setReportType('payments')}>
                <Download className="h-4 w-4 mr-2" />
                Generate
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  )
}
