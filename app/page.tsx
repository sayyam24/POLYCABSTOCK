'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Zap, Eye, EyeOff, Info, ArrowRight, CheckCircle2, Building2, Truck, Users, BarChart3, Shield, Sparkles } from 'lucide-react'
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
  'admin',
  'distributor',
  'sub_distributor',
  'retailer',
  'salesman',
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
    <div className="min-h-screen flex bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-300 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-purple-300 rounded-full blur-3xl animate-pulse delay-2000" />
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 h-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 shadow-lg">
              <Zap className="h-8 w-8 text-white" />
            </div>
            <span className="text-3xl font-bold text-white tracking-tight">ElectroTrack</span>
          </div>

          {/* Main Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20">
                <Sparkles className="h-4 w-4 text-yellow-300" />
                <span className="text-sm font-medium text-white/90">Premium Stock Management</span>
              </div>
              <h1 className="text-5xl font-bold text-white leading-tight tracking-tight">
                Transform Your
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-400">
                  Electrical Distribution
                </span>
              </h1>
              <p className="text-xl text-white/80 max-w-lg leading-relaxed">
                Complete bill-based stock tracking from Factory to Retailer. Streamline your distribution chain with real-time inventory management.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Multi-Level</h3>
                  <p className="text-sm text-white/70">Factory → Retailer</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
                  <Truck className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Shipments</h3>
                  <p className="text-sm text-white/70">Bill-based tracking</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Analytics</h3>
                  <p className="text-sm text-white/70">Real-time insights</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/20">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Secure</h3>
                  <p className="text-sm text-white/70">Role-based access</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Info */}
          <div className="flex items-center gap-6 text-sm text-white/60">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>Enterprise-ready</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>24/7 Support</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>Cloud-based</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">ElectroTrack</span>
          </div>

          <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-xl dark:bg-slate-900/80">
            <CardHeader className="text-center space-y-2 pb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 mb-4 mx-auto shadow-lg">
                <Users className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-3xl font-bold tracking-tight">
                {isSignup ? 'Create Account' : 'Welcome Back'}
              </CardTitle>
              <CardDescription className="text-base">
                {isSignup
                  ? 'Start managing your electrical distribution today'
                  : 'Enter your credentials to access your dashboard'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                {isSignup && (
                  <>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Full Name</Label>
                      <Input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="h-12 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20"
                        placeholder="John Doe"
                        autoComplete="name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold">Role</Label>
                      <Select
                        value={signupRole}
                        onValueChange={(v) => setSignupRole(v as UserRole)}
                      >
                        <SelectTrigger className="h-12 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20">
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
                  <Label className="text-sm font-semibold">Email</Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20"
                    placeholder="you@company.com"
                    autoComplete={isSignup ? 'username' : 'email'}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Password</Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 pr-12 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20"
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {!isSignup && (
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Role (optional)</Label>
                    <Select
                      value={roleHint}
                      onValueChange={(v) => setRoleHint(v as UserRole | 'auto')}
                    >
                      <SelectTrigger className="h-12 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20">
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
                    <p className="text-xs text-slate-500 flex items-start gap-2 bg-slate-50 p-3 rounded-lg">
                      <Info className="h-4 w-4 shrink-0 mt-0.5 text-indigo-500" />
                      <span>Leave on Auto-detect unless you have multiple roles on one email.</span>
                    </p>
                  </div>
                )}

                {error && (
                  <div className="flex items-start gap-2 p-4 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
                    <Info className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold shadow-lg shadow-indigo-500/25 transition-all duration-200"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    isSignup ? 'Creating account...' : 'Signing in...'
                  ) : (
                    <>
                      {isSignup ? 'Create Account' : 'Sign In'}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>

                <div className="text-center pt-4 border-t border-slate-200">
                  <p className="text-sm text-slate-600">
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
                      className="font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                    >
                      {isSignup ? 'Sign in' : 'Sign up'}
                    </button>
                  </p>
                </div>

                {!isSignup && (
                  <p className="text-center text-xs text-slate-500">
                    Admin creates accounts at{' '}
                    <span className="font-semibold text-indigo-600">User Management</span>
                  </p>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="mt-8 text-center text-sm text-slate-500">
            <p>© 2024 ElectroTrack. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
