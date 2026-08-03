'use client'
import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  Briefcase, Plus, Pencil, Trash2, Search, Users, MapPin, IndianRupee,
  Eye, EyeOff, CheckCircle2, XCircle, UserCircle, Mail, Phone,
  DollarSign, Clock, Building2, FileText,
} from 'lucide-react'
import { api, formatINR, fmtDate } from '../lib'

// ──────────────────────────── Types ────────────────────────────
interface JobPosting {
  id: string
  title: string
  department: string | null
  designation: string | null
  location: string | null
  type: string
  experience: string | null
  salaryMin: number | null
  salaryMax: number | null
  description: string | null
  requirements: string | null
  status: string
  postedAt: string
  closedAt: string | null
  _count: { candidates: number }
}

interface Candidate {
  id: string
  fullName: string
  email: string
  phone: string | null
  experience: string | null
  currentCompany: string | null
  currentCtc: number | null
  expectedCtc: number | null
  noticePeriod: string | null
  skills: string | null
  source: string | null
  status: string
  jobPostingId: string | null
  remarks: string | null
  appliedAt: string
  updatedAt: string
  jobPosting: { id: string; title: string } | null
}

// ──────────────────────────── Constants ────────────────────────────
const JOB_STATUSES = ['DRAFT', 'OPEN', 'CLOSED', 'FILLED'] as const
const CANDIDATE_STATUSES = ['NEW', 'SCREENING', 'SHORTLISTED', 'INTERVIEW', 'OFFERED', 'HIRED', 'REJECTED', 'WITHDRAWN'] as const
const JOB_TYPES = ['FULL_TIME', 'CONTRACT', 'PART_TIME', 'INTERNSHIP'] as const
const CANDIDATE_SOURCES = ['Referral', 'JobPortal', 'LinkedIn', 'Website', 'WalkIn', 'Other'] as const

const JOB_STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-500/10 text-gray-700 border-gray-500/30',
  OPEN: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30',
  CLOSED: 'bg-red-500/10 text-red-700 border-red-500/30',
  FILLED: 'bg-sky-500/10 text-sky-700 border-sky-500/30',
}

const CANDIDATE_STATUS_COLORS: Record<string, string> = {
  NEW: 'bg-gray-500/10 text-gray-700 border-gray-500/30',
  SCREENING: 'bg-amber-500/10 text-amber-700 border-amber-500/30',
  SHORTLISTED: 'bg-sky-500/10 text-sky-700 border-sky-500/30',
  INTERVIEW: 'bg-violet-500/10 text-violet-700 border-violet-500/30',
  OFFERED: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30',
  HIRED: 'bg-teal-500/10 text-teal-700 border-teal-500/30',
  REJECTED: 'bg-red-500/10 text-red-700 border-red-500/30',
  WITHDRAWN: 'bg-orange-500/10 text-orange-700 border-orange-500/30',
}

const JOB_TYPE_LABELS: Record<string, string> = {
  FULL_TIME: 'Full Time',
  CONTRACT: 'Contract',
  PART_TIME: 'Part Time',
  INTERNSHIP: 'Internship',
}

const EMPTY_JOB = {
  title: '', department: '', designation: '', location: '', type: 'FULL_TIME',
  experience: '', salaryMin: '', salaryMax: '', description: '', requirements: '', status: 'DRAFT',
}

const EMPTY_CANDIDATE = {
  fullName: '', email: '', phone: '', experience: '', currentCompany: '',
  currentCtc: '', expectedCtc: '', noticePeriod: '', skills: '',
  source: '', jobPostingId: '', remarks: '', status: 'NEW',
}

// ──────────────────────────── Component ────────────────────────────
export function Recruitment({ refreshKey }: { refreshKey: number }) {
  return (
    <div className="space-y-5">
      <SectionTitle title="Recruitment" desc="Manage job postings and candidate pipeline" />
      <Tabs defaultValue="jobs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="jobs" className="gap-2"><Briefcase className="h-4 w-4" /> Job Postings</TabsTrigger>
          <TabsTrigger value="candidates" className="gap-2"><Users className="h-4 w-4" /> Candidates</TabsTrigger>
        </TabsList>
        <TabsContent value="jobs"><JobPostingsTab refreshKey={refreshKey} /></TabsContent>
        <TabsContent value="candidates"><CandidatesTab refreshKey={refreshKey} /></TabsContent>
      </Tabs>
    </div>
  )
}

// ════════════════════════════════════════════════════════════════════
// JOB POSTINGS TAB
// ════════════════════════════════════════════════════════════════════
function JobPostingsTab({ refreshKey }: { refreshKey: number }) {
  const [list, setList] = useState<JobPosting[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<JobPosting | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<JobPosting | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)
      if (search) params.set('search', search)
      const qs = params.toString()
      const data = await api<{ jobs: JobPosting[] }>(`/api/admin/recruitment${qs ? '?' + qs : ''}`)
      setList(data.jobs || [])
    } catch (e: any) {
      toast.error(e.message || 'Failed to load job postings')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, search])

  useEffect(() => { load() }, [load, refreshKey])

  const changeStatus = async (job: JobPosting, newStatus: string) => {
    try {
      await api('/api/admin/recruitment', { method: 'PATCH', body: JSON.stringify({ id: job.id, status: newStatus }) })
      toast.success(`Status changed to ${newStatus}`)
      load()
    } catch (e: any) {
      toast.error(e.message || 'Status change failed')
    }
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search jobs..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v === 'ALL' ? '' : v)}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            {JOB_STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button className="bg-[var(--navy)] text-white hover:bg-[var(--navy-light)]" onClick={() => setCreating(true)}>
          <Plus className="mr-2 h-4 w-4" /> New Job
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : list.length === 0 ? (
            <EmptyState icon={Briefcase} title="No job postings" desc="Create your first job posting to start receiving applications" />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Salary Range</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Candidates</TableHead>
                    <TableHead>Posted</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.map((job) => (
                    <TableRow key={job.id}>
                      <TableCell>
                        <div>
                          <p className="font-semibold text-[var(--navy)] dark:text-white">{job.title}</p>
                          {job.designation && <p className="text-xs text-muted-foreground">{job.designation}</p>}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{job.department || '—'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {JOB_TYPE_LABELS[job.type] || job.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {job.salaryMin && job.salaryMax
                          ? <span className="flex items-center gap-1"><IndianRupee className="h-3 w-3" />{formatINR(job.salaryMin)} – {formatINR(job.salaryMax)}</span>
                          : job.salaryMin
                            ? <span className="flex items-center gap-1"><IndianRupee className="h-3 w-3" />{formatINR(job.salaryMin)}+</span>
                            : '—'
                        }
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${JOB_STATUS_COLORS[job.status] || ''}`}>
                          {job.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="text-xs">{job._count.candidates}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{fmtDate(job.postedAt)}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          {/* Status actions */}
                          {job.status === 'DRAFT' && (
                            <Button size="sm" variant="ghost" className="h-8 text-xs text-emerald-600 hover:text-emerald-700" onClick={() => changeStatus(job, 'OPEN')} title="Open">
                              <Eye className="mr-1 h-3 w-3" /> Open
                            </Button>
                          )}
                          {job.status === 'OPEN' && (
                            <>
                              <Button size="sm" variant="ghost" className="h-8 text-xs text-sky-600 hover:text-sky-700" onClick={() => changeStatus(job, 'FILLED')} title="Fill">
                                <CheckCircle2 className="mr-1 h-3 w-3" /> Fill
                              </Button>
                              <Button size="sm" variant="ghost" className="h-8 text-xs text-red-600 hover:text-red-700" onClick={() => changeStatus(job, 'CLOSED')} title="Close">
                                <XCircle className="mr-1 h-3 w-3" /> Close
                              </Button>
                            </>
                          )}
                          {job.status === 'CLOSED' && (
                            <Button size="sm" variant="ghost" className="h-8 text-xs text-emerald-600 hover:text-emerald-700" onClick={() => changeStatus(job, 'OPEN')} title="Reopen">
                              <Eye className="mr-1 h-3 w-3" /> Reopen
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setEditing(job)} aria-label="Edit">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-600 hover:text-red-700" onClick={() => setDeleting(job)} aria-label="Delete">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      {(creating || editing) && (
        <JobFormDialog
          job={editing}
          onClose={() => { setCreating(false); setEditing(null) }}
          onSuccess={() => { setCreating(false); setEditing(null); load() }}
        />
      )}

      {/* Delete Dialog */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-700">Delete job posting?</AlertDialogTitle>
            <AlertDialogDescription>
              Permanently delete <strong>{deleting?.title}</strong> and all linked candidate records? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700"
              onClick={async () => {
                if (!deleting) return
                try {
                  await api('/api/admin/recruitment', { method: 'DELETE', body: JSON.stringify({ id: deleting.id }) })
                  toast.success('Job posting deleted')
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

// ──────────────────────────── Job Form Dialog ────────────────────────────
function JobFormDialog({ job, onClose, onSuccess }: {
  job: JobPosting | null
  onClose: () => void
  onSuccess: () => void
}) {
  const [form, setForm] = useState(job ? {
    title: job.title,
    department: job.department || '',
    designation: job.designation || '',
    location: job.location || '',
    type: job.type,
    experience: job.experience || '',
    salaryMin: job.salaryMin?.toString() || '',
    salaryMax: job.salaryMax?.toString() || '',
    description: job.description || '',
    requirements: job.requirements || '',
    status: job.status,
  } : { ...EMPTY_JOB })
  const [saving, setSaving] = useState(false)

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async () => {
    if (!form.title.trim()) { toast.error('Job title is required'); return }
    setSaving(true)
    try {
      const payload = {
        ...form,
        salaryMin: form.salaryMin ? Number(form.salaryMin) : null,
        salaryMax: form.salaryMax ? Number(form.salaryMax) : null,
      }
      if (job) {
        await api('/api/admin/recruitment', { method: 'PATCH', body: JSON.stringify({ id: job.id, ...payload }) })
        toast.success('Job posting updated')
      } else {
        await api('/api/admin/recruitment', { method: 'POST', body: JSON.stringify(payload) })
        toast.success('Job posting created')
      }
      onSuccess()
    } catch (e: any) {
      toast.error(e.message || 'Save failed')
    } finally { setSaving(false) }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" /> {job ? 'Edit Job Posting' : 'New Job Posting'}
          </DialogTitle>
          <DialogDescription>{job ? 'Update the job posting details' : 'Create a new job posting'}</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Job Title *</Label>
            <Input value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Senior Software Engineer" />
          </div>
          <div className="space-y-1.5">
            <Label>Department</Label>
            <Input value={form.department} onChange={(e) => set('department', e.target.value)} placeholder="e.g. Engineering" />
          </div>
          <div className="space-y-1.5">
            <Label>Designation</Label>
            <Input value={form.designation} onChange={(e) => set('designation', e.target.value)} placeholder="e.g. Tech Lead" />
          </div>
          <div className="space-y-1.5">
            <Label>Location</Label>
            <Input value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="e.g. Bangalore" />
          </div>
          <div className="space-y-1.5">
            <Label>Job Type</Label>
            <Select value={form.type} onValueChange={(v) => set('type', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {JOB_TYPES.map((t) => <SelectItem key={t} value={t}>{JOB_TYPE_LABELS[t]}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Experience</Label>
            <Input value={form.experience} onChange={(e) => set('experience', e.target.value)} placeholder="e.g. 3-5 years" />
          </div>
          <div className="space-y-1.5">
            <Label>Salary Min (₹)</Label>
            <Input type="number" value={form.salaryMin} onChange={(e) => set('salaryMin', e.target.value)} placeholder="e.g. 800000" />
          </div>
          <div className="space-y-1.5">
            <Label>Salary Max (₹)</Label>
            <Input type="number" value={form.salaryMax} onChange={(e) => set('salaryMax', e.target.value)} placeholder="e.g. 1500000" />
          </div>
          {job && (
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {JOB_STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={3} placeholder="Job description..." />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Requirements</Label>
            <Textarea value={form.requirements} onChange={(e) => set('requirements', e.target.value)} rows={3} placeholder="Key requirements..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button className="bg-[var(--navy)] text-white hover:bg-[var(--navy-light)]" onClick={submit} disabled={saving}>
            {saving ? 'Saving…' : job ? 'Update' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ════════════════════════════════════════════════════════════════════
// CANDIDATES TAB
// ════════════════════════════════════════════════════════════════════
function CandidatesTab({ refreshKey }: { refreshKey: number }) {
  const [list, setList] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Candidate | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<Candidate | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [sourceFilter, setSourceFilter] = useState<string>('')
  const [search, setSearch] = useState('')
  const [jobs, setJobs] = useState<{ id: string; title: string }[]>([])

  const loadJobs = useCallback(async () => {
    try {
      const data = await api<{ jobs: JobPosting[] }>('/api/admin/recruitment')
      setJobs((data.jobs || []).map((j) => ({ id: j.id, title: j.title })))
    } catch { /* ignore */ }
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)
      if (sourceFilter) params.set('source', sourceFilter)
      if (search) params.set('search', search)
      const qs = params.toString()
      const data = await api<{ candidates: Candidate[] }>(`/api/admin/candidates${qs ? '?' + qs : ''}`)
      setList(data.candidates || [])
    } catch (e: any) {
      toast.error(e.message || 'Failed to load candidates')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, sourceFilter, search])

  useEffect(() => { loadJobs() }, [loadJobs])
  useEffect(() => { load() }, [load, refreshKey])

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search candidates..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v === 'ALL' ? '' : v)}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            {CANDIDATE_STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={sourceFilter} onValueChange={(v) => setSourceFilter(v === 'ALL' ? '' : v)}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Source" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Sources</SelectItem>
            {CANDIDATE_SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button className="bg-[var(--navy)] text-white hover:bg-[var(--navy-light)]" onClick={() => setCreating(true)}>
          <Plus className="mr-2 h-4 w-4" /> New Candidate
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : list.length === 0 ? (
            <EmptyState icon={UserCircle} title="No candidates" desc="Add your first candidate to start tracking the pipeline" />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Current CTC</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Applied</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <div>
                          <p className="font-semibold text-[var(--navy)] dark:text-white">{c.fullName}</p>
                          {c.currentCompany && <p className="text-xs text-muted-foreground">{c.currentCompany}</p>}
                          {c.skills && <p className="text-xs text-muted-foreground truncate max-w-[200px]">{c.skills}</p>}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{c.email}</TableCell>
                      <TableCell className="text-sm">{c.phone || '—'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{c.source || '—'}</Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {c.currentCtc ? <span className="flex items-center gap-1"><IndianRupee className="h-3 w-3" />{formatINR(c.currentCtc)}</span> : '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${CANDIDATE_STATUS_COLORS[c.status] || ''}`}>
                          {c.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{fmtDate(c.appliedAt)}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setEditing(c)} aria-label="Edit">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-600 hover:text-red-700" onClick={() => setDeleting(c)} aria-label="Delete">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      {(creating || editing) && (
        <CandidateFormDialog
          candidate={editing}
          jobs={jobs}
          onClose={() => { setCreating(false); setEditing(null) }}
          onSuccess={() => { setCreating(false); setEditing(null); load() }}
        />
      )}

      {/* Delete Dialog */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-700">Delete candidate?</AlertDialogTitle>
            <AlertDialogDescription>
              Permanently delete <strong>{deleting?.fullName}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700"
              onClick={async () => {
                if (!deleting) return
                try {
                  await api('/api/admin/candidates', { method: 'DELETE', body: JSON.stringify({ id: deleting.id }) })
                  toast.success('Candidate deleted')
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

// ──────────────────────────── Candidate Form Dialog ────────────────────────────
function CandidateFormDialog({ candidate, jobs, onClose, onSuccess }: {
  candidate: Candidate | null
  jobs: { id: string; title: string }[]
  onClose: () => void
  onSuccess: () => void
}) {
  const [form, setForm] = useState(candidate ? {
    fullName: candidate.fullName,
    email: candidate.email,
    phone: candidate.phone || '',
    experience: candidate.experience || '',
    currentCompany: candidate.currentCompany || '',
    currentCtc: candidate.currentCtc?.toString() || '',
    expectedCtc: candidate.expectedCtc?.toString() || '',
    noticePeriod: candidate.noticePeriod || '',
    skills: candidate.skills || '',
    source: candidate.source || '',
    jobPostingId: candidate.jobPostingId || '',
    remarks: candidate.remarks || '',
    status: candidate.status,
  } : { ...EMPTY_CANDIDATE })
  const [saving, setSaving] = useState(false)

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async () => {
    if (!form.fullName.trim()) { toast.error('Candidate name is required'); return }
    if (!form.email.trim()) { toast.error('Email is required'); return }
    setSaving(true)
    try {
      const payload = {
        ...form,
        currentCtc: form.currentCtc ? Number(form.currentCtc) : null,
        expectedCtc: form.expectedCtc ? Number(form.expectedCtc) : null,
        jobPostingId: form.jobPostingId || null,
        source: form.source || null,
      }
      if (candidate) {
        await api('/api/admin/candidates', { method: 'PATCH', body: JSON.stringify({ id: candidate.id, ...payload }) })
        toast.success('Candidate updated')
      } else {
        await api('/api/admin/candidates', { method: 'POST', body: JSON.stringify(payload) })
        toast.success('Candidate created')
      }
      onSuccess()
    } catch (e: any) {
      toast.error(e.message || 'Save failed')
    } finally { setSaving(false) }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCircle className="h-5 w-5" /> {candidate ? 'Edit Candidate' : 'New Candidate'}
          </DialogTitle>
          <DialogDescription>{candidate ? 'Update candidate details' : 'Add a new candidate to the pipeline'}</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Full Name *</Label>
            <Input value={form.fullName} onChange={(e) => set('fullName', e.target.value)} placeholder="e.g. John Doe" />
          </div>
          <div className="space-y-1.5">
            <Label>Email *</Label>
            <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="john@example.com" />
          </div>
          <div className="space-y-1.5">
            <Label>Phone</Label>
            <Input value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+91 98765 43210" />
          </div>
          <div className="space-y-1.5">
            <Label>Experience</Label>
            <Input value={form.experience} onChange={(e) => set('experience', e.target.value)} placeholder="e.g. 3 years" />
          </div>
          <div className="space-y-1.5">
            <Label>Current Company</Label>
            <Input value={form.currentCompany} onChange={(e) => set('currentCompany', e.target.value)} placeholder="e.g. Infosys" />
          </div>
          <div className="space-y-1.5">
            <Label>Notice Period</Label>
            <Input value={form.noticePeriod} onChange={(e) => set('noticePeriod', e.target.value)} placeholder="e.g. 30 days" />
          </div>
          <div className="space-y-1.5">
            <Label>Current CTC (₹)</Label>
            <Input type="number" value={form.currentCtc} onChange={(e) => set('currentCtc', e.target.value)} placeholder="e.g. 800000" />
          </div>
          <div className="space-y-1.5">
            <Label>Expected CTC (₹)</Label>
            <Input type="number" value={form.expectedCtc} onChange={(e) => set('expectedCtc', e.target.value)} placeholder="e.g. 1200000" />
          </div>
          <div className="space-y-1.5">
            <Label>Source</Label>
            <Select value={form.source} onValueChange={(v) => set('source', v)}>
              <SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger>
              <SelectContent>
                {CANDIDATE_SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Job Posting</Label>
            <Select value={form.jobPostingId} onValueChange={(v) => set('jobPostingId', v)}>
              <SelectTrigger><SelectValue placeholder="Link to job" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {jobs.map((j) => <SelectItem key={j.id} value={j.id}>{j.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {candidate && (
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CANDIDATE_STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Skills</Label>
            <Input value={form.skills} onChange={(e) => set('skills', e.target.value)} placeholder="e.g. React, TypeScript, Node.js" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Remarks</Label>
            <Textarea value={form.remarks} onChange={(e) => set('remarks', e.target.value)} rows={2} placeholder="Additional notes..." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button className="bg-[var(--navy)] text-white hover:bg-[var(--navy-light)]" onClick={submit} disabled={saving}>
            {saving ? 'Saving…' : candidate ? 'Update' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
