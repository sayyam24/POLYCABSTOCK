'use client'

import * as React from 'react'
import type { AuthSession } from '@/lib/types'
import { getSession, logout as authLogout, subscribeAuthState } from '@/lib/auth'

interface AuthContextValue {
  session: AuthSession | null
  isLoading: boolean
  refresh: () => void
  logout: () => Promise<void>
  isAdmin: () => boolean
  isSalesman: () => boolean
}

const AuthContext = React.createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSessionState] = React.useState<AuthSession | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  const refresh = React.useCallback(() => {
    setSessionState(getSession())
    setIsLoading(false)
  }, [])

  React.useEffect(() => {
    const unsub = subscribeAuthState((nextSession) => {
      setSessionState(nextSession)
      setIsLoading(false)
    })
    return unsub
  }, [])

  const logout = React.useCallback(async () => {
    await authLogout()
    setSessionState(null)
  }, [])

  const isAdmin = React.useCallback(() => {
    return session?.role === 'admin'
  }, [session])

  const isSalesman = React.useCallback(() => {
    return session?.role === 'salesman'
  }, [session])

  return (
    <AuthContext.Provider value={{ session, isLoading, refresh, logout, isAdmin, isSalesman }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = React.useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return ctx
}
