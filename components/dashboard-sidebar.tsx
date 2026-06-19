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
          className="bg-card h-11 w-11"
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar text-sidebar-foreground transition-transform lg:translate-x-0',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center gap-2 border-b border-sidebar-border px-6">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
              <Zap className="h-5 w-5 text-sidebar-primary-foreground" />
            </div>
            <span className="text-lg font-bold">ElectroTrack</span>
          </div>

          <div className="px-4 py-4">
            <div className="flex items-center gap-2 rounded-lg bg-sidebar-accent px-3 py-2.5">
              <RoleIcon className="h-5 w-5 shrink-0" />
              <span className="text-sm font-medium">{ROLE_LABELS[role]}</span>
            </div>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
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
                    'flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {item.title}
                </Link>
              )
            })}
          </nav>

          <div className="border-t border-sidebar-border p-4">
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <LogOut className="h-5 w-5" />
              Logout
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
