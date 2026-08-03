'use client'
import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { RegistrationForm } from '@/components/auth/RegistrationForm'
import { ForgotPasswordDialog } from '@/components/auth/ForgotPasswordDialog'
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher'
import { toast } from 'sonner'
import {
  Building2, ShieldCheck, Users, FileText, Clock, Wallet, ArrowRight, Lock, User as UserIcon,
  Sparkles, Sun, Moon, Palette, Globe, CreditCard, Crown, Check, Bot, Fingerprint,
  CalendarDays, FolderKanban, ClipboardList, ReceiptText, BarChart3, Megaphone, ScrollText,
  Settings, UserCog, Zap, Shield, Bell, Star, Headphones, TrendingUp, Send, Loader2,
  type LucideIcon,
} from 'lucide-react'
import { BRAND } from '@/lib/constants'
import { LANGUAGES } from '@/lib/i18n'
import { cn } from '@/lib/utils'

// ── Data ────────────────────────────────────────────────────────────────────

const STATS = [
  { v: '500+', l: 'Manpower Deployed' },
  { v: '15+', l: 'Project Types' },
  { v: '16', l: 'HR Documents' },
  { v: '99.9%', l: 'Uptime' },
]

const ALL_MODULES: { icon: LucideIcon; title: string; desc: string }[] = [
  { icon: Building2, title: 'Dashboard', desc: 'Real-time KPIs, activity feed & quick actions' },
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
  { icon: BarChart3, title: 'Reports', desc: 'Exportable CSV reports for HR & finance' },
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
  { key: 'admin' as const, title: 'Admin Console', subtitle: 'Owner / Super Admin / HR Manager', icon: ShieldCheck, color: 'var(--navy)', features: ['Full employee management', 'Payroll & leave approval', 'Client & project handling', 'Document generation (16+ types)', 'Reports with CSV export', 'Audit logs & settings'] },
  { key: 'employee' as const, title: 'Employee Portal', subtitle: 'Self-Service for All Employees', icon: Users, color: 'var(--gold)', features: ['Punch in/out with GPS', 'Leave application & balance', 'Download salary slips & documents', 'Profile & bank details', 'Change password', 'Notifications & announcements'] },
  { key: 'client' as const, title: 'Client Portal', subtitle: 'Clients & Contractors', icon: Building2, color: '#0A4488', features: ['Project progress dashboard', 'Work order tracking', 'Invoice viewing & PDF download', 'Team deployment overview', 'Live notifications', 'Communication with admin'] },
]

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
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md">
        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowRight className="h-4 w-4 rotate-180" /> Back to HPHRMS
        </button>
        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl" style={{ backgroundColor: portal.color }}>
              <Icon className="h-7 w-7 text-white" />
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
              <Button type="submit" disabled={loading} className="w-full text-white" style={{ backgroundColor: portal.color }}>
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in...</> : <>Sign In to {portal.title}</>}
              </Button>
            </form>

          </CardContent>
        </Card>
      </div>
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
                          {p.name} {p.price > 0 ? '— Rs ' + p.price.toLocaleString('en-IN') + '/mo' : '— Free'}
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
  const { darkMode, setDarkMode, themeColors, setThemeColors, lang } = useAppStore()

  // Portal login views
  if (mode === 'login-admin') return <PortalLoginForm portal={PORTALS[0]} onBack={() => setMode('home')} />
  if (mode === 'login-employee') return <PortalLoginForm portal={PORTALS[1]} onBack={() => setMode('home')} />
  if (mode === 'login-client') return <PortalLoginForm portal={PORTALS[2]} onBack={() => setMode('home')} />
  if (mode === 'register') return <RegistrationForm onBack={() => setMode('home')} />
  if (mode === 'subscribe') return <SubscriptionForm onBack={() => setMode('home')} />

  return (
    <div className="min-h-screen flex flex-col">
      {/* ═══ TOP NAV ═══ */}
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-md dark:bg-[var(--navy-deep)]/80">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <BrandLogo />
          </div>
          <nav className="flex items-center gap-1.5 sm:gap-2">
            <LanguageSwitcher />
            <button onClick={() => setDarkMode(!darkMode)} className="grid h-8 w-8 place-items-center rounded-md border bg-background text-[var(--navy)] dark:text-white hover:bg-muted transition-colors" aria-label="Toggle dark mode">
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <Button variant="ghost" size="sm" onClick={() => setMode('subscribe')} className="hidden sm:flex gap-1.5"><CreditCard className="h-4 w-4" /> Subscribe</Button>
            <Button variant="ghost" size="sm" onClick={() => setMode('register')} className="hidden sm:flex">Apply Now</Button>
          </nav>
        </div>
      </header>

      {/* ═══ HERO ═══ */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 hpe-sidebar-gradient" />
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 30%, #C9A961 0, transparent 40%), radial-gradient(circle at 80% 70%, #16306B 0, transparent 45%)' }} />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:py-28 text-center text-white">
          <Badge className="mb-4 border-[var(--gold)]/40 bg-[var(--gold)]/10 text-[var(--gold-light)] hover:bg-[var(--gold)]/15">
            <Sparkles className="mr-1 h-3.5 w-3.5" /> AI-Powered Human Resource Management System
          </Badge>
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight">
            <span className="text-gradient-gold">HPHRMS</span>
          </h1>
          <p className="mt-2 text-xl sm:text-2xl font-medium text-blue-100/90">HP ENTERPRISE Safety Service &amp; Man Power Supply</p>
          <p className="mt-4 max-w-2xl mx-auto text-base text-blue-100/80 leading-relaxed">
            The complete workforce management platform — from AI-powered HR assistance to automated payroll,
            attendance tracking, 16+ document types, and real-time coordination across Admin, Employee, and Client portals.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {['HPAI Assistant', '3 Portals', '15+ Modules', 'Multi-language', 'CSV Export', 'PDF Documents'].map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-blue-100">{tag}</span>
            ))}
          </div>
          <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-xl mx-auto">
            {STATS.map((s) => (
              <div key={s.l} className="rounded-lg border border-white/10 bg-white/5 p-3">
                <p className="text-2xl font-black text-[var(--gold)]">{s.v}</p>
                <p className="text-[10px] uppercase tracking-wide text-blue-100/70 mt-0.5">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 3 PORTALS ═══ */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="text-center">
          <Badge variant="outline" className="mb-3 border-[var(--gold)]/30 text-[#8a6f24]">Multi-Portal</Badge>
          <h2 className="text-3xl font-bold text-[var(--navy)] dark:text-white">3 Portals — Choose Your Access</h2>
          <p className="mt-2 text-muted-foreground">Click any portal to sign in with the appropriate credentials.</p>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {PORTALS.map((p) => {
            const Icon = p.icon
            return (
              <Card key={p.key} className="relative overflow-hidden lift cursor-pointer group" onClick={() => setMode('login-' + p.key)}>
                <div className="h-1.5" style={{ backgroundColor: p.color }} />
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="grid h-12 w-12 place-items-center rounded-xl shrink-0" style={{ backgroundColor: p.color + '15' }}>
                      <Icon className="h-6 w-6" style={{ color: p.color }} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[var(--navy)] dark:text-white">{p.title}</h3>
                      <p className="text-xs text-muted-foreground">{p.subtitle}</p>
                    </div>
                    <ArrowRight className="ml-auto h-5 w-5 text-muted-foreground group-hover:text-[var(--gold)] group-hover:translate-x-1 transition-all" />
                  </div>
                  <ul className="mt-4 space-y-2">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />{f}</li>
                    ))}
                  </ul>

                </CardContent>
              </Card>
            )
          })}
        </div>
        <div className="mt-6 text-center">
          <button onClick={() => setMode('register')} className="text-sm text-[var(--navy)] dark:text-[var(--gold)] hover:underline">
            New applicant? Submit your job application here <ArrowRight className="inline h-3.5 w-3.5" />
          </button>
        </div>
      </section>

      {/* ═══ ALL MODULES ═══ */}
      <section className="border-y bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="text-center">
            <Badge variant="outline" className="mb-3 border-[var(--gold)]/30 text-[#8a6f24]">Complete Platform</Badge>
            <h2 className="text-3xl font-bold text-[var(--navy)] dark:text-white">15+ Modules — Everything Your Workforce Needs</h2>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {ALL_MODULES.map((m) => {
              const Icon = m.icon
              return (
                <div key={m.title} className="rounded-xl border bg-card p-4 lift group cursor-default">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-[var(--navy)] dark:bg-[var(--navy-light)]">
                    <Icon className="h-5 w-5 text-[var(--gold)]" />
                  </div>
                  <h3 className="mt-3 text-sm font-bold text-[var(--navy)] dark:text-white group-hover:text-[var(--gold)] transition-colors">{m.title}</h3>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{m.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ═══ HPAI SECTION ═══ */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-2 items-center">
          <div>
            <Badge className="mb-3 bg-[var(--navy)] text-white border-0"><Sparkles className="mr-1 h-3.5 w-3.5" /> AI-Powered</Badge>
            <h2 className="text-3xl font-bold text-[var(--navy)] dark:text-white">Meet <span className="text-gradient-gold">HPAI</span> — Your HR Assistant</h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">HPAI (HP AI) is an intelligent chatbot built into HPHRMS. Ask about leave policies, payroll queries, attendance rules, document requests, or company policies — get instant answers in English, Hindi, or Kannada.</p>
            <div className="mt-6 space-y-3">
              {['Leave policies & balance inquiries', 'Payroll breakdowns (PF, ESI, professional tax)', 'Attendance rules & overtime calculations', 'Document generation requests', 'Safety compliance & EHS guidelines', 'Multi-language support (English, Hindi, Kannada)'].map((item) => (
                <div key={item} className="flex items-center gap-2.5">
                  <div className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-500/10"><Check className="h-3 w-3 text-emerald-600" /></div>
                  <span className="text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Mock chat */}
          <div className="rounded-2xl border bg-card shadow-xl overflow-hidden max-w-md mx-auto lg:mx-0 lg:ml-auto w-full">
            <div className="flex items-center gap-2 bg-gradient-to-r from-[var(--navy)] to-[var(--navy-light)] px-4 py-3">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-[var(--gold)]"><Sparkles className="h-4 w-4 text-[var(--navy)]" /></div>
              <div><p className="text-sm font-bold text-white">HPAI Assistant</p><p className="text-[10px] text-blue-200/70 flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Online</p></div>
            </div>
            <div className="p-4 space-y-3 min-h-[220px]">
              <div className="flex gap-2"><div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--gold)] text-[10px] font-bold text-[var(--navy)]">AI</div><div className="rounded-2xl rounded-bl-md bg-muted px-3 py-2 text-xs leading-relaxed max-w-[85%]">Hello! I am <strong>HPAI</strong>. How can I help you today?</div></div>
              <div className="flex justify-end"><div className="rounded-2xl rounded-br-md bg-[var(--navy)] text-white px-3 py-2 text-xs leading-relaxed max-w-[85%]">What is the casual leave policy?</div></div>
              <div className="flex gap-2"><div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--gold)] text-[10px] font-bold text-[var(--navy)]">AI</div><div className="rounded-2xl rounded-bl-md bg-muted px-3 py-2 text-xs leading-relaxed max-w-[85%]"><strong>CL:</strong> 12 days/year. Max 3 consecutive. Manager approval for &gt;2 days. No carry forward.</div></div>
              <div className="flex justify-end"><div className="rounded-2xl rounded-br-md bg-[var(--navy)] text-white px-3 py-2 text-xs leading-relaxed max-w-[85%]">How much PF is deducted?</div></div>
              <div className="flex gap-2"><div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--gold)] text-[10px] font-bold text-[var(--navy)]">AI</div><div className="rounded-2xl rounded-bl-md bg-muted px-3 py-2 text-xs leading-relaxed max-w-[85%]"><strong>PF:</strong> 12% of basic (employee). Employer: 12% + 3.67% EPF + 0.5% EDLI + 8.33% EPS.</div></div>
            </div>
            <div className="border-t px-3 py-2.5 flex items-center gap-2">
              <div className="flex-1 rounded-lg border bg-background px-3 py-2 text-xs text-muted-foreground">Ask HPAI anything about HR...</div>
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[var(--navy)] text-white"><ArrowRight className="h-3.5 w-3.5" /></div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ PRICING ═══ */}
      <section className="border-y bg-muted/30" id="pricing">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="text-center">
            <Badge variant="outline" className="mb-3 border-[var(--gold)]/30 text-[#8a6f24]">Pricing</Badge>
            <h2 className="text-3xl font-bold text-[var(--navy)] dark:text-white">Choose Your Plan</h2>
            <p className="mt-2 text-muted-foreground">Scale HPHRMS as your workforce grows. Subscribe and our team will contact you.</p>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {PLANS.map((plan) => (
              <Card key={plan.key} className={cn('relative flex flex-col transition-all', (plan as any).popular && 'border-[var(--gold)] shadow-lg shadow-[var(--gold)]/10 scale-[1.02]')}>
                {(plan as any).popular && (<div className="absolute -top-2.5 left-1/2 -translate-x-1/2"><Badge className="bg-[var(--gold)] text-[var(--navy)] border-0 gap-1"><Crown className="h-3 w-3" /> Most Popular</Badge></div>)}
                <CardHeader className="pb-2"><CardTitle className="text-lg">{plan.name}</CardTitle></CardHeader>
                <CardContent className="flex flex-1 flex-col gap-4">
                  <div>
                    <span className="text-3xl font-bold text-[var(--navy)] dark:text-white">{plan.price === 0 ? 'Free' : 'Rs ' + plan.price.toLocaleString('en-IN')}</span>
                    {plan.price > 0 && <span className="text-sm text-muted-foreground">/month</span>}
                  </div>
                  <ul className="flex-1 space-y-2">{plan.features.map((f) => (<li key={f} className="flex items-start gap-2 text-sm"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />{f}</li>))}</ul>
                  <Button className={cn('w-full', (plan as any).popular ? 'bg-[var(--navy)] text-white hover:bg-[var(--navy-light)]' : 'border border-[var(--navy)]/30 text-[var(--navy)] hover:bg-[var(--navy)]/5')} onClick={() => setMode('subscribe')}>
                    {plan.price === 0 ? 'Get Started' : 'Subscribe Now'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ THEME CUSTOMIZATION ═══ */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-2 items-center">
          <div>
            <Badge className="mb-3 bg-[var(--navy)] text-white border-0"><Palette className="mr-1 h-3.5 w-3.5" /> Customization</Badge>
            <h2 className="text-3xl font-bold text-[var(--navy)] dark:text-white">Your Brand, Your Colors</h2>
            <p className="mt-3 text-muted-foreground leading-relaxed">Change primary & accent colors, toggle dark/light mode, and switch languages — all in real-time. Try it below!</p>
            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <input type="color" value={themeColors.primary} onChange={(e) => setThemeColors({ ...themeColors, primary: e.target.value })} className="w-10 h-10 rounded-lg cursor-pointer border border-border" />
                  <div><p className="text-xs font-semibold">Primary</p><p className="text-[10px] text-muted-foreground font-mono">{themeColors.primary}</p></div>
                </div>
                <div className="flex items-center gap-2">
                  <input type="color" value={themeColors.accent} onChange={(e) => setThemeColors({ ...themeColors, accent: e.target.value })} className="w-10 h-10 rounded-lg cursor-pointer border border-border" />
                  <div><p className="text-xs font-semibold">Accent</p><p className="text-[10px] text-muted-foreground font-mono">{themeColors.accent}</p></div>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-2">{darkMode ? <Moon className="h-4 w-4 text-[var(--gold)]" /> : <Sun className="h-4 w-4 text-[var(--gold)]" />}<span className="text-sm font-medium">{darkMode ? 'Dark Mode' : 'Light Mode'}</span></div>
                <Switch checked={darkMode} onCheckedChange={setDarkMode} />
              </div>
              <div className="flex items-center gap-2 rounded-lg border p-3">
                <Globe className="h-4 w-4 text-[var(--gold)]" /><span className="text-sm font-medium">Language: </span>
                <div className="flex gap-1 ml-1">{LANGUAGES.map((l) => (<span key={l.code} className={cn('rounded-md px-2 py-0.5 text-xs font-medium', lang === l.code ? 'bg-[var(--gold)]/15 text-[var(--navy)] dark:text-[var(--gold)]' : 'bg-muted text-muted-foreground')}>{l.flag} {l.native}</span>))}</div>
              </div>
            </div>
          </div>
          {/* Preview */}
          <div className="rounded-2xl border bg-card shadow-lg overflow-hidden max-w-md mx-auto lg:mx-0 lg:ml-auto w-full">
            <div className="flex items-center justify-between px-4 py-2.5 border-b">
              <div className="flex gap-1.5"><div className="h-3 w-3 rounded-full bg-red-400" /><div className="h-3 w-3 rounded-full bg-amber-400" /><div className="h-3 w-3 rounded-full bg-emerald-400" /></div>
              <span className="text-[10px] text-muted-foreground font-mono">hphrms.hpenterprise.co.in</span>
              <button onClick={() => setDarkMode(!darkMode)} className="grid h-6 w-6 place-items-center rounded border hover:bg-muted transition-colors">{darkMode ? <Sun className="h-3 w-3" /> : <Moon className="h-3 w-3" />}</button>
            </div>
            <div className="p-4 space-y-3 transition-colors duration-300" style={{ backgroundColor: darkMode ? '#0A1F44' : '#FFFFFF' }}>
              <div className="flex items-center gap-3"><div className="h-8 w-8 rounded-lg" style={{ backgroundColor: themeColors.primary }} /><div className="space-y-1"><div className="h-2.5 w-24 rounded-full" style={{ backgroundColor: darkMode ? '#D4AF37' : themeColors.primary, opacity: 0.7 }} /><div className="h-1.5 w-16 rounded-full" style={{ backgroundColor: darkMode ? '#1B2F5A' : '#EEF1F8' }} /></div></div>
              <div className="grid grid-cols-3 gap-2">{[0, 1, 2].map((i) => (<div key={i} className="rounded-lg border p-2" style={{ borderColor: darkMode ? '#1B2F5A' : '#DDE3EE', backgroundColor: darkMode ? '#16306B' : '#F6F7FB' }}><div className="h-2 w-10 rounded-full mb-1.5" style={{ backgroundColor: darkMode ? '#D4AF37' : themeColors.primary, opacity: 0.5 }} /><div className="h-1.5 w-14 rounded-full" style={{ backgroundColor: darkMode ? '#1B2F5A' : '#DDE3EE' }} /><div className="h-1.5 w-8 rounded-full mt-1" style={{ backgroundColor: darkMode ? '#1B2F5A' : '#DDE3EE' }} /></div>))}</div>
              <div className="flex gap-2"><div className="h-7 w-16 rounded-md text-[9px] flex items-center justify-center font-medium text-white" style={{ backgroundColor: themeColors.primary }}>Button</div><div className="h-7 w-16 rounded-md text-[9px] flex items-center justify-center" style={{ backgroundColor: darkMode ? '#16306B' : '#EEF1F8', color: darkMode ? '#E6EBF5' : '#0A1F44' }}>Cancel</div></div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 hpe-sidebar-gradient" />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #C9A961 0, transparent 50%)' }} />
        <div className="relative mx-auto max-w-3xl px-4 py-20 sm:px-6 text-center text-white">
          <h2 className="text-3xl font-bold sm:text-4xl">Ready to Transform Your Workforce Management?</h2>
          <p className="mt-4 text-lg text-blue-100/90">Join hundreds of companies using HPHRMS to manage their manpower, safety services, and HR operations.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button size="lg" onClick={() => setMode('register')} className="hpe-gold-bar text-[var(--navy)] hover:opacity-90 font-bold">Get Started Free <ArrowRight className="ml-2 h-4 w-4" /></Button>
            <Button size="lg" onClick={() => setMode('subscribe')} variant="outline" className="border-white/30 bg-white/5 text-white hover:bg-white/10 hover:text-white"><CreditCard className="mr-2 h-4 w-4" /> Subscribe Now</Button>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="mt-auto border-t bg-white dark:bg-[var(--navy-deep)]">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <BrandLogo />
              <p className="mt-3 text-xs text-muted-foreground leading-relaxed">{BRAND.taglineFull}</p>
              <div className="mt-3 flex gap-2"><Badge variant="outline" className="text-[10px] border-[var(--gold)]/30 text-[#8a6f24]">ISO 27001 Ready</Badge></div>
            </div>
            <div>
              <h4 className="text-sm font-bold mb-3">Platform</h4>
              <ul className="space-y-2 text-xs text-muted-foreground">{['Dashboard', 'Employees', 'Attendance', 'Payroll', 'Documents', 'Reports'].map((i) => <li key={i}>{i}</li>)}</ul>
            </div>
            <div>
              <h4 className="text-sm font-bold mb-3">Features</h4>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li className="flex items-center gap-1.5"><Sparkles className="h-3 w-3 text-[var(--gold)]" /> HPAI Assistant</li>
                <li className="flex items-center gap-1.5"><Globe className="h-3 w-3 text-[var(--gold)]" /> Multi-Language</li>
                <li className="flex items-center gap-1.5"><Palette className="h-3 w-3 text-[var(--gold)]" /> Theme Customization</li>
                <li className="flex items-center gap-1.5"><CreditCard className="h-3 w-3 text-[var(--gold)]" /> Subscription Plans</li>
                <li className="flex items-center gap-1.5"><ShieldCheck className="h-3 w-3 text-[var(--gold)]" /> Role-Based Access</li>
                <li className="flex items-center gap-1.5"><BarChart3 className="h-3 w-3 text-[var(--gold)]" /> CSV & PDF Export</li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold mb-3">Contact</h4>
              <ul className="space-y-2 text-xs text-muted-foreground"><li>{BRAND.address}</li><li>{BRAND.phone}</li><li>{BRAND.email}</li><li>{BRAND.website}</li><li className="mt-1">CIN: {BRAND.cin}</li></ul>
            </div>
          </div>
          <div className="mt-8 border-t pt-6 flex flex-col items-center justify-between gap-2 sm:flex-row">
            <p className="text-xs text-muted-foreground">{'\u00A9'} {new Date().getFullYear()} {BRAND.legalName}. All rights reserved.</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">Built with <span className="text-gradient-gold font-bold">HPHRMS</span> v2.0 <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> All systems operational</p>
          </div>
        </div>
      </footer>
    </div>
  )
}