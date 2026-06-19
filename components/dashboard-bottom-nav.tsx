'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { UserRole } from '@/lib/types'
import { ROLE_NAV } from '@/lib/navigation'

interface DashboardBottomNavProps {
  role: UserRole
}

export function DashboardBottomNav({ role }: DashboardBottomNavProps) {
  const pathname = usePathname()
  const navItems = ROLE_NAV[role].slice(0, 5)

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card lg:hidden">
      <div className="flex items-center justify-around px-1 py-2 safe-area-pb">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive =
            pathname === item.href ||
            (item.href !== `/${role}` && pathname.startsWith(item.href))

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-lg px-1 py-2 text-[10px] font-medium transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className={cn('h-5 w-5 shrink-0', isActive && 'text-primary')} />
              <span className="truncate w-full text-center">{item.title}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
