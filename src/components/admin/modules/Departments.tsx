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
import { FolderTree, Plus, Pencil, Trash2, Search, Mail } from 'lucide-react'
import { api } from '../lib'

interface Department {
  id: string
  name: string
  code: string
  description: string | null
  headName: string | null
  headEmail: string | null
  status: string
  createdAt: string
}

const EMPTY = { name: '', code: '', description: '', headName: '', headEmail: '', status: 'ACTIVE' }

export function Departments({ refreshKey }: { refreshKey: number }) {
  const [list, setList] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Department | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<Department | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api<{ departments: Department[] }>('/api/admin/departments')
      setList(data.departments || [])
    } catch (e: any) {
      toast.error(e.message || 'Failed to load departments')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load, refreshKey])

  const filtered = list.filter((d) => {
    if (search && !d.name.toLowerCase().includes(search.toLowerCase()) && !d.code.toLowerCase().includes(search.toLowerCase())) return false
    if (statusFilter && d.status !== statusFilter) return false
    return true
  })

  return (
    <div className="space-y-5">
      <SectionTitle
        title="Departments"
        desc="Manage organizational departments"
        action={
          <Button className="bg-[var(--navy)] text-white hover:bg-[var(--navy-light)]" onClick={() => setCreating(true)}>
            <Plus className="mr-2 h-4 w-4" /> New Department
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
            <EmptyState icon={FolderTree} title="No departments yet" desc="Create your first department to organize your organization" />
          ) : (
            <>
              <div className="mb-4 flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Search departments..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
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
                      <TableHead>Head</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell className="font-medium">{d.name}</TableCell>
                        <TableCell><Badge variant="outline">{d.code}</Badge></TableCell>
                        <TableCell>
                          <div>
                            <span className="text-sm">{d.headName || '—'}</span>
                            {d.headEmail && <p className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" /> {d.headEmail}</p>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={d.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30' : 'bg-gray-500/10 text-gray-700 border-gray-500/30'}>
                            {d.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setEditing(d)} aria-label="Edit">
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-600 hover:text-red-700" onClick={() => setDeleting(d)} aria-label="Delete">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filtered.length === 0 && (
                      <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No departments match your search</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {(creating || editing) && (
        <DeptFormDialog
          dept={editing}
          onClose={() => { setCreating(false); setEditing(null) }}
          onSuccess={() => { setCreating(false); setEditing(null); load() }}
        />
      )}

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-700">Delete department?</AlertDialogTitle>
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
                  await api('/api/admin/departments', { method: 'DELETE', body: JSON.stringify({ id: deleting.id }) })
                  toast.success('Department deleted')
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

function DeptFormDialog({ dept, onClose, onSuccess }: { dept: Department | null; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState(dept ? {
    name: dept.name, code: dept.code, description: dept.description || '',
    headName: dept.headName || '', headEmail: dept.headEmail || '', status: dept.status,
  } : EMPTY)
  const [saving, setSaving] = useState(false)

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async () => {
    if (!form.name.trim()) { toast.error('Department name is required'); return }
    if (!form.code.trim()) { toast.error('Department code is required'); return }
    setSaving(true)
    try {
      if (dept) {
        await api('/api/admin/departments', { method: 'PATCH', body: JSON.stringify({ id: dept.id, ...form }) })
        toast.success('Department updated')
      } else {
        await api('/api/admin/departments', { method: 'POST', body: JSON.stringify(form) })
        toast.success('Department created')
      }
      onSuccess()
    } catch (e: any) { toast.error(e.message || 'Save failed') } finally { setSaving(false) }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderTree className="h-5 w-5" /> {dept ? 'Edit Department' : 'New Department'}
          </DialogTitle>
          <DialogDescription>{dept ? 'Update department details' : 'Create a new department'}</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5"><Label>Name *</Label><Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Engineering" /></div>
          <div className="space-y-1.5"><Label>Code *</Label><Input value={form.code} onChange={(e) => set('code', e.target.value.toUpperCase())} placeholder="e.g. ENG" /></div>
          <div className="space-y-1.5 sm:col-span-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={2} /></div>
          <div className="space-y-1.5"><Label>Head Name</Label><Input value={form.headName} onChange={(e) => set('headName', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Head Email</Label><Input type="email" value={form.headEmail} onChange={(e) => set('headEmail', e.target.value)} /></div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => set('status', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button className="bg-[var(--navy)] text-white hover:bg-[var(--navy-light)]" onClick={submit} disabled={saving}>
            {saving ? 'Saving...' : dept ? 'Update' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}