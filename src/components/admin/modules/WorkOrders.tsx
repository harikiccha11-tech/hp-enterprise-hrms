'use client'
import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { SectionTitle, StatusBadge, EmptyState } from '@/components/shared'
import { toast } from 'sonner'
import { ClipboardList, Plus } from 'lucide-react'
import { api, fmtDate, formatINR } from '../lib'

interface WorkOrder {
  id: string
  woNumber: string
  title: string
  value: number
  startDate: string | null
  endDate: string | null
  status: string
  createdAt: string
  client: { id: string; clientName: string }
  project: { id: string; projectName: string } | null
  _count: { invoices: number }
}
interface ClientLite { id: string; clientName: string }
interface ProjectLite { id: string; projectName: string; clientId: string }

export function WorkOrders({ refreshKey }: { refreshKey: number }) {
  const [list, setList] = useState<WorkOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api<{ workOrders: WorkOrder[] }>('/api/admin/workorders')
      setList(data.workOrders || [])
    } catch (e: any) {
      toast.error(e.message || 'Failed to load work orders')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load, refreshKey])

  return (
    <div className="space-y-5">
      <SectionTitle
        title="Work Orders"
        desc="Client work order tracking"
        action={
          <Button className="bg-[var(--navy)] text-white hover:bg-[var(--navy-light)]" onClick={() => setCreating(true)}>
            <Plus className="mr-2 h-4 w-4" /> New Work Order
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
            <EmptyState icon={ClipboardList} title="No work orders" desc="Create your first work order to track client deliverables" />
          ) : (
            <div className="max-h-[65vh] overflow-y-auto scroll-thin rounded-lg border">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-card">
                  <TableRow>
                    <TableHead>WO #</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead className="hidden md:table-cell">Client</TableHead>
                    <TableHead className="hidden lg:table-cell">Project</TableHead>
                    <TableHead className="text-right">Value</TableHead>
                    <TableHead className="hidden md:table-cell">Period</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.map((w) => (
                    <TableRow key={w.id} className="hover:bg-muted/40">
                      <TableCell className="font-mono text-xs font-semibold">{w.woNumber}</TableCell>
                      <TableCell>
                        <p className="truncate text-sm font-semibold text-[var(--navy)] dark:text-white">{w.title}</p>
                        <p className="text-xs text-muted-foreground">{w._count.invoices} invoice{w._count.invoices !== 1 ? 's' : ''}</p>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm">{w.client.clientName}</TableCell>
                      <TableCell className="hidden lg:table-cell text-sm">{w.project?.projectName || '—'}</TableCell>
                      <TableCell className="text-right text-sm font-mono">{formatINR(w.value)}</TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                        {w.startDate ? fmtDate(w.startDate) : '—'} → {w.endDate ? fmtDate(w.endDate) : 'Open'}
                      </TableCell>
                      <TableCell><StatusBadge status={w.status} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {creating && (
        <WorkOrderFormDialog
          onClose={() => setCreating(false)}
          onSuccess={() => { setCreating(false); load() }}
        />
      )}
    </div>
  )
}

function WorkOrderFormDialog({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [clients, setClients] = useState<ClientLite[]>([])
  const [projects, setProjects] = useState<ProjectLite[]>([])
  const [form, setForm] = useState({
    woNumber: '', clientId: '', projectId: '', title: '', value: '',
    startDate: '', endDate: '', status: 'OPEN',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      api<{ clients: ClientLite[] }>('/api/admin/clients'),
      api<{ projects: ProjectLite[] }>('/api/admin/projects'),
    ]).then(([c, p]) => {
      setClients(c.clients || [])
      setProjects(p.projects || [])
    }).catch(() => {})
  }, [])

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async () => {
    if (!form.woNumber.trim() || !form.clientId || !form.title.trim() || !form.value) {
      toast.error('WO #, client, title & value required')
      return
    }
    setSaving(true)
    try {
      await api('/api/admin/workorders', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          value: Number(form.value),
          projectId: form.projectId || null,
          startDate: form.startDate || null,
          endDate: form.endDate || null,
        }),
      })
      toast.success('Work order created')
      onSuccess()
    } catch (e: any) {
      toast.error(e.message || 'Save failed')
    } finally { setSaving(false) }
  }

  const filteredProjects = form.clientId ? projects.filter((p) => p.clientId === form.clientId) : projects

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><ClipboardList className="h-5 w-5" /> New Work Order</DialogTitle>
          <DialogDescription>Create a work order for a client project</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5"><Label>WO Number *</Label><Input value={form.woNumber} onChange={(e) => set('woNumber', e.target.value)} placeholder="WO-2025-001" /></div>
          <div className="space-y-1.5"><Label>Title *</Label><Input value={form.title} onChange={(e) => set('title', e.target.value)} /></div>
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
            <Label>Project</Label>
            <Select value={form.projectId} onValueChange={(v) => set('projectId', v)}>
              <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
              <SelectContent className="max-h-72">
                {filteredProjects.map((p) => <SelectItem key={p.id} value={p.id}>{p.projectName}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Value (₹) *</Label><Input type="number" value={form.value} onChange={(e) => set('value', e.target.value)} /></div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => set('status', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="ON_HOLD">On Hold</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Start Date</Label><Input type="date" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>End Date</Label><Input type="date" value={form.endDate} onChange={(e) => set('endDate', e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button className="bg-[var(--navy)] text-white hover:bg-[var(--navy-light)]" onClick={submit} disabled={saving}>
            {saving ? 'Creating…' : 'Create Work Order'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
