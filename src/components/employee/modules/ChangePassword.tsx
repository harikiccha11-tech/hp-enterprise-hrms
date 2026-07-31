'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { toast } from 'sonner'
import {
  KeyRound,
  ShieldAlert,
  Lock,
  Eye,
  EyeOff,
  Check,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function ChangePassword() {
  const { user, refresh } = useAuth()
  const mustReset = !!user?.mustResetPassword
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show1, setShow1] = useState(false)
  const [show2, setShow2] = useState(false)
  const [show3, setShow3] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const strength = scoreStrength(next)
  const mismatch = confirm.length > 0 && next !== confirm
  const tooShort = next.length > 0 && next.length < 8
  const canSubmit = next.length >= 8 && next === confirm && (mustReset || current.length > 0) && !submitting

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (tooShort) { toast.error('Password must be at least 8 characters'); return }
    if (mismatch) { toast.error('Passwords do not match'); return }
    setSubmitting(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: mustReset ? undefined : current,
          newPassword: next,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to change password')
      toast.success('Password changed successfully')
      setCurrent(''); setNext(''); setConfirm('')
      await refresh()
    } catch (e: any) {
      toast.error(e.message || 'Failed to change password')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {mustReset && (
        <Alert className="border-amber-500/40 bg-amber-500/10">
          <ShieldAlert className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800 dark:text-amber-300">Password reset required</AlertTitle>
          <AlertDescription className="text-amber-700 dark:text-amber-200">
            Your account is using a temporary password. Please set a new password to secure your account and continue using the portal.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyRound className="h-4 w-4 text-[var(--gold)]" /> Change Password
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            {!mustReset && (
              <div className="space-y-1.5">
                <Label htmlFor="cp">Current Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="cp"
                    type={show1 ? 'text' : 'password'}
                    value={current}
                    onChange={e => setCurrent(e.target.value)}
                    placeholder="Enter current password"
                    className="pl-9 pr-10"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShow1(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={show1 ? 'Hide password' : 'Show password'}
                  >
                    {show1 ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="np">New Password</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="np"
                  type={show2 ? 'text' : 'password'}
                  value={next}
                  onChange={e => setNext(e.target.value)}
                  placeholder="At least 8 characters"
                  className="pl-9 pr-10"
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShow2(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={show2 ? 'Hide password' : 'Show password'}
                >
                  {show2 ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {/* Strength meter */}
              {next.length > 0 && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[0, 1, 2, 3].map(i => (
                      <div
                        key={i}
                        className={cn(
                          'h-1.5 flex-1 rounded-full transition-colors',
                          i < strength.score ? strength.color : 'bg-muted'
                        )}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Strength: <span className="font-medium" style={{ color: strength.hex }}>{strength.label}</span>
                    {tooShort && <span className="ml-2 text-red-600">• Min 8 characters</span>}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cfp">Confirm New Password</Label>
              <div className="relative">
                <Check className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="cfp"
                  type={show3 ? 'text' : 'password'}
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="Re-enter new password"
                  className={cn('pl-9 pr-10', mismatch && 'border-red-500 focus-visible:ring-red-500')}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShow3(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={show3 ? 'Hide password' : 'Show password'}
                >
                  {show3 ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {mismatch && <p className="text-xs text-red-600">Passwords do not match</p>}
              {confirm.length > 0 && !mismatch && <p className="text-xs text-emerald-600">Passwords match</p>}
            </div>

            <div className="rounded-lg border bg-muted/30 p-3">
              <p className="text-xs font-medium text-muted-foreground">Password requirements:</p>
              <ul className="mt-1.5 space-y-1 text-xs text-muted-foreground">
                <Req met={next.length >= 8}>At least 8 characters</Req>
                <Req met={/[A-Z]/.test(next) && /[a-z]/.test(next)}>Mix of upper and lower case</Req>
                <Req met={/\d/.test(next)}>At least one number</Req>
                <Req met={/[^A-Za-z0-9]/.test(next)}>At least one special character (recommended)</Req>
              </ul>
            </div>

            <Button
              type="submit"
              disabled={!canSubmit}
              className="w-full bg-[var(--navy)] hover:bg-[var(--navy-light)]"
            >
              {submitting ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating…</>
              ) : (
                <><KeyRound className="mr-2 h-4 w-4" /> Update Password</>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

function Req({ met, children }: { met: boolean; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2">
      <span className={cn('grid h-3.5 w-3.5 place-items-center rounded-full', met ? 'bg-emerald-500 text-white' : 'bg-muted')}>
        {met && <Check className="h-2.5 w-2.5" />}
      </span>
      <span className={met ? 'text-emerald-700 dark:text-emerald-400' : ''}>{children}</span>
    </li>
  )
}

function scoreStrength(pw: string): { score: number; label: string; color: string; hex: string } {
  if (!pw) return { score: 0, label: '—', color: '', hex: '#5A6A8A' }
  let s = 0
  if (pw.length >= 8) s++
  if (pw.length >= 12) s++
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s++
  if (/\d/.test(pw)) s++
  if (/[^A-Za-z0-9]/.test(pw)) s++
  s = Math.min(4, s)
  const map = [
    { label: 'Very weak', color: 'bg-red-500', hex: '#EF4444' },
    { label: 'Weak', color: 'bg-amber-500', hex: '#F59E0B' },
    { label: 'Fair', color: 'bg-sky-500', hex: '#0EA5E9' },
    { label: 'Good', color: 'bg-emerald-500', hex: '#10B981' },
    { label: 'Strong', color: 'bg-emerald-600', hex: '#059669' },
  ]
  return { score: s, ...map[s] }
}
