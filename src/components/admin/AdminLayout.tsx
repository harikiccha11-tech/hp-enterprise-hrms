'use client'
import { useEffect, useState, useRef } from 'react'
import { useAuth } from '@/lib/store'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import {
  LayoutDashboard, Users, Fingerprint, CalendarDays, Wallet, Building2,
  FolderKanban, ClipboardList, ReceiptText, BarChart3, FileText, Megaphone,
  ScrollText, Settings, Bell, LogOut, Menu, X, ChevronRight, CheckCheck,
  ShieldCheck, ShieldAlert, Lock, Crown, UserCog,
} from 'lucide-react'
import { ROLE_LABELS } from '@/lib/constants'
import { fmtRelative, initials } from './lib'
import { Dashboard } from './modules/Dashboard'
import { Employees } from './modules/Employees'
import { Attendance } from './modules/Attendance'
import { Leaves } from './modules/Leaves'
import { Payroll } from './modules/Payroll'
import { Clients } from './modules/Clients'
import { Projects } from './modules/Projects'
import { WorkOrders } from './modules/WorkOrders'
import { Invoices } from './modules/Invoices'
import { Reports } from './modules/Reports'
import { Documents } from './modules/Documents'
import { Announcements } from './modules/Announcements'
import { AuditLogs } from './modules/AuditLogs'
import { SettingsModule } from './modules/Settings'
import { UserAccounts } from './modules/UserAccounts'
import { HpAiChat } from '@/components/shared/HpAiChat'
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher'

export type ModuleKey =
  | 'dashboard' | 'employees' | 'attendance' | 'leaves' | 'payroll'
  | 'clients' | 'projects' | 'workorders' | 'invoices' | 'reports'
  | 'documents' | 'announcements' | 'audit' | 'settings' | 'users'

interface NavItem {
  key: ModuleKey
  label: string
  icon: typeof LayoutDashboard
  desc: string
  superAdminOnly?: boolean
  ownerOnly?: boolean
}

const NAV_GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: 'Overview',
    items: [
      { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, desc: 'Key metrics & activity' },
    ],
  },
  {
    title: 'People',
    items: [
      { key: 'employees', label: 'Employees', icon: Users, desc: 'Applications & employee records' },
      { key: 'attendance', label: 'Attendance', icon: Fingerprint, desc: 'Daily punch records' },
      { key: 'leaves', label: 'Leave Requests', icon: CalendarDays, desc: 'Approve / reject leaves' },
      { key: 'documents', label: 'Documents', icon: FileText, desc: 'Generate employee documents' },
      { key: 'users', label: 'User Accounts', icon: UserCog, desc: 'Create Admin / HR accounts', ownerOnly: true },
    ],
  },
  {
    title: 'Operations',
    items: [
      { key: 'clients', label: 'Clients', icon: Building2, desc: 'Client master records' },
      { key: 'projects', label: 'Projects', icon: FolderKanban, desc: 'Project assignments' },
      { key: 'workorders', label: 'Work Orders', icon: ClipboardList, desc: 'Client work orders' },
      { key: 'invoices', label: 'Invoices', icon: ReceiptText, desc: 'Billing & invoices' },
      { key: 'announcements', label: 'Announcements', icon: Megaphone, desc: 'Company announcements' },
    ],
  },
  {
    title: 'Finance & System',
    items: [
      { key: 'payroll', label: 'Payroll', icon: Wallet, desc: 'Run payroll & slips', superAdminOnly: true },
      { key: 'reports', label: 'Reports', icon: BarChart3, desc: 'Exportable reports' },
      { key: 'audit', label: 'Audit Logs', icon: ScrollText, desc: 'Activity trail', superAdminOnly: true },
      { key: 'settings', label: 'Settings', icon: Settings, desc: 'Payroll & leave config', ownerOnly: true },
    ],
  },
]

interface NotificationLite {
  id: string
  title: string
  message: string
  type: string
  read: boolean
  createdAt: string
  link?: string | null
}

export function AdminLayout() {
  const { user, logout } = useAuth()
  const [active, setActive] = useState<ModuleKey>('dashboard')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationLite[]>([])
  const [unread, setUnread] = useState(0)
  const [now, setNow] = useState(new Date())
  const [bellOpen, setBellOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const sseRef = useRef<EventSource | null>(null)

  const isOwner = user?.role === 'OWNER'
  const isSuperAdmin = user?.role === 'OWNER' || user?.role === 'SUPER_ADMIN'
  const roleLabel = user?.role ? ROLE_LABELS[user.role] : 'Admin'
  const adminName = user?.username || 'Admin'
  const adminEmail = user?.email || ''

  // Initial notifications load
  useEffect(() => {
    let cancelled = false
    fetch('/api/notifications', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data) return
        setNotifications(data.notifications || [])
        setUnread(data.unread || 0)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  // Tick clock every 30s
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(t)
  }, [])

  // SSE for live notifications
  useEffect(() => {
    let es: EventSource | null = null
    try {
      es = new EventSource('/api/sse')
      sseRef.current = es
      es.onmessage = (ev) => {
        try {
          const payload = JSON.parse(ev.data)
          if (payload.type === 'notification') {
            toast(payload.notification.title, {
              description: payload.notification.message,
            })
            // refetch notifications
            fetch('/api/notifications', { cache: 'no-store' })
              .then((r) => r.ok ? r.json() : null)
              .then((d) => {
                if (!d) return
                setNotifications(d.notifications || [])
                setUnread(d.unread || 0)
              })
              .catch(() => {})
            setRefreshKey((k) => k + 1)
          }
        } catch {}
      }
      es.onerror = () => { /* auto-reconnect */ }
    } catch {}
    return () => { try { es?.close() } catch {} }
  }, [])

  const loadNotifications = async () => {
    try {
      const res = await fetch('/api/notifications', { cache: 'no-store' })
      if (!res.ok) return
      const data = await res.json()
      setNotifications(data.notifications || [])
      setUnread(data.unread || 0)
    } catch {}
  }

  const handleNavigate = (k: ModuleKey) => {
    setActive(k)
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

  // Find current nav meta
  const allItems = NAV_GROUPS.flatMap((g) => g.items)
  const currentNav = allItems.find((n) => n.key === active)

  const sidebarInner = (
    <div className="flex h-full flex-col text-slate-200">
      {/* Brand */}
      <div className="px-5 pt-5 pb-4 border-b border-white/10">
        <BrandLogo />
        <div className="mt-3 flex items-center gap-2">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider',
              isOwner
                ? 'bg-gradient-to-r from-[var(--gold)] to-[var(--gold-light)] text-[var(--navy)]'
                : isSuperAdmin
                ? 'bg-[var(--gold)]/80 text-[var(--navy)]'
                : 'bg-white/10 text-[var(--gold-light)]'
            )}
          >
            {isOwner ? <Crown className="h-3 w-3" /> : isSuperAdmin ? <ShieldCheck className="h-3 w-3" /> : <ShieldAlert className="h-3 w-3" />}
            {roleLabel}
          </span>
          <span className="text-[10px] uppercase tracking-wider text-blue-200/60">Console</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto scroll-thin px-3 py-3 space-y-4" aria-label="Admin navigation">
        {NAV_GROUPS.map((group) => {
          const visibleItems = group.items.filter((it) => (!it.superAdminOnly || isSuperAdmin) && (!it.ownerOnly || isOwner))
          if (visibleItems.length === 0) return null
          return (
            <div key={group.title}>
              <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-200/50">
                {group.title}
              </p>
              <div className="space-y-1">
                {visibleItems.map((item) => {
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
                      <Icon className={cn('h-[18px] w-[18px] shrink-0', isActive ? 'text-[var(--navy)]' : 'text-blue-200/70 group-hover:text-[var(--gold-light)]')} />
                      <span className="flex-1 truncate">{item.label}</span>
                      {isActive && <ChevronRight className="h-4 w-4 text-[var(--navy)]" />}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </nav>

      {/* User card + logout */}
      <div className="border-t border-white/10 p-3">
        <div className="rounded-lg bg-white/5 p-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 ring-2 ring-[var(--gold)]/40">
              <AvatarFallback className="bg-[var(--gold)] text-[var(--navy)] text-xs font-bold">
                {initials(adminName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{adminName}</p>
              <p className="truncate text-[11px] text-blue-200/70">{adminEmail || roleLabel}</p>
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
            <SheetTitle className="sr-only">HP ENTERPRISE Admin Navigation</SheetTitle>
            <SheetDescription className="sr-only">Admin console navigation menu with access to all workforce management modules.</SheetDescription>
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

        {/* Main */}
        <div className="flex flex-1 flex-col min-w-0">
          {/* Top bar */}
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b bg-card/95 px-4 backdrop-blur-md sm:px-6">
            <div className="flex items-center gap-3 min-w-0">
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
              {currentNav?.superAdminOnly && (
                <Badge variant="outline" className="hidden md:inline-flex border-[var(--gold)]/40 text-[#8a6f24] gap-1">
                  <Lock className="h-3 w-3" /> Super Admin
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <LanguageSwitcher />

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
                        <CheckCheck className="mr-1 h-3.5 w-3.5" /> Mark all read
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
                          onClick={() => { if (!n.read) markOneRead(n.id) }}
                        >
                          <div className="flex w-full items-start gap-2">
                            {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--gold)]" />}
                            <div className="min-w-0 flex-1">
                              <p className={cn('text-sm leading-snug', n.read ? 'text-muted-foreground' : 'font-semibold text-[var(--navy)] dark:text-white')}>
                                {n.title}
                              </p>
                              <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{n.message}</p>
                              <p className="mt-1 text-[10px] text-muted-foreground">{fmtRelative(n.createdAt)}</p>
                            </div>
                          </div>
                        </DropdownMenuItem>
                      ))
                    )}
                  </div>
                  <DropdownMenuSeparator className="my-0" />
                  <DropdownMenuLabel className="py-2 text-center text-xs font-semibold text-[var(--navy)] dark:text-[var(--gold-light)]">
                    Live updates enabled
                  </DropdownMenuLabel>
                </DropdownMenuContent>
              </DropdownMenu>

              <Avatar className="hidden sm:block h-9 w-9 ring-2 ring-[var(--gold)]/40">
                <AvatarFallback className="bg-[var(--navy)] text-[var(--gold)] text-xs font-bold">
                  {initials(adminName)}
                </AvatarFallback>
              </Avatar>
            </div>
          </header>

          {/* Module content */}
          <main className="flex-1 overflow-y-auto scroll-thin">
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
              {active === 'dashboard' && <Dashboard onNavigate={handleNavigate} refreshKey={refreshKey} />}
              {active === 'employees' && <Employees refreshKey={refreshKey} canDelete={isSuperAdmin} />}
              {active === 'attendance' && <Attendance refreshKey={refreshKey} />}
              {active === 'leaves' && <Leaves refreshKey={refreshKey} />}
              {active === 'payroll' && <Payroll refreshKey={refreshKey} isSuperAdmin={isSuperAdmin} />}
              {active === 'clients' && <Clients refreshKey={refreshKey} canDelete={isSuperAdmin} />}
              {active === 'projects' && <Projects refreshKey={refreshKey} canDelete={isSuperAdmin} />}
              {active === 'workorders' && <WorkOrders refreshKey={refreshKey} />}
              {active === 'invoices' && <Invoices refreshKey={refreshKey} />}
              {active === 'reports' && <Reports refreshKey={refreshKey} />}
              {active === 'documents' && <Documents refreshKey={refreshKey} />}
              {active === 'announcements' && <Announcements refreshKey={refreshKey} />}
              {active === 'audit' && <AuditLogs isSuperAdmin={isSuperAdmin} />}
              {active === 'settings' && <SettingsModule isSuperAdmin={isSuperAdmin} isOwner={isOwner} />}
              {active === 'users' && isOwner && <UserAccounts refreshKey={refreshKey} />}
            </div>
          </main>
        </div>
      </div>

      {/* Sticky footer */}
      <footer className="mt-auto border-t bg-card px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-1 text-xs text-muted-foreground sm:flex-row">
          <p>© 2025 HP ENTERPRISE Safety Service & Man Power Supply • Admin Console • CIN: U72900KA2015PTC112233</p>
          <p className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            All systems operational
          </p>
        </div>
      </footer>

      <HpAiChat />

      <Toaster richColors position="top-right" />
    </div>
  )
}
