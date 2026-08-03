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
  // New icons for new modules
  Network, Briefcase, MapPin, Truck, Package, UserPlus, UserMinus,
  Target, GraduationCap, CreditCard, BookOpen, Mail, BellRing,
  CreditCard as CreditCardIcon, ToggleLeft, Landmark, Shield, Activity,
  Search, Key, Globe,
} from 'lucide-react'
import { ROLE_LABELS } from '@/lib/constants'
import { t, type LangCode } from '@/lib/i18n'
import { fmtRelative, initials } from './lib'
// Existing modules
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
// New modules - Organization
import { Departments } from './modules/Departments'
import { Designations } from './modules/Designations'
import { Branches } from './modules/Branches'
// New modules - Operations
import { Vendors } from './modules/Vendors'
import { Assets } from './modules/Assets'
// New modules - HR Lifecycle
import { Recruitment } from './modules/Recruitment'
import { Onboarding } from './modules/Onboarding'
import { Offboarding } from './modules/Offboarding'
// New modules - Performance & Learning
import { Performance } from './modules/Performance'
import { Goals } from './modules/Goals'
import { Training } from './modules/Training'
// New modules - Finance
import { Expenses } from './modules/Expenses'
// New modules - System & Config
import { KnowledgeBase } from './modules/KnowledgeBase'
import { EmailTemplates } from './modules/EmailTemplates'
import { NotificationTemplates } from './modules/NotificationTemplates'
import { SubscriptionPlans } from './modules/SubscriptionPlans'
import { FeatureFlags } from './modules/FeatureFlags'
import { PaymentGateways } from './modules/PaymentGateways'
import { SecurityCenter } from './modules/SecurityCenter'
import { SystemHealth } from './modules/SystemHealth'
import { GlobalSearch } from './modules/GlobalSearch'
import { RoleManagement } from './modules/RoleManagement'
import { HpAiChat } from '@/components/shared/HpAiChat'
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher'

export type ModuleKey =
  // Overview
  | 'dashboard' | 'global-search'
  // Organization
  | 'departments' | 'designations' | 'branches'
  // People
  | 'employees' | 'attendance' | 'leaves' | 'documents' | 'onboarding' | 'offboarding'
  // Recruitment
  | 'recruitment'
  // Performance & Learning
  | 'performance' | 'goals' | 'training'
  // Operations
  | 'clients' | 'projects' | 'workorders' | 'vendors' | 'assets' | 'invoices'
  // Finance
  | 'payroll' | 'expenses' | 'reports'
  // Communications
  | 'announcements' | 'knowledge-base' | 'email-templates' | 'notification-templates'
  // System
  | 'subscription-plans' | 'feature-flags' | 'payment-gateways'
  | 'security' | 'system-health'
  | 'audit' | 'roles' | 'settings' | 'users'

interface NavItem {
  key: ModuleKey
  label: string
  icon: typeof LayoutDashboard
  desc: string
  superAdminOnly?: boolean
  ownerOnly?: boolean
}

function getNavGroups(lang: LangCode): { title: string; items: NavItem[] }[] {
  return [
    {
      title: t('nav.group.overview', lang),
      items: [
        { key: 'dashboard', label: t('nav.dashboard', lang), icon: LayoutDashboard, desc: 'Overview & analytics' },
        { key: 'global-search', label: 'Global Search', icon: Search, desc: 'Search across all modules' },
      ],
    },
    {
      title: 'Organization',
      items: [
        { key: 'departments', label: 'Departments', icon: Network, desc: 'Manage organizational departments' },
        { key: 'designations', label: 'Designations', icon: Briefcase, desc: 'Job titles & salary ranges' },
        { key: 'branches', label: 'Branches', icon: MapPin, desc: 'Office locations & branches' },
      ],
    },
    {
      title: t('nav.group.people', lang),
      items: [
        { key: 'employees', label: t('nav.employees', lang), icon: Users, desc: t('nav.desc.employees', lang) },
        { key: 'attendance', label: t('nav.attendance', lang), icon: Fingerprint, desc: t('nav.desc.attendance', lang) },
        { key: 'leaves', label: t('nav.leaves', lang), icon: CalendarDays, desc: t('nav.desc.leaves', lang) },
        { key: 'documents', label: t('nav.documents', lang), icon: FileText, desc: t('nav.desc.documents', lang) },
        { key: 'onboarding', label: 'Onboarding', icon: UserPlus, desc: 'Employee onboarding checklists' },
        { key: 'offboarding', label: 'Offboarding', icon: UserMinus, desc: 'Employee offboarding checklists' },
        { key: 'users', label: t('nav.userAccounts', lang), icon: UserCog, desc: t('nav.desc.userAccounts', lang), ownerOnly: true },
      ],
    },
    {
      title: 'Recruitment',
      items: [
        { key: 'recruitment', label: 'Recruitment', icon: UserPlus, desc: 'Job postings & candidate pipeline' },
      ],
    },
    {
      title: 'Performance & Learning',
      items: [
        { key: 'performance', label: 'Performance', icon: Target, desc: 'Employee performance reviews' },
        { key: 'goals', label: 'Goals', icon: Target, desc: 'Employee goals & targets' },
        { key: 'training', label: 'Training', icon: GraduationCap, desc: 'Training courses & enrollments' },
      ],
    },
    {
      title: t('nav.group.operations', lang),
      items: [
        { key: 'clients', label: t('nav.clients', lang), icon: Building2, desc: t('nav.desc.clients', lang) },
        { key: 'projects', label: t('nav.projects', lang), icon: FolderKanban, desc: t('nav.desc.projects', lang) },
        { key: 'workorders', label: t('nav.workOrders', lang), icon: ClipboardList, desc: t('nav.desc.workOrders', lang) },
        { key: 'vendors', label: 'Vendors', icon: Truck, desc: 'Vendor management' },
        { key: 'assets', label: 'Assets', icon: Package, desc: 'Asset tracking & assignment' },
        { key: 'invoices', label: t('nav.invoices', lang), icon: ReceiptText, desc: t('nav.desc.invoices', lang) },
      ],
    },
    {
      title: 'Finance',
      items: [
        { key: 'payroll', label: t('nav.payroll', lang), icon: Wallet, desc: t('nav.desc.payroll', lang), superAdminOnly: true },
        { key: 'expenses', label: 'Expenses', icon: CreditCard, desc: 'Expense claims & reimbursement' },
        { key: 'reports', label: t('nav.reports', lang), icon: BarChart3, desc: t('nav.desc.reports', lang) },
      ],
    },
    {
      title: 'Communications',
      items: [
        { key: 'announcements', label: t('nav.announcements', lang), icon: Megaphone, desc: t('nav.desc.announcements', lang) },
        { key: 'knowledge-base', label: 'Knowledge Base', icon: BookOpen, desc: 'AI knowledge base articles' },
        { key: 'email-templates', label: 'Email Templates', icon: Mail, desc: 'Email template management' },
        { key: 'notification-templates', label: 'Notification Templates', icon: BellRing, desc: 'Notification template management' },
      ],
    },
    {
      title: 'System',
      items: [
        { key: 'subscription-plans', label: 'Subscription Plans', icon: CreditCardIcon, desc: 'Pricing plans management' },
        { key: 'feature-flags', label: 'Feature Flags', icon: ToggleLeft, desc: 'Feature toggle management' },
        { key: 'payment-gateways', label: 'Payment Gateways', icon: Landmark, desc: 'Payment gateway configuration' },
        { key: 'security', label: 'Security Center', icon: Shield, desc: 'Security monitoring & logs', superAdminOnly: true },
        { key: 'system-health', label: 'System Health', icon: Activity, desc: 'System status & diagnostics' },
        { key: 'roles', label: 'Role Management', icon: Key, desc: 'Roles & permissions', ownerOnly: true },
        { key: 'audit', label: t('nav.auditLogs', lang), icon: ScrollText, desc: t('nav.desc.auditLogs', lang), superAdminOnly: true },
        { key: 'settings', label: t('nav.settings', lang), icon: Settings, desc: t('nav.desc.settings', lang), ownerOnly: true },
      ],
    },
  ]
}

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
  const { user, logout, lang } = useAuth()
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

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    let es: EventSource | null = null
    try {
      es = new EventSource('/api/sse')
      sseRef.current = es
      es.onmessage = (ev) => {
        try {
          const payload = JSON.parse(ev.data)
          if (payload.type === 'notification') {
            toast(payload.notification.title, { description: payload.notification.message })
            fetch('/api/notifications', { cache: 'no-store' })
              .then((r) => r.ok ? r.json() : null)
              .then((d) => { if (!d) return; setNotifications(d.notifications || []); setUnread(d.unread || 0) })
              .catch(() => {})
            setRefreshKey((k) => k + 1)
          }
        } catch {}
      }
      es.onerror = () => {}
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

  const handleNavigate = (k: ModuleKey) => { setActive(k); setMobileOpen(false) }

  const markAllRead = async () => {
    try {
      await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ all: true }) })
      setNotifications((arr) => arr.map((n) => ({ ...n, read: true })))
      setUnread(0)
      toast.success(t('nav.allMarkedRead', lang))
    } catch { toast.error(t('nav.notifFailed', lang)) }
  }

  const markOneRead = async (id: string) => {
    try {
      await fetch('/api/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
      setNotifications((arr) => arr.map((n) => (n.id === id ? { ...n, read: true } : n)))
      setUnread((u) => Math.max(0, u - 1))
    } catch {}
  }

  const handleLogout = async () => { await logout(); toast.success(t('nav.signedOut', lang)) }

  const navGroups = getNavGroups(lang)
  const allItems = navGroups.flatMap((g) => g.items)
  const currentNav = allItems.find((n) => n.key === active)

  const sidebarInner = (
    <div className="flex h-full flex-col text-slate-200">
      <div className="px-5 pt-5 pb-4 border-b border-white/10">
        <BrandLogo />
        <div className="mt-3 flex items-center gap-2">
          <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider', isOwner ? 'bg-gradient-to-r from-[var(--gold)] to-[var(--gold-light)] text-[var(--navy)]' : isSuperAdmin ? 'bg-[var(--gold)]/80 text-[var(--navy)]' : 'bg-white/10 text-[var(--gold-light)]')}>
            {isOwner ? <Crown className="h-3 w-3" /> : isSuperAdmin ? <ShieldCheck className="h-3 w-3" /> : <ShieldAlert className="h-3 w-3" />}
            {roleLabel}
          </span>
          <span className="text-[10px] uppercase tracking-wider text-blue-200/60">Console</span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto scroll-thin px-3 py-3 space-y-4" aria-label="Admin navigation">
        {navGroups.map((group) => {
          const visibleItems = group.items.filter((it) => (!it.superAdminOnly || isSuperAdmin) && (!it.ownerOnly || isOwner))
          if (visibleItems.length === 0) return null
          return (
            <div key={group.title}>
              <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-200/50">{group.title}</p>
              <div className="space-y-1">
                {visibleItems.map((item) => {
                  const Icon = item.icon
                  const isActive = active === item.key
                  return (
                    <button key={item.key} onClick={() => handleNavigate(item.key)} aria-current={isActive ? 'page' : undefined}
                      className={cn('group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-all', isActive ? 'bg-[var(--gold)] text-[var(--navy)] shadow-sm' : 'text-blue-100/80 hover:bg-white/10 hover:text-white')}>
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

      <div className="border-t border-white/10 p-3">
        <div className="rounded-lg bg-white/5 p-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 ring-2 ring-[var(--gold)]/40">
              <AvatarFallback className="bg-[var(--gold)] text-[var(--navy)] text-xs font-bold">{initials(adminName)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{adminName}</p>
              <p className="truncate text-[11px] text-blue-200/70">{adminEmail || roleLabel}</p>
            </div>
          </div>
          <Button onClick={handleLogout} variant="ghost" size="sm" className="mt-3 w-full justify-start gap-2 text-blue-100/80 hover:bg-white/10 hover:text-white">
            <LogOut className="h-4 w-4" /> {t('nav.signOut', lang)}
          </Button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="h-1 hpe-gold-bar w-full" />
      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden lg:flex w-[260px] shrink-0 hpe-sidebar-gradient border-r border-white/10">{sidebarInner}</aside>
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-[260px] p-0 hpe-sidebar-gradient border-white/10">
            <SheetTitle className="sr-only">HP ENTERPRISE Admin Navigation</SheetTitle>
            <SheetDescription className="sr-only">Admin console navigation menu.</SheetDescription>
            <button onClick={() => setMobileOpen(false)} className="absolute right-3 top-3 z-10 grid h-8 w-8 place-items-center rounded-md text-blue-100 hover:bg-white/10" aria-label="Close menu"><X className="h-5 w-5" /></button>
            {sidebarInner}
          </SheetContent>
        </Sheet>

        <div className="flex flex-1 flex-col min-w-0">
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b bg-card/95 px-4 backdrop-blur-md sm:px-6">
            <div className="flex items-center gap-3 min-w-0">
              <button onClick={() => setMobileOpen(true)} className="lg:hidden grid h-9 w-9 place-items-center rounded-md border bg-background" aria-label="Open menu"><Menu className="h-5 w-5" /></button>
              <div className="min-w-0">
                <h1 className="truncate text-base font-bold text-[var(--navy)] dark:text-white sm:text-lg">{currentNav?.label}</h1>
                <p className="hidden text-xs text-muted-foreground sm:block">{currentNav?.desc}</p>
              </div>
              {currentNav?.superAdminOnly && (<Badge variant="outline" className="hidden md:inline-flex border-[var(--gold)]/40 text-[#8a6f24] gap-1"><Lock className="h-3 w-3" /> Super Admin</Badge>)}
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <LanguageSwitcher />
              <div className="hidden md:flex flex-col items-end leading-tight">
                <span className="text-xs font-medium text-[var(--navy)] dark:text-white">{format(now, 'EEEE, dd MMM yyyy')}</span>
                <span className="text-[11px] text-muted-foreground">{format(now, 'h:mm a')}</span>
              </div>
              <DropdownMenu open={bellOpen} onOpenChange={setBellOpen}>
                <DropdownMenuTrigger asChild>
                  <button className="relative grid h-10 w-10 place-items-center rounded-full border bg-background hover:bg-muted transition-colors" aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}>
                    <Bell className="h-[18px] w-[18px] text-[var(--navy)] dark:text-white" />
                    {unread > 0 && (<span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-[var(--gold)] px-1 text-[10px] font-bold text-[var(--navy)] ring-2 ring-card">{unread > 9 ? '9+' : unread}</span>)}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 p-0">
                  <div className="flex items-center justify-between border-b px-3 py-2.5">
                    <p className="text-sm font-semibold text-[var(--navy)] dark:text-white">{t('nav.notifications', lang)}</p>
                    {unread > 0 && (<Button variant="ghost" size="sm" className="h-7 text-xs" onClick={markAllRead}><CheckCheck className="mr-1 h-3.5 w-3.5" /> {t('nav.markAllRead', lang)}</Button>)}
                  </div>
                  <div className="max-h-80 overflow-y-auto scroll-thin">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-sm text-muted-foreground"><Bell className="mx-auto mb-2 h-6 w-6 opacity-50" />{t('nav.noNotifications', lang)}</div>
                    ) : (
                      notifications.slice(0, 12).map((n) => (
                        <DropdownMenuItem key={n.id} className="flex flex-col items-start gap-0.5 px-3 py-2.5 focus:bg-muted/60" onClick={() => { if (!n.read) markOneRead(n.id) }}>
                          <div className="flex w-full items-start gap-2">
                            {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--gold)]" />}
                            <div className="min-w-0 flex-1">
                              <p className={cn('text-sm leading-snug', n.read ? 'text-muted-foreground' : 'font-semibold text-[var(--navy)] dark:text-white')}>{n.title}</p>
                              <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{n.message}</p>
                              <p className="mt-1 text-[10px] text-muted-foreground">{fmtRelative(n.createdAt)}</p>
                            </div>
                          </div>
                        </DropdownMenuItem>
                      ))
                    )}
                  </div>
                  <DropdownMenuSeparator className="my-0" />
                  <DropdownMenuLabel className="py-2 text-center text-xs font-semibold text-[var(--navy)] dark:text-[var(--gold-light)]">{t('nav.liveUpdates', lang)}</DropdownMenuLabel>
                </DropdownMenuContent>
              </DropdownMenu>
              <Avatar className="hidden sm:block h-9 w-9 ring-2 ring-[var(--gold)]/40">
                <AvatarFallback className="bg-[var(--navy)] text-[var(--gold)] text-xs font-bold">{initials(adminName)}</AvatarFallback>
              </Avatar>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto scroll-thin">
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
              {/* Overview */}
              {active === 'dashboard' && <Dashboard onNavigate={handleNavigate} refreshKey={refreshKey} />}
              {active === 'global-search' && <GlobalSearch onNavigate={handleNavigate} />}

              {/* Organization */}
              {active === 'departments' && <Departments refreshKey={refreshKey} />}
              {active === 'designations' && <Designations refreshKey={refreshKey} />}
              {active === 'branches' && <Branches refreshKey={refreshKey} />}

              {/* People */}
              {active === 'employees' && <Employees refreshKey={refreshKey} canDelete={isSuperAdmin} />}
              {active === 'attendance' && <Attendance refreshKey={refreshKey} />}
              {active === 'leaves' && <Leaves refreshKey={refreshKey} />}
              {active === 'documents' && <Documents refreshKey={refreshKey} />}
              {active === 'onboarding' && <Onboarding refreshKey={refreshKey} />}
              {active === 'offboarding' && <Offboarding refreshKey={refreshKey} />}
              {active === 'users' && isOwner && <UserAccounts refreshKey={refreshKey} />}

              {/* Recruitment */}
              {active === 'recruitment' && <Recruitment refreshKey={refreshKey} />}

              {/* Performance & Learning */}
              {active === 'performance' && <Performance refreshKey={refreshKey} isSuperAdmin={isSuperAdmin} />}
              {active === 'goals' && <Goals refreshKey={refreshKey} />}
              {active === 'training' && <Training refreshKey={refreshKey} />}

              {/* Operations */}
              {active === 'clients' && <Clients refreshKey={refreshKey} canDelete={isSuperAdmin} />}
              {active === 'projects' && <Projects refreshKey={refreshKey} canDelete={isSuperAdmin} />}
              {active === 'workorders' && <WorkOrders refreshKey={refreshKey} />}
              {active === 'vendors' && <Vendors refreshKey={refreshKey} canDelete={isSuperAdmin} />}
              {active === 'assets' && <Assets refreshKey={refreshKey} />}
              {active === 'invoices' && <Invoices refreshKey={refreshKey} />}

              {/* Finance */}
              {active === 'payroll' && <Payroll refreshKey={refreshKey} isSuperAdmin={isSuperAdmin} />}
              {active === 'expenses' && <Expenses refreshKey={refreshKey} isSuperAdmin={isSuperAdmin} />}
              {active === 'reports' && <Reports refreshKey={refreshKey} />}

              {/* Communications */}
              {active === 'announcements' && <Announcements refreshKey={refreshKey} />}
              {active === 'knowledge-base' && <KnowledgeBase refreshKey={refreshKey} />}
              {active === 'email-templates' && <EmailTemplates refreshKey={refreshKey} />}
              {active === 'notification-templates' && <NotificationTemplates refreshKey={refreshKey} />}

              {/* System */}
              {active === 'subscription-plans' && <SubscriptionPlans refreshKey={refreshKey} />}
              {active === 'feature-flags' && <FeatureFlags refreshKey={refreshKey} />}
              {active === 'payment-gateways' && <PaymentGateways refreshKey={refreshKey} />}
              {active === 'security' && <SecurityCenter isSuperAdmin={isSuperAdmin} />}
              {active === 'system-health' && <SystemHealth />}
              {active === 'roles' && <RoleManagement refreshKey={refreshKey} isOwner={isOwner} />}
              {active === 'audit' && <AuditLogs isSuperAdmin={isSuperAdmin} />}
              {active === 'settings' && <SettingsModule isSuperAdmin={isSuperAdmin} isOwner={isOwner} />}
            </div>
          </main>
        </div>
      </div>

      <footer className="mt-auto border-t bg-card px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-1 text-xs text-muted-foreground sm:flex-row">
          <p>© 2025 HP ENTERPRISE Safety Service & Man Power Supply • Admin Console • CIN: U72900KA2015PTC112233</p>
          <p className="flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />{t('footer.systemsOperational', lang)}</p>
        </div>
      </footer>

      <HpAiChat />
      <Toaster richColors position="top-right" />
    </div>
  )
}
