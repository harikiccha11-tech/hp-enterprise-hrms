'use client'
import { useEffect, useState } from 'react'
import { useAuth, useAppStore, prefetch, cachedFetch, cacheInvalidate } from '@/lib/store'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
// Toaster is in root layout
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
  Wallet,
  CalendarClock,
  LayoutGrid,
  Clock,
  CalendarOff,
  Banknote,
  FolderOpen,
  CreditCard,
  BarChart3,
  Download,
  Sparkles,
  Headphones,
  Settings,
  Send,
  Info,
  Search,
  FileDown,
  Check,
  Crown,
  Shield,
  Zap,
  Star,
  CalendarDays,
  UserCheck,
  UserX,
  Timer, ArrowLeftRight,
} from 'lucide-react'
import { t, type LangCode } from '@/lib/i18n'
import { HpAiChat } from '@/components/shared/HpAiChat'
import { FollowUs } from '@/components/shared/FollowUs'
import { SocialLinks } from '@/components/shared/SocialLinks'
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher'
import { ThemeToggle } from '@/components/shared/ThemeToggle'

// ── Types ──────────────────────────────────────────────────────────────────

type ClientView =
  | 'dashboard'
  | 'company-profile'
  | 'employees'
  | 'departments'
  | 'attendance'
  | 'leave'
  | 'payroll'
  | 'projects'
  | 'documents'
  | 'invoices'
  | 'subscription'
  | 'billing'
  | 'reports'
  | 'downloads'
  | 'ai-assistant'
  | 'notifications'
  | 'support'
  | 'settings'
  | 'work-orders'

interface NavItem {
  key: ClientView
  label: string
  icon: typeof LayoutDashboard
  desc: string
}

interface ClientInfo {
  id: string
  clientName: string
  companyName: string | null
  email: string | null
  phone: string | null
  address: string | null
  gst: string | null
}

interface DashboardProject {
  id: string
  projectName: string
  site: string | null
  startDate: string | null
  endDate: string | null
  status: string
  description: string | null
  memberCount: number
}

interface DashboardWorkOrder {
  id: string
  woNumber: string
  title: string
  value: number
  startDate: string | null
  endDate: string | null
  status: string
  projectName: string | null
}

interface DashboardInvoice {
  id: string
  invoiceNumber: string
  amount: number
  tax: number
  total: number
  status: string
  issueDate: string
  dueDate: string | null
  workOrderTitle: string | null
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
  client: ClientInfo
  stats: {
    totalProjects: number
    activeProjects: number
    workOrderValue: number
    invoiceTotal: number
    paidAmount: number
  }
  projects: DashboardProject[]
  workOrders: DashboardWorkOrder[]
  invoices: DashboardInvoice[]
  announcements: { id: string; title: string; message: string; createdAt: string }[]
  unreadNotifications: number
}

// ── Helpers ────────────────────────────────────────────────────────────────

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('')
}

function formatINR(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

function fmtDate(d: string | null | undefined): string {
  if (!d) return '—'
  try {
    return format(new Date(d), 'dd MMM yyyy')
  } catch {
    return '—'
  }
}

function statusColor(status: string): string {
  const s = status.toUpperCase()
  if (s === 'ACTIVE' || s === 'OPEN' || s === 'PAID') return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/25'
  if (s === 'COMPLETED' || s === 'SENT') return 'bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-500/25'
  if (s === 'ON_HOLD' || s === 'DRAFT') return 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/25'
  if (s === 'REJECTED' || s === 'OVERDUE') return 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/25'
  if (s === 'CLOSED') return 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/25'
  return 'bg-primary/10 text-primary border-primary/20'
}

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={cn('text-[11px]', statusColor(status))}>
      {status.replace(/_/g, ' ')}
    </Badge>
  )
}

// ── Navigation ─────────────────────────────────────────────────────────────

function getNav(lang: LangCode): NavItem[] {
  return [
    { key: 'dashboard', label: t('client.dashboard', lang), icon: LayoutDashboard, desc: t('client.desc.dashboard', lang) },
    { key: 'company-profile', label: t('client.companyProfile', lang), icon: Building2, desc: t('client.desc.companyProfile', lang) },
    { key: 'employees', label: t('client.employees', lang), icon: Users, desc: t('client.desc.employees', lang) },
    { key: 'departments', label: t('client.departments', lang), icon: LayoutGrid, desc: t('client.desc.departments', lang) },
    { key: 'attendance', label: t('client.attendance', lang), icon: Clock, desc: t('client.desc.attendance', lang) },
    { key: 'leave', label: t('client.leave', lang), icon: CalendarOff, desc: t('client.desc.leave', lang) },
    { key: 'payroll', label: t('client.payroll', lang), icon: Banknote, desc: t('client.desc.payroll', lang) },
    { key: 'projects', label: t('client.projects', lang), icon: Briefcase, desc: t('client.desc.projects', lang) },
    { key: 'documents', label: t('client.documents', lang), icon: FolderOpen, desc: t('client.desc.documents', lang) },
    { key: 'invoices', label: t('client.invoices', lang), icon: FileText, desc: t('client.desc.invoices', lang) },
    { key: 'subscription', label: t('client.subscription', lang), icon: CreditCard, desc: t('client.desc.subscription', lang) },
    { key: 'billing', label: t('client.billing', lang), icon: Receipt, desc: t('client.desc.billing', lang) },
    { key: 'reports', label: t('client.reports', lang), icon: BarChart3, desc: t('client.desc.reports', lang) },
    { key: 'downloads', label: t('client.downloads', lang), icon: Download, desc: t('client.desc.downloads', lang) },
    { key: 'ai-assistant', label: t('client.aiAssistant', lang), icon: Sparkles, desc: t('client.desc.aiAssistant', lang) },
    { key: 'notifications', label: t('client.notifications', lang), icon: Bell, desc: t('client.desc.notifications', lang) },
    { key: 'support', label: t('client.support', lang), icon: Headphones, desc: t('client.desc.support', lang) },
    { key: 'settings', label: t('client.settings', lang), icon: Settings, desc: t('client.desc.settings', lang) },
    { key: 'work-orders', label: t('client.workOrders', lang), icon: ClipboardList, desc: t('client.desc.workOrders', lang) },
  ]
}

// ── Empty State Card (reusable) ──────────────────────────────────────────

function EmptyStateView({ icon: Icon, title, message }: { icon: typeof LayoutDashboard; title: string; message: string }) {
  return (
    <Card className="mx-auto max-w-lg">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-muted">
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-lg font-semibold text-[var(--navy)] dark:text-white">{title}</h2>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground leading-relaxed">{message}</p>
      </CardContent>
    </Card>
  )
}

// ── Company Profile View ─────────────────────────────────────────────────

function CompanyProfileView({ data, loading }: { data: DashboardData | null; loading: boolean }) {
  const client = data?.client
  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-gradient-to-r from-[var(--navy)] to-[var(--navy)]/90 p-6 text-white shadow-lg">
        <h2 className="text-xl font-bold">Company Profile</h2>
        <p className="mt-1 text-sm text-blue-100/80">Your organisation details as registered with HP Enterprise.</p>
      </div>
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : (
        <Card>
          <CardHeader><CardTitle className="text-base">Organisation Information</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <InfoRow label="Contact Name" value={client?.clientName} />
            <InfoRow label="Company Name" value={client?.companyName} />
            <InfoRow label="Email Address" value={client?.email} />
            <InfoRow label="Phone Number" value={client?.phone} />
            <InfoRow label="Address" value={client?.address} className="sm:col-span-2" />
            <InfoRow label="GST Number" value={client?.gst} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function InfoRow({ label, value, className }: { label: string; value: string | null | undefined; className?: string }) {
  return (
    <div className={cn('rounded-lg border p-3', className)}>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium text-[var(--navy)] dark:text-white">{value || '—'}</p>
    </div>
  )
}

// ── Notifications View ───────────────────────────────────────────────────

function NotificationsView({ notifications, onMarkRead, onMarkAllRead, unread }: {
  notifications: NotificationLite[]
  onMarkRead: (id: string) => void
  onMarkAllRead: () => void
  unread: number
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--navy)] dark:text-white">All Notifications</h2>
          <p className="text-sm text-muted-foreground">{unread > 0 ? `You have ${unread} unread notification${unread !== 1 ? 's' : ''}` : 'You’re all caught up.'}</p>
        </div>
        {unread > 0 && (
          <Button variant="outline" size="sm" onClick={onMarkAllRead}>Mark All Read</Button>
        )}
      </div>
      <Card>
        <CardContent className="p-0">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
              <Bell className="mb-2 h-10 w-10 opacity-30" />
              <p className="text-sm font-medium">No notifications yet</p>
              <p className="mt-0.5 text-xs">New notifications will appear here</p>
            </div>
          ) : (
            <div className="max-h-[600px] divide-y overflow-y-auto scroll-thin">
              {notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => { if (!n.read) onMarkRead(n.id) }}
                  className={cn(
                    'flex w-full items-start gap-3 px-5 py-4 text-left transition-colors hover:bg-muted/50',
                    !n.read && 'bg-[var(--gold)]/5'
                  )}
                >
                  {!n.read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--gold)]" />}
                  {n.read && <span className="w-2 shrink-0" />}
                  <div className="min-w-0 flex-1">
                    <p className={cn('text-sm leading-snug', n.read ? 'text-muted-foreground' : 'font-semibold text-[var(--navy)] dark:text-white')}>{n.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{n.message}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground">{format(new Date(n.createdAt), 'dd MMM yyyy, h:mm a')}</p>
                  </div>
                  <Badge variant="outline" className={cn('shrink-0 text-[10px]', statusColor(n.type))}>{n.type.replace(/_/g, ' ')}</Badge>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ── Settings View ─────────────────────────────────────────────────────────

function SettingsView({ data, loading }: { data: DashboardData | null; loading: boolean }) {
  const client = data?.client
  const [form, setForm] = useState({ clientName: '', companyName: '', email: '', phone: '', address: '', gst: '' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (client) {
      setForm({
        clientName: client.clientName || '',
        companyName: client.companyName || '',
        email: client.email || '',
        phone: client.phone || '',
        address: client.address || '',
        gst: client.gst || '',
      })
    }
  }, [client])

  const handleSave = async () => {
    setSaving(true)
    setSaved(false)
    try {
      const res = await fetch('/api/client/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      toast.success('Profile updated successfully')
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-gradient-to-r from-[var(--navy)] to-[var(--navy)]/90 p-6 text-white shadow-lg">
        <h2 className="text-xl font-bold">Account Settings</h2>
        <p className="mt-1 text-sm text-blue-100/80">Update your contact information and organisation details.</p>
      </div>
      {loading ? (
        <Card><CardContent className="space-y-4 p-6">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</CardContent></Card>
      ) : (
        <Card>
          <CardHeader><CardTitle className="text-base">Profile Information</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="clientName">Contact Name</Label>
              <Input id="clientName" value={form.clientName} onChange={(e) => setForm((f) => ({ ...f, clientName: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="companyName">Company Name</Label>
              <Input id="companyName" value={form.companyName} onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="settingsEmail">Email Address</Label>
              <Input id="settingsEmail" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="settingsPhone">Phone Number</Label>
              <Input id="settingsPhone" type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="settingsAddress">Address</Label>
              <Input id="settingsAddress" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="settingsGst">GST Number</Label>
              <Input id="settingsGst" value={form.gst} onChange={(e) => setForm((f) => ({ ...f, gst: e.target.value }))} />
            </div>
            <div className="flex items-end">
              <Button onClick={handleSave} disabled={saving} className="gap-2">
                {saving ? 'Saving…' : 'Save Changes'}
              </Button>
              {saved && <span className="ml-3 text-sm text-emerald-600 font-medium">Saved</span>}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ── AI Assistant View ────────────────────────────────────────────────────

function AiAssistantView() {
  const setHpaiOpen = useAppStore((s) => s.setHpaiOpen)
  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-gradient-to-r from-[var(--navy)] to-[var(--navy)]/90 p-6 text-white shadow-lg">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--gold)]/20">
            <Sparkles className="h-5 w-5 text-[var(--gold)]" />
          </div>
          <div>
            <h2 className="text-xl font-bold">HPAI Assistant</h2>
            <p className="mt-0.5 text-sm text-blue-100/80">Your intelligent HR & workforce management companion.</p>
          </div>
        </div>
      </div>
      <Card className="mx-auto max-w-2xl">
        <CardContent className="flex flex-col items-center py-12 text-center">
          <div className="mb-4 grid h-20 w-20 place-items-center rounded-2xl bg-gradient-to-br from-[var(--navy)] to-[var(--navy)]/80">
            <Sparkles className="h-10 w-10 text-[var(--gold)]" />
          </div>
          <h3 className="text-lg font-bold text-[var(--navy)] dark:text-white">HPAI is Ready</h3>
          <p className="mt-2 max-w-md text-sm text-muted-foreground leading-relaxed">
            Ask questions about your projects, work orders, invoices, or any HR-related queries. HPAI provides instant, intelligent answers based on your account data.
          </p>
          <Button onClick={() => setHpaiOpen(true)} className="mt-6 gap-2">
            <Send className="h-4 w-4" /> Open Chat
          </Button>
          <p className="mt-3 text-xs text-muted-foreground">You can also click the HPAI button in the bottom-right corner at any time.</p>
        </CardContent>
      </Card>
    </div>
  )
}

// ── Support View ──────────────────────────────────────────────────────────

interface SupportTicket {
  id: string
  title: string
  message: string
  status: string
  createdAt: string
}

function SupportView() {
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchTickets = async () => {
    try {
      const res = await fetch('/api/client/support')
      if (res.ok) {
        const json = await res.json()
        setTickets(json.tickets || [])
      }
    } catch {}
    setLoading(false)
  }

  useEffect(() => { fetchTickets() }, [])

  const handleSubmit = async () => {
    if (!subject.trim() || !description.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/client/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: subject.trim(), description: description.trim() }),
      })
      if (!res.ok) throw new Error()
      toast.success('Support ticket submitted successfully')
      setSubject('')
      setDescription('')
      fetchTickets()
    } catch {
      toast.error('Failed to submit ticket')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-gradient-to-r from-[var(--navy)] to-[var(--navy)]/90 p-6 text-white shadow-lg">
        <h2 className="text-xl font-bold">Support Centre</h2>
        <p className="mt-1 text-sm text-blue-100/80">Submit and track support requests for your account.</p>
      </div>

      {/* Create Ticket Form */}
      <Card>
        <CardHeader><CardTitle className="text-base">Submit a Request</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="supportSubject">Subject</Label>
            <Input id="supportSubject" placeholder="Brief description of your issue" value={subject} onChange={(e) => setSubject(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="supportDesc">Description</Label>
            <Textarea id="supportDesc" placeholder="Provide details about your request or issue" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <Button onClick={handleSubmit} disabled={submitting || !subject.trim() || !description.trim()} className="gap-2">
            <Send className="h-4 w-4" /> {submitting ? 'Submitting…' : 'Submit Ticket'}
          </Button>
        </CardContent>
      </Card>

      {/* Ticket List */}
      <Card>
        <CardHeader><CardTitle className="text-base">Your Tickets</CardTitle></CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 p-6">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : tickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
              <Headphones className="mb-2 h-8 w-8 opacity-30" />
              <p className="text-sm font-medium">No support tickets yet</p>
              <p className="mt-0.5 text-xs">Submit a ticket above to get started</p>
            </div>
          ) : (
            <div className="max-h-96 divide-y overflow-y-auto scroll-thin">
              {tickets.map((tk) => (
                <div key={tk.id} className="flex items-start gap-3 px-5 py-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[var(--navy)] dark:text-white">{tk.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{tk.message}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground">{format(new Date(tk.createdAt), 'dd MMM yyyy, h:mm a')}</p>
                  </div>
                  <Badge variant="outline" className={cn('shrink-0 text-[10px]', statusColor(tk.status))}>{tk.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ── Documents View ───────────────────────────────────────────────────────

function DocumentsView() {
  const [documents, setDocuments] = useState<{ id: string; name: string; type: string; ref: string; date: string }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/client/documents')
      .then((r) => r.ok ? r.json() : null)
      .then((json) => { if (json) setDocuments(json.documents || []) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-gradient-to-r from-[var(--navy)] to-[var(--navy)]/90 p-6 text-white shadow-lg">
        <h2 className="text-xl font-bold">Documents</h2>
        <p className="mt-1 text-sm text-blue-100/80">Browse invoices, work orders, and announcements related to your account.</p>
      </div>
      <DataTable
        title="All Documents"
        data={documents}
        loading={loading}
        emptyMessage="No documents found"
        emptyIcon={FolderOpen}
        columns={[
          { key: 'name', label: 'Document' },
          { key: 'type', label: 'Type', className: 'w-28' },
          { key: 'ref', label: 'Reference', className: 'w-28' },
          { key: 'date', label: 'Date', className: 'w-32' },
        ]}
        renderRow={(doc) => (
          <TableRow key={doc.id} className="hover:bg-muted/40">
            <TableCell className="font-medium text-[var(--navy)] dark:text-white">{doc.name}</TableCell>
            <TableCell><Badge variant="outline" className="text-[10px]">{doc.type}</Badge></TableCell>
            <TableCell className="font-mono text-xs text-muted-foreground">{doc.ref || '—'}</TableCell>
            <TableCell className="text-xs text-muted-foreground">{doc.date ? fmtDate(doc.date) : '—'}</TableCell>
          </TableRow>
        )}
      />
    </div>
  )
}

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

// ── Data Table (reusable) ──────────────────────────────────────────────────

function DataTable<T extends { id: string }>({
  title,
  data,
  loading,
  emptyMessage,
  emptyIcon: EmptyIcon,
  columns,
  renderRow,
}: {
  title: string
  data: T[]
  loading: boolean
  emptyMessage: string
  emptyIcon: typeof LayoutDashboard
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
          <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
            <EmptyIcon className="mb-2 h-8 w-8 opacity-40" />
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
  const clientName = data?.client?.companyName || data?.client?.clientName || 'Client'
  const stats = data?.stats

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-xl bg-gradient-to-r from-[var(--navy)] to-[var(--navy)]/90 p-6 text-white shadow-lg">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold sm:text-2xl">
              Welcome back, {data?.client?.clientName || 'Client'}!
            </h2>
            <p className="mt-1 text-sm text-blue-100/80">
              Here&apos;s an overview of your engagement with {clientName}.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur-sm">
            <TrendingUp className="h-4 w-4 text-[var(--gold)]" />
            <span className="text-[var(--gold-light)]">Client Dashboard</span>
          </div>
        </div>
      </div>

      {/* 5 Stat Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
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
        <StatCard
          label="Paid Amount"
          value={stats ? formatINR(stats.paidAmount) : '—'}
          icon={Wallet}
          loading={loading}
        />
      </div>

      {/* Recent Projects — top 5 */}
      <DataTable
        title="Recent Projects"
        data={(data?.projects || []).slice(0, 5)}
        loading={loading}
        emptyMessage="No projects found"
        emptyIcon={Briefcase}
        columns={[
          { key: 'name', label: 'Project' },
          { key: 'site', label: 'Site' },
          { key: 'status', label: 'Status', className: 'w-28' },
          { key: 'members', label: 'Team', className: 'w-16' },
          { key: 'dates', label: 'Period' },
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
            <TableCell><StatusBadge status={p.status} /></TableCell>
            <TableCell>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                <span>{p.memberCount}</span>
              </div>
            </TableCell>
            <TableCell className="text-xs text-muted-foreground">
              <div className="flex flex-col gap-0.5">
                <span>Start: {fmtDate(p.startDate)}</span>
                <span>End: {fmtDate(p.endDate)}</span>
              </div>
            </TableCell>
          </TableRow>
        )}
      />

      {/* Recent Work Orders — top 5 */}
      <DataTable
        title="Recent Work Orders"
        data={(data?.workOrders || []).slice(0, 5)}
        loading={loading}
        emptyMessage="No work orders found"
        emptyIcon={ClipboardList}
        columns={[
          { key: 'number', label: 'WO #' },
          { key: 'title', label: 'Title' },
          { key: 'project', label: 'Project', className: 'hidden md:table-cell' },
          { key: 'value', label: 'Value', className: 'text-right' },
          { key: 'status', label: 'Status', className: 'w-28' },
          { key: 'dates', label: 'Period', className: 'hidden lg:table-cell' },
        ]}
        renderRow={(wo) => (
          <TableRow key={wo.id}>
            <TableCell className="font-mono text-xs font-semibold text-[var(--navy)] dark:text-[var(--gold-light)]">{wo.woNumber}</TableCell>
            <TableCell className="font-medium">{wo.title}</TableCell>
            <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{wo.projectName || '—'}</TableCell>
            <TableCell className="text-right font-semibold">{formatINR(wo.value)}</TableCell>
            <TableCell><StatusBadge status={wo.status} /></TableCell>
            <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
              <div className="flex flex-col gap-0.5">
                <span>Start: {fmtDate(wo.startDate)}</span>
                <span>End: {fmtDate(wo.endDate)}</span>
              </div>
            </TableCell>
          </TableRow>
        )}
      />

      {/* Recent Invoices — top 5 */}
      <DataTable
        title="Recent Invoices"
        data={(data?.invoices || []).slice(0, 5)}
        loading={loading}
        emptyMessage="No invoices found"
        emptyIcon={FileText}
        columns={[
          { key: 'number', label: 'Invoice #' },
          { key: 'workOrder', label: 'Work Order', className: 'hidden md:table-cell' },
          { key: 'amount', label: 'Amount', className: 'text-right' },
          { key: 'total', label: 'Total', className: 'text-right' },
          { key: 'status', label: 'Status', className: 'w-28' },
          { key: 'dates', label: 'Dates' },
        ]}
        renderRow={(inv) => (
          <TableRow key={inv.id}>
            <TableCell className="font-mono text-xs font-semibold text-[var(--navy)] dark:text-[var(--gold-light)]">{inv.invoiceNumber}</TableCell>
            <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{inv.workOrderTitle || '—'}</TableCell>
            <TableCell className="text-right">{formatINR(inv.amount)}</TableCell>
            <TableCell className="text-right font-semibold">{formatINR(inv.total)}</TableCell>
            <TableCell><StatusBadge status={inv.status} /></TableCell>
            <TableCell className="text-xs text-muted-foreground">
              <div className="flex flex-col gap-0.5">
                <span>Issue: {fmtDate(inv.issueDate)}</span>
                <span>Due: {fmtDate(inv.dueDate)}</span>
              </div>
            </TableCell>
          </TableRow>
        )}
      />
    </div>
  )
}

// ── Projects Full View ─────────────────────────────────────────────────────

function ProjectsView({ data, loading }: { data: DashboardData | null; loading: boolean }) {
  return (
    <DataTable
      title="All Projects"
      data={data?.projects || []}
      loading={loading}
      emptyMessage="No projects found"
      emptyIcon={Briefcase}
      columns={[
        { key: 'name', label: 'Project' },
        { key: 'site', label: 'Site', className: 'hidden md:table-cell' },
        { key: 'status', label: 'Status', className: 'w-32' },
        { key: 'members', label: 'Team', className: 'w-16' },
        { key: 'description', label: 'Description', className: 'hidden lg:table-cell' },
        { key: 'dates', label: 'Period' },
      ]}
      renderRow={(p) => (
        <TableRow key={p.id} className="hover:bg-muted/40">
          <TableCell>
            <p className="truncate text-sm font-semibold text-[var(--navy)] dark:text-white">{p.projectName}</p>
          </TableCell>
          <TableCell className="hidden md:table-cell">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate max-w-40">{p.site || '—'}</span>
            </div>
          </TableCell>
          <TableCell><StatusBadge status={p.status} /></TableCell>
          <TableCell>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              <span>{p.memberCount}</span>
            </div>
          </TableCell>
          <TableCell className="hidden lg:table-cell max-w-48">
            <p className="truncate text-sm text-muted-foreground">{p.description || '—'}</p>
          </TableCell>
          <TableCell className="text-xs text-muted-foreground">
            <div className="flex flex-col gap-0.5">
              <span>Start: {fmtDate(p.startDate)}</span>
              <span>End: {fmtDate(p.endDate)}</span>
            </div>
          </TableCell>
        </TableRow>
      )}
    />
  )
}

// ── Work Orders Full View ──────────────────────────────────────────────────

function WorkOrdersView({ data, loading }: { data: DashboardData | null; loading: boolean }) {
  const list = data?.workOrders || []
  const totalValue = list.reduce((s, wo) => s + wo.value, 0)

  return (
    <div className="space-y-5">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Total Work Orders</p>
          <p className="mt-1 text-xl font-bold text-[var(--navy)] dark:text-white">{list.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Total Value</p>
          <p className="mt-1 text-xl font-bold text-[var(--navy)] dark:text-white">{formatINR(totalValue)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Open Orders</p>
          <p className="mt-1 text-xl font-bold text-emerald-700">{list.filter((wo) => wo.status === 'OPEN').length}</p>
        </Card>
      </div>

      <DataTable
        title="All Work Orders"
        data={list}
        loading={loading}
        emptyMessage="No work orders found"
        emptyIcon={ClipboardList}
        columns={[
          { key: 'number', label: 'WO #' },
          { key: 'title', label: 'Title' },
          { key: 'project', label: 'Project', className: 'hidden md:table-cell' },
          { key: 'value', label: 'Value', className: 'text-right' },
          { key: 'status', label: 'Status', className: 'w-32' },
          { key: 'dates', label: 'Period' },
        ]}
        renderRow={(wo) => (
          <TableRow key={wo.id} className="hover:bg-muted/40">
            <TableCell className="font-mono text-xs font-semibold text-[var(--navy)] dark:text-[var(--gold-light)]">{wo.woNumber}</TableCell>
            <TableCell>
              <p className="truncate text-sm font-semibold text-[var(--navy)] dark:text-white">{wo.title}</p>
            </TableCell>
            <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{wo.projectName || '—'}</TableCell>
            <TableCell className="text-right font-mono font-semibold">{formatINR(wo.value)}</TableCell>
            <TableCell><StatusBadge status={wo.status} /></TableCell>
            <TableCell className="text-xs text-muted-foreground">
              <div className="flex flex-col gap-0.5">
                <span>Start: {fmtDate(wo.startDate)}</span>
                <span>End: {fmtDate(wo.endDate)}</span>
              </div>
            </TableCell>
          </TableRow>
        )}
      />
    </div>
  )
}

// ── Invoices Full View ─────────────────────────────────────────────────────

function InvoicesView({ data, loading }: { data: DashboardData | null; loading: boolean }) {
  const list = data?.invoices || []
  const totalAmount = list.reduce((s, i) => s + i.total, 0)
  const totalPaid = list.filter((i) => i.status === 'PAID').reduce((s, i) => s + i.total, 0)

  return (
    <div className="space-y-5">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Total Invoiced</p>
          <p className="mt-1 text-xl font-bold text-[var(--navy)] dark:text-white">{formatINR(totalAmount)}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">{list.length} invoice{list.length !== 1 ? 's' : ''}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Paid</p>
          <p className="mt-1 text-xl font-bold text-emerald-700">{formatINR(totalPaid)}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">PAID status</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Outstanding</p>
          <p className="mt-1 text-xl font-bold text-amber-700">{formatINR(totalAmount - totalPaid)}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">Pending / overdue</p>
        </Card>
      </div>

      <DataTable
        title="All Invoices"
        data={list}
        loading={loading}
        emptyMessage="No invoices found"
        emptyIcon={FileText}
        columns={[
          { key: 'number', label: 'Invoice #' },
          { key: 'workOrder', label: 'Work Order', className: 'hidden md:table-cell' },
          { key: 'amount', label: 'Amount', className: 'text-right' },
          { key: 'tax', label: 'Tax', className: 'hidden lg:table-cell text-right' },
          { key: 'total', label: 'Total', className: 'text-right' },
          { key: 'status', label: 'Status', className: 'w-28' },
          { key: 'dates', label: 'Dates' },
        ]}
        renderRow={(inv) => (
          <TableRow key={inv.id} className="hover:bg-muted/40">
            <TableCell className="font-mono text-xs font-semibold text-[var(--navy)] dark:text-[var(--gold-light)]">{inv.invoiceNumber}</TableCell>
            <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{inv.workOrderTitle || '—'}</TableCell>
            <TableCell className="text-right font-mono">{formatINR(inv.amount)}</TableCell>
            <TableCell className="hidden lg:table-cell text-right font-mono text-muted-foreground">{formatINR(inv.tax)}</TableCell>
            <TableCell className="text-right font-mono font-bold text-[var(--navy)] dark:text-white">{formatINR(inv.total)}</TableCell>
            <TableCell><StatusBadge status={inv.status} /></TableCell>
            <TableCell className="text-xs text-muted-foreground">
              <div className="flex flex-col gap-0.5">
                <span>Issue: {fmtDate(inv.issueDate)}</span>
                <span>Due: {fmtDate(inv.dueDate)}</span>
              </div>
            </TableCell>
          </TableRow>
        )}
      />
    </div>
  )
}

// ── Employees View ──────────────────────────────────────────────────────────

function EmployeesView() {
  const [employees, setEmployees] = useState<{ id: string; name: string; code: string; designation: string; department: string; status: string; assignment: string }[]>([])
  const [empLoading, setEmpLoading] = useState(true)
  const [empError, setEmpError] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  useEffect(() => {
    let cancelled = false
    fetch('/api/client/employees?limit=100')
      .then((r) => { if (!r.ok) throw new Error(); return r.json() })
      .then((json) => {
        if (cancelled) return
        setEmployees((json.employees || []).map((e: { id: string; fullName: string; employeeCode: string; designation: string; department: string; status: string }) => ({
          id: e.id,
          name: e.fullName,
          code: e.employeeCode,
          designation: e.designation || '—',
          department: e.department || '—',
          status: e.status === 'APPROVED' ? 'ACTIVE' : e.status,
          assignment: '—',
        })))
      })
      .catch(() => { if (!cancelled) { setEmpError(true); toast.error('Failed to load employees') } })
      .finally(() => { if (!cancelled) setEmpLoading(false) })
    return () => { cancelled = true }
  }, [])

  const filtered = employees.filter((e) => {
    if (statusFilter !== 'ALL' && e.status !== statusFilter) return false
    if (search && !e.name.toLowerCase().includes(search.toLowerCase()) && !e.code.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })
  const totalDeployed = employees.length
  const activeCount = employees.filter((e) => e.status === 'ACTIVE').length
  const onLeaveCount = employees.filter((e) => e.status === 'ON_LEAVE').length

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-gradient-to-r from-[var(--navy)] to-[var(--navy)]/90 p-6 text-white shadow-lg">
        <h2 className="text-xl font-bold">Deployed Workforce</h2>
        <p className="mt-1 text-sm text-blue-100/80">View and manage all employees deployed to your projects.</p>
      </div>

      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Total Deployed</p>
          <p className="mt-1 text-xl font-bold text-[var(--navy)] dark:text-white">{totalDeployed}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Active</p>
          <p className="mt-1 text-xl font-bold text-emerald-700">{activeCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">On Leave</p>
          <p className="mt-1 text-xl font-bold text-amber-700">{onLeaveCount}</p>
        </Card>
      </div>

      {empLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : empError ? (
        <EmptyStateView icon={Users} title="Failed to load employees" message="Could not retrieve employee data. Please try again later." />
      ) : employees.length === 0 ? (
        <EmptyStateView icon={Users} title="No employees found" message="No employees have been deployed to your account yet." />
      ) : (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">All Employees</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search name or code…" className="h-9 w-56 pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="ON_LEAVE">On Leave</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={() => {
                const csvRows = [
                  'Employee Name,Code,Designation,Department,Status,Assignment',
                  ...filtered.map(e => [e.name, e.code, e.designation, e.department, e.status, e.assignment].map(v => '"' + String(v).replace(/"/g, '""') + '"').join(',')),
                ]
                const blob = new Blob(['\ufeff' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                const now = new Date()
                a.href = url
                a.download = 'employees-export-' + now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '.csv'
                a.click()
                URL.revokeObjectURL(url)
                toast.success('Exported ' + filtered.length + ' employee(s)')
              }}>
                <FileDown className="h-4 w-4" /> Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-6 pt-0">
          <div className="max-h-96 overflow-y-auto rounded-lg border scroll-thin">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Employee Name</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground w-28">Code</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden md:table-cell">Designation</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden lg:table-cell">Department</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground w-28">Status</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden sm:table-cell">Assignment</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">No employees match your filters</TableCell></TableRow>
                ) : filtered.map((emp) => (
                  <TableRow key={emp.id} className="hover:bg-muted/40">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8"><AvatarFallback className="bg-[var(--navy)]/10 text-[var(--navy)] dark:text-[var(--gold-light)] text-xs font-bold">{initials(emp.name)}</AvatarFallback></Avatar>
                        <span className="font-medium text-[var(--navy)] dark:text-white">{emp.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">{emp.code}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm">{emp.designation}</TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">{emp.department}</TableCell>
                    <TableCell><StatusBadge status={emp.status} /></TableCell>
                    <TableCell className="hidden sm:table-cell text-sm text-muted-foreground max-w-40 truncate">{emp.assignment}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      )}
    </div>
  )
}

// ── Departments View ───────────────────────────────────────────────────────

const DEPT_COLORS = ['bg-blue-500', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500', 'bg-rose-500', 'bg-sky-500', 'bg-teal-500', 'bg-orange-500', 'bg-pink-500', 'bg-indigo-500']

function DepartmentsView() {
  const [departments, setDepartments] = useState<{ id: string; name: string; head: string; employees: number; status: string; color: string }[]>([])
  const [deptLoading, setDeptLoading] = useState(true)
  const [deptError, setDeptError] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/client/departments')
      .then((r) => { if (!r.ok) throw new Error(); return r.json() })
      .then((json) => {
        if (cancelled) return
        setDepartments((json.departments || []).map((d: { name: string; employeeCount: number }, i: number) => ({
          id: d.name.toLowerCase().replace(/\s+/g, '-'),
          name: d.name,
          head: '—',
          employees: d.employeeCount,
          status: 'ACTIVE',
          color: DEPT_COLORS[i % DEPT_COLORS.length],
        })))
      })
      .catch(() => { if (!cancelled) { setDeptError(true); toast.error('Failed to load departments') } })
      .finally(() => { if (!cancelled) setDeptLoading(false) })
    return () => { cancelled = true }
  }, [])

  const dept = selected ? departments.find((d) => d.id === selected) : null

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-gradient-to-r from-[var(--navy)] to-[var(--navy)]/90 p-6 text-white shadow-lg">
        <h2 className="text-xl font-bold">Departments</h2>
        <p className="mt-1 text-sm text-blue-100/80">Organisational structure and department overview for your deployed workforce.</p>
      </div>

      {deptLoading ? (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      ) : deptError ? (
        <EmptyStateView icon={LayoutGrid} title="Failed to load departments" message="Could not retrieve department data. Please try again later." />
      ) : departments.length === 0 ? (
        <EmptyStateView icon={LayoutGrid} title="No departments found" message="No department data is available for your workforce yet." />
      ) : (
      <>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {departments.map((d) => (
          <Card
            key={d.id}
            className={cn('cursor-pointer transition-all hover:shadow-md hover:border-[var(--gold)]/40', selected === d.id && 'ring-2 ring-[var(--gold)]')}
            onClick={() => setSelected(selected === d.id ? null : d.id)}
          >
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className={cn('mt-0.5 h-10 w-10 shrink-0 rounded-lg flex items-center justify-center text-white text-sm font-bold', d.color)}>
                  {d.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-[var(--navy)] dark:text-white">{d.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">Employees: {d.employees}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Users className="h-3.5 w-3.5" /> {d.employees} employees
                    </div>
                    <StatusBadge status={d.status} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {dept && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{dept.name} — Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <InfoRow label="Department" value={dept.name} />
            <InfoRow label="Total Employees" value={String(dept.employees)} />
            <InfoRow label="Status" value={dept.status.replace(/_/g, ' ')} />
          </CardContent>
        </Card>
      )}
      </>
      )}
    </div>
  )
}

// ── Attendance View ────────────────────────────────────────────────────────

function AttendanceView() {
  const [attendance, setAttendance] = useState<{ id: string; employee: string; date: string; checkIn: string; checkOut: string; hours: string; status: string }[]>([])
  const [attLoading, setAttLoading] = useState(true)
  const [attError, setAttError] = useState(false)
  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [dlMonth, setDlMonth] = useState(String(new Date().getMonth() + 1))
  const [dlYear, setDlYear] = useState(String(new Date().getFullYear()))
  const [downloading, setDownloading] = useState(false)

  const loadAttendance = (from?: string, to?: string) => {
    setAttLoading(true)
    setAttError(false)
    let url = '/api/client/attendance'
    const params: string[] = []
    if (from && to) {
      params.push(`from=${encodeURIComponent(from)}`)
      params.push(`to=${encodeURIComponent(to)}`)
    }
    if (params.length) url += '?' + params.join('&')
    return fetch(url)
      .then((r) => { if (!r.ok) throw new Error(); return r.json() })
      .then((json) => {
        setAttendance((json.attendance || []).map((a: { id: string; employeeName: string; date: string; checkIn: string | null; checkOut: string | null; status: string; hoursWorked: number | null }) => ({
          id: a.id,
          employee: a.employeeName,
          date: a.date,
          checkIn: a.checkIn ? format(new Date(a.checkIn), 'HH:mm') : '—',
          checkOut: a.checkOut ? format(new Date(a.checkOut), 'HH:mm') : '—',
          hours: a.hoursWorked != null ? String(a.hoursWorked) : '0',
          status: a.status,
        })))
      })
      .catch(() => { setAttError(true); toast.error('Failed to load attendance') })
      .finally(() => setAttLoading(false))
  }

  useEffect(() => {
    let cancelled = false
    fetch('/api/client/attendance')
      .then((r) => { if (!r.ok) throw new Error(); return r.json() })
      .then((json) => {
        if (cancelled) return
        setAttendance((json.attendance || []).map((a: { id: string; employeeName: string; date: string; checkIn: string | null; checkOut: string | null; status: string; hoursWorked: number | null }) => ({
          id: a.id,
          employee: a.employeeName,
          date: a.date,
          checkIn: a.checkIn ? format(new Date(a.checkIn), 'HH:mm') : '—',
          checkOut: a.checkOut ? format(new Date(a.checkOut), 'HH:mm') : '—',
          hours: a.hoursWorked != null ? String(a.hoursWorked) : '0',
          status: a.status,
        })))
      })
      .catch(() => { if (!cancelled) { setAttError(true); toast.error('Failed to load attendance') } })
      .finally(() => { if (!cancelled) setAttLoading(false) })
    return () => { cancelled = true }
  }, [])

  const handleDateFilter = () => {
    if (dateFrom && dateTo) {
      loadAttendance(dateFrom, dateTo)
    } else {
      toast.error('Please select both from and to dates')
    }
  }

  const handleClearFilter = () => {
    setDateFrom('')
    setDateTo('')
    loadAttendance()
  }

  const handleDownload = () => {
    setDownloading(true)
    const url = `/api/client/attendance/download?month=${dlMonth}&year=${dlYear}`
    window.open(url, '_blank')
    setTimeout(() => setDownloading(false), 3000)
  }

  const filtered = attendance.filter((a) => !search || a.employee.toLowerCase().includes(search.toLowerCase()))
  const presentCount = attendance.filter((a) => a.status === 'PRESENT').length
  const absentCount = attendance.filter((a) => a.status === 'ABSENT').length
  const lateCount = attendance.filter((a) => a.status === 'LATE').length
  const halfDayCount = attendance.filter((a) => a.status === 'HALF_DAY').length

  const MONTH_OPTIONS = ['January','February','March','April','May','June','July','August','September','October','November','December']

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-gradient-to-r from-[var(--navy)] to-[var(--navy)]/90 p-6 text-white shadow-lg">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold">Attendance</h2>
            <p className="mt-1 text-sm text-blue-100/80">Track daily attendance for your deployed workforce.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={dlMonth} onValueChange={setDlMonth}>
              <SelectTrigger className="h-8 w-32 bg-white/10 border-white/20 text-white text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {MONTH_OPTIONS.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input type="number" min="2020" max="2100" className="h-8 w-20 bg-white/10 border-white/20 text-white text-xs" value={dlYear} onChange={(e) => setDlYear(e.target.value)} />
            <Button size="sm" variant="outline" className="h-8 gap-1.5 border-white/20 text-white hover:bg-white/20" onClick={handleDownload} disabled={downloading}>
              <FileDown className="h-3.5 w-3.5" />
              {downloading ? 'Downloading…' : 'Download Report'}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-2"><UserCheck className="h-4 w-4 text-emerald-600" /><p className="text-xs uppercase tracking-wider text-muted-foreground">Present</p></div>
          <p className="mt-1 text-xl font-bold text-emerald-700">{presentCount}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2"><UserX className="h-4 w-4 text-red-600" /><p className="text-xs uppercase tracking-wider text-muted-foreground">Absent</p></div>
          <p className="mt-1 text-xl font-bold text-red-700">{absentCount}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2"><Timer className="h-4 w-4 text-amber-600" /><p className="text-xs uppercase tracking-wider text-muted-foreground">Late</p></div>
          <p className="mt-1 text-xl font-bold text-amber-700">{lateCount}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-sky-600" /><p className="text-xs uppercase tracking-wider text-muted-foreground">Half-Day</p></div>
          <p className="mt-1 text-xl font-bold text-sky-700">{halfDayCount}</p>
        </Card>
      </div>

      {attLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : attError ? (
        <EmptyStateView icon={Clock} title="Failed to load attendance" message="Could not retrieve attendance data. Please try again later." />
      ) : attendance.length === 0 ? (
        <EmptyStateView icon={Clock} title="No attendance records" message="No attendance data is available yet." />
      ) : (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">Attendance Records</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search employee…" className="h-9 w-48 pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <Input type="date" className="h-9 w-36" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} placeholder="From" />
              <Input type="date" className="h-9 w-36" value={dateTo} onChange={(e) => setDateTo(e.target.value)} placeholder="To" />
              <Button size="sm" variant="outline" className="h-9" onClick={handleDateFilter}>Go</Button>
              {(dateFrom || dateTo) && (
                <Button size="sm" variant="ghost" className="h-9 text-xs" onClick={handleClearFilter}>Clear</Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-6 pt-0">
          <div className="max-h-96 overflow-y-auto rounded-lg border scroll-thin">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Employee</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground w-28">Date</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden sm:table-cell">Check In</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden sm:table-cell">Check Out</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Hours</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground w-28">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">No attendance records match your search</TableCell></TableRow>
                ) : filtered.map((a) => (
                  <TableRow key={a.id} className="hover:bg-muted/40">
                    <TableCell className="font-medium text-[var(--navy)] dark:text-white">{a.employee}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{fmtDate(a.date)}</TableCell>
                    <TableCell className="hidden sm:table-cell font-mono text-xs">{a.checkIn}</TableCell>
                    <TableCell className="hidden sm:table-cell font-mono text-xs">{a.checkOut}</TableCell>
                    <TableCell className="font-mono text-xs font-semibold">{a.hours}h</TableCell>
                    <TableCell><StatusBadge status={a.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      )}
    </div>
  )
}

// ── Leave View ────────────────────────────────────────────────────────────

function LeaveView() {
  const [leaves, setLeaves] = useState<{ id: string; employee: string; type: string; from: string; to: string; days: number; status: string }[]>([])
  const [lvLoading, setLvLoading] = useState(true)
  const [lvError, setLvError] = useState(false)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [typeFilter, setTypeFilter] = useState('ALL')

  useEffect(() => {
    let cancelled = false
    fetch('/api/client/leave')
      .then((r) => { if (!r.ok) throw new Error(); return r.json() })
      .then((json) => {
        if (cancelled) return
        setLeaves((json.leaves || []).map((l: { id: string; employeeName: string; leaveType: string; startDate: string; endDate: string; days: number; status: string }) => ({
          id: l.id,
          employee: l.employeeName,
          type: l.leaveType,
          from: l.startDate,
          to: l.endDate,
          days: l.days,
          status: l.status,
        })))
      })
      .catch(() => { if (!cancelled) { setLvError(true); toast.error('Failed to load leave data') } })
      .finally(() => { if (!cancelled) setLvLoading(false) })
    return () => { cancelled = true }
  }, [])

  const filtered = leaves.filter((l) => {
    if (statusFilter !== 'ALL' && l.status !== statusFilter) return false
    if (typeFilter !== 'ALL' && l.type !== typeFilter) return false
    return true
  })
  const totalLeaves = leaves.reduce((s, l) => s + l.days, 0)
  const usedLeaves = leaves.filter((l) => l.status === 'APPROVED').reduce((s, l) => s + l.days, 0)

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-gradient-to-r from-[var(--navy)] to-[var(--navy)]/90 p-6 text-white shadow-lg">
        <h2 className="text-xl font-bold">Leave Management</h2>
        <p className="mt-1 text-sm text-blue-100/80">Overview of leave requests and balances for your deployed workforce.</p>
      </div>

      <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Total Requests</p>
          <p className="mt-1 text-xl font-bold text-[var(--navy)] dark:text-white">{leaves.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Total Days</p>
          <p className="mt-1 text-xl font-bold text-[var(--navy)] dark:text-white">{totalLeaves}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Approved Days</p>
          <p className="mt-1 text-xl font-bold text-emerald-700">{usedLeaves}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Balance Days</p>
          <p className="mt-1 text-xl font-bold text-amber-700">{totalLeaves - usedLeaves}</p>
        </Card>
      </div>

      {lvLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : lvError ? (
        <EmptyStateView icon={CalendarOff} title="Failed to load leave data" message="Could not retrieve leave records. Please try again later." />
      ) : leaves.length === 0 ? (
        <EmptyStateView icon={CalendarOff} title="No leave records" message="No leave requests have been submitted yet." />
      ) : (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">Leave Records</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 w-32"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="APPROVED">Approved</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="h-9 w-36"><SelectValue placeholder="Leave Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Types</SelectItem>
                  <SelectItem value="Casual Leave">Casual Leave</SelectItem>
                  <SelectItem value="Sick Leave">Sick Leave</SelectItem>
                  <SelectItem value="Earned Leave">Earned Leave</SelectItem>
                  <SelectItem value="Half-Day Leave">Half-Day</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-6 pt-0">
          <div className="max-h-96 overflow-y-auto rounded-lg border scroll-thin">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Employee</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Leave Type</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden sm:table-cell">From</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden sm:table-cell">To</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Days</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground w-28">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">No leave records match your filters</TableCell></TableRow>
                ) : filtered.map((l) => (
                  <TableRow key={l.id} className="hover:bg-muted/40">
                    <TableCell className="font-medium text-[var(--navy)] dark:text-white">{l.employee}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px]">{l.type}</Badge></TableCell>
                    <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">{fmtDate(l.from)}</TableCell>
                    <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">{fmtDate(l.to)}</TableCell>
                    <TableCell className="font-semibold">{l.days}</TableCell>
                    <TableCell><StatusBadge status={l.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      )}
    </div>
  )
}

// ── Payroll View ───────────────────────────────────────────────────────────

const MONTH_NAMES = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function PayrollView() {
  const [payroll, setPayroll] = useState<{ id: string; month: string; basic: number; hra: number; deductions: number; netPay: number; status: string }[]>([])
  const [prLoading, setPrLoading] = useState(true)
  const [prError, setPrError] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch('/api/client/payroll')
      .then((r) => { if (!r.ok) throw new Error(); return r.json() })
      .then((json) => {
        if (cancelled) return
        const raw = json.payrolls || []
        // Aggregate per-employee records into monthly summaries
        const monthMap = new Map<string, { basic: number; hra: number; deductions: number; netPay: number; status: string }>()
        for (const p of raw) {
          const key = `${p.year}-${String(p.month).padStart(2, '0')}`
          const label = `${MONTH_NAMES[p.month] || ''} ${p.year}`
          const existing = monthMap.get(key) || { basic: 0, hra: 0, deductions: 0, netPay: 0, status: p.status }
          existing.basic += p.basicSalary || 0
          existing.hra += p.hra || 0
          existing.deductions += p.deductions || 0
          existing.netPay += p.netSalary || 0
          if (p.status === 'PROCESSING') existing.status = 'PROCESSING'
          monthMap.set(key, existing)
        }
        const aggregated = Array.from(monthMap.entries()).map(([key, val], i) => ({
          id: `pr-${key}`,
          month: `${MONTH_NAMES[parseInt(key.split('-')[1])]} ${key.split('-')[0]}`,
          basic: val.basic,
          hra: val.hra,
          deductions: val.deductions,
          netPay: val.netPay,
          status: i === 0 ? val.status : 'PAID',
        })).reverse()
        setPayroll(aggregated)
      })
      .catch(() => { if (!cancelled) { setPrError(true); toast.error('Failed to load payroll') } })
      .finally(() => { if (!cancelled) setPrLoading(false) })
    return () => { cancelled = true }
  }, [])

  const totalNet = payroll.reduce((s, p) => s + p.netPay, 0)
  const currentMonth = payroll[0]

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-gradient-to-r from-[var(--navy)] to-[var(--navy)]/90 p-6 text-white shadow-lg">
        <h2 className="text-xl font-bold">Payroll</h2>
        <p className="mt-1 text-sm text-blue-100/80">Monthly payroll summary and billing details for your workforce.</p>
      </div>

      {prLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : prError ? (
        <EmptyStateView icon={Banknote} title="Failed to load payroll" message="Could not retrieve payroll data. Please try again later." />
      ) : payroll.length === 0 ? (
        <EmptyStateView icon={Banknote} title="No payroll data" message="No payroll records are available yet." />
      ) : (
      <>
      {/* Current month summary */}
      {currentMonth && (
      <Card className="border-[var(--gold)]/30">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--gold)]/15"><Banknote className="h-4 w-4 text-[var(--gold)]" /></div>
            <CardTitle className="text-base">Current Month — {currentMonth.month}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
            <div><p className="text-[11px] uppercase tracking-wider text-muted-foreground">Basic Salary</p><p className="mt-0.5 font-semibold text-[var(--navy)] dark:text-white">{formatINR(currentMonth.basic)}</p></div>
            <div><p className="text-[11px] uppercase tracking-wider text-muted-foreground">HRA</p><p className="mt-0.5 font-semibold text-[var(--navy)] dark:text-white">{formatINR(currentMonth.hra)}</p></div>
            <div><p className="text-[11px] uppercase tracking-wider text-muted-foreground">Deductions</p><p className="mt-0.5 font-semibold text-red-600">-{formatINR(currentMonth.deductions)}</p></div>
            <div><p className="text-[11px] uppercase tracking-wider text-muted-foreground">Net Pay</p><p className="mt-0.5 text-lg font-bold text-emerald-700">{formatINR(currentMonth.netPay)}</p></div>
          </div>
        </CardContent>
      </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Payroll History</CardTitle>
            <div className="text-right">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Total</p>
              <p className="font-bold text-[var(--navy)] dark:text-white">{formatINR(totalNet)}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-6 pt-0">
          <div className="max-h-96 overflow-y-auto rounded-lg border scroll-thin">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Month</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground text-right hidden sm:table-cell">Basic</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground text-right hidden md:table-cell">HRA</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground text-right hidden lg:table-cell">Deductions</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground text-right">Net Pay</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground w-28">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payroll.map((p) => (
                  <TableRow key={p.id} className="hover:bg-muted/40">
                    <TableCell className="font-medium text-[var(--navy)] dark:text-white">{p.month}</TableCell>
                    <TableCell className="hidden sm:table-cell text-right font-mono text-sm">{formatINR(p.basic)}</TableCell>
                    <TableCell className="hidden md:table-cell text-right font-mono text-sm">{formatINR(p.hra)}</TableCell>
                    <TableCell className="hidden lg:table-cell text-right font-mono text-sm text-red-600">-{formatINR(p.deductions)}</TableCell>
                    <TableCell className="text-right font-mono font-bold text-emerald-700">{formatINR(p.netPay)}</TableCell>
                    <TableCell><StatusBadge status={p.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      </>
      )}
    </div>
  )
}

// ── Subscription View ─────────────────────────────────────────────────────

const PLAN_ICONS: Record<string, typeof Zap> = { starter: Zap, standard: Star, professional: Shield, enterprise: Crown }
const FALLBACK_PLANS = [
  { name: 'Starter', price: '₹4,999', period: '/mo', features: ['Up to 25 employees', 'Basic attendance', 'Email support', '5 GB storage'], icon: Zap, current: false },
  { name: 'Standard', price: '₹12,999', period: '/mo', features: ['Up to 100 employees', 'Attendance & leave', 'Priority support', '25 GB storage', 'API access'], icon: Star, current: true },
  { name: 'Professional', price: '₹29,999', period: '/mo', features: ['Up to 500 employees', 'Full HR suite', 'Dedicated manager', '100 GB storage', 'Advanced analytics', 'Custom integrations'], icon: Shield, current: false },
  { name: 'Enterprise', price: 'Custom', period: '', features: ['Unlimited employees', 'All features', '24/7 support', 'Unlimited storage', 'White-label option', 'SLA guarantee', 'On-premise option'], icon: Crown, current: false },
]

interface SubData {
  currentPeriodEnd: string | null
  accountStatus: string | null
  invoices: { id: string; invoiceNumber: string; amount: number; tax: number; total: number; status: string; issueDate: string | null }[]
}

interface PricingPlan {
  id: string
  name: string
  description: string | null
  priceINR: number | null
  interval: string
  maxEmployees: number | null
  features: string | null
  trialDays: number
  isPopular: boolean
}

function SubscriptionView() {
  const [subData, setSubData] = useState<SubData | null>(null)
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>([])
  const [employeeCount, setEmployeeCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function fetchData() {
      try {
        const [billingRes, pricingRes, empRes] = await Promise.allSettled([
          fetch('/api/client/billing').then((r) => (r.ok ? r.json() : null)),
          fetch('/api/public/pricing').then((r) => (r.ok ? r.json() : null)),
          fetch('/api/client/employees?limit=1').then((r) => (r.ok ? r.json() : null)),
        ])
        if (cancelled) return

        if (billingRes.status === 'fulfilled' && billingRes.value) {
          setSubData(billingRes.value)
        }
        if (pricingRes.status === 'fulfilled' && pricingRes.value?.plans) {
          setPricingPlans(pricingRes.value.plans)
        }
        if (empRes.status === 'fulfilled' && empRes.value?.pagination) {
          setEmployeeCount(empRes.value.pagination.total)
        }
      } catch {
        // silently fail — partial data is ok
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchData()
    return () => { cancelled = true }
  }, [])

  // Build display plans from API or fallback
  const hasPricing = pricingPlans.length > 0
  const displayPlans = hasPricing
    ? pricingPlans.map((p) => ({
        name: p.name,
        price: p.priceINR != null ? formatINR(p.priceINR) : 'Custom',
        period: p.priceINR != null ? '/mo' : '',
        features: p.features ? (typeof p.features === 'string' ? JSON.parse(p.features) as string[] : p.features) : [],
        icon: PLAN_ICONS[p.name.toLowerCase()] || Zap,
        current: false,
        maxEmployees: p.maxEmployees,
      }))
    : FALLBACK_PLANS

  // Derive current plan name from latest invoice amount vs pricing plans
  const latestInvoice = subData?.invoices?.[0]
  let currentPlanName = 'Standard'
  if (hasPricing && latestInvoice) {
    const baseAmount = latestInvoice.amount || latestInvoice.total || 0
    const match = pricingPlans.find((p) => p.priceINR != null && Math.abs(p.priceINR - baseAmount) < 1)
    if (match) currentPlanName = match.name
  }

  // Mark current plan in display plans
  const plansWithCurrent = displayPlans.map((p) => ({
    ...p,
    current: p.name === currentPlanName,
  }))

  // Find max employees from current plan
  const currentPlanData = pricingPlans.find((p) => p.name === currentPlanName)
  const maxEmployees = currentPlanData?.maxEmployees ?? null

  // Usage calculations
  const empUsed = employeeCount ?? 0
  const empLimit = maxEmployees ?? 100
  const empPercent = empLimit > 0 ? Math.round((empUsed / empLimit) * 100) : 0

  // Renewal date from billing API
  const renewalDate = subData?.currentPeriodEnd
    ? new Date(subData.currentPeriodEnd).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'Contact admin'
  const interval = hasPricing && currentPlanData ? currentPlanData.interval.toLowerCase() : 'monthly'

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl bg-gradient-to-r from-[var(--navy)] to-[var(--navy)]/90 p-6 text-white shadow-lg">
          <Skeleton className="h-6 w-40 bg-white/20" />
          <Skeleton className="mt-2 h-4 w-72 bg-white/15" />
        </div>
        <Skeleton className="h-64 w-full" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-80 w-full" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-gradient-to-r from-[var(--navy)] to-[var(--navy)]/90 p-6 text-white shadow-lg">
        <h2 className="text-xl font-bold">Subscription</h2>
        <p className="mt-1 text-sm text-blue-100/80">Manage your plan, track usage, and explore upgrade options.</p>
      </div>

      {/* Current Plan */}
      <Card className="border-[var(--gold)]/30">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[var(--gold)]/15">
                <Star className="h-6 w-6 text-[var(--gold)]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-[var(--navy)] dark:text-white">{currentPlanName} Plan</h3>
                  <Badge className="bg-[var(--gold)] text-[var(--navy)] border-0 text-[10px] font-bold">CURRENT</Badge>
                </div>
                <p className="text-sm text-muted-foreground">Renews on {renewalDate} &bull; Billed {interval}</p>
              </div>
            </div>
            <Button variant="outline" className="gap-1.5" onClick={() => toast.info('Contact your administrator to change plans')}>Manage Plan</Button>
          </div>

          {/* Usage meters */}
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Employees</span>
                <span className="font-medium">{employeeCount != null ? `${empUsed} / ${empLimit}` : '—'}</span>
              </div>
              <Progress value={employeeCount != null ? empPercent : 0} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Storage</span>
                <span className="font-medium">—</span>
              </div>
              <Progress value={0} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">API Calls</span>
                <span className="font-medium">—</span>
              </div>
              <Progress value={0} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plan comparison */}
      <div>
        <h3 className="mb-4 text-base font-semibold text-[var(--navy)] dark:text-white">Compare Plans</h3>
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {plansWithCurrent.map((plan) => {
            const PlanIcon = plan.icon
            return (
              <Card key={plan.name} className={cn('relative flex flex-col', plan.current && 'ring-2 ring-[var(--gold)]')}>
                <CardContent className="flex flex-1 flex-col p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <PlanIcon className={cn('h-5 w-5', plan.current ? 'text-[var(--gold)]' : 'text-muted-foreground')} />
                    <h4 className="font-bold text-[var(--navy)] dark:text-white">{plan.name}</h4>
                  </div>
                  <div className="mb-4">
                    <span className="text-2xl font-bold text-[var(--navy)] dark:text-white">{plan.price}</span>
                    <span className="text-sm text-muted-foreground">{plan.period}</span>
                  </div>
                  <ul className="flex-1 space-y-2">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Check className={cn('mt-0.5 h-4 w-4 shrink-0', plan.current ? 'text-[var(--gold)]' : 'text-emerald-500')} />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    variant={plan.current ? 'outline' : 'default'}
                    className={cn('mt-4 w-full gap-1.5', !plan.current && 'bg-[var(--navy)] hover:bg-[var(--navy)]/90')}
                    disabled={plan.current}
                    onClick={() => plan.name === 'Enterprise' ? toast.info('Contact sales for Enterprise pricing') : toast.info('Contact your administrator to upgrade')}
                  >
                    {plan.current ? 'Current Plan' : plan.name === 'Enterprise' ? 'Contact Sales' : 'Upgrade'}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Billing View ───────────────────────────────────────────────────────────

function BillingView() {
  const [invoices, setInvoices] = useState<{ id: string; invoiceNo: string; date: string; amount: number; tax: number; total: number; status: string }[]>([])
  const [billLoading, setBillLoading] = useState(true)
  const [billError, setBillError] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch('/api/client/billing')
      .then((r) => { if (!r.ok) throw new Error(); return r.json() })
      .then((json) => {
        if (cancelled) return
        setInvoices((json.invoices || []).map((inv: { id: string; invoiceNumber: string; issueDate: string; amount: number; tax: number; total: number; status: string }) => ({
          id: inv.id,
          invoiceNo: inv.invoiceNumber,
          date: inv.issueDate,
          amount: inv.amount,
          tax: inv.tax,
          total: inv.total,
          status: inv.status,
        })))
      })
      .catch(() => { if (!cancelled) { setBillError(true); toast.error('Failed to load billing data') } })
      .finally(() => { if (!cancelled) setBillLoading(false) })
    return () => { cancelled = true }
  }, [])

  const thisMonth = invoices.find((i) => i.status === 'SENT')
  const overdueTotal = invoices.filter((i) => i.status === 'OVERDUE').reduce((s, i) => s + i.total, 0)
  const paidTotal = invoices.filter((i) => i.status === 'PAID').reduce((s, i) => s + i.total, 0)

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-gradient-to-r from-[var(--navy)] to-[var(--navy)]/90 p-6 text-white shadow-lg">
        <h2 className="text-xl font-bold">Billing</h2>
        <p className="mt-1 text-sm text-blue-100/80">Invoice history, payment records, and billing summaries.</p>
      </div>

      {billLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : billError ? (
        <EmptyStateView icon={Receipt} title="Failed to load billing" message="Could not retrieve billing data. Please try again later." />
      ) : invoices.length === 0 ? (
        <EmptyStateView icon={Receipt} title="No invoices" message="No invoice data is available yet." />
      ) : (
      <>
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">This Month</p>
          <p className="mt-1 text-xl font-bold text-[var(--navy)] dark:text-white">{thisMonth ? formatINR(thisMonth.total) : '—'}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">Upcoming</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Overdue</p>
          <p className="mt-1 text-xl font-bold text-red-700">{overdueTotal > 0 ? formatINR(overdueTotal) : '₹0'}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">Immediate attention</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Total Paid</p>
          <p className="mt-1 text-xl font-bold text-emerald-700">{formatINR(paidTotal)}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">All time</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">Upcoming</p>
          <p className="mt-1 text-xl font-bold text-sky-700">{thisMonth ? formatINR(thisMonth.total) : '—'}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">Due 31 Aug</p>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Invoice History</CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6 pt-0">
          <div className="max-h-96 overflow-y-auto rounded-lg border scroll-thin">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Invoice #</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground w-28">Date</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground text-right hidden sm:table-cell">Amount</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground text-right hidden md:table-cell">Tax</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground text-right">Total</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground w-28">Status</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => (
                  <TableRow key={inv.id} className="hover:bg-muted/40">
                    <TableCell className="font-mono text-xs font-semibold text-[var(--navy)] dark:text-[var(--gold-light)]">{inv.invoiceNo}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{fmtDate(inv.date)}</TableCell>
                    <TableCell className="hidden sm:table-cell text-right font-mono text-sm">{formatINR(inv.amount)}</TableCell>
                    <TableCell className="hidden md:table-cell text-right font-mono text-sm text-muted-foreground">{formatINR(inv.tax)}</TableCell>
                    <TableCell className="text-right font-mono font-bold text-[var(--navy)] dark:text-white">{formatINR(inv.total)}</TableCell>
                    <TableCell><StatusBadge status={inv.status} /></TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => toast.info('Invoice PDF will be available after admin generates it')}>
                        <Download className="h-3.5 w-3.5" /> PDF
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      </>
      )}
    </div>
  )
}

// ── Reports View ───────────────────────────────────────────────────────────

const REPORT_TYPES = [
  { id: 'workforce', label: 'Workforce Summary', icon: Users, desc: 'Employee deployment, headcount trends, and role distribution', color: 'bg-blue-500' },
  { id: 'attendance', label: 'Attendance Analysis', icon: Clock, desc: 'Attendance rates, late arrivals, and absence patterns', color: 'bg-emerald-500' },
  { id: 'cost', label: 'Cost Analysis', icon: IndianRupee, desc: 'Payroll costs, billing trends, and budget utilisation', color: 'bg-amber-500' },
]

function ReportsView() {
  const [activeReport, setActiveReport] = useState('workforce')
  const [reportData, setReportData] = useState<{ employees: { total: number; active: number; onLeave: number; departments: number }; attendance: { presentToday: number; absentToday: number }; payroll: { totalPaidThisMonth: number; month: number; year: number } } | null>(null)
  const [rptLoading, setRptLoading] = useState(true)
  const [rptError, setRptError] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch('/api/client/reports')
      .then((r) => { if (!r.ok) throw new Error(); return r.json() })
      .then((json) => {
        if (cancelled) return
        setReportData(json)
      })
      .catch(() => { if (!cancelled) { setRptError(true); toast.error('Failed to load reports') } })
      .finally(() => { if (!cancelled) setRptLoading(false) })
    return () => { cancelled = true }
  }, [])

  const getReportTable = () => {
    if (!reportData) return { col: [] as string[], rows: [] as string[][] }
    if (activeReport === 'workforce') {
      return {
        col: ['Metric', 'Value'],
        rows: [
          ['Total Employees', String(reportData.employees.total)],
          ['Active Employees', String(reportData.employees.active)],
          ['On Leave', String(reportData.employees.onLeave)],
          ['Departments', String(reportData.employees.departments)],
        ],
      }
    }
    if (activeReport === 'attendance') {
      const total = reportData.attendance.presentToday + reportData.attendance.absentToday
      return {
        col: ['Metric', 'Value'],
        rows: [
          ['Present Today', `${reportData.attendance.presentToday} (${total > 0 ? Math.round(reportData.attendance.presentToday / total * 100) : 0}%)`],
          ['Absent Today', `${reportData.attendance.absentToday} (${total > 0 ? Math.round(reportData.attendance.absentToday / total * 100) : 0}%)`],
          ['Total', String(total)],
        ],
      }
    }
    if (activeReport === 'cost') {
      return {
        col: ['Metric', 'Value'],
        rows: [
          ['Month', `${MONTH_NAMES[reportData.payroll.month]} ${reportData.payroll.year}`],
          ['Total Paid This Month', formatINR(reportData.payroll.totalPaidThisMonth)],
        ],
      }
    }
    return { col: [] as string[], rows: [] as string[][] }
  }

  const rd = getReportTable()

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-gradient-to-r from-[var(--navy)] to-[var(--navy)]/90 p-6 text-white shadow-lg">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold">Reports & Analytics</h2>
            <p className="mt-1 text-sm text-blue-100/80">Insights into your workforce, attendance, and costs.</p>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5 border-white/20 text-white hover:bg-white/10" onClick={() => {
            const reportLabel = REPORT_TYPES.find((r) => r.id === activeReport)?.label || 'report'
            const csvRows = [
              rd.col.join(','),
              ...rd.rows.map(r => r.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(',')),
            ]
            const blob = new Blob(['\ufeff' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            const now = new Date()
            a.href = url
            a.download = reportLabel.toLowerCase().replace(/\s+/g, '-') + '-export-' + now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '.csv'
            a.click()
            URL.revokeObjectURL(url)
            toast.success('Report exported')
          }}>
            <FileDown className="h-4 w-4" /> Export Report
          </Button>
        </div>
      </div>

      {/* Report type cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {REPORT_TYPES.map((rt) => {
          const RtIcon = rt.icon
          return (
            <Card
              key={rt.id}
              className={cn('cursor-pointer transition-all hover:shadow-md', activeReport === rt.id && 'ring-2 ring-[var(--gold)]')}
              onClick={() => setActiveReport(rt.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-lg text-white', rt.color)}>
                    <RtIcon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--navy)] dark:text-white">{rt.label}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground line-clamp-2">{rt.desc}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {rptLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : rptError ? (
        <EmptyStateView icon={BarChart3} title="Failed to load reports" message="Could not retrieve report data. Please try again later." />
      ) : (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{REPORT_TYPES.find((r) => r.id === activeReport)?.label}</CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6 pt-0">
          <div className="max-h-96 overflow-y-auto rounded-lg border scroll-thin">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  {rd.col.map((c) => (
                    <TableHead key={c} className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{c}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rd.rows.map((row, i) => (
                  <TableRow key={i} className="hover:bg-muted/40">
                    {row.map((cell, j) => (
                      <TableCell key={j} className={j === 0 ? 'font-medium text-[var(--navy)] dark:text-white' : ''}>{cell}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      )}
    </div>
  )
}

// ── Downloads View ─────────────────────────────────────────────────────────

const DOWNLOAD_CATEGORIES = ['Reports', 'Invoices', 'Contracts', 'Policies'] as const



function DownloadsView() {
  const [documents, setDocuments] = useState<{ id: string; name: string; type: string; size: string; date: string; format: string; filePath?: string; storagePath?: string; source?: string }[]>([])
  const [dlLoading, setDlLoading] = useState(true)
  const [dlError, setDlError] = useState(false)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<string>('ALL')

  useEffect(() => {
    let cancelled = false
    fetch('/api/client/downloads')
      .then((r) => { if (!r.ok) throw new Error(); return r.json() })
      .then((json) => {
        if (cancelled) return
        setDocuments((json.documents || []).map((d: { id: string; fileName: string; category: string; fileSize: string | null; uploadedAt: string; fileType: string; filePath?: string; storagePath?: string; source?: string }) => ({
          id: d.id,
          name: d.fileName,
          type: d.category || 'Other',
          size: d.fileSize || '—',
          date: d.uploadedAt.slice(0, 10),
          format: d.fileType.split('/').pop()?.toUpperCase() || 'FILE',
          filePath: d.filePath,
          storagePath: d.storagePath,
          source: d.source,
        })))
      })
      .catch(() => { if (!cancelled) { setDlError(true); toast.error('Failed to load downloads') } })
      .finally(() => { if (!cancelled) setDlLoading(false) })
    return () => { cancelled = true }
  }, [])

  const filtered = documents.filter((f) => {
    if (category !== 'ALL' && f.type !== category) return false
    if (search && !f.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const handleDownload = (f: { id: string; name: string; filePath?: string; storagePath?: string; source?: string }) => {
    const filePath = f.source === 'generated' ? f.storagePath : f.filePath
    if (!filePath) {
      toast.error('File not generated yet')
      return
    }
    window.open(`/api/uploads/${filePath}`, '_blank')
  }

  const formatColor = (fmt: string) => {
    if (fmt === 'PDF') return 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/25'
    if (fmt === 'XLSX' || fmt === 'XLS') return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/25'
    return 'bg-primary/10 text-primary border-primary/20'
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl bg-gradient-to-r from-[var(--navy)] to-[var(--navy)]/90 p-6 text-white shadow-lg">
        <h2 className="text-xl font-bold">Downloads</h2>
        <p className="mt-1 text-sm text-blue-100/80">Access and download reports, invoices, contracts, and policies.</p>
      </div>

      {dlLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : dlError ? (
        <EmptyStateView icon={FolderOpen} title="Failed to load downloads" message="Could not retrieve download data. Please try again later." />
      ) : documents.length === 0 ? (
        <EmptyStateView icon={FolderOpen} title="No downloads available" message="No documents are available for download yet." />
      ) : (
      <>
      {/* Category tabs */}
      <Tabs defaultValue="ALL" onValueChange={(v) => setCategory(v)}>
        <TabsList>
          <TabsTrigger value="ALL">All</TabsTrigger>
          {DOWNLOAD_CATEGORIES.map((c) => (
            <TabsTrigger key={c} value={c}>{c}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">Files ({filtered.length})</CardTitle>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search files…" className="h-9 w-56 pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-6 pt-0">
          <div className="max-h-96 overflow-y-auto rounded-lg border scroll-thin">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Name</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden sm:table-cell">Type</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden md:table-cell">Format</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden lg:table-cell">Size</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground w-28">Date</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wide text-muted-foreground w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">No files match your filters</TableCell></TableRow>
                ) : filtered.map((f) => (
                  <TableRow key={f.id} className="hover:bg-muted/40">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="font-medium text-[var(--navy)] dark:text-white truncate max-w-56">{f.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell"><Badge variant="outline" className="text-[10px]">{f.type}</Badge></TableCell>
                    <TableCell className="hidden md:table-cell"><Badge variant="outline" className={cn('text-[10px]', formatColor(f.format))}>{f.format}</Badge></TableCell>
                    <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">{f.size}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{fmtDate(f.date)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => handleDownload(f)}>
                        <Download className="h-3.5 w-3.5" /> Save
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      </>
      )}
    </div>
  )
}

// ── Main Component ──────────────────────────────────────────────────────────

export function ClientLayout() {
  const { user, logout, lang } = useAuth()
  const [active, setActive] = useState<ClientView>('dashboard')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [notifications, setNotifications] = useState<NotificationLite[]>([])
  const [unread, setUnread] = useState(0)
  const [now, setNow] = useState(new Date())
  const [bellOpen, setBellOpen] = useState(false)

  const client = user?.client
  const clientName = data?.client?.clientName || client?.clientName || client?.companyName || user?.username || 'Client'

  // Prefetch key data on mount for instant loads
  useEffect(() => {
    prefetch(['client:notifications'], '/api/notifications')
    prefetch(['client:dashboard'], '/api/client/dashboard')
  }, [])

  // Fetch dashboard data
  useEffect(() => {
    let cancelled = false
    cachedFetch('client:dashboard', '/api/client/dashboard').then(({ data: json }) => {
      if (cancelled || !json) return
      setData(json)
      setUnread(json.unreadNotifications ?? 0)
    })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  // Fetch notifications separately
  useEffect(() => {
    let cancelled = false
    cachedFetch('client:notifications', '/api/notifications').then(({ data: notifData }) => {
      if (cancelled || !notifData) return
      setNotifications(notifData.notifications || [])
    })
      .catch(() => {})
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

  // ── Sidebar inner (shared between desktop & mobile) ──
  const sidebarInner = (
    <div className="flex h-full flex-col text-slate-200">
      {/* Brand */}
      <div className="px-5 pt-5 pb-4 border-b border-white/10">
        <BrandLogo />
      </div>

      {/* Navigation */}
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

      {/* Follow HP Enterprise */}
      <div className="border-t border-white/10 px-3 py-3">
        <FollowUs variant="vertical" showLabels={true} />
      </div>

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
                {data?.client?.companyName || client?.companyName || client?.email || 'Client Portal'}
              </p>
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
              <LanguageSwitcher />
              <ThemeToggle />
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
                    <p className="text-sm font-semibold text-[var(--navy)] dark:text-white">{t('nav.notifications', lang)}</p>
                    {unread > 0 && (
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={markAllRead}>
                        {t('nav.markAllRead', lang)}
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
              {active === 'company-profile' && <CompanyProfileView data={data} loading={loading} />}
              {active === 'employees' && <EmployeesView />}
              {active === 'departments' && <DepartmentsView />}
              {active === 'attendance' && <AttendanceView />}
              {active === 'leave' && <LeaveView />}
              {active === 'payroll' && <PayrollView />}
              {active === 'projects' && <ProjectsView data={data} loading={loading} />}
              {active === 'documents' && <DocumentsView />}
              {active === 'invoices' && <InvoicesView data={data} loading={loading} />}
              {active === 'subscription' && <SubscriptionView />}
              {active === 'billing' && <BillingView />}
              {active === 'reports' && <ReportsView />}
              {active === 'downloads' && <DownloadsView />}
              {active === 'ai-assistant' && <AiAssistantView />}
              {active === 'notifications' && <NotificationsView notifications={notifications} onMarkRead={markOneRead} onMarkAllRead={markAllRead} unread={unread} />}
              {active === 'support' && <SupportView />}
              {active === 'settings' && <SettingsView data={data} loading={loading} />}
              {active === 'work-orders' && <WorkOrdersView data={data} loading={loading} />}
            </div>
          </main>
        </div>
      </div>

      {/* Sticky footer */}
      <footer className="mt-auto border-t bg-card px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center gap-2 text-xs text-muted-foreground sm:flex-row sm:justify-between">
          <p>&copy; 2025 HP ENTERPRISE Safety Service &amp; Man Power Supply &bull; Client Portal</p>
          <SocialLinks variant="inline" className="order-last sm:order-none" />
          <p className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {t('footer.systemsOperational', lang)}
          </p>
        </div>
      </footer>

      <HpAiChat />


    </div>
  )
}
