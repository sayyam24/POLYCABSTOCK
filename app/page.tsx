'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Zap, Eye, EyeOff, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { UserRole } from '@/lib/types'
import { DEMO_CREDENTIALS, getDashboardPath, login } from '@/lib/auth'
import { useAuth } from '@/components/auth-provider'
import { ROLE_LABELS } from '@/lib/permissions'

const ALL_ROLES: UserRole[] = [
  'admin',
  'depo',
  'distributor',
  'sub_distributor',
  'retailer',
]

export default function LoginPage() {
  const router = useRouter()
  const { refresh } = useAuth()
  const [email, setEmail] = useState(DEMO_CREDENTIALS.admin.email)
  const [password, setPassword] = useState(DEMO_CREDENTIALS.admin.password)
  const [roleHint, setRoleHint] = useState<UserRole | 'auto'>('auto')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const fillDemo = (role: UserRole) => {
    setRoleHint(role)
    setEmail(DEMO_CREDENTIALS[role].email)
    setPassword(DEMO_CREDENTIALS[role].password)
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    const expectedRole = roleHint === 'auto' ? undefined : roleHint
    const result = await login(email, password, expectedRole)

    if (!result.success || !result.session) {
      setError(result.error ?? 'Login failed')
      setIsLoading(false)
      return
    }

    refresh()
    router.push(getDashboardPath(result.session.role))
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-sidebar flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sidebar-primary">
            <Zap className="h-7 w-7 text-sidebar-primary-foreground" />
          </div>
          <span className="text-2xl font-bold text-sidebar-foreground">ElectroTrack</span>
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-sidebar-foreground leading-tight">
            Bill-based stock tracking
          </h1>
          <p className="text-lg text-sidebar-foreground/70 max-w-md">
            Factory → Depo → Sub Distributor → Distributor → Retailer. Upload a bill or
            Excel on send; receiver confirms to update stock. Returns adjust stock back.
          </p>
          <ol className="text-sm text-sidebar-foreground/80 space-y-2 list-decimal list-inside">
            <li>Factory updates stock and sends to depo with bill/Excel</li>
            <li>Each level receives, confirms, then sends downstream</li>
            <li>Distributor must attach retailer bill copy on send</li>
          </ol>
          <div className="flex flex-wrap gap-2 pt-2">
            {ALL_ROLES.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => fillDemo(r)}
                className="rounded-lg border border-sidebar-border px-3 py-1.5 text-xs text-sidebar-foreground hover:bg-sidebar-accent"
              >
                Demo {ROLE_LABELS[r]}
              </button>
            ))}
          </div>
        </div>
        <p className="text-sm text-sidebar-foreground/50">
          Admin: User Management · Depo: Stock &amp; Send · Distributor → Retailer chain
        </p>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 bg-background">
        <Card className="w-full max-w-lg border-0 shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Sign in</CardTitle>
            <CardDescription>
              Demo mode — use the credentials below or pick a role
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-5 rounded-lg border bg-muted/50 p-3 text-sm space-y-2">
              <p className="font-medium">Demo login (pre-filled)</p>
              <p>
                <span className="text-muted-foreground">Email:</span>{' '}
                <code className="font-mono text-xs">{DEMO_CREDENTIALS.admin.email}</code>
              </p>
              <p>
                <span className="text-muted-foreground">Password:</span>{' '}
                <code className="font-mono text-xs">{DEMO_CREDENTIALS.admin.password}</code>
              </p>
              <div className="flex flex-wrap gap-2 pt-1 lg:hidden">
                {ALL_ROLES.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => fillDemo(r)}
                    className="rounded-md border px-2 py-1 text-xs hover:bg-background"
                  >
                    {ROLE_LABELS[r]}
                  </button>
                ))}
              </div>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12"
                  placeholder="you@company.com"
                  autoComplete="email"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 pr-10"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Role (optional)</Label>
                <Select
                  value={roleHint}
                  onValueChange={(v) => setRoleHint(v as UserRole | 'auto')}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto-detect from account</SelectItem>
                    {ALL_ROLES.map((r) => (
                      <SelectItem key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground flex items-start gap-1">
                  <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                  Leave on Auto-detect unless you have multiple roles on one email.
                </p>
              </div>

              {error && (
                <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full h-12" disabled={isLoading}>
                {isLoading ? 'Signing in...' : 'Sign in with demo account'}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                Admin creates accounts at{' '}
                <span className="font-medium text-foreground">User Management</span>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
