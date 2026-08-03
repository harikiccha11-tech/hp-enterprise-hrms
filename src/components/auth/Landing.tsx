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
import { BRAND, SOCIAL } from '@/lib/constants'
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
              <p className="mt-2 text-xs text-muted-foreground">Managing Director: {BRAND.managingDirector}</p>
              <p className="text-xs text-muted-foreground">EHS Director: {BRAND.ehsDirector}</p>
              <div className="mt-3 flex gap-2"><Badge variant="outline" className="text-[10px] border-[var(--gold)]/30 text-[#8a6f24]">CIN: {BRAND.cin}</Badge></div>
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
              <h4 className="text-sm font-bold mb-3">Contact & Social</h4>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li className="flex items-center gap-1.5"><Globe className="h-3 w-3" /> <a href="https://hpserve.site" target="_blank" rel="noreferrer" className="hover:text-[var(--gold)] transition-colors">hpserve.site</a></li>
                <li className="flex items-center gap-1.5"><Send className="h-3 w-3" /> {BRAND.email}</li>
                <li className="flex items-center gap-1.5"><Headphones className="h-3 w-3" /> MD: {BRAND.mdPhone}</li>
                <li className="flex items-center gap-1.5"><Headphones className="h-3 w-3" /> EHS: {BRAND.ehsPhone}</li>
              </ul>
              <div className="mt-3 flex flex-wrap gap-2">
                <a href={SOCIAL.whatsapp} target="_blank" rel="noreferrer" className="grid h-7 w-7 place-items-center rounded-md bg-muted hover:bg-emerald-100 hover:text-emerald-700 transition-colors" aria-label="WhatsApp"><svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg></a>
                <a href={SOCIAL.instagram} target="_blank" rel="noreferrer" className="grid h-7 w-7 place-items-center rounded-md bg-muted hover:bg-pink-100 hover:text-pink-600 transition-colors" aria-label="Instagram"><svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg></a>
                <a href={SOCIAL.linkedin} target="_blank" rel="noreferrer" className="grid h-7 w-7 place-items-center rounded-md bg-muted hover:bg-blue-100 hover:text-blue-700 transition-colors" aria-label="LinkedIn"><svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg></a>
                <a href={SOCIAL.youtube} target="_blank" rel="noreferrer" className="grid h-7 w-7 place-items-center rounded-md bg-muted hover:bg-red-100 hover:text-red-600 transition-colors" aria-label="YouTube"><svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg></a>
                <a href={SOCIAL.twitter} target="_blank" rel="noreferrer" className="grid h-7 w-7 place-items-center rounded-md bg-muted hover:bg-slate-100 hover:text-slate-800 transition-colors" aria-label="X/Twitter"><svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg></a>
                <a href={SOCIAL.facebook} target="_blank" rel="noreferrer" className="grid h-7 w-7 place-items-center rounded-md bg-muted hover:bg-blue-100 hover:text-blue-700 transition-colors" aria-label="Facebook"><svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg></a>
              </div>
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