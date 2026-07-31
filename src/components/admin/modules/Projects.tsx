'use client'
import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
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
import { SectionTitle, StatusBadge, EmptyState } from '@/components/shared'
import { toast } from 'sonner'
import { FolderKanban, Plus, Pencil, Trash2, MapPin, Users, Building2 } from 'lucide-react'
import { api, fmtDate } from '../lib'

interface ProjectMember {
  id: string
  role: string | null
  employee: { id: string; fullName: string; employeeCode: string | null; designation: string | null }
}
interface Project {
  id: string
  projectName: string
  site: string | null
  startDate: string | null
  endDate: string | null
  status: string
  description: string | null
  client: { id: string; clientName: string }
  members: ProjectMember[]
  _count: { members: number; workOrders: number }
}
interface ClientLite { id: string; clientName: string }
interface EmployeeLite {
  id: string; fullName: string; employeeCode: string | null; designation: string | null
}

export function Projects({ refreshKey, canDelete }: { refreshKey: number; canDelete: boolean }) {
  const [list, setList] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Project | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<Project | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api<{ projects: Project[] }>('/api/admin/projects')
      setList(data.projects || [])
    } catch (e: any) {
      toast.error(e.message || 'Failed to load projects')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load, refreshKey])

  return (
    <div className="space-y-5">
      <SectionTitle
        title="Projects"
        desc="Manage project assignments & team members"
        action={
          <Button className="bg-[var(--navy)] text-white hover:bg-[var(--navy-light)]" onClick={() => setCreating(true)}>
            <Plus className="mr-2 h-4 w-4" /> New Project
          </Button>
        }
      />

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : list.length === 0 ? (
            <EmptyState icon={FolderKanban} title="No projects yet" desc="Create your first project to assign team members" />
          ) : (
            <div className="max-h-[65vh] overflow-y-auto scroll-thin rounded-lg border">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-card">
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead className="hidden md:table-cell">Client</TableHead>
                    <TableHead className="hidden lg:table-cell">Site</TableHead>
                    <TableHead className="hidden md:table-cell">Period</TableHead>
                    <TableHead>Team</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.map((p) => (
                    <TableRow key={p.id} className="hover:bg-muted/40">
                      <TableCell>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[var(--navy)] dark:text-white">{p.projectName}</p>
                          {p.description && <p className="truncate text-xs text-muted-foreground max-w-xs">{p.description}</p>}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm">{p.client.clientName}</TableCell>
                      <TableCell className="hidden lg:table-cell text-sm">{p.site || '—'}</TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                        {p.startDate ? fmtDate(p.startDate) : '—'} → {p.endDate ? fmtDate(p.endDate) : 'Open'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="gap-1">
                          <Users className="h-3 w-3" /> {p._count.members}
                        </Badge>
                      </TableCell>
                      <TableCell><StatusBadge status={p.status} /></TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setEditing(p)} aria-label="Edit">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          {canDelete && (
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-600 hover:text-red-700" onClick={() => setDeleting(p)} aria-label="Delete">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
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

      {(creating || editing) && (
        <ProjectFormDialog
          project={editing}
          onClose={() => { setCreating(false); setEditing(null) }}
          onSuccess={() => { setCreating(false); setEditing(null); load() }}
        />
      )}

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-700">Delete project?</AlertDialogTitle>
            <AlertDialogDescription>
              Permanently delete <strong>{deleting?.projectName}</strong>? Related work orders may be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700"
              onClick={async () => {
                if (!deleting) return
                try {
                  await api('/api/admin/projects', { method: 'DELETE', body: JSON.stringify({ id: deleting.id }) })
                  toast.success('Project deleted')
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

function ProjectFormDialog({ project, onClose, onSuccess }: {
  project: Project | null
  onClose: () => void
  onSuccess: () => void
}) {
  const [clients, setClients] = useState<ClientLite[]>([])
  const [employees, setEmployees] = useState<EmployeeLite[]>([])
  const [form, setForm] = useState({
    projectName: project?.projectName || '',
    clientId: project?.clientId || '',
    site: project?.site || '',
    startDate: project?.startDate ? new Date(project.startDate).toISOString().slice(0, 10) : '',
    endDate: project?.endDate ? new Date(project.endDate).toISOString().slice(0, 10) : '',
    status: project?.status || 'ACTIVE',
    description: project?.description || '',
  })
  const [members, setMembers] = useState<string[]>(project?.members.map((m) => m.employee.id) || [])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      api<{ clients: ClientLite[] }>('/api/admin/clients'),
      api<{ employees: EmployeeLite[] }>('/api/admin/employees?status=APPROVED'),
    ]).then(([c, e]) => {
      setClients(c.clients || [])
      setEmployees(e.employees || [])
    }).catch(() => {})
  }, [])

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const toggleMember = (id: string) => {
    setMembers((m) => m.includes(id) ? m.filter((x) => x !== id) : [...m, id])
  }

  const submit = async () => {
    if (!form.projectName.trim() || !form.clientId) { toast.error('Project name & client required'); return }
    setSaving(true)
    try {
      const payload = {
        ...form,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        members: members.map((employeeId) => ({ employeeId })),
      }
      if (project) {
        await api('/api/admin/projects', { method: 'PATCH', body: JSON.stringify({ id: project.id, ...payload }) })
        toast.success('Project updated')
      } else {
        await api('/api/admin/projects', { method: 'POST', body: JSON.stringify(payload) })
        toast.success('Project created')
      }
      onSuccess()
    } catch (e: any) {
      toast.error(e.message || 'Save failed')
    } finally { setSaving(false) }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto scroll-thin">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><FolderKanban className="h-5 w-5" /> {project ? 'Edit Project' : 'New Project'}</DialogTitle>
          <DialogDescription>{project ? 'Update project details' : 'Create a new project and assign team members'}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Project Name *</Label>
              <Input value={form.projectName} onChange={(e) => set('projectName', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Client *</Label>
              <Select value={form.clientId} onValueChange={(v) => set('clientId', v)}>
                <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                <SelectContent className="max-h-72">
                  {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.clientName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Site</Label>
              <Input value={form.site} onChange={(e) => set('site', e.target.value)} placeholder="Location" />
            </div>
            <div className="space-y-1.5">
              <Label>Start Date</Label>
              <Input type="date" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>End Date</Label>
              <Input type="date" value={form.endDate} onChange={(e) => set('endDate', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="ON_HOLD">On Hold</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={2} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Team Members ({members.length} selected)</Label>
            <div className="max-h-44 overflow-y-auto scroll-thin rounded border p-2">
              {employees.length === 0 ? (
                <p className="p-3 text-center text-xs text-muted-foreground">No approved employees</p>
              ) : (
                <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                  {employees.map((e) => (
                    <label key={e.id} className="flex items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-muted/60 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={members.includes(e.id)}
                        onChange={() => toggleMember(e.id)}
                        className="h-4 w-4 accent-[var(--navy)]"
                      />
                      <span className="truncate">{e.fullName}</span>
                      <span className="text-xs text-muted-foreground">{e.employeeCode}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button className="bg-[var(--navy)] text-white hover:bg-[var(--navy-light)]" onClick={submit} disabled={saving}>
            {saving ? 'Saving…' : project ? 'Update' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
