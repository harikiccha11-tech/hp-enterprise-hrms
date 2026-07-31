'use client'
import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { StatCard, StatusBadge, EmptyState } from '@/components/shared'
import { toast } from 'sonner'
import {
  CalendarDays,
  CalendarPlus,
  CalendarCheck,
  CalendarX,
  CalendarClock,
  Send,
} from 'lucide-react'
import { fmtDate, leaveTypeLabel } from '../lib'
import { LEAVE_TYPES } from '@/lib/constants'
import { differenceInCalendarDays, parseISO } from 'date-fns'

interface LeaveRow {
  id: string
  leaveType: string
  fromDate: string
  toDate: string
  days: number
  reason: string
  status: string
  appliedAt: string
  comments?: string | null
}

interface LeaveBalance {
  casual: number; sick: number; earned: number
  usedCasual: number; usedSick: number; usedEarned: number
  carriedForward: number
}

export function ApplyLeave({ refreshKey }: { refreshKey: number }) {
  const [leaves, setLeaves] = useState<LeaveRow[]>([])
  const [balance, setBalance] = useState<LeaveBalance | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ leaveType: 'CL', fromDate: '', toDate: '', reason: '' })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [leavesRes, dashRes] = await Promise.all([
        fetch('/api/admin/leaves', { cache: 'no-store' }),
        fetch('/api/employee/dashboard', { cache: 'no-store' }),
      ])
      if (leavesRes.ok) {
        const j = await leavesRes.json()
        setLeaves(j.leaves || [])
      }
      if (dashRes.ok) {
        const j = await dashRes.json()
        setBalance(j.stats?.leaveBalance || null)
      }
    } catch {
      toast.error('Failed to load leave data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load, refreshKey])

  const dayCount = form.fromDate && form.toDate
    ? Math.max(1, differenceInCalendarDays(parseISO(form.toDate), parseISO(form.fromDate)) + 1)
    : 0

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.leaveType || !form.fromDate || !form.toDate || !form.reason.trim()) {
      toast.error('Please fill in all fields')
      return
    }
    if (parseISO(form.toDate) < parseISO(form.fromDate)) {
      toast.error('To date cannot be before from date')
      return
    }
    if (form.reason.trim().length < 5) {
      toast.error('Please provide a more detailed reason')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to submit')
      toast.success(`Leave application submitted (${dayCount} day${dayCount > 1 ? 's' : ''})`)
      setForm({ leaveType: 'CL', fromDate: '', toDate: '', reason: '' })
      load()
    } catch (e: any) {
      toast.error(e.message || 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
        </div>
        <Skeleton className="h-80 w-full rounded-xl" />
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
    )
  }

  const bal = balance || { casual: 0, sick: 0, earned: 0, usedCasual: 0, usedSick: 0, usedEarned: 0, carriedForward: 0 }
  const totalAvailable = (bal.casual + bal.sick + bal.earned) - (bal.usedCasual + bal.usedSick + bal.usedEarned)
  const pending = leaves.filter(l => l.status === 'PENDING').length
  const approved = leaves.filter(l => l.status === 'APPROVED').length

  return (
    <div className="space-y-6">
      {/* Balance cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={CalendarCheck} label="Available Balance" value={totalAvailable} sub="Total leave days left" accent="gold" />
        <StatCard icon={CalendarClock} label="Pending Requests" value={pending} accent="amber" />
        <StatCard icon={CalendarCheck} label="Approved (All Time)" value={approved} accent="green" />
        <StatCard icon={CalendarX} label="Total Applications" value={leaves.length} accent="navy" />
      </div>

      {/* Detailed balance */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarDays className="h-4 w-4 text-[var(--gold)]" /> Leave Balance Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <BalanceBar label="Casual Leave" used={bal.usedCasual} total={bal.casual} color="var(--navy)" />
            <BalanceBar label="Sick Leave" used={bal.usedSick} total={bal.sick} color="var(--gold)" />
            <BalanceBar label="Earned Leave" used={bal.usedEarned} total={bal.earned} color="#16306B" />
          </div>
          {bal.carriedForward > 0 && (
            <p className="mt-4 text-xs text-muted-foreground">
              Plus <span className="font-semibold text-[var(--navy)] dark:text-white">{bal.carriedForward} days</span> carried forward from previous year.
            </p>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Apply form */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarPlus className="h-4 w-4 text-[var(--gold)]" /> Apply for Leave
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="lt">Leave Type</Label>
                <Select value={form.leaveType} onValueChange={v => setForm({ ...form, leaveType: v })}>
                  <SelectTrigger id="lt"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LEAVE_TYPES.map(t => <SelectItem key={t.code} value={t.code}>{t.label} ({t.code})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="fd">From Date</Label>
                  <Input id="fd" type="date" value={form.fromDate} onChange={e => setForm({ ...form, fromDate: e.target.value })} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="td">To Date</Label>
                  <Input id="td" type="date" value={form.toDate} min={form.fromDate} onChange={e => setForm({ ...form, toDate: e.target.value })} required />
                </div>
              </div>
              {dayCount > 0 && (
                <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
                  Duration: <span className="font-bold text-[var(--navy)] dark:text-white">{dayCount} day{dayCount > 1 ? 's' : ''}</span>
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="rs">Reason</Label>
                <Textarea
                  id="rs"
                  value={form.reason}
                  onChange={e => setForm({ ...form, reason: e.target.value })}
                  placeholder="Briefly explain the reason for your leave…"
                  rows={4}
                  required
                />
              </div>
              <Button type="submit" disabled={submitting} className="w-full bg-[var(--navy)] hover:bg-[var(--navy-light)]">
                {submitting ? 'Submitting…' : <><Send className="mr-2 h-4 w-4" /> Submit Application</>}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* History */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">My Leave Applications</CardTitle>
          </CardHeader>
          <CardContent>
            {leaves.length === 0 ? (
              <EmptyState icon={CalendarDays} title="No leave applications yet" desc="Submit your first leave request using the form." />
            ) : (
              <div className="max-h-[28rem] space-y-3 overflow-y-auto scroll-thin pr-1">
                {leaves.map((l) => (
                  <div key={l.id} className="rounded-lg border bg-card p-4 lift">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="rounded-md bg-[var(--navy)]/10 px-2 py-0.5 text-xs font-bold text-[var(--navy)] dark:bg-[var(--gold)]/15 dark:text-[var(--gold-light)]">
                            {l.leaveType}
                          </span>
                          <span className="text-xs text-muted-foreground">{leaveTypeLabel(l.leaveType)}</span>
                        </div>
                        <p className="mt-1.5 text-sm font-semibold text-[var(--navy)] dark:text-white">
                          {fmtDate(l.fromDate)} → {fmtDate(l.toDate)}
                        </p>
                        <p className="text-xs text-muted-foreground">{l.days} day{l.days > 1 ? 's' : ''} • Applied {fmtDate(l.appliedAt)}</p>
                        {l.reason && <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2">{l.reason}</p>}
                        {l.comments && (
                          <p className="mt-1.5 rounded-md bg-muted/50 px-2 py-1 text-xs text-muted-foreground">
                            <span className="font-medium">HR Note:</span> {l.comments}
                          </p>
                        )}
                      </div>
                      <StatusBadge status={l.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function BalanceBar({ label, used, total, color }: { label: string; used: number; total: number; color: string }) {
  const pct = total > 0 ? Math.min(100, (used / total) * 100) : 0
  const left = Math.max(0, total - used)
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-[var(--navy)] dark:text-white">{label}</p>
        <span className="text-xs font-semibold text-muted-foreground">{left}/{total} left</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <p className="mt-1.5 text-xs text-muted-foreground">{used} used</p>
    </div>
  )
}
