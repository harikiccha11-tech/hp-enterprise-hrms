'use client'
import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/lib/store'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import {
  LayoutDashboard,
  Briefcase,
  ClipboardList,
  FileText,
  Bell,
  Menu,
  X,
  ChevronRight,
  LogOut,
  TrendingUp,
  Users,
  IndianRupee,
  Receipt,
  Building2,
  MapPin,
  UserCheck,
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────

type ClientView = 'dashboard' | 'projects' | 'work-orders' | 'invoices'

interface NavItem {
  key: ClientView
  label: string
  icon: typeof LayoutDashboard
  desc: string
}

interface DashboardProject {
  id: string
  projectName: string
  site: string | null
  status: string
  memberCount: number
  startDate: string
  endDate: string | null
}

interface DashboardWorkOrder {
  id: string
  woNumber: string
  title: string
  value: number
  status: string
  createdAt: string
  completedAt: string | null
}

interface DashboardInvoice {
  id: string
  invoiceNumber: string
  subtotal: number
  total: number
  status: string
  issuedAt: string
}

interface NotificationLite {
  id: string
  title: string
  message: string
  type: string
  read: boolean
  createdAt: string
}

interface DashboardData {
  stats: {
    totalProjects: number
    activeProjects: number
    workOrderValue: number
    invoiceTotal: number
  }
  projects: DashboardProject[]
  workOrders: DashboardWorkOrder[]
  invoices: DashboardInvoice[]
  announcements: { id: string; title: string; message: string; createdAt: string }[]
  notifications: NotificationLite[]
  unread: number
}

// ── Helpers ────────────────────────────────────────────────────────────────

function initials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

function statusColor(status: string): string {
  const s = status.toLowerCase()
  if (s === 'active' || s === 'in progress' || s === 'paid') return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/25'
  if (s === 'pending' || s === 'submitted') return 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/25'
  if (s === 'completed' || s === 'closed' || s === 'approved') return 'bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-500/25'
  if (s === 'cancelled' || s === 'rejected' || s === 'overdue') return 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/25'
  if (s === 'draft' || s === 'on hold') return 'bg-slate-500/15 text-slate-700 dark:text-slate-400 border-slate-500/25'
  return 'bg-primary/10 text-primary border-primary/20'
}

// ── Navigation ─────────────────────────────────────────────────────────────

const NAV: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, desc: 'Overview & quick actions' },
  { key: 'projects', label: 'Projects', icon: Briefcase, desc: 'Active & completed projects' },
  { key: 'work-orders', label: 'Work Orders', icon: ClipboardList, desc: 'Service work orders' },
  { key: 'invoices', label: 'Invoices', icon: FileText, desc: 'Billing & payments' },
]

// ── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, loading }: { label: string; value: string; icon: typeof IndianRupee; loading: boolean }) {
  return (
    <Card className="relative overflow-hidden">
      <div className="absolute -right-3 -top-3 h-16 w-16 rounded-full bg-[var(--gold)]/8" />
      <CardContent className="p-5">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[var(--navy)]/10">
            <Icon className="h-5 w-5 text-[var(--navy)] dark:text-[var(--gold-light)]" />
          </div>
          <div className="min-w-0 flex-1">
            {loading ? (
              <>
                <Skeleton className="mb-1 h-3.5 w-20" />
                <Skeleton className="h-6 w-28" />
              </>
            ) : (
              <>
                <p className="text-xs font-medium text-muted-foreground">{label}</p>
                <p className="text-xl font-bold text-[var(--navy)] dark:text-white">{value}</p>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ── Data Table ───────────────────────────────────────────────────────────────

function DataTable<T extends { id: string }>({
  title,
  data,
  loading,
  emptyMessage,
  columns,
  renderRow,
}: {
  title: string
  data: T[]
  loading: boolean
  emptyMessage: string
  columns: { key: string; label: string; className?: string }[]
  renderRow: (item: T) => React.ReactNode
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-6 pt-0">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
            <FileText className="mb-2 h-8 w-8 opacity-40" />
            <p className="text-sm font-medium">{emptyMessage}</p>
            <p className="mt-0.5 text-xs">Data will appear here once available</p>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto rounded-lg border scroll-thin">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  {columns.map((col) => (
                    <TableHead key={col.key} className={cn('text-xs font-semibold uppercase tracking-wide text-muted-foreground', col.className)}>
                      {col.label}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item) => renderRow(item))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ── Dashboard View ──────────────────────────────────────────────────────────

function DashboardView({
  data,
  loading,
}: {
  data: DashboardData | null
  loading: boolean
}) {
  const stats = data?.stats
  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="rounded-xl bg-gradient-to-r from-[var(--navy)] to-[var(--navy)]/90 p-6 text-white shadow-lg">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold sm:text-2xl">Welcome back!</h2>
            <p className="mt-1 text-sm text-blue-100/80">
              Here&apos;s an overview of your engagement with HP ENTERPRISE.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur-sm">
            <TrendingUp className="h-4 w-4 text-[var(--gold)]" />
            <span className="text-[var(--gold-light)]">Client Dashboard</span>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Projects"
          value={stats ? String(stats.totalProjects) : '—'}
          icon={Building2}
          loading={loading}
        />
        <StatCard
          label="Active Projects"
          value={stats ? String(stats.activeProjects) : '—'}
          icon={TrendingUp}
          loading={loading}
        />
        <StatCard
          label="Work Order Value"
          value={stats ? formatINR(stats.workOrderValue) : '—'}
          icon={IndianRupee}
          loading={loading}
        />
        <StatCard
          label="Invoice Total"
          value={stats ? formatINR(stats.invoiceTotal) : '—'}
          icon={Receipt}
          loading={loading}
        />
      </div>

      {/* Projects Table */}
      <DataTable
        title="Projects"
        data={data?.projects || []}
        loading={loading}
        emptyMessage="No projects found"
        columns={[
          { key: 'name', label: 'Project' },
          { key: 'site', label: 'Site' },
          { key: 'status', label: 'Status', className: 'w-24' },
          { key: 'members', label: 'Members', className: 'w-20' },
          { key: 'dates', label: 'Dates' },
        ]}
        renderRow={(p) => (
          <TableRow key={p.id}>
            <TableCell className="font-medium text-[var(--navy)] dark:text-white">{p.projectName}</TableCell>
            <TableCell>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate max-w-32">{p.site || '—'}</span>
              </div>
            </TableCell>
            <TableCell>
              <Badge variant="outline" className={cn('text-[11px]', statusColor(p.status))}>
                {p.status}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                <span>{p.memberCount}</span>
              </div>
            </TableCell>
            <TableCell className="text-xs text-muted-foreground">
              <div className="flex flex-col gap-0.5">
                <span>Start: {format(new Date(p.startDate), 'dd MMM yy')}</span>
                {p.endDate && <span>End: {format(new Date(p.endDate), 'dd MMM yy')}</span>}
              </div>
            </TableCell>
          </TableRow>
        )}
      />

      {/* Work Orders Table */}
      <DataTable
        title="Work Orders"
        data={data?.workOrders || []}
        loading={loading}
        emptyMessage="No work orders found"
        columns={[
          { key: 'number', label: 'WO #' },
          { key: 'title', label: 'Title' },
          { key: 'value', label: 'Value' },
          { key: 'status', label: 'Status', className: 'w-28' },
          { key: 'dates', label: 'Dates' },
        ]}
        renderRow={(wo) => (
          <TableRow key={wo.id}>
            <TableCell className="font-mono text-xs font-semibold text-[var(--navy)] dark:text-[var(--gold-light)]">{wo.woNumber}</TableCell>
            <TableCell className="font-medium">{wo.title}</TableCell>
            <TableCell className="font-semibold">{formatINR(wo.value)}</TableCell>
            <TableCell>
              <Badge variant="outline" className={cn('text-[11px]', statusColor(wo.status))}>
                {wo.status}
              </Badge>
            </TableCell>
            <TableCell className="text-xs text-muted-foreground">
              <div className="flex flex-col gap-0.5">
                <span>{format(new Date(wo.createdAt), 'dd MMM yy')}</span>
                {wo.completedAt && <span>Done: {format(new Date(wo.completedAt), 'dd MMM yy')}</span>}
              </div>
            </TableCell>
          </TableRow>
        )}
      />

      {/* Invoices Table */}
      <DataTable
        title="Invoices"
        data={data?.invoices || []}
        loading={loading}
        emptyMessage="No invoices found"
        columns={[
          { key: 'number', label: 'Invoice #' },
          { key: 'amount', label: 'Amount' },
          { key: 'total', label: 'Total' },
          { key: 'status', label: 'Status', className: 'w-28' },
          { key: 'date', label: 'Issue Date' },
        ]}
        renderRow={(inv) => (
          <TableRow key={inv.id}>
            <TableCell className="font-mono text-xs font-semibold text-[var(--navy)] dark:text-[var(--gold-light)]">{inv.invoiceNumber}</TableCell>
            <TableCell>{formatINR(inv.subtotal)}</TableCell>
            <TableCell className="font-semibold">{formatINR(inv.total)}</TableCell>
            <TableCell>
              <Badge variant="outline" className={cn('text-[11px]', statusColor(inv.status))}>
                {inv.status}
              </Badge>
            </TableCell>
            <TableCell className="text-xs text-muted-foreground">
              {format(new Date(inv.issuedAt), 'dd MMM yyyy')}
            </TableCell>
          </TableRow>
        )}
      />
    </div>
  )
}

// ── Placeholder View ─────────────────────────────────────────────────────────

function PlaceholderView({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-[var(--navy)]/10 mb-4">
        <LayoutDashboard className="h-8 w-8 text-[var(--navy)] dark:text-[var(--gold-light)]" />
      </div>
      <h2 className="text-lg font-bold text-[var(--navy)] dark:text-white">{title}</h2>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

// ── Main Component ──────────────────────────────────────────────────────────

export function ClientLayout() {
  const { user, logout } = useAuth()
  const [active, setActive] = useState<ClientView>('dashboard')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState<NotificationLite[]>([])
  const [unread, setUnread] = useState(0)
  const [now, setNow] = useState(new Date())
  const [bellOpen, setBellOpen] = useState(false)

  const client = user?.client
  const clientName = client?.clientName || client?.companyName || user?.username || 'Client'

  // Fetch dashboard data
  const loadDashboard = useCallback(async () => {
    try {
      const res = await fetch('/api/client/dashboard', { cache: 'no-store' })
      if (!res.ok) return
      const json = await res.json()
      setData(json)
      setNotifications(json.notifications || [])
      setUnread(json.unread || 0)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch('/api/client/dashboard', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (cancelled || !json) return
        setData(json)
        setNotifications(json.notifications || [])
        setUnread(json.unread || 0)
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  // Tick clock every 30s
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(t)
  }, [])

  const handleNavigate = (key: ClientView) => {
    setActive(key)
    setMobileOpen(false)
  }

  const markAllRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
      })
      setNotifications((arr) => arr.map((n) => ({ ...n, read: true })))
      setUnread(0)
      toast.success('All notifications marked as read')
    } catch {
      toast.error('Failed to update notifications')
    }
  }

  const markOneRead = async (id: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      setNotifications((arr) => arr.map((n) => (n.id === id ? { ...n, read: true } : n)))
      setUnread((u) => Math.max(0, u - 1))
    } catch {}
  }

  const handleLogout = async () => {
    await logout()
    toast.success('Signed out successfully')
  }

  const currentNav = NAV.find((n) => n.key === active)

  // ── Sidebar inner (shared between desktop & mobile) ──
  const sidebarInner = (
    <div className="flex h-full flex-col text-slate-200">
      {/* Brand */}
      <div className="px-5 pt-5 pb-4 border-b border-white/10">
        <BrandLogo />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto scroll-thin px-3 py-4 space-y-1">
        {NAV.map((item) => {
          const Icon = item.icon
          const isActive = active === item.key
          return (
            <button
              key={item.key}
              onClick={() => handleNavigate(item.key)}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-all',
                isActive
                  ? 'bg-[var(--gold)] text-[var(--navy)] shadow-sm'
                  : 'text-blue-100/80 hover:bg-white/10 hover:text-white'
              )}
            >
              <Icon
                className={cn(
                  'h-[18px] w-[18px] shrink-0',
                  isActive ? 'text-[var(--navy)]' : 'text-blue-200/70 group-hover:text-[var(--gold-light)]'
                )}
              />
              <span className="flex-1 truncate">{item.label}</span>
              {isActive && <ChevronRight className="h-4 w-4 text-[var(--navy)]" />}
            </button>
          )
        })}
      </nav>

      {/* User card + logout */}
      <div className="border-t border-white/10 p-3">
        <div className="rounded-lg bg-white/5 p-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 ring-2 ring-[var(--gold)]/40">
              <AvatarFallback className="bg-[var(--gold)] text-[var(--navy)] text-xs font-bold">
                {initials(clientName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{clientName}</p>
              <p className="truncate text-[11px] text-blue-200/70">
                {client?.companyName || client?.email || 'Client Portal'}
              </p>
            </div>
          </div>
          <Button
            onClick={handleLogout}
            variant="ghost"
            size="sm"
            className="mt-3 w-full justify-start gap-2 text-blue-100/80 hover:bg-white/10 hover:text-white"
          >
            <LogOut className="h-4 w-4" /> Sign Out
          </Button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top accent bar */}
      <div className="h-1 hpe-gold-bar w-full" />

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex w-[260px] shrink-0 hpe-sidebar-gradient border-r border-white/10">
          {sidebarInner}
        </aside>

        {/* Mobile sidebar (Sheet) */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-[260px] p-0 hpe-sidebar-gradient border-white/10">
            <SheetTitle className="sr-only">HP ENTERPRISE Client Portal Navigation</SheetTitle>
            <SheetDescription className="sr-only">Client portal navigation with access to your dashboard, projects, work orders, and invoices.</SheetDescription>
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-md text-blue-100 hover:bg-white/10"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebarInner}
          </SheetContent>
        </Sheet>

        {/* Main area */}
        <div className="flex flex-1 flex-col min-w-0">
          {/* Top bar */}
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b bg-card/95 px-4 backdrop-blur-md sm:px-6">
            <div className="flex items-center gap-3 min-w-0">
              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden grid h-9 w-9 place-items-center rounded-md border bg-background"
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <h1 className="truncate text-base font-bold text-[var(--navy)] dark:text-white sm:text-lg">
                  {currentNav?.label}
                </h1>
                <p className="hidden text-xs text-muted-foreground sm:block">{currentNav?.desc}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {/* Date / Time */}
              <div className="hidden md:flex flex-col items-end leading-tight">
                <span className="text-xs font-medium text-[var(--navy)] dark:text-white">
                  {format(now, 'EEEE, dd MMM yyyy')}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {format(now, 'h:mm a')}
                </span>
              </div>

              {/* Notifications bell */}
              <DropdownMenu open={bellOpen} onOpenChange={setBellOpen}>
                <DropdownMenuTrigger asChild>
                  <button
                    className="relative grid h-10 w-10 place-items-center rounded-full border bg-background hover:bg-muted transition-colors"
                    aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
                  >
                    <Bell className="h-[18px] w-[18px] text-[var(--navy)] dark:text-white" />
                    {unread > 0 && (
                      <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-[var(--gold)] px-1 text-[10px] font-bold text-[var(--navy)] ring-2 ring-card">
                        {unread > 9 ? '9+' : unread}
                      </span>
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 p-0">
                  <div className="flex items-center justify-between border-b px-3 py-2.5">
                    <p className="text-sm font-semibold text-[var(--navy)] dark:text-white">Notifications</p>
                    {unread > 0 && (
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={markAllRead}>
                        <UserCheck className="mr-1 h-3.5 w-3.5" /> Mark all read
                      </Button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto scroll-thin">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-sm text-muted-foreground">
                        <Bell className="mx-auto mb-2 h-6 w-6 opacity-50" />
                        No notifications yet
                      </div>
                    ) : (
                      notifications.slice(0, 12).map((n) => (
                        <DropdownMenuItem
                          key={n.id}
                          className="flex flex-col items-start gap-0.5 px-3 py-2.5 focus:bg-muted/60"
                          onClick={() => {
                            if (!n.read) markOneRead(n.id)
                          }}
                        >
                          <div className="flex w-full items-start gap-2">
                            {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--gold)]" />}
                            <div className="min-w-0 flex-1">
                              <p
                                className={cn(
                                  'text-sm leading-snug',
                                  n.read ? 'text-muted-foreground' : 'font-semibold text-[var(--navy)] dark:text-white'
                                )}
                              >
                                {n.title}
                              </p>
                              <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{n.message}</p>
                              <p className="mt-1 text-[10px] text-muted-foreground">
                                {format(new Date(n.createdAt), 'dd MMM yyyy, h:mm a')}
                              </p>
                            </div>
                          </div>
                        </DropdownMenuItem>
                      ))
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* User avatar */}
              <Avatar className="hidden sm:block h-9 w-9 ring-2 ring-[var(--gold)]/40">
                <AvatarFallback className="bg-[var(--navy)] text-[var(--gold)] text-xs font-bold">
                  {initials(clientName)}
                </AvatarFallback>
              </Avatar>
            </div>
          </header>

          {/* Module content */}
          <main className="flex-1 overflow-y-auto scroll-thin">
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
              {active === 'dashboard' && <DashboardView data={data} loading={loading} />}
              {active === 'projects' && (
                <PlaceholderView
                  title="Projects"
                  description="Your project details, timelines, and assigned team members will be displayed here."
                />
              )}
              {active === 'work-orders' && (
                <PlaceholderView
                  title="Work Orders"
                  description="All service work orders, their progress, and completion status will appear here."
                />
              )}
              {active === 'invoices' && (
                <PlaceholderView
                  title="Invoices"
                  description="Invoice history, payment status, and downloadable billing documents will be shown here."
                />
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Sticky footer */}
      <footer className="mt-auto border-t bg-card px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-1 text-xs text-muted-foreground sm:flex-row">
          <p>&copy; 2025 HP ENTERPRISE Safety Service &amp; Man Power Supply &bull; Client Portal</p>
          <p className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            All systems operational
          </p>
        </div>
      </footer>

      <Toaster richColors position="top-right" />
    </div>
  )
}
