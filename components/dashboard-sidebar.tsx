'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LogOut, Menu, X, Zap } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { UserRole } from '@/lib/types'
import { ROLE_ICONS, ROLE_LABELS, ROLE_NAV } from '@/lib/navigation'
import { useAuth } from '@/components/auth-provider'

interface DashboardSidebarProps {
  role: UserRole
}

export function DashboardSidebar({ role }: DashboardSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { logout } = useAuth()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const navItems = ROLE_NAV[role]
  const RoleIcon = ROLE_ICONS[role]

  const handleLogout = () => {
    void logout().then(() => router.push('/'))
  }

  return (
    <>
      <div className="fixed top-4 left-4 z-50 lg:hidden">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="bg-card h-11 w-11 shadow-md"
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar text-sidebar-foreground transition-transform duration-300 ease-in-out lg:translate-x-0 border-r border-sidebar-border shadow-xl',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-6 bg-sidebar-primary/5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-md">
              <Zap className="h-5 w-5 text-sidebar-primary-foreground" />
            </div>
            <span className="text-lg font-bold tracking-tight">ElectroTrack</span>
          </div>

          <div className="px-4 py-4">
            <div className="flex items-center gap-3 rounded-xl bg-sidebar-accent/50 px-4 py-3 border border-sidebar-border/50">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <RoleIcon className="h-4 w-4 text-primary" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role</span>
                <span className="text-sm font-medium">{ROLE_LABELS[role]}</span>
              </div>
            </div>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4 scrollbar-thin scrollbar-thumb-sidebar-border scrollbar-track-transparent">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive =
                pathname === item.href ||
                (item.href !== `/${role}` && pathname.startsWith(item.href))

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 group',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-md'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-sm',
                  )}
                >
                  <Icon className={cn('h-5 w-5 shrink-0 transition-transform', isActive ? 'scale-110' : 'group-hover:scale-105')} />
                  <span className="transition-opacity">{item.title}</span>
                </Link>
              )
            })}
          </nav>

          <div className="border-t border-sidebar-border p-4 bg-sidebar-accent/20">
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-sidebar-foreground/70 transition-all duration-200 hover:bg-destructive/10 hover:text-destructive hover:shadow-sm group"
            >
              <LogOut className="h-5 w-5 transition-transform group-hover:scale-105" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
