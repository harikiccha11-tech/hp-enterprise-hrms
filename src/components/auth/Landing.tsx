'use client'
import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { RegistrationForm } from '@/components/auth/RegistrationForm'
import { ForgotPasswordDialog } from '@/components/auth/ForgotPasswordDialog'
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher'
import { toast } from 'sonner'
import {
  Building2, ShieldCheck, Users, FileText, Clock, Wallet, ArrowRight, Lock, User as UserIcon,
  Sparkles, Sun, Moon, Palette, Globe, CreditCard, Crown, Check, Bot, Fingerprint,
  CalendarDays, FolderKanban, ClipboardList, ReceiptText, BarChart3, Megaphone, ScrollText,
  Settings, UserCog, Zap, Shield, Bell, ChevronDown, Star, Headphones, TrendingUp,
  type LucideIcon,
} from 'lucide-react'
import { BRAND } from '@/lib/constants'
import { t, LANGUAGES } from '@/lib/i18n'
import { cn } from '@/lib/utils'

// ── Data ────────────────────────────────────────────────────────────────────

const STATS = [
  { v: '500+', l: 'Manpower Deployed', icon: Users },
  { v: '15+', l: 'Project Types', icon: FolderKanban },
  { v: '16', l: 'HR Documents', icon: FileText },
  { v: '99.9%', l: 'Uptime', icon: ShieldCheck },
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
  { icon: BarChart3, title: 'Reports', desc: 'Exportable CSV/Excel reports for HR & finance' },
  { icon: ScrollText, title: 'Audit Logs', desc: 'Complete activity trail for compliance' },
  { icon: UserCog, title: 'User Accounts', desc: 'Role-based access, Admin & HR account creation' },
  { icon: Settings, title: 'Settings', desc: 'Payroll config, theme, language & branding' },
]

const PLANS = [
  { key: 'free', name: 'Free', price: 0, features: ['Up to 10 employees', '5 documents/month', 'Basic attendance', 'Email support'], tier: 0 },
  { key: 'starter', name: 'Starter', price: 2999, features: ['Up to 50 employees', '50 documents/month', 'HPAI — 50 queries/mo', 'Priority support', 'CSV exports'], tier: 1 },
  { key: 'professional', name: 'Professional', price: 7999, features: ['Up to 200 employees', '500 documents/month', 'HPAI — 500 queries/mo', 'Invoice PDFs', 'All reports', 'Dedicated support'], tier: 2, popular: true },
  { key: 'enterprise', name: 'Enterprise', price: 19999, features: ['Unlimited employees', 'Unlimited documents', 'HPAI — unlimited', 'Custom branding', 'API access', 'SLA guarantee', 'On-site training'], tier: 3 },
]

const TESTIMONIALS = [
  { name: 'Rajesh Kumar', role: 'Project Manager, L&T Construction', text: 'HPHRMS streamlined our 200+ workforce deployment. Attendance tracking and payroll are now fully automated.', stars: 5 },
  { name: 'Priya Sharma', role: 'HR Lead, Tata Projects', text: 'The document generation feature alone saves us 40+ hours per month. Offer letters, ID cards — all branded and instant.', stars: 5 },
  { name: 'Mohammed Irfan', role: 'EHS Manager, Shapoorji', text: 'Safety compliance tracking with HPHRMS is exceptional. EHS verification and training records are always audit-ready.', stars: 5 },
]

// ── Component ───────────────────────────────────────────────────────────────

export function Landing() {
  const [mode, setMode] = useState<'home' | 'login' | 'register'>('home')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { setUser, darkMode, setDarkMode, themeColors, setThemeColors, lang } = useAppStore()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Login failed'); return }
      setUser(data.user)
      toast.success(`Welcome back, ${data.user.username}!`)
    } catch { toast.error('Network error') } finally { setLoading(false) }
  }

  if (mode === 'register') return <RegistrationForm onBack={() => setMode('home')} />

  return (
    <div className="min-h-screen flex flex-col">
      {/* ═══════════ TOP NAV ═══════════ */}
      <header className="sticky top-0 z-50 border-b bg-white/80 backdrop-blur-md dark:bg-[var(--navy-deep)]/80">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <BrandLogo />
          <nav className="flex items-center gap-1.5 sm:gap-2">
            <LanguageSwitcher />
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="grid h-8 w-8 place-items-center rounded-md border bg-background text-[var(--navy)] dark:text-white hover:bg-muted transition-colors"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <Button variant="ghost" size="sm" className="hidden sm:flex" onClick={() => setMode('login')}>Sign In</Button>
            <Button size="sm" onClick={() => setMode('register')} className="bg-[var(--navy)] hover:bg-[var(--navy-light)] text-white">
              Apply Now <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </nav>
        </div>
      </header>

      {/* ═══════════ HERO ═══════════ */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 hpe-sidebar-gradient" />
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 30%, #C9A961 0, transparent 40%), radial-gradient(circle at 80% 70%, #16306B 0, transparent 45%)' }} />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
          <div className="flex flex-col justify-center text-white">
            <Badge className="w-fit border-[var(--gold)]/40 bg-[var(--gold)]/10 text-[var(--gold-light)] hover:bg-[var(--gold)]/15 mb-4">
              <Sparkles className="mr-1 h-3.5 w-3.5" /> Powered by HPHRMS v2.0
            </Badge>
            <h1 className="text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              HP ENTERPRISE{' '}
              <span className="text-gradient-gold">Safety & Manpower</span>
            </h1>
            <p className="mt-4 max-w-xl text-lg text-blue-100/90">
              The complete <strong className="text-white">HPHRMS</strong> — Human Resource Management System for Safety Services & Man Power Supply. From AI-powered HR assistance to automated payroll, attendance tracking, and document management.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {['HPAI Assistant', '3 Portals', '15+ Modules', 'Multi-language'].map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-blue-100">
                  {tag}
                </span>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" onClick={() => setMode('register')} className="hpe-gold-bar text-[var(--navy)] hover:opacity-90 font-bold">
                Start Application <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => setMode('login')} className="border-white/30 bg-white/5 text-white hover:bg-white/10 hover:text-white">
                Employee / Admin Login
              </Button>
            </div>
            <div className="mt-10 grid grid-cols-2 gap-3 max-w-md sm:grid-cols-4">
              {STATS.map((s) => (
                <div key={s.l} className="rounded-lg border border-white/10 bg-white/5 p-3 text-center">
                  <p className="text-xl font-black text-[var(--gold)]">{s.v}</p>
                  <p className="text-[10px] uppercase tracking-wide text-blue-100/70 mt-0.5">{s.l}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Login card */}
          <div className="flex items-center justify-center">
            <Card className="w-full max-w-md border-0 shadow-2xl">
              <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-2xl text-[var(--navy)] dark:text-white">Sign in to your account</CardTitle>
                <p className="text-sm text-muted-foreground">Access the Admin panel or Employee self-service portal.</p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="u">Username</Label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input id="u" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter your username" className="pl-9" autoComplete="username" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="p">Password</Label>
                      <ForgotPasswordDialog />
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input id="p" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="pl-9" autoComplete="current-password" />
                    </div>
                  </div>
                  <Button type="submit" disabled={loading} className="w-full bg-[var(--navy)] hover:bg-[var(--navy-light)]">
                    {loading ? 'Signing in…' : 'Sign In'}
                  </Button>
                </form>
                <div className="mt-5 rounded-lg border border-[var(--gold)]/30 bg-[var(--gold)]/5 p-3 text-center">
                  <p className="text-xs text-muted-foreground">
                    Credentials are issued privately by HR upon approval. <br/>Contact <span className="font-semibold text-[var(--navy)] dark:text-[var(--gold)]">hr@hpenterprise.co.in</span>
                  </p>
                </div>
                <button onClick={() => setMode('register')} className="mt-4 w-full text-center text-sm text-[var(--navy)] hover:underline dark:text-[var(--gold)]">
                  New applicant? Submit your registration →
                </button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ═══════════ ALL MODULES SHOWCASE ═══════════ */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="text-center">
          <Badge variant="outline" className="mb-3 border-[var(--gold)]/30 text-[#8a6f24]">Complete Platform</Badge>
          <h2 className="text-3xl font-bold text-[var(--navy)] dark:text-white">15+ Modules — Everything Your Workforce Needs</h2>
          <p className="mt-2 text-muted-foreground max-w-2xl mx-auto">
            From onboarding to payroll, HPHRMS covers every aspect of HR management with role-based access across 3 portals.
          </p>
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
      </section>

      {/* ═══════════ HPAI FEATURE SECTION ═══════════ */}
      <section className="border-y bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-2 items-center">
            <div>
              <Badge className="mb-3 bg-[var(--navy)] text-white border-0">
                <Sparkles className="mr-1 h-3.5 w-3.5" /> AI-Powered
              </Badge>
              <h2 className="text-3xl font-bold text-[var(--navy)] dark:text-white">Meet <span className="text-gradient-gold">HPAI</span> — Your HR Assistant</h2>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                HPAI (HP AI) is an intelligent chatbot built into HPHRMS. Ask about leave policies, payroll queries, attendance rules, document requests, or company policies — get instant, accurate answers.
              </p>
              <div className="mt-6 space-y-3">
                {[
                  'Leave policies & balance inquiries',
                  'Payroll breakdowns (PF, ESI, professional tax)',
                  'Attendance rules & overtime calculations',
                  'Document generation requests',
                  'Safety compliance & EHS guidelines',
                  'Multi-language support (English, Hindi, Kannada)',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2.5">
                    <div className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-500/10">
                      <Check className="h-3 w-3 text-emerald-600" />
                    </div>
                    <span className="text-sm text-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Mock chat UI */}
            <div className="rounded-2xl border bg-card shadow-xl overflow-hidden max-w-md mx-auto lg:mx-0 lg:ml-auto w-full">
              <div className="flex items-center gap-2 bg-gradient-to-r from-[var(--navy)] to-[var(--navy-light)] px-4 py-3">
                <div className="grid h-8 w-8 place-items-center rounded-full bg-[var(--gold)]">
                  <Sparkles className="h-4 w-4 text-[var(--navy)]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">HPAI Assistant</p>
                  <p className="text-[10px] text-blue-200/70 flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Online</p>
                </div>
              </div>
              <div className="p-4 space-y-3 min-h-[240px]">
                <div className="flex gap-2">
                  <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--gold)] text-[10px] font-bold text-[var(--navy)]">AI</div>
                  <div className="rounded-2xl rounded-bl-md bg-muted px-3 py-2 text-xs text-foreground leading-relaxed max-w-[85%]">
                    Hello! I am <strong>HPAI</strong>, your HR assistant. How can I help you today?
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="rounded-2xl rounded-br-md bg-[var(--navy)] text-white px-3 py-2 text-xs leading-relaxed max-w-[85%]">
                    What is the casual leave policy?
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--gold)] text-[10px] font-bold text-[var(--navy)]">AI</div>
                  <div className="rounded-2xl rounded-bl-md bg-muted px-3 py-2 text-xs text-foreground leading-relaxed max-w-[85%]">
                    <strong>Casual Leave:</strong> 12 days per year. Max 3 consecutive days. Requires manager approval for &gt;2 days. Unutilised CL cannot be carried forward.
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="rounded-2xl rounded-br-md bg-[var(--navy)] text-white px-3 py-2 text-xs leading-relaxed max-w-[85%]">
                    How much PF is deducted from my salary?
                  </div>
                </div>
                <div className="flex gap-2">
                  <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--gold)] text-[10px] font-bold text-[var(--navy)]">AI</div>
                  <div className="rounded-2xl rounded-bl-md bg-muted px-3 py-2 text-xs text-foreground leading-relaxed max-w-[85%]">
                    <strong>PF Deduction:</strong> 12% of basic salary (employee contribution). Employer matches with 12% + 3.67% to EPF + 0.5% EDLI + 8.33% EPS.
                  </div>
                </div>
              </div>
              <div className="border-t px-3 py-2.5 flex items-center gap-2">
                <div className="flex-1 rounded-lg border bg-background px-3 py-2 text-xs text-muted-foreground">
                  Ask HPAI anything about HR…
                </div>
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[var(--navy)] text-white">
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ SUBSCRIPTION PLANS ═══════════ */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6" id="pricing">
        <div className="text-center">
          <Badge variant="outline" className="mb-3 border-[var(--gold)]/30 text-[#8a6f24]">Pricing</Badge>
          <h2 className="text-3xl font-bold text-[var(--navy)] dark:text-white">Choose Your Plan</h2>
          <p className="mt-2 text-muted-foreground max-w-xl mx-auto">
            Scale HPHRMS as your workforce grows. Upgrade or downgrade anytime.
          </p>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((plan) => (
            <Card
              key={plan.key}
              className={cn(
                'relative flex flex-col transition-all',
                plan.popular && 'border-[var(--gold)] shadow-lg shadow-[var(--gold)]/10 scale-[1.02]'
              )}
            >
              {plan.popular && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                  <Badge className="bg-[var(--gold)] text-[var(--navy)] border-0 gap-1">
                    <Crown className="h-3 w-3" /> Most Popular
                  </Badge>
                </div>
              )}
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{plan.name}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-4">
                <div>
                  <span className="text-3xl font-bold text-[var(--navy)] dark:text-white">
                    {plan.price === 0 ? 'Free' : `₹${plan.price.toLocaleString('en-IN')}`}
                  </span>
                  {plan.price > 0 && <span className="text-sm text-muted-foreground">/month</span>}
                </div>
                <ul className="flex-1 space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className={cn(
                    'w-full',
                    plan.popular
                      ? 'bg-[var(--navy)] text-white hover:bg-[var(--navy-light)]'
                      : 'border border-[var(--navy)]/30 text-[var(--navy)] hover:bg-[var(--navy)]/5 dark:text-white dark:border-white/20'
                  )}
                  onClick={() => setMode('register')}
                >
                  {plan.price === 0 ? 'Get Started' : 'Subscribe Now'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ═══════════ THEME & CUSTOMIZATION ═══════════ */}
      <section className="border-y bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-2 items-center">
            {/* Theme Preview Card */}
            <div className="rounded-2xl border bg-card shadow-lg overflow-hidden max-w-md mx-auto lg:mx-0 w-full">
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-400" />
                  <div className="h-3 w-3 rounded-full bg-amber-400" />
                  <div className="h-3 w-3 rounded-full bg-emerald-400" />
                </div>
                <span className="text-[10px] text-muted-foreground font-mono">hphrms.hpenterprise.co.in</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setDarkMode(!darkMode)}
                    className="grid h-6 w-6 place-items-center rounded border text-[var(--navy)] dark:text-white hover:bg-muted transition-colors"
                  >
                    {darkMode ? <Sun className="h-3 w-3" /> : <Moon className="h-3 w-3" />}
                  </button>
                </div>
              </div>
              <div className="p-4 space-y-3 transition-colors duration-300" style={{ backgroundColor: darkMode ? '#0A1F44' : '#FFFFFF' }}>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg" style={{ backgroundColor: themeColors.primary }} />
                  <div className="space-y-1">
                    <div className="h-2.5 w-24 rounded-full" style={{ backgroundColor: darkMode ? '#D4AF37' : themeColors.primary }} />
                    <div className="h-1.5 w-16 rounded-full" style={{ backgroundColor: darkMode ? '#1B2F5A' : '#EEF1F8' }} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="rounded-lg border p-2" style={{ borderColor: darkMode ? '#1B2F5A' : '#DDE3EE', backgroundColor: darkMode ? '#16306B' : '#F6F7FB' }}>
                      <div className="h-2 w-10 rounded-full mb-1.5" style={{ backgroundColor: darkMode ? '#D4AF37' : themeColors.primary, opacity: 0.6 }} />
                      <div className="h-1.5 w-14 rounded-full" style={{ backgroundColor: darkMode ? '#1B2F5A' : '#DDE3EE' }} />
                      <div className="h-1.5 w-8 rounded-full mt-1" style={{ backgroundColor: darkMode ? '#1B2F5A' : '#DDE3EE' }} />
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <div className="h-7 w-16 rounded-md text-[9px] flex items-center justify-center font-medium text-white"
                    style={{ backgroundColor: themeColors.primary }}
                  >Button</div>
                  <div className="h-7 w-16 rounded-md text-[9px] flex items-center justify-center"
                    style={{ backgroundColor: darkMode ? '#16306B' : '#EEF1F8', color: darkMode ? '#E6EBF5' : '#0A1F44' }}
                  >Cancel</div>
                </div>
              </div>
            </div>

            <div>
              <Badge className="mb-3 bg-[var(--navy)] text-white border-0">
                <Palette className="mr-1 h-3.5 w-3.5" /> Customization
              </Badge>
              <h2 className="text-3xl font-bold text-[var(--navy)] dark:text-white">Your Brand, Your Colors</h2>
              <p className="mt-3 text-muted-foreground leading-relaxed">
                HPHRMS lets you customize the entire look and feel. Change primary & accent colors, toggle dark/light mode, and update company branding — all from Settings.
              </p>
              <div className="mt-6 space-y-4">
                {/* Color pickers */}
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={themeColors.primary}
                      onChange={(e) => setThemeColors({ ...themeColors, primary: e.target.value })}
                      className="w-10 h-10 rounded-lg cursor-pointer border border-border"
                    />
                    <div>
                      <p className="text-xs font-semibold text-[var(--navy)] dark:text-white">Primary</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{themeColors.primary}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={themeColors.accent}
                      onChange={(e) => setThemeColors({ ...themeColors, accent: e.target.value })}
                      className="w-10 h-10 rounded-lg cursor-pointer border border-border"
                    />
                    <div>
                      <p className="text-xs font-semibold text-[var(--navy)] dark:text-white">Accent</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{themeColors.accent}</p>
                    </div>
                  </div>
                </div>
                {/* Dark mode toggle */}
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div className="flex items-center gap-2">
                    {darkMode ? <Moon className="h-4 w-4 text-[var(--gold)]" /> : <Sun className="h-4 w-4 text-[var(--gold)]" />}
                    <span className="text-sm font-medium">{darkMode ? 'Dark Mode' : 'Light Mode'}</span>
                  </div>
                  <Switch checked={darkMode} onCheckedChange={setDarkMode} />
                </div>
                {/* Language display */}
                <div className="flex items-center gap-2 rounded-lg border p-3">
                  <Globe className="h-4 w-4 text-[var(--gold)]" />
                  <span className="text-sm font-medium">Language: </span>
                  <div className="flex gap-1 ml-1">
                    {LANGUAGES.map((l) => (
                      <span
                        key={l.code}
                        className={cn(
                          'rounded-md px-2 py-0.5 text-xs font-medium transition-colors',
                          lang === l.code
                            ? 'bg-[var(--gold)]/15 text-[var(--navy)] dark:text-[var(--gold)]'
                            : 'bg-muted text-muted-foreground'
                        )}
                      >
                        {l.flag} {l.native}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ 3 PORTALS SECTION ═══════════ */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="text-center">
          <Badge variant="outline" className="mb-3 border-[var(--gold)]/30 text-[#8a6f24]">Multi-Portal</Badge>
          <h2 className="text-3xl font-bold text-[var(--navy)] dark:text-white">3 Portals, One Platform</h2>
          <p className="mt-2 text-muted-foreground max-w-xl mx-auto">
            Role-based access ensures each user sees exactly what they need.
          </p>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {[
            {
              icon: ShieldCheck, title: 'Admin Console', role: 'Owner / Super Admin / HR Manager',
              features: ['Full employee management', 'Payroll & leave approval', 'Client & project handling', 'Document generation', 'Reports & audit logs'],
              color: 'var(--navy)',
            },
            {
              icon: Users, title: 'Employee Portal', role: 'All Employees',
              features: ['Self-service attendance punch', 'Leave application & balance', 'View salary slips & documents', 'Profile & password management', 'Notifications & announcements'],
              color: 'var(--gold)',
            },
            {
              icon: Building2, title: 'Client Portal', role: 'Clients & Contractors',
              features: ['Project progress dashboard', 'Work order tracking', 'Invoice viewing & downloads', 'Team deployment overview', 'Communication with admin'],
              color: '#0A4488',
            },
          ].map((portal) => (
            <Card key={portal.title} className="relative overflow-hidden lift">
              <div className="h-1.5" style={{ backgroundColor: portal.color }} />
              <CardContent className="p-6">
                <div className="grid h-12 w-12 place-items-center rounded-xl" style={{ backgroundColor: `${portal.color}15` }}>
                  <portal.icon className="h-6 w-6" style={{ color: portal.color }} />
                </div>
                <h3 className="mt-4 text-lg font-bold text-[var(--navy)] dark:text-white">{portal.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{portal.role}</p>
                <ul className="mt-4 space-y-2">
                  {portal.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                      <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                      {f}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* ═══════════ TESTIMONIALS ═══════════ */}
      <section className="border-y bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
          <div className="text-center">
            <Badge variant="outline" className="mb-3 border-[var(--gold)]/30 text-[#8a6f24]">Trusted</Badge>
            <h2 className="text-3xl font-bold text-[var(--navy)] dark:text-white">Trusted by Industry Leaders</h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {TESTIMONIALS.map((t) => (
              <Card key={t.name} className="lift">
                <CardContent className="p-6">
                  <div className="flex gap-0.5">
                    {Array.from({ length: t.stars }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-[var(--gold)] text-[var(--gold)]" />
                    ))}
                  </div>
                  <p className="mt-3 text-sm text-foreground leading-relaxed italic">&ldquo;{t.text}&rdquo;</p>
                  <div className="mt-4 flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-full bg-[var(--navy)] text-white text-sm font-bold">
                      {t.name.split(' ').map((n) => n[0]).join('')}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--navy)] dark:text-white">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════ CTA SECTION ═══════════ */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 hpe-sidebar-gradient" />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #C9A961 0, transparent 50%)' }} />
        <div className="relative mx-auto max-w-3xl px-4 py-20 sm:px-6 text-center text-white">
          <h2 className="text-3xl font-bold sm:text-4xl">Ready to Transform Your Workforce Management?</h2>
          <p className="mt-4 text-lg text-blue-100/90">
            Join hundreds of companies using HPHRMS to manage their manpower, safety services, and HR operations — all in one platform.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button size="lg" onClick={() => setMode('register')} className="hpe-gold-bar text-[var(--navy)] hover:opacity-90 font-bold">
              Get Started Free <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" className="border-white/30 bg-white/5 text-white hover:bg-white/10 hover:text-white">
              <Headphones className="mr-2 h-4 w-4" /> Contact Sales
            </Button>
          </div>
        </div>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className="mt-auto border-t bg-white dark:bg-[var(--navy-deep)]">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {/* Brand */}
            <div className="lg:col-span-1">
              <BrandLogo />
              <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
                {BRAND.taglineFull}
              </p>
              <div className="mt-3 flex gap-2">
                <Badge variant="outline" className="text-[10px] border-[var(--gold)]/30 text-[#8a6f24]">ISO 27001 Ready</Badge>
                <Badge variant="outline" className="text-[10px]">GST: {BRAND.gst.slice(-5)}</Badge>
              </div>
            </div>
            {/* Platform */}
            <div>
              <h4 className="text-sm font-bold text-[var(--navy)] dark:text-white mb-3">Platform</h4>
              <ul className="space-y-2 text-xs text-muted-foreground">
                {['Dashboard', 'Employees', 'Attendance', 'Payroll', 'Documents', 'Reports'].map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            {/* Features */}
            <div>
              <h4 className="text-sm font-bold text-[var(--navy)] dark:text-white mb-3">Features</h4>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li className="flex items-center gap-1.5"><Sparkles className="h-3 w-3 text-[var(--gold)]" /> HPAI Assistant</li>
                <li className="flex items-center gap-1.5"><Globe className="h-3 w-3 text-[var(--gold)]" /> Multi-Language</li>
                <li className="flex items-center gap-1.5"><Palette className="h-3 w-3 text-[var(--gold)]" /> Theme Customization</li>
                <li className="flex items-center gap-1.5"><CreditCard className="h-3 w-3 text-[var(--gold)]" /> Subscription Plans</li>
                <li className="flex items-center gap-1.5"><ShieldCheck className="h-3 w-3 text-[var(--gold)]" /> Role-Based Access</li>
                <li className="flex items-center gap-1.5"><Bell className="h-3 w-3 text-[var(--gold)]" /> Live Notifications</li>
              </ul>
            </div>
            {/* Contact */}
            <div>
              <h4 className="text-sm font-bold text-[var(--navy)] dark:text-white mb-3">Contact</h4>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li>{BRAND.address}</li>
                <li>{BRAND.phone}</li>
                <li>{BRAND.email}</li>
                <li>{BRAND.website}</li>
                <li className="mt-1">CIN: {BRAND.cin}</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t pt-6 flex flex-col items-center justify-between gap-2 sm:flex-row">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} {BRAND.legalName}. All rights reserved.
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              Built with <span className="text-gradient-gold font-bold">HPHRMS</span> v2.0
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              All systems operational
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
