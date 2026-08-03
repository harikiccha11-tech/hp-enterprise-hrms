'use client'
import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { SectionTitle, EmptyState } from '@/components/shared'
import { toast } from 'sonner'
import { MapPin, Plus, Pencil, Trash2, Search, Phone, Mail, Building } from 'lucide-react'
import { api } from '../lib'

interface Branch {
  id: string
  name: string
  code: string
  address: string | null
  city: string | null
  state: string | null
  pincode: string | null
  phone: string | null
  email: string | null
  isHead: boolean
  status: string
  createdAt: string
}

const EMPTY = { name: '', code: '', address: '', city: '', state: '', pincode: '', phone: '', email: '', isHead: false, status: 'ACTIVE' }

export function Branches({ refreshKey }: { refreshKey: number }) {
  const [list, setList] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Branch | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<Branch | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api<{ branches: Branch[] }>('/api/admin/branches')
      setList(data.branches || [])
    } catch (e: any) {
      toast.error(e.message || 'Failed to load branches')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load, refreshKey])

  const filtered = list.filter((b) => {
    if (search && !b.name.toLowerCase().includes(search.toLowerCase()) && !b.code.toLowerCase().includes(search.toLowerCase()) && !(b.city || '').toLowerCase().includes(search.toLowerCase())) return false
    if (statusFilter && b.status !== statusFilter) return false
    return true
  })

  return (
    <div className="space-y-5">
      <SectionTitle
        title="Branches"
        desc="Manage office branches and locations"
        action={
          <Button className="bg-[var(--navy)] text-white hover:bg-[var(--navy-light)]" onClick={() => setCreating(true)}>
            <Plus className="mr-2 h-4 w-4" /> New Branch
          </Button>
        }
      />

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : list.length === 0 ? (
            <EmptyState icon={MapPin} title="No branches yet" desc="Create your first branch to manage office locations" />
          ) : (
            <>
              <div className="mb-4 flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Search branches..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Status</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Code</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Head Office</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {b.name}
                            {b.isHead && <Badge className="bg-[var(--gold)]/15 text-[#8a6f24] border-[var(--gold)]/40">HQ</Badge>}
                          </div>
                        </TableCell>
                        <TableCell><Badge variant="outline">{b.code}</Badge></TableCell>
                        <TableCell>
                          <div>
                            <span className="text-sm">{b.city || '—'}{b.state ? `, ${b.state}` : ''}</span>
                            {b.pincode && <p className="text-xs text-muted-foreground">{b.pincode}</p>}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{b.phone || '—'}</TableCell>
                        <TableCell>{b.isHead ? <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-500/30">Yes</Badge> : <span className="text-muted-foreground">No</span>}</TableCell>
                        <TableCell>
                          <Badge className={b.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30' : 'bg-gray-500/10 text-gray-700 border-gray-500/30'}>
                            {b.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setEditing(b)} aria-label="Edit">
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-600 hover:text-red-700" onClick={() => setDeleting(b)} aria-label="Delete">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filtered.length === 0 && (
                      <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No branches match your search</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {(creating || editing) && (
        <BranchFormDialog
          branch={editing}
          onClose={() => { setCreating(false); setEditing(null) }}
          onSuccess={() => { setCreating(false); setEditing(null); load() }}
        />
      )}

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-700">Delete branch?</AlertDialogTitle>
            <AlertDialogDescription>
              Permanently delete <strong>{deleting?.name}</strong> ({deleting?.code})? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700"
              onClick={async () => {
                if (!deleting) return
                try {
                  await api('/api/admin/branches', { method: 'DELETE', body: JSON.stringify({ id: deleting.id }) })
                  toast.success('Branch deleted')
                  setDeleting(null); load()
                } catch (e: any) { toast.error(e.message || 'Delete failed') }
              }}
            >
              <Trash2 className="mr-1 h-4 w-4" /> Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function BranchFormDialog({ branch, onClose, onSuccess }: { branch: Branch | null; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState(branch ? {
    name: branch.name, code: branch.code, address: branch.address || '', city: branch.city || '',
    state: branch.state || '', pincode: branch.pincode || '', phone: branch.phone || '',
    email: branch.email || '', isHead: branch.isHead, status: branch.status,
  } : EMPTY)
  const [saving, setSaving] = useState(false)

  const setStr = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))
  const setBool = (k: string, v: boolean) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async () => {
    if (!form.name.trim()) { toast.error('Branch name is required'); return }
    if (!form.code.trim()) { toast.error('Branch code is required'); return }
    setSaving(true)
    try {
      if (branch) {
        await api('/api/admin/branches', { method: 'PATCH', body: JSON.stringify({ id: branch.id, ...form }) })
        toast.success('Branch updated')
      } else {
        await api('/api/admin/branches', { method: 'POST', body: JSON.stringify(form) })
        toast.success('Branch created')
      }
      onSuccess()
    } catch (e: any) { toast.error(e.message || 'Save failed') } finally { setSaving(false) }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" /> {branch ? 'Edit Branch' : 'New Branch'}
          </DialogTitle>
          <DialogDescription>{branch ? 'Update branch details' : 'Create a new office branch'}</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5"><Label>Name *</Label><Input value={form.name} onChange={(e) => setStr('name', e.target.value)} placeholder="e.g. Bangalore Office" /></div>
          <div className="space-y-1.5"><Label>Code *</Label><Input value={form.code} onChange={(e) => setStr('code', e.target.value.toUpperCase())} placeholder="e.g. BLR" /></div>
          <div className="space-y-1.5 sm:col-span-2"><Label>Address</Label><Textarea value={form.address} onChange={(e) => setStr('address', e.target.value)} rows={2} /></div>
          <div className="space-y-1.5"><Label>City</Label><Input value={form.city} onChange={(e) => setStr('city', e.target.value)} placeholder="e.g. Bangalore" /></div>
          <div className="space-y-1.5"><Label>State</Label><Input value={form.state} onChange={(e) => setStr('state', e.target.value)} placeholder="e.g. Karnataka" /></div>
          <div className="space-y-1.5"><Label>Pincode</Label><Input value={form.pincode} onChange={(e) => setStr('pincode', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Phone</Label><Input value={form.phone} onChange={(e) => setStr('phone', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setStr('email', e.target.value)} /></div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => setStr('status', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end pb-0.5">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isHead} onChange={(e) => setBool('isHead', e.target.checked)} className="rounded border-gray-300" />
              <span className="text-sm font-medium">Head Office</span>
            </label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button className="bg-[var(--navy)] text-white hover:bg-[var(--navy-light)]" onClick={submit} disabled={saving}>
            {saving ? 'Saving...' : branch ? 'Update' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}