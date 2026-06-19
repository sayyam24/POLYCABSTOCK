'use client'

import type { UserRole } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { canCreateRole, ROLE_LABELS } from '@/lib/permissions'
import { useAuth } from '@/components/auth-provider'
import { electroTrackService } from '@/lib/services/electrotrack.service'
import { useStore } from '@/components/store-provider'
import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

interface CreateUserFormProps {
  allowedRoles?: UserRole[]
  onCreated?: () => void
}

export function CreateUserForm({ allowedRoles, onCreated }: CreateUserFormProps) {
  const { session } = useAuth()
  const { refresh } = useStore()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [location, setLocation] = useState('')
  const [contact, setContact] = useState('')
  const [role, setRole] = useState<UserRole>(
    () => allowedRoles?.[0] ?? 'depo',
  )
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [createdLogin, setCreatedLogin] = useState<{ email: string; password: string } | null>(
    null,
  )
  const [loading, setLoading] = useState(false)

  if (!session) return null

  const creatable =
    allowedRoles ??
    (['admin', 'depo', 'distributor', 'sub_distributor', 'retailer'] as UserRole[]).filter(
      (r) => canCreateRole(session.role, r),
    )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setCreatedLogin(null)

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    try {
      const result = await electroTrackService.createUser(session, {
        name,
        email,
        password,
        role,
        location,
        contact,
      })
      refresh()
      setCreatedLogin({ email: result.loginEmail, password })
      setSuccess(
        `${ROLE_LABELS[role]} "${name}" created. Share the login details below with this user.`,
      )
      setName('')
      setEmail('')
      setPassword('')
      setConfirmPassword('')
      setLocation('')
      setContact('')
      onCreated?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Role</Label>
          <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
            <SelectTrigger className="h-12">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {creatable.map((r) => (
                <SelectItem key={r} value={r}>
                  {ROLE_LABELS[r]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Full name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} className="h-12" required />
        </div>
        <div className="space-y-2">
          <Label>Login email</Label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12"
            placeholder="user@company.com"
            required
          />
        </div>
        <div className="space-y-2">
          <Label>Location</Label>
          <Input value={location} onChange={(e) => setLocation(e.target.value)} className="h-12" />
        </div>
        <div className="space-y-2">
          <Label>Password</Label>
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 pr-10"
              placeholder="Min. 6 characters"
              required
              minLength={6}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Confirm password</Label>
          <Input
            type={showPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="h-12"
            required
            minLength={6}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label>Contact</Label>
          <Input value={contact} onChange={(e) => setContact(e.target.value)} className="h-12" />
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && <p className="text-sm text-green-600 dark:text-green-400">{success}</p>}

      {createdLogin && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm space-y-1">
          <p className="font-medium">Login credentials (share with user)</p>
          <p>
            <span className="text-muted-foreground">Email:</span>{' '}
            <code className="font-mono">{createdLogin.email}</code>
          </p>
          <p>
            <span className="text-muted-foreground">Password:</span>{' '}
            <code className="font-mono">{createdLogin.password}</code>
          </p>
          <p className="text-xs text-muted-foreground pt-1">
            They sign in at the home page with this email and password (role is detected
            automatically). Role: <strong>{ROLE_LABELS[role]}</strong>.
          </p>
        </div>
      )}

      <Button type="submit" size="lg" className="h-12 w-full sm:w-auto" disabled={loading}>
        {loading ? 'Creating...' : `Create ${ROLE_LABELS[role]} account`}
      </Button>
    </form>
  )
}
