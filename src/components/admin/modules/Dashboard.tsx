'use client'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { StatCard, SectionTitle, StatusBadge, EmptyState } from '@/components/shared'
import { toast } from 'sonner'
import {
  Users, UserPlus, Fingerprint, CalendarDays, Building2, FolderKanban, Wallet,
  TrendingUp, ArrowRight, Activity, Clock, UserCheck,
} from 'lucide-react'
import {
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts'
import { api, formatINR, fmtRelative, initials } from '../lib'
import { cacheGet } from '@/lib/store'
import type { ModuleKey } from '../AdminLayout'

interface Stats {
  totalEmployees: number
  pendingApplications: number
  todayAttendance: number
  pendingLeaves: number
  totalClients: number
  activeProjects: number
  totalPayroll: number
  gender: { male: number; female: number }
  departments: { name: string; value: number }[]
  monthlyPayroll: { month: string; amount: number }[]
}

interface PendingEmp {
  id: string
  fullName: string
  email: string
  mobile: string | null
  currentDesignation: string | null
  createdAt: string
  status: string
}

interface AuditLog {
  id: string
  action: string
  entity: string
  details: string | null
  at: string
  user: { username: string } | null
}

const DEPT_COLORS = ['#0A1F44', '#C9A961', '#16306B', '#E2C987', '#5A6A8A', '#1E3A8A', '#8a6f24', '#061229', '#3b5998', '#9FB0CC', '#1B2F5A']

export function Dashboard({
  onNavigate,
  refreshKey,
}: {
  onNavigate: (k: ModuleKey) => void
  refreshKey: number
}) {
  const [stats, setStats] = useState<Stats | null>(() => cacheGet<Stats>('/api/admin/stats'))
  const [pending, setPending] = useState<PendingEmp[]>([])
  const [logs, setLogs] = useState<AuditLog[]>([])

  useEffect(() => {
    let cancelled = false
    Promise.all([
      api<Stats>('/api/admin/stats'),
      api<{ employees: PendingEmp[] }>('/api/admin/employees?status=PENDING'),
      api<{ logs: AuditLog[] }>('/api/admin/audit?limit=8'),
    ]).then(([s, p, l]) => {
      if (cancelled) return
      setStats(s)
      setPending((p.employees || []).slice(0, 6))
      setLogs(l.logs || [])
    }).catch(() => toast.error('Failed to load dashboard data'))
    return () => { cancelled = true }
  }, [refreshKey])

  if (!stats) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-80 w-full rounded-xl" />
      </div>
    )
  }

  const genderData = [
    { name: 'Male', value: stats.gender.male, color: '#0A1F44' },
    { name: 'Female', value: stats.gender.female, color: '#C9A961' },
  ]

  return (
    <div className="space-y-6">
      {/* Hero header */}
      <Card className="overflow-hidden border-[var(--navy)]/10">
        <div className="relative hpe-sidebar-gradient px-6 py-7 text-white sm:px-8">
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--gold-light)]">
                Admin Console
              </p>
              <h2 className="mt-1 text-2xl font-bold sm:text-3xl">
                Welcome back, <span className="text-gradient-gold">Administrator</span>
              </h2>
              <p className="mt-1.5 text-sm text-blue-100/80">
                {stats.pendingApplications > 0
                  ? `${stats.pendingApplications} application${stats.pendingApplications > 1 ? 's' : ''} awaiting your review • ${stats.pendingLeaves} leave request${stats.pendingLeaves > 1 ? 's' : ''} pending`
                  : 'All caught up — no pending applications right now'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {stats.pendingApplications > 0 && (
                <Button
                  onClick={() => onNavigate('employees')}
                  className="bg-[var(--gold)] text-[var(--navy)] hover:bg-[var(--gold-light)]"
                >
                  <UserCheck className="mr-2 h-4 w-4" /> Review Applications
                </Button>
              )}
              <Button
                onClick={() => onNavigate('reports')}
                variant="outline"
                className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
              >
                <TrendingUp className="mr-2 h-4 w-4" /> View Reports
              </Button>
            </div>
          </div>
          {/* Decorative circles */}
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[var(--gold)]/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-12 right-20 h-32 w-32 rounded-full bg-[var(--navy-light)]/30 blur-3xl" />
        </div>
      </Card>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        <StatCard icon={Users} label="Total Employees" value={stats.totalEmployees} sub="Active workforce" accent="navy" />
        <StatCard icon={UserPlus} label="Pending Applications" value={stats.pendingApplications} sub="Awaiting review" accent="gold" />
        <StatCard icon={Fingerprint} label="Today's Attendance" value={stats.todayAttendance} sub="Punched in today" accent="green" />
        <StatCard icon={CalendarDays} label="Pending Leaves" value={stats.pendingLeaves} sub="Awaiting approval" accent="amber" />
        <StatCard icon={Building2} label="Total Clients" value={stats.totalClients} sub="Active accounts" accent="navy" />
        <StatCard icon={FolderKanban} label="Active Projects" value={stats.activeProjects} sub="In progress" accent="gold" />
        <StatCard icon={Wallet} label="Payroll Disbursed" value={formatINR(stats.totalPayroll)} sub="Cumulative net" accent="green" />
        <StatCard icon={TrendingUp} label="Departments" value={stats.departments.length} sub="Operating units" accent="amber" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Payroll trend */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Monthly Payroll Trend</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Net salary disbursed — last 6 months</p>
              </div>
              <Badge variant="outline" className="gap-1 border-[var(--gold)]/40 text-[#8a6f24]">
                <TrendingUp className="h-3 w-3" /> Net Pay
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.monthlyPayroll} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="payrollGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#C9A961" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#C9A961" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#5A6A8A' }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#5A6A8A' }}
                    tickFormatter={(v) => '₹' + (v >= 1000 ? `${Math.round(v / 1000)}k` : v)}
                    axisLine={false} tickLine={false}
                  />
                  <Tooltip
                    formatter={(v: any) => [formatINR(v), 'Net Pay']}
                    contentStyle={{ borderRadius: 12, border: '1px solid #DDE3EE', boxShadow: '0 12px 28px -10px rgba(10,31,68,.25)' }}
                  />
                  <Area
                    type="monotone" dataKey="amount" stroke="#C9A961" strokeWidth={2.5}
                    fill="url(#payrollGrad)" dot={{ r: 4, fill: '#0A1F44', strokeWidth: 2, stroke: '#C9A961' }}
                    activeDot={{ r: 6 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Department distribution */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Department Distribution</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Approved employees by department</p>
          </CardHeader>
          <CardContent>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.departments} dataKey="value" nameKey="name"
                    cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={2}
                  >
                    {stats.departments.map((_, i) => (
                      <Cell key={i} fill={DEPT_COLORS[i % DEPT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: any, n: any) => [`${v} employee${v > 1 ? 's' : ''}`, n]}
                    contentStyle={{ borderRadius: 12, border: '1px solid #DDE3EE' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 max-h-24 space-y-1 overflow-y-auto scroll-thin">
              {stats.departments.slice(0, 6).map((d, i) => (
                <div key={d.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: DEPT_COLORS[i % DEPT_COLORS.length] }} />
                    <span className="truncate text-muted-foreground">{d.name}</span>
                  </div>
                  <span className="font-semibold text-[var(--navy)] dark:text-white">{d.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom row: pending applications + audit */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Pending applications */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Recent Applications</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Newly submitted applications</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => onNavigate('employees')} className="text-[var(--navy)] dark:text-[var(--gold-light)]">
                View all <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {pending.length === 0 ? (
              <EmptyState icon={UserCheck} title="No pending applications" desc="All applications have been reviewed" />
            ) : (
              <div className="max-h-80 space-y-2 overflow-y-auto scroll-thin pr-1">
                {pending.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/40"
                  >
                    <Avatar className="h-9 w-9 ring-1 ring-[var(--gold)]/30">
                      <AvatarFallback className="bg-[var(--navy)]/10 text-xs font-bold text-[var(--navy)]">
                        {initials(p.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[var(--navy)] dark:text-white">{p.fullName}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {p.currentDesignation || 'Applicant'} • {fmtRelative(p.createdAt)}
                      </p>
                    </div>
                    <StatusBadge status={p.status} />
                    <Button
                      size="sm" variant="outline"
                      onClick={() => onNavigate('employees')}
                      className="h-8 shrink-0"
                    >
                      Review
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Audit activity */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Recent Activity</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Audit trail — last 8 events</p>
              </div>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            {logs.length === 0 ? (
              <EmptyState icon={Clock} title="No activity yet" desc="Audit events will appear here" />
            ) : (
              <div className="max-h-80 space-y-2 overflow-y-auto scroll-thin pr-1">
                {logs.map((l) => (
                  <div key={l.id} className="flex items-start gap-3 rounded-lg border p-3">
                    <div className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-[var(--navy)]/10">
                      <Activity className="h-3.5 w-3.5 text-[var(--navy)] dark:text-[var(--gold-light)]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-[var(--navy)] dark:text-white">
                        <span className="font-mono text-xs text-[var(--gold)]">{l.action}</span>
                        <span className="text-muted-foreground"> • </span>
                        <span className="text-muted-foreground">{l.entity}</span>
                      </p>
                      {l.details && (
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">{l.details}</p>
                      )}
                      <p className="mt-1 text-[10px] text-muted-foreground">
                        {l.user?.username || 'system'} • {fmtRelative(l.at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Gender split mini-card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Workforce Composition</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-lg border p-4">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Total</p>
              <p className="mt-1 text-2xl font-bold text-[var(--navy)] dark:text-white">{stats.totalEmployees}</p>
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[var(--navy)]" />
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Male</p>
              </div>
              <p className="mt-1 text-2xl font-bold text-[var(--navy)] dark:text-white">{stats.gender.male}</p>
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[var(--gold)]" />
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Female</p>
              </div>
              <p className="mt-1 text-2xl font-bold text-[var(--gold)]">{stats.gender.female}</p>
            </div>
          </div>
          {/* Hidden but keeps genderData referenced for future use / chart toggle */}
          <span className="sr-only">
            {genderData.map((g) => `${g.name}: ${g.value}`).join(', ')}
          </span>
        </CardContent>
      </Card>
    </div>
  )
}
