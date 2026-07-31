'use client'
import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { StatCard, SectionTitle, StatusBadge, EmptyState } from '@/components/shared'
import { toast } from 'sonner'
import {
  Fingerprint,
  CalendarCheck,
  CalendarDays,
  Bell,
  ArrowRight,
  Briefcase,
  Clock,
  LogIn,
  LogOut,
  FileText,
  Wallet,
  TrendingUp,
} from 'lucide-react'
import { fmtDateTime, fmtDate, initials } from '../lib'
import type { ModuleKey } from '../EmployeeLayout'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from 'recharts'
import { format, subDays, parseISO } from 'date-fns'

interface LeaveBalance {
  casual: number; sick: number; earned: number
  usedCasual: number; usedSick: number; usedEarned: number
  carriedForward: number
}
interface ProjectAssignment {
  id: string
  role: string | null
  assignedAt: string
  project: { id: string; projectName: string; status: string; site: string | null; client: { clientName: string } }
}
interface LeaveRow {
  id: string; leaveType: string; fromDate: string; toDate: string; days: number; status: string; reason: string
}
interface AttendanceRow {
  id: string; date: string; punchIn: string | null; punchOut: string | null; workingHours: number | null; status: string; lateArrival: boolean
}
interface DashboardData {
  employee: any
  stats: {
    presentDays: number
    todayPunchIn: string | null
    todayPunchOut: string | null
    pendingLeaves: number
    unreadNotifs: number
    leaveBalance: LeaveBalance | null
    totalDocuments: number
  }
}

export function Dashboard({
  onNavigate,
  refreshKey,
}: {
  onNavigate: (k: ModuleKey) => void
  refreshKey: number
}) {
  const { user } = useAuth()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [punching, setPunching] = useState(false)

  const emp = user?.employee
  const empName = emp?.fullName || user?.username || 'Employee'
  const empCode = emp?.employeeCode || '—'
  const empDesignation = emp?.designation || '—'
  const empDept = emp?.department || '—'

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/employee/dashboard', { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed to load dashboard')
      setData(json)
    } catch (e: any) {
      toast.error(e.message || 'Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load, refreshKey])

  const todayPunchIn = data?.stats.todayPunchIn || null
  const todayPunchOut = data?.stats.todayPunchOut || null
  const isPunchedIn = !!todayPunchIn
  const isPunchedOut = !!todayPunchOut

  const handlePunch = async (action: 'punch_in' | 'punch_out') => {
    setPunching(true)
    try {
      const res = await fetch('/api/employee/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Punch failed')
      toast.success(action === 'punch_in' ? 'Punched in successfully' : 'Punched out successfully')
      load()
    } catch (e: any) {
      toast.error(e.message || 'Punch failed')
    } finally {
      setPunching(false)
    }
  }

  // Build last-14-days attendance chart data
  const chartData = (() => {
    if (!data?.employee?.attendance) return []
    const byDay = new Map<string, number>()
    for (const a of data.employee.attendance as AttendanceRow[]) {
      const key = format(parseISO(a.date), 'dd MMM')
      byDay.set(key, a.workingHours || 0)
    }
    const out: { day: string; hours: number }[] = []
    for (let i = 13; i >= 0; i--) {
      const d = subDays(new Date(), i)
      const key = format(d, 'dd MMM')
      out.push({ day: key, hours: byDay.get(key) || 0 })
    }
    return out
  })()

  const leaveBalance = data?.stats.leaveBalance
  const totalLeaveAvailable =
    (leaveBalance ? leaveBalance.casual + leaveBalance.sick + leaveBalance.earned : 0) -
    (leaveBalance ? leaveBalance.usedCasual + leaveBalance.usedSick + leaveBalance.usedEarned : 0)

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-44 w-full rounded-2xl" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-64 w-full rounded-2xl lg:col-span-2" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    )
  }

  const recentLeaves: LeaveRow[] = data?.employee?.leaves || []
  const projects: ProjectAssignment[] = data?.employee?.projectAssignments || []

  return (
    <div className="space-y-6">
      {/* Welcome / hero */}
      <Card className="overflow-hidden border-0 shadow-lg">
        <div className="relative">
          <div className="absolute inset-0 hpe-sidebar-gradient" />
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 90% 10%, #C9A961 0, transparent 50%), radial-gradient(circle at 0% 100%, #16306B 0, transparent 45%)' }} />
          <CardContent className="relative flex flex-col gap-5 p-6 sm:p-7 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 ring-4 ring-[var(--gold)]/40">
                <AvatarFallback className="bg-[var(--gold)] text-[var(--navy)] text-lg font-black">
                  {initials(empName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-[var(--gold-light)]">Welcome back,</p>
                <h2 className="text-2xl font-bold text-white sm:text-3xl">{empName}</h2>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-blue-100/90">
                  <span className="font-mono font-semibold text-[var(--gold-light)]">{empCode}</span>
                  <span className="opacity-50">•</span>
                  <span>{empDesignation}</span>
                  <span className="opacity-50">•</span>
                  <span>{empDept}</span>
                </div>
              </div>
            </div>

            {/* Today's status mini-card */}
            <div className="rounded-xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm md:min-w-[240px]">
              <p className="text-[11px] uppercase tracking-wider text-blue-100/80">Today's Status</p>
              {isPunchedIn ? (
                <div className="mt-1.5 space-y-1">
                  <div className="flex items-center gap-2 text-sm text-white">
                    <LogIn className="h-4 w-4 text-emerald-400" />
                    <span>In: <span className="font-semibold">{fmtDateTime(todayPunchIn)}</span></span>
                  </div>
                  {isPunchedOut ? (
                    <div className="flex items-center gap-2 text-sm text-white">
                      <LogOut className="h-4 w-4 text-rose-400" />
                      <span>Out: <span className="font-semibold">{fmtDateTime(todayPunchOut)}</span></span>
                    </div>
                  ) : (
                    <p className="text-xs text-blue-100/70">Still working — punch out when leaving.</p>
                  )}
                </div>
              ) : (
                <p className="mt-1.5 text-sm text-blue-100/80">Not punched in yet today.</p>
              )}
            </div>
          </CardContent>
        </div>
      </Card>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Fingerprint}
          label="Today's Status"
          value={isPunchedOut ? 'Punched Out' : isPunchedIn ? 'Punched In' : 'Not Marked'}
          sub={isPunchedIn ? `In at ${fmtDateTime(todayPunchIn)}` : 'Mark your attendance'}
          accent={isPunchedOut ? 'amber' : isPunchedIn ? 'green' : 'red'}
        />
        <StatCard
          icon={CalendarCheck}
          label="Present Days (This Month)"
          value={data?.stats.presentDays ?? 0}
          sub={`Pending leaves: ${data?.stats.pendingLeaves ?? 0}`}
          accent="navy"
        />
        <StatCard
          icon={CalendarDays}
          label="Leave Balance"
          value={totalLeaveAvailable}
          sub={`Of ${(leaveBalance?.casual || 0) + (leaveBalance?.sick || 0) + (leaveBalance?.earned || 0)} total days`}
          accent="gold"
        />
        <StatCard
          icon={Bell}
          label="Unread Notifications"
          value={data?.stats.unreadNotifs ?? 0}
          sub={`${data?.stats.totalDocuments ?? 0} documents available`}
          accent="amber"
        />
      </div>

      {/* Quick actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <QuickAction
          icon={isPunchedIn && !isPunchedOut ? LogOut : LogIn}
          title={isPunchedOut ? 'Attendance Done' : isPunchedIn ? 'Punch Out' : 'Punch In'}
          desc={isPunchedOut ? 'You have punched out for today' : isPunchedIn ? 'Mark your end of day' : 'Start your workday'}
          disabled={isPunchedOut || punching}
          loading={punching}
          accent={isPunchedIn ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'}
          onClick={() => handlePunch(isPunchedIn ? 'punch_out' : 'punch_in')}
        />
        <QuickAction
          icon={CalendarDays}
          title="Apply Leave"
          desc="Submit a new leave request"
          accent="bg-[var(--navy)] hover:bg-[var(--navy-light)]"
          onClick={() => onNavigate('leave')}
        />
        <QuickAction
          icon={FileText}
          title="My Documents"
          desc="View letters & ID cards"
          accent="bg-[var(--navy)] hover:bg-[var(--navy-light)]"
          onClick={() => onNavigate('documents')}
        />
        <QuickAction
          icon={Wallet}
          title="Salary Slips"
          desc="Download payslips"
          accent="bg-[var(--navy)] hover:bg-[var(--navy-light)]"
          onClick={() => onNavigate('salary')}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Attendance trend chart */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="h-4 w-4 text-[var(--gold)]" />
                Working Hours — Last 14 Days
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => onNavigate('attendance')} className="text-xs">
                View all <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="h-64 w-full">
              {chartData.every((d) => d.hours === 0) ? (
                <EmptyState icon={Clock} title="No attendance recorded yet" desc="Your working hours trend will appear here once you start punching in." />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(10,31,68,0.08)" />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#5A6A8A' }} axisLine={false} tickLine={false} interval={1} />
                    <YAxis tick={{ fontSize: 11, fill: '#5A6A8A' }} axisLine={false} tickLine={false} unit="h" />
                    <Tooltip
                      contentStyle={{ borderRadius: 8, border: '1px solid #DDE3EE', fontSize: 12 }}
                      cursor={{ fill: 'rgba(201,169,97,0.1)' }}
                      formatter={(v: any) => [`${v} hrs`, 'Worked']}
                    />
                    <Bar dataKey="hours" radius={[6, 6, 0, 0]} maxBarSize={28}>
                      {chartData.map((entry, i) => (
                        <Cell key={i} fill={entry.hours >= 9 ? '#C9A961' : entry.hours > 0 ? '#16306B' : '#DDE3EE'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Project assignments */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Briefcase className="h-4 w-4 text-[var(--gold)]" />
              Current Projects
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            {projects.length === 0 ? (
              <EmptyState icon={Briefcase} title="No active projects" desc="You are not assigned to any project right now." />
            ) : (
              <ul className="max-h-72 space-y-3 overflow-y-auto scroll-thin pr-1">
                {projects.map((p) => (
                  <li key={p.id} className="rounded-lg border bg-card p-3 lift">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[var(--navy)] dark:text-white">{p.project.projectName}</p>
                        <p className="truncate text-xs text-muted-foreground">{p.project.client?.clientName || 'Internal'}{p.project.site ? ` • ${p.project.site}` : ''}</p>
                      </div>
                      <StatusBadge status={p.project.status} />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{p.role || 'Team Member'}</span>
                      <span>Since {fmtDate(p.assignedAt)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent leaves */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Recent Leave Applications</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => onNavigate('leave')} className="text-xs">
              View all <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          {recentLeaves.length === 0 ? (
            <EmptyState icon={CalendarDays} title="No leave applications yet" desc="Submit a leave request from the Apply Leave tab." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="pb-2 pr-4 font-medium">Type</th>
                    <th className="pb-2 pr-4 font-medium">From</th>
                    <th className="pb-2 pr-4 font-medium">To</th>
                    <th className="pb-2 pr-4 font-medium">Days</th>
                    <th className="pb-2 pr-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentLeaves.slice(0, 5).map((l) => (
                    <tr key={l.id} className="border-b last:border-0 hover:bg-muted/40">
                      <td className="py-2.5 pr-4 font-medium text-[var(--navy)] dark:text-white">{l.leaveType}</td>
                      <td className="py-2.5 pr-4">{fmtDate(l.fromDate)}</td>
                      <td className="py-2.5 pr-4">{fmtDate(l.toDate)}</td>
                      <td className="py-2.5 pr-4">{l.days}</td>
                      <td className="py-2.5 pr-4"><StatusBadge status={l.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function QuickAction({
  icon: Icon,
  title,
  desc,
  onClick,
  disabled,
  loading,
  accent,
}: {
  icon: typeof LogIn
  title: string
  desc: string
  onClick?: () => void
  disabled?: boolean
  loading?: boolean
  accent: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="group flex items-center gap-3 rounded-xl border bg-card p-4 text-left transition-all hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 lift disabled:hover:translate-y-0 disabled:hover:shadow-none"
    >
      <div className={`grid h-11 w-11 place-items-center rounded-lg ${accent} text-white`}>
        <Icon className={`h-5 w-5 ${loading ? 'animate-pulse' : ''}`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-[var(--navy)] dark:text-white">{title}</p>
        <p className="truncate text-xs text-muted-foreground">{desc}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </button>
  )
}
