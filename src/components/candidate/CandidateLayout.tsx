'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { useAuth, prefetch, cachedFetch, cacheInvalidate } from '@/lib/store'
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
import { Progress } from '@/components/ui/progress'
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
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { format, formatDistanceToNow } from 'date-fns'
import {
  LayoutDashboard,
  Search,
  Briefcase,
  FileText,
  CalendarDays,
  UserCircle,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronRight,
  CheckCheck,
  Bot,
  Sparkles,
  Send,
  Trash2,
  Loader2,
  Clock,
  User,
  Mail,
  Monitor,
  BellRing,
  Lock,
  AlertCircle,
  MessageSquare,
  Zap,
  MapPin,
  Building2,
  DollarSign,
  Eye,
  RotateCcw,
  Plus,
  XCircle,
  FileCheck,
  GraduationCap,
  Code,
  PenTool,
  Video,
  Users,
  Star,
  Target,
  MessageCircle,
  TrendingUp,
  Download,
  CalendarClock,
  Phone,
  Globe,
  Link2,
  IndianRupee,
  Moon, ArrowLeftRight,
} from 'lucide-react'
import { t, type LangCode, LANGUAGES } from '@/lib/i18n'
import { HpAiChat } from '@/components/shared/HpAiChat'
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher'
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import { FollowUs } from '@/components/shared/FollowUs'
import { SocialLinks } from '@/components/shared/SocialLinks'

// ═══════════════════════════════════════════════════════
//   TYPES
// ═══════════════════════════════════════════════════════

export type ModuleKey =
  | 'dashboard'
  | 'browse-jobs'
  | 'my-applications'
  | 'interviews'
  | 'my-resume'
  | 'ai-career'
  | 'notifications'
  | 'settings'

interface NavItem {
  key: ModuleKey
  label: string
  icon: typeof LayoutDashboard
  desc: string
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

// ═══════════════════════════════════════════════════════
//   HELPERS
// ═══════════════════════════════════════════════════════

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join('')
}

function fmtRelative(d: string | Date | null | undefined): string {
  if (!d) return '—'
  try { return formatDistanceToNow(new Date(d), { addSuffix: true }) } catch { return '—' }
}

function renderMd(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>
    }
    return <span key={i}>{part}</span>
  })
}

// ═══════════════════════════════════════════════════════
//   NAVIGATION
// ═══════════════════════════════════════════════════════

function getNav(lang: LangCode): NavItem[] {
  return [
    { key: 'dashboard', label: t('candidate.dashboard', lang), icon: LayoutDashboard, desc: t('candidate.desc.dashboard', lang) },
    { key: 'browse-jobs', label: t('candidate.browseJobs', lang), icon: Search, desc: t('candidate.desc.browseJobs', lang) },
    { key: 'my-applications', label: t('candidate.myApplications', lang), icon: FileText, desc: t('candidate.desc.myApplications', lang) },
    { key: 'interviews', label: t('candidate.interviews', lang), icon: CalendarDays, desc: t('candidate.desc.interviews', lang) },
    { key: 'my-resume', label: t('candidate.myResume', lang), icon: FileCheck, desc: t('candidate.desc.myResume', lang) },
    { key: 'ai-career', label: t('candidate.aiCareer', lang), icon: Bot, desc: t('candidate.desc.aiCareer', lang) },
    { key: 'notifications', label: t('candidate.notifications', lang), icon: Bell, desc: t('candidate.desc.notifications', lang) },
    { key: 'settings', label: t('candidate.settings', lang), icon: Settings, desc: t('candidate.desc.settings', lang) },
  ]
}

// ═══════════════════════════════════════════════════════
//   MODULE SKELETON
// ═══════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════
//   1. DASHBOARD MODULE
// ═══════════════════════════════════════════════════════

function DashboardModule({ lang, onNavigate }: { lang: LangCode; onNavigate: (k: ModuleKey) => void }) {
  const { user } = useAuth()
  const candName = user?.candidate?.fullName || user?.username || 'Candidate'

  const [apps, setApps] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const saved = localStorage.getItem('hpe-cand-applications')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (!cancelled) { queueMicrotask(() => { setApps(parsed); setLoading(false) }) }
      } catch {}
    }
    // Also try API
    fetch('/api/candidate/applications', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (cancelled) return
        if (data?.applications) setApps(data.applications)
        setLoading(false)
      })
      .catch(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const stats = {
    applied: apps.filter((a: any) => a.status === 'APPLIED' || a.status === 'Applied').length,
    screening: apps.filter((a: any) => a.status === 'SCREENING' || a.status === 'Screening').length,
    interviewing: apps.filter((a: any) => a.status === 'INTERVIEW' || a.status === 'Interview').length,
    offered: apps.filter((a: any) => a.status === 'OFFERED' || a.status === 'Offered').length,
    rejected: apps.filter((a: any) => a.status === 'REJECTED' || a.status === 'Rejected').length,
    withdrawn: apps.filter((a: any) => a.status === 'WITHDRAWN' || a.status === 'Withdrawn').length,
  }

  const profileCompletion = (() => {
    try {
      const resume = JSON.parse(localStorage.getItem('hpe-cand-resume') || '{}')
      let filled = 0
      const total = 5
      if (resume.fullName) filled++
      if (resume.email) filled++
      if (resume.summary) filled++
      if (resume.education?.length > 0) filled++
      if (resume.experience?.length > 0 || resume.skills?.length > 0) filled++
      return Math.round((filled / total) * 100)
    } catch { return 0 }
  })()

  const statCards = [
    { label: t('candidate.stat.applied', lang), value: stats.applied, icon: FileText, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400' },
    { label: t('candidate.stat.interviewing', lang), value: stats.interviewing + stats.screening, icon: CalendarDays, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400' },
    { label: t('candidate.stat.offered', lang), value: stats.offered, icon: Star, color: 'text-violet-600 bg-violet-50 dark:bg-violet-950/40 dark:text-violet-400' },
    { label: t('candidate.stat.total', lang), value: apps.length, icon: Briefcase, color: 'text-[var(--navy)]' },
  ]

  const recentActivity = apps.slice(0, 5).map((a: any) => ({
    id: a.id,
    title: a.jobTitle || a.title || 'Unknown Position',
    company: a.company || 'HP Enterprise',
    status: a.status,
    date: a.appliedDate || a.createdAt || new Date().toISOString(),
  }))

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-xl bg-gradient-to-r from-[var(--navy)] to-[var(--navy)]/90 p-6 text-white shadow-lg">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold">{t('candidate.welcome', lang)}, {candName}! 👋</h2>
            <p className="mt-1 text-sm text-blue-100/80">{t('candidate.welcomeSub', lang)}</p>
          </div>
          <Button onClick={() => onNavigate('browse-jobs')} className="gap-1.5 bg-[var(--gold)] text-[var(--navy)] hover:bg-[var(--gold-light)] font-semibold">
            <Search className="h-4 w-4" /> {t('candidate.findJobs', lang)}
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map(sc => {
          const ScIcon = sc.icon
          return (
            <div key={sc.label} className="rounded-xl border bg-card p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-[var(--navy)] dark:text-white">{sc.value}</p>
                  <p className="text-xs text-muted-foreground">{sc.label}</p>
                </div>
                <div className={cn('grid h-10 w-10 place-items-center rounded-lg', sc.color)}>
                  <ScIcon className="h-5 w-5" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Activity */}
        <div className="lg:col-span-2 rounded-xl border bg-card">
          <div className="border-b px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-[var(--navy)] dark:text-white" />
              <h3 className="font-semibold text-[var(--navy)] dark:text-white">{t('candidate.recentActivity', lang)}</h3>
            </div>
            {apps.length > 0 && (
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => onNavigate('my-applications')}>
                {t('general.view', lang)} All →
              </Button>
            )}
          </div>
          {recentActivity.length === 0 ? (
            <div className="py-12 text-center">
              <Briefcase className="mx-auto mb-3 h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">{t('candidate.noActivity', lang)}</p>
              <Button variant="outline" size="sm" className="mt-3 gap-1.5" onClick={() => onNavigate('browse-jobs')}>
                <Search className="h-3.5 w-3.5" /> {t('candidate.browseJobs', lang)}
              </Button>
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto scroll-thin divide-y">
              {recentActivity.map(act => (
                <div key={act.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/40 transition-colors">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-muted">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[var(--navy)] dark:text-white truncate">{act.title}</p>
                    <p className="text-xs text-muted-foreground">{act.company} • {fmtRelative(act.date)}</p>
                  </div>
                  <ApplicationStatusBadge status={act.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Profile Completion */}
        <div className="rounded-xl border bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <UserCircle className="h-5 w-5 text-[var(--navy)] dark:text-white" />
            <h3 className="font-semibold text-[var(--navy)] dark:text-white">{t('candidate.profileCompletion', lang)}</h3>
          </div>
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-4">
              <div className="grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-[var(--navy)] to-[var(--navy)]/80">
                <span className="text-2xl font-bold text-[var(--gold)]">{profileCompletion}%</span>
              </div>
              <svg className="absolute -inset-1 h-[calc(100%+8px)] w-[calc(100%+8px)] -rotate-90" viewBox="0 0 108 108">
                <circle cx="54" cy="54" r="50" fill="none" stroke="currentColor" strokeWidth="4" className="text-muted/30" />
                <circle cx="54" cy="54" r="50" fill="none" stroke="var(--gold)" strokeWidth="4" strokeLinecap="round" strokeDasharray={`${(profileCompletion / 100) * 314} 314`} className="transition-all duration-700" />
              </svg>
            </div>
            <Progress value={profileCompletion} className="h-2 w-full mb-3" />
            <p className="text-xs text-muted-foreground mb-4">{profileCompletion >= 80 ? t('candidate.profileGreat', lang) : t('candidate.profileHint', lang)}</p>
            <Button variant="outline" size="sm" className="w-full gap-1.5" onClick={() => onNavigate('my-resume')}>
              <PenTool className="h-3.5 w-3.5" /> {profileCompletion < 100 ? t('candidate.completeProfile', lang) : t('candidate.editResume', lang)}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════
//   2. BROWSE JOBS MODULE
// ═══════════════════════════════════════════════════════

interface JobListing {
  id: string
  title: string
  company: string
  location: string
  salaryMin: number
  salaryMax: number
  type: string
  postedDate: string
  description: string
  skills: string[]
}

const MOCK_JOBS: JobListing[] = [
  { id: 'j1', title: 'Senior React Developer', company: 'HP Enterprise', location: 'Bengaluru', salaryMin: 1200000, salaryMax: 1800000, type: 'Full-time', postedDate: '2025-06-01T00:00:00Z', description: 'We are looking for an experienced React developer to join our engineering team.', skills: ['React', 'TypeScript', 'Next.js', 'Tailwind CSS'] },
  { id: 'j2', title: 'EHS Officer', company: 'HP Enterprise', location: 'Chitradurga', salaryMin: 350000, salaryMax: 500000, type: 'Full-time', postedDate: '2025-06-03T00:00:00Z', description: 'Seeking a qualified EHS Officer for safety compliance and site inspections.', skills: ['EHS', 'Safety Audit', 'OSHA', 'MS Office'] },
  { id: 'j3', title: 'Site Engineer - Civil', company: 'HP Enterprise', location: 'Mysuru', salaryMin: 400000, salaryMax: 600000, type: 'Full-time', postedDate: '2025-06-05T00:00:00Z', description: 'Civil site engineer for ongoing commercial construction projects.', skills: ['AutoCAD', 'Site Supervision', 'RCC', 'Billing'] },
  { id: 'j4', title: 'HR Executive', company: 'HP Enterprise', location: 'Bengaluru', salaryMin: 300000, salaryMax: 450000, type: 'Full-time', postedDate: '2025-06-07T00:00:00Z', description: 'HR Executive for recruitment, onboarding, and employee relations.', skills: ['Recruitment', 'Payroll', 'Labour Laws', 'Excel'] },
  { id: 'j5', title: 'MEP Coordinator', company: 'HP Enterprise', location: 'Bengaluru', salaryMin: 600000, salaryMax: 900000, type: 'Contract', postedDate: '2025-06-08T00:00:00Z', description: 'Coordinate MEP activities across multiple project sites.', skills: ['MEP', 'AutoCAD', 'Revit', 'Coordination'] },
  { id: 'j6', title: 'QA/QC Engineer', company: 'HP Enterprise', location: 'Hubli', salaryMin: 500000, salaryMax: 700000, type: 'Full-time', postedDate: '2025-06-10T00:00:00Z', description: 'Quality assurance and control for construction projects.', skills: ['QA/QC', 'IS Codes', 'Testing', 'Documentation'] },
  { id: 'j7', title: 'Data Entry Operator', company: 'HP Enterprise', location: 'Chitradurga', salaryMin: 180000, salaryMax: 240000, type: 'Part-time', postedDate: '2025-06-12T00:00:00Z', description: 'Part-time data entry for HR and payroll records.', skills: ['Excel', 'Data Entry', 'Typing'] },
  { id: 'j8', title: 'Accountant', company: 'HP Enterprise', location: 'Bengaluru', salaryMin: 400000, salaryMax: 550000, type: 'Full-time', postedDate: '2025-06-13T00:00:00Z', description: 'Handle accounts, GST filing, and financial reporting.', skills: ['Tally', 'GST', 'Accounting', 'Excel'] },
]

function BrowseJobsModule({ lang }: { lang: LangCode }) {
  const [jobs, setJobs] = useState<JobListing[]>([])
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [locationFilter, setLocationFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [applying, setApplying] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/public/careers', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (cancelled) return
        if (data?.jobs?.length > 0) {
          setJobs(data.jobs)
        } else {
          setJobs(MOCK_JOBS)
        }
        setLoading(false)
      })
      .catch(() => {
        if (!cancelled) { setJobs(MOCK_JOBS); setLoading(false) }
      })
    return () => { cancelled = true }
  }, [])

  const locations = [...new Set(jobs.map(j => j.location))]
  const types = [...new Set(jobs.map(j => j.type))]

  const filtered = jobs.filter(j => {
    const matchSearch = !search || j.title.toLowerCase().includes(search.toLowerCase()) || j.company.toLowerCase().includes(search.toLowerCase()) || j.skills.some(s => s.toLowerCase().includes(search.toLowerCase()))
    const matchType = typeFilter === 'all' || j.type === typeFilter
    const matchLocation = locationFilter === 'all' || j.location === locationFilter
    return matchSearch && matchType && matchLocation
  })

  const handleApply = (job: JobListing) => {
    setApplying(job.id)
    setTimeout(() => {
      try {
        const existing = JSON.parse(localStorage.getItem('hpe-cand-applications') || '[]')
        const already = existing.some((a: any) => a.jobId === job.id)
        if (already) {
          toast.error(t('candidate.alreadyApplied', lang))
          setApplying(null)
          return
        }
        const newApp = {
          id: `APP-${Date.now().toString(36).toUpperCase()}`,
          jobId: job.id,
          jobTitle: job.title,
          company: job.company,
          appliedDate: new Date().toISOString(),
          status: 'Applied',
        }
        localStorage.setItem('hpe-cand-applications', JSON.stringify([newApp, ...existing]))
        toast.success(t('candidate.appliedSuccess', lang))
      } catch {
        toast.error(t('candidate.applyFailed', lang))
      }
      setApplying(null)
    }, 800)
  }

  const typeColor = (type: string) => {
    switch (type) {
      case 'Full-time': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
      case 'Part-time': return 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
      case 'Contract': return 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400'
      default: return 'bg-muted text-muted-foreground'
    }
  }

  const formatSalary = (n: number) => {
    if (n >= 100000) return `${(n / 100000).toFixed(1)}L`
    if (n >= 1000) return `${(n / 1000).toFixed(0)}K`
    return String(n)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-[var(--navy)] dark:text-white">{t('candidate.browseJobs', lang)}</h2>
          <p className="text-sm text-muted-foreground">{filtered.length} {filtered.length === 1 ? 'job' : 'jobs'} {t('candidate.available', lang)}</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder={t('candidate.searchJobs', lang)} value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder={t('candidate.jobType', lang)} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {types.map(tp => <SelectItem key={tp} value={tp}>{tp}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={locationFilter} onValueChange={setLocationFilter}>
          <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder={t('candidate.location', lang)} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            {locations.map(loc => <SelectItem key={loc} value={loc}>{loc}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Job Cards */}
      {loading ? <ModuleSkeleton /> : filtered.length === 0 ? (
        <div className="py-16 text-center">
          <Briefcase className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">{t('candidate.noJobs', lang)}</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filtered.map(job => (
            <div key={job.id} className="rounded-xl border bg-card p-5 hover:shadow-md hover:border-[var(--gold)]/40 transition-all">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-bold text-[var(--navy)] dark:text-white truncate">{job.title}</h3>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground"><Building2 className="h-3 w-3" />{job.company}</span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" />{job.location}</span>
                  </div>
                </div>
                <Badge variant="secondary" className={cn('text-[10px] shrink-0', typeColor(job.type))}>{job.type}</Badge>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{job.description}</p>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {job.skills.slice(0, 4).map(sk => (
                  <Badge key={sk} variant="outline" className="text-[10px]">{sk}</Badge>
                ))}
                {job.skills.length > 4 && <Badge variant="outline" className="text-[10px]">+{job.skills.length - 4}</Badge>}
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  <IndianRupee className="h-3.5 w-3.5" />
                  {formatSalary(job.salaryMin)} – {formatSalary(job.salaryMax)}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">{fmtRelative(job.postedDate)}</span>
                  <Button
                    size="sm"
                    className="gap-1.5 h-8"
                    disabled={applying === job.id}
                    onClick={() => handleApply(job)}
                  >
                    {applying === job.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                    {t('candidate.apply', lang)}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════
//   3. MY APPLICATIONS MODULE
// ═══════════════════════════════════════════════════════

function ApplicationStatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    'Applied': 'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400',
    'Screening': 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
    'Interview': 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400',
    'Offered': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
    'Rejected': 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400',
    'Withdrawn': 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  }
  return (
    <Badge variant="secondary" className={cn('text-[10px]', colorMap[status] || 'bg-muted text-muted-foreground')}>
      {status}
    </Badge>
  )
}

function MyApplicationsModule({ lang }: { lang: LangCode }) {
  const [apps, setApps] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [detailId, setDetailId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const saved = localStorage.getItem('hpe-cand-applications')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (!cancelled) { queueMicrotask(() => { setApps(parsed); setLoading(false) }) }
      } catch {}
    }
    fetch('/api/candidate/applications', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (cancelled) return
        if (data?.applications) setApps(data.applications)
        setLoading(false)
      })
      .catch(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const handleWithdraw = (id: string) => {
    const updated = apps.map(a => a.id === id ? { ...a, status: 'Withdrawn' } : a)
    setApps(updated)
    try { localStorage.setItem('hpe-cand-applications', JSON.stringify(updated)) } catch {}
    toast.success(t('candidate.withdrawn', lang))
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-[var(--navy)] dark:text-white">{t('candidate.myApplications', lang)}</h2>
        <p className="text-sm text-muted-foreground">{apps.length} {t('candidate.totalApplications', lang)}</p>
      </div>

      {loading ? <ModuleSkeleton /> : apps.length === 0 ? (
        <div className="py-16 text-center">
          <FileText className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">{t('candidate.noApplications', lang)}</p>
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide">Job Title</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide hidden sm:table-cell">Company</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide hidden md:table-cell">Applied Date</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide">Status</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wide w-28">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {apps.map(app => (
                    <TableRow key={app.id} className="hover:bg-muted/40">
                      <TableCell className="font-medium text-[var(--navy)] dark:text-white">{app.jobTitle || app.title || '—'}</TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{app.company || 'HP Enterprise'}</TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-muted-foreground">{app.appliedDate ? format(new Date(app.appliedDate), 'dd MMM yyyy') : '—'}</TableCell>
                      <TableCell><ApplicationStatusBadge status={app.status} /></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => setDetailId(detailId === app.id ? null : app.id)}>
                            <Eye className="h-3 w-3" /> {t('general.view', lang)}
                          </Button>
                          {app.status !== 'Withdrawn' && app.status !== 'Rejected' && (
                            <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-red-600 hover:text-red-700" onClick={() => handleWithdraw(app.id)}>
                              <XCircle className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {/* Detail Panel */}
            {detailId && (() => {
              const app = apps.find(a => a.id === detailId)
              if (!app) return null
              return (
                <div className="border-t bg-muted/30 px-6 py-4">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div><p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Application ID</p><p className="text-sm font-medium text-[var(--navy)] dark:text-white">{app.id}</p></div>
                    <div><p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Job Title</p><p className="text-sm font-medium text-[var(--navy)] dark:text-white">{app.jobTitle || app.title}</p></div>
                    <div><p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</p><ApplicationStatusBadge status={app.status} /></div>
                    <div><p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Company</p><p className="text-sm font-medium text-[var(--navy)] dark:text-white">{app.company || 'HP Enterprise'}</p></div>
                    <div><p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Applied</p><p className="text-sm font-medium">{app.appliedDate ? format(new Date(app.appliedDate), 'dd MMM yyyy, h:mm a') : '—'}</p></div>
                  </div>
                </div>
              )
            })()}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════
//   4. INTERVIEWS MODULE
// ═══════════════════════════════════════════════════════

interface Interview {
  id: string
  jobTitle: string
  interviewer: string
  dateTime: string
  type: string
  location: string
  status: string
}

const MOCK_INTERVIEWS: Interview[] = [
  { id: 'iv1', jobTitle: 'Senior React Developer', interviewer: 'Hariprasad N P', dateTime: '2025-06-20T10:00:00Z', type: 'Technical', location: 'HP Enterprise, Bengaluru Office', status: 'Scheduled' },
  { id: 'iv2', jobTitle: 'EHS Officer', interviewer: 'Rajesh S', dateTime: '2025-06-22T14:30:00Z', type: 'HR', location: 'https://meet.google.com/abc-defg-hij', status: 'Scheduled' },
  { id: 'iv3', jobTitle: 'Site Engineer - Civil', interviewer: 'Technical Panel', dateTime: '2025-06-18T11:00:00Z', type: 'Panel', location: 'HP Enterprise, Chitradurga Office', status: 'Completed' },
]

function InterviewsModule({ lang }: { lang: LangCode }) {
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')

  useEffect(() => {
    let cancelled = false
    fetch('/api/candidate/interviews', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (cancelled) return
        if (data?.interviews) setInterviews(data.interviews)
        else setInterviews(MOCK_INTERVIEWS)
        setLoading(false)
      })
      .catch(() => { if (!cancelled) { setInterviews(MOCK_INTERVIEWS); setLoading(false) } })
    return () => { cancelled = true }
  }, [])

  const upcoming = interviews.filter(i => i.status === 'Scheduled' && new Date(i.dateTime) >= new Date())
  const past = interviews.filter(i => i.status === 'Completed' || new Date(i.dateTime) < new Date())

  const interviewTypeColor = (type: string) => {
    switch (type) {
      case 'Technical': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
      case 'HR': return 'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400'
      case 'Panel': return 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400'
      case 'Video': return 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400'
      default: return 'bg-muted text-muted-foreground'
    }
  }

  const isLink = (loc: string) => loc.startsWith('http')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[var(--navy)] dark:text-white">{t('candidate.interviews', lang)}</h2>
          <p className="text-sm text-muted-foreground">{upcoming.length} {t('candidate.upcoming', lang)}</p>
        </div>
        <div className="flex gap-1 rounded-lg border p-0.5">
          <button onClick={() => setViewMode('list')} className={cn('px-3 py-1.5 rounded-md text-xs font-medium transition-colors', viewMode === 'list' ? 'bg-[var(--navy)] text-white' : 'text-muted-foreground hover:bg-muted')}>List</button>
          <button onClick={() => setViewMode('calendar')} className={cn('px-3 py-1.5 rounded-md text-xs font-medium transition-colors', viewMode === 'calendar' ? 'bg-[var(--navy)] text-white' : 'text-muted-foreground hover:bg-muted')}>Calendar</button>
        </div>
      </div>

      {loading ? <ModuleSkeleton /> : (
        <>
          {/* Upcoming */}
          <div>
            <h3 className="text-sm font-semibold text-[var(--navy)] dark:text-white mb-3 flex items-center gap-2">
              <CalendarClock className="h-4 w-4" /> {t('candidate.upcomingInterviews', lang)}
            </h3>
            {upcoming.length === 0 ? (
              <div className="rounded-xl border bg-card p-8 text-center">
                <CalendarDays className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">{t('candidate.noUpcoming', lang)}</p>
              </div>
            ) : viewMode === 'calendar' ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {upcoming.map(iv => (
                  <div key={iv.id} className="rounded-xl border bg-card p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--navy)]/10">
                        <CalendarDays className="h-5 w-5 text-[var(--navy)] dark:text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-muted-foreground">{format(new Date(iv.dateTime), 'dd MMM yyyy')}</p>
                        <p className="text-sm font-bold text-[var(--navy)] dark:text-white">{format(new Date(iv.dateTime), 'h:mm a')}</p>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-[var(--navy)] dark:text-white truncate">{iv.jobTitle}</p>
                    <p className="text-xs text-muted-foreground mt-1">{iv.interviewer}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className={cn('text-[10px]', interviewTypeColor(iv.type))}>{iv.type}</Badge>
                      {isLink(iv.location) && (
                        <a href={iv.location} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] text-[var(--gold)] hover:underline">
                          <Link2 className="h-3 w-3" /> Join Link
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {upcoming.map(iv => (
                  <div key={iv.id} className="rounded-xl border bg-card p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-3 min-w-0 flex-1">
                      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[var(--navy)] to-[var(--navy)]/80 text-white">
                        <span className="text-sm font-bold">{format(new Date(iv.dateTime), 'dd')}</span>
                        <span className="text-[9px] text-[var(--gold-light)]">{format(new Date(iv.dateTime), 'MMM')}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[var(--navy)] dark:text-white truncate">{iv.jobTitle}</p>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <span className="flex items-center gap-1 text-xs text-muted-foreground"><User className="h-3 w-3" />{iv.interviewer}</span>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3 w-3" />{format(new Date(iv.dateTime), 'h:mm a')}</span>
                          <span className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" />{isLink(iv.location) ? 'Online' : iv.location}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                      <Badge variant="secondary" className={cn('text-[10px]', interviewTypeColor(iv.type))}>{iv.type}</Badge>
                      {isLink(iv.location) && (
                        <a href={iv.location} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="outline" className="gap-1.5 h-7 text-xs"><Video className="h-3 w-3" /> Join</Button>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Past */}
          {past.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-[var(--navy)] dark:text-white mb-3">{t('candidate.pastInterviews', lang)}</h3>
              <div className="space-y-2">
                {past.map(iv => (
                  <div key={iv.id} className="rounded-lg border bg-card/60 px-4 py-3 flex items-center gap-3 opacity-70">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-muted">
                      <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{iv.jobTitle}</p>
                      <p className="text-xs text-muted-foreground">{iv.interviewer} • {format(new Date(iv.dateTime), 'dd MMM yyyy')}</p>
                    </div>
                    <Badge variant="secondary" className={cn('text-[10px]', interviewTypeColor(iv.type))}>{iv.type}</Badge>
                    <Badge variant="outline" className="text-[10px]">Completed</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════
//   5. MY RESUME MODULE
// ═══════════════════════════════════════════════════════

interface ResumeData {
  fullName: string
  email: string
  phone: string
  location: string
  summary: string
  education: { id: string; degree: string; institution: string; year: string; grade: string }[]
  experience: { id: string; title: string; company: string; startDate: string; endDate: string; description: string }[]
  skills: string[]
}

const RESUME_STORAGE_KEY = 'hpe-cand-resume'
const DEFAULT_RESUME: ResumeData = { fullName: '', email: '', phone: '', location: '', summary: '', education: [], experience: [], skills: [] }

function MyResumeModule({ lang }: { lang: LangCode }) {
  const [resume, setResume] = useState<ResumeData>(DEFAULT_RESUME)
  const [skillInput, setSkillInput] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  const [saveStatus, setSaveStatus] = useState<string>('')
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(RESUME_STORAGE_KEY)
      if (saved) queueMicrotask(() => setResume(JSON.parse(saved)))
    } catch {}
  }, [])

  const saveResume = useCallback((data: ResumeData) => {
    setResume(data)
    try { localStorage.setItem(RESUME_STORAGE_KEY, JSON.stringify(data)) } catch {}
    setSaveStatus('Saved ✓')
    setTimeout(() => setSaveStatus(''), 2000)
  }, [])

  const autoSave = useCallback((data: ResumeData) => {
 setResume(data)
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(() => {
      try { localStorage.setItem(RESUME_STORAGE_KEY, JSON.stringify(data)) } catch {}
    }, 1000)
  }, [])

  const addSkill = () => {
    const sk = skillInput.trim()
    if (!sk || resume.skills.includes(sk)) return
    saveResume({ ...resume, skills: [...resume.skills, sk] })
    setSkillInput('')
  }

  const removeSkill = (sk: string) => {
    saveResume({ ...resume, skills: resume.skills.filter(s => s !== sk) })
  }

  const addEducation = () => {
    const newEdu = { id: `edu-${Date.now()}`, degree: '', institution: '', year: '', grade: '' }
    saveResume({ ...resume, education: [...resume.education, newEdu] })
  }

  const updateEducation = (id: string, field: string, value: string) => {
    saveResume({ ...resume, education: resume.education.map(e => e.id === id ? { ...e, [field]: value } : e) })
  }

  const removeEducation = (id: string) => {
    saveResume({ ...resume, education: resume.education.filter(e => e.id !== id) })
  }

  const addExperience = () => {
    const newExp = { id: `exp-${Date.now()}`, title: '', company: '', startDate: '', endDate: '', description: '' }
    saveResume({ ...resume, experience: [...resume.experience, newExp] })
  }

  const updateExperience = (id: string, field: string, value: string) => {
    saveResume({ ...resume, experience: resume.experience.map(e => e.id === id ? { ...e, [field]: value } : e) })
  }

  const removeExperience = (id: string) => {
    saveResume({ ...resume, experience: resume.experience.filter(e => e.id !== id) })
  }

  const handleFieldChange = (field: keyof ResumeData, value: string) => {
    autoSave({ ...resume, [field]: value })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[var(--navy)] dark:text-white">{t('candidate.myResume', lang)}</h2>
          <p className="text-sm text-muted-foreground">{t('candidate.resumeAutoSave', lang)} {saveStatus && <span className="text-emerald-600 font-medium">{saveStatus}</span>}</p>
        </div>
        <Button variant="outline" className="gap-1.5" onClick={() => setShowPreview(!showPreview)}>
          <Eye className="h-4 w-4" /> {showPreview ? t('candidate.editResume', lang) : t('candidate.previewResume', lang)}
        </Button>
      </div>

      {showPreview ? (
        /* Preview Mode */
        <div className="mx-auto max-w-3xl rounded-xl border bg-card p-8 space-y-6">
          <div className="text-center border-b pb-6">
            <h2 className="text-2xl font-bold text-[var(--navy)] dark:text-white">{resume.fullName || 'Your Name'}</h2>
            <div className="flex flex-wrap items-center justify-center gap-3 mt-2 text-sm text-muted-foreground">
              {resume.email && <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5" />{resume.email}</span>}
              {resume.phone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" />{resume.phone}</span>}
              {resume.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{resume.location}</span>}
            </div>
          </div>
          {resume.summary && (
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">Professional Summary</h3>
              <p className="text-sm leading-relaxed">{resume.summary}</p>
            </div>
          )}
          {resume.skills.length > 0 && (
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {resume.skills.map(sk => <Badge key={sk} variant="secondary" className="text-xs">{sk}</Badge>)}
              </div>
            </div>
          )}
          {resume.education.length > 0 && (
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">Education</h3>
              <div className="space-y-3">
                {resume.education.map(edu => (
                  <div key={edu.id} className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-[var(--navy)] dark:text-white">{edu.degree || 'Degree'}</p>
                      <p className="text-xs text-muted-foreground">{edu.institution || 'Institution'} {edu.grade ? `• ${edu.grade}` : ''}</p>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">{edu.year || '—'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {resume.experience.length > 0 && (
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">Experience</h3>
              <div className="space-y-4">
                {resume.experience.map(exp => (
                  <div key={exp.id}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-[var(--navy)] dark:text-white">{exp.title || 'Title'}</p>
                        <p className="text-xs text-muted-foreground">{exp.company || 'Company'}</p>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">{exp.startDate}{exp.endDate ? ` – ${exp.endDate}` : ' – Present'}</span>
                    </div>
                    {exp.description && <p className="mt-1 text-xs text-muted-foreground">{exp.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Edit Mode */
        <div className="space-y-6">
          {/* Personal Info */}
          <div className="rounded-xl border bg-card p-6 space-y-4">
            <div className="flex items-center gap-2">
              <UserCircle className="h-5 w-5 text-[var(--navy)] dark:text-white" />
              <h3 className="font-semibold text-[var(--navy)] dark:text-white">Personal Information</h3>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label htmlFor="r-name">Full Name</Label><Input id="r-name" value={resume.fullName} onChange={e => handleFieldChange('fullName', e.target.value)} placeholder="John Doe" /></div>
              <div className="space-y-2"><Label htmlFor="r-email">Email</Label><Input id="r-email" type="email" value={resume.email} onChange={e => handleFieldChange('email', e.target.value)} placeholder="john@example.com" /></div>
              <div className="space-y-2"><Label htmlFor="r-phone">Phone</Label><Input id="r-phone" value={resume.phone} onChange={e => handleFieldChange('phone', e.target.value)} placeholder="+91 98765 43210" /></div>
              <div className="space-y-2"><Label htmlFor="r-location">Location</Label><Input id="r-location" value={resume.location} onChange={e => handleFieldChange('location', e.target.value)} placeholder="Bengaluru, India" /></div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="r-summary">Professional Summary</Label>
              <Textarea id="r-summary" rows={4} value={resume.summary} onChange={e => handleFieldChange('summary', e.target.value)} placeholder="Brief summary of your professional background and career objectives…" />
            </div>
          </div>

          {/* Skills */}
          <div className="rounded-xl border bg-card p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Code className="h-5 w-5 text-[var(--navy)] dark:text-white" />
              <h3 className="font-semibold text-[var(--navy)] dark:text-white">Skills</h3>
            </div>
            <div className="flex gap-2">
              <Input value={skillInput} onChange={e => setSkillInput(e.target.value)} placeholder="Add a skill…" className="flex-1" onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill() } }} />
              <Button variant="outline" onClick={addSkill}><Plus className="h-4 w-4" /></Button>
            </div>
            {resume.skills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {resume.skills.map(sk => (
                  <Badge key={sk} variant="secondary" className="gap-1 pr-1">
                    {sk}
                    <button onClick={() => removeSkill(sk)} className="grid h-4 w-4 place-items-center rounded-full hover:bg-destructive/20" aria-label={`Remove ${sk}`}><X className="h-3 w-3" /></button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Education */}
          <div className="rounded-xl border bg-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-[var(--navy)] dark:text-white" />
                <h3 className="font-semibold text-[var(--navy)] dark:text-white">Education</h3>
              </div>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={addEducation}><Plus className="h-3.5 w-3.5" /> Add</Button>
            </div>
            {resume.education.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No education entries yet</p>
            ) : (
              <div className="space-y-3">
                {resume.education.map((edu, i) => (
                  <div key={edu.id} className="rounded-lg border p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-muted-foreground">Entry #{i + 1}</span>
                      <Button variant="ghost" size="sm" className="h-7 text-xs text-red-500" onClick={() => removeEducation(edu.id)}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1"><Label className="text-xs">Degree</Label><Input className="h-8 text-sm" value={edu.degree} onChange={e => updateEducation(edu.id, 'degree', e.target.value)} placeholder="B.Tech Computer Science" /></div>
                      <div className="space-y-1"><Label className="text-xs">Institution</Label><Input className="h-8 text-sm" value={edu.institution} onChange={e => updateEducation(edu.id, 'institution', e.target.value)} placeholder="University Name" /></div>
                      <div className="space-y-1"><Label className="text-xs">Year</Label><Input className="h-8 text-sm" value={edu.year} onChange={e => updateEducation(edu.id, 'year', e.target.value)} placeholder="2020 – 2024" /></div>
                      <div className="space-y-1"><Label className="text-xs">Grade / GPA</Label><Input className="h-8 text-sm" value={edu.grade} onChange={e => updateEducation(edu.id, 'grade', e.target.value)} placeholder="8.5 CGPA" /></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Experience */}
          <div className="rounded-xl border bg-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-[var(--navy)] dark:text-white" />
                <h3 className="font-semibold text-[var(--navy)] dark:text-white">Experience</h3>
              </div>
              <Button variant="outline" size="sm" className="gap-1.5" onClick={addExperience}><Plus className="h-3.5 w-3.5" /> Add</Button>
            </div>
            {resume.experience.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No experience entries yet</p>
            ) : (
              <div className="space-y-3">
                {resume.experience.map((exp, i) => (
                  <div key={exp.id} className="rounded-lg border p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-muted-foreground">Entry #{i + 1}</span>
                      <Button variant="ghost" size="sm" className="h-7 text-xs text-red-500" onClick={() => removeExperience(exp.id)}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="space-y-1"><Label className="text-xs">Job Title</Label><Input className="h-8 text-sm" value={exp.title} onChange={e => updateExperience(exp.id, 'title', e.target.value)} placeholder="Software Engineer" /></div>
                      <div className="space-y-1"><Label className="text-xs">Company</Label><Input className="h-8 text-sm" value={exp.company} onChange={e => updateExperience(exp.id, 'company', e.target.value)} placeholder="Company Name" /></div>
                      <div className="space-y-1"><Label className="text-xs">Start Date</Label><Input className="h-8 text-sm" value={exp.startDate} onChange={e => updateExperience(exp.id, 'startDate', e.target.value)} placeholder="Jan 2022" /></div>
                      <div className="space-y-1"><Label className="text-xs">End Date</Label><Input className="h-8 text-sm" value={exp.endDate} onChange={e => updateExperience(exp.id, 'endDate', e.target.value)} placeholder="Present" /></div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Description</Label>
                      <Textarea className="text-sm" rows={2} value={exp.description} onChange={e => updateExperience(exp.id, 'description', e.target.value)} placeholder="Key responsibilities and achievements…" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════
//   6. HPAI CAREER ASSISTANT MODULE
// ═══════════════════════════════════════════════════════

function AiCareerModule({ lang }: { lang: LangCode }) {
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
        body: JSON.stringify({ message: trimmed, role: 'candidate' }),
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
    { icon: FileCheck, label: 'Resume Review', prompt: 'Please review my resume and provide feedback on how I can improve it for better job applications.', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400' },
    { icon: MessageCircle, label: 'Interview Tips', prompt: 'Give me practical tips for acing my upcoming job interviews, including common questions and how to answer them.', color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400' },
    { icon: DollarSign, label: 'Salary Negotiation', prompt: 'What are the best strategies for negotiating salary? How should I research market rates and present my expectations?', color: 'text-sky-600 bg-sky-50 dark:bg-sky-950/40 dark:text-sky-400' },
    { icon: TrendingUp, label: 'Career Guidance', prompt: 'I need career guidance. What are the emerging skills and career paths in my field that I should focus on?', color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/40 dark:text-purple-400' },
    { icon: Target, label: 'Job Match Analysis', prompt: 'Analyze my profile and suggest the best job matches based on my skills and experience. What roles should I target?', color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-400' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[var(--navy)] dark:text-white">{t('candidate.aiCareer', lang)}</h2>
          <p className="text-sm text-muted-foreground">Your AI-powered career companion</p>
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
            <button key={qa.label} onClick={() => handleSend(qa.prompt)} className="group flex flex-col items-center gap-2 rounded-xl border bg-card p-4 text-center transition-all hover:shadow-md hover:border-[var(--gold)]/50">
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
        <div className="flex items-center gap-3 border-b bg-gradient-to-r from-[var(--navy)] to-[var(--navy)]/90 px-4 py-3">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--gold)]/20">
            <Sparkles className="h-4 w-4 text-[var(--gold)]" />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-tight">HPAI Career Assistant</p>
            <p className="text-[10px] text-[var(--gold-light)] leading-tight">AI-powered career guidance</p>
          </div>
        </div>

        <div ref={scrollRef} className="max-h-[400px] overflow-y-auto scroll-thin px-4 py-4 space-y-3">
          {messages.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="grid h-16 w-16 place-items-center rounded-full bg-[var(--gold)]/10 mb-4">
                <Bot className="h-8 w-8 text-[var(--gold)]" />
              </div>
              <p className="text-sm font-semibold text-[var(--navy)] dark:text-white">{t('candidate.aiWelcome', lang)}</p>
              <p className="mt-1 text-xs text-muted-foreground max-w-xs">{t('candidate.aiWelcomeSub', lang)}</p>
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

        <div className="border-t px-3 py-2.5">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('candidate.aiPlaceholder', lang)}
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

// ═══════════════════════════════════════════════════════
//   7. NOTIFICATIONS MODULE
// ═══════════════════════════════════════════════════════

function NotificationsModule({ lang, notifications, onMarkRead, onMarkAllRead, unread }: {
  lang: LangCode
  notifications: NotificationLite[]
  onMarkRead: (id: string) => void
  onMarkAllRead: () => void
  unread: number
}) {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--navy)] dark:text-white">{t('candidate.notifications', lang)}</h2>
          <p className="text-sm text-muted-foreground">{unread > 0 ? `You have ${unread} unread notification${unread !== 1 ? 's' : ''}` : 'You\'re all caught up.'}</p>
        </div>
        {unread > 0 && (
          <Button variant="outline" size="sm" onClick={onMarkAllRead} className="gap-1.5">
            <CheckCheck className="h-3.5 w-3.5" /> {t('candidate.markAllRead', lang)}
          </Button>
        )}
      </div>
      <Card>
        <CardContent className="p-0">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
              <Bell className="mb-2 h-10 w-10 opacity-30" />
              <p className="text-sm font-medium">{t('candidate.noNotifications', lang)}</p>
              <p className="mt-0.5 text-xs">{t('candidate.noNotifSub', lang)}</p>
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
                  <Badge variant="outline" className={cn('shrink-0 text-[10px]', n.read ? 'opacity-50' : '')}>{n.type.replace(/_/g, ' ')}</Badge>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ═══════════════════════════════════════════════════════
//   8. SETTINGS MODULE
// ═══════════════════════════════════════════════════════

function SettingsModule({ lang, onNavigate }: { lang: LangCode; onNavigate: (k: ModuleKey) => void }) {
  const { user, setLang, darkMode, toggleDarkMode } = useAuth()
  const candName = user?.candidate?.fullName || user?.username || 'Candidate'

  const [notifPrefs, setNotifPrefs] = useState(() => {
    if (typeof window === 'undefined') return { email: true, push: true, inApp: true }
    try {
      const saved = localStorage.getItem('hpe-cand-notif-prefs')
      if (saved) return JSON.parse(saved)
    } catch {}
    return { email: true, push: true, inApp: true }
  })

  const saveNotifPrefs = (prefs: typeof notifPrefs) => {
    setNotifPrefs(prefs)
    try { localStorage.setItem('hpe-cand-notif-prefs', JSON.stringify(prefs)) } catch {}
    toast.success(t('candidate.notifSaved', lang))
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
            <AvatarFallback className="bg-[var(--navy)] text-[var(--gold)] text-lg font-bold">{initials(candName)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold text-[var(--navy)] dark:text-white truncate">{candName}</h3>
            <p className="text-sm text-muted-foreground">{user?.email || '—'} • {t('candidate.roleLabel', lang)}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => onNavigate('my-resume')} className="gap-1.5">
            <User className="h-3.5 w-3.5" /> {t('candidate.editResume', lang)}
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
              <Moon className="h-4 w-4 text-muted-foreground" />
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
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Username</p>
                <p className="text-xs text-muted-foreground">{user?.username || '—'}</p>
              </div>
            </div>
            <Badge variant="secondary" className="text-[10px]">{user?.role || 'CANDIDATE'}</Badge>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-xs text-muted-foreground">{user?.email || '—'}</p>
              </div>
            </div>
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

// ═══════════════════════════════════════════════════════
//   MAIN LAYOUT COMPONENT
// ═══════════════════════════════════════════════════════

export function CandidateLayout() {
  const { user, logout, lang } = useAuth()
  const [active, setActive] = useState<ModuleKey>('dashboard')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationLite[]>([])
  const [unread, setUnread] = useState(0)
  const [now, setNow] = useState(new Date())
  const [bellOpen, setBellOpen] = useState(false)
  const sseRef = useRef<EventSource | null>(null)

  const candName = user?.candidate?.fullName || user?.username || 'Candidate'

  const loadNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications', { cache: 'no-store' })
      if (!res.ok) return
      const data = await res.json()
      setNotifications(data.notifications || [])
      setUnread(data.unread || 0)
    } catch {}
  }, [])

  // Prefetch
  useEffect(() => {
    prefetch(['cand:notifications'], '/api/notifications')
  }, [])

  // Initial notifications load
  useEffect(() => {
    let cancelled = false
    cachedFetch('cand:notifications', '/api/notifications')
      .then(({ data }) => {
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
            loadNotifications()
          }
        } catch {}
      }
      es.onerror = () => {
        // SSE disconnects are expected; browser auto-reconnects
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

  // ── Sidebar inner (shared between desktop & mobile) ──
  const sidebarInner = (
    <div className="flex h-full flex-col text-slate-200">
      {/* Brand */}
      <div className="px-5 pt-5 pb-4 border-b border-white/10">
        <BrandLogo />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto scroll-thin px-3 py-4 space-y-1" aria-label="Candidate portal navigation">
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
                {initials(candName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{candName}</p>
              <p className="truncate text-[11px] text-blue-200/70">{t('candidate.roleLabel', lang)}</p>
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
            <SheetTitle className="sr-only">HP ENTERPRISE Candidate Portal Navigation</SheetTitle>
            <SheetDescription className="sr-only">Candidate portal navigation with access to your dashboard, job search, applications, and interviews.</SheetDescription>
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

              {/* User avatar */}
              <Avatar className="hidden sm:block h-9 w-9 ring-2 ring-[var(--gold)]/40">
                <AvatarFallback className="bg-[var(--navy)] text-[var(--gold)] text-xs font-bold">
                  {initials(candName)}
                </AvatarFallback>
              </Avatar>
            </div>
          </header>

          {/* Module content */}
          <main className="flex-1 overflow-y-auto scroll-thin">
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
              {active === 'dashboard' && <DashboardModule lang={lang} onNavigate={handleNavigate} />}
              {active === 'browse-jobs' && <BrowseJobsModule lang={lang} />}
              {active === 'my-applications' && <MyApplicationsModule lang={lang} />}
              {active === 'interviews' && <InterviewsModule lang={lang} />}
              {active === 'my-resume' && <MyResumeModule lang={lang} />}
              {active === 'ai-career' && <AiCareerModule lang={lang} />}
              {active === 'notifications' && <NotificationsModule lang={lang} notifications={notifications} onMarkRead={markOneRead} onMarkAllRead={markAllRead} unread={unread} />}
              {active === 'settings' && <SettingsModule lang={lang} onNavigate={handleNavigate} />}
            </div>
          </main>
        </div>
      </div>

      {/* Sticky footer */}
      <footer className="mt-auto border-t bg-card px-4 py-3 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <FollowUs variant="inline" heading="" showLabels={false} className="mb-2" />
          <div className="flex flex-col items-center justify-between gap-1 text-xs text-muted-foreground sm:flex-row">
            <p>© 2025 HP ENTERPRISE Safety Service & Man Power Supply • Candidate Portal</p>
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