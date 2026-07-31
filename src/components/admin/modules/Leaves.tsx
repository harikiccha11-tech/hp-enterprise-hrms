'use client'
import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Tabs, TabsList, TabsTrigger,
} from '@/components/ui/tabs'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { SectionTitle, StatusBadge, EmptyState } from '@/components/shared'
import { toast } from 'sonner'
import { CalendarDays, Check, X, MessageSquare } from 'lucide-react'
import { api, fmtDate, initials, leaveTypeLabel } from '../lib'

interface LeaveRow {
  id: string
  leaveType: string
  fromDate: string
  toDate: string
  days: number
  reason: string
  status: string
  appliedAt: string
  comments: string | null
  employee: { id: string; fullName: string; employeeCode: string | null; designation: string | null }
}

export function Leaves({ refreshKey }: { refreshKey: number }) {
  const [list, setList] = useState<LeaveRow[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('PENDING')
  const [acting, setActing] = useState<{ leave: LeaveRow; action: 'approve' | 'reject' } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (status !== 'ALL') params.set('status', status)
      const data = await api<{ leaves: LeaveRow[] }>(`/api/admin/leaves?${params.toString()}`)
      setList(data.leaves || [])
    } catch (e: any) {
      toast.error(e.message || 'Failed to load leaves')
    } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => { load() }, [load, refreshKey])

  return (
    <div className="space-y-5">
      <SectionTitle
        title="Leave Requests"
        desc="Review and approve or reject leave applications"
      />

      <Card>
        <CardContent className="pt-6">
          <div className="mb-4">
            <Tabs value={status} onValueChange={setStatus}>
              <TabsList>
                <TabsTrigger value="PENDING">Pending</TabsTrigger>
                <TabsTrigger value="APPROVED">Approved</TabsTrigger>
                <TabsTrigger value="REJECTED">Rejected</TabsTrigger>
                <TabsTrigger value="ALL">All</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : list.length === 0 ? (
            <EmptyState icon={CalendarDays} title="No leave requests" desc="Try a different status filter" />
          ) : (
            <div className="max-h-[65vh] overflow-y-auto scroll-thin rounded-lg border">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-card">
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="hidden md:table-cell">From</TableHead>
                    <TableHead className="hidden md:table-cell">To</TableHead>
                    <TableHead>Days</TableHead>
                    <TableHead className="hidden lg:table-cell">Reason</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.map((l) => (
                    <TableRow key={l.id} className="hover:bg-muted/40">
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-8 w-8 ring-1 ring-[var(--gold)]/30">
                            <AvatarFallback className="bg-[var(--navy)]/10 text-[10px] font-bold text-[var(--navy)]">
                              {initials(l.employee.fullName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-[var(--navy)] dark:text-white">{l.employee.fullName}</p>
                            <p className="truncate text-[11px] text-muted-foreground">{l.employee.employeeCode || '—'}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-[var(--gold)]/40 text-[#8a6f24]">
                          {l.leaveType} — {leaveTypeLabel(l.leaveType)}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm">{fmtDate(l.fromDate)}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm">{fmtDate(l.toDate)}</TableCell>
                      <TableCell className="text-sm font-semibold">{l.days}</TableCell>
                      <TableCell className="hidden lg:table-cell max-w-xs">
                        <p className="truncate text-xs text-muted-foreground">{l.reason}</p>
                      </TableCell>
                      <TableCell>
                        <div>
                          <StatusBadge status={l.status} />
                          {l.comments && (
                            <p className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
                              <MessageSquare className="h-2.5 w-2.5" /> {l.comments}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {l.status === 'PENDING' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <Button size="sm" variant="outline" className="h-8 gap-1 border-emerald-500/30 text-emerald-700 hover:bg-emerald-50"
                              onClick={() => setActing({ leave: l, action: 'approve' })}
                            >
                              <Check className="h-3.5 w-3.5" /> Approve
                            </Button>
                            <Button size="sm" variant="outline" className="h-8 gap-1 border-red-500/30 text-red-700 hover:bg-red-50"
                              onClick={() => setActing({ leave: l, action: 'reject' })}
                            >
                              <X className="h-3.5 w-3.5" /> Reject
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">Reviewed</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {!loading && list.length > 0 && (
            <p className="mt-3 text-xs text-muted-foreground">{list.length} request{list.length > 1 ? 's' : ''}</p>
          )}
        </CardContent>
      </Card>

      {acting && (
        <ActionDialog
          leave={acting.leave}
          action={acting.action}
          onClose={() => setActing(null)}
          onSuccess={() => { setActing(null); load() }}
        />
      )}
    </div>
  )
}

function ActionDialog({ leave, action, onClose, onSuccess }: {
  leave: LeaveRow
  action: 'approve' | 'reject'
  onClose: () => void
  onSuccess: () => void
}) {
  const [comments, setComments] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    setSaving(true)
    try {
      await api(`/api/admin/leaves/${leave.id}/action`, {
        method: 'POST',
        body: JSON.stringify({ action, comments: comments.trim() || undefined }),
      })
      toast.success(action === 'approve' ? 'Leave approved' : 'Leave rejected')
      onSuccess()
    } catch (e: any) {
      toast.error(e.message || 'Action failed')
    } finally { setSaving(false) }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {action === 'approve'
              ? <><Check className="h-5 w-5 text-emerald-600" /> Approve Leave</>
              : <><X className="h-5 w-5 text-red-600" /> Reject Leave</>}
          </DialogTitle>
          <DialogDescription>
            {leave.employee.fullName} • {leave.leaveType} ({leave.days} day{leave.days > 1 ? 's' : ''}) from {fmtDate(leave.fromDate)} to {fmtDate(leave.toDate)}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <div className="rounded-lg border p-3 text-sm">
            <p className="text-xs font-semibold text-muted-foreground">Reason given</p>
            <p className="mt-1 text-[var(--navy)] dark:text-white">{leave.reason}</p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lv-comments">Comments (optional)</Label>
            <Textarea
              id="lv-comments"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder={action === 'approve' ? 'Optional note for employee…' : 'Reason for rejection…'}
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            className={action === 'approve' ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-red-600 text-white hover:bg-red-700'}
            onClick={submit} disabled={saving}
          >
            {saving ? 'Processing…' : action === 'approve' ? 'Approve Leave' : 'Reject Leave'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
