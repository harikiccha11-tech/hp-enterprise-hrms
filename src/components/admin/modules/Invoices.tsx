'use client'
import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
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
import { ReceiptText, Plus, Trash2, Download, Pencil } from 'lucide-react'
import { useAuth } from '@/lib/store'
import { api, fmtDate, formatINR } from '../lib'

interface Invoice {
  id: string
  invoiceNumber: string
  amount: number
  tax: number
  total: number
  status: string
  issueDate: string
  dueDate: string | null
  client: { id: string; clientName: string }
  workOrder: { id: string; woNumber: string } | null
}
interface ClientLite { id: string; clientName: string }
interface WorkOrderLite { id: string; woNumber: string; clientId: string; title: string }

export function Invoices({ refreshKey }: { refreshKey: number }) {
  const { user } = useAuth()
  const isSuperAdmin = user?.role === 'OWNER' || user?.role === 'SUPER_ADMIN'
  const [list, setList] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Invoice | null>(null)
  const [fullEditing, setFullEditing] = useState<Invoice | null>(null)
  const [deleting, setDeleting] = useState<Invoice | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api<{ invoices: Invoice[] }>('/api/admin/invoices')
      setList(data.invoices || [])
    } catch (e: any) {
      toast.error(e.message || 'Failed to load invoices')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load, refreshKey])

  const totalAmount = list.reduce((s, i) => s + i.total, 0)
  const totalPaid = list.filter((i) => i.status === 'PAID').reduce((s, i) => s + i.total, 0)

  return (
    <div className="space-y-5">
      <SectionTitle
        title="Invoices"
        desc="Billing & invoice management"
        action={
          <Button className="bg-[var(--navy)] text-white hover:bg-[var(--navy-light)]" onClick={() => setCreating(true)}>
            <Plus className="mr-2 h-4 w-4" /> New Invoice
          </Button>
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Total Invoiced</p>
          <p className="mt-1 text-xl font-bold text-[var(--navy)] dark:text-white">{formatINR(totalAmount)}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">{list.length} invoice{list.length !== 1 ? 's' : ''}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Collected</p>
          <p className="mt-1 text-xl font-bold text-emerald-700">{formatINR(totalPaid)}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">PAID status</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Outstanding</p>
          <p className="mt-1 text-xl font-bold text-amber-700">{formatINR(totalAmount - totalPaid)}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">Pending/overdue</p>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : list.length === 0 ? (
            <EmptyState icon={ReceiptText} title="No invoices" desc="Create your first invoice to track billing" />
          ) : (
            <div className="max-h-[60vh] overflow-y-auto scroll-thin rounded-lg border">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-card">
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead className="hidden md:table-cell">Client</TableHead>
                    <TableHead className="hidden lg:table-cell">Work Order</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="hidden md:table-cell text-right">Tax</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="hidden md:table-cell">Due Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.map((inv) => (
                    <TableRow key={inv.id} className="hover:bg-muted/40">
                      <TableCell className="font-mono text-xs font-semibold">{inv.invoiceNumber}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm">{inv.client.clientName}</TableCell>
                      <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">{inv.workOrder?.woNumber || '—'}</TableCell>
                      <TableCell className="text-right text-sm font-mono">{formatINR(inv.amount)}</TableCell>
                      <TableCell className="hidden md:table-cell text-right text-sm font-mono text-muted-foreground">{formatINR(inv.tax)}</TableCell>
                      <TableCell className="text-right text-sm font-bold font-mono text-[var(--navy)] dark:text-white">{formatINR(inv.total)}</TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                        {inv.dueDate ? fmtDate(inv.dueDate) : '—'}
                      </TableCell>
                      <TableCell><StatusBadge status={inv.status} /></TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="Download PDF"
                            onClick={() => window.open(`/api/invoice-pdf?id=${inv.id}`, '_blank')}
                          >
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="Edit invoice"
                            onClick={() => setFullEditing(inv)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8" onClick={() => setEditing(inv)}>
                            Update Status
                          </Button>
                          {isSuperAdmin && (
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50" title="Delete invoice"
                              onClick={() => setDeleting(inv)}
                            >
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

      {creating && (
        <InvoiceFormDialog
          onClose={() => setCreating(false)}
          onSuccess={() => { setCreating(false); load() }}
        />
      )}

      {editing && (
        <StatusDialog
          invoice={editing}
          onClose={() => setEditing(null)}
          onSuccess={() => { setEditing(null); load() }}
        />
      )}

      {fullEditing && (
        <EditInvoiceDialog
          invoice={fullEditing}
          onClose={() => setFullEditing(null)}
          onSuccess={() => { setFullEditing(null); load() }}
        />
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-700">Delete invoice?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete invoice <strong>{deleting?.invoiceNumber}</strong> ({formatINR(deleting?.total)}). This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={async () => {
                if (!deleting) return
                try {
                  await api('/api/admin/invoices', { method: 'DELETE', body: JSON.stringify({ id: deleting.id }) })
                  toast.success('Invoice deleted')
                  setDeleting(null); load()
                } catch (e: any) {
                  toast.error(e.message || 'Delete failed')
                }
              }}
            >
              <Trash2 className="mr-1 h-4 w-4" /> Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function InvoiceFormDialog({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [clients, setClients] = useState<ClientLite[]>([])
  const [workOrders, setWorkOrders] = useState<WorkOrderLite[]>([])
  const [form, setForm] = useState({
    clientId: '', workOrderId: '', amount: '', tax: '', status: 'DRAFT', dueDate: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      api<{ clients: ClientLite[] }>('/api/admin/clients'),
      api<{ workOrders: WorkOrderLite[] }>('/api/admin/workorders'),
    ]).then(([c, w]) => {
      setClients(c.clients || [])
      setWorkOrders(w.workOrders || [])
    }).catch(() => {})
  }, [])

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async () => {
    if (!form.clientId || !form.amount) { toast.error('Client & amount required'); return }
    setSaving(true)
    try {
      await api('/api/admin/invoices', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          amount: Number(form.amount),
          tax: Number(form.tax) || 0,
          workOrderId: form.workOrderId || null,
          dueDate: form.dueDate || null,
        }),
      })
      toast.success('Invoice created')
      onSuccess()
    } catch (e: any) {
      toast.error(e.message || 'Save failed')
    } finally { setSaving(false) }
  }

  const filteredWOs = form.clientId ? workOrders.filter((w) => w.clientId === form.clientId) : workOrders

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><ReceiptText className="h-5 w-5" /> New Invoice</DialogTitle>
          <DialogDescription>Invoice number is auto-generated</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Client *</Label>
            <Select value={form.clientId} onValueChange={(v) => set('clientId', v)}>
              <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
              <SelectContent className="max-h-72">
                {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.clientName}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Work Order</Label>
            <Select value={form.workOrderId} onValueChange={(v) => set('workOrderId', v)}>
              <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
              <SelectContent className="max-h-72">
                {filteredWOs.map((w) => <SelectItem key={w.id} value={w.id}>{w.woNumber} — {w.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Amount (₹) *</Label><Input type="number" value={form.amount} onChange={(e) => set('amount', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Tax (₹)</Label><Input type="number" value={form.tax} onChange={(e) => set('tax', e.target.value)} /></div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => set('status', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="SENT">Sent</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="OVERDUE">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Due Date</Label><Input type="date" value={form.dueDate} onChange={(e) => set('dueDate', e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button className="bg-[var(--navy)] text-white hover:bg-[var(--navy-light)]" onClick={submit} disabled={saving}>
            {saving ? 'Creating…' : 'Create Invoice'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function EditInvoiceDialog({ invoice, onClose, onSuccess }: {
  invoice: Invoice
  onClose: () => void
  onSuccess: () => void
}) {
  const [clients, setClients] = useState<ClientLite[]>([])
  const [workOrders, setWorkOrders] = useState<WorkOrderLite[]>([])
  const [form, setForm] = useState({
    clientId: invoice.client.id,
    workOrderId: invoice.workOrder?.id || '',
    amount: String(invoice.amount),
    tax: String(invoice.tax),
    dueDate: invoice.dueDate ? invoice.dueDate.slice(0, 10) : '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      api<{ clients: ClientLite[] }>('/api/admin/clients'),
      api<{ workOrders: WorkOrderLite[] }>('/api/admin/workorders'),
    ]).then(([c, w]) => {
      setClients(c.clients || [])
      setWorkOrders(w.workOrders || [])
    }).catch(() => {})
  }, [])

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async () => {
    if (!form.clientId || !form.amount) { toast.error('Client & amount required'); return }
    setSaving(true)
    try {
      await api('/api/admin/invoices', {
        method: 'PATCH',
        body: JSON.stringify({
          id: invoice.id,
          clientId: form.clientId,
          workOrderId: form.workOrderId || null,
          amount: Number(form.amount),
          tax: Number(form.tax) || 0,
          dueDate: form.dueDate || null,
        }),
      })
      toast.success('Invoice updated')
      onSuccess()
    } catch (e: any) {
      toast.error(e.message || 'Update failed')
    } finally { setSaving(false) }
  }

  const filteredWOs = form.clientId ? workOrders.filter((w) => w.clientId === form.clientId) : workOrders

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Pencil className="h-5 w-5" /> Edit Invoice</DialogTitle>
          <DialogDescription>{invoice.invoiceNumber} • {formatINR(invoice.total)}</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Client *</Label>
            <Select value={form.clientId} onValueChange={(v) => set('clientId', v)}>
              <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
              <SelectContent className="max-h-72">
                {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.clientName}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Work Order</Label>
            <Select value={form.workOrderId} onValueChange={(v) => set('workOrderId', v)}>
              <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
              <SelectContent className="max-h-72">
                {filteredWOs.map((w) => <SelectItem key={w.id} value={w.id}>{w.woNumber} — {w.title}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Amount (₹) *</Label><Input type="number" value={form.amount} onChange={(e) => set('amount', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Tax (₹)</Label><Input type="number" value={form.tax} onChange={(e) => set('tax', e.target.value)} /></div>
          <div className="space-y-1.5 sm:col-span-2"><Label>Due Date</Label><Input type="date" value={form.dueDate} onChange={(e) => set('dueDate', e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button className="bg-[var(--navy)] text-white hover:bg-[var(--navy-light)]" onClick={submit} disabled={saving}>
            {saving ? 'Saving…' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function StatusDialog({ invoice, onClose, onSuccess }: {
  invoice: Invoice
  onClose: () => void
  onSuccess: () => void
}) {
  const [status, setStatus] = useState(invoice.status)
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    setSaving(true)
    try {
      await api('/api/admin/invoices', {
        method: 'PATCH',
        body: JSON.stringify({ id: invoice.id, status }),
      })
      toast.success('Invoice status updated')
      onSuccess()
    } catch (e: any) {
      toast.error(e.message || 'Update failed')
    } finally { setSaving(false) }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><ReceiptText className="h-5 w-5" /> Update Invoice</DialogTitle>
          <DialogDescription>{invoice.invoiceNumber} • {formatINR(invoice.total)}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="rounded-lg border p-3 text-sm">
            <p className="text-xs text-muted-foreground">Client</p>
            <p className="font-semibold text-[var(--navy)] dark:text-white">{invoice.client.clientName}</p>
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="SENT">Sent</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="OVERDUE">Overdue</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button className="bg-[var(--navy)] text-white hover:bg-[var(--navy-light)]" onClick={submit} disabled={saving}>
            {saving ? 'Saving…' : 'Update'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
