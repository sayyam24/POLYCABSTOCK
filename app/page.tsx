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
import { getDashboardPath, login } from '@/lib/auth'
import { useAuth } from '@/components/auth-provider'
import { ROLE_LABELS } from '@/lib/permissions'

const ALL_ROLES: UserRole[] = [
  'distributor',
  'sub_distributor',
  'retailer',
]

export default function LoginPage() {
  const router = useRouter()
  const { refresh } = useAuth()
  const [isSignup, setIsSignup] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [roleHint, setRoleHint] = useState<UserRole | 'auto'>('auto')
  const [signupRole, setSignupRole] = useState<UserRole>('retailer')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    if (isSignup) {
      // Signup logic - entirely client-side
      if (!name.trim()) {
        setError('Name is required')
        setIsLoading(false)
        return
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters')
        setIsLoading(false)
        return
      }

      try {
        // Debug environment variables
        console.log('Signup: Environment check', {
          NEXT_PUBLIC_DATA_BACKEND: process.env.NEXT_PUBLIC_DATA_BACKEND,
          MONGODB_URI: process.env.MONGODB_URI ? 'SET' : 'NOT SET'
        })

        // If MongoDB is configured, use MongoDB signup
        // Note: MONGODB_URI is server-side only, so we only check NEXT_PUBLIC_DATA_BACKEND
        if (process.env.NEXT_PUBLIC_DATA_BACKEND === 'mongo') {
          console.log('Signup: Using MongoDB backend')
          const response = await fetch('/api/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: email.trim(),
              password,
              name: name.trim(),
              role: signupRole
            })
          })

          const data = await response.json()

          if (!response.ok) {
            setError(data.error || 'Signup failed')
            setIsLoading(false)
            return
          }

          // Show success message and switch to login mode
          setError('Account created successfully! Please sign in with your credentials.')
          setIsSignup(false) // Switch back to login mode
          setIsLoading(false)
          return
        }

        // Fallback to local database for non-MongoDB mode
        const { loadDatabase } = await import('@/lib/db/local-db')
        const { firestoreId, isoNow } = await import('@/lib/firebase/utils')
        const { setLocalCredential } = await import('@/lib/db/local-credentials')
        const { DB_KEY } = await import('@/lib/db/local-db')

        const localDb = loadDatabase()
        console.log('Signup: Current user count:', localDb.users.length)

        // Check if email already exists
        const existingUser = localDb.users.find(
          (u) => u.email.toLowerCase() === email.toLowerCase()
        )
        if (existingUser) {
          setError('Email already registered')
          setIsLoading(false)
          return
        }

        // Create new organization and user
        const orgId = firestoreId('org')
        const userId = firestoreId('user')
        const ts = isoNow()

        const newOrg = {
          id: orgId,
          name: `${name}'s Organization`,
          type: signupRole,
          parentId: null,
          location: '',
          contact: email,
          ownerUserId: userId,
          createdAt: ts,
        }

        const newUser = {
          id: userId,
          authUid: userId,
          email: email.toLowerCase(),
          name: name.trim(),
          role: signupRole,
          status: 'approved' as const,
          parentId: null,
          orgId,
          location: '',
          contact: email,
          createdAt: ts,
          updatedAt: ts,
        }

        // Update local database
        localDb.organizations.push(newOrg)
        localDb.users.push(newUser)

        console.log('Signup: Saving to localStorage, new user count:', localDb.users.length)
        localStorage.setItem(DB_KEY, JSON.stringify(localDb))
        console.log('Signup: Saved to localStorage')

        // Verify save
        const savedDb = loadDatabase()
        console.log('Signup: Verification - user count after save:', savedDb.users.length)
        const savedUser = savedDb.users.find(u => u.email === email.toLowerCase())
        console.log('Signup: Verification - user found after save:', !!savedUser)

        // Store credentials for login
        setLocalCredential(email.toLowerCase(), password)
        console.log('Signup: Credentials stored')

        // Show success message and switch to login mode
        setError('Account created successfully! Please sign in with your credentials.')
        setIsSignup(false) // Switch back to login mode
        setIsLoading(false)
        return
      } catch (err) {
        setError('Signup failed. Please try again.')
        setIsLoading(false)
      }
    } else {
      // Login logic
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
        </div>
        <p className="text-sm text-sidebar-foreground/50">
          Admin: User Management · Depo: Stock &amp; Send · Distributor → Retailer chain
        </p>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 bg-background">
        <Card className="w-full max-w-lg border-0 shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">{isSignup ? 'Create account' : 'Sign in'}</CardTitle>
            <CardDescription>
              {isSignup
                ? 'Enter your details to create a new account'
                : 'Enter your credentials to access your account'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {isSignup && (
                <>
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-12"
                      placeholder="John Doe"
                      autoComplete="name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Select
                      value={signupRole}
                      onValueChange={(v) => setSignupRole(v as UserRole)}
                    >
                      <SelectTrigger className="h-12">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ALL_ROLES.map((r) => (
                          <SelectItem key={r} value={r}>
                            {ROLE_LABELS[r]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12"
                  placeholder="you@company.com"
                  autoComplete={isSignup ? 'username' : 'email'}
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

              {!isSignup && (
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
              )}

              {error && (
                <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full h-12" disabled={isLoading}>
                {isLoading ? (isSignup ? 'Creating account...' : 'Signing in...') : (isSignup ? 'Sign up' : 'Sign in')}
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                {isSignup ? 'Already have an account? ' : "Don't have an account? "}
                <button
                  type="button"
                  onClick={() => {
                    setIsSignup(!isSignup)
                    setError('')
                    setName('')
                    setEmail('')
                    setPassword('')
                  }}
                  className="font-medium text-foreground hover:underline"
                >
                  {isSignup ? 'Sign in' : 'Sign up'}
                </button>
              </p>

              {!isSignup && (
                <p className="text-center text-sm text-muted-foreground">
                  Admin creates accounts at{' '}
                  <span className="font-medium text-foreground">User Management</span>
                </p>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
