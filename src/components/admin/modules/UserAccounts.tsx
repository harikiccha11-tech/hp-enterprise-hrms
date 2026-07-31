'use client'
import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { SectionTitle, StatusBadge, EmptyState } from '@/components/shared'
import { toast } from 'sonner'
import {
  UserCog, Plus, KeyRound, Lock, Unlock, Trash2, Crown, ShieldCheck, ShieldAlert,
  Copy, Eye, EyeOff, Building2,
} from 'lucide-react'
import { api, fmtDateTime, fmtRelative } from '../lib'
import { ROLE_LABELS } from '@/lib/constants'

interface UserRow {
  id: string
  username: string
  email: string
  role: string
  locked: boolean
  mustResetPassword: boolean
  lastLoginAt: string | null
  createdAt: string
  employee?: { id: string; fullName: string; employeeCode: string | null } | null
}

export function UserAccounts({ refreshKey }: { refreshKey: number }) {
  const [list, setList] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [resetting, setResetting] = useState<UserRow | null>(null)
  const [deleting, setDeleting] = useState<UserRow | null>(null)
  const [lockToggling, setLockToggling] = useState<UserRow | null>(null)
  const [showCreds, setShowCreds] = useState<{ username: string; password: string } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api<{ users: UserRow[] }>('/api/admin/users')
      setList(data.users || [])
    } catch (e: any) {
      toast.error(e.message || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load, refreshKey])

  const roleIcon = (role: string) => {
    if (role === 'OWNER') return <Crown className="h-4 w-4 text-[var(--gold)]" />
    if (role === 'SUPER_ADMIN') return <ShieldCheck className="h-4 w-4 text-[var(--navy)]" />
    if (role === 'HR_MANAGER') return <ShieldAlert className="h-4 w-4 text-sky-600" />
    if (role === 'CLIENT') return <Building2 className="h-4 w-4 text-emerald-600" />
    return <UserCog className="h-4 w-4 text-muted-foreground" />
  }

  return (
    <div className="space-y-5">
      <SectionTitle
        title="User Accounts"
        desc="As the Owner, you create Admin & HR Manager accounts and issue credentials. Only you can manage these accounts."
        action={
          <Button className="bg-[var(--navy)] hover:bg-[var(--navy-light)]" onClick={() => setCreating(true)}>
            <Plus className="mr-1 h-4 w-4" /> Create Account
          </Button>
        }
      />

      {/* Role summary */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <RoleCard icon={Crown} label="Owner" count={list.filter(u => u.role === 'OWNER').length} desc="Full control" color="gold" />
        <RoleCard icon={ShieldCheck} label="Admins" count={list.filter(u => u.role === 'SUPER_ADMIN').length} desc="Operations & payroll" color="navy" />
        <RoleCard icon={ShieldAlert} label="HR Managers" count={list.filter(u => u.role === 'HR_MANAGER').length} desc="Verify & manage staff" color="sky" />
        <RoleCard icon={Building2} label="Clients" count={list.filter(u => u.role === 'CLIENT').length} desc="Client portal" color="emerald" />
        <RoleCard icon={UserCog} label="Total Accounts" count={list.length} desc="All users" color="muted" />
      </div>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : list.length === 0 ? (
            <EmptyState icon={UserCog} title="No accounts yet" desc="Create Admin, HR Manager, or Client accounts to delegate work." />
          ) : (
            <div className="max-h-[60vh] overflow-y-auto scroll-thin rounded-lg border">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-card">
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead className="hidden md:table-cell">Last Login</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.map((u) => (
                    <TableRow key={u.id} className="hover:bg-muted/40">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="grid h-9 w-9 place-items-center rounded-full bg-[var(--navy)]/10">
                            {roleIcon(u.role)}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[var(--navy)] dark:text-white">{u.username}</p>
                            <p className="text-[11px] text-muted-foreground">{u.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={u.role === 'OWNER' ? 'border-[var(--gold)]/50 text-[#8a6f24] bg-[var(--gold)]/5' : ''}>
                          {ROLE_LABELS[u.role] || u.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {u.lastLoginAt ? fmtRelative(u.lastLoginAt) : 'Never'}
                      </TableCell>
                      <TableCell>
                        {u.locked ? (
                          <Badge variant="outline" className="border-red-500/30 text-red-700"><Lock className="mr-1 h-3 w-3" /> Locked</Badge>
                        ) : (
                          <Badge variant="outline" className="border-emerald-500/30 text-emerald-700">Active</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {u.role !== 'OWNER' && (
                          <div className="flex items-center justify-end gap-1">
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="Reset password" onClick={() => setResetting(u)}>
                              <KeyRound className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title={u.locked ? 'Unlock' : 'Lock'} onClick={() => setLockToggling(u)}>
                              {u.locked ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                            </Button>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-600 hover:text-red-700" title="Delete" onClick={() => setDeleting(u)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {creating && (
        <CreateUserDialog
          onClose={() => setCreating(false)}
          onSuccess={(username, password) => {
            setShowCreds({ username, password })
            setCreating(false)
            load()
          }}
        />
      )}

      {resetting && (
        <ResetPasswordDialog
          user={resetting}
          onClose={() => setResetting(null)}
          onSuccess={(password) => {
            setShowCreds({ username: resetting.username, password })
            setResetting(null)
            load()
          }}
        />
      )}

      {lockToggling && (
        <LockToggleDialog
          user={lockToggling}
          onClose={() => setLockToggling(null)}
          onSuccess={() => { setLockToggling(null); load() }}
        />
      )}

      {deleting && (
        <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete account?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the account <strong>{deleting.username}</strong> ({ROLE_LABELS[deleting.role]}). This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={async () => {
                  try {
                    await fetch(`/api/admin/users/${deleting.id}`, { method: 'DELETE' })
                    toast.success('Account deleted')
                    setDeleting(null); load()
                  } catch (e: any) { toast.error(e.message || 'Failed') }
                }}
              >Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {showCreds && (
        <Dialog open={!!showCreds} onOpenChange={(o) => !o && setShowCreds(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-[var(--gold)]" /> Credentials Generated
              </DialogTitle>
              <DialogDescription>
                Share these credentials securely with the user. They will not be shown again.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="rounded-lg border border-[var(--gold)]/30 bg-[var(--gold)]/5 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">Username</span>
                  <Button size="sm" variant="ghost" className="h-6 px-2" onClick={() => { navigator.clipboard.writeText(showCreds.username); toast.success('Copied') }}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <p className="font-mono font-bold text-[var(--navy)] dark:text-white">{showCreds.username}</p>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">Password</span>
                  <Button size="sm" variant="ghost" className="h-6 px-2" onClick={() => { navigator.clipboard.writeText(showCreds.password); toast.success('Copied') }}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <p className="font-mono font-bold text-[var(--navy)] dark:text-white">{showCreds.password}</p>
              </div>
              <div className="rounded-lg border border-amber-500/30 bg-amber-50 p-3 text-sm text-amber-800">
                <strong>Important:</strong> Save these credentials securely. The user can login at the Employee portal with these details.
              </div>
            </div>
            <DialogFooter>
              <Button className="bg-[var(--navy)] hover:bg-[var(--navy-light)]" onClick={() => setShowCreds(null)}>Done</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

function RoleCard({ icon: Icon, label, count, desc, color }: { icon: any; label: string; count: number; desc: string; color: string }) {
  const colors: Record<string, string> = {
    gold: 'bg-[var(--gold)]/10 text-[#8a6f24]',
    navy: 'bg-[var(--navy)]/10 text-[var(--navy)]',
    sky: 'bg-sky-500/10 text-sky-700',
    emerald: 'bg-emerald-500/10 text-emerald-700',
    muted: 'bg-muted text-muted-foreground',
  }
  return (
    <Card className="lift">
      <CardContent className="pt-5 pb-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-bold text-[var(--navy)] dark:text-white">{count}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{desc}</p>
          </div>
          <div className={`grid h-10 w-10 place-items-center rounded-lg ${colors[color]}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function CreateUserDialog({ onClose, onSuccess }: { onClose: () => void; onSuccess: (username: string, password: string) => void }) {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('HR_MANAGER')
  const [clientId, setClientId] = useState('')
  const [clients, setClients] = useState<{ id: string; clientName: string }[]>([])
  const [loadingClients, setLoadingClients] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [saving, setSaving] = useState(false)

  // Fetch clients list when role is set to CLIENT
  useEffect(() => {
    if (role === 'CLIENT' && clients.length === 0) {
      setLoadingClients(true)
      api<{ clients: { id: string; clientName: string }[] }>('/api/admin/clients')
        .then((data) => setClients(data.clients || []))
        .catch(() => {})
        .finally(() => setLoadingClients(false))
    }
  }, [role, clients.length])

  // Reset clientId when role changes away from CLIENT
  useEffect(() => {
    if (role !== 'CLIENT') setClientId('')
  }, [role])

  function genPassword() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#$'
    let p = ''
    for (let i = 0; i < 12; i++) p += chars[Math.floor(Math.random() * chars.length)]
    setPassword(p)
  }

  async function submit() {
    if (!username.trim() || !email.trim() || !password) { toast.error('All fields are required'); return }
    if (role === 'CLIENT' && !clientId) { toast.error('Please select a client to link'); return }
    setSaving(true)
    try {
      const payload: Record<string, string> = { username, email, password, role }
      if (role === 'CLIENT') payload.clientId = clientId
      const res = await fetch('/api/admin/users', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      toast.success(`${ROLE_LABELS[role]} account created`)
      onSuccess(username.trim().toLowerCase(), password)
    } catch (e: any) { toast.error(e.message || 'Failed') } finally { setSaving(false) }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><UserCog className="h-5 w-5 text-[var(--gold)]" /> Create User Account</DialogTitle>
          <DialogDescription>Create an Admin, HR Manager, or Client portal account. Credentials will be shown once for you to share securely.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Role *</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="HR_MANAGER">HR Manager — verifies documents, manages employees</SelectItem>
                <SelectItem value="SUPER_ADMIN">Admin — full operations + payroll</SelectItem>
                <SelectItem value="CLIENT">Client — client portal access</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {role === 'CLIENT' && (
            <div className="space-y-1.5">
              <Label>Link to Client *</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger>
                  <SelectValue placeholder={loadingClients ? 'Loading clients…' : 'Select a client'} />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.clientName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Username *</Label>
            <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder={role === 'CLIENT' ? 'e.g. infosys.client' : 'e.g. hr.sunita'} />
          </div>
          <div className="space-y-1.5">
            <Label>Email *</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@hpenterprise.co.in" />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>Password *</Label>
              <div className="flex items-center gap-1">
                <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={genPassword}>Generate</Button>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setShowPass(!showPass)}>
                  {showPass ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>
            <Input type={showPass ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 8 characters" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button className="bg-[var(--navy)] hover:bg-[var(--navy-light)]" disabled={saving} onClick={submit}>
            {saving ? 'Creating…' : 'Create & Generate Credentials'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ResetPasswordDialog({ user, onClose, onSuccess }: { user: UserRow; onClose: () => void; onSuccess: (password: string) => void }) {
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [saving, setSaving] = useState(false)

  function genPassword() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#$'
    let p = ''
    for (let i = 0; i < 12; i++) p += chars[Math.floor(Math.random() * chars.length)]
    setPassword(p)
  }

  async function submit() {
    if (!password || password.length < 8) { toast.error('Password must be at least 8 characters'); return }
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset_password', password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      toast.success('Password reset')
      onSuccess(password)
    } catch (e: any) { toast.error(e.message || 'Failed') } finally { setSaving(false) }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5 text-[var(--gold)]" /> Reset Password</DialogTitle>
          <DialogDescription>Set a new password for <strong>{user.username}</strong> ({ROLE_LABELS[user.role]}).</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>New Password *</Label>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={genPassword}>Generate</Button>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setShowPass(!showPass)}>
                {showPass ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </div>
          <Input type={showPass ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 8 characters" />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button className="bg-[var(--navy)] hover:bg-[var(--navy-light)]" disabled={saving} onClick={submit}>
            {saving ? 'Resetting…' : 'Reset Password'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function LockToggleDialog({ user, onClose, onSuccess }: { user: UserRow; onClose: () => void; onSuccess: () => void }) {
  const [saving, setSaving] = useState(false)
  const action = user.locked ? 'unlock' : 'lock'
  async function submit() {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      toast.success(`Account ${action}ed`)
      onSuccess()
    } catch (e: any) { toast.error(e.message || 'Failed') } finally { setSaving(false) }
  }
  return (
    <AlertDialog open onOpenChange={(o) => !o && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{user.locked ? 'Unlock' : 'Lock'} account?</AlertDialogTitle>
          <AlertDialogDescription>
            {user.locked
              ? `Unlock ${user.username}? They will be able to login again.`
              : `Lock ${user.username}? They will be unable to login until unlocked.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction disabled={saving} onClick={submit}>
            {saving ? 'Processing…' : `Confirm ${action}`}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
