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
import { Mail, Plus, Pencil, Trash2, Search } from 'lucide-react'
import { api } from '../lib'

interface TplItem {
  id: string; name: string; subject: string; body: string; variables: string | null
  category: string | null; status: string; createdAt: string
}

const EMPTY = { name: '', subject: '', body: '', variables: '', category: '', status: 'ACTIVE' }

const CATEGORIES = ['onboarding', 'leave', 'payroll', 'general', 'attendance', 'document', 'announcement']

const catColor: Record<string, string> = {
  onboarding: 'bg-sky-500/10 text-sky-700 border-sky-500/30',
  leave: 'bg-violet-500/10 text-violet-700 border-violet-500/30',
  payroll: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30',
  attendance: 'bg-amber-500/10 text-amber-700 border-amber-500/30',
  document: 'bg-pink-500/10 text-pink-700 border-pink-500/30',
  announcement: 'bg-orange-500/10 text-orange-700 border-orange-500/30',
  general: 'bg-gray-500/10 text-gray-700 border-gray-500/30',
}

export function EmailTemplates({ refreshKey }: { refreshKey: number }) {
  const [list, setList] = useState<TplItem[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<TplItem | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<TplItem | null>(null)
  const [catFilter, setCatFilter] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (catFilter) params.set('category', catFilter)
      const qs = params.toString()
      const data = await api<{ items: TplItem[] }>(`/api/admin/email-templates${qs ? '?' + qs : ''}`)
      setList(data.items || [])
    } catch (e: any) { toast.error(e.message || 'Failed to load') } finally { setLoading(false) }
  }, [catFilter])

  useEffect(() => { load() }, [load, refreshKey])

  return (
    <div className="space-y-5">
      <SectionTitle title="Email Templates" desc="Manage email notification templates" action={
        <Button className="bg-[var(--navy)] text-white hover:bg-[var(--navy-light)]" onClick={() => setCreating(true)}><Plus className="mr-2 h-4 w-4" /> New Template</Button>
      } />

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : list.length === 0 ? (
            <EmptyState icon={Mail} title="No email templates" desc="Create your first email template" />
          ) : (
            <>
              <div className="mb-4 flex flex-wrap gap-3">
                <Select value={catFilter} onValueChange={setCatFilter}>
                  <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Categories" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Categories</SelectItem>
                    {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {list.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="max-w-[250px] truncate text-muted-foreground">{item.subject}</TableCell>
                        <TableCell>
                          <Badge className={catColor[item.category || ''] || catColor.general}>{item.category || 'general'}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={item.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30' : 'bg-gray-500/10 text-gray-700 border-gray-500/30'}>{item.status}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setEditing(item)}><Pencil className="h-3.5 w-3.5" /></Button>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-600 hover:text-red-700" onClick={() => setDeleting(item)}><Trash2 className="h-3.5 w-3.5" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {list.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No templates match filter</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {(creating || editing) && (
        <TplFormDialog item={editing} onClose={() => { setCreating(false); setEditing(null) }} onSuccess={() => { setCreating(false); setEditing(null); load() }} />
      )}

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-700">Delete template?</AlertDialogTitle>
            <AlertDialogDescription>Permanently delete <strong>{deleting?.name}</strong>?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={async () => {
              if (!deleting) return
              try { await api('/api/admin/email-templates', { method: 'DELETE', body: JSON.stringify({ id: deleting.id }) }); toast.success('Deleted'); setDeleting(null); load() } catch (e: any) { toast.error(e.message) }
            }}><Trash2 className="mr-1 h-4 w-4" /> Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function TplFormDialog({ item, onClose, onSuccess }: { item: TplItem | null; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState(item ? { name: item.name, subject: item.subject, body: item.body, variables: item.variables || '', category: item.category || '', status: item.status } : EMPTY)
  const [saving, setSaving] = useState(false)
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async () => {
    if (!form.name.trim()) { toast.error('Name is required'); return }
    if (!form.subject.trim()) { toast.error('Subject is required'); return }
    if (!form.body.trim()) { toast.error('Body is required'); return }
    setSaving(true)
    try {
      if (item) { await api('/api/admin/email-templates', { method: 'PATCH', body: JSON.stringify({ id: item.id, ...form }) }); toast.success('Updated') }
      else { await api('/api/admin/email-templates', { method: 'POST', body: JSON.stringify(form) }); toast.success('Created') }
      onSuccess()
    } catch (e: any) { toast.error(e.message) } finally { setSaving(false) }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Mail className="h-5 w-5" />{item ? 'Edit Template' : 'New Template'}</DialogTitle>
          <DialogDescription>{item ? 'Update email template' : 'Create a new email template'}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5"><Label>Name *</Label><Input value={form.name} onChange={(e) => set('name', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Subject *</Label><Input value={form.subject} onChange={(e) => set('subject', e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={form.category} onValueChange={(v) => set('category', v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="ACTIVE">Active</SelectItem><SelectItem value="INACTIVE">Inactive</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Variables (JSON)</Label><Input value={form.variables} onChange={(e) => set('variables', e.target.value)} placeholder='["name","date"]' /></div>
          </div>
          <div className="space-y-1.5"><Label>HTML Body *</Label><Textarea value={form.body} onChange={(e) => set('body', e.target.value)} rows={10} className="font-mono text-sm" /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button className="bg-[var(--navy)] text-white hover:bg-[var(--navy-light)]" onClick={submit} disabled={saving}>{saving ? 'Saving...' : item ? 'Update' : 'Create'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}