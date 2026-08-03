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
import { Target, Plus, Pencil, Trash2, Search, Save } from 'lucide-react'
import { api, fmtDate } from '../lib'

interface GoalRow {
  id: string
  employeeId: string
  title: string
  description: string
  category: string
  priority: string
  progress: number
  targetDate: string | null
  status: string
  weight: number | null
  createdAt: string
  updatedAt: string
  employee: { id: string; fullName: string; employeeCode: string | null }
}

interface Employee {
  id: string
  fullName: string
  employeeCode: string | null
}

const CATEGORIES = ['Technical', 'SoftSkills', 'Leadership', 'Management', 'Project', 'Personal']
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']
const STATUSES = ['NOT_STARTED', 'IN_PROGRESS', 'ON_TRACK', 'AT_RISK', 'COMPLETED', 'CANCELLED']
const EMPTY = {
  employeeId: '', title: '', description: '', category: 'Technical', priority: 'MEDIUM',
  progress: 0, targetDate: '', status: 'NOT_STARTED', weight: '',
}

function categoryColor(c: string) {
  const m: Record<string, string> = {
    Technical: 'bg-sky-500/10 text-sky-700 border-sky-500/30',
    SoftSkills: 'bg-violet-500/10 text-violet-700 border-violet-500/30',
    Leadership: 'bg-[var(--gold)]/15 text-[#8a6f24] border-[var(--gold)]/30',
    Management: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30',
    Project: 'bg-orange-500/10 text-orange-700 border-orange-500/30',
    Personal: 'bg-pink-500/10 text-pink-700 border-pink-500/30',
  }
  return m[c] || 'bg-gray-500/10 text-gray-700 border-gray-500/30'
}

function priorityColor(p: string) {
  const m: Record<string, string> = {
    LOW: 'bg-gray-500/10 text-gray-600 border-gray-500/30',
    MEDIUM: 'bg-sky-500/10 text-sky-700 border-sky-500/30',
    HIGH: 'bg-amber-500/10 text-amber-700 border-amber-500/30',
    CRITICAL: 'bg-red-500/10 text-red-700 border-red-500/30',
  }
  return m[p] || 'bg-gray-500/10 text-gray-700 border-gray-500/30'
}

function statusColor(s: string) {
  const m: Record<string, string> = {
    NOT_STARTED: 'bg-gray-500/10 text-gray-700 border-gray-500/30',
    IN_PROGRESS: 'bg-sky-500/10 text-sky-700 border-sky-500/30',
    ON_TRACK: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30',
    AT_RISK: 'bg-red-500/10 text-red-700 border-red-500/30',
    COMPLETED: 'bg-teal-500/10 text-teal-700 border-teal-500/30',
    CANCELLED: 'bg-gray-500/10 text-gray-500 border-gray-500/30',
  }
  return m[s] || 'bg-gray-500/10 text-gray-700 border-gray-500/30'
}

function ProgressBar({ value }: { value: number }) {
  const color = value >= 80 ? 'bg-emerald-500' : value >= 50 ? 'bg-sky-500' : value >= 25 ? 'bg-amber-500' : 'bg-red-500'
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 flex-1 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
      </div>
      <span className="text-xs font-medium text-muted-foreground w-8 text-right">{value}%</span>
    </div>
  )
}

export function Goals({ refreshKey }: { refreshKey: number }) {
  const [list, setList] = useState<GoalRow[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<GoalRow | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<GoalRow | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [quickProgress, setQuickProgress] = useState<string | null>(null)
  const [quickValue, setQuickValue] = useState(0)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)
      if (categoryFilter) params.set('category', categoryFilter)
      if (search) params.set('search', search)
      const qs = params.toString()
      const data = await api<{ goals: GoalRow[] }>(`/api/admin/goals${qs ? `?${qs}` : ''}`)
      setList(data.goals || [])
    } catch (e: any) {
      toast.error(e.message || 'Failed to load goals')
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, categoryFilter])

  useEffect(() => { load() }, [load, refreshKey])

  const saveQuickProgress = async (id: string) => {
    try {
      await api('/api/admin/goals', { method: 'PATCH', body: JSON.stringify({ id, progress: quickValue }) })
      toast.success('Progress updated')
      setQuickProgress(null)
      load()
    } catch (e: any) { toast.error(e.message || 'Update failed') }
  }

  return (
    <div className="space-y-5">
      <SectionTitle
        title="Goals"
        desc="Track and manage employee goals and objectives"
        action={
          <Button className="bg-[var(--navy)] text-white hover:bg-[var(--navy-light)]" onClick={() => setCreating(true)}>
            <Plus className="mr-2 h-4 w-4" /> New Goal
          </Button>
        }
      />

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : list.length === 0 && !search && !statusFilter && !categoryFilter ? (
            <EmptyState icon={Target} title="No goals yet" desc="Create your first goal to start tracking" />
          ) : (
            <>
              <div className="mb-4 flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Search goals or employees..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Status</SelectItem>
                    {STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[160px]"><SelectValue placeholder="All Categories" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Categories</SelectItem>
                    {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="max-h-[65vh] overflow-y-auto scroll-thin rounded-lg border">
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-card">
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead className="hidden md:table-cell">Employee</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead className="min-w-[140px]">Progress</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden lg:table-cell">Target Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {list.map((g) => (
                      <TableRow key={g.id} className="hover:bg-muted/40">
                        <TableCell>
                          <p className="text-sm font-semibold text-[var(--navy)] dark:text-white">{g.title}</p>
                          {g.weight && <p className="text-[11px] text-muted-foreground">Weight: {g.weight}%</p>}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <p className="text-sm">{g.employee.fullName}</p>
                          <p className="text-[11px] text-muted-foreground">{g.employee.employeeCode || '—'}</p>
                        </TableCell>
                        <TableCell><Badge className={categoryColor(g.category)}>{g.category}</Badge></TableCell>
                        <TableCell><Badge className={priorityColor(g.priority)}>{g.priority}</Badge></TableCell>
                        <TableCell>
                          {quickProgress === g.id ? (
                            <div className="flex items-center gap-2">
                              <input type="range" min="0" max="100" value={quickValue} onChange={(e) => setQuickValue(Number(e.target.value))} className="flex-1 accent-[var(--gold)]" />
                              <span className="text-xs w-8 text-right">{quickValue}%</span>
                              <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-emerald-600" onClick={() => saveQuickProgress(g.id)}><Save className="h-3 w-3" /></Button>
                              <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setQuickProgress(null)}><Trash2 className="h-3 w-3" /></Button>
                            </div>
                          ) : (
                            <button className="w-full cursor-pointer" onClick={() => { setQuickProgress(g.id); setQuickValue(g.progress) }}>
                              <ProgressBar value={g.progress} />
                            </button>
                          )}
                        </TableCell>
                        <TableCell><Badge className={statusColor(g.status)}>{g.status.replace('_', ' ')}</Badge></TableCell>
                        <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">{fmtDate(g.targetDate)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setEditing(g)} aria-label="Edit"><Pencil className="h-3.5 w-3.5" /></Button>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-600 hover:text-red-700" onClick={() => setDeleting(g)} aria-label="Delete"><Trash2 className="h-3.5 w-3.5" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {list.length === 0 && (
                      <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No goals match your filters</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
          {!loading && list.length > 0 && <p className="mt-3 text-xs text-muted-foreground">{list.length} goal{list.length > 1 ? 's' : ''}</p>}
        </CardContent>
      </Card>

      {(creating || editing) && (
        <GoalFormDialog
          goal={editing}
          onClose={() => { setCreating(false); setEditing(null) }}
          onSuccess={() => { setCreating(false); setEditing(null); load() }}
        />
      )}

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-700">Delete goal?</AlertDialogTitle>
            <AlertDialogDescription>Permanently delete <strong>{deleting?.title}</strong>?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={async () => {
              if (!deleting) return
              try { await api('/api/admin/goals', { method: 'DELETE', body: JSON.stringify({ id: deleting.id }) }); toast.success('Goal deleted'); setDeleting(null); load() }
              catch (e: any) { toast.error(e.message || 'Delete failed') }
            }}><Trash2 className="mr-1 h-4 w-4" /> Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function GoalFormDialog({ goal, onClose, onSuccess }: { goal: GoalRow | null; onClose: () => void; onSuccess: () => void }) {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [form, setForm] = useState(goal ? {
    employeeId: goal.employeeId, title: goal.title, description: goal.description,
    category: goal.category, priority: goal.priority, progress: goal.progress,
    targetDate: goal.targetDate ? goal.targetDate.slice(0, 10) : '',
    status: goal.status, weight: goal.weight ? String(goal.weight) : '',
  } : { ...EMPTY })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api<{ employees: Employee[] }>('/api/admin/employees?status=APPROVED&limit=200').then((d) => setEmployees(d.employees || [])).catch(() => {})
  }, [])

  const set = (k: string, v: string | number) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async () => {
    if (!form.employeeId) { toast.error('Please select an employee'); return }
    if (!form.title.trim()) { toast.error('Goal title is required'); return }
    setSaving(true)
    try {
      const payload = { ...form, weight: form.weight ? Number(form.weight) : null, progress: Number(form.progress) }
      if (goal) {
        await api('/api/admin/goals', { method: 'PATCH', body: JSON.stringify({ id: goal.id, ...payload }) })
        toast.success('Goal updated')
      } else {
        await api('/api/admin/goals', { method: 'POST', body: JSON.stringify(payload) })
        toast.success('Goal created')
      }
      onSuccess()
    } catch (e: any) { toast.error(e.message || 'Save failed') } finally { setSaving(false) }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" /> {goal ? 'Edit Goal' : 'New Goal'}
          </DialogTitle>
          <DialogDescription>{goal ? 'Update goal details' : 'Set a new goal for an employee'}</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Employee *</Label>
            <Select value={form.employeeId} onValueChange={(v) => set('employeeId', v)}>
              <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
              <SelectContent className="max-h-60">
                {employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.fullName}{e.employeeCode ? ` (${e.employeeCode})` : ''}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2"><Label>Title *</Label><Input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Complete AWS certification" /></div>
          <div className="space-y-1.5 sm:col-span-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={2} placeholder="Goal description..." /></div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={form.category} onValueChange={(v) => set('category', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Priority</Label>
            <Select value={form.priority} onValueChange={(v) => set('priority', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Progress ({form.progress}%)</Label>
            <input type="range" min="0" max="100" step="5" value={form.progress} onChange={(e) => set('progress', Number(e.target.value))} className="w-full accent-[var(--gold)]" />
          </div>
          <div className="space-y-1.5"><Label>Target Date</Label><Input type="date" value={form.targetDate} onChange={(e) => set('targetDate', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Weight (%)</Label><Input type="number" min="0" max="100" value={form.weight} onChange={(e) => set('weight', e.target.value)} placeholder="e.g. 25" /></div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => set('status', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button className="bg-[var(--navy)] text-white hover:bg-[var(--navy-light)]" onClick={submit} disabled={saving}>
            {saving ? 'Saving...' : goal ? 'Update' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}