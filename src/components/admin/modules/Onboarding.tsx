'use client'
import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
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
import {
  ClipboardCheck, Plus, Pencil, Trash2, CheckCircle2, PlayCircle, XCircle,
  SkipForward, UserCheck, ListChecks, Calendar,
} from 'lucide-react'
import { api, fmtDate } from '../lib'

// ──────────────────────────── Types ────────────────────────────
interface Employee {
  id: string
  fullName: string
  employeeCode: string | null
  status: string
}

interface OnboardingTask {
  id: string
  employeeId: string
  task: string
  category: string | null
  dueDate: string | null
  status: string
  completedBy: string | null
  completedAt: string | null
  notes: string | null
  createdAt: string
}

// ──────────────────────────── Constants ────────────────────────────
const TASK_STATUSES = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED'] as const
const ONBOARDING_CATEGORIES = ['Documents', 'IT', 'HR', 'Finance', 'Training', 'General'] as const

const TASK_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-500/10 text-amber-700 border-amber-500/30',
  IN_PROGRESS: 'bg-sky-500/10 text-sky-700 border-sky-500/30',
  COMPLETED: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30',
  SKIPPED: 'bg-gray-500/10 text-gray-700 border-gray-500/30',
}

const TASK_STATUS_ICONS: Record<string, typeof CheckCircle2> = {
  PENDING: PlayCircle,
  IN_PROGRESS: PlayCircle,
  COMPLETED: CheckCircle2,
  SKIPPED: SkipForward,
}

const TASK_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  SKIPPED: 'Skipped',
}

const STANDARD_ONBOARDING_TASKS = [
  { task: 'Submit signed offer letter', category: 'Documents' },
  { task: 'Submit ID proof (Aadhaar/PAN)', category: 'Documents' },
  { task: 'Submit address proof', category: 'Documents' },
  { task: 'Submit previous employer relieving letter', category: 'Documents' },
  { task: 'Submit educational certificates', category: 'Documents' },
  { task: 'Complete bank account details form', category: 'Finance' },
  { task: 'Complete tax declaration (Form 12B)', category: 'Finance' },
  { task: 'Complete PF nomination form', category: 'Finance' },
  { task: 'Set up email account', category: 'IT' },
  { task: 'Set up Slack / Teams account', category: 'IT' },
  { task: 'Provision laptop and peripherals', category: 'IT' },
  { task: 'Grant system access (ERP, CRM, etc.)', category: 'IT' },
  { task: 'Complete HR orientation', category: 'HR' },
  { task: 'Review employee handbook', category: 'HR' },
  { task: 'Sign employment agreement', category: 'HR' },
  { task: 'Complete company induction training', category: 'Training' },
  { task: 'Complete team-specific onboarding', category: 'Training' },
  { task: 'Meet with department head', category: 'General' },
  { task: 'Set up workstation / desk', category: 'General' },
]

// ──────────────────────────── Component ────────────────────────────
export function Onboarding({ refreshKey }: { refreshKey: number }) {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState<string>('')
  const [tasks, setTasks] = useState<OnboardingTask[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingEmployees, setLoadingEmployees] = useState(true)
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<OnboardingTask | null>(null)
  const [deleting, setDeleting] = useState<OnboardingTask | null>(null)
  const [bulkAdding, setBulkAdding] = useState(false)

  // Load employees
  const loadEmployees = useCallback(async () => {
    setLoadingEmployees(true)
    try {
      const data = await api<{ employees: Employee[] }>('/api/admin/employees?status=APPROVED')
      setEmployees(data.employees || [])
    } catch (e: any) {
      toast.error(e.message || 'Failed to load employees')
    } finally {
      setLoadingEmployees(false)
    }
  }, [])

  // Load tasks
  const loadTasks = useCallback(async () => {
    if (!selectedEmployee) { setTasks([]); return }
    setLoading(true)
    try {
      const data = await api<{ tasks: OnboardingTask[] }>(`/api/admin/onboarding?employeeId=${selectedEmployee}`)
      setTasks(data.tasks || [])
    } catch (e: any) {
      toast.error(e.message || 'Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }, [selectedEmployee])

  useEffect(() => { loadEmployees() }, [loadEmployees])
  useEffect(() => { loadTasks() }, [loadTasks, refreshKey])

  // Progress calculation
  const total = tasks.length
  const completed = tasks.filter((t) => t.status === 'COMPLETED' || t.status === 'SKIPPED').length
  const progressPct = total > 0 ? Math.round((completed / total) * 100) : 0

  // Change task status quickly
  const changeStatus = async (task: OnboardingTask, newStatus: string) => {
    try {
      await api('/api/admin/onboarding', {
        method: 'PATCH',
        body: JSON.stringify({ id: task.id, status: newStatus }),
      })
      toast.success(`Task marked as ${TASK_STATUS_LABELS[newStatus]}`)
      loadTasks()
    } catch (e: any) {
      toast.error(e.message || 'Status change failed')
    }
  }

  // Bulk add standard tasks
  const handleBulkAdd = async () => {
    if (!selectedEmployee) return
    setBulkAdding(true)
    try {
      const dueDate = new Date()
      dueDate.setDate(dueDate.getDate() + 7)
      const bulkData = STANDARD_ONBOARDING_TASKS.map((t) => ({
        employeeId: selectedEmployee,
        task: t.task,
        category: t.category,
        dueDate: dueDate.toISOString(),
      }))
      await api('/api/admin/onboarding', {
        method: 'POST',
        body: JSON.stringify(bulkData),
      })
      toast.success(`${bulkData.length} standard tasks added`)
      loadTasks()
    } catch (e: any) {
      toast.error(e.message || 'Bulk add failed')
    } finally {
      setBulkAdding(false)
    }
  }

  const selectedEmp = employees.find((e) => e.id === selectedEmployee)

  return (
    <div className="space-y-5">
      <SectionTitle
        title="Onboarding"
        desc="Manage employee onboarding checklists"
      />

      {/* Employee Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[250px]">
              <Label className="mb-1.5 block">Select Employee</Label>
              {loadingEmployees ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Select value={selectedEmployee} onValueChange={(v) => setSelectedEmployee(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose an employee to view onboarding tasks" />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    {employees.map((e) => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.fullName} {e.employeeCode ? `(${e.employeeCode})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            {selectedEmployee && (
              <>
                <Button
                  className="bg-[var(--navy)] text-white hover:bg-[var(--navy-light)]"
                  onClick={() => setCreating(true)}
                >
                  <Plus className="mr-2 h-4 w-4" /> Add Task
                </Button>
                <Button variant="outline" onClick={handleBulkAdd} disabled={bulkAdding}>
                  <ListChecks className="mr-2 h-4 w-4" />
                  {bulkAdding ? 'Adding…' : 'Add Standard Tasks'}
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tasks Section */}
      {selectedEmployee && selectedEmp && (
        <div className="space-y-4">
          {/* Progress Bar */}
          {total > 0 && (
            <Card>
              <CardContent className="pt-5 pb-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-4 w-4 text-[var(--navy)] dark:text-[var(--gold)]" />
                    <span className="text-sm font-medium text-[var(--navy)] dark:text-white">
                      {selectedEmp.fullName}&apos;s Onboarding Progress
                    </span>
                  </div>
                  <span className="text-sm font-semibold text-[var(--navy)] dark:text-white">
                    {completed} / {total} ({progressPct}%)
                  </span>
                </div>
                <Progress value={progressPct} className="h-3" />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardContent className="pt-6">
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
                </div>
              ) : tasks.length === 0 ? (
                <EmptyState
                  icon={ClipboardCheck}
                  title="No onboarding tasks"
                  desc="Add tasks or load standard onboarding checklist for this employee"
                />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Task</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tasks.map((t) => {
                        const StatusIcon = TASK_STATUS_ICONS[t.status] || PlayCircle
                        return (
                          <TableRow key={t.id} className={t.status === 'COMPLETED' || t.status === 'SKIPPED' ? 'opacity-60' : ''}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <StatusIcon className={`h-4 w-4 shrink-0 ${t.status === 'COMPLETED' ? 'text-emerald-600' : t.status === 'SKIPPED' ? 'text-gray-400' : t.status === 'IN_PROGRESS' ? 'text-sky-600' : 'text-amber-600'}`} />
                                <span className={t.status === 'COMPLETED' || t.status === 'SKIPPED' ? 'line-through' : ''}>{t.task}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              {t.category && <Badge variant="outline" className="text-xs">{t.category}</Badge>}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {t.dueDate ? fmtDate(t.dueDate) : '—'}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`text-xs ${TASK_STATUS_COLORS[t.status] || ''}`}>
                                {TASK_STATUS_LABELS[t.status]}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-[200px]">
                              <p className="text-xs text-muted-foreground truncate">{t.notes || '—'}</p>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-end gap-1">
                                {t.status === 'PENDING' && (
                                  <Button size="sm" variant="ghost" className="h-8 text-xs text-sky-600 hover:text-sky-700" onClick={() => changeStatus(t, 'IN_PROGRESS')}>
                                    <PlayCircle className="mr-1 h-3 w-3" /> Start
                                  </Button>
                                )}
                                {t.status === 'IN_PROGRESS' && (
                                  <>
                                    <Button size="sm" variant="ghost" className="h-8 text-xs text-emerald-600 hover:text-emerald-700" onClick={() => changeStatus(t, 'COMPLETED')}>
                                      <CheckCircle2 className="mr-1 h-3 w-3" /> Done
                                    </Button>
                                    <Button size="sm" variant="ghost" className="h-8 text-xs text-gray-500 hover:text-gray-600" onClick={() => changeStatus(t, 'SKIPPED')}>
                                      <SkipForward className="mr-1 h-3 w-3" /> Skip
                                    </Button>
                                  </>
                                )}
                                {(t.status === 'COMPLETED' || t.status === 'SKIPPED') && (
                                  <Button size="sm" variant="ghost" className="h-8 text-xs text-amber-600 hover:text-amber-700" onClick={() => changeStatus(t, 'PENDING')}>
                                    Reopen
                                  </Button>
                                )}
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setEditing(t)} aria-label="Edit">
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-600 hover:text-red-700" onClick={() => setDeleting(t)} aria-label="Delete">
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {!selectedEmployee && (
        <Card>
          <CardContent className="pt-6">
            <EmptyState
              icon={UserCheck}
              title="Select an employee"
              desc="Choose an approved employee to view or manage their onboarding checklist"
            />
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Dialog */}
      {(creating || editing) && (
        <TaskFormDialog
          task={editing}
          employeeId={selectedEmployee}
          categories={ONBOARDING_CATEGORIES as unknown as string[]}
          onClose={() => { setCreating(false); setEditing(null) }}
          onSuccess={() => { setCreating(false); setEditing(null); loadTasks() }}
        />
      )}

      {/* Delete Dialog */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-700">Delete task?</AlertDialogTitle>
            <AlertDialogDescription>
              Permanently delete <strong>&quot;{deleting?.task}&quot;</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700"
              onClick={async () => {
                if (!deleting) return
                try {
                  await api('/api/admin/onboarding', { method: 'DELETE', body: JSON.stringify({ id: deleting.id }) })
                  toast.success('Task deleted')
                  setDeleting(null); loadTasks()
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

// ──────────────────────────── Task Form Dialog ────────────────────────────
function TaskFormDialog({ task, employeeId, categories, onClose, onSuccess }: {
  task: OnboardingTask | null
  employeeId: string
  categories: string[]
  onClose: () => void
  onSuccess: () => void
}) {
  const [form, setForm] = useState({
    task: task?.task || '',
    category: task?.category || '',
    dueDate: task?.dueDate ? task.dueDate.split('T')[0] : '',
    notes: task?.notes || '',
    status: task?.status || 'PENDING',
  })
  const [saving, setSaving] = useState(false)

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async () => {
    if (!form.task.trim()) { toast.error('Task name is required'); return }
    setSaving(true)
    try {
      if (task) {
        await api('/api/admin/onboarding', {
          method: 'PATCH',
          body: JSON.stringify({ id: task.id, ...form, dueDate: form.dueDate || null }),
        })
        toast.success('Task updated')
      } else {
        await api('/api/admin/onboarding', {
          method: 'POST',
          body: JSON.stringify({ employeeId, ...form, dueDate: form.dueDate || null }),
        })
        toast.success('Task created')
      }
      onSuccess()
    } catch (e: any) {
      toast.error(e.message || 'Save failed')
    } finally { setSaving(false) }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" /> {task ? 'Edit Task' : 'New Onboarding Task'}
          </DialogTitle>
          <DialogDescription>{task ? 'Update the task details' : 'Add a new task to the onboarding checklist'}</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Task Name *</Label>
            <Input value={form.task} onChange={(e) => set('task', e.target.value)} placeholder="e.g. Submit offer letter" />
          </div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={form.category} onValueChange={(v) => set('category', v)}>
              <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Due Date</Label>
            <Input type="date" value={form.dueDate} onChange={(e) => set('dueDate', e.target.value)} />
          </div>
          {task && (
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TASK_STATUSES.map((s) => <SelectItem key={s} value={s}>{TASK_STATUS_LABELS[s]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={2} placeholder="Additional notes..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button className="bg-[var(--navy)] text-white hover:bg-[var(--navy-light)]" onClick={submit} disabled={saving}>
            {saving ? 'Saving…' : task ? 'Update' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
