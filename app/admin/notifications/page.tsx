'use client'

import { useState } from 'react'
import { DashboardLayout } from '@/components/dashboard-layout'
import { DashboardHeader } from '@/components/dashboard-header'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Bell,
  Package,
  AlertTriangle,
  CheckCircle2,
  ArrowLeftRight,
  FileText,
  Settings,
  Trash2,
  Check,
  Clock,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Notification {
  id: string
  type: 'stock' | 'transfer' | 'invoice' | 'alert' | 'system'
  title: string
  message: string
  time: string
  read: boolean
}

const allNotifications: Notification[] = [
  {
    id: '1',
    type: 'alert',
    title: 'Low Stock Alert',
    message: 'Power Supply PS-100 is below minimum threshold at RetailMax',
    time: '5 minutes ago',
    read: false,
  },
  {
    id: '2',
    type: 'transfer',
    title: 'Transfer Completed',
    message: 'TRF-2024-156 from Factory A to Distributor X has been delivered',
    time: '15 minutes ago',
    read: false,
  },
  {
    id: '3',
    type: 'invoice',
    title: 'Invoice Verified',
    message: 'INV-2024-0156 has been verified and approved for payment',
    time: '1 hour ago',
    read: false,
  },
  {
    id: '4',
    type: 'stock',
    title: 'Stock Received',
    message: '500 units of Circuit Board CB-500 received at Distributor Y',
    time: '2 hours ago',
    read: true,
  },
  {
    id: '5',
    type: 'system',
    title: 'System Maintenance',
    message: 'Scheduled maintenance window: Sunday 2AM - 4AM EST',
    time: '3 hours ago',
    read: true,
  },
  {
    id: '6',
    type: 'alert',
    title: 'Transfer Delayed',
    message: 'TRF-2024-145 shipment delayed due to weather conditions',
    time: '5 hours ago',
    read: true,
  },
  {
    id: '7',
    type: 'transfer',
    title: 'Transfer Request',
    message: 'New transfer request from TechMart requires approval',
    time: '6 hours ago',
    read: true,
  },
  {
    id: '8',
    type: 'invoice',
    title: 'Invoice Rejected',
    message: 'INV-2024-0153 has been rejected - duplicate entry detected',
    time: '1 day ago',
    read: true,
  },
]

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'stock':
      return <Package className="h-5 w-5" />
    case 'transfer':
      return <ArrowLeftRight className="h-5 w-5" />
    case 'invoice':
      return <FileText className="h-5 w-5" />
    case 'alert':
      return <AlertTriangle className="h-5 w-5" />
    case 'system':
      return <Settings className="h-5 w-5" />
    default:
      return <Bell className="h-5 w-5" />
  }
}

const getNotificationColor = (type: string) => {
  switch (type) {
    case 'alert':
      return 'bg-destructive/10 text-destructive'
    case 'transfer':
      return 'bg-primary/10 text-primary'
    case 'invoice':
      return 'bg-success/10 text-success'
    case 'stock':
      return 'bg-chart-2/10 text-chart-2'
    case 'system':
      return 'bg-muted text-muted-foreground'
    default:
      return 'bg-primary/10 text-primary'
  }
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(allNotifications)
  const [activeTab, setActiveTab] = useState('all')

  const unreadCount = notifications.filter((n) => !n.read).length

  const filteredNotifications = notifications.filter((notification) => {
    if (activeTab === 'all') return true
    if (activeTab === 'unread') return !notification.read
    return notification.type === activeTab
  })

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  const clearAll = () => {
    setNotifications([])
  }

  return (
    <DashboardLayout role="admin">
      <DashboardHeader title="Notifications" userName="Admin User" />

      <main className="p-4 lg:p-8 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Bell className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{notifications.length}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-warning/10">
                <Clock className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{unreadCount}</p>
                <p className="text-sm text-muted-foreground">Unread</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-destructive/10">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {notifications.filter((n) => n.type === 'alert').length}
                </p>
                <p className="text-sm text-muted-foreground">Alerts</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-success/10">
                <CheckCircle2 className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {notifications.filter((n) => n.read).length}
                </p>
                <p className="text-sm text-muted-foreground">Read</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notifications List */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>All Notifications</CardTitle>
                <CardDescription>
                  Stay updated with stock alerts, transfers, and system messages
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={markAllAsRead} disabled={unreadCount === 0}>
                  <Check className="mr-2 h-4 w-4" />
                  Mark all read
                </Button>
                <Button variant="outline" size="sm" onClick={clearAll} disabled={notifications.length === 0}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear all
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="unread">
                  Unread
                  {unreadCount > 0 && (
                    <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                      {unreadCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="alert">Alerts</TabsTrigger>
                <TabsTrigger value="transfer">Transfers</TabsTrigger>
                <TabsTrigger value="invoice">Invoices</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-0">
                {filteredNotifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
                      <Bell className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <p className="text-lg font-medium">No notifications</p>
                    <p className="text-sm text-muted-foreground">
                      {"You're all caught up!"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={cn(
                          'flex items-start gap-4 p-4 rounded-lg border transition-colors',
                          notification.read
                            ? 'bg-background border-border'
                            : 'bg-primary/5 border-primary/20'
                        )}
                      >
                        <div
                          className={cn(
                            'flex h-10 w-10 items-center justify-center rounded-lg shrink-0',
                            getNotificationColor(notification.type)
                          )}
                        >
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{notification.title}</p>
                            {!notification.read && (
                              <div className="h-2 w-2 rounded-full bg-primary" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {notification.time}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => markAsRead(notification.id)}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => deleteNotification(notification.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Notification Settings
            </CardTitle>
            <CardDescription>Configure how you receive notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Stock Alerts', description: 'Low stock and reorder notifications', enabled: true },
                { label: 'Transfer Updates', description: 'Stock movement status updates', enabled: true },
                { label: 'Invoice Notifications', description: 'Invoice upload and verification', enabled: true },
                { label: 'System Messages', description: 'Maintenance and system updates', enabled: false },
              ].map((setting) => (
                <div
                  key={setting.label}
                  className={cn(
                    'flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-colors',
                    setting.enabled
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <div>
                    <p className="font-medium">{setting.label}</p>
                    <p className="text-xs text-muted-foreground">{setting.description}</p>
                  </div>
                  <div
                    className={cn(
                      'h-5 w-5 rounded-full flex items-center justify-center',
                      setting.enabled ? 'bg-primary' : 'bg-border'
                    )}
                  >
                    {setting.enabled && <Check className="h-3 w-3 text-primary-foreground" />}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </DashboardLayout>
  )
}
