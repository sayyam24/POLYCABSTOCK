'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Bell, Search, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/components/auth-provider'
import type { UserRole } from '@/lib/types'

interface DashboardHeaderProps {
  title: string
  userName?: string
  notificationsHref?: string
}

export function DashboardHeader({
  title,
  userName,
  notificationsHref,
}: DashboardHeaderProps) {
  const { session, logout } = useAuth()
  const router = useRouter()
  const displayName = userName ?? session?.name ?? 'User'

  const defaultNotifications: Record<UserRole, string> = {
    admin: '/admin/notifications',
    depo: '/depo/notifications',
    distributor: '/distributor/notifications',
    sub_distributor: '/sub-distributor/notifications',
    retailer: '/retailer/notifications',
  }
  const notifHref =
    notificationsHref ?? (session ? defaultNotifications[session.role] : '/admin/notifications')

  const handleLogout = () => {
    void logout().then(() => router.push('/'))
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-card px-4 lg:px-8 lg:pl-8">
      <h1 className="text-lg font-semibold text-foreground sm:text-xl lg:text-2xl truncate pr-2">
        {title}
      </h1>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search..." className="w-52 lg:w-64 pl-9 bg-background h-10" />
        </div>

        <Button variant="ghost" size="icon" className="relative h-11 w-11" asChild>
          <Link href={notifHref}>
            <Bell className="h-5 w-5" />
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
              3
            </span>
          </Link>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 h-11 px-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <User className="h-4 w-4" />
              </div>
              <span className="hidden font-medium md:inline-block max-w-[120px] truncate">
                {displayName}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>{session?.email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={handleLogout}>
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
