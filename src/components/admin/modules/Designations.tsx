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
import { BadgeCheck, Plus, Pencil, Trash2, Search } from 'lucide-react'
import { api } from '../lib'
import { formatINR } from '../lib'

interface Designation {
  id: string
  title: string
  level: string | null
  department: string | null
  minSalary: number | null
  maxSalary: number | null
  description: string | null
  status: string
  createdAt: string
}

const LEVELS = ['Junior', 'Mid', 'Senior', 'Lead', 'Manager', 'Director']
const EMPTY = { title: '', level: '', department: '', minSalary: '', maxSalary: '', description: '', status: 'ACTIVE' }

export function Designations({ refreshKey }: { refreshKey: number }) {
  const [list, setList] = useState<Designation[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Designation | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<Designation | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api<{ designations: Designation[] }>('/api/admin/designations')
      setList(data.designations || [])
    } catch (e: any) {
      toast.error(e.message || 'Failed to load designations')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load, refreshKey])

  const filtered = list.filter((d) => {
    if (search && !d.title.toLowerCase().includes(search.toLowerCase()) && !(d.department || '').toLowerCase().includes(search.toLowerCase())) return false
    if (statusFilter && d.status !== statusFilter) return false
    return true
  })

  return (
    <div className="space-y-5">
      <SectionTitle
        title="Designations"
        desc="Manage job designations and salary ranges"
        action={
          <Button className="bg-[var(--navy)] text-white hover:bg-[var(--navy-light)]" onClick={() => setCreating(true)}>
            <Plus className="mr-2 h-4 w-4" /> New Designation
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
            <EmptyState icon={BadgeCheck} title="No designations yet" desc="Create your first designation to define job roles" />
          ) : (
            <>
              <div className="mb-4 flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Search designations..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
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
                      <TableHead>Title</TableHead>
                      <TableHead>Level</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Salary Range</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell className="font-medium">{d.title}</TableCell>
                        <TableCell>{d.level ? <Badge variant="outline">{d.level}</Badge> : '—'}</TableCell>
                        <TableCell>{d.department || '—'}</TableCell>
                        <TableCell className="text-sm">
                          {(d.minSalary || d.maxSalary) ? `${formatINR(d.minSalary)} — ${formatINR(d.maxSalary)}` : '—'}
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
                      <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No designations match your search</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {(creating || editing) && (
        <DesigFormDialog
          desig={editing}
          onClose={() => { setCreating(false); setEditing(null) }}
          onSuccess={() => { setCreating(false); setEditing(null); load() }}
        />
      )}

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-700">Delete designation?</AlertDialogTitle>
            <AlertDialogDescription>
              Permanently delete <strong>{deleting?.title}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700"
              onClick={async () => {
                if (!deleting) return
                try {
                  await api('/api/admin/designations', { method: 'DELETE', body: JSON.stringify({ id: deleting.id }) })
                  toast.success('Designation deleted')
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

function DesigFormDialog({ desig, onClose, onSuccess }: { desig: Designation | null; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState(desig ? {
    title: desig.title,
    level: desig.level || '',
    department: desig.department || '',
    minSalary: desig.minSalary ? String(desig.minSalary) : '',
    maxSalary: desig.maxSalary ? String(desig.maxSalary) : '',
    description: desig.description || '',
    status: desig.status,
  } : EMPTY)
  const [saving, setSaving] = useState(false)

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async () => {
    if (!form.title.trim()) { toast.error('Designation title is required'); return }
    setSaving(true)
    try {
      if (desig) {
        await api('/api/admin/designations', { method: 'PATCH', body: JSON.stringify({ id: desig.id, ...form }) })
        toast.success('Designation updated')
      } else {
        await api('/api/admin/designations', { method: 'POST', body: JSON.stringify(form) })
        toast.success('Designation created')
      }
      onSuccess()
    } catch (e: any) { toast.error(e.message || 'Save failed') } finally { setSaving(false) }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BadgeCheck className="h-5 w-5" /> {desig ? 'Edit Designation' : 'New Designation'}
          </DialogTitle>
          <DialogDescription>{desig ? 'Update designation details' : 'Create a new job designation'}</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2"><Label>Title *</Label><Input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Senior Software Engineer" /></div>
          <div className="space-y-1.5">
            <Label>Level</Label>
            <Select value={form.level} onValueChange={(v) => set('level', v)}>
              <SelectTrigger><SelectValue placeholder="Select level" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {LEVELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Department</Label><Input value={form.department} onChange={(e) => set('department', e.target.value)} placeholder="e.g. Engineering" /></div>
          <div className="space-y-1.5"><Label>Min Salary (₹)</Label><Input type="number" value={form.minSalary} onChange={(e) => set('minSalary', e.target.value)} placeholder="0" /></div>
          <div className="space-y-1.5"><Label>Max Salary (₹)</Label><Input type="number" value={form.maxSalary} onChange={(e) => set('maxSalary', e.target.value)} placeholder="0" /></div>
          <div className="space-y-1.5 sm:col-span-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={2} /></div>
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
            {saving ? 'Saving...' : desig ? 'Update' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}