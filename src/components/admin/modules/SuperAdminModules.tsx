  'use client'
import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { SectionTitle, StatCard } from '@/components/shared'
import { toast } from 'sonner'
import { Slider } from '@/components/ui/slider'
import {
  Building2, CheckCircle, XCircle, Search, Plus, Pencil, Trash2, DollarSign,
  TrendingUp, Users, Globe, Eye, ArrowUp, ArrowDown, Star, Crown, Shield,
  Briefcase, GripVertical, ChevronDown, ChevronUp, Mail, Clock, RefreshCw,
  HardDrive, CalendarDays, Upload, Download, Save, FileText, Linkedin,
  Twitter, Instagram, Facebook, Youtube, Undo2, AlertTriangle, Brain,
  Cpu, BookOpen, MessageCircle, Activity, Zap, Server, Database,
  MailCheck, Phone, Settings,
} from 'lucide-react'

// ═══════════════════════════════════════════════════════════════════════════
// 1. CLIENT COMPANIES
// ═══════════════════════════════════════════════════════════════════════════

const MOCK_COMPANIES = [
  { id: '1', name: 'Tata Consultancy Services', plan: 'Enterprise', status: 'Active', employees: 450, mrr: 19999, joinDate: '2024-01-15' },
  { id: '2', name: 'Infosys Technologies', plan: 'Professional', status: 'Active', employees: 120, mrr: 7999, joinDate: '2024-03-22' },
  { id: '3', name: 'Wipro Green Solutions', plan: 'Starter', status: 'Trial', employees: 15, mrr: 0, joinDate: '2025-05-10' },
  { id: '4', name: 'Reliance Digital Ltd', plan: 'Enterprise', status: 'Active', employees: 890, mrr: 19999, joinDate: '2023-11-01' },
  { id: '5', name: 'Mahindra Satyam Corp', plan: 'Professional', status: 'Expired', employees: 45, mrr: 7999, joinDate: '2024-06-18' },
  { id: '6', name: 'Bajaj Finserv HR', plan: 'Starter', status: 'Active', employees: 30, mrr: 2999, joinDate: '2024-08-05' },
]

const statusColor: Record<string, string> = {
  Active: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30',
  Trial: 'bg-amber-500/10 text-amber-700 border-amber-500/30',
  Expired: 'bg-red-500/10 text-red-700 border-red-500/30',
  Suspended: 'bg-gray-500/10 text-gray-700 border-gray-500/30',
}

const planColor: Record<string, string> = {
  Starter: 'bg-slate-500/10 text-slate-700 border-slate-500/30',
  Professional: 'bg-[var(--navy)]/10 text-[var(--navy)] border-[var(--navy)]/30',
  Enterprise: 'bg-[var(--gold)]/15 text-[#8a6f24] border-[var(--gold)]/30',
}

export function ClientCompanies({ refreshKey }: { refreshKey?: number }) {
  const [search, setSearch] = useState('')
  const filtered = MOCK_COMPANIES.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  )
  const totalMrr = MOCK_COMPANIES.reduce((a, c) => a + c.mrr, 0)
  return (
    <div className="space-y-6">
      <SectionTitle title="Client Companies" desc="Manage all SaaS tenant companies" />
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Building2} label="Total Companies" value={MOCK_COMPANIES.length} sub="All registered tenants" />
        <StatCard icon={CheckCircle} label="Active" value={MOCK_COMPANIES.filter(c => c.status === 'Active').length} sub="Paying customers" accent="green" />
        <StatCard icon={Clock} label="Trial" value={MOCK_COMPANIES.filter(c => c.status === 'Trial').length} sub="Free trials running" accent="amber" />
        <StatCard icon={DollarSign} label="Total MRR" value={`₹${totalMrr.toLocaleString('en-IN')}`} sub="Monthly recurring" accent="gold" />
      </div>
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search companies..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((c) => (
          <Card key={c.id} className="transition-shadow hover:shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <CardTitle className="text-base truncate">{c.name}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">Joined {new Date(c.joinDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                </div>
                <Badge variant="outline" className={planColor[c.plan] || ''}>{c.plan}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Badge variant="outline" className={statusColor[c.status]}>{c.status}</Badge>
                <div className="text-right">
                  <p className="text-lg font-bold text-[var(--navy)] dark:text-white">₹{c.mrr.toLocaleString('en-IN')}</p>
                  <p className="text-[11px] text-muted-foreground">MRR</p>
                </div>
              </div>
              <Separator className="my-3" />
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                <span>{c.employees} employees</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. COMPANY APPROVAL
// ═══════════════════════════════════════════════════════════════════════════

const MOCK_PENDING = [
  { id: '1', name: 'Larsen & Toubro HR', contact: 'Rajesh Kumar', email: 'rajesh.k@lnt.com', phone: '+91 98765 43210', plan: 'Enterprise', employees: 250, date: '2025-06-10' },
  { id: '2', name: 'Godrej Industries', contact: 'Priya Sharma', email: 'priya.s@godrej.in', phone: '+91 87654 32109', plan: 'Professional', employees: 85, date: '2025-06-11' },
  { id: '3', name: 'Hindustan Aeronautics', contact: 'Arun Patel', email: 'arun.p@hal.gov.in', phone: '+91 76543 21098', plan: 'Enterprise', employees: 1200, date: '2025-06-12' },
  { id: '4', name: 'Biocon Limited', contact: 'Meera Nair', email: 'meera.n@biocon.com', phone: '+91 65432 10987', plan: 'Starter', employees: 30, date: '2025-06-13' },
]

export function CompanyApproval({ refreshKey }: { refreshKey?: number }) {
  const [pending, setPending] = useState(MOCK_PENDING)
  const [stats, setStats] = useState({ pending: 4, approvedToday: 3, rejectedToday: 1 })

  const handleApprove = (id: string, name: string) => {
    if (!window.confirm(`Approve "${name}" and create their tenant workspace?`)) return
    setPending((prev) => prev.filter((c) => c.id !== id))
    setStats((s) => ({ ...s, pending: s.pending - 1, approvedToday: s.approvedToday + 1 }))
    toast.success(`${name} approved successfully`)
  }

  const handleReject = (id: string, name: string) => {
    if (!window.confirm(`Reject "${name}"? They will be notified via email.`)) return
    setPending((prev) => prev.filter((c) => c.id !== id))
    setStats((s) => ({ ...s, pending: s.pending - 1, rejectedToday: s.rejectedToday + 1 }))
    toast.error(`${name} has been rejected`)
  }

  return (
    <div className="space-y-6">
      <SectionTitle title="Company Approvals" desc="Review and approve new tenant sign-ups" />
      <div className="grid gap-4 grid-cols-3">
        <StatCard icon={Clock} label="Pending Review" value={stats.pending} sub="Awaiting action" accent="amber" />
        <StatCard icon={CheckCircle} label="Approved Today" value={stats.approvedToday} sub="Onboarded today" accent="green" />
        <StatCard icon={XCircle} label="Rejected Today" value={stats.rejectedToday} sub="Declined" accent="red" />
      </div>
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        {pending.map((c) => (
          <Card key={c.id} className="border-amber-500/20 bg-amber-50/30 dark:bg-amber-950/10">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{c.name}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">Applied {new Date(c.date).toLocaleDateString('en-IN')}</p>
                </div>
                <Badge variant="outline" className={planColor[c.plan]}>{c.plan}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-2 text-sm grid-cols-2">
                <div><span className="text-muted-foreground">Contact:</span> <span className="font-medium">{c.contact}</span></div>
                <div><span className="text-muted-foreground">Employees:</span> <span className="font-medium">{c.employees}</span></div>
                <div><span className="text-muted-foreground">Email:</span> <span className="font-medium truncate block">{c.email}</span></div>
                <div><span className="text-muted-foreground">Phone:</span> <span className="font-medium">{c.phone}</span></div>
              </div>
              <Separator />
              <div className="flex gap-2">
                <Button size="sm" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => handleApprove(c.id, c.name)}>
                  <CheckCircle className="h-4 w-4 mr-1" /> Approve
                </Button>
                <Button size="sm" variant="destructive" className="flex-1" onClick={() => handleReject(c.id, c.name)}>
                  <XCircle className="h-4 w-4 mr-1" /> Reject
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {pending.length === 0 && (
        <Card><CardContent className="py-12 text-center text-muted-foreground"><CheckCircle className="h-8 w-8 mx-auto mb-2 text-emerald-500" /><p className="font-medium">All caught up!</p><p className="text-sm">No pending approvals right now.</p></CardContent></Card>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. REVENUE DASHBOARD
// ═══════════════════════════════════════════════════════════════════════════

const MONTHLY_REVENUE = [
  { month: 'Jul', amount: 320000 }, { month: 'Aug', amount: 355000 }, { month: 'Sep', amount: 340000 },
  { month: 'Oct', amount: 378000 }, { month: 'Nov', amount: 390000 }, { month: 'Dec', amount: 410000 },
  { month: 'Jan', amount: 395000 }, { month: 'Feb', amount: 420000 }, { month: 'Mar', amount: 435000 },
  { month: 'Apr', amount: 415000 }, { month: 'May', amount: 440000 }, { month: 'Jun', amount: 420000 },
]
const MAX_REV = Math.max(...MONTHLY_REVENUE.map(m => m.amount))

const REVENUE_BY_PLAN = [
  { plan: 'Starter', clients: 12, mrr: 35988, pct: 8 },
  { plan: 'Standard', clients: 8, mrr: 63992, pct: 15 },
  { plan: 'Professional', clients: 15, mrr: 119985, pct: 29 },
  { plan: 'Enterprise', clients: 6, mrr: 119994, pct: 29 },
]

const TOP_CLIENTS = [
  { name: 'Reliance Digital Ltd', mrr: 19999, plan: 'Enterprise', since: 'Nov 2023' },
  { name: 'Tata Consultancy Services', mrr: 19999, plan: 'Enterprise', since: 'Jan 2024' },
  { name: 'Infosys Technologies', mrr: 15999, plan: 'Professional', since: 'Mar 2024' },
  { name: 'HDFC Bank Solutions', mrr: 11999, plan: 'Professional', since: 'Feb 2024' },
  { name: 'Adani Ports HR', mrr: 9999, plan: 'Standard', since: 'May 2024' },
]

export function RevenueDashboard({ refreshKey }: { refreshKey?: number }) {
  const fmt = (n: number) => '₹' + (n >= 100000 ? `${(n / 100000).toFixed(1)}L` : n >= 1000 ? `${(n / 1000).toFixed(1)}K` : n.toString())
  return (
    <div className="space-y-6">
      <SectionTitle title="Revenue Dashboard" desc="SaaS revenue analytics and metrics" />
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard icon={DollarSign} label="Monthly Recurring" value="₹4.2L" sub="+8.2% from last month" accent="gold" />
        <StatCard icon={TrendingUp} label="Annual Run Rate" value="₹50.4L" sub="Projected ARR" accent="navy" />
        <StatCard icon={AlertTriangle} label="Churn Rate" value="2.1%" sub="-0.4% vs last month" accent="red" />
        <StatCard icon={Crown} label="Avg. LTV" value="₹18K" sub="Per customer lifetime" accent="green" />
      </div>
      {/* Bar chart */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Monthly Revenue</CardTitle><p className="text-xs text-muted-foreground">Last 12 months — in ₹</p></CardHeader>
        <CardContent>
          <div className="flex items-end gap-2 h-48">
            {MONTHLY_REVENUE.map((m) => (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[10px] font-medium text-muted-foreground">{fmt(m.amount)}</span>
                <div className="w-full rounded-t-md bg-[var(--navy)] dark:bg-[var(--gold)] transition-all" style={{ height: `${(m.amount / MAX_REV) * 140}px`, minHeight: '8px' }} />
                <span className="text-[11px] text-muted-foreground">{m.month}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      {/* Tables */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Revenue by Plan</CardTitle></CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-y-auto">
              <Table><TableHeader><TableRow><TableHead>Plan</TableHead><TableHead>Clients</TableHead><TableHead>MRR</TableHead><TableHead>Share</TableHead></TableRow></TableHeader>
              <TableBody>
                {REVENUE_BY_PLAN.map((r) => (
                  <TableRow key={r.plan}><TableCell className="font-medium">{r.plan}</TableCell><TableCell>{r.clients}</TableCell><TableCell>₹{r.mrr.toLocaleString('en-IN')}</TableCell><TableCell><div className="flex items-center gap-2"><Progress value={r.pct} className="h-2 w-20" /><span className="text-xs text-muted-foreground">{r.pct}%</span></div></TableCell></TableRow>
                ))}
              </TableBody></Table>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Top 5 Clients by MRR</CardTitle></CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-y-auto">
              <Table><TableHeader><TableRow><TableHead>Company</TableHead><TableHead>Plan</TableHead><TableHead>MRR</TableHead><TableHead>Since</TableHead></TableRow></TableHeader>
              <TableBody>
                {TOP_CLIENTS.map((c) => (
                  <TableRow key={c.name}><TableCell className="font-medium truncate max-w-[140px]">{c.name}</TableCell><TableCell><Badge variant="outline" className={planColor[c.plan]}>{c.plan}</Badge></TableCell><TableCell className="font-semibold">₹{c.mrr.toLocaleString('en-IN')}</TableCell><TableCell className="text-muted-foreground text-xs">{c.since}</TableCell></TableRow>
                ))}
              </TableBody></Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// 4. WEBSITE CMS
// ═══════════════════════════════════════════════════════════════════════════

export function WebsiteCMS({ refreshKey }: { refreshKey?: number }) {
  const [heroTitle, setHeroTitle] = useState('HPHRMS — AI-Powered Human Resource Management')
  const [heroSubtitle, setHeroSubtitle] = useState('Streamline your HR operations with intelligent automation and real-time analytics.')
  const [ctaText, setCtaText] = useState('Start Free Trial')
  const [footerText, setFooterText] = useState('© 2025 HPHRMS Technologies Pvt. Ltd. All rights reserved. Made with ❤️ in India.')
  const [metaDesc, setMetaDesc] = useState('HPHRMS is a comprehensive AI-powered HR management system for modern Indian enterprises. Manage payroll, attendance, recruitment, and more.')

  const handleSave = () => toast.success('CMS content saved successfully!')

  return (
    <div className="space-y-6">
      <SectionTitle title="Website CMS" desc="Edit public website content and metadata" action={<Button onClick={handleSave}><Save className="h-4 w-4 mr-1" /> Save Changes</Button>} />
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <div className="space-y-4">
          <Card><CardHeader><CardTitle className="text-base">Hero Section</CardTitle></CardHeader><CardContent className="space-y-4">
            <div className="space-y-2"><Label>Hero Title</Label><Input value={heroTitle} onChange={(e) => setHeroTitle(e.target.value)} /></div>
            <div className="space-y-2"><Label>Hero Subtitle</Label><Input value={heroSubtitle} onChange={(e) => setHeroSubtitle(e.target.value)} /></div>
            <div className="space-y-2"><Label>CTA Button Text</Label><Input value={ctaText} onChange={(e) => setCtaText(e.target.value)} /></div>
          </CardContent></Card>
          <Card><CardHeader><CardTitle className="text-base">Footer & SEO</CardTitle></CardHeader><CardContent className="space-y-4">
            <div className="space-y-2"><Label>Footer Text</Label><Textarea value={footerText} onChange={(e) => setFooterText(e.target.value)} rows={3} /></div>
            <div className="space-y-2"><Label>Meta Description</Label><Textarea value={metaDesc} onChange={(e) => setMetaDesc(e.target.value)} rows={3} /><p className="text-xs text-muted-foreground">{metaDesc.length}/160 characters</p></div>
          </CardContent></Card>
        </div>
        <Card className="hidden lg:block sticky top-6 self-start">
          <CardHeader><CardTitle className="text-base">Live Preview</CardTitle></CardHeader>
          <CardContent>
            <div className="rounded-lg border-2 border-dashed p-6 space-y-4 bg-gradient-to-b from-[var(--navy)]/5 to-transparent">
              <div className="space-y-2 text-center">
                <h3 className="text-xl font-bold text-[var(--navy)] dark:text-white">{heroTitle || 'Hero Title'}</h3>
                <p className="text-sm text-muted-foreground">{heroSubtitle || 'Subtitle text'}</p>
                <Button className="bg-[var(--gold)] text-[var(--navy)] hover:bg-[var(--gold-light)]" size="sm">{ctaText || 'CTA'}</Button>
              </div>
              <Separator />
              <div className="space-y-1"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">SEO Meta</p><p className="text-xs text-muted-foreground">{metaDesc || 'Meta description...'}</p></div>
              <Separator />
              <p className="text-xs text-muted-foreground">{footerText || 'Footer text...'}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// 5. LANDING BUILDER
// ═══════════════════════════════════════════════════════════════════════════

const DEFAULT_SECTIONS = [
  { id: 'hero', name: 'Hero Banner', enabled: true },
  { id: 'features', name: 'Features', enabled: true },
  { id: 'testimonials', name: 'Testimonials', enabled: true },
  { id: 'pricing', name: 'Pricing', enabled: true },
  { id: 'faq', name: 'FAQ', enabled: true },
  { id: 'cta', name: 'CTA Section', enabled: true },
  { id: 'newsletter', name: 'Newsletter', enabled: true },
]

export function LandingPageBuilder({ refreshKey }: { refreshKey?: number }) {
  const [sections, setSections] = useState(DEFAULT_SECTIONS)
  const toggle = (id: string) => {
    setSections((s) => s.map((sec) => sec.id === id ? { ...sec, enabled: !sec.enabled } : sec))
    toast.success('Section visibility updated')
  }
  return (
    <div className="space-y-6">
      <SectionTitle title="Landing Page Builder" desc="Toggle, reorder, and manage landing page sections" action={<Button onClick={() => toast.success('Landing page published!')}><Upload className="h-4 w-4 mr-1" /> Publish</Button>} />
      <Card>
        <CardContent className="p-0">
          <div className="divide-y">
            {sections.map((sec, i) => (
              <div key={sec.id} className="flex items-center gap-4 p-4 hover:bg-muted/40 transition-colors">
                <div className="flex flex-col items-center gap-0.5 text-muted-foreground">
                  <button className="hover:text-[var(--navy)] disabled:opacity-30" disabled={i === 0} onClick={() => {
                    const arr = [...sections]; [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]]; setSections(arr)
                  }}><ChevronUp className="h-4 w-4" /></button>
                  <button className="hover:text-[var(--navy)] disabled:opacity-30" disabled={i === sections.length - 1} onClick={() => {
                    const arr = [...sections]; [arr[i], arr[i + 1]] = [arr[i + 1], arr[i]]; setSections(arr)
                  }}><ChevronDown className="h-4 w-4" /></button>
                </div>
                <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-[var(--navy)] dark:text-white">{sec.name}</p>
                  <p className="text-xs text-muted-foreground">Position {i + 1} of {sections.length}</p>
                </div>
                <Badge variant="outline" className={sec.enabled ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30' : 'bg-gray-500/10 text-gray-500 border-gray-500/30'}>
                  {sec.enabled ? 'Visible' : 'Hidden'}
                </Badge>
                <Button variant="ghost" size="sm" onClick={() => toast.info(`Editing ${sec.name}`)}><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="sm" onClick={() => toast.info(`Previewing ${sec.name}`)}><Eye className="h-4 w-4" /></Button>
                <Switch checked={sec.enabled} onCheckedChange={() => toggle(sec.id)} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// 6. HERO BANNER MANAGER
// ═══════════════════════════════════════════════════════════════════════════

interface Slide { id: string; title: string; subtitle: string; cta: string; link: string; bgColor: string; active: boolean }

const INITIAL_SLIDES: Slide[] = [
  { id: '1', title: 'Transform Your HR Operations', subtitle: 'AI-powered payroll, attendance & recruitment in one platform.', cta: 'Get Started Free', link: '/register', bgColor: '#002B5C', active: true },
  { id: '2', title: 'Trusted by 500+ Companies', subtitle: 'From startups to enterprises — scale your workforce effortlessly.', cta: 'View Case Studies', link: '/case-studies', bgColor: '#1a1a2e', active: false },
  { id: '3', title: 'GST-Compliant Payroll', subtitle: 'Auto-calculate TDS, PF, ESI & generate payslips in seconds.', cta: 'See Pricing', link: '/pricing', bgColor: '#0f3460', active: false },
]

export function HeroBannerManager({ refreshKey }: { refreshKey?: number }) {
  const [slides, setSlides] = useState(INITIAL_SLIDES)
  const addSlide = () => {
    const newSlide: Slide = { id: Date.now().toString(), title: 'New Banner Slide', subtitle: 'Enter subtitle text here.', cta: 'Learn More', link: '#', bgColor: '#002B5C', active: false }
    setSlides((s) => [...s, newSlide])
    toast.success('New slide added')
  }
  const updateSlide = (id: string, field: keyof Slide, value: string | boolean) => {
    setSlides((s) => s.map((sl) => sl.id === id ? { ...sl, [field]: value } : sl))
  }
  const setActive = (id: string) => {
    setSlides((s) => s.map((sl) => ({ ...sl, active: sl.id === id })))
    toast.success('Active slide updated')
  }
  const removeSlide = (id: string) => {
    if (!window.confirm('Delete this banner slide?')) return
    setSlides((s) => s.filter((sl) => sl.id !== id))
    toast.success('Slide deleted')
  }
  return (
    <div className="space-y-6">
      <SectionTitle title="Hero Banner Manager" desc="Manage homepage carousel slides" action={<Button onClick={addSlide}><Plus className="h-4 w-4 mr-1" /> Add Slide</Button>} />
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        {slides.map((slide) => (
          <Card key={slide.id} className={`transition-all ${slide.active ? 'ring-2 ring-[var(--gold)] shadow-md' : ''}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Slide {slides.indexOf(slide) + 1}</CardTitle>
                <div className="flex items-center gap-2">
                  {slide.active && <Badge className="bg-[var(--gold)] text-[var(--navy)]">Active</Badge>}
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500" onClick={() => removeSlide(slide.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="h-24 rounded-md flex items-center justify-center text-white text-xs font-medium" style={{ backgroundColor: slide.bgColor }}>
                {slide.title}
              </div>
              <div className="space-y-2">
                <div className="space-y-1"><Label className="text-xs">Title</Label><Input value={slide.title} onChange={(e) => updateSlide(slide.id, 'title', e.target.value)} className="h-8 text-sm" /></div>
                <div className="space-y-1"><Label className="text-xs">Subtitle</Label><Input value={slide.subtitle} onChange={(e) => updateSlide(slide.id, 'subtitle', e.target.value)} className="h-8 text-sm" /></div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1"><Label className="text-xs">CTA Text</Label><Input value={slide.cta} onChange={(e) => updateSlide(slide.id, 'cta', e.target.value)} className="h-8 text-sm" /></div>
                  <div className="space-y-1"><Label className="text-xs">Link</Label><Input value={slide.link} onChange={(e) => updateSlide(slide.id, 'link', e.target.value)} className="h-8 text-sm" /></div>
                </div>
                <div className="flex items-center gap-2">
                  <Label className="text-xs">Background</Label>
                  <Input type="color" value={slide.bgColor} onChange={(e) => updateSlide(slide.id, 'bgColor', e.target.value)} className="w-10 h-7 p-0.5 cursor-pointer" />
                  <span className="text-xs text-muted-foreground font-mono">{slide.bgColor}</span>
                </div>
              </div>
              {!slide.active && (
                <Button variant="outline" size="sm" className="w-full" onClick={() => setActive(slide.id)}>Set as Active</Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// 7. PRICING EDITOR
// ═══════════════════════════════════════════════════════════════════════════

interface Plan { id: string; name: string; monthlyPrice: string; yearlyPrice: string; features: string[]; highlighted: boolean }

const INITIAL_PLANS: Plan[] = [
  { id: '1', name: 'Starter', monthlyPrice: '2999', yearlyPrice: '29990', features: ['Up to 25 employees', 'Basic payroll', 'Attendance tracking', 'Email support'], highlighted: false },
  { id: '2', name: 'Standard', monthlyPrice: '6999', yearlyPrice: '69990', features: ['Up to 100 employees', 'Full payroll suite', 'Leave management', 'Recruitment module', 'Priority support'], highlighted: false },
  { id: '3', name: 'Professional', monthlyPrice: '12999', yearlyPrice: '129990', features: ['Up to 500 employees', 'Advanced analytics', 'AI-powered insights', 'Custom workflows', 'API access', 'Dedicated manager'], highlighted: true },
  { id: '4', name: 'Enterprise', monthlyPrice: '24999', yearlyPrice: '249990', features: ['Unlimited employees', 'White-label option', 'Custom integrations', 'SLA guarantee', 'On-premise option', '24/7 phone support', 'Training & onboarding'], highlighted: false },
]

export function PricingEditor({ refreshKey }: { refreshKey?: number }) {
  const [plans, setPlans] = useState(INITIAL_PLANS)
  const updatePlan = (id: string, field: keyof Plan, value: string | boolean | string[]) => {
    setPlans((p) => p.map((pl) => pl.id === id ? { ...pl, [field]: value } : pl))
  }
  const addFeature = (planId: string) => {
    setPlans((p) => p.map((pl) => pl.id === planId ? { ...pl, features: [...pl.features, 'New feature'] } : pl))
  }
  const removeFeature = (planId: string, idx: number) => {
    setPlans((p) => p.map((pl) => pl.id === planId ? { ...pl, features: pl.features.filter((_, i) => i !== idx) } : pl))
  }
  const updateFeature = (planId: string, idx: number, val: string) => {
    setPlans((p) => p.map((pl) => pl.id === planId ? { ...pl, features: pl.features.map((f, i) => i === idx ? val : f) } : pl))
  }
  return (
    <div className="space-y-6">
      <SectionTitle title="Pricing Editor" desc="Configure subscription plans and pricing" action={<Button onClick={() => toast.success('Pricing plans saved!')}><Save className="h-4 w-4 mr-1" /> Save Plans</Button>} />
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        {plans.map((plan) => (
          <Card key={plan.id} className={`relative transition-all ${plan.highlighted ? 'ring-2 ring-[var(--gold)] shadow-lg scale-[1.02]' : ''}`}>
            {plan.highlighted && <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[var(--gold)] text-[var(--navy)]"><Star className="h-3 w-3 mr-1" /> Popular</Badge>}
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{plan.name}</CardTitle>
                <Switch checked={plan.highlighted} onCheckedChange={(v) => updatePlan(plan.id, 'highlighted', v)} />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1"><Label className="text-xs">Monthly (₹)</Label><Input value={plan.monthlyPrice} onChange={(e) => updatePlan(plan.id, 'monthlyPrice', e.target.value)} className="h-8 text-sm" /></div>
                <div className="space-y-1"><Label className="text-xs">Yearly (₹)</Label><Input value={plan.yearlyPrice} onChange={(e) => updatePlan(plan.id, 'yearlyPrice', e.target.value)} className="h-8 text-sm" /></div>
              </div>
              <Separator />
              <div className="space-y-2">
                <div className="flex items-center justify-between"><Label className="text-xs">Features</Label><Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => addFeature(plan.id)}><Plus className="h-3 w-3 mr-0.5" /> Add</Button></div>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {plan.features.map((f, i) => (
                    <div key={i} className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3 text-emerald-500 shrink-0" />
                      <Input value={f} onChange={(e) => updateFeature(plan.id, i, e.target.value)} className="h-7 text-xs flex-1" />
                      <button className="text-red-400 hover:text-red-600 shrink-0" onClick={() => removeFeature(plan.id, i)}><XCircle className="h-3.5 w-3.5" /></button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// 8. FAQ EDITOR
// ═══════════════════════════════════════════════════════════════════════════

interface FAQ { id: string; question: string; answer: string; expanded: boolean }

const INITIAL_FAQS: FAQ[] = [
  { id: '1', question: 'What is HPHRMS and who is it for?', answer: 'HPHRMS is an AI-powered human resource management system designed for Indian enterprises. It covers payroll, attendance, recruitment, leave management, and more — all compliant with Indian labour laws.', expanded: false },
  { id: '2', question: 'How does the 14-day free trial work?', answer: 'Sign up with just your email — no credit card needed. You get full access to all Professional plan features for 14 days. At the end, choose a plan or your data is securely deleted.', expanded: false },
  { id: '3', question: 'Can I switch between plans?', answer: 'Yes! You can upgrade or downgrade at any time. Upgrades take effect immediately with prorated billing. Downgrades apply from the next billing cycle.', expanded: false },
  { id: '4', question: 'Is my data secure and compliant?', answer: 'Absolutely. We use AES-256 encryption at rest, TLS 1.3 in transit, and are compliant with IT Act 2000, GDPR, and SOC 2 Type II. Regular third-party security audits are conducted.', expanded: false },
  { id: '5', question: 'Do you offer custom integrations?', answer: 'Enterprise plan clients get dedicated API access and our team builds custom connectors for your existing tools — SAP, Tally, Zoho, and more.', expanded: false },
]

export function FAQEditor({ refreshKey }: { refreshKey?: number }) {
  const [faqs, setFaqs] = useState(INITIAL_FAQS)
  const [adding, setAdding] = useState(false)
  const [newQ, setNewQ] = useState('')
  const [newA, setNewA] = useState('')
  const toggleExpand = (id: string) => setFaqs((f) => f.map((faq) => faq.id === id ? { ...faq, expanded: !faq.expanded } : faq))
  const deleteFaq = (id: string) => {
    if (!window.confirm('Delete this FAQ?')) return
    setFaqs((f) => f.filter((faq) => faq.id !== id))
    toast.success('FAQ deleted')
  }
  const addFaq = () => {
    if (!newQ.trim() || !newA.trim()) { toast.error('Both fields are required'); return }
    setFaqs((f) => [...f, { id: Date.now().toString(), question: newQ, answer: newA, expanded: true }])
    setNewQ(''); setNewA(''); setAdding(false)
    toast.success('FAQ added')
  }
  const moveFaq = (idx: number, dir: -1 | 1) => {
    const arr = [...faqs]; const target = idx + dir
    if (target < 0 || target >= arr.length) return
    ;[arr[idx], arr[target]] = [arr[target], arr[idx]]
    setFaqs(arr)
  }
  return (
    <div className="space-y-6">
      <SectionTitle title="FAQ Editor" desc="Manage frequently asked questions for the public website" action={<Button onClick={() => setAdding(true)}><Plus className="h-4 w-4 mr-1" /> Add FAQ</Button>} />
      {adding && (
        <Card className="border-[var(--gold)]/40">
          <CardContent className="space-y-3 p-4">
            <div className="space-y-1"><Label className="text-xs">Question</Label><Input value={newQ} onChange={(e) => setNewQ(e.target.value)} placeholder="Enter question..." /></div>
            <div className="space-y-1"><Label className="text-xs">Answer</Label><Textarea value={newA} onChange={(e) => setNewA(e.target.value)} placeholder="Enter answer..." rows={3} /></div>
            <div className="flex gap-2"><Button size="sm" onClick={addFaq}>Save</Button><Button size="sm" variant="outline" onClick={() => setAdding(false)}>Cancel</Button></div>
          </CardContent>
        </Card>
      )}
      <div className="space-y-2">
        {faqs.map((faq, idx) => (
          <Card key={faq.id}>
            <CardContent className="p-0">
              <div className="flex items-center gap-3 p-4">
                <div className="flex flex-col gap-0.5 text-muted-foreground">
                  <button disabled={idx === 0} onClick={() => moveFaq(idx, -1)}><ChevronUp className="h-3.5 w-3.5" /></button>
                  <button disabled={idx === faqs.length - 1} onClick={() => moveFaq(idx, 1)}><ChevronDown className="h-3.5 w-3.5" /></button>
                </div>
                <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                <button className="flex-1 text-left min-w-0" onClick={() => toggleExpand(faq.id)}>
                  <p className="text-sm font-medium text-[var(--navy)] dark:text-white">{faq.question}</p>
                  {faq.expanded && <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{faq.answer}</p>}
                </button>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-400 hover:text-red-600 shrink-0" onClick={() => deleteFaq(faq.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// 9. CAREERS MANAGER
// ═══════════════════════════════════════════════════════════════════════════

interface Job { id: string; title: string; department: string; location: string; type: string; salary: string; status: 'Published' | 'Draft' }

const INITIAL_JOBS: Job[] = [
  { id: '1', title: 'Senior React Developer', department: 'Engineering', location: 'Mumbai, MH', type: 'Full-time', salary: '₹18L – ₹28L', status: 'Published' },
  { id: '2', title: 'HR Business Partner', department: 'Human Resources', location: 'Bengaluru, KA', type: 'Full-time', salary: '₹12L – ₹20L', status: 'Published' },
  { id: '3', title: 'DevOps Engineer', department: 'Engineering', location: 'Hyderabad, TS', type: 'Full-time', salary: '₹15L – ₹25L', status: 'Published' },
  { id: '4', title: 'Content Marketing Intern', department: 'Marketing', location: 'Remote', type: 'Internship', salary: '₹15K – ₹25K /mo', status: 'Draft' },
  { id: '5', title: 'Product Manager', department: 'Product', location: 'Gurugram, HR', type: 'Full-time', salary: '₹22L – ₹35L', status: 'Draft' },
]

const DEPARTMENTS = ['Engineering', 'Human Resources', 'Marketing', 'Product', 'Sales', 'Finance', 'Design']
const JOB_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship']

export function CareersManager({ refreshKey }: { refreshKey?: number }) {
  const [jobs, setJobs] = useState(INITIAL_JOBS)
  const [dialog, setDialog] = useState(false)
  const [form, setForm] = useState<Job>({ id: '', title: '', department: 'Engineering', location: '', type: 'Full-time', salary: '', status: 'Draft' })
  const toggleStatus = (id: string) => {
    setJobs((j) => j.map((job) => job.id === id ? { ...job, status: job.status === 'Published' ? 'Draft' : 'Published' } : job))
    toast.success('Job status updated')
  }
  const openAdd = () => { setForm({ id: '', title: '', department: 'Engineering', location: '', type: 'Full-time', salary: '', status: 'Draft' }); setDialog(true) }
  const openEdit = (job: Job) => { setForm({ ...job }); setDialog(true) }
  const saveJob = () => {
    if (!form.title.trim()) { toast.error('Job title is required'); return }
    if (form.id) {
      setJobs((j) => j.map((job) => job.id === form.id ? form : job))
      toast.success('Job updated')
    } else {
      setJobs((j) => [...j, { ...form, id: Date.now().toString() }])
      toast.success('Job posted')
    }
    setDialog(false)
  }
  return (
    <div className="space-y-6">
      <SectionTitle title="Careers Manager" desc="Manage job listings on the careers page" action={<Button onClick={openAdd}><Plus className="h-4 w-4 mr-1" /> Add Job</Button>} />
      <Card>
        <CardContent className="p-0">
          <div className="max-h-96 overflow-y-auto">
            <Table><TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Department</TableHead><TableHead>Location</TableHead><TableHead>Type</TableHead><TableHead>Salary</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {jobs.map((job) => (
                <TableRow key={job.id}>
                  <TableCell className="font-medium">{job.title}</TableCell>
                  <TableCell>{job.department}</TableCell>
                  <TableCell className="text-muted-foreground">{job.location}</TableCell>
                  <TableCell><Badge variant="outline">{job.type}</Badge></TableCell>
                  <TableCell className="font-medium">{job.salary}</TableCell>
                  <TableCell><Badge variant="outline" className={job.status === 'Published' ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30' : 'bg-gray-500/10 text-gray-500 border-gray-500/30'}>{job.status}</Badge></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => openEdit(job)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => toggleStatus(job.id)}>{job.status === 'Published' ? <Eye className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5 text-muted-foreground" />}</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody></Table>
          </div>
        </CardContent>
      </Card>
      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{form.id ? 'Edit Job' : 'Add New Job'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Senior Software Engineer" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Department</Label><Select value={form.department} onValueChange={(v) => setForm({ ...form, department: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Type</Label><Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{JOB_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Location</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Bengaluru, KA" /></div>
              <div className="space-y-2"><Label>Salary Range</Label><Input value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} placeholder="e.g. ₹12L – ₹20L" /></div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialog(false)}>Cancel</Button><Button onClick={saveJob}>{form.id ? 'Update' : 'Create'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// 10. BLOG MANAGER
// ═══════════════════════════════════════════════════════════════════════════

interface BlogPost { id: string; title: string; slug: string; category: string; author: string; date: string; status: 'Published' | 'Draft' }

const INITIAL_POSTS: BlogPost[] = [
  { id: '1', title: '10 HR Trends Shaping Indian Workplaces in 2025', slug: 'hr-trends-india-2025', category: 'Industry', author: 'Ananya Iyer', date: '2025-06-01', status: 'Published' },
  { id: '2', title: 'How to Calculate TDS on Salary — Complete Guide', slug: 'tds-salary-guide', category: 'Payroll', author: 'Rahul Deshmukh', date: '2025-05-28', status: 'Published' },
  { id: '3', title: 'Building a Culture of Employee Engagement', slug: 'employee-engagement-culture', category: 'Culture', author: 'Priya Menon', date: '2025-05-20', status: 'Published' },
  { id: '4', title: 'AI in Recruitment: Myth vs Reality', slug: 'ai-recruitment-myths', category: 'Technology', author: 'Vikram Singh', date: '2025-06-10', status: 'Draft' },
]

const BLOG_CATEGORIES = ['Industry', 'Payroll', 'Culture', 'Technology', 'Product Updates', 'Compliance', 'HR Tips']

export function BlogManager({ refreshKey }: { refreshKey?: number }) {
  const [posts, setPosts] = useState(INITIAL_POSTS)
  const [dialog, setDialog] = useState(false)
  const [form, setForm] = useState<BlogPost>({ id: '', title: '', slug: '', category: 'Industry', author: '', date: '', status: 'Draft' })
  const openAdd = () => { setForm({ id: '', title: '', slug: '', category: 'Industry', author: '', date: new Date().toISOString().split('T')[0], status: 'Draft' }); setDialog(true) }
  const savePost = () => {
    if (!form.title.trim()) { toast.error('Title is required'); return }
    const slug = form.slug || form.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    if (form.id) {
      setPosts((p) => p.map((post) => post.id === form.id ? { ...form, slug } : post))
      toast.success('Post updated')
    } else {
      setPosts((p) => [...p, { ...form, id: Date.now().toString(), slug }])
      toast.success('Post created')
    }
    setDialog(false)
  }
  const togglePublish = (id: string) => {
    setPosts((p) => p.map((post) => post.id === id ? { ...post, status: post.status === 'Published' ? 'Draft' : 'Published' } : post))
    toast.success('Post status toggled')
  }
  return (
    <div className="space-y-6">
      <SectionTitle title="Blog Manager" desc="Create and manage blog posts for the public blog" action={<Button onClick={openAdd}><Plus className="h-4 w-4 mr-1" /> New Post</Button>} />
      <Card>
        <CardContent className="p-0">
          <div className="max-h-96 overflow-y-auto">
            <Table><TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Slug</TableHead><TableHead>Category</TableHead><TableHead>Author</TableHead><TableHead>Date</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {posts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell className="font-medium max-w-[200px] truncate">{post.title}</TableCell>
                  <TableCell className="text-muted-foreground text-xs font-mono max-w-[140px] truncate">{post.slug}</TableCell>
                  <TableCell><Badge variant="outline">{post.category}</Badge></TableCell>
                  <TableCell className="text-sm">{post.author}</TableCell>
                  <TableCell className="text-muted-foreground text-xs">{new Date(post.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</TableCell>
                  <TableCell><Badge variant="outline" className={post.status === 'Published' ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30' : 'bg-gray-500/10 text-gray-500 border-gray-500/30'}>{post.status}</Badge></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => { setForm(post); setDialog(true) }}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => togglePublish(post.id)}>{post.status === 'Published' ? <Eye className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody></Table>
          </div>
        </CardContent>
      </Card>
      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{form.id ? 'Edit Post' : 'New Blog Post'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Enter post title..." /></div>
            <div className="space-y-2"><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="auto-generated-from-title" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Category</Label><Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{BLOG_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Author</Label><Input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} placeholder="Author name" /></div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDialog(false)}>Cancel</Button><Button onClick={savePost}>{form.id ? 'Update' : 'Publish'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// 11. SOCIAL MEDIA MANAGER
// ═══════════════════════════════════════════════════════════════════════════

interface SocialPlatform { id: string; name: string; icon: React.ReactNode; url: string; enabled: boolean }

const INITIAL_SOCIALS: SocialPlatform[] = [
  { id: 'linkedin', name: 'LinkedIn', icon: <Linkedin className="h-5 w-5" />, url: 'https://linkedin.com/company/hphrms', enabled: true },
  { id: 'twitter', name: 'Twitter / X', icon: <Twitter className="h-5 w-5" />, url: 'https://x.com/hphrms', enabled: true },
  { id: 'instagram', name: 'Instagram', icon: <Instagram className="h-5 w-5" />, url: 'https://instagram.com/hphrms', enabled: true },
  { id: 'facebook', name: 'Facebook', icon: <Facebook className="h-5 w-5" />, url: 'https://facebook.com/hphrms', enabled: false },
  { id: 'youtube', name: 'YouTube', icon: <Youtube className="h-5 w-5" />, url: 'https://youtube.com/@hphrms', enabled: true },
]

export function SocialMediaManager({ refreshKey }: { refreshKey?: number }) {
  const [socials, setSocials] = useState(INITIAL_SOCIALS)
  const updateUrl = (id: string, url: string) => setSocials((s) => s.map((p) => p.id === id ? { ...p, url } : p))
  const toggleEnabled = (id: string) => setSocials((s) => s.map((p) => p.id === id ? { ...p, enabled: !p.enabled } : p))
  const handleSave = () => toast.success('Social media links saved!')
  return (
    <div className="space-y-6">
      <SectionTitle title="Social Media Manager" desc="Configure social media links displayed on the website" action={<Button onClick={handleSave}><Save className="h-4 w-4 mr-1" /> Save Links</Button>} />
      <Card>
        <CardHeader><CardTitle className="text-base">Platform Links</CardTitle><p className="text-xs text-muted-foreground">Enable or disable platforms and set their profile URLs.</p></CardHeader>
        <CardContent className="space-y-4">
          {socials.map((platform) => (
            <div key={platform.id} className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${platform.enabled ? 'bg-card' : 'bg-muted/40 opacity-60'}`}>
              <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${platform.enabled ? 'bg-[var(--navy)]/10 text-[var(--navy)] dark:text-[var(--gold-light)]' : 'bg-muted text-muted-foreground'}`}>
                {platform.icon}
              </div>
              <div className="flex-1 min-w-0">
                <Label className="text-sm font-medium">{platform.name}</Label>
                <Input value={platform.url} onChange={(e) => updateUrl(platform.id, e.target.value)} disabled={!platform.enabled} className="mt-1 h-8 text-sm" placeholder={`https://${platform.id}.com/...`} />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">{platform.enabled ? 'Active' : 'Disabled'}</span>
                <Switch checked={platform.enabled} onCheckedChange={() => toggleEnabled(platform.id)} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// 12. BACKUP & RESTORE
// ═══════════════════════════════════════════════════════════════════════════

interface BackupEntry { id: string; date: string; size: string; type: 'Auto' | 'Manual' }

const INITIAL_BACKUPS: BackupEntry[] = [
  { id: '1', date: '2025-06-14 03:00 AM', size: '245 MB', type: 'Auto' },
  { id: '2', date: '2025-06-13 03:00 AM', size: '244 MB', type: 'Auto' },
  { id: '3', date: '2025-06-12 14:30 PM', size: '243 MB', type: 'Manual' },
  { id: '4', date: '2025-06-12 03:00 AM', size: '243 MB', type: 'Auto' },
  { id: '5', date: '2025-06-11 03:00 AM', size: '241 MB', type: 'Auto' },
]

export function BackupRestore({ refreshKey }: { refreshKey?: number }) {
  const [backups, setBackups] = useState(INITIAL_BACKUPS)
  const [autoBackup, setAutoBackup] = useState(true)
  const [schedule, setSchedule] = useState('Daily')
  const [creating, setCreating] = useState(false)
  const createBackup = () => {
    setCreating(true)
    setTimeout(() => {
      const newBackup: BackupEntry = { id: Date.now().toString(), date: new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }), size: `${(240 + Math.random() * 10).toFixed(0)} MB`, type: 'Manual' }
      setBackups((b) => [newBackup, ...b])
      setCreating(false)
      toast.success('Backup created successfully!')
    }, 1500)
  }
  const restoreBackup = (id: string, date: string) => {
    if (!window.confirm(`Restore backup from ${date}? This will overwrite current data.`)) return
    toast.success('Backup restoration initiated. This may take a few minutes.')
  }
  const deleteBackup = (id: string) => {
    if (!window.confirm('Permanently delete this backup?')) return
    setBackups((b) => b.filter((bk) => bk.id !== id))
    toast.success('Backup deleted')
  }
  return (
    <div className="space-y-6">
      <SectionTitle title="Backup & Restore" desc="Create, schedule, and restore database backups" />
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <Card><CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--navy)]/10 text-[var(--navy)] dark:text-[var(--gold-light)]"><HardDrive className="h-5 w-5" /></div><div><p className="text-sm font-medium">Manual Backup</p><p className="text-xs text-muted-foreground">Create a full backup now</p></div></div>
          <Button className="w-full" onClick={createBackup} disabled={creating}>{creating ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Creating...</> : <><Download className="h-4 w-4 mr-2" /> Create Backup</>}</Button>
        </CardContent></Card>
        <Card><CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--gold)]/15 text-[#8a6f24]"><CalendarDays className="h-5 w-5" /></div><div><p className="text-sm font-medium">Auto-Backup</p><p className="text-xs text-muted-foreground">Schedule automatic backups</p></div></div>
          <div className="flex items-center justify-between"><Label className="text-sm">Enable Auto-Backup</Label><Switch checked={autoBackup} onCheckedChange={setAutoBackup} /></div>
          <div className="space-y-1"><Label className="text-xs text-muted-foreground">Schedule</Label><Select value={schedule} onValueChange={setSchedule} disabled={!autoBackup}><SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Daily">Daily</SelectItem><SelectItem value="Weekly">Weekly</SelectItem><SelectItem value="Monthly">Monthly</SelectItem></SelectContent></Select></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600"><Undo2 className="h-5 w-5" /></div><div><p className="text-sm font-medium">Quick Restore</p><p className="text-xs text-muted-foreground">Restore from latest backup</p></div></div>
          <Button variant="outline" className="w-full" onClick={() => restoreBackup(backups[0]?.id || '', backups[0]?.date || '')}><RefreshCw className="h-4 w-4 mr-2" /> Restore Latest</Button>
        </CardContent></Card>
      </div>
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Backup History</CardTitle><p className="text-xs text-muted-foreground">Recent backups — newest first</p></CardHeader>
        <CardContent className="p-0">
          <div className="max-h-96 overflow-y-auto">
            <Table><TableHeader><TableRow><TableHead>Date & Time</TableHead><TableHead>Size</TableHead><TableHead>Type</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {backups.map((bk) => (
                <TableRow key={bk.id}>
                  <TableCell className="text-sm font-medium">{bk.date}</TableCell>
                  <TableCell>{bk.size}</TableCell>
                  <TableCell><Badge variant="outline" className={bk.type === 'Auto' ? 'bg-sky-500/10 text-sky-700 border-sky-500/30' : 'bg-[var(--gold)]/15 text-[#8a6f24] border-[var(--gold)]/30'}>{bk.type}</Badge></TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => restoreBackup(bk.id, bk.date)}><Undo2 className="h-3.5 w-3.5 mr-1" /> Restore</Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-400 hover:text-red-600" onClick={() => deleteBackup(bk.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody></Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// PART 2 — FULL IMPLEMENTATIONS
// ═══════════════════════════════════════════════════════════════════════════

// ─── 1. HPAI Management ───────────────────────────────────────────────────
export function HPAIManagement({ refreshKey }: { refreshKey?: number }) {
  const [model, setModel] = useState('gpt-4')
  const [temperature, setTemperature] = useState(0.7)
  const [maxTokens, setMaxTokens] = useState('2048')
  const [systemPrompt, setSystemPrompt] = useState('You are a helpful HR assistant for HPHRMS Enterprise.')
  const rateLimits = [
    { role: 'Super Admin', rpm: 100, daily: 5000 },
    { role: 'HR Manager', rpm: 50, daily: 2000 },
    { role: 'Employee', rpm: 20, daily: 500 },
    { role: 'Client', rpm: 10, daily: 200 },
  ]
  return (
    <div className="space-y-6">
      <SectionTitle title="HPAI Management" desc="Configure AI platform settings and capabilities" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Zap className="h-4 w-4 text-[var(--gold)]" />} label="Today's Calls" value="1,247" trend="up" />
        <StatCard icon={<Cpu className="h-4 w-4 text-[var(--gold)]" />} label="Tokens Used" value="2.4M" trend="up" />
        <StatCard icon={<Clock className="h-4 w-4 text-[var(--gold)]" />} label="Avg Response" value="1.2s" trend="down" />
        <StatCard icon={<DollarSign className="h-4 w-4 text-[var(--gold)]" />} label="Cost Today" value="$34.50" trend="up" />
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">AI Configuration</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Model</Label>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4">GPT-4</SelectItem>
                  <SelectItem value="gpt-3.5">GPT-3.5</SelectItem>
                  <SelectItem value="claude">Claude</SelectItem>
                  <SelectItem value="gemini">Gemini</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Max Tokens</Label>
              <Input type="number" value={maxTokens} onChange={e => setMaxTokens(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Temperature: {temperature}</Label>
            <Slider min={0} max={2} step={0.1} value={[temperature]} onValueChange={v => setTemperature(v[0])} />
          </div>
          <div className="space-y-2"><Label>System Prompt</Label>
            <Textarea value={systemPrompt} onChange={e => setSystemPrompt(e.target.value)} rows={3} />
          </div>
          <Button className="bg-[#D4AF37] hover:bg-[#D4AF37]/80 text-black" onClick={() => toast.success('AI config saved')}><Save className="h-4 w-4 mr-2" />Save Configuration</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">Rate Limits per Role</CardTitle></CardHeader>
        <CardContent>
          <Table><TableHeader><TableRow><TableHead>Role</TableHead><TableHead className="text-right">Requests/min</TableHead><TableHead className="text-right">Daily Limit</TableHead></TableRow></TableHeader>
            <TableBody>{rateLimits.map(r => (
              <TableRow key={r.role}><TableCell className="font-medium">{r.role}</TableCell><TableCell className="text-right">{r.rpm}</TableCell><TableCell className="text-right">{r.daily.toLocaleString()}</TableCell></TableRow>
            ))}</TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── 2. AI Models ──────────────────────────────────────────────────────────
export function AIModels({ refreshKey }: { refreshKey?: number }) {
  const [models, setModels] = useState([
    { id: 1, name: 'GPT-4 Turbo', provider: 'OpenAI', version: 'v1.0.5', status: 'Active' as const, capabilities: ['Chat', 'Vision', 'Function Calling'], cost: 0.03 },
    { id: 2, name: 'GPT-3.5 Turbo', provider: 'OpenAI', version: 'v2.1.0', status: 'Active' as const, capabilities: ['Chat', 'Code'], cost: 0.002 },
    { id: 3, name: 'Claude 3 Opus', provider: 'Anthropic', version: 'v3.0', status: 'Beta' as const, capabilities: ['Chat', 'Analysis', 'Vision'], cost: 0.015 },
    { id: 4, name: 'Gemini Pro', provider: 'Google', version: 'v1.5', status: 'Active' as const, capabilities: ['Chat', 'Multimodal'], cost: 0.00125 },
    { id: 5, name: 'LLaMA 2 70B', provider: 'Meta', version: 'v2.0', status: 'Deprecated' as const, capabilities: ['Chat', 'Code'], cost: 0.0 },
  ])
  const [addOpen, setAddOpen] = useState(false)
  const statusColor: Record<string, string> = { Active: 'bg-emerald-100 text-emerald-700', Beta: 'bg-amber-100 text-amber-700', Deprecated: 'bg-red-100 text-red-700' }
  const toggleModel = (id: number) => {
    setModels(prev => prev.map(m => m.id === id ? { ...m, status: m.status === 'Active' ? ('Deprecated' as const) : ('Active' as const) } : m))
    toast.success('Model status toggled')
  }
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <SectionTitle title="AI Models" desc="Manage AI model configurations and deployments" />
        <Button className="bg-[#D4AF37] hover:bg-[#D4AF37]/80 text-black" onClick={() => setAddOpen(true)}><Plus className="h-4 w-4 mr-2" />Add Model</Button>
      </div>
      <Card><CardContent className="p-0">
        <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Model</TableHead><TableHead>Provider</TableHead><TableHead>Version</TableHead><TableHead>Status</TableHead><TableHead>Capabilities</TableHead><TableHead className="text-right">Cost/1K tokens</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>{models.map(m => (
            <TableRow key={m.id}>
              <TableCell className="font-medium">{m.name}</TableCell>
              <TableCell>{m.provider}</TableCell>
              <TableCell>{m.version}</TableCell>
              <TableCell><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[m.status]}`}>{m.status}</span></TableCell>
              <TableCell><div className="flex flex-wrap gap-1">{m.capabilities.map(c => <Badge key={c} variant="secondary" className="text-xs">{c}</Badge>)}</div></TableCell>
              <TableCell className="text-right">${m.cost.toFixed(4)}</TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <Button size="sm" variant="outline" onClick={() => toast.info(`Configure ${m.name}`)}><Settings className="h-3.5 w-3.5" /></Button>
                  <Button size="sm" variant="outline" onClick={() => toggleModel(m.id)}><RefreshCw className="h-3.5 w-3.5" /></Button>
                </div>
              </TableCell>
            </TableRow>
          ))}</TableBody></Table></div>
      </CardContent></Card>
      <Dialog open={addOpen} onOpenChange={setAddOpen}><DialogContent><DialogHeader><DialogTitle>Add New Model</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2"><Label>Model Name</Label><Input placeholder="e.g. GPT-5" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Provider</Label><Input placeholder="e.g. OpenAI" /></div>
            <div className="space-y-2"><Label>Version</Label><Input placeholder="e.g. v1.0" /></div>
          </div>
          <div className="space-y-2"><Label>Cost per 1K Tokens ($)</Label><Input type="number" step="0.001" placeholder="0.01" /></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
          <Button className="bg-[#D4AF37] hover:bg-[#D4AF37]/80 text-black" onClick={() => { setAddOpen(false); toast.success('Model added') }}>Add Model</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── 3. Prompt Library ─────────────────────────────────────────────────────
export function PromptLibrary({ refreshKey }: { refreshKey?: number }) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [addOpen, setAddOpen] = useState(false)
  const [prompts, setPrompts] = useState([
    { id: 1, name: 'Employee Onboarding', category: 'HR', description: 'Generate onboarding checklists and welcome messages for new employees joining the organization.', variables: ['name', 'department', 'start_date'] },
    { id: 2, name: 'Leave Request Summary', category: 'HR', description: 'Summarize leave requests and provide approval recommendations based on team availability.', variables: ['employee', 'leave_type', 'dates'] },
    { id: 3, name: 'Payroll Explanation', category: 'Finance', description: 'Generate detailed payroll breakdown explanations for employee pay slips.', variables: ['employee', 'month', 'deductions'] },
    { id: 4, name: 'Interview Questions', category: 'Recruitment', description: 'Generate role-specific interview questions based on job description and requirements.', variables: ['role', 'level', 'skills'] },
    { id: 5, name: 'Policy Summary', category: 'Compliance', description: 'Summarize company policies into plain language for employee handbooks.', variables: ['policy_name', 'section'] },
    { id: 6, name: 'Performance Review', category: 'HR', description: 'Draft performance review narratives based on metrics and goals data.', variables: ['employee', 'period', 'ratings'] },
  ])
  const filtered = useMemo(() => prompts.filter(p => {
    if (category !== 'all' && p.category !== category) return false
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  }), [prompts, search, category])
  const deletePrompt = (id: number) => { setPrompts(prev => prev.filter(p => p.id !== id)); toast.success('Prompt deleted') }
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <SectionTitle title="Prompt Library" desc="Manage and version AI prompt templates" />
        <Button className="bg-[#D4AF37] hover:bg-[#D4AF37]/80 text-black" onClick={() => setAddOpen(true)}><Plus className="h-4 w-4 mr-2" />Add Prompt</Button>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search prompts..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div>
        <Select value={category} onValueChange={setCategory}><SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All Categories</SelectItem><SelectItem value="HR">HR</SelectItem><SelectItem value="Finance">Finance</SelectItem><SelectItem value="Recruitment">Recruitment</SelectItem><SelectItem value="Compliance">Compliance</SelectItem></SelectContent>
        </Select>
      </div>
      <Card><CardContent className="p-0"><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Category</TableHead><TableHead className="hidden md:table-cell">Description</TableHead><TableHead>Variables</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>{filtered.map(p => (
            <TableRow key={p.id}>
              <TableCell className="font-medium">{p.name}</TableCell>
              <TableCell><Badge variant="outline">{p.category}</Badge></TableCell>
              <TableCell className="hidden md:table-cell max-w-xs truncate text-muted-foreground text-sm">{p.description}</TableCell>
              <TableCell><div className="flex flex-wrap gap-1">{p.variables.map(v => <Badge key={v} variant="secondary" className="text-xs font-mono">{`{${v}}`}</Badge>)}</div></TableCell>
              <TableCell className="text-right"><div className="flex justify-end gap-1">
                <Button size="sm" variant="outline" onClick={() => toast.info(`Edit ${p.name}`)}><Pencil className="h-3.5 w-3.5" /></Button>
                <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700" onClick={() => deletePrompt(p.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div></TableCell>
            </TableRow>
          ))}</TableBody></Table></div></CardContent></Card>
      <Dialog open={addOpen} onOpenChange={setAddOpen}><DialogContent><DialogHeader><DialogTitle>Add Prompt Template</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Name</Label><Input placeholder="Prompt name" /></div>
            <div className="space-y-2"><Label>Category</Label><Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="HR">HR</SelectItem><SelectItem value="Finance">Finance</SelectItem><SelectItem value="Recruitment">Recruitment</SelectItem><SelectItem value="Compliance">Compliance</SelectItem></SelectContent></Select></div>
          </div>
          <div className="space-y-2"><Label>Description</Label><Textarea placeholder="Brief description" rows={2} /></div>
          <div className="space-y-2"><Label>Template</Label><Textarea placeholder="Write your prompt template here... Use {variable_name} for variables." rows={4} className="font-mono text-sm" /></div>
          <div className="space-y-2"><Label>Variables (comma separated)</Label><Input placeholder="e.g. name, department, start_date" /></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
          <Button className="bg-[#D4AF37] hover:bg-[#D4AF37]/80 text-black" onClick={() => { setAddOpen(false); toast.success('Prompt template created') }}>Save Prompt</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── 4. Knowledge Manager ──────────────────────────────────────────────────
export function KnowledgeManager({ refreshKey }: { refreshKey?: number }) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [addOpen, setAddOpen] = useState(false)
  const [articles, setArticles] = useState([
    { id: 1, title: 'Employee Leave Policy', category: 'Policy', tags: ['leave', 'absence', 'pto'], status: 'Published' as const, updated: '2025-01-15' },
    { id: 2, title: 'Payroll Processing Guide', category: 'Finance', tags: ['payroll', 'salary', 'taxes'], status: 'Published' as const, updated: '2025-01-10' },
    { id: 3, title: 'Onboarding Checklist', category: 'HR', tags: ['onboarding', 'new-hire', 'orientation'], status: 'Draft' as const, updated: '2025-01-12' },
    { id: 4, title: 'Performance Review Criteria', category: 'HR', tags: ['performance', 'review', 'kpi'], status: 'Published' as const, updated: '2025-01-08' },
    { id: 5, title: 'Workplace Safety Guidelines', category: 'Compliance', tags: ['safety', 'compliance', 'hazard'], status: 'Published' as const, updated: '2025-01-05' },
  ])
  const filtered = useMemo(() => articles.filter(a => {
    if (category !== 'all' && a.category !== category) return false
    if (search && !a.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  }), [articles, search, category])
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <SectionTitle title="Knowledge Manager" desc="Manage AI knowledge base and embeddings" />
        <Button className="bg-[#D4AF37] hover:bg-[#D4AF37]/80 text-black" onClick={() => setAddOpen(true)}><Plus className="h-4 w-4 mr-2" />Add Article</Button>
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search articles..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div>
        <Select value={category} onValueChange={setCategory}><SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Category" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All Categories</SelectItem><SelectItem value="Policy">Policy</SelectItem><SelectItem value="Finance">Finance</SelectItem><SelectItem value="HR">HR</SelectItem><SelectItem value="Compliance">Compliance</SelectItem></SelectContent>
        </Select>
      </div>
      <Card><CardContent className="p-0"><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Title</TableHead><TableHead>Category</TableHead><TableHead className="hidden lg:table-cell">Tags</TableHead><TableHead>Status</TableHead><TableHead className="hidden sm:table-cell">Updated</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>{filtered.map(a => (
            <TableRow key={a.id}>
              <TableCell className="font-medium">{a.title}</TableCell>
              <TableCell><Badge variant="outline">{a.category}</Badge></TableCell>
              <TableCell className="hidden lg:table-cell"><div className="flex flex-wrap gap-1">{a.tags.map(t => <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>)}</div></TableCell>
              <TableCell><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${a.status === 'Published' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{a.status}</span></TableCell>
              <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">{a.updated}</TableCell>
              <TableCell className="text-right"><div className="flex justify-end gap-1">
                <Button size="sm" variant="outline" onClick={() => toast.info(`Edit ${a.title}`)}><Pencil className="h-3.5 w-3.5" /></Button>
                <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700" onClick={() => { setArticles(prev => prev.filter(x => x.id !== a.id)); toast.success('Article deleted') }}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div></TableCell>
            </TableRow>
          ))}</TableBody></Table></div></CardContent></Card>
      <Dialog open={addOpen} onOpenChange={setAddOpen}><DialogContent><DialogHeader><DialogTitle>Add Knowledge Article</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2"><Label>Title</Label><Input placeholder="Article title" /></div>
          <div className="space-y-2"><Label>Category</Label><Select><SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger><SelectContent><SelectItem value="Policy">Policy</SelectItem><SelectItem value="Finance">Finance</SelectItem><SelectItem value="HR">HR</SelectItem><SelectItem value="Compliance">Compliance</SelectItem></SelectContent></Select></div>
          <div className="space-y-2"><Label>Content</Label><Textarea placeholder="Article content..." rows={5} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Tags (comma separated)</Label><Input placeholder="e.g. policy, leave, hr" /></div>
            <div className="space-y-2"><Label>Status</Label><Select defaultValue="Draft"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Draft">Draft</SelectItem><SelectItem value="Published">Published</SelectItem></SelectContent></Select></div>
          </div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
          <Button className="bg-[#D4AF37] hover:bg-[#D4AF37]/80 text-black" onClick={() => { setAddOpen(false); toast.success('Article created') }}>Save Article</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── 5. Custom Domains ─────────────────────────────────────────────────────
export function CustomDomains({ refreshKey }: { refreshKey?: number }) {
  const [domains, setDomains] = useState([
    { id: 1, domain: 'app.acmecorp.com', ssl: 'Active' as const, verified: true, primary: true },
    { id: 2, domain: 'portal.globalhr.io', ssl: 'Pending' as const, verified: false, primary: false },
    { id: 3, domain: 'hr.startupxyz.com', ssl: 'Failed' as const, verified: true, primary: false },
  ])
  const [newDomain, setNewDomain] = useState('')
  const sslColor: Record<string, string> = { Active: 'bg-emerald-100 text-emerald-700', Pending: 'bg-amber-100 text-amber-700', Failed: 'bg-red-100 text-red-700' }
  const addDomain = () => {
    if (!newDomain) return
    setDomains(prev => [...prev, { id: Date.now(), domain: newDomain, ssl: 'Pending' as const, verified: false, primary: false }])
    setNewDomain('')
    toast.success('Domain added — verification pending')
  }
  const verifyDomain = (id: number) => { setDomains(prev => prev.map(d => d.id === id ? { ...d, verified: true, ssl: 'Active' as const } : d)); toast.success('Domain verified & SSL activated') }
  const removeDomain = (id: number) => { setDomains(prev => prev.filter(d => d.id !== id)); toast.success('Domain removed') }
  const togglePrimary = (id: number) => { setDomains(prev => prev.map(d => ({ ...d, primary: d.id === id }))); toast.success('Primary domain updated') }
  return (
    <div className="space-y-6">
      <SectionTitle title="Custom Domains" desc="Manage tenant custom domain mappings" />
      <Card>
        <CardHeader><CardTitle className="text-base">Add New Domain</CardTitle></CardHeader>
        <CardContent><div className="flex flex-col sm:flex-row gap-3">
          <Input placeholder="e.g. app.yourcompany.com" value={newDomain} onChange={e => setNewDomain(e.target.value)} className="flex-1" />
          <Button className="bg-[#D4AF37] hover:bg-[#D4AF37]/80 text-black" onClick={addDomain}><Plus className="h-4 w-4 mr-2" />Add Domain</Button>
        </div></CardContent>
      </Card>
      <Card><CardContent className="p-0"><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Domain</TableHead><TableHead>SSL Status</TableHead><TableHead>Verified</TableHead><TableHead>Primary</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>{domains.map(d => (
            <TableRow key={d.id}>
              <TableCell className="font-medium">{d.domain}</TableCell>
              <TableCell><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sslColor[d.ssl]}`}>{d.ssl}</span></TableCell>
              <TableCell>{d.verified ? <Badge variant="outline" className="text-emerald-600 border-emerald-300"><CheckCircle className="h-3 w-3 mr-1" />Verified</Badge> : <Badge variant="outline" className="text-amber-600 border-amber-300"><XCircle className="h-3 w-3 mr-1" />Pending</Badge>}</TableCell>
              <TableCell><Switch checked={d.primary} onCheckedChange={() => togglePrimary(d.id)} /></TableCell>
              <TableCell className="text-right"><div className="flex justify-end gap-1">
                {!d.verified && <Button size="sm" variant="outline" onClick={() => verifyDomain(d.id)}>Verify</Button>}
                <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700" onClick={() => removeDomain(d.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div></TableCell>
            </TableRow>
          ))}</TableBody></Table></div></CardContent></Card>
    </div>
  )
}

// ─── 6. White Label ────────────────────────────────────────────────────────
export function WhiteLabel({ refreshKey }: { refreshKey?: number }) {
  const [form, setForm] = useState({ companyName: 'HPHRMS Enterprise', logoUrl: '/logo.png', primaryColor: '#002B5C', accentColor: '#D4AF37', faviconUrl: '/favicon.ico', loginMessage: 'Welcome to your HR management portal.', emailSender: 'HPHRMS System' })
  const update = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }))
  return (
    <div className="space-y-6">
      <SectionTitle title="White Label" desc="Customize branding for tenant instances" />
      <Card>
        <CardHeader><CardTitle className="text-base">Brand Settings</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Company Name</Label><Input value={form.companyName} onChange={e => update('companyName', e.target.value)} /></div>
            <div className="space-y-2"><Label>Logo URL</Label><Input value={form.logoUrl} onChange={e => update('logoUrl', e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Primary Color</Label><div className="flex items-center gap-3"><input type="color" value={form.primaryColor} onChange={e => update('primaryColor', e.target.value)} className="h-10 w-14 cursor-pointer rounded border" /><Input value={form.primaryColor} onChange={e => update('primaryColor', e.target.value)} className="flex-1 font-mono" /></div></div>
            <div className="space-y-2"><Label>Accent Color</Label><div className="flex items-center gap-3"><input type="color" value={form.accentColor} onChange={e => update('accentColor', e.target.value)} className="h-10 w-14 cursor-pointer rounded border" /><Input value={form.accentColor} onChange={e => update('accentColor', e.target.value)} className="flex-1 font-mono" /></div></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Favicon URL</Label><Input value={form.faviconUrl} onChange={e => update('faviconUrl', e.target.value)} /></div>
            <div className="space-y-2"><Label>Email Sender Name</Label><Input value={form.emailSender} onChange={e => update('emailSender', e.target.value)} /></div>
          </div>
          <div className="space-y-2"><Label>Custom Login Message</Label><Textarea value={form.loginMessage} onChange={e => update('loginMessage', e.target.value)} rows={3} /></div>
          <Button className="bg-[#D4AF37] hover:bg-[#D4AF37]/80 text-black" onClick={() => toast.success('White label settings saved')}><Save className="h-4 w-4 mr-2" />Save Settings</Button>
        </CardContent>
      </Card>
    </div>
  )
}

// ─── 7. Branding ───────────────────────────────────────────────────────────
export function Branding({ refreshKey }: { refreshKey?: number }) {
  const [colors, setColors] = useState({ primary: '#002B5C', secondary: '#1a3a6b', accent: '#D4AF37', background: '#ffffff' })
  const [css, setCss] = useState('/* Custom CSS overrides */\n.hero-section {\n  min-height: 60vh;\n}')
  const updateColor = (k: string, v: string) => setColors(prev => ({ ...prev, [k]: v }))
  return (
    <div className="space-y-6">
      <SectionTitle title="Branding" desc="Theme colors, logos, and visual identity" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Theme Colors</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {(['primary', 'secondary', 'accent', 'background'] as const).map(key => (
              <div key={key} className="flex items-center gap-3">
                <input type="color" value={colors[key]} onChange={e => updateColor(key, e.target.value)} className="h-10 w-14 cursor-pointer rounded border" />
                <div className="flex-1"><p className="text-sm font-medium capitalize">{key}</p><p className="text-xs text-muted-foreground font-mono">{colors[key]}</p></div>
                <div className="w-8 h-8 rounded-md border" style={{ backgroundColor: colors[key] }} />
              </div>
            ))}
          </CardContent>
        </Card>
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Logo Upload</CardTitle></CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-[var(--gold)] transition-colors" onClick={() => toast.info('File upload dialog would open here')}>
                <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Click or drag logo file here</p>
                <p className="text-xs text-muted-foreground mt-1">PNG, SVG, or WebP — max 2MB</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Custom CSS</CardTitle></CardHeader>
            <CardContent><Textarea value={css} onChange={e => setCss(e.target.value)} rows={4} className="font-mono text-sm" /></CardContent>
          </Card>
        </div>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Preview</CardTitle></CardHeader>
        <CardContent>
          <div className="rounded-lg border p-6 space-y-3" style={{ backgroundColor: colors.background }}>
            <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg" style={{ backgroundColor: colors.primary }} /><div><p className="font-semibold" style={{ color: colors.primary }}>Company Name</p><p className="text-xs" style={{ color: colors.secondary }}>Tagline goes here</p></div></div>
            <Separator />
            <div className="flex gap-2">
              <span className="px-4 py-2 rounded text-sm text-white" style={{ backgroundColor: colors.primary }}>Primary Button</span>
              <span className="px-4 py-2 rounded text-sm text-white" style={{ backgroundColor: colors.accent }}>Accent Button</span>
            </div>
            <p className="text-sm" style={{ color: colors.secondary }}>Sample content text rendered with your brand colors.</p>
          </div>
        </CardContent>
      </Card>
      <Button className="bg-[#D4AF37] hover:bg-[#D4AF37]/80 text-black" onClick={() => toast.success('Branding settings saved')}><Save className="h-4 w-4 mr-2" />Save Branding</Button>
    </div>
  )
}

// ─── 8. Themes ─────────────────────────────────────────────────────────────
export function Themes({ refreshKey }: { refreshKey?: number }) {
  const [activeTheme, setActiveTheme] = useState('navy')
  const themes = [
    { id: 'navy', name: 'Default Navy', primary: '#002B5C', secondary: '#1a3a6b', accent: '#D4AF37', bg: '#ffffff', text: '#002B5C' },
    { id: 'dark', name: 'Dark Mode', primary: '#0f172a', secondary: '#1e293b', accent: '#D4AF37', bg: '#0f172a', text: '#e2e8f0' },
    { id: 'ocean', name: 'Ocean Blue', primary: '#0369a1', secondary: '#0284c7', accent: '#22d3ee', bg: '#f0f9ff', text: '#0c4a6e' },
    { id: 'forest', name: 'Forest Green', primary: '#166534', secondary: '#15803d', accent: '#86efac', bg: '#f0fdf4', text: '#14532d' },
    { id: 'purple', name: 'Royal Purple', primary: '#581c87', secondary: '#6b21a8', accent: '#c084fc', bg: '#faf5ff', text: '#3b0764' },
    { id: 'sunset', name: 'Sunset Orange', primary: '#9a3412', secondary: '#c2410c', accent: '#fdba74', bg: '#fff7ed', text: '#7c2d12' },
  ]
  return (
    <div className="space-y-6">
      <SectionTitle title="Themes" desc="Interface theme management and customization" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {themes.map(t => (
          <Card key={t.id} className={`cursor-pointer transition-all hover:shadow-md ${activeTheme === t.id ? 'ring-2 ring-[#D4AF37] shadow-md' : ''}`} onClick={() => { setActiveTheme(t.id); toast.success(`Theme applied: ${t.name}`) }}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full" style={{ backgroundColor: t.primary }} />
                <div className="w-8 h-8 rounded-full" style={{ backgroundColor: t.secondary }} />
                <div className="w-8 h-8 rounded-full" style={{ backgroundColor: t.accent }} />
                <div className="w-8 h-8 rounded-full border" style={{ backgroundColor: t.bg }} />
              </div>
              <div className="rounded-lg border p-3" style={{ backgroundColor: t.bg }}>
                <div className="flex items-center gap-2 mb-2"><div className="w-5 h-5 rounded" style={{ backgroundColor: t.primary }} /><div className="h-2 rounded-full w-20" style={{ backgroundColor: t.secondary }} /></div>
                <div className="space-y-1"><div className="h-2 rounded-full w-full" style={{ backgroundColor: `${t.primary}20` }} /><div className="h-2 rounded-full w-3/4" style={{ backgroundColor: `${t.primary}15` }} /></div>
              </div>
              <div className="flex items-center justify-between">
                <p className="font-medium text-sm" style={{ color: t.text }}>{t.name}</p>
                {activeTheme === t.id && <Badge className="bg-[#D4AF37] text-black">Active</Badge>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

// ─── 9. Email Templates Manager ────────────────────────────────────────────
export function EmailTemplatesManager({ refreshKey }: { refreshKey?: number }) {
  const [editOpen, setEditOpen] = useState(false)
  const [selected, setSelected] = useState<typeof templates[0] | null>(null)
  const [editSubject, setEditSubject] = useState('')
  const [editBody, setEditBody] = useState('')
  const templates = [
    { id: 1, name: 'Welcome Email', subject: 'Welcome to HPHRMS Enterprise!', modified: '2025-01-14', status: 'Active' },
    { id: 2, name: 'Password Reset', subject: 'Reset Your Password', modified: '2025-01-10', status: 'Active' },
    { id: 3, name: 'Invoice Generated', subject: 'Your Invoice is Ready', modified: '2025-01-12', status: 'Active' },
    { id: 4, name: 'Leave Approved', subject: 'Your Leave Request Has Been Approved', modified: '2025-01-08', status: 'Active' },
    { id: 5, name: 'Leave Rejected', subject: 'Your Leave Request Update', modified: '2025-01-08', status: 'Active' },
    { id: 6, name: 'Interview Scheduled', subject: 'Interview Confirmation', modified: '2025-01-05', status: 'Draft' },
    { id: 7, name: 'Offer Letter', subject: 'Congratulations! Your Offer Letter', modified: '2025-01-03', status: 'Active' },
    { id: 8, name: 'Account Activated', subject: 'Your Account Has Been Activated', modified: '2025-01-01', status: 'Active' },
  ]
  const openEdit = (t: typeof templates[0]) => { setSelected(t); setEditSubject(t.subject); setEditBody(`Dear {{name}},\n\n${t.subject}\n\nBest regards,\nHPHRMS Team`); setEditOpen(true) }
  return (
    <div className="space-y-6">
      <SectionTitle title="Email Templates Manager" desc="Super admin email template management" />
      <Card><CardContent className="p-0"><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Template Name</TableHead><TableHead className="hidden sm:table-cell">Subject</TableHead><TableHead className="hidden md:table-cell">Last Modified</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>{templates.map(t => (
            <TableRow key={t.id}>
              <TableCell className="font-medium"><div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" />{t.name}</div></TableCell>
              <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">{t.subject}</TableCell>
              <TableCell className="hidden md:table-cell text-muted-foreground text-sm">{t.modified}</TableCell>
              <TableCell><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${t.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{t.status}</span></TableCell>
              <TableCell className="text-right"><div className="flex justify-end gap-1">
                <Button size="sm" variant="outline" onClick={() => openEdit(t)}><Pencil className="h-3.5 w-3.5" /></Button>
                <Button size="sm" variant="outline" onClick={() => toast.info(`Preview: ${t.name}`)}><Eye className="h-3.5 w-3.5" /></Button>
              </div></TableCell>
            </TableRow>
          ))}</TableBody></Table></div></CardContent></Card>
      <Dialog open={editOpen} onOpenChange={setEditOpen}><DialogContent className="max-w-lg"><DialogHeader><DialogTitle>Edit: {selected?.name}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2"><Label>Subject</Label><Input value={editSubject} onChange={e => setEditSubject(e.target.value)} /></div>
          <div className="space-y-2"><Label>Body</Label><Textarea value={editBody} onChange={e => setEditBody(e.target.value)} rows={8} className="font-mono text-sm" /></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button className="bg-[#D4AF37] hover:bg-[#D4AF37]/80 text-black" onClick={() => { setEditOpen(false); toast.success('Template saved') }}>Save Template</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── 10. WhatsApp Templates ────────────────────────────────────────────────
export function WhatsAppTemplates({ refreshKey }: { refreshKey?: number }) {
  const [addOpen, setAddOpen] = useState(false)
  const [templates, setTemplates] = useState([
    { id: 1, name: 'Interview Reminder', category: 'Recruitment', language: 'English', status: 'Approved' as const, content: 'Hello {{name}}, this is a reminder for your interview scheduled on {{date}} at {{time}}. Please be prepared.' },
    { id: 2, name: 'Leave Confirmation', category: 'HR', language: 'English', status: 'Approved' as const, content: 'Hi {{name}}, your {{leave_type}} leave from {{start}} to {{end}} has been approved.' },
    { id: 3, name: 'Payroll Notification', category: 'Finance', language: 'English', status: 'Pending' as const, content: 'Dear {{name}}, your salary for {{month}} has been processed. Amount: {{amount}}.' },
    { id: 4, name: 'Onboarding Welcome', category: 'HR', language: 'English', status: 'Rejected' as const, content: 'Welcome to the team, {{name}}! Your first day is {{start_date}}. Please report to {{location}}.' },
    { id: 5, name: 'Birthday Greeting', category: 'Engagement', language: 'English', status: 'Approved' as const, content: 'Happy Birthday, {{name}}! 🎂 We wish you a wonderful day and a great year ahead!' },
  ])
  const statusColor: Record<string, string> = { Approved: 'bg-emerald-100 text-emerald-700', Pending: 'bg-amber-100 text-amber-700', Rejected: 'bg-red-100 text-red-700' }
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <SectionTitle title="WhatsApp Templates" desc="Manage WhatsApp message templates" />
        <Button className="bg-[#D4AF37] hover:bg-[#D4AF37]/80 text-black" onClick={() => setAddOpen(true)}><Plus className="h-4 w-4 mr-2" />Add Template</Button>
      </div>
      <Card><CardContent className="p-0"><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Template Name</TableHead><TableHead>Category</TableHead><TableHead className="hidden sm:table-cell">Language</TableHead><TableHead>Status</TableHead><TableHead className="hidden md:table-cell">Content Preview</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>{templates.map(t => (
            <TableRow key={t.id}>
              <TableCell className="font-medium"><div className="flex items-center gap-2"><Phone className="h-4 w-4 text-emerald-600" />{t.name}</div></TableCell>
              <TableCell><Badge variant="outline">{t.category}</Badge></TableCell>
              <TableCell className="hidden sm:table-cell">{t.language}</TableCell>
              <TableCell><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor[t.status]}`}>{t.status}</span></TableCell>
              <TableCell className="hidden md:table-cell max-w-xs truncate text-muted-foreground text-sm">{t.content}</TableCell>
              <TableCell className="text-right"><div className="flex justify-end gap-1">
                <Button size="sm" variant="outline" onClick={() => toast.info(`Edit ${t.name}`)}><Pencil className="h-3.5 w-3.5" /></Button>
                <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700" onClick={() => { setTemplates(prev => prev.filter(x => x.id !== t.id)); toast.success('Template deleted') }}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div></TableCell>
            </TableRow>
          ))}</TableBody></Table></div></CardContent></Card>
      <Dialog open={addOpen} onOpenChange={setAddOpen}><DialogContent><DialogHeader><DialogTitle>Add WhatsApp Template</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Template Name</Label><Input placeholder="Template name" /></div>
            <div className="space-y-2"><Label>Category</Label><Select><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent><SelectItem value="HR">HR</SelectItem><SelectItem value="Finance">Finance</SelectItem><SelectItem value="Recruitment">Recruitment</SelectItem><SelectItem value="Engagement">Engagement</SelectItem></SelectContent></Select></div>
          </div>
          <div className="space-y-2"><Label>Language</Label><Select defaultValue="English"><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="English">English</SelectItem><SelectItem value="Spanish">Spanish</SelectItem><SelectItem value="French">French</SelectItem></SelectContent></Select></div>
          <div className="space-y-2"><Label>Content</Label><Textarea placeholder="Message content... Use {{variable}} for placeholders." rows={4} /></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
          <Button className="bg-[#D4AF37] hover:bg-[#D4AF37]/80 text-black" onClick={() => { setAddOpen(false); toast.success('WhatsApp template submitted') }}>Submit for Approval</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── 11. Maintenance Mode ──────────────────────────────────────────────────
export function MaintenanceMode({ refreshKey }: { refreshKey?: number }) {
  const [enabled, setEnabled] = useState(false)
  const [message, setMessage] = useState('We are performing scheduled maintenance. We will be back shortly.')
  const [downtime, setDowntime] = useState('30 minutes')
  const [ips, setIps] = useState('192.168.1.1\n10.0.0.0/24')
  const [startTime, setStartTime] = useState('2025-01-20T02:00')
  const [endTime, setEndTime] = useState('2025-01-20T02:30')
  return (
    <div className="space-y-6">
      <SectionTitle title="Maintenance Mode" desc="Platform maintenance and downtime controls" />
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className={`w-4 h-4 rounded-full ${enabled ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
              <div>
                <p className="font-semibold text-lg">System is {enabled ? 'in Maintenance' : 'Operational'}</p>
                <p className="text-sm text-muted-foreground">{enabled ? 'Only whitelisted IPs can access the platform' : 'All systems running normally'}</p>
              </div>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>
        </CardContent>
      </Card>
      {enabled && (
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Maintenance Settings</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2"><Label>Custom Message</Label><Textarea value={message} onChange={e => setMessage(e.target.value)} rows={3} /></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Estimated Downtime</Label><Input value={downtime} onChange={e => setDowntime(e.target.value)} placeholder="e.g. 30 minutes" /></div>
                <div className="space-y-2"><Label>Allowed IPs (one per line)</Label><Textarea value={ips} onChange={e => setIps(e.target.value)} rows={3} className="font-mono text-sm" /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Start Time</Label><Input type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} /></div>
                <div className="space-y-2"><Label>End Time</Label><Input type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)} /></div>
              </div>
              <Button className="bg-[#D4AF37] hover:bg-[#D4AF37]/80 text-black" onClick={() => toast.success('Maintenance settings saved')}><Save className="h-4 w-4 mr-2" />Save Settings</Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

// ─── 12. Monitoring ────────────────────────────────────────────────────────
export function Monitoring({ refreshKey }: { refreshKey?: number }) {
  const services = [
    { name: 'API Server', icon: Server, status: 'green' },
    { name: 'Database', icon: Database, status: 'green' },
    { name: 'Storage', icon: HardDrive, status: 'amber' },
    { name: 'Email Service', icon: MailCheck, status: 'green' },
    { name: 'AI Engine', icon: Brain, status: 'green' },
  ]
  const apiCalls = [
    { day: 'Mon', count: 14200 },
    { day: 'Tue', count: 15800 },
    { day: 'Wed', count: 13400 },
    { day: 'Thu', count: 16100 },
    { day: 'Fri', count: 18900 },
    { day: 'Sat', count: 5200 },
    { day: 'Sun', count: 4800 },
  ]
  const maxCalls = Math.max(...apiCalls.map(d => d.count))
  const responseTimes = [
    { day: 'Mon', ms: 135 },
    { day: 'Tue', ms: 148 },
    { day: 'Wed', ms: 122 },
    { day: 'Thu', ms: 156 },
    { day: 'Fri', ms: 168 },
    { day: 'Sat', ms: 98 },
    { day: 'Sun', ms: 89 },
  ]
  const maxMs = Math.max(...responseTimes.map(d => d.ms))
  return (
    <div className="space-y-6">
      <SectionTitle title="Monitoring" desc="System health, performance, and alerting" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Activity className="h-4 w-4 text-[var(--gold)]" />} label="Uptime" value="99.9%" trend="up" />
        <StatCard icon={<Clock className="h-4 w-4 text-[var(--gold)]" />} label="Avg Response" value="142ms" trend="down" />
        <StatCard icon={<AlertTriangle className="h-4 w-4 text-[var(--gold)]" />} label="Error Rate" value="0.3%" trend="down" />
        <StatCard icon={<Users className="h-4 w-4 text-[var(--gold)]" />} label="Active Users" value="847" trend="up" />
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Service Status</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {services.map(s => (
              <div key={s.name} className="flex items-center gap-3 p-3 rounded-lg border">
                <div className={`w-3 h-3 rounded-full ${s.status === 'green' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                <s.icon className={`h-4 w-4 ${s.status === 'green' ? 'text-emerald-600' : 'text-amber-600'}`} />
                <span className="text-sm font-medium">{s.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">API Calls — Last 7 Days</CardTitle></CardHeader>
          <CardContent>
            <Table><TableHeader><TableRow><TableHead>Day</TableHead><TableHead className="text-right">Calls</TableHead><TableHead className="w-1/2">Volume</TableHead></TableRow></TableHeader>
              <TableBody>{apiCalls.map(d => (
                <TableRow key={d.day}>
                  <TableCell className="font-medium">{d.day}</TableCell>
                  <TableCell className="text-right">{d.count.toLocaleString()}</TableCell>
                  <TableCell><div className="w-full bg-muted rounded-full h-2.5"><div className="bg-[#002B5C] h-2.5 rounded-full transition-all" style={{ width: `${(d.count / maxCalls) * 100}%` }} /></div></TableCell>
                </TableRow>
              ))}</TableBody></Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">Response Time (ms) — Last 7 Days</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-end gap-3 h-48">
              {responseTimes.map(d => (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs text-muted-foreground">{d.ms}ms</span>
                  <div className="w-full bg-[#002B5C] rounded-t transition-all" style={{ height: `${(d.ms / maxMs) * 100}%`, minHeight: 8 }} />\n                  <span className="text-xs font-medium">{d.day}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
