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
import { Star, Plus, Pencil, Trash2, Search, ClipboardCheck, TrendingUp, Award, Send, Eye, CheckCircle2 } from 'lucide-react'
import { api, fmtDate, initials } from '../lib'

interface Review {
  id: string
  employeeId: string
  reviewPeriod: string
  year: string
  rating: number
  strengths: string
  improvements: string
  goals: string
  feedback: string
  reviewerId: string
  reviewerName: string
  status: string
  reviewedAt: string | null
  createdAt: string
  updatedAt: string
  employee: { id: string; fullName: string; employeeCode: string | null }
}

interface Employee {
  id: string
  fullName: string
  employeeCode: string | null
}

const PERIODS = ['Q1', 'Q2', 'Q3', 'Q4', 'H1', 'H2', 'Annual']
const STATUSES = ['DRAFT', 'SUBMITTED', 'REVIEWED', 'COMPLETED']
const EMPTY = {
  employeeId: '', reviewPeriod: 'Q1', year: new Date().getFullYear().toString(),
  rating: 3, strengths: '', improvements: '', goals: '', feedback: '',
  reviewerName: '', status: 'DRAFT',
}

function statusColor(s: string) {
  const m: Record<string, string> = {
    DRAFT: 'bg-gray-500/10 text-gray-700 border-gray-500/30',
    SUBMITTED: 'bg-sky-500/10 text-sky-700 border-sky-500/30',
    REVIEWED: 'bg-amber-500/10 text-amber-700 border-amber-500/30',
    COMPLETED: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30',
  }
  return m[s] || 'bg-gray-500/10 text-gray-700 border-gray-500/30'
}

function Stars({ rating, onChange }: { rating: number; onChange?: (r: number) => void }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <button key={s} type="button" disabled={!onChange} className={onChange ? 'cursor-pointer' : 'cursor-default'} onClick={() => onChange?.(s)}>
          <Star className={`h-4 w-4 ${s <= rating ? 'fill-[var(--gold)] text-[var(--gold)]' : 'text-gray-300'}`} />
        </button>
      ))}
    </div>
  )
}

export function Performance({ refreshKey, isSuperAdmin }: { refreshKey: number; isSuperAdmin: boolean }) {
  const [list, setList] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Review | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<Review | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [periodFilter, setPeriodFilter] = useState('')
  const [yearFilter, setYearFilter] = useState('')

  // Stats
  const [stats, setStats] = useState({ total: 0, avgRating: 0, completedThisQuarter: 0 })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)
      if (periodFilter) params.set('period', periodFilter)
      if (yearFilter) params.set('year', yearFilter)
      if (search) params.set('search', search)
      const qs = params.toString()
      const data = await api<{ reviews: Review[] }>(`/api/admin/performance${qs ? `?${qs}` : ''}`)
      const reviews = data.reviews || []
      setList(reviews)
      // Compute stats from unfiltered data if no filters
      if (!statusFilter && !periodFilter && !yearFilter && !search) {
        const total = reviews.length
        const avgRating = total > 0 ? (reviews.reduce((a, r) => a + (r.rating || 0), 0) / total).toFixed(1) : '0'
        const now = new Date()
        const q = Math.ceil((now.getMonth() + 1) / 3)
        const completedThisQuarter = reviews.filter((r) => r.status === 'COMPLETED' && r.reviewPeriod === `Q${q}` && r.year === String(now.getFullYear())).length
        setStats({ total, avgRating: Number(avgRating), completedThisQuarter })
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to load reviews')
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, periodFilter, yearFilter])

  useEffect(() => { load() }, [load, refreshKey])

  const handleStatusAction = async (review: Review, newStatus: string) => {
    try {
      await api('/api/admin/performance', {
        method: 'PATCH',
        body: JSON.stringify({ id: review.id, status: newStatus }),
      })
      toast.success(`Review ${newStatus.toLowerCase()}`)
      load()
    } catch (e: any) {
      toast.error(e.message || 'Action failed')
    }
  }

  return (
    <div className="space-y-5">
      <SectionTitle
        title="Performance Reviews"
        desc="Manage employee performance evaluations and ratings"
        action={
          <Button className="bg-[var(--navy)] text-white hover:bg-[var(--navy-light)]" onClick={() => setCreating(true)}>
            <Plus className="mr-2 h-4 w-4" /> New Review
          </Button>
        }
      />

      {/* Summary stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="border-0 shadow-sm"><CardContent className="pt-5 pb-4 flex items-center gap-4">
          <div className="grid h-11 w-11 place-items-center rounded-lg bg-[var(--navy)]/10 text-[var(--navy)]"><ClipboardCheck className="h-5 w-5" /></div>
          <div><p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Reviews</p><p className="text-2xl font-bold text-[var(--navy)] dark:text-white">{stats.total}</p></div>
        </CardContent></Card>
        <Card className="border-0 shadow-sm"><CardContent className="pt-5 pb-4 flex items-center gap-4">
          <div className="grid h-11 w-11 place-items-center rounded-lg bg-[var(--gold)]/15 text-[#8a6f24]"><TrendingUp className="h-5 w-5" /></div>
          <div><p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Avg Rating</p><p className="text-2xl font-bold text-[var(--navy)] dark:text-white">{stats.avgRating} <span className="text-sm font-normal text-muted-foreground">/ 5</span></p></div>
        </CardContent></Card>
        <Card className="border-0 shadow-sm"><CardContent className="pt-5 pb-4 flex items-center gap-4">
          <div className="grid h-11 w-11 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600"><Award className="h-5 w-5" /></div>
          <div><p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Completed This Quarter</p><p className="text-2xl font-bold text-[var(--navy)] dark:text-white">{stats.completedThisQuarter}</p></div>
        </CardContent></Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : list.length === 0 && !search && !statusFilter && !periodFilter && !yearFilter ? (
            <EmptyState icon={ClipboardCheck} title="No reviews yet" desc="Create your first performance review" />
          ) : (
            <>
              <div className="mb-4 flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Search by employee name..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]"><SelectValue placeholder="All Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Status</SelectItem>
                    {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={periodFilter} onValueChange={setPeriodFilter}>
                  <SelectTrigger className="w-[120px]"><SelectValue placeholder="Period" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Periods</SelectItem>
                    {PERIODS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={yearFilter} onValueChange={setYearFilter}>
                  <SelectTrigger className="w-[120px]"><SelectValue placeholder="Year" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Years</SelectItem>
                    {[2023, 2024, 2025, 2026].map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="max-h-[60vh] overflow-y-auto scroll-thin rounded-lg border">
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-card">
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead className="hidden md:table-cell">Year</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden lg:table-cell">Reviewer</TableHead>
                      <TableHead className="hidden lg:table-cell">Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {list.map((r) => (
                      <TableRow key={r.id} className="hover:bg-muted/40">
                        <TableCell>
                          <p className="text-sm font-semibold text-[var(--navy)] dark:text-white">{r.employee.fullName}</p>
                          <p className="text-[11px] text-muted-foreground">{r.employee.employeeCode || '—'}</p>
                        </TableCell>
                        <TableCell><Badge variant="outline" className="border-[var(--gold)]/40 text-[#8a6f24]">{r.reviewPeriod}</Badge></TableCell>
                        <TableCell className="hidden md:table-cell text-sm">{r.year}</TableCell>
                        <TableCell><Stars rating={r.rating || 0} /></TableCell>
                        <TableCell>
                          <div>
                            <Badge className={statusColor(r.status)}>{r.status}</Badge>
                            <div className="mt-1 flex gap-1">
                              {r.status === 'DRAFT' && isSuperAdmin && (
                                <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px] text-sky-600 hover:text-sky-700" onClick={() => handleStatusAction(r, 'SUBMITTED')}><Send className="mr-1 h-2.5 w-2.5" />Submit</Button>
                              )}
                              {r.status === 'SUBMITTED' && isSuperAdmin && (
                                <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px] text-amber-600 hover:text-amber-700" onClick={() => handleStatusAction(r, 'REVIEWED')}><Eye className="mr-1 h-2.5 w-2.5" />Review</Button>
                              )}
                              {r.status === 'REVIEWED' && isSuperAdmin && (
                                <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px] text-emerald-600 hover:text-emerald-700" onClick={() => handleStatusAction(r, 'COMPLETED')}><CheckCircle2 className="mr-1 h-2.5 w-2.5" />Complete</Button>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm">{r.reviewerName || '—'}</TableCell>
                        <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">{fmtDate(r.reviewedAt || r.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setEditing(r)} aria-label="Edit"><Pencil className="h-3.5 w-3.5" /></Button>
                            {isSuperAdmin && (
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-600 hover:text-red-700" onClick={() => setDeleting(r)} aria-label="Delete"><Trash2 className="h-3.5 w-3.5" /></Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {list.length === 0 && (
                      <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No reviews match your filters</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
          {!loading && list.length > 0 && <p className="mt-3 text-xs text-muted-foreground">{list.length} review{list.length > 1 ? 's' : ''}</p>}
        </CardContent>
      </Card>

      {(creating || editing) && (
        <ReviewFormDialog
          review={editing}
          onClose={() => { setCreating(false); setEditing(null) }}
          onSuccess={() => { setCreating(false); setEditing(null); load() }}
        />
      )}

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-700">Delete review?</AlertDialogTitle>
            <AlertDialogDescription>Permanently delete the review for <strong>{deleting?.employee.fullName}</strong> ({deleting?.reviewPeriod} {deleting?.year})?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={async () => {
              if (!deleting) return
              try { await api('/api/admin/performance', { method: 'DELETE', body: JSON.stringify({ id: deleting.id }) }); toast.success('Review deleted'); setDeleting(null); load() }
              catch (e: any) { toast.error(e.message || 'Delete failed') }
            }}><Trash2 className="mr-1 h-4 w-4" /> Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function ReviewFormDialog({ review, onClose, onSuccess }: { review: Review | null; onClose: () => void; onSuccess: () => void }) {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [form, setForm] = useState(review ? {
    employeeId: review.employeeId,
    reviewPeriod: review.reviewPeriod,
    year: review.year,
    rating: review.rating || 3,
    strengths: review.strengths || '',
    improvements: review.improvements || '',
    goals: review.goals || '',
    feedback: review.feedback || '',
    reviewerName: review.reviewerName || '',
    status: review.status,
  } : { ...EMPTY })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api<{ employees: Employee[] }>('/api/admin/employees?status=APPROVED&limit=200').then((d) => setEmployees(d.employees || [])).catch(() => {})
  }, [])

  const set = (k: string, v: string | number) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async () => {
    if (!form.employeeId) { toast.error('Please select an employee'); return }
    setSaving(true)
    try {
      if (review) {
        await api('/api/admin/performance', { method: 'PATCH', body: JSON.stringify({ id: review.id, ...form }) })
        toast.success('Review updated')
      } else {
        await api('/api/admin/performance', { method: 'POST', body: JSON.stringify(form) })
        toast.success('Review created')
      }
      onSuccess()
    } catch (e: any) { toast.error(e.message || 'Save failed') } finally { setSaving(false) }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" /> {review ? 'Edit Review' : 'New Review'}
          </DialogTitle>
          <DialogDescription>{review ? 'Update performance review details' : 'Create a new performance review'}</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Employee *</Label>
            <Select value={form.employeeId} onValueChange={(v) => set('employeeId', v)} disabled={!!review}>
              <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
              <SelectContent className="max-h-60">
                {employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.fullName}{e.employeeCode ? ` (${e.employeeCode})` : ''}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Review Period *</Label>
            <Select value={form.reviewPeriod} onValueChange={(v) => set('reviewPeriod', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{PERIODS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Year *</Label>
            <Select value={form.year} onValueChange={(v) => set('year', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{[2023, 2024, 2025, 2026].map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Rating ({form.rating}/5)</Label>
            <div className="flex items-center gap-3">
              <input type="range" min="1" max="5" step="1" value={form.rating} onChange={(e) => set('rating', Number(e.target.value))} className="flex-1 accent-[var(--gold)]" />
              <Stars rating={form.rating} onChange={(r) => set('rating', r)} />
            </div>
          </div>
          <div className="space-y-1.5 sm:col-span-2"><Label>Strengths</Label><Textarea value={form.strengths} onChange={(e) => set('strengths', e.target.value)} rows={2} placeholder="Key strengths and achievements..." /></div>
          <div className="space-y-1.5 sm:col-span-2"><Label>Areas for Improvement</Label><Textarea value={form.improvements} onChange={(e) => set('improvements', e.target.value)} rows={2} placeholder="Areas that need improvement..." /></div>
          <div className="space-y-1.5 sm:col-span-2"><Label>Goals</Label><Textarea value={form.goals} onChange={(e) => set('goals', e.target.value)} rows={2} placeholder="Goals for next period..." /></div>
          <div className="space-y-1.5 sm:col-span-2"><Label>Feedback</Label><Textarea value={form.feedback} onChange={(e) => set('feedback', e.target.value)} rows={2} placeholder="Overall feedback..." /></div>
          <div className="space-y-1.5"><Label>Reviewer Name</Label><Input value={form.reviewerName} onChange={(e) => set('reviewerName', e.target.value)} placeholder="Reviewer name" /></div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => set('status', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button className="bg-[var(--navy)] text-white hover:bg-[var(--navy-light)]" onClick={submit} disabled={saving}>
            {saving ? 'Saving...' : review ? 'Update' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}