'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LogOut, Menu, X, Zap, ChevronRight, Settings, HelpCircle } from 'lucide-react'
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
          className="bg-white/80 backdrop-blur-xl h-11 w-11 shadow-lg border-border/50"
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
          'fixed left-0 top-0 z-40 h-screen w-72 bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900 transition-transform duration-300 ease-in-out lg:translate-x-0 border-r border-border/50 shadow-2xl',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo Section */}
          <div className="flex h-20 items-center gap-3 border-b border-border/50 px-6 bg-gradient-to-r from-indigo-500/5 to-purple-500/5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 shadow-lg shadow-indigo-500/25">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">ElectroTrack</span>
              <p className="text-xs text-muted-foreground">Stock Management</p>
            </div>
          </div>

          {/* Role Badge */}
          <div className="px-5 py-6">
            <div className="flex items-center gap-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/30 dark:to-purple-950/30 px-5 py-4 border border-indigo-100 dark:border-indigo-900/50 shadow-sm">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 shadow-md">
                <RoleIcon className="h-6 w-6 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Current Role</span>
                <span className="text-base font-bold text-indigo-600 dark:text-indigo-400">{ROLE_LABELS[role]}</span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2 overflow-y-auto px-4 pb-4 scrollbar-thin">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 mb-2">
              Main Menu
            </div>
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
                    'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 group relative overflow-hidden',
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/25'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:shadow-sm',
                  )}
                >
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-100" />
                  )}
                  <Icon className={cn('h-5 w-5 shrink-0 transition-transform relative z-10', isActive ? 'scale-110 text-white' : 'group-hover:scale-105 group-hover:text-indigo-600')} />
                  <span className="relative z-10 transition-opacity">{item.title}</span>
                  {isActive && <ChevronRight className="ml-auto h-4 w-4 relative z-10" />}
                </Link>
              )
            })}

            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 mt-6 mb-2">
              System
            </div>
            <Link
              href={`/${role}/settings`}
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:shadow-sm transition-all duration-200 group"
            >
              <Settings className="h-5 w-5 shrink-0 group-hover:scale-105 group-hover:text-indigo-600" />
              <span>Settings</span>
            </Link>
            <Link
              href={`/${role}/help`}
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:shadow-sm transition-all duration-200 group"
            >
              <HelpCircle className="h-5 w-5 shrink-0 group-hover:scale-105 group-hover:text-indigo-600" />
              <span>Help & Support</span>
            </Link>
          </nav>

          {/* Logout */}
          <div className="border-t border-border/50 p-4 bg-gradient-to-r from-slate-50 to-white dark:from-slate-900/50 dark:to-slate-900">
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-600 dark:text-slate-400 transition-all duration-200 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 dark:hover:text-red-400 hover:shadow-sm group"
            >
              <LogOut className="h-5 w-5 transition-transform group-hover:scale-105 group-hover:text-red-600" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
