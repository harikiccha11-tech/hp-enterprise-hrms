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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
import { GraduationCap, Plus, Pencil, Trash2, UserPlus, PencilLine } from 'lucide-react'
import { api, fmtDateTime } from '../lib'

interface Course {
  id: string
  title: string
  description: string
  category: string
  duration: string
  mode: string
  instructor: string
  maxParticipants: number | null
  status: string
  _count: { enrollments: number }
  createdAt: string
}

interface Enrollment {
  id: string
  courseId: string
  employeeId: string
  status: string
  enrolledAt: string
  completedAt: string | null
  score: number | null
  feedback: string | null
  course: { id: string; title: string }
  employee: { id: string; fullName: string; employeeCode: string | null }
}

interface Employee {
  id: string
  fullName: string
  employeeCode: string | null
}

const CATEGORIES = ['Safety', 'Technical', 'SoftSkills', 'Compliance', 'Leadership']
const MODES = ['Online', 'Offline', 'Hybrid']
const COURSE_STATUSES = ['ACTIVE', 'INACTIVE', 'ARCHIVED']
const ENROLL_STATUSES = ['ENROLLED', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'CANCELLED']
const EMPTY = {
  title: '', description: '', category: 'Technical', duration: '',
  mode: 'Online', instructor: '', maxParticipants: '', status: 'ACTIVE',
}

function categoryColor(c: string) {
  const m: Record<string, string> = {
    Safety: 'bg-red-500/10 text-red-700 border-red-500/30',
    Technical: 'bg-sky-500/10 text-sky-700 border-sky-500/30',
    SoftSkills: 'bg-violet-500/10 text-violet-700 border-violet-500/30',
    Compliance: 'bg-amber-500/10 text-amber-700 border-amber-500/30',
    Leadership: 'bg-[var(--gold)]/15 text-[#8a6f24] border-[var(--gold)]/30',
  }
  return m[c] || 'bg-gray-500/10 text-gray-700 border-gray-500/30'
}

function modeColor(m: string) {
  const map: Record<string, string> = {
    Online: 'bg-sky-500/10 text-sky-700 border-sky-500/30',
    Offline: 'bg-amber-500/10 text-amber-700 border-amber-500/30',
    Hybrid: 'bg-violet-500/10 text-violet-700 border-violet-500/30',
  }
  return map[m] || 'bg-gray-500/10 text-gray-700 border-gray-500/30'
}

function enrollStatusColor(s: string) {
  const m: Record<string, string> = {
    ENROLLED: 'bg-sky-500/10 text-sky-700 border-sky-500/30',
    IN_PROGRESS: 'bg-amber-500/10 text-amber-700 border-amber-500/30',
    COMPLETED: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30',
    FAILED: 'bg-red-500/10 text-red-700 border-red-500/30',
    CANCELLED: 'bg-gray-500/10 text-gray-500 border-gray-500/30',
  }
  return m[s] || 'bg-gray-500/10 text-gray-700 border-gray-500/30'
}

export function Training({ refreshKey }: { refreshKey: number }) {
  const [tab, setTab] = useState('courses')
  const [courses, setCourses] = useState<Course[]>([])
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Course | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<Course | null>(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  // Enroll form
  const [enrollCourseId, setEnrollCourseId] = useState('')
  const [enrollEmployeeId, setEnrollEmployeeId] = useState('')
  const [employees, setEmployees] = useState<Employee[]>([])

  // Update enrollment
  const [updatingEnroll, setUpdatingEnroll] = useState<Enrollment | null>(null)

  const loadCourses = useCallback(async () => {
 setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)
      if (categoryFilter) params.set('category', categoryFilter)
      const qs = params.toString()
      const data = await api<{ courses: Course[] }>(`/api/admin/training${qs ? `?${qs}` : ''}`)
      setCourses(data.courses || [])
    } catch (e: any) {
      toast.error(e.message || 'Failed to load courses')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, categoryFilter])

  const loadEnrollments = useCallback(async () => {
    try {
      const data = await api<{ enrollments: Enrollment[] }>('/api/admin/training?enrollments=true')
      setEnrollments(data.enrollments || [])
    } catch (e: any) {
      toast.error(e.message || 'Failed to load enrollments')
    }
  }, [])

  useEffect(() => {
    if (tab === 'courses') loadCourses()
    else { loadEnrollments(); if (!employees.length) loadEmployees() }
  }, [tab, loadCourses, loadEnrollments, refreshKey])

  const loadEmployees = () => {
    api<{ employees: Employee[] }>('/api/admin/employees?status=APPROVED&limit=200').then((d) => setEmployees(d.employees || [])).catch(() => {})
  }

  const handleEnroll = async () => {
    if (!enrollCourseId) { toast.error('Select a course'); return }
    if (!enrollEmployeeId) { toast.error('Select an employee'); return }
    try {
      await api('/api/admin/training', {
        method: 'POST',
        body: JSON.stringify({ action: 'enroll', courseId: enrollCourseId, employeeId: enrollEmployeeId }),
      })
      toast.success('Employee enrolled')
      setEnrollCourseId(''); setEnrollEmployeeId('')
      loadEnrollments(); loadCourses()
    } catch (e: any) { toast.error(e.message || 'Enrollment failed') }
  }

  const handleUpdateEnrollment = async () => {
    if (!updatingEnroll) return
    try {
      const { id, ...rest } = updatingEnroll as any
      await api('/api/admin/training', {
        method: 'POST',
        body: JSON.stringify({ action: 'update-enrollment', enrollmentId: id, ...rest }),
      })
      toast.success('Enrollment updated')
      setUpdatingEnroll(null); loadEnrollments(); loadCourses()
    } catch (e: any) { toast.error(e.message || 'Update failed') }
  }

  return (
    <div className="space-y-5">
      <SectionTitle
        title="Training"
        desc="Manage training courses and employee enrollments"
        action={
          tab === 'courses' ? (
            <Button className="bg-[var(--navy)] text-white hover:bg-[var(--navy-light)]" onClick={() => setCreating(true)}>
              <Plus className="mr-2 h-4 w-4" /> New Course
            </Button>
          ) : undefined
        }
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="enrollments">Enrollments</TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === 'courses' && (
        <Card>
          <CardContent className="pt-6">
            {loading ? (
              <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
            ) : courses.length === 0 && !statusFilter && !categoryFilter ? (
              <EmptyState icon={GraduationCap} title="No courses yet" desc="Create your first training course" />
            ) : (
              <>
                <div className="mb-4 flex flex-wrap gap-3">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[150px]"><SelectValue placeholder="All Status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Status</SelectItem>
                      {COURSE_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
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
                        <TableHead>Category</TableHead>
                        <TableHead className="hidden md:table-cell">Duration</TableHead>
                        <TableHead>Mode</TableHead>
                        <TableHead className="hidden md:table-cell">Instructor</TableHead>
                        <TableHead>Enrolled</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {courses.map((c) => (
                        <TableRow key={c.id} className="hover:bg-muted/40">
                          <TableCell>
                            <p className="text-sm font-semibold text-[var(--navy)] dark:text-white">{c.title}</p>
                            <p className="text-[11px] text-muted-foreground max-w-[200px] truncate">{c.description}</p>
                          </TableCell>
                          <TableCell><Badge className={categoryColor(c.category)}>{c.category}</Badge></TableCell>
                          <TableCell className="hidden md:table-cell text-sm">{c.duration || '—'}</TableCell>
                          <TableCell><Badge className={modeColor(c.mode)}>{c.mode}</Badge></TableCell>
                          <TableCell className="hidden md:table-cell text-sm">{c.instructor || '—'}</TableCell>
                          <TableCell className="text-sm font-medium">{c._count.enrollments}{c.maxParticipants ? ` / ${c.maxParticipants}` : ''}</TableCell>
                          <TableCell><Badge variant="outline">{c.status}</Badge></TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setEditing(c)} aria-label="Edit"><Pencil className="h-3.5 w-3.5" /></Button>
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-600 hover:text-red-700" onClick={() => setDeleting(c)} aria-label="Delete"><Trash2 className="h-3.5 w-3.5" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {courses.length === 0 && (
                        <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No courses match your filters</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
            {!loading && courses.length > 0 && <p className="mt-3 text-xs text-muted-foreground">{courses.length} course{courses.length > 1 ? 's' : ''}</p>}
          </CardContent>
        </Card>
      )}

      {tab === 'enrollments' && (
        <Card>
          <CardContent className="pt-6">
            {/* Enroll form row */}
            <div className="mb-4 flex flex-wrap items-end gap-3 rounded-lg border p-4 bg-muted/30">
              <div className="space-y-1.5 flex-1 min-w-[180px]">
                <Label className="text-xs">Course</Label>
                <Select value={enrollCourseId} onValueChange={setEnrollCourseId}>
                  <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
                  <SelectContent className="max-h-60">
                    {courses.map((c) => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 flex-1 min-w-[180px]">
                <Label className="text-xs">Employee</Label>
                <Select value={enrollEmployeeId} onValueChange={setEnrollEmployeeId}>
                  <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                  <SelectContent className="max-h-60">
                    {employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.fullName}{e.employeeCode ? ` (${e.employeeCode})` : ''}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button className="bg-[var(--navy)] text-white hover:bg-[var(--navy-light)]" onClick={handleEnroll}>
                <UserPlus className="mr-2 h-4 w-4" /> Enroll
              </Button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto scroll-thin rounded-lg border">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-card">
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden md:table-cell">Score</TableHead>
                    <TableHead className="hidden lg:table-cell">Enrolled At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrollments.map((en) => (
                    <TableRow key={en.id} className="hover:bg-muted/40">
                      <TableCell>
                        <p className="text-sm font-semibold text-[var(--navy)] dark:text-white">{en.employee.fullName}</p>
                        <p className="text-[11px] text-muted-foreground">{en.employee.employeeCode || '—'}</p>
                      </TableCell>
                      <TableCell className="text-sm">{en.course.title}</TableCell>
                      <TableCell><Badge className={enrollStatusColor(en.status)}>{en.status.replace('_', ' ')}</Badge></TableCell>
                      <TableCell className="hidden md:table-cell text-sm font-medium">{en.score !== null ? `${en.score}%` : '—'}</TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">{fmtDateTime(en.enrolledAt)}</TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" className="h-8 px-2 gap-1" onClick={() => setUpdatingEnroll(en)}>
                          <PencilLine className="h-3.5 w-3.5" /> <span className="text-xs">Update</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {enrollments.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No enrollments yet</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            {enrollments.length > 0 && <p className="mt-3 text-xs text-muted-foreground">{enrollments.length} enrollment{enrollments.length > 1 ? 's' : ''}</p>}
          </CardContent>
        </Card>
      )}

      {/* Course Form Dialog */}
      {(creating || editing) && (
        <CourseFormDialog
          course={editing}
          onClose={() => { setCreating(false); setEditing(null) }}
          onSuccess={() => { setCreating(false); setEditing(null); loadCourses() }}
        />
      )}

      {/* Delete Course */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-700">Delete course?</AlertDialogTitle>
            <AlertDialogDescription>Permanently delete <strong>{deleting?.title}</strong> and all its enrollments?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={async () => {
              if (!deleting) return
              try { await api('/api/admin/training', { method: 'DELETE', body: JSON.stringify({ id: deleting.id }) }); toast.success('Course deleted'); setDeleting(null); loadCourses() }
              catch (e: any) { toast.error(e.message || 'Delete failed') }
            }}><Trash2 className="mr-1 h-4 w-4" /> Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Update Enrollment Dialog */}
      {updatingEnroll && (
        <Dialog open onOpenChange={(o) => !o && setUpdatingEnroll(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><PencilLine className="h-5 w-5" /> Update Enrollment</DialogTitle>
              <DialogDescription>{updatingEnroll.employee.fullName} — {updatingEnroll.course.title}</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={updatingEnroll.status} onValueChange={(v) => setUpdatingEnroll({ ...updatingEnroll, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ENROLL_STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Score (%)</Label>
                <Input type="number" min="0" max="100" value={updatingEnroll.score ?? ''} onChange={(e) => setUpdatingEnroll({ ...updatingEnroll, score: e.target.value ? Number(e.target.value) : null })} placeholder="e.g. 85" />
              </div>
              <div className="space-y-1.5">
                <Label>Feedback</Label>
                <Textarea value={updatingEnroll.feedback || ''} onChange={(e) => setUpdatingEnroll({ ...updatingEnroll, feedback: e.target.value })} rows={2} placeholder="Optional feedback..." />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setUpdatingEnroll(null)}>Cancel</Button>
              <Button className="bg-[var(--navy)] text-white hover:bg-[var(--navy-light)]" onClick={handleUpdateEnrollment}>Update</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

function CourseFormDialog({ course, onClose, onSuccess }: { course: Course | null; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState(course ? {
    title: course.title, description: course.description, category: course.category,
    duration: course.duration, mode: course.mode, instructor: course.instructor,
    maxParticipants: course.maxParticipants ? String(course.maxParticipants) : '',
    status: course.status,
  } : { ...EMPTY })
  const [saving, setSaving] = useState(false)

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async () => {
    if (!form.title.trim()) { toast.error('Course title is required'); return }
    setSaving(true)
    try {
      const payload = { ...form, maxParticipants: form.maxParticipants ? Number(form.maxParticipants) : null }
      if (course) {
        await api('/api/admin/training', { method: 'PATCH', body: JSON.stringify({ id: course.id, ...payload }) })
        toast.success('Course updated')
      } else {
        await api('/api/admin/training', { method: 'POST', body: JSON.stringify(payload) })
        toast.success('Course created')
      }
      onSuccess()
    } catch (e: any) { toast.error(e.message || 'Save failed') } finally { setSaving(false) }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" /> {course ? 'Edit Course' : 'New Course'}
          </DialogTitle>
          <DialogDescription>{course ? 'Update course details' : 'Create a new training course'}</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2"><Label>Title *</Label><Input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Advanced React Patterns" /></div>
          <div className="space-y-1.5 sm:col-span-2"><Label>Description</Label><Textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={2} placeholder="Course description..." /></div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={form.category} onValueChange={(v) => set('category', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Duration</Label>
            <Input value={form.duration} onChange={(e) => set('duration', e.target.value)} placeholder="e.g. 40 hours" />
          </div>
          <div className="space-y-1.5">
            <Label>Mode</Label>
            <Select value={form.mode} onValueChange={(v) => set('mode', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{MODES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Instructor</Label>
            <Input value={form.instructor} onChange={(e) => set('instructor', e.target.value)} placeholder="Instructor name" />
          </div>
          <div className="space-y-1.5">
            <Label>Max Participants</Label>
            <Input type="number" min="1" value={form.maxParticipants} onChange={(e) => set('maxParticipants', e.target.value)} placeholder="e.g. 30" />
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => set('status', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{COURSE_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button className="bg-[var(--navy)] text-white hover:bg-[var(--navy-light)]" onClick={submit} disabled={saving}>
            {saving ? 'Saving...' : course ? 'Update' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}