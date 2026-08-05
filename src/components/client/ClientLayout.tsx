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
              {active === 'employees' && <EmptyStateView icon={Users} title="Workforce" message="Your deployed workforce will appear here. Contact your account manager to set up workforce visibility." />}
              {active === 'departments' && <EmptyStateView icon={LayoutGrid} title="Departments" message="Department structure is managed by your administrator." />}
              {active === 'attendance' && <EmptyStateView icon={Clock} title="Attendance" message="Attendance records for your deployed workforce will appear here." />}
              {active === 'leave' && <EmptyStateView icon={CalendarOff} title="Leave Management" message="Leave management for your deployed workforce is managed by HR." />}
              {active === 'payroll' && <EmptyStateView icon={Banknote} title="Payroll" message="Payroll and billing information will be displayed here." />}
              {active === 'projects' && <ProjectsView data={data} loading={loading} />}
              {active === 'documents' && <DocumentsView />}
              {active === 'invoices' && <InvoicesView data={data} loading={loading} />}
              {active === 'subscription' && <EmptyStateView icon={CreditCard} title="Subscription" message="Subscription and plan details are managed by your administrator." />}
              {active === 'billing' && <EmptyStateView icon={Receipt} title="Billing" message="Billing history and payment records will appear here." />}
              {active === 'reports' && <EmptyStateView icon={BarChart3} title="Reports" message="Reports and analytics are being configured for your account." />}
              {active === 'downloads' && <EmptyStateView icon={Download} title="Downloads" message="Documents available for download will appear here." />}
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
