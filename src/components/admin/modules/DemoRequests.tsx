'use client'
import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { SectionTitle, EmptyState } from '@/components/shared'
import { toast } from 'sonner'
import { CalendarDays, ExternalLink, Mail, Phone, Building2, Eye, Trash2, Download, Filter } from 'lucide-react'
import { api } from '../lib'

interface Request {
  id: string
  companyName: string
  contactName: string
  email: string
  phone: string | null
  address: string | null
  plan: string
  employeeCount: string | null
  message: string | null
  status: string
  createdAt: string
  updatedAt: string
}

const STATUS_COLORS: Record<string, string> = {
  NEW: 'bg-blue-100 text-blue-700 border-blue-200',
  CONTACTED: 'bg-amber-100 text-amber-700 border-amber-200',
  CONVERTED: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  REJECTED: 'bg-red-100 text-red-700 border-red-200',
}

const TYPE_LABELS: Record<string, string> = {
  demo: 'Demo Request',
  subscription: 'Subscription',
  contact: 'Contact Message',
  newsletter: 'Newsletter',
}

export function DemoRequests({ refreshKey }: { refreshKey: number }) {
  const [list, setList] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Request | null>(null)
  const [statusUpdate, setStatusUpdate] = useState<Request | null>(null)
  const [newStatus, setNewStatus] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api<{ items: Request[] }>('/api/admin/subscription-requests')
      setList(data.items || [])
    } catch (e: any) { toast.error(e.message || 'Failed to load') } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load, refreshKey])

  const filtered = list.filter((r) => {
    if (filter !== 'ALL' && r.plan !== filter && r.status !== filter) return false
    if (search) {
      const s = search.toLowerCase()
      return r.companyName.toLowerCase().includes(s) ||
        r.contactName.toLowerCase().includes(s) ||
        r.email.toLowerCase().includes(s)
    }
    return true
  })

  const handleStatusUpdate = async () => {
    if (!statusUpdate || !newStatus) return
    try {
      await api('/api/admin/subscription-requests', {
        method: 'PATCH',
        body: JSON.stringify({ id: statusUpdate.id, status: newStatus }),
      })
      toast.success(`Status updated to ${newStatus}`)
      setStatusUpdate(null)
      setNewStatus('')
      load()
    } catch (e: any) { toast.error(e.message) }
  }

  const handleDelete = async (id: string) => {
    try {
      await api('/api/admin/subscription-requests', { method: 'DELETE', body: JSON.stringify({ id }) })
      toast.success('Deleted')
      load()
    } catch (e: any) { toast.error(e.message) }
  }

  const exportCSV = () => {
    const header = 'ID,Company,Contact,Email,Phone,Plan,Employees,Status,Date,Message'
    const rows = filtered.map(r => [
      r.id, r.companyName, r.contactName, r.email, r.phone || '',
      r.plan, r.employeeCount || '', r.status, r.createdAt, (r.message || '').replace(/,/g, ';')
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `demo-requests-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  return (
    <div className="space-y-5">
      <SectionTitle title="Demo & Subscription Requests" desc="Manage incoming demo requests, subscriptions, and contact messages"
        action={<div className="flex gap-2"><Button variant="outline" size="sm" onClick={exportCSV}><Download className="mr-2 h-4 w-4" />Export CSV</Button></div>} />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Input placeholder="Search by company, name, email..." value={search} onChange={(e) => setSearch(e.target.value)} className="h-9" />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[160px] h-9"><SelectValue placeholder="Filter" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Types</SelectItem>
            <SelectItem value="demo">Demo Requests</SelectItem>
            <SelectItem value="newsletter">Newsletter</SelectItem>
            <SelectItem value="subscription">Subscriptions</SelectItem>
            <SelectItem value="contact">Contact</SelectItem>
            <SelectItem value="NEW">Status: New</SelectItem>
            <SelectItem value="CONTACTED">Status: Contacted</SelectItem>
            <SelectItem value="CONVERTED">Status: Converted</SelectItem>
            <SelectItem value="REJECTED">Status: Rejected</SelectItem>
          </SelectContent>
        </Select>
        <Badge variant="outline" className="text-xs">{filtered.length} results</Badge>
      </div>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={CalendarDays} title="No requests found" desc="Incoming demo, subscription, and contact requests will appear here." />
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => (
            <Card key={r.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{r.companyName}</span>
                      <Badge variant="outline" className="text-[10px] px-1.5">{TYPE_LABELS[r.plan] || r.plan}</Badge>
                      <Badge className={STATUS_COLORS[r.status] || ''}>{r.status}</Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{r.contactName}</span>
                      <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{r.email}</span>
                      {r.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{r.phone}</span>}
                      {r.employeeCount && <span>Employees: {r.employeeCount}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setSelected(r)}><Eye className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => { setStatusUpdate(r); setNewStatus(r.status) }}><ExternalLink className="h-3.5 w-3.5" /></Button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-500" onClick={() => handleDelete(r.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-lg">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2"><CalendarDays className="h-5 w-5" />Request Details</DialogTitle>
                <DialogDescription>{selected.companyName} — {TYPE_LABELS[selected.plan] || selected.plan}</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div><p className="text-xs text-muted-foreground">Contact Person</p><p className="font-medium">{selected.contactName}</p></div>
                  <div><p className="text-xs text-muted-foreground">Email</p><p className="font-medium">{selected.email}</p></div>
                  <div><p className="text-xs text-muted-foreground">Phone</p><p className="font-medium">{selected.phone || '—'}</p></div>
                  <div><p className="text-xs text-muted-foreground">Plan / Type</p><p className="font-medium">{TYPE_LABELS[selected.plan] || selected.plan}</p></div>
                  {selected.employeeCount && <div><p className="text-xs text-muted-foreground">Employee Count</p><p className="font-medium">{selected.employeeCount}</p></div>}
                  <div><p className="text-xs text-muted-foreground">Status</p><Badge className={STATUS_COLORS[selected.status] || ''}>{selected.status}</Badge></div>
                </div>
                {selected.message && (
                  <div><p className="text-xs text-muted-foreground mb-1">Message / Details</p><pre className="text-xs bg-muted p-3 rounded-lg overflow-auto max-h-40 whitespace-pre-wrap font-sans">{selected.message}</pre></div>
                )}
                <p className="text-xs text-muted-foreground">Received: {new Date(selected.createdAt).toLocaleString()}</p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Status Update Dialog */}
      <Dialog open={!!statusUpdate} onOpenChange={(o) => !o && setStatusUpdate(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Update Status</DialogTitle>
            <DialogDescription>{statusUpdate?.companyName} — {statusUpdate?.contactName}</DialogDescription>
          </DialogHeader>
          <Select value={newStatus} onValueChange={setNewStatus}>
            <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="NEW">New</SelectItem>
              <SelectItem value="CONTACTED">Contacted</SelectItem>
              <SelectItem value="CONVERTED">Converted</SelectItem>
              <SelectItem value="REJECTED">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusUpdate(null)}>Cancel</Button>
            <Button className="bg-[var(--navy)] text-white" onClick={handleStatusUpdate}>Update</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
