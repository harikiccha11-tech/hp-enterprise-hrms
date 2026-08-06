'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useAuth, prefetch, cachedFetch, cacheInvalidate, cacheGet } from '@/lib/store'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
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
import { Sun, Moon } from 'lucide-react'
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
  BarChart3,
  Send,
  Trash2,
  Plus,
  TicketCheck,
  FileDown,
  FileSpreadsheet,
  Clock,
  User,
  Mail,
  Monitor,
  BellRing,
  Lock,
  AlertCircle,
  CircleDot,
  CheckCircle2,
  Loader2,
  MessageSquare,
  Zap,
  BookOpen,
  HeartPulse,
  Wallet as WalletIcon, ArrowLeftRight,
} from 'lucide-react'
import { t, type LangCode, LANGUAGES } from '@/lib/i18n'
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
  | 'reports'

interface NavItem {
  key: ModuleKey
  label: string
  icon: typeof LayoutDashboard
  desc: string
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
    { key: 'aiAssistant', label: t('emp.aiAssistant', lang), icon: Bot, desc: t('emp.desc.aiAssistant', lang) },
    { key: 'helpDesk', label: t('emp.helpDesk', lang), icon: LifeBuoy, desc: t('emp.desc.helpDesk', lang) },
    { key: 'settings', label: t('emp.settings', lang), icon: Settings, desc: t('emp.desc.settings', lang) },
    { key: 'reports', label: t('emp.reports', lang), icon: BarChart3, desc: t('emp.desc.reports', lang) },
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

/* ═══════════════════════════════════════════════════════
   INLINE MODULES — AiAssistant, HelpDesk, Settings, Reports
   ═══════════════════════════════════════════════════════ */

/* ── Markdown renderer (shared with HpAiChat pattern) ── */
function renderMd(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>
    }
    return <span key={i}>{part}</span>
  })
}

/* ── AI Assistant Module ── */
function AiAssistantModule({ lang }: { lang: LangCode }) {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages, loading])

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [])

  const handleSend = useCallback(async (text?: string) => {
    const trimmed = (text || input).trim()
    if (!trimmed || loading) return
    setMessages(prev => [...prev, { role: 'user', content: trimmed }])
    setInput('')
    setLoading(true)
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed }),
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ ${t('hpai.error', lang)}` }])
    } finally {
      setLoading(false)
    }
  }, [input, loading, lang])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const handleClear = () => {
    setMessages([])
    fetch('/api/ai/chat', { method: 'DELETE' }).catch(() => {})
  }

  const quickActions = [
    { icon: FileText, label: 'Explain My Payslip', prompt: 'Please explain my latest payslip breakdown — basic salary, HRA, deductions, and net pay.', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400' },
    { icon: CalendarDays, label: 'Apply for Leave', prompt: 'I want to apply for leave. What types of leave are available to me and what is my current balance?', color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40 dark:text-blue-400' },
    { icon: BookOpen, label: 'Company Policies', prompt: 'What are the key company policies I should know about — working hours, dress code, leave policy, and code of conduct?', color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/40 dark:text-purple-400' },
    { icon: Clock, label: 'Attendance Summary', prompt: 'Can you give me a summary of my attendance this month — how many days present, absent, late, or on leave?', color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400' },
    { icon: HeartPulse, label: 'My Benefits', prompt: 'What benefits am I entitled to as an employee — insurance, PF, ESI, bonuses, and other perks?', color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-400' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[var(--navy)] dark:text-white">HPAI — AI Assistant</h2>
          <p className="text-sm text-muted-foreground">Your intelligent HR companion powered by HP AI</p>
        </div>
        {messages.length > 0 && (
          <Button variant="outline" size="sm" onClick={handleClear} className="gap-1.5">
            <Trash2 className="h-3.5 w-3.5" /> Clear Chat
          </Button>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {quickActions.map((qa) => {
          const QaIcon = qa.icon
          return (
            <button
              key={qa.label}
              onClick={() => handleSend(qa.prompt)}
              className="group flex flex-col items-center gap-2 rounded-xl border bg-card p-4 text-center transition-all hover:shadow-md hover:border-[var(--gold)]/50"
            >
              <div className={cn('grid h-10 w-10 place-items-center rounded-lg', qa.color)}>
                <QaIcon className="h-5 w-5" />
              </div>
              <span className="text-xs font-semibold text-foreground leading-tight">{qa.label}</span>
            </button>
          )
        })}
      </div>

      {/* Chat Area */}
      <div className="rounded-xl border bg-card overflow-hidden">
        {/* Chat header */}
        <div className="flex items-center gap-3 border-b bg-gradient-to-r from-[var(--navy)] to-[var(--navy-light)] px-4 py-3">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--gold)]/20">
            <Sparkles className="h-4 w-4 text-[var(--gold)]" />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-tight">HPAI Chat</p>
            <p className="text-[10px] text-[var(--gold-light)] leading-tight">Employee AI Assistant</p>
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="max-h-[400px] overflow-y-auto scroll-thin px-4 py-4 space-y-3">
          {messages.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="grid h-16 w-16 place-items-center rounded-full bg-[var(--gold)]/10 mb-4">
                <Bot className="h-8 w-8 text-[var(--gold)]" />
              </div>
              <p className="text-sm font-semibold text-[var(--navy)] dark:text-white">Ask HPAI anything about HR</p>
              <p className="mt-1 text-xs text-muted-foreground max-w-xs">Use the quick actions above or type your question below. I can help with payslips, leaves, policies, and more.</p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={cn('flex w-full', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
              <div className={cn(
                'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap break-words',
                msg.role === 'user'
                  ? 'bg-[var(--navy)] text-white rounded-br-md'
                  : 'bg-muted text-foreground rounded-bl-md'
              )}>
                {renderMd(msg.content)}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-md bg-muted px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[var(--navy)] dark:bg-[var(--gold)] animate-bounce [animation-delay:0ms]" />
                  <span className="h-2 w-2 rounded-full bg-[var(--navy)] dark:bg-[var(--gold)] animate-bounce [animation-delay:150ms]" />
                  <span className="h-2 w-2 rounded-full bg-[var(--navy)] dark:bg-[var(--gold)] animate-bounce [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t px-3 py-2.5">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('hpai.placeholder', lang)}
              rows={1}
              className="flex-1 resize-none rounded-xl border bg-background px-3 py-2 text-[13px] leading-snug outline-none focus:ring-2 focus:ring-[var(--gold)]/50 max-h-20 min-h-[36px]"
              style={{ fieldSizing: 'content' } as React.CSSProperties}
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--navy)] text-white disabled:opacity-40 hover:opacity-90 transition-opacity"
              aria-label="Send message"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Help Desk Module ── */
interface HelpTicket {
  id: string
  subject: string
  category: string
  priority: string
  description: string
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed'
  createdAt: string
}

const TICKET_CATEGORIES = ['Technical', 'HR', 'Payroll', 'Leave', 'Documents', 'General'] as const
const TICKET_PRIORITIES = ['Low', 'Medium', 'High', 'Critical'] as const
const TICKET_STORAGE_KEY = 'hpe-emp-tickets'

function HelpDeskModule({ lang }: { lang: LangCode }) {
  const [tickets, setTickets] = useState<HelpTicket[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      const saved = localStorage.getItem(TICKET_STORAGE_KEY)
      if (saved) return JSON.parse(saved)
    } catch {}
    return []
  })
  const [showForm, setShowForm] = useState(false)
  const [subject, setSubject] = useState('')
  const [category, setCategory] = useState('General')
  const [priority, setPriority] = useState('Medium')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const saveTickets = (tix: HelpTicket[]) => {
    setTickets(tix)
    try { localStorage.setItem(TICKET_STORAGE_KEY, JSON.stringify(tix)) } catch {}
  }

  const handleSubmit = () => {
    if (!subject.trim() || !description.trim()) {
      toast.error('Please fill in the subject and description.')
      return
    }
    setSubmitting(true)
    setTimeout(() => {
      const newTicket: HelpTicket = {
        id: `TKT-${Date.now().toString(36).toUpperCase()}`,
        subject: subject.trim(),
        category,
        priority,
        description: description.trim(),
        status: 'Open',
        createdAt: new Date().toISOString(),
      }
      saveTickets([newTicket, ...tickets])
      setSubject(''); setDescription(''); setCategory('General'); setPriority('Medium')
      setShowForm(false)
      setSubmitting(false)
      toast.success(`Ticket ${newTicket.id} created successfully!`)
    }, 600)
  }

  const statusColor = (s: string) => {
    switch (s) {
      case 'Open': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
      case 'In Progress': return 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
      case 'Resolved': return 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400'
      case 'Closed': return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
      default: return 'bg-muted text-muted-foreground'
    }
  }

  const priorityColor = (p: string) => {
    switch (p) {
      case 'Low': return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
      case 'Medium': return 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400'
      case 'High': return 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400'
      case 'Critical': return 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400'
      default: return 'bg-muted text-muted-foreground'
    }
  }

  const statCards = [
    { label: 'Open', value: tickets.filter(t => t.status === 'Open').length, icon: CircleDot, color: 'text-emerald-600' },
    { label: 'In Progress', value: tickets.filter(t => t.status === 'In Progress').length, icon: Loader2, color: 'text-amber-600' },
    { label: 'Resolved', value: tickets.filter(t => t.status === 'Resolved').length, icon: CheckCircle2, color: 'text-blue-600' },
    { label: 'Total', value: tickets.length, icon: TicketCheck, color: 'text-[var(--navy)]' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[var(--navy)] dark:text-white">Help Desk</h2>
          <p className="text-sm text-muted-foreground">Submit and track support tickets</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-1.5">
          <Plus className="h-4 w-4" /> {showForm ? 'Cancel' : 'New Ticket'}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map(sc => {
          const ScIcon = sc.icon
          return (
            <div key={sc.label} className="rounded-xl border bg-card p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-[var(--navy)] dark:text-white">{sc.value}</p>
                  <p className="text-xs text-muted-foreground">{sc.label}</p>
                </div>
                <div className={cn('grid h-10 w-10 place-items-center rounded-lg bg-muted', sc.color)}>
                  <ScIcon className="h-5 w-5" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* New Ticket Form */}
      {showForm && (
        <div className="rounded-xl border bg-card p-6 space-y-4">
          <h3 className="font-semibold text-[var(--navy)] dark:text-white">Create New Ticket</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="tk-subject">Subject</Label>
              <Input id="tk-subject" placeholder="Brief description of your issue" value={subject} onChange={e => setSubject(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TICKET_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TICKET_PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="tk-desc">Description</Label>
              <Textarea id="tk-desc" placeholder="Describe your issue in detail…" rows={4} value={description} onChange={e => setDescription(e.target.value)} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={submitting} className="gap-1.5">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {submitting ? 'Submitting…' : 'Submit Ticket'}
            </Button>
          </div>
        </div>
      )}

      {/* Tickets List */}
      <div className="rounded-xl border bg-card">
        <div className="border-b px-4 py-3">
          <h3 className="font-semibold text-[var(--navy)] dark:text-white">Recent Tickets</h3>
        </div>
        {tickets.length === 0 ? (
          <div className="py-12 text-center">
            <LifeBuoy className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">No tickets yet. Create your first support ticket above.</p>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto scroll-thin">
            {tickets.map(tk => (
              <div key={tk.id} className="flex flex-col gap-2 border-b px-4 py-3 last:border-b-0 hover:bg-muted/40 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-bold text-muted-foreground">{tk.id}</span>
                      <Badge variant="secondary" className={cn('text-[10px]', statusColor(tk.status))}>{tk.status}</Badge>
                      <Badge variant="secondary" className={cn('text-[10px]', priorityColor(tk.priority))}>{tk.priority}</Badge>
                      <Badge variant="outline" className="text-[10px]">{tk.category}</Badge>
                    </div>
                    <p className="mt-1 text-sm font-medium text-[var(--navy)] dark:text-white truncate">{tk.subject}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{tk.description}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap shrink-0">{fmtRelative(tk.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Settings Module ── */
function SettingsModule({ lang, onNavigate }: { lang: LangCode; onNavigate: (k: ModuleKey) => void }) {
  const { user, setLang, darkMode, toggleDarkMode } = useAuth()
  const emp = user?.employee
  const empName = emp?.fullName || user?.username || 'Employee'

  const [notifPrefs, setNotifPrefs] = useState(() => {
    if (typeof window === 'undefined') return { email: true, push: true, inApp: true }
    try {
      const saved = localStorage.getItem('hpe-notif-prefs')
      if (saved) return JSON.parse(saved)
    } catch {}
    return { email: true, push: true, inApp: true }
  })

  const saveNotifPrefs = (prefs: typeof notifPrefs) => {
    setNotifPrefs(prefs)
    try { localStorage.setItem('hpe-notif-prefs', JSON.stringify(prefs)) } catch {}
    toast.success('Notification preferences saved')
  }

  const sessionInfo = typeof window !== 'undefined' ? {
    browser: navigator.userAgent?.includes('Chrome') ? 'Chrome' : navigator.userAgent?.includes('Firefox') ? 'Firefox' : navigator.userAgent?.includes('Safari') ? 'Safari' : 'Browser',
    loginTime: new Date().toLocaleString(),
  } : null

  return (
    <div className="space-y-6">
      {/* Profile Summary */}
      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14 ring-2 ring-[var(--gold)]/40">
            <AvatarFallback className="bg-[var(--navy)] text-[var(--gold)] text-lg font-bold">{initials(empName)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-[var(--navy)] dark:text-white truncate">{empName}</h3>
            <p className="text-sm text-muted-foreground">{emp?.designation || '—'} • {emp?.department || '—'}</p>
            <p className="text-xs text-muted-foreground">{user?.email || '—'} • {emp?.employeeCode || '—'}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => onNavigate('profile')} className="gap-1.5">
            <User className="h-3.5 w-3.5" /> Edit Profile
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Appearance */}
        <div className="rounded-xl border bg-card p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Monitor className="h-5 w-5 text-[var(--navy)] dark:text-white" />
            <h3 className="font-semibold text-[var(--navy)] dark:text-white">Appearance</h3>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {darkMode ? <Moon className="h-4 w-4 text-muted-foreground" /> : <Sun className="h-4 w-4 text-muted-foreground" />}
              <div>
                <p className="text-sm font-medium">Theme</p>
                <p className="text-xs text-muted-foreground">{darkMode ? 'Dark mode' : 'Light mode'}</p>
              </div>
            </div>
            <Switch checked={darkMode} onCheckedChange={toggleDarkMode} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Language</p>
                <p className="text-xs text-muted-foreground">Choose your preferred language</p>
              </div>
            </div>
            <Select value={lang} onValueChange={(v: LangCode) => setLang(v)}>
              <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {LANGUAGES.map(l => (
                  <SelectItem key={l.code} value={l.code}>{l.native}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Notifications */}
        <div className="rounded-xl border bg-card p-6 space-y-4">
          <div className="flex items-center gap-2">
            <BellRing className="h-5 w-5 text-[var(--navy)] dark:text-white" />
            <h3 className="font-semibold text-[var(--navy)] dark:text-white">Notifications</h3>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Email Notifications</p>
                <p className="text-xs text-muted-foreground">Receive updates via email</p>
              </div>
            </div>
            <Switch checked={notifPrefs.email} onCheckedChange={v => saveNotifPrefs({ ...notifPrefs, email: v })} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Push Notifications</p>
                <p className="text-xs text-muted-foreground">Browser push alerts</p>
              </div>
            </div>
            <Switch checked={notifPrefs.push} onCheckedChange={v => saveNotifPrefs({ ...notifPrefs, push: v })} />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">In-App Notifications</p>
                <p className="text-xs text-muted-foreground">Show alerts within the portal</p>
              </div>
            </div>
            <Switch checked={notifPrefs.inApp} onCheckedChange={v => saveNotifPrefs({ ...notifPrefs, inApp: v })} />
          </div>
        </div>

        {/* Account */}
        <div className="rounded-xl border bg-card p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-[var(--navy)] dark:text-white" />
            <h3 className="font-semibold text-[var(--navy)] dark:text-white">Account</h3>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Change Password</p>
                <p className="text-xs text-muted-foreground">Update your account password</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => onNavigate('password')} className="gap-1.5">
              <KeyRound className="h-3.5 w-3.5" /> Change
            </Button>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Username</p>
                <p className="text-xs text-muted-foreground">{user?.username || '—'}</p>
              </div>
            </div>
            <Badge variant="secondary" className="text-[10px]">{user?.role || 'EMPLOYEE'}</Badge>
          </div>
        </div>

        {/* Session Info */}
        <div className="rounded-xl border bg-card p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-[var(--navy)] dark:text-white" />
            <h3 className="font-semibold text-[var(--navy)] dark:text-white">Session</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Browser</span>
              <span className="text-sm font-medium">{sessionInfo?.browser || '—'}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Login Time</span>
              <span className="text-sm font-medium">{sessionInfo?.loginTime || '—'}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <div className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="text-sm font-medium text-emerald-600">Active</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Reports Module ── */
function ReportsModule({ lang }: { lang: LangCode }) {
  const [attendanceData, setAttendanceData] = useState<any>(null)
  const [salaryData, setSalaryData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      cachedFetch('emp:attendance', '/api/employee/attendance'),
      cachedFetch('emp:salary-slips', '/api/employee/salary-slips'),
    ]).then(([att, sal]) => {
      if (cancelled) return
      if (att.data) setAttendanceData(att.data)
      if (sal.data) setSalaryData(sal.data)
    }).catch(() => {}).finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  if (loading) return <ModuleSkeleton />

  const records = attendanceData?.records || attendanceData?.attendance || []
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  const thisMonthRecords = records.filter((r: any) => {
    const d = new Date(r.date || r.createdAt || r.punchIn)
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear
  })

  const presentDays = thisMonthRecords.filter((r: any) => r.status === 'PRESENT' || r.punchIn).length
  const absentDays = thisMonthRecords.filter((r: any) => r.status === 'ABSENT').length
  const lateDays = thisMonthRecords.filter((r: any) => r.lateMinutes > 0 || r.status === 'LATE').length
  const halfDays = thisMonthRecords.filter((r: any) => r.status === 'HALF_DAY').length
  const workingDays = thisMonthRecords.length || new Date(currentYear, currentMonth + 1, 0).getDate()

  const attCards = [
    { label: 'Present Days', value: presentDays, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400' },
    { label: 'Absent Days', value: absentDays, icon: X, color: 'text-red-600 bg-red-50 dark:bg-red-950/40 dark:text-red-400' },
    { label: 'Late Arrivals', value: lateDays, icon: Clock, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400' },
    { label: 'Half Days', value: halfDays, icon: AlertCircle, color: 'text-orange-600 bg-orange-50 dark:bg-orange-950/40 dark:text-orange-400' },
  ]

  // Leave summary (from dashboard or attendance data)
  const leaveBalance = attendanceData?.leaveBalance || attendanceData?.leaveSummary || [
    { type: 'Casual Leave', balance: 12, used: 2 },
    { type: 'Sick Leave', balance: 10, used: 1 },
    { type: 'Earned Leave', balance: 15, used: 0 },
    { type: 'Compensatory Off', balance: 2, used: 0 },
  ]

  // Salary history
  const slips = salaryData?.slips || salaryData?.salarySlips || []
  const recentSlips = slips.slice(0, 6).reverse()
  const maxNet = Math.max(...recentSlips.map((s: any) => s.netPay || s.netSalary || 0), 1)

  const handleExport = (type: 'csv' | 'pdf') => {
    toast.info(`${type.toUpperCase()} export coming in next release`)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-[var(--navy)] dark:text-white">My Reports</h2>
          <p className="text-sm text-muted-foreground">Attendance, leave & salary analytics for {format(now, 'MMMM yyyy')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => handleExport('csv')} className="gap-1.5">
            <FileSpreadsheet className="h-3.5 w-3.5" /> CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('pdf')} className="gap-1.5">
            <FileDown className="h-3.5 w-3.5" /> PDF
          </Button>
        </div>
      </div>

      {/* Attendance Summary */}
      <div className="rounded-xl border bg-card">
        <div className="border-b px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Fingerprint className="h-4 w-4 text-[var(--navy)] dark:text-white" />
            <h3 className="font-semibold text-[var(--navy)] dark:text-white">Attendance Summary</h3>
          </div>
          <Badge variant="outline" className="text-[10px]">This Month</Badge>
        </div>
        <div className="grid grid-cols-2 gap-px bg-border lg:grid-cols-4">
          {attCards.map(ac => {
            const AcIcon = ac.icon
            return (
              <div key={ac.label} className="bg-card p-4">
                <div className="flex items-center gap-3">
                  <div className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-lg', ac.color)}>
                    <AcIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-[var(--navy)] dark:text-white">{ac.value}</p>
                    <p className="text-xs text-muted-foreground">{ac.label}</p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        <div className="border-t px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Working days tracked</span>
            <span className="text-sm font-semibold text-[var(--navy)] dark:text-white">{presentDays} / {workingDays}</span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[var(--navy)] to-[var(--gold)] transition-all"
              style={{ width: `${workingDays > 0 ? Math.round((presentDays / workingDays) * 100) : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Leave & Salary grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Leave Summary */}
        <div className="rounded-xl border bg-card">
          <div className="border-b px-4 py-3 flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-[var(--navy)] dark:text-white" />
            <h3 className="font-semibold text-[var(--navy)] dark:text-white">Leave Balance</h3>
          </div>
          <div className="divide-y">
            {leaveBalance.map((lv: any, i: number) => {
              const total = (lv.balance || 0) + (lv.used || 0)
              const pct = total > 0 ? Math.round((lv.used / total) * 100) : 0
              return (
                <div key={i} className="px-4 py-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{lv.type || lv.leaveType}</span>
                    <span className="text-xs text-muted-foreground">{lv.used || 0} / {total}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all', pct > 80 ? 'bg-red-500' : pct > 50 ? 'bg-amber-500' : 'bg-emerald-500')}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">{lv.balance || 0} remaining</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Salary History */}
        <div className="rounded-xl border bg-card">
          <div className="border-b px-4 py-3 flex items-center gap-2">
            <WalletIcon className="h-4 w-4 text-[var(--navy)] dark:text-white" />
            <h3 className="font-semibold text-[var(--navy)] dark:text-white">Salary History</h3>
          </div>
          {recentSlips.length === 0 ? (
            <div className="py-12 text-center">
              <WalletIcon className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No salary slips available yet</p>
            </div>
          ) : (
            <div className="space-y-0">
              {recentSlips.map((slip: any, i: number) => {
                const net = slip.netPay || slip.netSalary || 0
                const pct = maxNet > 0 ? Math.round((net / maxNet) * 100) : 0
                return (
                  <div key={i} className="flex items-center gap-3 border-b px-4 py-3 last:border-b-0">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{slip.month || slip.period || `Month ${i + 1}`}</p>
                      <p className="text-xs text-muted-foreground">{slip.year || ''}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="hidden sm:block w-24 h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-[var(--gold)]" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-sm font-bold text-[var(--navy)] dark:text-white whitespace-nowrap">
                        ₹{(net || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
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

  const handleChangePortal = () => {
    localStorage.removeItem('hpe-selected-portal')
    window.dispatchEvent(new CustomEvent('hpe-portal-change'))
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
            onClick={handleChangePortal}
            variant="ghost"
            size="sm"
            className="mt-3 w-full justify-start gap-2 text-blue-100/80 hover:bg-white/10 hover:text-white"
          >
            <ArrowLeftRight className="h-4 w-4" /> Change Portal
          </Button>
          <Button
            onClick={handleLogout}
            variant="ghost"
            size="sm"
            className="mt-1 w-full justify-start gap-2 text-blue-100/80 hover:bg-white/10 hover:text-white"
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
              {active === 'aiAssistant' && <AiAssistantModule lang={lang} />}
              {active === 'helpDesk' && <HelpDeskModule lang={lang} />}
              {active === 'settings' && <SettingsModule lang={lang} onNavigate={handleNavigate} />}
              {active === 'reports' && <ReportsModule lang={lang} />}
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
