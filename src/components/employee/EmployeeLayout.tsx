'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useAuth, prefetch, cachedFetch, cacheInvalidate, cacheGet } from '@/lib/store'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
// Toaster is in root layout
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'
import {
  LayoutDashboard,
  UserCircle,
  Fingerprint,
  CalendarDays,
  FileText,
  Wallet,
  Bell,
  KeyRound,
  LogOut,
  Menu,
  X,
  ShieldAlert,
  ChevronRight,
  CheckCheck,
  Bot,
  LifeBuoy,
  Settings,
  Sparkles,
} from 'lucide-react'
import { t, type LangCode } from '@/lib/i18n'
import { fmtDateTime, fmtRelative, initials } from './lib'
import dynamic from 'next/dynamic'
import { Skeleton } from '@/components/ui/skeleton'

function ModuleSkeleton() {
  return (
    <div className="space-y-4 p-1" role="status" aria-label="Loading module">
      <Skeleton className="h-8 w-48" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  )
}

const DynModules: Record<string, React.ComponentType<any>> = {
  'dashboard': dynamic(() => import('./modules/Dashboard').then(m => ({ default: (p: any) => <m.Dashboard {...p} /> })), { loading: ModuleSkeleton }),
  'profile': dynamic(() => import('./modules/MyProfile').then(m => ({ default: (p: any) => <m.MyProfile {...p} /> })), { loading: ModuleSkeleton }),
  'attendance': dynamic(() => import('./modules/Attendance').then(m => ({ default: (p: any) => <m.Attendance {...p} /> })), { loading: ModuleSkeleton }),
  'leave': dynamic(() => import('./modules/ApplyLeave').then(m => ({ default: (p: any) => <m.ApplyLeave {...p} /> })), { loading: ModuleSkeleton }),
  'documents': dynamic(() => import('./modules/Documents').then(m => ({ default: (p: any) => <m.Documents {...p} /> })), { loading: ModuleSkeleton }),
  'salary': dynamic(() => import('./modules/SalarySlips').then(m => ({ default: (p: any) => <m.SalarySlips {...p} /> })), { loading: ModuleSkeleton }),
  'notifications': dynamic(() => import('./modules/Notifications').then(m => ({ default: (p: any) => <m.Notifications {...p} /> })), { loading: ModuleSkeleton }),
  'password': dynamic(() => import('./modules/ChangePassword').then(m => ({ default: (p: any) => <m.ChangePassword {...p} /> })), { loading: ModuleSkeleton }),
}

import { HpAiChat } from '@/components/shared/HpAiChat'
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher'
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import { FollowUs } from '@/components/shared/FollowUs'
import { SocialLinks } from '@/components/shared/SocialLinks'

export type ModuleKey =
  | 'dashboard'
  | 'profile'
  | 'attendance'
  | 'leave'
  | 'documents'
  | 'salary'
  | 'notifications'
  | 'password'
  | 'aiAssistant'
  | 'helpDesk'
  | 'settings'

interface NavItem {
  key: ModuleKey
  label: string
  icon: typeof LayoutDashboard
  desc: string
  comingSoon?: boolean
}

function getNav(lang: LangCode): NavItem[] {
  return [
    { key: 'dashboard', label: t('nav.dashboard', lang), icon: LayoutDashboard, desc: t('emp.desc.dashboard', lang) },
    { key: 'profile', label: t('emp.myProfile', lang), icon: UserCircle, desc: t('emp.desc.profile', lang) },
    { key: 'attendance', label: t('nav.attendance', lang), icon: Fingerprint, desc: t('emp.desc.attendance', lang) },
    { key: 'leave', label: t('emp.applyLeave', lang), icon: CalendarDays, desc: t('emp.desc.leave', lang) },
    { key: 'documents', label: t('nav.documents', lang), icon: FileText, desc: t('emp.desc.documents', lang) },
    { key: 'salary', label: t('emp.salarySlips', lang), icon: Wallet, desc: t('emp.desc.salary', lang) },
    { key: 'notifications', label: t('nav.notifications', lang), icon: Bell, desc: t('emp.desc.notifications', lang) },
    { key: 'aiAssistant', label: t('emp.aiAssistant', lang), icon: Bot, desc: t('emp.desc.aiAssistant', lang), comingSoon: true },
    { key: 'helpDesk', label: t('emp.helpDesk', lang), icon: LifeBuoy, desc: t('emp.desc.helpDesk', lang), comingSoon: true },
    { key: 'settings', label: t('emp.settings', lang), icon: Settings, desc: t('emp.desc.settings', lang), comingSoon: true },
    { key: 'password', label: t('emp.changePassword', lang), icon: KeyRound, desc: t('emp.desc.password', lang) },
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

/* ── Coming Soon Placeholder ── */
function ComingSoonPlaceholder({
  icon: Icon,
  label,
  desc,
  lang,
}: {
  icon: typeof LayoutDashboard
  label: string
  desc: string
  lang: LangCode
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center" role="status">
      <div className="rounded-2xl border-2 border-dashed border-muted-foreground/25 bg-muted/40 px-8 py-10 max-w-sm">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[var(--gold)]/10">
          <Icon className="h-8 w-8 text-[var(--gold)]" />
        </div>
        <h2 className="mt-5 text-xl font-bold text-[var(--navy)] dark:text-white">{label}</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">{desc}</p>
        <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[var(--gold)]/10 px-3 py-1 text-xs font-semibold text-[var(--gold)]">
          <Sparkles className="h-3.5 w-3.5" />
          {t('emp.comingSoon', lang)}
        </span>
      </div>
    </div>
  )
}

export function EmployeeLayout() {
  const { user, logout, lang } = useAuth()
  const [active, setActive] = useState<ModuleKey>('dashboard')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationLite[]>([])
  const [unread, setUnread] = useState(0)
  const [now, setNow] = useState(new Date())
  const [bellOpen, setBellOpen] = useState(false)
  // bump key when refetch needed across modules (e.g., after notification SSE)
  const [refreshKey, setRefreshKey] = useState(0)
  const sseRef = useRef<EventSource | null>(null)

  const emp = user?.employee
  const empName = emp?.fullName || user?.username || 'Employee'
  const empCode = emp?.employeeCode || '—'
  const empDesignation = emp?.designation || '—'
  const empDept = emp?.department || '—'

  const loadNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications', { cache: 'no-store' })
      if (!res.ok) return
      const data = await res.json()
      setNotifications(data.notifications || [])
      setUnread(data.unread || 0)
    } catch {}
  }, [])

  // Prefetch all employee data for instant module loads
  useEffect(() => {
    prefetch(['emp:notifications'], '/api/notifications')
    prefetch(['emp:dashboard'], '/api/employee/dashboard')
    prefetch(['emp:profile'], '/api/employee/profile')
    prefetch(['emp:attendance'], '/api/employee/attendance')
    prefetch(['emp:salary-slips'], '/api/employee/salary-slips')
  }, [])

  // Initial notifications load
  useEffect(() => {
    let cancelled = false
    cachedFetch('emp:notifications', '/api/notifications')
      .then(({ data }) => {
        if (cancelled || !data) return
        setNotifications(data.notifications || [])
        setUnread(data.unread || 0)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
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
            loadNotifications()
            setRefreshKey((k) => k + 1)
          }
        } catch {}
      }
      es.onerror = () => {
        // SSE disconnects are expected occasionally; browser auto-reconnects.
      }
    } catch {}
    return () => {
      try { es?.close() } catch {}
    }
  }, [loadNotifications])

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
      toast.success(t('nav.allMarkedRead', lang))
    } catch {
      toast.error(t('nav.notifFailed', lang))
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
    cacheInvalidate()
    await logout()
    toast.success(t('nav.signedOut', lang))
  }

  const nav = getNav(lang)
  const currentNav = nav.find((n) => n.key === active)

  const sidebarInner = (
    <div className="flex h-full flex-col text-slate-200">
      {/* Brand */}
      <div className="px-5 pt-5 pb-4 border-b border-white/10">
        <BrandLogo />
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto scroll-thin px-3 py-4 space-y-1">
        {nav.map((item) => {
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
              {item.key === 'notifications' && unread > 0 && (
                <span className={cn(
                  'rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                  isActive ? 'bg-[var(--navy)] text-[var(--gold)]' : 'bg-[var(--gold)] text-[var(--navy)]'
                )}>
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
              {item.comingSoon && (
                <span className={cn(
                  'rounded-full px-1.5 py-0.5 text-[9px] font-bold leading-none',
                  isActive ? 'bg-[var(--navy)]/20 text-[var(--navy)]' : 'bg-white/10 text-blue-200/60'
                )}>
                  {t('emp.comingSoon', lang)}
                </span>
              )}
              {isActive && <ChevronRight className="h-4 w-4 text-[var(--navy)]" />}
            </button>
          )
        })}
      </nav>

      {/* Social links in sidebar */}
      <div className="border-t border-white/10 px-3 py-2">
        <SocialLinks variant="icons" className="[&_a]:text-blue-200/60 [&_a]:hover:text-[var(--gold)] [&_a]:hover:bg-white/10" />
      </div>

      {/* User card + logout */}
      <div className="border-t border-white/10 p-3">
        <div className="rounded-lg bg-white/5 p-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 ring-2 ring-[var(--gold)]/40">
              <AvatarFallback className="bg-[var(--gold)] text-[var(--navy)] text-xs font-bold">
                {initials(empName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{empName}</p>
              <p className="truncate text-[11px] text-blue-200/70">{empCode} • {empDesignation}</p>
            </div>
          </div>
          <Button
            onClick={handleLogout}
            variant="ghost"
            size="sm"
            className="mt-3 w-full justify-start gap-2 text-blue-100/80 hover:bg-white/10 hover:text-white"
          >
            <LogOut className="h-4 w-4" /> {t('nav.signOut', lang)}
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
            <SheetTitle className="sr-only">HP ENTERPRISE Employee Portal Navigation</SheetTitle>
            <SheetDescription className="sr-only">Employee self-service portal navigation with access to your dashboard, attendance, leaves, and documents.</SheetDescription>
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
              <LanguageSwitcher />
              <ThemeToggle />
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
                    <p className="text-sm font-semibold text-[var(--navy)] dark:text-white">{t('nav.notifications', lang)}</p>
                    {unread > 0 && (
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={markAllRead}>
                        <CheckCheck className="mr-1 h-3.5 w-3.5" /> {t('nav.markAllRead', lang)}
                      </Button>
                    )}
                  </div>
                  <div className="max-h-80 overflow-y-auto scroll-thin">
                    {notifications.length === 0 ? (
                      <div className="py-8 text-center text-sm text-muted-foreground">
                        <Bell className="mx-auto mb-2 h-6 w-6 opacity-50" />
                        {t('nav.noNotifications', lang)}
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
                  <button
                    className="w-full px-3 py-2.5 text-center text-xs font-semibold text-[var(--navy)] hover:bg-muted dark:text-[var(--gold-light)]"
                    onClick={() => { handleNavigate('notifications'); setBellOpen(false) }}
                  >
                    {t('nav.viewAllNotifs', lang)}
                  </button>
                </DropdownMenuContent>
              </DropdownMenu>

              <Avatar className="hidden sm:block h-9 w-9 ring-2 ring-[var(--gold)]/40">
                <AvatarFallback className="bg-[var(--navy)] text-[var(--gold)] text-xs font-bold">
                  {initials(empName)}
                </AvatarFallback>
              </Avatar>
            </div>
          </header>

          {/* Must-reset-password banner */}
          {user?.mustResetPassword && active !== 'password' && (
            <div className="flex items-center justify-between gap-3 border-b border-amber-500/30 bg-amber-500/10 px-4 py-2.5 sm:px-6">
              <div className="flex items-center gap-2 text-sm text-amber-800 dark:text-amber-300">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span className="font-medium">{t('emp.mustReset', lang)}</span>
              </div>
              <Button size="sm" onClick={() => setActive('password')} className="bg-amber-600 hover:bg-amber-700 text-white">
                {t('emp.changeNow', lang)}
              </Button>
            </div>
          )}

          {/* Module content */}
          <main className="flex-1 overflow-y-auto scroll-thin">
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
              {active === 'dashboard' && <DynModules.dashboard onNavigate={handleNavigate} refreshKey={refreshKey} />}
              {active === 'profile' && <DynModules.profile refreshKey={refreshKey} />}
              {active === 'attendance' && <DynModules.attendance refreshKey={refreshKey} />}
              {active === 'leave' && <DynModules.leave refreshKey={refreshKey} />}
              {active === 'documents' && <DynModules.documents />}
              {active === 'salary' && <DynModules.salary />}
              {active === 'notifications' && <DynModules.notifications onChanged={loadNotifications} />}
              {active === 'password' && <DynModules.password />}
              {(active === 'aiAssistant' || active === 'helpDesk' || active === 'settings') && (
                <ComingSoonPlaceholder
                  icon={nav.find(n => n.key === active)?.icon || Sparkles}
                  label={currentNav?.label || ''}
                  desc={currentNav?.desc || ''}
                  lang={lang}
                />
              )}
            </div>
          </main>
        </div>
      </div>

      {/* Sticky footer */}
      <footer className="mt-auto border-t bg-card px-4 py-3 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <FollowUs variant="inline" heading="" showLabels={false} className="mb-2" />
          <div className="flex flex-col items-center justify-between gap-1 text-xs text-muted-foreground sm:flex-row">
            <p>© 2025 HP ENTERPRISE Safety Service & Man Power Supply • Employee Portal</p>
            <p className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              {t('footer.systemsOperational', lang)}
            </p>
          </div>
        </div>
      </footer>

      <HpAiChat />


    </div>
  )
}
