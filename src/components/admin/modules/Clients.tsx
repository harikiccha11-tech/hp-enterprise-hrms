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
import { Building2, Plus, Pencil, Trash2, Mail, Phone, MapPin, Briefcase, ReceiptText } from 'lucide-react'
import { api } from '../lib'

interface Client {
  id: string
  clientName: string
  companyName: string | null
  gst: string | null
  email: string | null
  phone: string | null
  address: string | null
  createdAt: string
  _count: { projects: number; invoices: number }
}

const EMPTY = {
  clientName: '', companyName: '', gst: '', email: '', phone: '', address: '',
}

export function Clients({ refreshKey, canDelete }: { refreshKey: number; canDelete: boolean }) {
  const [list, setList] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Client | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<Client | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api<{ clients: Client[] }>('/api/admin/clients')
      setList(data.clients || [])
    } catch (e: any) {
      toast.error(e.message || 'Failed to load clients')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load, refreshKey])

  return (
    <div className="space-y-5">
      <SectionTitle
        title="Clients"
        desc="Manage client master records"
        action={
          <Button className="bg-[var(--navy)] text-white hover:bg-[var(--navy-light)]" onClick={() => setCreating(true)}>
            <Plus className="mr-2 h-4 w-4" /> New Client
          </Button>
        }
      />

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-44 w-full" />)}
            </div>
          ) : list.length === 0 ? (
            <EmptyState icon={Building2} title="No clients yet" desc="Create your first client to start tracking projects" />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((c) => (
                <div key={c.id} className="rounded-xl border p-5 lift">
                  <div className="flex items-start justify-between">
                    <div className="grid h-11 w-11 place-items-center rounded-lg bg-[var(--navy)]/10">
                      <Building2 className="h-5 w-5 text-[var(--navy)] dark:text-[var(--gold-light)]" />
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setEditing(c)} aria-label="Edit">
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      {canDelete && (
                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-600 hover:text-red-700" onClick={() => setDeleting(c)} aria-label="Delete">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <h3 className="mt-3 truncate text-base font-bold text-[var(--navy)] dark:text-white">{c.clientName}</h3>
                  {c.companyName && <p className="truncate text-xs text-muted-foreground">{c.companyName}</p>}
                  <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                    {c.email && <p className="flex items-center gap-1.5 truncate"><Mail className="h-3 w-3 shrink-0" /> {c.email}</p>}
                    {c.phone && <p className="flex items-center gap-1.5 truncate"><Phone className="h-3 w-3 shrink-0" /> {c.phone}</p>}
                    {c.gst && <p className="flex items-center gap-1.5 truncate"><ReceiptText className="h-3 w-3 shrink-0" /> GST: {c.gst}</p>}
                    {c.address && <p className="flex items-start gap-1.5 line-clamp-2"><MapPin className="h-3 w-3 mt-0.5 shrink-0" /> {c.address}</p>}
                  </div>
                  <div className="mt-4 flex items-center gap-2 border-t pt-3">
                    <Badge variant="outline" className="gap-1 border-[var(--gold)]/40 text-[#8a6f24]">
                      <Briefcase className="h-3 w-3" /> {c._count.projects} Project{c._count.projects !== 1 ? 's' : ''}
                    </Badge>
                    <Badge variant="outline" className="gap-1">
                      <ReceiptText className="h-3 w-3" /> {c._count.invoices} Invoice{c._count.invoices !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {(creating || editing) && (
        <ClientFormDialog
          client={editing}
          onClose={() => { setCreating(false); setEditing(null) }}
          onSuccess={() => { setCreating(false); setEditing(null); load() }}
        />
      )}

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-700">Delete client?</AlertDialogTitle>
            <AlertDialogDescription>
              Permanently delete <strong>{deleting?.clientName}</strong>? This will also remove related projects, work orders, and invoices.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700"
              onClick={async () => {
                if (!deleting) return
                try {
                  await api('/api/admin/clients', { method: 'DELETE', body: JSON.stringify({ id: deleting.id }) })
                  toast.success('Client deleted')
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

function ClientFormDialog({ client, onClose, onSuccess }: {
  client: Client | null
  onClose: () => void
  onSuccess: () => void
}) {
  const [form, setForm] = useState(client ? {
    clientName: client.clientName,
    companyName: client.companyName || '',
    gst: client.gst || '',
    email: client.email || '',
    phone: client.phone || '',
    address: client.address || '',
  } : EMPTY)
  const [saving, setSaving] = useState(false)

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async () => {
    if (!form.clientName.trim()) { toast.error('Client name required'); return }
    setSaving(true)
    try {
      if (client) {
        await api('/api/admin/clients', { method: 'PATCH', body: JSON.stringify({ id: client.id, ...form }) })
        toast.success('Client updated')
      } else {
        const res = await api<{ ok: boolean; credentials?: { username: string; password: string } }>('/api/admin/clients', { method: 'POST', body: JSON.stringify(form) })
        toast.success('Client created')
        // Show auto-generated credentials toast if present
        if (res.credentials?.username) {
          toast.success(
            `Client portal credentials — Username: ${res.credentials.username} | Password: ${res.credentials.password} (must be changed on first login)`,
            { duration: 10000 }
          )
        }
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
            <Building2 className="h-5 w-5" /> {client ? 'Edit Client' : 'New Client'}
          </DialogTitle>
          <DialogDescription>{client ? 'Update client details' : 'Create a new client master record'}</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Client Name *</Label>
            <Input value={form.clientName} onChange={(e) => set('clientName', e.target.value)} placeholder="e.g. Infosys Ltd" />
          </div>
          <div className="space-y-1.5"><Label>Company Name</Label><Input value={form.companyName} onChange={(e) => set('companyName', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>GST</Label><Input value={form.gst} onChange={(e) => set('gst', e.target.value)} placeholder="29ANZPH4067Q1ZS" /></div>
          <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Phone</Label><Input value={form.phone} onChange={(e) => set('phone', e.target.value)} /></div>
          <div className="space-y-1.5 sm:col-span-2"><Label>Address</Label><Textarea value={form.address} onChange={(e) => set('address', e.target.value)} rows={2} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button className="bg-[var(--navy)] text-white hover:bg-[var(--navy-light)]" onClick={submit} disabled={saving}>
            {saving ? 'Saving…' : client ? 'Update' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
