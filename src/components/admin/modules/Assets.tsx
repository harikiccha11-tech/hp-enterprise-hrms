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
import { Package, Plus, Pencil, Trash2, Search, UserCheck, Undo2 } from 'lucide-react'
import { api } from '../lib'
import { formatINR } from '../lib'

interface CurrentAssignment {
  id: string
  employeeId: string
  assignedAt: string
  condition: string | null
}

interface Asset {
  id: string
  name: string
  category: string
  serialNumber: string | null
  make: string | null
  model: string | null
  purchaseDate: string | null
  purchaseCost: number | null
  currentValue: number | null
  warrantyExpiry: string | null
  status: string
  location: string | null
  notes: string | null
  currentAssignment: CurrentAssignment | null
  createdAt: string
}

interface Employee {
  id: string
  fullName: string
  employeeCode: string | null
}

const CATEGORIES = ['Laptop', 'Desktop', 'Phone', 'Vehicle', 'Equipment', 'Furniture', 'Other']
const STATUSES = ['AVAILABLE', 'ASSIGNED', 'IN_REPAIR', 'DISPOSED', 'LOST']
const EMPTY = {
  name: '', category: 'Laptop', serialNumber: '', make: '', model: '',
  purchaseDate: '', purchaseCost: '', currentValue: '', warrantyExpiry: '',
  status: 'AVAILABLE', location: '', notes: '',
}

function assetStatusColor(status: string) {
  const map: Record<string, string> = {
    AVAILABLE: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30',
    ASSIGNED: 'bg-sky-500/10 text-sky-700 border-sky-500/30',
    IN_REPAIR: 'bg-amber-500/10 text-amber-700 border-amber-500/30',
    DISPOSED: 'bg-gray-500/10 text-gray-700 border-gray-500/30',
    LOST: 'bg-red-500/10 text-red-700 border-red-500/30',
  }
  return map[status] || 'bg-gray-500/10 text-gray-700 border-gray-500/30'
}

export function Assets({ refreshKey }: { refreshKey: number }) {
  const [list, setList] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Asset | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<Asset | null>(null)
  const [assigning, setAssigning] = useState<Asset | null>(null)
  const [returning, setReturning] = useState<Asset | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)
      if (categoryFilter) params.set('category', categoryFilter)
      if (search) params.set('search', search)
      const qs = params.toString()
      const data = await api<{ assets: Asset[] }>(`/api/admin/assets${qs ? `?${qs}` : ''}`)
      setList(data.assets || [])
    } catch (e: any) {
      toast.error(e.message || 'Failed to load assets')
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, categoryFilter])

  useEffect(() => { load() }, [load, refreshKey])

  return (
    <div className="space-y-5">
      <SectionTitle
        title="Assets"
        desc="Manage organizational assets and inventory"
        action={
          <Button className="bg-[var(--navy)] text-white hover:bg-[var(--navy-light)]" onClick={() => setCreating(true)}>
            <Plus className="mr-2 h-4 w-4" /> New Asset
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
            <EmptyState icon={Package} title="No assets yet" desc="Register your first asset to start tracking inventory" />
          ) : (
            <>
              <div className="mb-4 flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Search assets..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Status</SelectItem>
                    {STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>)}
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
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Serial No.</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Assigned To</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {list.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell>
                          <div>
                            <span className="font-medium">{a.name}</span>
                            {(a.make || a.model) && <p className="text-xs text-muted-foreground">{[a.make, a.model].filter(Boolean).join(' ')}</p>}
                          </div>
                        </TableCell>
                        <TableCell><Badge variant="outline">{a.category}</Badge></TableCell>
                        <TableCell className="text-sm font-mono">{a.serialNumber || '—'}</TableCell>
                        <TableCell><Badge className={assetStatusColor(a.status)}>{a.status.replace('_', ' ')}</Badge></TableCell>
                        <TableCell className="text-sm">{a.location || '—'}</TableCell>
                        <TableCell className="text-sm">{a.currentAssignment ? `Employee` : '—'}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {a.status === 'AVAILABLE' && (
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-sky-600 hover:text-sky-700" onClick={() => setAssigning(a)} aria-label="Assign" title="Assign to employee">
                                <UserCheck className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            {a.status === 'ASSIGNED' && (
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-amber-600 hover:text-amber-700" onClick={() => setReturning(a)} aria-label="Return" title="Return asset">
                                <Undo2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setEditing(a)} aria-label="Edit">
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-600 hover:text-red-700" onClick={() => setDeleting(a)} aria-label="Delete">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {list.length === 0 && (
                      <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No assets match your filters</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {(creating || editing) && (
        <AssetFormDialog
          asset={editing}
          onClose={() => { setCreating(false); setEditing(null) }}
          onSuccess={() => { setCreating(false); setEditing(null); load() }}
        />
      )}

      {assigning && (
        <AssignDialog
          asset={assigning}
          onClose={() => setAssigning(null)}
          onSuccess={() => { setAssigning(null); load() }}
        />
      )}

      {returning && (
        <ReturnDialog
          asset={returning}
          onClose={() => setReturning(null)}
          onSuccess={() => { setReturning(null); load() }}
        />
      )}

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-700">Delete asset?</AlertDialogTitle>
            <AlertDialogDescription>
              Permanently delete <strong>{deleting?.name}</strong>? This will also remove all assignment records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700"
              onClick={async () => {
                if (!deleting) return
                try {
                  await api('/api/admin/assets', { method: 'DELETE', body: JSON.stringify({ id: deleting.id }) })
                  toast.success('Asset deleted')
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

function AssetFormDialog({ asset, onClose, onSuccess }: { asset: Asset | null; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState(asset ? {
    name: asset.name,
    category: asset.category,
    serialNumber: asset.serialNumber || '',
    make: asset.make || '',
    model: asset.model || '',
    purchaseDate: asset.purchaseDate ? asset.purchaseDate.slice(0, 10) : '',
    purchaseCost: asset.purchaseCost ? String(asset.purchaseCost) : '',
    currentValue: asset.currentValue ? String(asset.currentValue) : '',
    warrantyExpiry: asset.warrantyExpiry ? asset.warrantyExpiry.slice(0, 10) : '',
    status: asset.status,
    location: asset.location || '',
    notes: asset.notes || '',
  } : EMPTY)
  const [saving, setSaving] = useState(false)

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async () => {
    if (!form.name.trim()) { toast.error('Asset name is required'); return }
    if (!form.category.trim()) { toast.error('Category is required'); return }
    setSaving(true)
    try {
      if (asset) {
        await api('/api/admin/assets', { method: 'PATCH', body: JSON.stringify({ id: asset.id, ...form }) })
        toast.success('Asset updated')
      } else {
        await api('/api/admin/assets', { method: 'POST', body: JSON.stringify(form) })
        toast.success('Asset created')
      }
      onSuccess()
    } catch (e: any) { toast.error(e.message || 'Save failed') } finally { setSaving(false) }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" /> {asset ? 'Edit Asset' : 'New Asset'}
          </DialogTitle>
          <DialogDescription>{asset ? 'Update asset details' : 'Register a new asset'}</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2"><Label>Asset Name *</Label><Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. MacBook Pro 16" /></div>
          <div className="space-y-1.5">
            <Label>Category *</Label>
            <Select value={form.category} onValueChange={(v) => set('category', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Serial Number</Label><Input value={form.serialNumber} onChange={(e) => set('serialNumber', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Make</Label><Input value={form.make} onChange={(e) => set('make', e.target.value)} placeholder="e.g. Apple" /></div>
          <div className="space-y-1.5"><Label>Model</Label><Input value={form.model} onChange={(e) => set('model', e.target.value)} placeholder="e.g. M3 Pro" /></div>
          <div className="space-y-1.5"><Label>Purchase Date</Label><Input type="date" value={form.purchaseDate} onChange={(e) => set('purchaseDate', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Purchase Cost (₹)</Label><Input type="number" value={form.purchaseCost} onChange={(e) => set('purchaseCost', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Current Value (₹)</Label><Input type="number" value={form.currentValue} onChange={(e) => set('currentValue', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Warranty Expiry</Label><Input type="date" value={form.warrantyExpiry} onChange={(e) => set('warrantyExpiry', e.target.value)} /></div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => set('status', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Location</Label><Input value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="e.g. Bangalore Office" /></div>
          <div className="space-y-1.5 sm:col-span-2"><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={2} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button className="bg-[var(--navy)] text-white hover:bg-[var(--navy-light)]" onClick={submit} disabled={saving}>
            {saving ? 'Saving...' : asset ? 'Update' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function AssignDialog({ asset, onClose, onSuccess }: { asset: Asset; onClose: () => void; onSuccess: () => void }) {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [employeeId, setEmployeeId] = useState('')
  const [condition, setCondition] = useState('Good')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api<{ employees: Employee[] }>('/api/admin/employees?status=APPROVED&limit=100').then((d) => {
      setEmployees(d.employees || [])
    }).catch(() => {})
  }, [])

  const submit = async () => {
    if (!employeeId) { toast.error('Please select an employee'); return }
    setSaving(true)
    try {
      await api('/api/admin/assets', {
        method: 'POST',
        body: JSON.stringify({ action: 'assign', assetId: asset.id, employeeId, condition, notes }),
      })
      toast.success('Asset assigned successfully')
      onSuccess()
    } catch (e: any) { toast.error(e.message || 'Assignment failed') } finally { setSaving(false) }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" /> Assign Asset
          </DialogTitle>
          <DialogDescription>Assign <strong>{asset.name}</strong> to an employee</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Employee *</Label>
            <Select value={employeeId} onValueChange={setEmployeeId}>
              <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
              <SelectContent className="max-h-60">
                {employees.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.fullName}{e.employeeCode ? ` (${e.employeeCode})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Condition</Label>
            <Select value={condition} onValueChange={setCondition}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Good">Good</SelectItem>
                <SelectItem value="Fair">Fair</SelectItem>
                <SelectItem value="Damaged">Damaged</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Notes</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button className="bg-[var(--navy)] text-white hover:bg-[var(--navy-light)]" onClick={submit} disabled={saving}>
            {saving ? 'Assigning...' : 'Assign'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ReturnDialog({ asset, onClose, onSuccess }: { asset: Asset; onClose: () => void; onSuccess: () => void }) {
  const [condition, setCondition] = useState('Good')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    setSaving(true)
    try {
      await api('/api/admin/assets', {
        method: 'POST',
        body: JSON.stringify({ action: 'return', assetId: asset.id, condition, notes }),
      })
      toast.success('Asset returned successfully')
      onSuccess()
    } catch (e: any) { toast.error(e.message || 'Return failed') } finally { setSaving(false) }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Undo2 className="h-5 w-5" /> Return Asset
          </DialogTitle>
          <DialogDescription>Mark <strong>{asset.name}</strong> as returned</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Return Condition</Label>
            <Select value={condition} onValueChange={setCondition}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Good">Good</SelectItem>
                <SelectItem value="Fair">Fair</SelectItem>
                <SelectItem value="Damaged">Damaged</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5"><Label>Notes</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button className="bg-[var(--navy)] text-white hover:bg-[var(--navy-light)]" onClick={submit} disabled={saving}>
            {saving ? 'Processing...' : 'Return Asset'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}