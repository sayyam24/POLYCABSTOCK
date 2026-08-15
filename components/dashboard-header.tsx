'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Bell, Search, User, Settings, LogOut } from 'lucide-react'
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
    distributor: '/distributor/notifications',
    sub_distributor: '/sub-distributor/notifications',
    retailer: '/retailer/notifications',
    salesman: '/salesman/notifications',
  }
  const notifHref =
    notificationsHref ?? (session ? defaultNotifications[session.role] : '/admin/notifications')

  const handleLogout = () => {
    void logout().then(() => router.push('/'))
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/50 bg-card/80 backdrop-blur-md px-4 lg:px-8 lg:pl-8 shadow-sm">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold text-foreground sm:text-2xl lg:text-3xl tracking-tight truncate pr-2">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search..."
            className="w-52 lg:w-64 pl-9 bg-background/50 border-border/50 focus:bg-background transition-colors h-10 rounded-lg"
          />
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="relative h-10 w-10 rounded-lg hover:bg-accent transition-colors"
          asChild
        >
          <Link href={notifHref}>
            <Bell className="h-5 w-5" />
            <span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-medium text-primary-foreground shadow-md animate-pulse">
              3
            </span>
          </Link>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="flex items-center gap-2 h-10 px-3 rounded-lg hover:bg-accent transition-colors"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-md">
                <User className="h-4 w-4" />
              </div>
              <span className="hidden font-medium md:inline-block max-w-[120px] truncate text-sm">
                {displayName}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 rounded-lg shadow-lg border-border/50">
            <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {session?.email}
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border/50" />
            <DropdownMenuItem className="cursor-pointer hover:bg-accent/50">
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer hover:bg-accent/50">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border/50" />
            <DropdownMenuItem
              className="text-destructive cursor-pointer hover:bg-destructive/10"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
