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
import { ToggleLeft, Plus, Pencil, Trash2 } from 'lucide-react'
import { api } from '../lib'
import { fmtDate } from '../lib'

interface Flag {
  id: string; key: string; name: string; description: string | null
  enabled: boolean; environments: string | null; createdAt: string
}

const EMPTY = { key: '', name: '', description: '', enabled: false, environments: '' }

export function FeatureFlags({ refreshKey }: { refreshKey: number }) {
  const [list, setList] = useState<Flag[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Flag | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<Flag | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api<{ items: Flag[] }>('/api/admin/feature-flags')
      setList(data.items || [])
    } catch (e: any) { toast.error(e.message || 'Failed to load') } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load, refreshKey])

  const toggleEnabled = async (flag: Flag) => {
    try {
      await api('/api/admin/feature-flags', { method: 'PATCH', body: JSON.stringify({ id: flag.id, enabled: !flag.enabled }) })
      toast.success(flag.enabled ? 'Flag disabled' : 'Flag enabled')
      load()
    } catch (e: any) { toast.error(e.message) }
  }

  return (
    <div className="space-y-5">
      <SectionTitle title="Feature Flags" desc="Manage feature toggles and rollouts" action={
        <Button className="bg-[var(--navy)] text-white hover:bg-[var(--navy-light)]" onClick={() => setCreating(true)}><Plus className="mr-2 h-4 w-4" /> New Flag</Button>
      } />

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : list.length === 0 ? (
            <EmptyState icon={ToggleLeft} title="No feature flags" desc="Create your first feature flag" />
          ) : (
            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Key</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Enabled</TableHead>
                    <TableHead>Environments</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.map((flag) => {
                    const envs: string[] = flag.environments ? JSON.parse(flag.environments) : []
                    return (
                      <TableRow key={flag.id}>
                        <TableCell className="font-medium">{flag.name}</TableCell>
                        <TableCell><code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">{flag.key}</code></TableCell>
                        <TableCell className="max-w-[200px] truncate text-muted-foreground">{flag.description || '—'}</TableCell>
                        <TableCell><Switch checked={flag.enabled} onCheckedChange={() => toggleEnabled(flag)} /></TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">{envs.map(e => <Badge key={e} variant="outline" className="text-xs">{e}</Badge>)}</div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{fmtDate(flag.createdAt)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setEditing(flag)}><Pencil className="h-3.5 w-3.5" /></Button>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-600 hover:text-red-700" onClick={() => setDeleting(flag)}><Trash2 className="h-3.5 w-3.5" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {(creating || editing) && (
        <FlagFormDialog flag={editing} onClose={() => { setCreating(false); setEditing(null) }} onSuccess={() => { setCreating(false); setEditing(null); load() }} />
      )}

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-700">Delete flag?</AlertDialogTitle>
            <AlertDialogDescription>Permanently delete <strong>{deleting?.name}</strong>?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={async () => {
              if (!deleting) return
              try { await api('/api/admin/feature-flags', { method: 'DELETE', body: JSON.stringify({ id: deleting.id }) }); toast.success('Deleted'); setDeleting(null); load() } catch (e: any) { toast.error(e.message) }
            }}><Trash2 className="mr-1 h-4 w-4" /> Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function FlagFormDialog({ flag, onClose, onSuccess }: { flag: Flag | null; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState(flag ? { key: flag.key, name: flag.name, description: flag.description || '', enabled: flag.enabled, environments: flag.environments || '' } : EMPTY)
  const [saving, setSaving] = useState(false)
  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async () => {
    if (!form.key.trim()) { toast.error('Key is required'); return }
    if (!form.name.trim()) { toast.error('Name is required'); return }
    setSaving(true)
    try {
      const payload = { ...form, key: form.key.trim(), name: form.name.trim() }
      if (flag) { await api('/api/admin/feature-flags', { method: 'PATCH', body: JSON.stringify({ id: flag.id, ...payload }) }); toast.success('Updated') }
      else { await api('/api/admin/feature-flags', { method: 'POST', body: JSON.stringify(payload) }); toast.success('Created') }
      onSuccess()
    } catch (e: any) { toast.error(e.message) } finally { setSaving(false) }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><ToggleLeft className="h-5 w-5" />{flag ? 'Edit Flag' : 'New Flag'}</DialogTitle>
          <DialogDescription>{flag ? 'Update feature flag' : 'Create a new feature flag'}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="space-y-1.5"><Label>Key *</Label><Input value={form.key} onChange={(e) => set('key', e.target.value)} placeholder="e.g. new_dashboard" className="font-mono" disabled={!!flag} /></div>
          <div className="space-y-1.5"><Label>Name *</Label><Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. New Dashboard" /></div>
          <div className="space-y-1.5"><Label>Description</Label><Textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={2} /></div>
          <div className="space-y-1.5">
            <Label>Environments (comma-separated)</Label>
            <Input value={form.environments} onChange={(e) => set('environments', e.target.value)} placeholder="production, staging, development" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button className="bg-[var(--navy)] text-white hover:bg-[var(--navy-light)]" onClick={submit} disabled={saving}>{saving ? 'Saving...' : flag ? 'Update' : 'Create'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}