'use client'
import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
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
import { Wallet, Plus, Pencil, Trash2, Star } from 'lucide-react'
import { api } from '../lib'

interface Gateway {
  id: string; name: string; type: string; apiKey: string | null; apiSecret: string | null
  merchantId: string | null; isDefault: boolean; upiId: string | null
  bankName: string | null; bankAccount: string | null; bankIfsc: string | null
  status: string; createdAt: string
}

const EMPTY = { name: '', type: 'razorpay', apiKey: '', apiSecret: '', merchantId: '', isDefault: false, upiId: '', bankName: '', bankAccount: '', bankIfsc: '', status: 'ACTIVE' }

const TYPES = ['razorpay', 'stripe', 'upi', 'bank_transfer']

const typeColor: Record<string, string> = {
  razorpay: 'bg-sky-500/10 text-sky-700 border-sky-500/30',
  stripe: 'bg-violet-500/10 text-violet-700 border-violet-500/30',
  upi: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30',
  bank_transfer: 'bg-amber-500/10 text-amber-700 border-amber-500/30',
}

function mask(s: string | null) {
  if (!s) return '—'
  if (s.length <= 8) return '••••••'
  return s.slice(0, 4) + '••••' + s.slice(-4)
}

export function PaymentGateways({ refreshKey }: { refreshKey: number }) {
  const [list, setList] = useState<Gateway[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Gateway | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<Gateway | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api<{ items: Gateway[] }>('/api/admin/payment-gateways')
      setList(data.items || [])
    } catch (e: any) { toast.error(e.message || 'Failed to load') } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load, refreshKey])

  return (
    <div className="space-y-5">
      <SectionTitle title="Payment Gateways" desc="Configure payment integrations" action={
        <Button className="bg-[var(--navy)] text-white hover:bg-[var(--navy-light)]" onClick={() => setCreating(true)}><Plus className="mr-2 h-4 w-4" /> New Gateway</Button>
      } />

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : list.length === 0 ? (
            <EmptyState icon={Wallet} title="No payment gateways" desc="Add your first payment gateway" />
          ) : (
            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Merchant ID</TableHead>
                    <TableHead>UPI / Bank</TableHead>
                    <TableHead>Default</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.map((gw) => (
                    <TableRow key={gw.id}>
                      <TableCell className="font-medium">{gw.name}</TableCell>
                      <TableCell><Badge className={typeColor[gw.type] || typeColor.razorpay}>{gw.type}</Badge></TableCell>
                      <TableCell><code className="text-xs font-mono text-muted-foreground">{mask(gw.merchantId)}</code></TableCell>
                      <TableCell className="text-sm">{gw.upiId || (gw.bankName ? `${gw.bankName} - ${mask(gw.bankAccount)}` : '—')}</TableCell>
                      <TableCell>{gw.isDefault ? <Badge className="bg-[var(--gold)]/15 text-[#8a6f24] border-[var(--gold)]/30"><Star className="mr-1 h-3 w-3" />Default</Badge> : '—'}</TableCell>
                      <TableCell>
                        <Badge className={gw.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30' : 'bg-gray-500/10 text-gray-700 border-gray-500/30'}>{gw.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setEditing(gw)}><Pencil className="h-3.5 w-3.5" /></Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-600 hover:text-red-700" onClick={() => setDeleting(gw)}><Trash2 className="h-3.5 w-3.5" /></Button>
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
        <GwFormDialog gw={editing} onClose={() => { setCreating(false); setEditing(null) }} onSuccess={() => { setCreating(false); setEditing(null); load() }} />
      )}

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-700">Delete gateway?</AlertDialogTitle>
            <AlertDialogDescription>Permanently delete <strong>{deleting?.name}</strong>?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={async () => {
              if (!deleting) return
              try { await api('/api/admin/payment-gateways', { method: 'DELETE', body: JSON.stringify({ id: deleting.id }) }); toast.success('Deleted'); setDeleting(null); load() } catch (e: any) { toast.error(e.message) }
            }}><Trash2 className="mr-1 h-4 w-4" /> Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function GwFormDialog({ gw, onClose, onSuccess }: { gw: Gateway | null; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState(gw ? {
    name: gw.name, type: gw.type, apiKey: gw.apiKey || '', apiSecret: gw.apiSecret || '',
    merchantId: gw.merchantId || '', isDefault: gw.isDefault, upiId: gw.upiId || '',
    bankName: gw.bankName || '', bankAccount: gw.bankAccount || '', bankIfsc: gw.bankIfsc || '', status: gw.status,
  } : EMPTY)
  const [saving, setSaving] = useState(false)
  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }))

  const isUPI = form.type === 'upi'
  const isBank = form.type === 'bank_transfer'
  const isOnline = form.type === 'razorpay' || form.type === 'stripe'

  const submit = async () => {
    if (!form.name.trim()) { toast.error('Name is required'); return }
    setSaving(true)
    try {
      const payload = { ...form, name: form.name.trim() }
      if (gw) { await api('/api/admin/payment-gateways', { method: 'PATCH', body: JSON.stringify({ id: gw.id, ...payload }) }); toast.success('Updated') }
      else { await api('/api/admin/payment-gateways', { method: 'POST', body: JSON.stringify(payload) }); toast.success('Created') }
      onSuccess()
    } catch (e: any) { toast.error(e.message) } finally { setSaving(false) }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Wallet className="h-5 w-5" />{gw ? 'Edit Gateway' : 'New Gateway'}</DialogTitle>
          <DialogDescription>{gw ? 'Update payment gateway' : 'Add a new payment gateway'}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5"><Label>Name *</Label><Input value={form.name} onChange={(e) => set('name', e.target.value)} /></div>
            <div className="space-y-1.5">
              <Label>Type *</Label>
              <Select value={form.type} onValueChange={(v) => set('type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{TYPES.map(t => <SelectItem key={t} value={t}>{t.replace('_', ' ')}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          {isOnline && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5"><Label>API Key</Label><Input value={form.apiKey} onChange={(e) => set('apiKey', e.target.value)} /></div>
              <div className="space-y-1.5"><Label>API Secret</Label><Input type="password" value={form.apiSecret} onChange={(e) => set('apiSecret', e.target.value)} /></div>
            </div>
          )}
          {(isOnline || isUPI) && (
            <div className="space-y-1.5"><Label>Merchant ID</Label><Input value={form.merchantId} onChange={(e) => set('merchantId', e.target.value)} /></div>
          )}

          {isUPI && (
            <div className="space-y-1.5"><Label>UPI ID</Label><Input value={form.upiId} onChange={(e) => set('upiId', e.target.value)} placeholder="name@paytm" /></div>
          )}

          {isBank && (
            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-1.5"><Label>Bank Name</Label><Input value={form.bankName} onChange={(e) => set('bankName', e.target.value)} /></div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-1.5"><Label>Account Number</Label><Input value={form.bankAccount} onChange={(e) => set('bankAccount', e.target.value)} /></div>
                <div className="space-y-1.5"><Label>IFSC Code</Label><Input value={form.bankIfsc} onChange={(e) => set('bankIfsc', e.target.value)} /></div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="ACTIVE">Active</SelectItem><SelectItem value="INACTIVE">Inactive</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5 flex items-end pb-0.5"><div className="flex items-center gap-2"><Switch checked={form.isDefault} onCheckedChange={(v) => set('isDefault', v)} /><Label>Set as Default</Label></div></div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button className="bg-[var(--navy)] text-white hover:bg-[var(--navy-light)]" onClick={submit} disabled={saving}>{saving ? 'Saving...' : gw ? 'Update' : 'Create'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}