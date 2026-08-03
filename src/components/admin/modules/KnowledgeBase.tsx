'use client'
import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { BookOpen, Plus, Pencil, Trash2, Search } from 'lucide-react'
import { api } from '../lib'

interface KBItem {
  id: string; category: string; question: string; answer: string
  tags: string | null; keywords: string | null; enabled: boolean; sortOrder: number; createdAt: string
}

const EMPTY = { category: '', question: '', answer: '', tags: '', keywords: '', enabled: true, sortOrder: 0 }

const CATEGORIES = ['HR Policy', 'Leave Policy', 'Payroll', 'Benefits', 'IT', 'General', 'Onboarding', 'Offboarding', 'Compliance']

export function KnowledgeBase({ refreshKey }: { refreshKey: number }) {
  const [list, setList] = useState<KBItem[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<KBItem | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<KBItem | null>(null)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (catFilter) params.set('category', catFilter)
      if (search) params.set('search', search)
      const qs = params.toString()
      const data = await api<{ items: KBItem[] }>(`/api/admin/knowledge-base${qs ? '?' + qs : ''}`)
      setList(data.items || [])
    } catch (e: any) { toast.error(e.message || 'Failed to load') } finally { setLoading(false) }
  }, [catFilter, search])

  useEffect(() => { load() }, [load, refreshKey])

  const toggleEnabled = async (item: KBItem) => {
    try {
      await api('/api/admin/knowledge-base', { method: 'PATCH', body: JSON.stringify({ id: item.id, enabled: !item.enabled }) })
      toast.success(item.enabled ? 'Disabled' : 'Enabled')
      load()
    } catch (e: any) { toast.error(e.message || 'Failed') }
  }

  return (
    <div className="space-y-5">
      <SectionTitle title="Knowledge Base" desc="Manage FAQ and knowledge base articles" action={
        <Button className="bg-[var(--navy)] text-white hover:bg-[var(--navy-light)]" onClick={() => setCreating(true)}><Plus className="mr-2 h-4 w-4" /> New Entry</Button>
      } />

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : list.length === 0 ? (
            <EmptyState icon={BookOpen} title="No knowledge base entries" desc="Create FAQ entries to power your AI assistant" />
          ) : (
            <>
              <div className="mb-4 flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Search questions, answers, tags..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
                </div>
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
                      <TableHead>Category</TableHead>
                      <TableHead>Question</TableHead>
                      <TableHead>Answer</TableHead>
                      <TableHead>Tags</TableHead>
                      <TableHead>Enabled</TableHead>
                      <TableHead>Order</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {list.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell><Badge variant="outline">{item.category}</Badge></TableCell>
                        <TableCell className="font-medium max-w-[200px] truncate">{item.question}</TableCell>
                        <TableCell className="max-w-[200px] truncate text-muted-foreground">{item.answer}</TableCell>
                        <TableCell>{item.tags ? item.tags.split(',').slice(0, 2).map(t => <Badge key={t} variant="secondary" className="mr-1 mb-0.5 text-xs">{t.trim()}</Badge>) : '—'}</TableCell>
                        <TableCell><Switch checked={item.enabled} onCheckedChange={() => toggleEnabled(item)} /></TableCell>
                        <TableCell>{item.sortOrder}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setEditing(item)}><Pencil className="h-3.5 w-3.5" /></Button>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-600 hover:text-red-700" onClick={() => setDeleting(item)}><Trash2 className="h-3.5 w-3.5" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {list.length === 0 && (
                      <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No entries match your search</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {(creating || editing) && (
        <KBFormDialog item={editing} onClose={() => { setCreating(false); setEditing(null) }} onSuccess={() => { setCreating(false); setEditing(null); load() }} />
      )}

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-700">Delete entry?</AlertDialogTitle>
            <AlertDialogDescription>Permanently delete <strong>{deleting?.question}</strong>? This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={async () => {
              if (!deleting) return
              try { await api('/api/admin/knowledge-base', { method: 'DELETE', body: JSON.stringify({ id: deleting.id }) }); toast.success('Deleted'); setDeleting(null); load() } catch (e: any) { toast.error(e.message) }
            }}><Trash2 className="mr-1 h-4 w-4" /> Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function KBFormDialog({ item, onClose, onSuccess }: { item: KBItem | null; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState(item ? { category: item.category, question: item.question, answer: item.answer, tags: item.tags || '', keywords: item.keywords || '', enabled: item.enabled, sortOrder: item.sortOrder } : EMPTY)
  const [saving, setSaving] = useState(false)
  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async () => {
    if (!form.category.trim()) { toast.error('Category is required'); return }
    if (!form.question.trim()) { toast.error('Question is required'); return }
    if (!form.answer.trim()) { toast.error('Answer is required'); return }
    setSaving(true)
    try {
      if (item) { await api('/api/admin/knowledge-base', { method: 'PATCH', body: JSON.stringify({ id: item.id, ...form }) }); toast.success('Updated') }
      else { await api('/api/admin/knowledge-base', { method: 'POST', body: JSON.stringify(form) }); toast.success('Created') }
      onSuccess()
    } catch (e: any) { toast.error(e.message) } finally { setSaving(false) }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5" />{item ? 'Edit Entry' : 'New Entry'}</DialogTitle>
          <DialogDescription>{item ? 'Update knowledge base entry' : 'Create a new FAQ entry'}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Category *</Label>
              <Select value={form.category} onValueChange={(v) => set('category', v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Sort Order</Label>
              <Input type="number" value={form.sortOrder} onChange={(e) => set('sortOrder', Number(e.target.value))} />
            </div>
            <div className="space-y-1.5 flex items-end pb-0.5">
              <div className="flex items-center gap-2"><Switch checked={form.enabled} onCheckedChange={(v) => set('enabled', v)} /><Label>Enabled</Label></div>
            </div>
          </div>
          <div className="space-y-1.5"><Label>Question *</Label><Textarea value={form.question} onChange={(e) => set('question', e.target.value)} rows={2} /></div>
          <div className="space-y-1.5"><Label>Answer *</Label><Textarea value={form.answer} onChange={(e) => set('answer', e.target.value)} rows={5} /></div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5"><Label>Tags (comma-separated)</Label><Input value={form.tags} onChange={(e) => set('tags', e.target.value)} placeholder="leave, policy, hr" /></div>
            <div className="space-y-1.5"><Label>Keywords (comma-separated)</Label><Input value={form.keywords} onChange={(e) => set('keywords', e.target.value)} placeholder="leave balance, casual leave" /></div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button className="bg-[var(--navy)] text-white hover:bg-[var(--navy-light)]" onClick={submit} disabled={saving}>{saving ? 'Saving...' : item ? 'Update' : 'Create'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}