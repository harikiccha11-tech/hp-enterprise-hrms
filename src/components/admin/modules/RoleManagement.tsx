'use client'
import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { SectionTitle, EmptyState } from '@/components/shared'
import { toast } from 'sonner'
import { Shield, UserPlus, Crown, UserCog, Users, User, Building2 } from 'lucide-react'
import { api } from '../lib'
import { fmtDateTime } from '../lib'

interface UserItem {
  id: string; username: string; email: string; role: string; locked: boolean
  lastLoginAt: string | null; createdAt: string
  employee: { fullName: string } | null
}

const ROLE_CONFIG: Record<string, { label: string; color: string; icon: any; desc: string }> = {
  OWNER: { label: 'Owner', color: 'bg-amber-500/10 text-amber-700 border-amber-500/30', icon: Crown, desc: 'Full system control. Can manage all users, settings, and data.' },
  SUPER_ADMIN: { label: 'Super Admin', color: 'bg-red-500/10 text-red-700 border-red-500/30', icon: Shield, desc: 'Full administrative access except managing Owner accounts.' },
  HR_MANAGER: { label: 'HR Manager', color: 'bg-sky-500/10 text-sky-700 border-sky-500/30', icon: UserCog, desc: 'Manage employees, leaves, payroll, attendance, and recruitment.' },
  EMPLOYEE: { label: 'Employee', color: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30', icon: Users, desc: 'Self-service access to personal data, leave, and attendance.' },
  CLIENT: { label: 'Client', color: 'bg-violet-500/10 text-violet-700 border-violet-500/30', icon: Building2, desc: 'Access to project-related information and invoices.' },
}

const ROLES = ['OWNER', 'SUPER_ADMIN', 'HR_MANAGER', 'EMPLOYEE', 'CLIENT']

export function RoleManagement({ refreshKey, isOwner }: { refreshKey: number; isOwner: boolean }) {
  const [users, setUsers] = useState<UserItem[]>([])
  const [loading, setLoading] = useState(true)
  const [roleFilter, setRoleFilter] = useState('')
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'EMPLOYEE' })
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api<{ users: UserItem[] }>('/api/admin/roles')
      setUsers(data.users || [])
    } catch (e: any) { toast.error(e.message || 'Failed to load') } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load, refreshKey])

  const filtered = roleFilter ? users.filter(u => u.role === roleFilter) : users

  const changeRole = async (userId: string, newRole: string) => {
    try {
      await api('/api/admin/roles', { method: 'PATCH', body: JSON.stringify({ id: userId, role: newRole }) })
      toast.success('Role updated')
      load()
    } catch (e: any) { toast.error(e.message) }
  }

  const createUser = async () => {
    if (!form.username.trim()) { toast.error('Username is required'); return }
    if (!form.email.trim()) { toast.error('Email is required'); return }
    if (!form.password.trim()) { toast.error('Password is required'); return }
    setSaving(true)
    try {
      await api('/api/admin/roles', { method: 'POST', body: JSON.stringify(form) })
      toast.success('User created')
      setCreating(false)
      setForm({ username: '', email: '', password: '', role: 'EMPLOYEE' })
      load()
    } catch (e: any) { toast.error(e.message) } finally { setSaving(false) }
  }

  // Group counts
  const roleCounts = users.reduce((acc, u) => { acc[u.role] = (acc[u.role] || 0) + 1; return acc }, {} as Record<string, number>)

  return (
    <div className="space-y-5">
      <SectionTitle title="Role Management" desc="Manage user roles and access levels" action={
        isOwner ? (
          <Button className="bg-[var(--navy)] text-white hover:bg-[var(--navy-light)]" onClick={() => setCreating(true)}><UserPlus className="mr-2 h-4 w-4" /> New User</Button>
        ) : undefined
      } />

      {/* Role hierarchy cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {ROLES.map(role => {
          const cfg = ROLE_CONFIG[role]
          const Icon = cfg.icon
          return (
            <Card key={role} className={`cursor-pointer transition-all ${roleFilter === role ? 'ring-2 ring-[var(--navy)]' : 'hover:shadow-md'}`} onClick={() => setRoleFilter(roleFilter === role ? '' : role)}>
              <CardContent className="pt-4 pb-3 text-center">
                <Icon className="h-5 w-5 mx-auto mb-1.5" />
                <p className="font-semibold text-sm">{cfg.label}</p>
                <Badge className={`${cfg.color} mt-1`}>{roleCounts[role] || 0}</Badge>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : filtered.length === 0 ? (
            <EmptyState icon={Users} title="No users found" desc={roleFilter ? `No users with ${ROLE_CONFIG[roleFilter]?.label || roleFilter} role` : 'No users in the system'} />
          ) : (
            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Username</TableHead>
                    <TableHead>Full Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Status</TableHead>
                    {isOwner && <TableHead className="text-right">Change Role</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.username}</TableCell>
                      <TableCell>{user.employee?.fullName || '—'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                      <TableCell><Badge className={ROLE_CONFIG[user.role]?.color || 'bg-gray-500/10 text-gray-700'}>{ROLE_CONFIG[user.role]?.label || user.role}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{fmtDateTime(user.lastLoginAt)}</TableCell>
                      <TableCell>{user.locked ? <Badge className="bg-red-500/10 text-red-700 border-red-500/30">Locked</Badge> : <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-500/30">Active</Badge>}</TableCell>
                      {isOwner && (
                        <TableCell className="text-right">
                          <Select value={user.role} onValueChange={(v) => changeRole(user.id, v)}>
                            <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {ROLES.map(r => <SelectItem key={r} value={r}>{ROLE_CONFIG[r].label}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={creating} onOpenChange={(o) => !o && setCreating(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><UserPlus className="h-5 w-5" />New User</DialogTitle>
            <DialogDescription>Create a new user account with a role</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-1.5"><Label>Username *</Label><Input value={form.username} onChange={(e) => setForm(f => ({ ...f, username: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Email *</Label><Input type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} /></div>
            <div className="space-y-1.5"><Label>Password *</Label><Input type="password" value={form.password} onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))} /></div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={form.role} onValueChange={(v) => setForm(f => ({ ...f, role: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ROLES.map(r => <SelectItem key={r} value={r}>{ROLE_CONFIG[r].label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreating(false)}>Cancel</Button>
            <Button className="bg-[var(--navy)] text-white hover:bg-[var(--navy-light)]" onClick={createUser} disabled={saving}>{saving ? 'Creating...' : 'Create User'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}