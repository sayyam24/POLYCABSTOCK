'use client'

import { AdminLayout } from '@/components/admin-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Search, RotateCcw, FileText } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function AdminReturnsPage() {
  const [returns, setReturns] = useState<any[]>([])
  const [organizations, setOrganizations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [returnsRes, orgsRes] = await Promise.all([
        fetch('/api/admin/returns'),
        fetch('/api/admin/organizations'),
      ])
      
      if (returnsRes.ok) setReturns(await returnsRes.json())
      if (orgsRes.ok) setOrganizations(await orgsRes.json())
    } catch (err) {
      console.error('Failed to load data:', err)
    } finally {
      setLoading(false)
    }
  }

  const filteredReturns = returns.filter(ret => {
    const fromOrg = organizations.find(o => o.id === ret.fromOrgId)?.name || ''
    const toOrg = organizations.find(o => o.id === ret.toOrgId)?.name || ''
    const matchesSearch = searchTerm === '' || 
      ret.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fromOrg.toLowerCase().includes(searchTerm.toLowerCase()) ||
      toOrg.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

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
          <h1 className="text-3xl font-bold text-gray-900">Returns</h1>
          <p className="text-gray-600 mt-1">Manage stock returns across the system</p>
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
                  placeholder="Search returns..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stock Returns ({filteredReturns.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Invoice #</th>
                    <th className="text-left py-3 px-4">From</th>
                    <th className="text-left py-3 px-4">To</th>
                    <th className="text-left py-3 px-4">Items</th>
                    <th className="text-left py-3 px-4">Reason</th>
                    <th className="text-left py-3 px-4">Created</th>
                    <th className="text-left py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReturns.map((ret) => (
                    <tr key={ret.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4 font-mono text-xs">{ret.invoiceNumber}</td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {organizations.find(o => o.id === ret.fromOrgId)?.name || 'Unknown'}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {organizations.find(o => o.id === ret.toOrgId)?.name || 'Unknown'}
                      </td>
                      <td className="py-3 px-4">{ret.items.length}</td>
                      <td className="py-3 px-4 text-muted-foreground text-xs max-w-[200px] truncate">
                        {ret.reason || '-'}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground text-xs">
                        {new Date(ret.createdAt).toLocaleDateString()}
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
