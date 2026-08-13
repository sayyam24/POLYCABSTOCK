'use client'

import { AdminLayout } from '@/components/admin-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/components/auth-provider'
import { useEffect, useState } from 'react'
import { 
  Users, 
  Building2, 
  Package, 
  Warehouse, 
  FileText, 
  Truck, 
  CreditCard,
  TrendingUp,
  Activity
} from 'lucide-react'

export default function AdminDashboard() {
  const { session } = useAuth()
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalOrganizations: 0,
    totalProducts: 0,
    totalStock: 0,
    totalInvoices: 0,
    totalShipments: 0,
    activeSubscriptions: 0,
    totalRevenue: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      const res = await fetch('/api/admin/stats')
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (err) {
      console.error('Failed to load admin stats:', err)
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    { title: 'Total Users', value: stats.totalUsers, icon: Users, color: 'bg-blue-50 text-blue-600' },
    { title: 'Organizations', value: stats.totalOrganizations, icon: Building2, color: 'bg-green-50 text-green-600' },
    { title: 'Products', value: stats.totalProducts, icon: Package, color: 'bg-purple-50 text-purple-600' },
    { title: 'Total Stock', value: stats.totalStock, icon: Warehouse, color: 'bg-orange-50 text-orange-600' },
    { title: 'Invoices', value: stats.totalInvoices, icon: FileText, color: 'bg-pink-50 text-pink-600' },
    { title: 'Shipments', value: stats.totalShipments, icon: Truck, color: 'bg-cyan-50 text-cyan-600' },
    { title: 'Active Subscriptions', value: stats.activeSubscriptions, icon: CreditCard, color: 'bg-indigo-50 text-indigo-600' },
    { title: 'Total Revenue', value: `₹${stats.totalRevenue.toLocaleString()}`, icon: TrendingUp, color: 'bg-emerald-50 text-emerald-600' },
  ]

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Overview of system performance and metrics</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Activity className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {statCards.map((stat) => {
                const Icon = stat.icon
                return (
                  <Card key={stat.title}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                          <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                        </div>
                        <div className={`p-3 rounded-lg ${stat.color}`}>
                          <Icon className="h-6 w-6" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Recent system activity will appear here.</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Health</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Database Status</span>
                      <span className="text-sm font-medium text-green-600">Connected</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">API Status</span>
                      <span className="text-sm font-medium text-green-600">Operational</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">PDF Parser</span>
                      <span className="text-sm font-medium text-green-600">Running</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  )
}
