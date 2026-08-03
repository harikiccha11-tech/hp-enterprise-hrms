'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { RegistrationForm } from '@/components/auth/RegistrationForm'
import { ForgotPasswordDialog } from '@/components/auth/ForgotPasswordDialog'
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher'
import { toast } from 'sonner'
import {
  Building2, ShieldCheck, Users, FileText, Clock, Wallet, ArrowRight, Lock, User as UserIcon,
  Sparkles, Sun, Moon, CreditCard, Crown, Check, Bot, Fingerprint,
  CalendarDays, FolderKanban, ClipboardList, ReceiptText, BarChart3, Megaphone, ScrollText,
  Settings, UserCog, Zap, Shield, Bell, Star, Headphones, TrendingUp, Send, Loader2,
  Phone, Mail, MapPin, ChevronRight, ExternalLink, Menu, X, Award, Globe2,
  type LucideIcon,
} from 'lucide-react'
import { BRAND } from '@/lib/constants'
import { t } from '@/lib/i18n'
import { cn } from '@/lib/utils'

// ── Inline Social Media SVGs ────────────────────────────────────────────────

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
  )
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
  )
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
  )
}

function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
  )
}

function XTwitterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
  )
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
  )
}

// ── Data ────────────────────────────────────────────────────────────────────

const STATS = [
  { v: 500, suffix: '+', l: 'Manpower Deployed' },
  { v: 15, suffix: '+', l: 'Active Projects' },
  { v: 16, suffix: '', l: 'HR Documents' },
  { v: 99.9, suffix: '%', l: 'System Uptime' },
]

const ALL_MODULES: { icon: LucideIcon; title: string; desc: string }[] = [
  { icon: BarChart3, title: 'Dashboard', desc: 'Real-time KPIs, activity feed & quick actions' },
  { icon: Users, title: 'Employee Management', desc: 'Applications, onboarding, verification & HR records' },
  { icon: Fingerprint, title: 'Attendance', desc: 'GPS punch in/out, overtime, late marks & CSV export' },
  { icon: CalendarDays, title: 'Leave Management', desc: 'Apply, approve/reject, carry-forward balance tracking' },
  { icon: Wallet, title: 'Payroll', desc: 'PF, ESI, LOP, professional tax & auto salary slips' },
  { icon: FileText, title: 'Document Generation', desc: '16+ branded letters — offer, ID card, experience & more' },
  { icon: Building2, title: 'Client Management', desc: 'Client master records, contact & billing info' },
  { icon: FolderKanban, title: 'Projects', desc: 'Project assignments, disciplines & site tracking' },
  { icon: ClipboardList, title: 'Work Orders', desc: 'Client work order creation, status & timeline' },
  { icon: ReceiptText, title: 'Invoices', desc: 'Billing, GST invoices, PDF generation & tracking' },
  { icon: Megaphone, title: 'Announcements', desc: 'Company-wide notifications & policy updates' },
  { icon: TrendingUp, title: 'Reports', desc: 'Exportable CSV reports for HR & finance' },
  { icon: ScrollText, title: 'Audit Logs', desc: 'Complete activity trail for compliance' },
  { icon: UserCog, title: 'User Accounts', desc: 'Role-based access, Admin & HR account creation' },
  { icon: Settings, title: 'Settings', desc: 'Payroll config, theme, language & branding' },
]

const PLANS = [
  { key: 'free', name: 'Free', price: 0, features: ['Up to 10 employees', '5 documents/month', 'Basic attendance', 'Email support'] },
  { key: 'starter', name: 'Starter', price: 2999, features: ['Up to 50 employees', '50 documents/month', 'HPAI — 50 queries/mo', 'Priority support', 'CSV exports'] },
  { key: 'professional', name: 'Professional', price: 7999, features: ['Up to 200 employees', '500 documents/month', 'HPAI — 500 queries/mo', 'Invoice PDFs', 'All reports', 'Dedicated support'], popular: true },
  { key: 'enterprise', name: 'Enterprise', price: 19999, features: ['Unlimited employees', 'Unlimited documents', 'HPAI — unlimited', 'Custom branding', 'API access', 'SLA guarantee', 'On-site training'] },
]

const PORTALS = [
  { key: 'admin' as const, title: 'Admin Console', subtitle: 'Owner / Super Admin / HR Manager', icon: ShieldCheck, color: '#002B5C', features: ['Full employee management', 'Payroll & leave approval', 'Client & project handling', 'Document generation (16+ types)', 'Reports with CSV export', 'Audit logs & settings'] },
  { key: 'employee' as const, title: 'Employee Portal', subtitle: 'Self-Service for All Employees', icon: Users, color: '#D4AF37', features: ['Punch in/out with GPS', 'Leave application & balance', 'Download salary slips & documents', 'Profile & bank details', 'Change password', 'Notifications & announcements'] },
  { key: 'client' as const, title: 'Client Portal', subtitle: 'Clients & Contractors', icon: Building2, color: '#0A4488', features: ['Project progress dashboard', 'Work order tracking', 'Invoice viewing & PDF download', 'Team deployment overview', 'Live notifications', 'Communication with admin'] },
]

// ── Animated Counter Hook ───────────────────────────────────────────────────

function useAnimatedCounter(target: number, suffix: string, startCounting: boolean, duration = 2000) {
  const [count, setCount] = useState(0)
  const hasAnimated = useRef(false)

  useEffect(() => {
    if (!startCounting || hasAnimated.current) return
    hasAnimated.current = true
    const startTime = Date.now()
    const isDecimal = target % 1 !== 0

    function tick() {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = eased * target
      setCount(isDecimal ? parseFloat(current.toFixed(1)) : Math.floor(current))
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [startCounting, target, duration])

  return `${count}${suffix}`
}

// ── Portal Login Form ──────────────────────────────────────────────────────

function PortalLoginForm({ portal, onBack }: { portal: typeof PORTALS[number]; onBack: () => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { setUser } = useAppStore()
  const Icon = portal.icon

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Invalid credentials'); return }
      setUser(data.user)
      toast.success('Welcome back, ' + data.user.username + '!')
    } catch { toast.error('Network error') } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #001A3D 0%, #002B5C 40%, #0A4488 100%)' }}>
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-white/70 hover:text-white mb-6 transition-colors">
        <ArrowRight className="h-4 w-4 rotate-180" /> Back to HPHRMS
      </button>
      <Card className="w-full max-w-md border-0 shadow-2xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl shadow-lg" style={{ backgroundColor: portal.color }}>
            <Icon className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-xl mt-3">{portal.title}</CardTitle>
          <CardDescription>{portal.subtitle}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Username</Label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter username" className="pl-9" autoComplete="username" autoFocus />
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between"><Label>Password</Label><ForgotPasswordDialog /></div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" className="pl-9" autoComplete="current-password" />
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full text-white shadow-lg transition-all hover:shadow-xl hover:scale-[1.02]" style={{ backgroundColor: portal.color }}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in...</> : <>Sign In to {portal.title}</>}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

// ── Subscription Form ───────────────────────────────────────────────────────

function SubscriptionForm({ onBack }: { onBack: () => void }) {
  const [form, setForm] = useState({ companyName: '', contactName: '', email: '', phone: '', address: '', plan: 'professional', employeeCount: '', message: '' })
  const [loading, setLoading] = useState(false)
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/subscription/request', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Submission failed'); return }
      toast.success(data.message)
      onBack()
    } catch { toast.error('Network error') } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="w-full max-w-lg">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowRight className="h-4 w-4 rotate-180" /> Back to HPHRMS
        </button>
        <Card className="border-0 shadow-xl">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-[var(--gold)]" />
              <CardTitle>Subscribe to HPHRMS</CardTitle>
            </div>
            <CardDescription>Fill in your company details and our team will contact you within 24 hours.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Company Name *</Label>
                  <Input value={form.companyName} onChange={(e) => set('companyName', e.target.value)} placeholder="Acme Corp" required />
                </div>
                <div className="space-y-1.5">
                  <Label>Contact Person *</Label>
                  <Input value={form.contactName} onChange={(e) => set('contactName', e.target.value)} placeholder="John Doe" required />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Email *</Label>
                  <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="john@company.com" required />
                </div>
                <div className="space-y-1.5">
                  <Label>Phone</Label>
                  <Input value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+91 98765 43210" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Address</Label>
                <Input value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="Office address" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Plan *</Label>
                  <Select value={form.plan} onValueChange={(v) => set('plan', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PLANS.map((p) => (
                        <SelectItem key={p.key} value={p.key}>
                          {p.name} {p.price > 0 ? '— ₹' + p.price.toLocaleString('en-IN') + '/mo' : '— Free'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Number of Employees</Label>
                  <Input value={form.employeeCount} onChange={(e) => set('employeeCount', e.target.value)} placeholder="e.g. 50" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Message / Requirements</Label>
                <Textarea value={form.message} onChange={(e) => set('message', e.target.value)} placeholder="Tell us about your requirements..." rows={3} />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" onClick={onBack} className="flex-1">Cancel</Button>
                <Button type="submit" disabled={loading} className="flex-1 bg-[var(--navy)] text-white hover:bg-[var(--navy-light)]">
                  {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</> : <>Submit Request <Send className="ml-2 h-4 w-4" /></>}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ── Main Landing Component ─────────────────────────────────────────────────

type View = 'home' | 'login-admin' | 'login-employee' | 'login-client' | 'register' | 'subscribe'

export function Landing() {
  const [mode, setMode] = useState<View>('home')
  const [mobileMenu, setMobileMenu] = useState(false)
  const [statsVisible, setStatsVisible] = useState(false)
  const statsRef = useRef<HTMLDivElement>(null)
  const { darkMode, setDarkMode, lang } = useAppStore()

  // Intersection observer for stats animation
  useEffect(() => {
    const el = statsRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setStatsVisible(true); obs.disconnect() } },
      { threshold: 0.3 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  // Animated stat values
  const stat1 = useAnimatedCounter(STATS[0].v, STATS[0].suffix, statsVisible)
  const stat2 = useAnimatedCounter(STATS[1].v, STATS[1].suffix, statsVisible)
  const stat3 = useAnimatedCounter(STATS[2].v, STATS[2].suffix, statsVisible)
  const stat4 = useAnimatedCounter(STATS[3].v, STATS[3].suffix, statsVisible)
  const statValues = [stat1, stat2, stat3, stat4]

  const scrollTo = useCallback((id: string) => {
    setMobileMenu(false)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // Portal login views
  if (mode === 'login-admin') return <PortalLoginForm portal={PORTALS[0]} onBack={() => setMode('home')} />
  if (mode === 'login-employee') return <PortalLoginForm portal={PORTALS[1]} onBack={() => setMode('home')} />
  if (mode === 'login-client') return <PortalLoginForm portal={PORTALS[2]} onBack={() => setMode('home')} />
  if (mode === 'register') return <RegistrationForm onBack={() => setMode('home')} />
  if (mode === 'subscribe') return <SubscriptionForm onBack={() => setMode('home')} />

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#001A3D]">
      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 1 — GST TRUST BAR
          ═══════════════════════════════════════════════════════════════════════ */}
      <div className="bg-gradient-to-r from-[#D4AF37] via-[#E8C94A] to-[#D4AF37] text-[#002B5C] text-center py-2.5 px-4">
        <div className="flex items-center justify-center gap-2.5 flex-wrap">
          <ShieldCheck className="h-5 w-5 shrink-0" strokeWidth={2.5} />
          <span className="text-xs sm:text-sm font-semibold tracking-wide uppercase">GST Registered & Trusted Enterprise</span>
          <span className="hidden sm:inline text-xs opacity-70">|</span>
          <span className="font-black text-base sm:text-lg tracking-[0.15em]">29AAGCH4521K1ZP</span>
          <Award className="h-5 w-5 shrink-0" strokeWidth={2.5} />
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION 2 — NAVIGATION
          ═══════════════════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-[#002B5C]/90 backdrop-blur-xl border-b border-gray-100 dark:border-white/10">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <BrandLogo />
          </div>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {[['features', 'Features'], ['portals', 'Portals'], ['pricing', 'Pricing'], ['contact', 'Contact']].map(([id, label]) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className="px-3.5 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-[#002B5C] dark:hover:text-[#D4AF37] transition-colors rounded-lg hover:bg-gray-50 dark:hover:bg-white/5"
              >{label}</button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="grid h-9 w-9 place-items-center rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-[#002B5C] dark:text-[#D4AF37] hover:bg-gray-50 dark:hover:bg-white/10 transition-all"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMode('subscribe')}
              className="hidden sm:flex gap-1.5 text-gray-600 dark:text-gray-300 hover:text-[#002B5C] dark:hover:text-[#D4AF37]"
            >
              <CreditCard className="h-4 w-4" /> Subscribe
            </Button>
            <Button
              onClick={() => setMode('register')}
              className="hidden sm:inline-flex bg-[#D4AF37] text-[#002B5C] font-semibold hover:bg-[#E8C94A] shadow-md hover:shadow-lg transition-all hover:scale-[1.02]"
            >
              Apply Now
            </Button>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenu(!mobileMenu)}
              className="lg:hidden grid h-9 w-9 place-items-center rounded-lg border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              aria-label="Toggle menu"
            >
              {mobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenu && (
          <div className="lg:hidden border-t border-gray-100 dark:border-white/10 bg-white dark:bg-[#002B5C] px-4 pb-4 pt-2 space-y-1">
            {[['features', 'Features'], ['portals', 'Portals'], ['pricing', 'Pricing'], ['contact', 'Contact']].map(([id, label]) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className="block w-full text-left px-3 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-[#002B5C] dark:hover:text-[#D4AF37] hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg transition-colors"
              >{label}</button>
            ))}
            <div className="flex gap-2 pt-3 border-t border-gray-100 dark:border-white/10">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => { setMode('subscribe'); setMobileMenu(false) }}>Subscribe</Button>
              <Button size="sm" className="flex-1 bg-[#D4AF37] text-[#002B5C] font-semibold" onClick={() => { setMode('register'); setMobileMenu(false) }}>Apply Now</Button>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        {/* ═══════════════════════════════════════════════════════════════════════
            SECTION 3 — HERO
            ═══════════════════════════════════════════════════════════════════════ */}
        <section className="relative overflow-hidden">
          {/* Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#001A3D] via-[#002B5C] to-[#0A4488]" />
          <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 15% 25%, rgba(212,175,55,0.4) 0%, transparent 50%), radial-gradient(circle at 85% 75%, rgba(10,68,136,0.6) 0%, transparent 50%)' }} />
          {/* Grid pattern overlay */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
          {/* Floating shapes */}
          <div className="absolute top-20 left-[10%] w-72 h-72 bg-[#D4AF37]/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-10 right-[10%] w-96 h-96 bg-[#0A4488]/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#D4AF37]/5 rounded-full blur-3xl" />

          <div className="relative mx-auto max-w-7xl px-4 pt-20 pb-24 sm:px-6 lg:pt-32 lg:pb-36 text-center">
            <Badge className="mb-6 border-[#D4AF37]/40 bg-[#D4AF37]/10 text-[#D4AF37] hover:bg-[#D4AF37]/15 text-sm px-4 py-1.5">
              <Sparkles className="mr-1.5 h-4 w-4" /> AI-Powered Human Resource Management System
            </Badge>

            <h1 className="text-6xl sm:text-7xl lg:text-8xl font-black tracking-tight">
              <span className="bg-gradient-to-r from-[#D4AF37] via-[#F5E6A3] to-[#D4AF37] bg-clip-text text-transparent">HPHRMS</span>
            </h1>

            <p className="mt-3 text-xl sm:text-2xl font-semibold text-white/90">
              by HP ENTERPRISE
            </p>
            <p className="mt-1 text-base sm:text-lg text-white/60 font-medium">
              Safety Service &amp; Man Power Supply
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
              {BRAND.tagline.split(' • ').map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 backdrop-blur-sm px-4 py-1.5 text-xs sm:text-sm font-medium text-white/80">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#D4AF37]" />
                  {tag}
                </span>
              ))}
            </div>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                onClick={() => setMode('register')}
                size="lg"
                className="bg-[#D4AF37] text-[#002B5C] font-bold text-base px-8 h-12 shadow-lg shadow-[#D4AF37]/20 hover:bg-[#E8C94A] hover:shadow-xl hover:shadow-[#D4AF37]/30 transition-all hover:scale-[1.03]"
              >
                Get Started <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                onClick={() => setMode('subscribe')}
                size="lg"
                variant="outline"
                className="border-white/20 bg-white/5 backdrop-blur-sm text-white font-semibold text-base px-8 h-12 hover:bg-white/10 hover:border-white/30 transition-all"
              >
                <CreditCard className="mr-2 h-5 w-5" /> View Plans
              </Button>
            </div>

            <a
              href="https://hpserve.site"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 text-sm text-white/50 hover:text-[#D4AF37] transition-colors"
            >
              <Globe2 className="h-4 w-4" /> hpserve.site <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════════
            SECTION 4 — STATS (Animated)
            ═══════════════════════════════════════════════════════════════════════ */}
        <section ref={statsRef} className="relative -mt-16 z-10 mx-auto max-w-5xl px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {STATS.map((s, i) => (
              <div
                key={s.l}
                className="group rounded-2xl bg-white dark:bg-white/[0.07] backdrop-blur-xl border border-gray-100 dark:border-white/10 p-5 sm:p-6 text-center shadow-lg shadow-gray-200/50 dark:shadow-black/20 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <p className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-[#002B5C] to-[#0A4488] dark:from-[#D4AF37] dark:to-[#F5E6A3] bg-clip-text text-transparent">
                  {statValues[i]}
                </p>
                <p className="mt-1.5 text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {s.l}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════════
            SECTION 5 — MODULES GRID
            ═══════════════════════════════════════════════════════════════════════ */}
        <section id="features" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="text-center mb-14">
            <Badge variant="outline" className="mb-4 border-[#D4AF37]/30 text-[#B8941F] dark:text-[#D4AF37] dark:border-[#D4AF37]/30 px-4 py-1.5">
              <Zap className="mr-1.5 h-3.5 w-3.5" /> All-in-One Platform
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#002B5C] dark:text-white">
              Powerful Modules for Every HR Need
            </h2>
            <p className="mt-3 text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
              HPHRMS covers the entire employee lifecycle — from hiring to payroll, compliance to communication.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {ALL_MODULES.map((mod) => {
              const Icon = mod.icon
              return (
                <div
                  key={mod.title}
                  className="group rounded-xl bg-white dark:bg-white/[0.05] border border-gray-100 dark:border-white/[0.08] p-5 hover:shadow-xl hover:shadow-gray-200/60 dark:hover:shadow-black/30 hover:-translate-y-1 transition-all duration-300 hover:border-[#D4AF37]/30 dark:hover:border-[#D4AF37]/20"
                >
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-[#002B5C]/5 dark:bg-[#D4AF37]/10 group-hover:bg-[#002B5C]/10 dark:group-hover:bg-[#D4AF37]/15 transition-colors">
                    <Icon className="h-5 w-5 text-[#002B5C] dark:text-[#D4AF37]" />
                  </div>
                  <h3 className="mt-3.5 font-semibold text-[#002B5C] dark:text-white text-sm">{mod.title}</h3>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{mod.desc}</p>
                </div>
              )
            })}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════════
            SECTION 6 — PORTAL CARDS
            ═══════════════════════════════════════════════════════════════════════ */}
        <section id="portals" className="relative overflow-hidden bg-gradient-to-b from-gray-50/80 to-white dark:from-white/[0.02] dark:to-transparent">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
            <div className="text-center mb-14">
              <Badge variant="outline" className="mb-4 border-[#D4AF37]/30 text-[#B8941F] dark:text-[#D4AF37] dark:border-[#D4AF37]/30 px-4 py-1.5">
                <Shield className="mr-1.5 h-3.5 w-3.5" /> Multi-Portal Access
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold text-[#002B5C] dark:text-white">
                3 Portals — Choose Your Access
              </h2>
              <p className="mt-3 text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
                Each stakeholder gets a tailored experience with role-specific dashboards and tools.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              {PORTALS.map((p) => {
                const Icon = p.icon
                const isEmployee = p.key === 'employee'
                return (
                  <div
                    key={p.key}
                    className="group relative rounded-2xl bg-white dark:bg-white/[0.05] border border-gray-100 dark:border-white/[0.08] overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
                  >
                    {/* Top accent bar */}
                    <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${p.color}, ${isEmployee ? '#F5E6A3' : '#0A4488'})` }} />

                    <div className="p-6 sm:p-8">
                      <div className="grid h-14 w-14 place-items-center rounded-2xl shadow-lg" style={{ backgroundColor: p.color }}>
                        <Icon className="h-7 w-7 text-white" />
                      </div>

                      <h3 className="mt-5 text-xl font-bold text-[#002B5C] dark:text-white">{p.title}</h3>
                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{p.subtitle}</p>

                      <ul className="mt-5 space-y-2.5">
                        {p.features.map((f) => (
                          <li key={f} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                            <Check className={cn("h-4 w-4 mt-0.5 shrink-0", isEmployee ? "text-[#D4AF37]" : "text-[#002B5C] dark:text-[#D4AF37]")} />
                            {f}
                          </li>
                        ))}
                      </ul>

                      <Button
                        onClick={() => setMode(`login-${p.key}` as View)}
                        className="mt-6 w-full text-white shadow-lg hover:shadow-xl transition-all hover:scale-[1.02]"
                        style={{ backgroundColor: p.color }}
                      >
                        Sign In <ChevronRight className="ml-1.5 h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════════
            SECTION 7 — PRICING
            ═══════════════════════════════════════════════════════════════════════ */}
        <section id="pricing" className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="text-center mb-14">
            <Badge variant="outline" className="mb-4 border-[#D4AF37]/30 text-[#B8941F] dark:text-[#D4AF37] dark:border-[#D4AF37]/30 px-4 py-1.5">
              <Star className="mr-1.5 h-3.5 w-3.5" /> Transparent Pricing
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#002B5C] dark:text-white">
              Plans That Scale With You
            </h2>
            <p className="mt-3 text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
              Start free, upgrade as you grow. No hidden fees.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PLANS.map((plan) => {
              const isPopular = 'popular' in plan && plan.popular
              return (
                <div
                  key={plan.key}
                  className={cn(
                    'relative rounded-2xl border p-6 sm:p-7 transition-all duration-300 hover:-translate-y-1',
                    isPopular
                      ? 'bg-gradient-to-b from-[#002B5C] to-[#001A3D] text-white border-transparent shadow-2xl shadow-[#002B5C]/20 scale-[1.03]'
                      : 'bg-white dark:bg-white/[0.05] border-gray-100 dark:border-white/[0.08] hover:shadow-xl'
                  )}
                >
                  {isPopular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <Badge className="bg-[#D4AF37] text-[#002B5C] font-bold px-4 py-1 shadow-lg">
                        <Crown className="mr-1 h-3.5 w-3.5" /> Most Popular
                      </Badge>
                    </div>
                  )}

                  <h3 className={cn('text-lg font-bold', isPopular ? 'text-white' : 'text-[#002B5C] dark:text-white')}>{plan.name}</h3>
                  <div className="mt-3 flex items-baseline gap-1">
                    <span className={cn('text-4xl font-black', isPopular ? 'text-[#D4AF37]' : 'text-[#002B5C] dark:text-white')}>
                      {plan.price === 0 ? 'Free' : `₹${plan.price.toLocaleString('en-IN')}`}
                    </span>
                    {plan.price > 0 && <span className={cn('text-sm', isPopular ? 'text-white/60' : 'text-gray-400')}>/mo</span>}
                  </div>

                  <ul className="mt-6 space-y-3">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm">
                        <Check className={cn('h-4 w-4 mt-0.5 shrink-0', isPopular ? 'text-[#D4AF37]' : 'text-[#002B5C] dark:text-[#D4AF37]')} />
                        <span className={isPopular ? 'text-white/90' : 'text-gray-600 dark:text-gray-300'}>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => setMode('subscribe')}
                    className={cn(
                      'mt-7 w-full font-semibold transition-all hover:scale-[1.02]',
                      isPopular
                        ? 'bg-[#D4AF37] text-[#002B5C] hover:bg-[#E8C94A] shadow-lg shadow-[#D4AF37]/20'
                        : 'bg-[#002B5C] text-white hover:bg-[#0A4488]'
                    )}
                  >
                    {plan.price === 0 ? 'Start Free' : 'Get Started'}
                  </Button>
                </div>
              )
            })}
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════════
            SECTION 8 — CTA
            ═══════════════════════════════════════════════════════════════════════ */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#001A3D] via-[#002B5C] to-[#0A4488]" />
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 30% 40%, rgba(212,175,55,0.5) 0%, transparent 50%)' }} />
          <div className="absolute top-0 left-1/4 w-80 h-80 bg-[#D4AF37]/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-[#0A4488]/20 rounded-full blur-3xl" />

          <div className="relative mx-auto max-w-4xl px-4 py-20 sm:px-6 text-center text-white">
            <h2 className="text-3xl sm:text-4xl font-bold">
              Ready to Transform Your
              <br className="hidden sm:block" />
              <span className="bg-gradient-to-r from-[#D4AF37] via-[#F5E6A3] to-[#D4AF37] bg-clip-text text-transparent"> HR Operations?</span>
            </h2>
            <p className="mt-4 text-lg text-white/70 max-w-2xl mx-auto">
              Join hundreds of organizations using HPHRMS to streamline their workforce management, ensure compliance, and boost productivity.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                onClick={() => setMode('subscribe')}
                size="lg"
                className="bg-[#D4AF37] text-[#002B5C] font-bold text-base px-8 h-12 shadow-lg shadow-[#D4AF37]/20 hover:bg-[#E8C94A] hover:shadow-xl transition-all hover:scale-[1.03]"
              >
                Subscribe Now <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-white/20 bg-white/5 backdrop-blur-sm text-white font-semibold text-base px-8 h-12 hover:bg-white/10 hover:border-white/30 transition-all"
                onClick={() => setMode('register')}
              >
                Apply as Employee
              </Button>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════════════════════
            SECTION 9 — FOOTER
            ═══════════════════════════════════════════════════════════════════════ */}
        <footer id="contact" className="bg-[#001A3D] text-gray-300">
          <div className="mx-auto max-w-7xl px-4 pt-16 pb-8 sm:px-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">
              {/* Company Info */}
              <div className="sm:col-span-2 lg:col-span-1">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#D4AF37]/10">
                    <Building2 className="h-5 w-5 text-[#D4AF37]" />
                  </div>
                  <div>
                    <p className="font-bold text-white text-lg leading-tight">HPHRMS</p>
                    <p className="text-[10px] uppercase tracking-wider text-gray-500">by HP Enterprise</p>
                  </div>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed">
                  HP ENTERPRISE Safety Service &amp; Man Power Supply — your trusted partner for comprehensive HR management solutions.
                </p>
                <a
                  href="https://hpserve.site"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 text-sm text-[#D4AF37] hover:text-[#E8C94A] transition-colors"
                >
                  <Globe2 className="h-4 w-4" /> hpserve.site <ExternalLink className="h-3 w-3" />
                </a>
              </div>

              {/* Quick Links */}
              <div>
                <h4 className="font-semibold text-white mb-4">Quick Links</h4>
                <ul className="space-y-2.5">
                  {[{ label: 'Features', id: 'features' }, { label: 'Portals', id: 'portals' }, { label: 'Pricing', id: 'pricing' }].map((item) => (
                    <li key={item.id}>
                      <button onClick={() => scrollTo(item.id)} className="text-sm text-gray-400 hover:text-[#D4AF37] transition-colors">
                        {item.label}
                      </button>
                    </li>
                  ))}
                  <li>
                    <button onClick={() => setMode('subscribe')} className="text-sm text-gray-400 hover:text-[#D4AF37] transition-colors">
                      Subscribe
                    </button>
                  </li>
                  <li>
                    <button onClick={() => setMode('register')} className="text-sm text-gray-400 hover:text-[#D4AF37] transition-colors">
                      Apply Now
                    </button>
                  </li>
                </ul>
              </div>

              {/* Contact Info */}
              <div>
                <h4 className="font-semibold text-white mb-4">Contact</h4>
                <ul className="space-y-3">
                  <li className="flex items-start gap-2.5">
                    <Phone className="h-4 w-4 mt-0.5 shrink-0 text-[#D4AF37]" />
                    <div className="text-sm">
                      <p className="text-gray-400">Hariprasad N P (MD)</p>
                      <a href="tel:+918073748271" className="text-gray-300 hover:text-[#D4AF37] transition-colors">+91 80737 48271</a>
                    </div>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Phone className="h-4 w-4 mt-0.5 shrink-0 text-[#D4AF37]" />
                    <div className="text-sm">
                      <p className="text-gray-400">Rajesh S (EHS Director)</p>
                      <a href="tel:+917337792436" className="text-gray-300 hover:text-[#D4AF37] transition-colors">+91 73377 92436</a>
                    </div>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Mail className="h-4 w-4 mt-0.5 shrink-0 text-[#D4AF37]" />
                    <a href="mailto:hpenterpriseofficial11@gmail.com" className="text-sm text-gray-300 hover:text-[#D4AF37] transition-colors break-all">
                      hpenterpriseofficial11@gmail.com
                    </a>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-[#D4AF37]" />
                    <span className="text-sm text-gray-400">Bengaluru, Karnataka, India</span>
                  </li>
                </ul>
              </div>

              {/* Social Links */}
              <div>
                <h4 className="font-semibold text-white mb-4">Follow Us</h4>
                <div className="grid grid-cols-3 gap-3">
                  <a href="https://wa.me/message/65PDYODAFJZAN1" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white/5 hover:bg-[#25D366]/10 border border-white/5 hover:border-[#25D366]/20 transition-all group">
                    <WhatsAppIcon className="h-5 w-5 text-gray-400 group-hover:text-[#25D366] transition-colors" />
                    <span className="text-[10px] text-gray-500 group-hover:text-[#25D366]">WhatsApp</span>
                  </a>
                  <a href="https://www.instagram.com/hpenterpirse" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white/5 hover:bg-[#E4405F]/10 border border-white/5 hover:border-[#E4405F]/20 transition-all group">
                    <InstagramIcon className="h-5 w-5 text-gray-400 group-hover:text-[#E4405F] transition-colors" />
                    <span className="text-[10px] text-gray-500 group-hover:text-[#E4405F]">Instagram</span>
                  </a>
                  <a href="https://www.linkedin.com/in/hariprasad-np-4408a8423" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white/5 hover:bg-[#0A66C2]/10 border border-white/5 hover:border-[#0A66C2]/20 transition-all group">
                    <LinkedInIcon className="h-5 w-5 text-gray-400 group-hover:text-[#0A66C2] transition-colors" />
                    <span className="text-[10px] text-gray-500 group-hover:text-[#0A66C2]">LinkedIn</span>
                  </a>
                  <a href="https://www.youtube.com/@HPEnterpriseIndia" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white/5 hover:bg-[#FF0000]/10 border border-white/5 hover:border-[#FF0000]/20 transition-all group">
                    <YouTubeIcon className="h-5 w-5 text-gray-400 group-hover:text-[#FF0000] transition-colors" />
                    <span className="text-[10px] text-gray-500 group-hover:text-[#FF0000]">YouTube</span>
                  </a>
                  <a href="https://x.com/hpenterpri5nww" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all group">
                    <XTwitterIcon className="h-5 w-5 text-gray-400 group-hover:text-white transition-colors" />
                    <span className="text-[10px] text-gray-500 group-hover:text-white">X</span>
                  </a>
                  <a href="https://www.facebook.com/share/1DNBdqGcvb/" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white/5 hover:bg-[#1877F2]/10 border border-white/5 hover:border-[#1877F2]/20 transition-all group">
                    <FacebookIcon className="h-5 w-5 text-gray-400 group-hover:text-[#1877F2] transition-colors" />
                    <span className="text-[10px] text-gray-500 group-hover:text-[#1877F2]">Facebook</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Bottom bar */}
            <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-gray-500 text-center sm:text-left">
                © {new Date().getFullYear()} HP ENTERPRISE Safety Service &amp; Man Power Supply. All rights reserved.
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>GST: <span className="font-semibold text-gray-400">29AAGCH4521K1ZP</span></span>
                <span className="hidden sm:inline">•</span>
                <span className="hidden sm:inline">Powered by</span>
                <span className="font-bold text-[#D4AF37] sm:inline">HPHRMS</span>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}