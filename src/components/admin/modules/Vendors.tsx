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
import { Truck, Plus, Pencil, Trash2, Search, Star, Mail, Phone } from 'lucide-react'
import { api } from '../lib'

interface Vendor {
  id: string
  vendorName: string
  companyName: string | null
  gst: string | null
  email: string | null
  phone: string | null
  address: string | null
  category: string | null
  pan: string | null
  bankName: string | null
  bankAccount: string | null
  bankIfsc: string | null
  rating: number | null
  status: string
  createdAt: string
}

const CATEGORIES = ['Equipment', 'Material', 'Service', 'Contractor', 'Consultant']
const EMPTY = {
  vendorName: '', companyName: '', gst: '', email: '', phone: '', address: '',
  category: '', pan: '', bankName: '', bankAccount: '', bankIfsc: '', rating: '', status: 'ACTIVE',
}

function RatingStars({ rating }: { rating: number | null }) {
  if (!rating) return <span className="text-muted-foreground">—</span>
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`h-3.5 w-3.5 ${s <= rating ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`} />
      ))}
      <span className="ml-1 text-xs text-muted-foreground">{rating}</span>
    </div>
  )
}

function statusColor(status: string) {
  if (status === 'ACTIVE') return 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30'
  if (status === 'BLACKLISTED') return 'bg-red-500/10 text-red-700 border-red-500/30'
  return 'bg-gray-500/10 text-gray-700 border-gray-500/30'
}

export function Vendors({ refreshKey, canDelete }: { refreshKey: number; canDelete: boolean }) {
  const [list, setList] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Vendor | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<Vendor | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (statusFilter) params.set('status', statusFilter)
      if (categoryFilter) params.set('category', categoryFilter)
      const qs = params.toString()
      const data = await api<{ vendors: Vendor[] }>(`/api/admin/vendors${qs ? `?${qs}` : ''}`)
      setList(data.vendors || [])
    } catch (e: any) {
      toast.error(e.message || 'Failed to load vendors')
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, categoryFilter])

  useEffect(() => { load() }, [load, refreshKey])

  return (
    <div className="space-y-5">
      <SectionTitle
        title="Vendors"
        desc="Manage vendor and supplier records"
        action={
          <Button className="bg-[var(--navy)] text-white hover:bg-[var(--navy-light)]" onClick={() => setCreating(true)}>
            <Plus className="mr-2 h-4 w-4" /> New Vendor
          </Button>
        }
      />

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : list.length === 0 && !search && !statusFilter && !categoryFilter ? (
            <EmptyState icon={Truck} title="No vendors yet" desc="Create your first vendor to track suppliers" />
          ) : (
            <>
              <div className="mb-4 flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Search vendors..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Status</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                    <SelectItem value="BLACKLISTED">Blacklisted</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Categories</SelectItem>
                    {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>GST</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {list.map((v) => (
                      <TableRow key={v.id}>
                        <TableCell>
                          <div>
                            <span className="font-medium">{v.vendorName}</span>
                            {v.companyName && <p className="text-xs text-muted-foreground">{v.companyName}</p>}
                          </div>
                        </TableCell>
                        <TableCell>{v.category ? <Badge variant="outline">{v.category}</Badge> : '—'}</TableCell>
                        <TableCell className="text-sm font-mono">{v.gst || '—'}</TableCell>
                        <TableCell>
                          <div>
                            {v.phone && <p className="text-xs flex items-center gap-1"><Phone className="h-3 w-3" /> {v.phone}</p>}
                            {v.email && <p className="text-xs flex items-center gap-1"><Mail className="h-3 w-3" /> {v.email}</p>}
                            {!v.phone && !v.email && <span className="text-muted-foreground">—</span>}
                          </div>
                        </TableCell>
                        <TableCell><RatingStars rating={v.rating} /></TableCell>
                        <TableCell>
                          <Badge className={statusColor(v.status)}>{v.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setEditing(v)} aria-label="Edit">
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            {canDelete && (
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-600 hover:text-red-700" onClick={() => setDeleting(v)} aria-label="Delete">
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {list.length === 0 && (
                      <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No vendors match your filters</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {(creating || editing) && (
        <VendorFormDialog
          vendor={editing}
          onClose={() => { setCreating(false); setEditing(null) }}
          onSuccess={() => { setCreating(false); setEditing(null); load() }}
        />
      )}

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-700">Delete vendor?</AlertDialogTitle>
            <AlertDialogDescription>
              Permanently delete <strong>{deleting?.vendorName}</strong>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700"
              onClick={async () => {
                if (!deleting) return
                try {
                  await api('/api/admin/vendors', { method: 'DELETE', body: JSON.stringify({ id: deleting.id }) })
                  toast.success('Vendor deleted')
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

function VendorFormDialog({ vendor, onClose, onSuccess }: { vendor: Vendor | null; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState(vendor ? {
    vendorName: vendor.vendorName,
    companyName: vendor.companyName || '',
    gst: vendor.gst || '',
    email: vendor.email || '',
    phone: vendor.phone || '',
    address: vendor.address || '',
    category: vendor.category || '',
    pan: vendor.pan || '',
    bankName: vendor.bankName || '',
    bankAccount: vendor.bankAccount || '',
    bankIfsc: vendor.bankIfsc || '',
    rating: vendor.rating ? String(vendor.rating) : '',
    status: vendor.status,
  } : EMPTY)
  const [saving, setSaving] = useState(false)

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async () => {
    if (!form.vendorName.trim()) { toast.error('Vendor name is required'); return }
    setSaving(true)
    try {
      if (vendor) {
        await api('/api/admin/vendors', { method: 'PATCH', body: JSON.stringify({ id: vendor.id, ...form }) })
        toast.success('Vendor updated')
      } else {
        await api('/api/admin/vendors', { method: 'POST', body: JSON.stringify(form) })
        toast.success('Vendor created')
      }
      onSuccess()
    } catch (e: any) { toast.error(e.message || 'Save failed') } finally { setSaving(false) }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" /> {vendor ? 'Edit Vendor' : 'New Vendor'}
          </DialogTitle>
          <DialogDescription>{vendor ? 'Update vendor details' : 'Register a new vendor or supplier'}</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2"><Label>Vendor Name *</Label><Input value={form.vendorName} onChange={(e) => set('vendorName', e.target.value)} placeholder="e.g. Acme Supplies" /></div>
          <div className="space-y-1.5"><Label>Company Name</Label><Input value={form.companyName} onChange={(e) => set('companyName', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>GST</Label><Input value={form.gst} onChange={(e) => set('gst', e.target.value)} placeholder="29ANZPH4067Q1ZS" /></div>
          <div className="space-y-1.5"><Label>PAN</Label><Input value={form.pan} onChange={(e) => set('pan', e.target.value)} /></div>
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={form.category} onValueChange={(v) => set('category', v)}>
              <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Phone</Label><Input value={form.phone} onChange={(e) => set('phone', e.target.value)} /></div>
          <div className="space-y-1.5 sm:col-span-2"><Label>Address</Label><Textarea value={form.address} onChange={(e) => set('address', e.target.value)} rows={2} /></div>
          <div className="space-y-1.5"><Label>Bank Name</Label><Input value={form.bankName} onChange={(e) => set('bankName', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Bank Account</Label><Input value={form.bankAccount} onChange={(e) => set('bankAccount', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Bank IFSC</Label><Input value={form.bankIfsc} onChange={(e) => set('bankIfsc', e.target.value)} /></div>
          <div className="space-y-1.5">
            <Label>Rating (1-5)</Label>
            <Select value={form.rating} onValueChange={(v) => set('rating', v)}>
              <SelectTrigger><SelectValue placeholder="Select rating" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">No Rating</SelectItem>
                {[1, 2, 3, 4, 5].map((r) => <SelectItem key={r} value={String(r)}>{r} Star{r > 1 ? 's' : ''}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => set('status', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
                <SelectItem value="BLACKLISTED">Blacklisted</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button className="bg-[var(--navy)] text-white hover:bg-[var(--navy-light)]" onClick={submit} disabled={saving}>
            {saving ? 'Saving...' : vendor ? 'Update' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}