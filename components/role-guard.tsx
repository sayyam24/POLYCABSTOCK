'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { UserRole } from '@/lib/types'
import { useAuth } from '@/components/auth-provider'
import { getDashboardPath } from '@/lib/auth'

interface RoleGuardProps {
  allowedRole: UserRole
  children: React.ReactNode
}

export function RoleGuard({ allowedRole, children }: RoleGuardProps) {
  const { session, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return
    if (!session) {
      router.replace('/')
      return
    }
    if (session.role !== allowedRole) {
      router.replace(getDashboardPath(session.role))
    }
  }, [session, isLoading, allowedRole, router])

  if (isLoading || !session || session.role !== allowedRole) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
