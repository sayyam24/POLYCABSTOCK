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
  Activity,
  CheckCircle2,
  AlertCircle,
  Zap,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

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
    { 
      title: 'Total Users', 
      value: stats.totalUsers, 
      icon: Users, 
      gradient: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50 dark:bg-blue-950/30',
      textColor: 'text-blue-600 dark:text-blue-400',
      change: '+12%',
      changeType: 'positive'
    },
    { 
      title: 'Organizations', 
      value: stats.totalOrganizations, 
      icon: Building2, 
      gradient: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-50 dark:bg-green-950/30',
      textColor: 'text-green-600 dark:text-green-400',
      change: '+8%',
      changeType: 'positive'
    },
    { 
      title: 'Products', 
      value: stats.totalProducts, 
      icon: Package, 
      gradient: 'from-purple-500 to-pink-500',
      bgColor: 'bg-purple-50 dark:bg-purple-950/30',
      textColor: 'text-purple-600 dark:text-purple-400',
      change: '+5%',
      changeType: 'positive'
    },
    { 
      title: 'Total Stock', 
      value: stats.totalStock, 
      icon: Warehouse, 
      gradient: 'from-orange-500 to-amber-500',
      bgColor: 'bg-orange-50 dark:bg-orange-950/30',
      textColor: 'text-orange-600 dark:text-orange-400',
      change: '-3%',
      changeType: 'negative'
    },
    { 
      title: 'Invoices', 
      value: stats.totalInvoices, 
      icon: FileText, 
      gradient: 'from-pink-500 to-rose-500',
      bgColor: 'bg-pink-50 dark:bg-pink-950/30',
      textColor: 'text-pink-600 dark:text-pink-400',
      change: '+15%',
      changeType: 'positive'
    },
    { 
      title: 'Shipments', 
      value: stats.totalShipments, 
      icon: Truck, 
      gradient: 'from-cyan-500 to-blue-500',
      bgColor: 'bg-cyan-50 dark:bg-cyan-950/30',
      textColor: 'text-cyan-600 dark:text-cyan-400',
      change: '+10%',
      changeType: 'positive'
    },
    { 
      title: 'Active Subscriptions', 
      value: stats.activeSubscriptions, 
      icon: CreditCard, 
      gradient: 'from-indigo-500 to-purple-500',
      bgColor: 'bg-indigo-50 dark:bg-indigo-950/30',
      textColor: 'text-indigo-600 dark:text-indigo-400',
      change: '+20%',
      changeType: 'positive'
    },
    { 
      title: 'Total Revenue', 
      value: `₹${stats.totalRevenue.toLocaleString()}`, 
      icon: TrendingUp, 
      gradient: 'from-emerald-500 to-green-500',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
      textColor: 'text-emerald-600 dark:text-emerald-400',
      change: '+25%',
      changeType: 'positive'
    },
  ]

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <p className="text-lg text-muted-foreground mt-2">
              Overview of system performance and metrics
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-medium">
            <Zap className="h-4 w-4" />
            <span>Live</span>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="border-border/50">
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {statCards.map((stat) => {
                const Icon = stat.icon
                return (
                  <Card 
                    key={stat.title} 
                    className="border-border/50 shadow-sm hover:shadow-md transition-all duration-200 group"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                            {stat.title}
                          </p>
                          <p className="text-3xl font-bold tracking-tight">{stat.value}</p>
                          <div className="flex items-center gap-1.5">
                            {stat.changeType === 'positive' ? (
                              <ArrowUpRight className="h-4 w-4 text-green-500" />
                            ) : (
                              <ArrowDownRight className="h-4 w-4 text-red-500" />
                            )}
                            <span className={`text-sm font-medium ${
                              stat.changeType === 'positive' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                            }`}>
                              {stat.change}
                            </span>
                            <span className="text-xs text-muted-foreground">vs last month</span>
                          </div>
                        </div>
                        <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient} shadow-lg group-hover:scale-110 transition-transform duration-200`}>
                          <Icon className="h-6 w-6 text-white" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Bottom Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Activity */}
              <Card className="lg:col-span-2 border-border/50 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-semibold flex items-center gap-2">
                    <Activity className="h-5 w-5 text-indigo-500" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-950/50">
                          <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">New user registered</p>
                          <p className="text-xs text-muted-foreground">2 hours ago</p>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-green-600">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Completed</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* System Health */}
              <Card className="border-border/50 shadow-sm">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-semibold flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    System Health
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { name: 'Database', status: 'Connected', color: 'text-green-600' },
                      { name: 'API', status: 'Operational', color: 'text-green-600' },
                      { name: 'PDF Parser', status: 'Running', color: 'text-green-600' },
                      { name: 'Cache', status: 'Active', color: 'text-green-600' },
                      { name: 'Storage', status: 'Available', color: 'text-green-600' },
                    ].map((item) => (
                      <div key={item.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                        <span className="text-sm font-medium">{item.name}</span>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                          <span className={`text-sm font-semibold ${item.color}`}>{item.status}</span>
                        </div>
                      </div>
                    ))}
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
