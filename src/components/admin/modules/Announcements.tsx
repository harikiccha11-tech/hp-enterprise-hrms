'use client'
import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
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
import { SectionTitle, EmptyState } from '@/components/shared'
import { toast } from 'sonner'
import { Megaphone, Send, Users, User, Shield, Pencil, Trash2 } from 'lucide-react'
import { useAuth } from '@/lib/store'
import { api, fmtDateTime } from '../lib'

interface Announcement {
  id: string
  title: string
  body: string
  audience: string
  postedAt: string
}

const AUDIENCE_OPTIONS = [
  { value: 'ALL', label: 'Everyone (All users)', icon: Users },
  { value: 'EMPLOYEE', label: 'Employees only', icon: User },
  { value: 'ADMIN', label: 'Admins only', icon: Shield },
]

export function Announcements({ refreshKey }: { refreshKey: number }) {
  const { user } = useAuth()
  const isSuperAdmin = user?.role === 'OWNER' || user?.role === 'SUPER_ADMIN'
  const [list, setList] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ title: '', body: '', audience: 'ALL' })
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState<Announcement | null>(null)
  const [deleting, setDeleting] = useState<Announcement | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api<{ announcements: Announcement[] }>('/api/admin/announcements')
      setList(data.announcements || [])
    } catch (e: any) {
      toast.error(e.message || 'Failed to load announcements')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load, refreshKey])

  const submit = async () => {
    if (!form.title.trim() || !form.body.trim()) { toast.error('Title and body are required'); return }
    setSaving(true)
    try {
      await api('/api/admin/announcements', {
        method: 'POST',
        body: JSON.stringify(form),
      })
      toast.success('Announcement posted & notifications sent')
      setForm({ title: '', body: '', audience: 'ALL' })
      load()
    } catch (e: any) {
      toast.error(e.message || 'Post failed')
    } finally { setSaving(false) }
  }

  const audienceBadge = (a: string) => {
    const opt = AUDIENCE_OPTIONS.find((o) => o.value === a)
    const Icon = opt?.icon || Users
    const colors: Record<string, string> = {
      ALL: 'border-[var(--gold)]/40 text-[#8a6f24] bg-[var(--gold)]/5',
      EMPLOYEE: 'border-sky-500/30 text-sky-700 bg-sky-500/5',
      ADMIN: 'border-[var(--navy)]/30 text-[var(--navy)] dark:text-white bg-[var(--navy)]/5',
    }
    return (
      <Badge variant="outline" className={`gap-1 ${colors[a] || ''}`}>
        <Icon className="h-3 w-3" /> {opt?.label || a}
      </Badge>
    )
  }

  return (
    <div className="space-y-5">
      <SectionTitle title="Announcements" desc="Post company-wide announcements & notify users" />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Compose */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-[var(--gold)]" /> New Announcement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="an-title">Title *</Label>
                <Input
                  id="an-title"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Holiday on 15 August"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="an-body">Message *</Label>
                <Textarea
                  id="an-body"
                  value={form.body}
                  onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
                  rows={5}
                  placeholder="Write the announcement body…"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Audience</Label>
                <Select value={form.audience} onValueChange={(v) => setForm((f) => ({ ...f, audience: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {AUDIENCE_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        <span className="flex items-center gap-2"><o.icon className="h-3.5 w-3.5" /> {o.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                className="w-full bg-[var(--navy)] text-white hover:bg-[var(--navy-light)]"
                onClick={submit}
                disabled={saving}
              >
                {saving ? <><Send className="mr-2 h-4 w-4 animate-pulse" /> Posting…</> : <><Send className="mr-2 h-4 w-4" /> Post & Notify</>}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Existing announcements */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent Announcements</CardTitle>
            <p className="text-xs text-muted-foreground">{list.length} announcement{list.length !== 1 ? 's' : ''} posted</p>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
              </div>
            ) : list.length === 0 ? (
              <EmptyState icon={Megaphone} title="No announcements yet" desc="Post your first announcement using the form on the left" />
            ) : (
              <div className="max-h-[60vh] space-y-3 overflow-y-auto scroll-thin pr-1">
                {list.map((a) => (
                  <div key={a.id} className="rounded-lg border p-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-bold text-[var(--navy)] dark:text-white">{a.title}</h4>
                        <p className="mt-1 text-sm text-muted-foreground whitespace-pre-wrap">{a.body}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" title="Edit announcement"
                          onClick={() => setEditing(a)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        {isSuperAdmin && (
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50" title="Delete announcement"
                            onClick={() => setDeleting(a)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t pt-2">
                      {audienceBadge(a.audience)}
                      <p className="text-[11px] text-muted-foreground">{fmtDateTime(a.postedAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {editing && (
        <EditAnnouncementDialog
          announcement={editing}
          onClose={() => setEditing(null)}
          onSuccess={() => { setEditing(null); load() }}
        />
      )}

      {/* Delete confirmation */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-700">Delete announcement?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the announcement <strong>"{deleting?.title}"</strong>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={async () => {
                if (!deleting) return
                try {
                  await api('/api/admin/announcements', { method: 'DELETE', body: JSON.stringify({ id: deleting.id }) })
                  toast.success('Announcement deleted')
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

function EditAnnouncementDialog({ announcement, onClose, onSuccess }: {
  announcement: Announcement
  onClose: () => void
  onSuccess: () => void
}) {
  const [form, setForm] = useState({ title: announcement.title, body: announcement.body, audience: announcement.audience })
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    if (!form.title.trim() || !form.body.trim()) { toast.error('Title and body are required'); return }
    setSaving(true)
    try {
      await api('/api/admin/announcements', {
        method: 'PATCH',
        body: JSON.stringify({ id: announcement.id, ...form }),
      })
      toast.success('Announcement updated')
      onSuccess()
    } catch (e: any) {
      toast.error(e.message || 'Update failed')
    } finally { setSaving(false) }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Pencil className="h-5 w-5" /> Edit Announcement</DialogTitle>
          <DialogDescription>Update the announcement content and audience</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Title *</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Message *</Label>
            <Textarea
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              rows={5}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Audience</Label>
            <Select value={form.audience} onValueChange={(v) => setForm((f) => ({ ...f, audience: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {AUDIENCE_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    <span className="flex items-center gap-2"><o.icon className="h-3.5 w-3.5" /> {o.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
