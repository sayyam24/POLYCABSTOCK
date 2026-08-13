'use client'

import { AdminLayout } from '@/components/admin-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Search, Shield, Download } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [entityFilter, setEntityFilter] = useState('all')
  const [actionFilter, setActionFilter] = useState('all')

  useEffect(() => {
    loadLogs()
  }, [])

  const loadLogs = async () => {
    try {
      const res = await fetch('/api/admin/audit-logs')
      if (res.ok) setLogs(await res.json())
    } catch (err) {
      console.error('Failed to load audit logs:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredLogs = logs.filter(log => {
    const matchesSearch = searchTerm === '' || 
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesEntity = entityFilter === 'all' || log.entityType === entityFilter
    const matchesAction = actionFilter === 'all' || log.action === actionFilter
    return matchesSearch && matchesEntity && matchesAction
  })

  const getEntityColor = (entity: string) => {
    const colors: Record<string, string> = {
      user: 'bg-blue-100 text-blue-800',
      organization: 'bg-green-100 text-green-800',
      product: 'bg-purple-100 text-purple-800',
      stock: 'bg-orange-100 text-orange-800',
      shipment: 'bg-cyan-100 text-cyan-800',
      invoice: 'bg-pink-100 text-pink-800',
      subscription: 'bg-indigo-100 text-indigo-800',
      payment: 'bg-emerald-100 text-emerald-800',
    }
    return colors[entity] || 'bg-gray-100 text-gray-800'
  }

  const exportLogs = () => {
    const headers = ['Date', 'User', 'Role', 'Action', 'Entity Type', 'Entity Name', 'Changes', 'IP Address']
    const rows = filteredLogs.map(log => [
      new Date(log.timestamp).toLocaleString(),
      log.userName,
      log.userRole,
      log.action,
      log.entityType,
      log.entityName,
      JSON.stringify(log.changes),
      log.ipAddress || '-'
    ])

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    toast.success('Audit logs exported successfully')
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
            <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
            <p className="text-gray-600 mt-1">Track all system changes and user actions</p>
          </div>
          <Button variant="outline" onClick={exportLogs}>
            <Download className="h-4 w-4 mr-2" />
            Export Logs
          </Button>
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
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={entityFilter} onValueChange={setEntityFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Entity Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Entities</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="organization">Organization</SelectItem>
                  <SelectItem value="product">Product</SelectItem>
                  <SelectItem value="stock">Stock</SelectItem>
                  <SelectItem value="shipment">Shipment</SelectItem>
                  <SelectItem value="invoice">Invoice</SelectItem>
                  <SelectItem value="subscription">Subscription</SelectItem>
                  <SelectItem value="payment">Payment</SelectItem>
                </SelectContent>
              </Select>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="create">Create</SelectItem>
                  <SelectItem value="update">Update</SelectItem>
                  <SelectItem value="delete">Delete</SelectItem>
                  <SelectItem value="activate">Activate</SelectItem>
                  <SelectItem value="deactivate">Deactivate</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Audit Log Entries ({filteredLogs.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Date</th>
                    <th className="text-left py-3 px-4">User</th>
                    <th className="text-left py-3 px-4">Action</th>
                    <th className="text-left py-3 px-4">Entity Type</th>
                    <th className="text-left py-3 px-4">Entity Name</th>
                    <th className="text-left py-3 px-4">Changes</th>
                    <th className="text-left py-3 px-4">IP Address</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.slice(0, 100).map((log) => (
                    <tr key={log.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4 text-muted-foreground text-xs">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium">{log.userName}</div>
                        <div className="text-xs text-muted-foreground">{log.userRole}</div>
                      </td>
                      <td className="py-3 px-4 capitalize">{log.action}</td>
                      <td className="py-3 px-4">
                        <Badge className={getEntityColor(log.entityType)}>
                          {log.entityType}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 font-medium">{log.entityName}</td>
                      <td className="py-3 px-4 text-muted-foreground text-xs max-w-[150px] truncate">
                        {Object.keys(log.changes || {}).length} fields changed
                      </td>
                      <td className="py-3 px-4 text-muted-foreground text-xs">
                        {log.ipAddress || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredLogs.length > 100 && (
                <p className="text-xs text-muted-foreground mt-2">
                  Showing 100 of {filteredLogs.length} log entries
                </p>
              )}
              {filteredLogs.length === 0 && (
                <p className="text-center py-8 text-muted-foreground">
                  No audit logs found matching your filters
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  )
}
