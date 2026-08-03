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
import { Receipt, Plus, Trash2, Search, Check, X, Banknote, Clock, Wallet } from 'lucide-react'
import { api, fmtDate, formatINR } from '../lib'

interface ExpenseRow {
  id: string
  employeeId: string
  category: string
  amount: number
  description: string
  date: string
  receiptPath: string | null
  status: string
  approvedBy: string | null
  approvedAt: string | null
  remarks: string | null
  createdAt: string
  updatedAt: string
  employee: { id: string; fullName: string; employeeCode: string | null }
}

interface Employee {
  id: string
  fullName: string
  employeeCode: string | null
}

const CATEGORIES = ['Travel', 'Food', 'Accommodation', 'Medical', 'Communication', 'Equipment', 'Other']
const STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'REIMBURSED']
const EMPTY = {
  employeeId: '', category: 'Travel', amount: '', description: '', date: new Date().toISOString().slice(0, 10),
}

function categoryColor(c: string) {
  const m: Record<string, string> = {
    Travel: 'bg-sky-500/10 text-sky-700 border-sky-500/30',
    Food: 'bg-orange-500/10 text-orange-700 border-orange-500/30',
    Accommodation: 'bg-violet-500/10 text-violet-700 border-violet-500/30',
    Medical: 'bg-red-500/10 text-red-700 border-red-500/30',
    Communication: 'bg-teal-500/10 text-teal-700 border-teal-500/30',
    Equipment: 'bg-amber-500/10 text-amber-700 border-amber-500/30',
    Other: 'bg-gray-500/10 text-gray-700 border-gray-500/30',
  }
  return m[c] || 'bg-gray-500/10 text-gray-700 border-gray-500/30'
}

function expenseStatusColor(s: string) {
  const m: Record<string, string> = {
    PENDING: 'bg-amber-500/10 text-amber-700 border-amber-500/30',
    APPROVED: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30',
    REJECTED: 'bg-red-500/10 text-red-700 border-red-500/30',
    REIMBURSED: 'bg-sky-500/10 text-sky-700 border-sky-500/30',
  }
  return m[s] || 'bg-gray-500/10 text-gray-700 border-gray-500/30'
}

export function Expenses({ refreshKey, isSuperAdmin }: { refreshKey: number; isSuperAdmin: boolean }) {
  const [list, setList] = useState<ExpenseRow[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<ExpenseRow | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [rejecting, setRejecting] = useState<ExpenseRow | null>(null)

  // Stats
  const [stats, setStats] = useState({ pending: 0, approved: 0, reimbursed: 0, total: 0 })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)
      if (categoryFilter) params.set('category', categoryFilter)
      if (search) params.set('search', search)
      const qs = params.toString()
      const data = await api<{ expenses: ExpenseRow[] }>(`/api/admin/expenses${qs ? `?${qs}` : ''}`)
      const expenses = data.expenses || []
      setList(expenses)
      // Compute stats from unfiltered data
      if (!statusFilter && !categoryFilter && !search) {
        const pending = expenses.filter((e) => e.status === 'PENDING').reduce((a, e) => a + e.amount, 0)
        const approved = expenses.filter((e) => e.status === 'APPROVED').reduce((a, e) => a + e.amount, 0)
        const reimbursed = expenses.filter((e) => e.status === 'REIMBURSED').reduce((a, e) => a + e.amount, 0)
        const total = expenses.reduce((a, e) => a + e.amount, 0)
        setStats({ pending, approved, reimbursed, total })
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to load expenses')
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, categoryFilter])

  useEffect(() => { load() }, [load, refreshKey])

  const handleAction = async (expense: ExpenseRow, status: string, remarks?: string) => {
    try {
      await api('/api/admin/expenses', {
        method: 'PATCH',
        body: JSON.stringify({ id: expense.id, status, remarks: remarks || undefined }),
      })
      toast.success(`Expense ${status.toLowerCase()}`)
      setRejecting(null)
      load()
    } catch (e: any) { toast.error(e.message || 'Action failed') }
  }

  return (
    <div className="space-y-5">
      <SectionTitle
        title="Expenses"
        desc="Review and manage employee expense claims"
        action={
          <Button className="bg-[var(--navy)] text-white hover:bg-[var(--navy-light)]" onClick={() => setCreating(true)}>
            <Plus className="mr-2 h-4 w-4" /> New Expense
          </Button>
        }
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="border-0 shadow-sm"><CardContent className="pt-5 pb-4 flex items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-amber-500/10 text-amber-600"><Clock className="h-4.5 w-4.5" /></div>
          <div className="min-w-0"><p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Pending</p><p className="text-lg font-bold text-[var(--navy)] dark:text-white truncate">{formatINR(stats.pending)}</p></div>
        </CardContent></Card>
        <Card className="border-0 shadow-sm"><CardContent className="pt-5 pb-4 flex items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600"><Check className="h-4.5 w-4.5" /></div>
          <div className="min-w-0"><p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Approved</p><p className="text-lg font-bold text-[var(--navy)] dark:text-white truncate">{formatINR(stats.approved)}</p></div>
        </CardContent></Card>
        <Card className="border-0 shadow-sm"><CardContent className="pt-5 pb-4 flex items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-sky-500/10 text-sky-600"><Banknote className="h-4.5 w-4.5" /></div>
          <div className="min-w-0"><p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Reimbursed</p><p className="text-lg font-bold text-[var(--navy)] dark:text-white truncate">{formatINR(stats.reimbursed)}</p></div>
        </CardContent></Card>
        <Card className="border-0 shadow-sm"><CardContent className="pt-5 pb-4 flex items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[var(--navy)]/10 text-[var(--navy)]"><Wallet className="h-4.5 w-4.5" /></div>
          <div className="min-w-0"><p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Total Amount</p><p className="text-lg font-bold text-[var(--navy)] dark:text-white truncate">{formatINR(stats.total)}</p></div>
        </CardContent></Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : list.length === 0 && !search && !statusFilter && !categoryFilter ? (
            <EmptyState icon={Receipt} title="No expenses yet" desc="Submit your first expense claim" />
          ) : (
            <>
              <div className="mb-4 flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Search expenses or employees..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]"><SelectValue placeholder="All Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Status</SelectItem>
                    {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
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
              <div className="max-h-[60vh] overflow-y-auto scroll-thin rounded-lg border">
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-card">
                    <TableRow>
                      <TableHead>Employee</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead className="hidden md:table-cell">Description</TableHead>
                      <TableHead className="hidden lg:table-cell">Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {list.map((e) => (
                      <TableRow key={e.id} className="hover:bg-muted/40">
                        <TableCell>
                          <p className="text-sm font-semibold text-[var(--navy)] dark:text-white">{e.employee.fullName}</p>
                          <p className="text-[11px] text-muted-foreground">{e.employee.employeeCode || '—'}</p>
                        </TableCell>
                        <TableCell><Badge className={categoryColor(e.category)}>{e.category}</Badge></TableCell>
                        <TableCell className="text-sm font-bold text-[var(--navy)] dark:text-white">{formatINR(e.amount)}</TableCell>
                        <TableCell className="hidden md:table-cell max-w-[200px]"><p className="truncate text-xs text-muted-foreground">{e.description || '—'}</p></TableCell>
                        <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">{fmtDate(e.date)}</TableCell>
                        <TableCell><Badge className={expenseStatusColor(e.status)}>{e.status}</Badge></TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {e.status === 'PENDING' && isSuperAdmin && (
                              <>
                                <Button size="sm" variant="ghost" className="h-8 gap-1 px-2 text-emerald-600 hover:text-emerald-700" onClick={() => handleAction(e, 'APPROVED')}>
                                  <Check className="h-3.5 w-3.5" /><span className="text-xs hidden sm:inline">Approve</span>
                                </Button>
                                <Button size="sm" variant="ghost" className="h-8 gap-1 px-2 text-red-600 hover:text-red-700" onClick={() => setRejecting(e)}>
                                  <X className="h-3.5 w-3.5" /><span className="text-xs hidden sm:inline">Reject</span>
                                </Button>
                              </>
                            )}
                            {e.status === 'APPROVED' && isSuperAdmin && (
                              <Button size="sm" variant="ghost" className="h-8 gap-1 px-2 text-sky-600 hover:text-sky-700" onClick={() => handleAction(e, 'REIMBURSED')}>
                                <Banknote className="h-3.5 w-3.5" /><span className="text-xs hidden sm:inline">Reimburse</span>
                              </Button>
                            )}
                            {(e.status === 'PENDING' || e.status === 'REJECTED') && isSuperAdmin && (
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-600 hover:text-red-700" onClick={() => setDeleting(e)} aria-label="Delete"><Trash2 className="h-3.5 w-3.5" /></Button>
                            )}
                            {!isSuperAdmin && <span className="text-xs text-muted-foreground">—</span>}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {list.length === 0 && (
                      <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No expenses match your filters</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
          {!loading && list.length > 0 && <p className="mt-3 text-xs text-muted-foreground">{list.length} expense{list.length > 1 ? 's' : ''}</p>}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      {creating && (
        <CreateExpenseDialog
          onClose={() => setCreating(false)}
          onSuccess={() => { setCreating(false); load() }}
        />
      )}

      {/* Reject Dialog */}
      {rejecting && (
        <Dialog open onOpenChange={(o) => !o && setRejecting(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><X className="h-5 w-5 text-red-600" /> Reject Expense</DialogTitle>
              <DialogDescription>
                Reject expense of <strong>{formatINR(rejecting.amount)}</strong> from <strong>{rejecting.employee.fullName}</strong>?
              </DialogDescription>
            </DialogHeader>
            <RejectForm expense={rejecting} onSuccess={() => setRejecting(null)} />
          </DialogContent>
        </Dialog>
      )}

      {/* Delete */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-700">Delete expense?</AlertDialogTitle>
            <AlertDialogDescription>Permanently delete expense of <strong>{formatINR(deleting?.amount)}</strong> from <strong>{deleting?.employee.fullName}</strong>?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={async () => {
              if (!deleting) return
              try { await api('/api/admin/expenses', { method: 'DELETE', body: JSON.stringify({ id: deleting.id }) }); toast.success('Expense deleted'); setDeleting(null); load() }
              catch (e: any) { toast.error(e.message || 'Delete failed') }
            }}><Trash2 className="mr-1 h-4 w-4" /> Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function CreateExpenseDialog({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [form, setForm] = useState({ ...EMPTY })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api<{ employees: Employee[] }>('/api/admin/employees?status=APPROVED&limit=200').then((d) => setEmployees(d.employees || [])).catch(() => {})
  }, [])

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async () => {
    if (!form.employeeId) { toast.error('Please select an employee'); return }
    if (!form.amount || Number(form.amount) <= 0) { toast.error('Enter a valid amount'); return }
    setSaving(true)
    try {
      await api('/api/admin/expenses', { method: 'POST', body: JSON.stringify({ ...form, amount: Number(form.amount) }) })
      toast.success('Expense created')
      onSuccess()
    } catch (e: any) { toast.error(e.message || 'Create failed') } finally { setSaving(false) }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Receipt className="h-5 w-5" /> New Expense</DialogTitle>
          <DialogDescription>Submit a new expense claim</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Employee *</Label>
            <Select value={form.employeeId} onValueChange={(v) => set('employeeId', v)}>
              <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
              <SelectContent className="max-h-60">
                {employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.fullName}{e.employeeCode ? ` (${e.employeeCode})` : ''}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Category *</Label>
            <Select value={form.category} onValueChange={(v) => set('category', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Amount (₹) *</Label><Input type="number" min="1" value={form.amount} onChange={(e) => set('amount', e.target.value)} placeholder="e.g. 5000" /></div>
          <div className="space-y-1.5"><Label>Description</Label><Textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={2} placeholder="Expense details..." /></div>
          <div className="space-y-1.5"><Label>Date *</Label><Input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button className="bg-[var(--navy)] text-white hover:bg-[var(--navy-light)]" onClick={submit} disabled={saving}>
            {saving ? 'Creating...' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function RejectForm({ expense, onSuccess }: { expense: ExpenseRow; onSuccess: () => void }) {
  const [remarks, setRemarks] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    setSaving(true)
    try {
      await api('/api/admin/expenses', {
        method: 'PATCH',
        body: JSON.stringify({ id: expense.id, status: 'REJECTED', remarks: remarks.trim() || undefined }),
      })
      toast.success('Expense rejected')
      onSuccess()
    } catch (e: any) { toast.error(e.message || 'Action failed') } finally { setSaving(false) }
  }

  return (
    <>
      <div className="rounded-lg border p-3 text-sm">
        <p className="text-xs font-semibold text-muted-foreground">Description</p>
        <p className="mt-1 text-[var(--navy)] dark:text-white">{expense.description || 'No description'}</p>
        <p className="mt-1 text-sm font-bold">{formatINR(expense.amount)}</p>
      </div>
      <div className="space-y-1.5">
        <Label>Remarks (optional)</Label>
        <Textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={2} placeholder="Reason for rejection..." />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onSuccess}>Cancel</Button>
        <Button className="bg-red-600 text-white hover:bg-red-700" onClick={submit} disabled={saving}>
          {saving ? 'Processing...' : 'Reject Expense'}
        </Button>
      </DialogFooter>
    </>
  )
}