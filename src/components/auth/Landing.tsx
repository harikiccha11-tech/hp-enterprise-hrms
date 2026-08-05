'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import { BRAND, TRUST_BADGES, SOCIAL } from '@/lib/constants'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { RegistrationForm } from '@/components/auth/RegistrationForm'
import { ForgotPasswordDialog } from '@/components/auth/ForgotPasswordDialog'
import { SocialLinks } from '@/components/shared/SocialLinks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import {
  Building2, ShieldCheck, Users, FileText, ArrowRight, ArrowLeft, Lock,
  Sparkles, Check, Bot, Menu, X, Phone, Mail, MapPin,
  Send, Loader2, Eye, EyeOff, Zap, BarChart3,
  ClipboardList, Brain, FileSearch, Bell, Settings, Briefcase,
  LayoutDashboard, UserCheck, CalendarDays, UserPlus, CheckCircle2,
  HardHat, Factory, Landmark, Hammer, Stethoscope, Monitor, Cloud,
  Database, Activity, Code2, ChevronDown, Globe, TrendingUp,
  Linkedin, Instagram, Facebook, Twitter, Youtube, MessageCircle,
  type LucideIcon,
} from 'lucide-react'

/* ═══════════════════════════════════════════════════════
   DESIGN SYSTEM
   ═══════════════════════════════════════════════════════ */
const C = {
  navy:     '#002B5C',
  navyDeep: '#001A3D',
  navySoft: '#1A3A6B',
  gold:     '#D4AF37',
  goldLight:'#E8C96A',
  ink:      '#16213E',
  inkSoft:  '#4A5673',
  paper:    '#FFFFFF',
  bg:       '#F7F8FA',
  bgWarm:   '#F0F2F5',
  rule:     '#E2E5EA',
  ruleSoft: '#ECEEF1',
  verify:   '#2E7D5B',
  danger:   '#B03636',
  amber:    '#D4920A',
} as const

type LandingView = 'home' | 'register' | 'subscribe'

/* ═══════════════════════════════════════════════════════
   FONTS
   ═══════════════════════════════════════════════════════ */
function useLedgerFonts() {
  useEffect(() => {
    if (typeof document === 'undefined') return
    const id = 'ledger-fonts'
    if (document.getElementById(id)) return
    const link = document.createElement('link')
    link.id = id
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap'
    document.head.appendChild(link)
  }, [])
}

const fontBody = { fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }
const fontMono = { fontFamily: "'JetBrains Mono', 'IBM Plex Mono', monospace" }

/* ═══════════════════════════════════════════════════════
   DATA: Features
   ═══════════════════════════════════════════════════════ */
interface FeatureItem { title: string; desc: string; icon: LucideIcon }
const FEATURES_DATA: FeatureItem[] = [
  { title: 'AI-Powered HR Assistant', desc: 'Get instant answers about your workforce using natural language queries.', icon: Bot },
  { title: 'Complete Employee Lifecycle', desc: 'From recruitment and onboarding to exit — every stage managed digitally.', icon: Users },
  { title: 'Smart Attendance & GPS', desc: 'Real-time attendance with geo-fencing, face recognition, and shift tracking.', icon: ClipboardList },
  { title: 'Statutory Payroll Engine', desc: 'PF, ESI, TDS, PT, Gratuity — built for Indian compliance, not bolted on.', icon: FileText },
  { title: 'Advanced Analytics & BI', desc: 'Real-time dashboards, workforce planning, and actionable business intelligence.', icon: BarChart3 },
  { title: 'Recruitment & ATS', desc: 'End-to-end hiring pipeline with AI screening and interview scheduling.', icon: UserPlus },
  { title: 'Leave & Shift Management', desc: 'Configurable leave policies, auto-roster generation, and shift swap workflows.', icon: CalendarDays },
  { title: 'Document Generation', desc: 'Auto-generate offer letters, experience certificates, and compliance documents.', icon: FileSearch },
  { title: 'Enterprise Security', desc: 'Role-based access, data encryption, multi-tenant isolation, and audit trails.', icon: ShieldCheck },
  { title: 'Multi-Branch Operations', desc: 'Manage multiple locations, companies, and departments from a single dashboard.', icon: Building2 },
  { title: 'Compliance Tracking', desc: 'Automated alerts for expiring licenses, training certificates, and statutory deadlines.', icon: Bell },
  { title: 'Mobile-Ready Platform', desc: 'Full functionality on any device — desktop, tablet, or smartphone.', icon: Monitor },
]

/* ═══════════════════════════════════════════════════════
   DATA: Services
   ═══════════════════════════════════════════════════════ */
interface ServiceItem { title: string; desc: string; icon: LucideIcon }
const SERVICES_DATA: ServiceItem[] = [
  { title: 'Human Resource Management', desc: 'End-to-end HR lifecycle management from hire to retire with digital workflows and AI-powered insights.', icon: Users },
  { title: 'Recruitment & Talent Acquisition', desc: 'AI-powered recruitment, applicant tracking, and talent pipeline management for faster, smarter hiring.', icon: UserPlus },
  { title: 'Skilled & Unskilled Manpower Supply', desc: 'Trained workforce deployment across sites — skilled, semi-skilled, and unskilled — with full compliance.', icon: HardHat },
  { title: 'Safety (EHS) Consultancy', desc: 'EHS auditing, safety training, and regulatory compliance for zero-incident workplaces.', icon: ShieldCheck },
  { title: 'Engineering & Project Support', desc: 'Multi-discipline engineering professionals — MEP, civil, structural, and more — on demand.', icon: Building2 },
  { title: 'Construction Labour Supply', desc: 'Trained construction workforce for residential, commercial, and industrial projects.', icon: Factory },
  { title: 'Land Survey & Engineering Services', desc: 'Total station survey, topography, contour mapping, and engineering drawings by certified surveyors.', icon: MapPin },
  { title: 'Vendor Coordination', desc: 'Vendor management, procurement support, and multi-vendor coordination for complex projects.', icon: Briefcase },
  { title: 'Payroll Management', desc: 'Statutory payroll with PF, ESI, TDS, gratuity, and compliance filings — accurate and on time.', icon: FileText },
  { title: 'Website Design & Development', desc: 'Professional web design, development, and digital transformation for modern businesses.', icon: Code2 },
  { title: 'Safety Training & Compliance Support', desc: 'OSHA-aligned safety programs, certifications, and ongoing compliance support and audits.', icon: CheckCircle2 },
]

/* ═══════════════════════════════════════════════════════
   DATA: AI Capabilities
   ═══════════════════════════════════════════════════════ */
interface AiCap { title: string; desc: string; icon: LucideIcon }
const AI_CAPS: AiCap[] = [
  { title: 'Workforce Intelligence', desc: 'Ask questions in plain language and get answers grounded in your live company data.', icon: Brain },
  { title: 'Attendance Analytics', desc: 'Automatically spots absence patterns, trends, and anomalies across your workforce.', icon: ClipboardList },
  { title: 'Payroll Insights', desc: 'Explains what changed and why — department costs, statutory totals, month over month.', icon: BarChart3 },
  { title: 'Smart Recruitment', desc: 'Drafts job descriptions and interview structures based on your current team composition.', icon: Users },
  { title: 'Document Generation', desc: 'Offer letters, deployment letters, experience certificates — populated from real records.', icon: FileText },
  { title: 'Report Builder', desc: 'Describe the report you need in plain language and get a structured, exportable output.', icon: FileSearch },
  { title: 'Workforce Planning', desc: 'Flags staffing gaps before shifts start, based on deployment data and leave forecasts.', icon: TrendingUp },
  { title: 'Compliance Monitoring', desc: 'Tracks expiring contracts, training certificates, and statutory deadlines proactively.', icon: ShieldCheck },
  { title: 'Executive Briefings', desc: 'A daily summary of what changed and what needs a decision — concise and actionable.', icon: Zap },
]

/* ═══════════════════════════════════════════════════════
   DATA: Portals
   ═══════════════════════════════════════════════════════ */
interface PortalItem { title: string; icon: LucideIcon; desc: string; items: string[] }
const PORTALS_DATA: PortalItem[] = [
  {
    title: 'Admin Portal',
    icon: LayoutDashboard,
    desc: 'Full operational control for HR managers, finance teams, and administrators.',
    items: ['Employee lifecycle management', 'Payroll processing & compliance', 'Recruitment pipeline & onboarding', 'Real-time analytics dashboard', 'Multi-branch administration', 'Document generation & management'],
  },
  {
    title: 'Employee Portal',
    icon: UserCheck,
    desc: 'Self-service access for every team member — anytime, anywhere.',
    items: ['View payslips & tax documents', 'Apply for leave & track attendance', 'Update personal information', 'Download letters & certificates', 'Raise help desk tickets', 'Access company announcements'],
  },
  {
    title: 'Client Portal',
    icon: Users,
    desc: 'Workforce visibility for client organisations — secure, scoped, and real-time.',
    items: ['View deployed workforce at sites', 'Daily attendance & timesheets', 'Invoice & payment tracking', 'Site-wise performance metrics', 'Leave and shift status overview', 'Approval workflows for timesheets'],
  },
]

/* ═══════════════════════════════════════════════════════
   DATA: Industries
   ═══════════════════════════════════════════════════════ */
const INDUSTRIES: { name: string; icon: LucideIcon; desc: string }[] = [
  { name: 'Construction & Infrastructure', icon: HardHat, desc: 'Site attendance, contract labour compliance, and safety training management.' },
  { name: 'Manufacturing', icon: Factory, desc: 'Shift rosters, production-linked attendance, and statutory payroll tracking.' },
  { name: 'Oil & Gas / Energy', icon: Zap, desc: 'High-safety environments, permit-to-work tracking, and multi-site management.' },
  { name: 'Facilities Management', icon: Building2, desc: 'Deployed workforce tracking, SLA monitoring, and vendor coordination.' },
  { name: 'Government & PSUs', icon: Landmark, desc: 'Compliance-heavy environments, audit-ready documentation, and multi-branch ops.' },
  { name: 'Mining & Minerals', icon: Hammer, desc: 'Remote site attendance, safety compliance, and contractor workforce management.' },
  { name: 'Healthcare & Pharma', icon: Stethoscope, desc: 'Shift scheduling for clinical staff, training compliance, and document management.' },
  { name: 'IT & ITES', icon: Monitor, desc: 'Employee self-service, leave management, payroll, and performance analytics.' },
]

/* ═══════════════════════════════════════════════════════
   DATA: Technology
   ═══════════════════════════════════════════════════════ */
const TECH_DATA = [
  { title: 'Data Hosted in India', icon: Cloud, desc: 'Your data never leaves Indian shores. Mumbai-region cloud infrastructure.' },
  { title: 'AI-Powered Platform', icon: Sparkles, desc: 'HPAI reads your records, not the internet. Scoped per company, per user.' },
  { title: 'Bank-Grade Security', icon: Lock, desc: 'Encrypted at rest and in transit. JWT authentication with RBAC controls.' },
  { title: 'Multi-Tenant Isolation', icon: Database, desc: "Every company's data is walled off. Zero crossover between tenants." },
  { title: 'Real-Time Processing', icon: Activity, desc: 'Live attendance feeds, instant notifications, and real-time dashboards.' },
  { title: 'API-First Architecture', icon: Code2, desc: 'RESTful APIs for seamless integration with your existing tools and systems.' },
]

/* ═══════════════════════════════════════════════════════
   DATA: How It Works
   ═══════════════════════════════════════════════════════ */
const STEPS = [
  { num: '01', title: 'Book a Demo', icon: CalendarDays, desc: 'A 30-minute walkthrough of the platform with your specific requirements in mind.' },
  { num: '02', title: 'Workspace Setup', icon: Settings, desc: 'Your dedicated company workspace is created with your branding and configuration.' },
  { num: '03', title: 'Onboard & Configure', icon: UserPlus, desc: 'Import employee data, configure modules, set up workflows, and train your team.' },
  { num: '04', title: 'Go Live', icon: CheckCircle2, desc: 'Start operations with full AI-powered support and dedicated onboarding assistance.' },
]

/* ═══════════════════════════════════════════════════════
   DATA: FAQ
   ═══════════════════════════════════════════════════════ */
const FAQ_DATA = [
  { q: 'What is HPHRMS?', a: 'HPHRMS is an AI-powered Enterprise SaaS platform by HP ENTERPRISE that manages the complete employee lifecycle — from recruitment and onboarding to payroll, compliance, and analytics. It handles both permanent staff and contract workers on a single, secure platform.' },
  { q: 'Who is HPHRMS for?', a: 'Any organisation that manages a workforce: manufacturing, construction, IT, healthcare, government, facilities management, and more. Available PAN India with multi-branch support.' },
  { q: "Is my company's data secure?", a: "Every company's data is isolated in a separate tenant. Data is encrypted at rest and in transit, hosted in India, and accessible only through role-based access controls with full audit trails." },
  { q: 'What compliance does HPHRMS handle?', a: 'PF, ESI, Gratuity, Professional Tax, CLRA, BOCW, Factories Act, and Maternity Benefit Act — all built into the payroll engine, not bolted on.' },
  { q: 'How long does onboarding take?', a: 'Most organisations go live within 1-2 weeks. Our team handles data migration, configuration, and training to ensure a smooth transition.' },
  { q: 'Can I use HPHRMS for contract workers only?', a: 'Yes. HPHRMS has a dedicated Manpower Supply mode that manages deployed workers, site attendance, timesheets, and invoicing — designed for agencies and their clients.' },
  { q: 'What is HPAI Chat?', a: "HPAI is our built-in AI assistant that reads your own company data and answers questions in plain language. It can explain payroll, spot attendance patterns, draft documents, and generate reports — all scoped to each user's permissions." },
  { q: 'Where is my data hosted?', a: 'All data is hosted in India on Mumbai-region cloud infrastructure. Your data never leaves Indian jurisdiction, ensuring full regulatory compliance.' },
]

/* ═══════════════════════════════════════════════════════
   REVEAL ANIMATION
   ═══════════════════════════════════════════════════════ */
const EASE = [0.22, 1, 0.36, 1] as const

function Reveal({ children, delay = 0, direction = 'up', className = '' }: { children: React.ReactNode; delay?: number; direction?: 'up' | 'left' | 'right'; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-40px' })
  const offsets = { up: { y: 28, x: 0 }, left: { y: 0, x: -28 }, right: { y: 0, x: 28 } }
  return (
    <motion.div ref={ref} className={className}
      initial={{ opacity: 0, ...offsets[direction] }}
      animate={isInView ? { opacity: 1, x: 0, y: 0 } : { opacity: 0, ...offsets[direction] }}
      transition={{ duration: 0.5, delay, ease: EASE as unknown as number[] }}>
      {children}
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════
   SECTION LABEL
   ═══════════════════════════════════════════════════════ */
function SectionLabel({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn('text-xs font-bold tracking-[0.18em] uppercase mb-3', className)} style={{ ...fontMono, color: C.gold }}>
      {children}
    </p>
  )
}

function SectionTitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <h2 className={cn('text-[clamp(1.75rem,4vw,2.75rem)] font-extrabold leading-[1.08] tracking-[-0.03em] max-w-[22ch]', className)} style={fontBody}>
      {children}
    </h2>
  )
}

function SectionSub({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn('mt-4 max-w-[58ch] text-base leading-[1.65]', className)} style={{ color: C.inkSoft }}>
      {children}
    </p>
  )
}

/* ═══════════════════════════════════════════════════════
   LOGIN DIALOG
   ═══════════════════════════════════════════════════════ */
function LoginDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { setUser } = useAppStore()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [forgotOpen, setForgotOpen] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password.trim()) { toast.error('Please enter username and password'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: username.trim(), password }) })
      const data = await res.json()
      if (res.ok && data.user) { setUser(data.user); toast.success('Welcome back!') }
      else { toast.error(data.error || 'Login failed. Check your credentials.') }
    } catch { toast.error('Network error. Please try again.') } finally { setLoading(false) }
  }

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-[100] flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
            <motion.div className="relative z-10 w-full max-w-sm"
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}>
              <div className="rounded-xl border p-6 sm:p-8 shadow-2xl" style={{ background: C.paper, borderColor: C.rule }}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold" style={{ color: C.navy }}>Sign In to HPHRMS</h3>
                  <button onClick={onClose} className="p-1.5 rounded-md hover:bg-gray-100 transition-colors" aria-label="Close">
                    <X className="h-4 w-4" style={{ color: C.inkSoft }} />
                  </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold" style={{ color: C.inkSoft }}>Username</Label>
                    <Input placeholder="Enter username" value={username} onChange={(e) => setUsername(e.target.value)} className="h-10 text-sm rounded-lg" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold" style={{ color: C.inkSoft }}>Password</Label>
                    <div className="relative">
                      <Input type={showPw ? 'text' : 'password'} placeholder="Enter password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-10 text-sm rounded-lg pr-10" />
                      <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-10 rounded-lg text-sm font-semibold text-white" style={{ background: C.navy }} disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Sign In
                  </Button>
                  <button type="button" onClick={() => setForgotOpen(true)} className="block w-full text-center text-xs font-medium hover:underline" style={{ color: C.inkSoft }}>
                    Forgot password?
                  </button>
                </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <ForgotPasswordDialog open={forgotOpen} onOpenChange={setForgotOpen} />
    </>
  )
}

/* ═══════════════════════════════════════════════════════
   SUBSCRIPTION FORM VIEW
   ═══════════════════════════════════════════════════════ */
function SubscriptionForm({ onBack }: { onBack: () => void }) {
  const [form, setForm] = useState({ companyName: '', contactName: '', email: '', phone: '', address: '', plan: '', employeeCount: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const update = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.companyName.trim() || !form.contactName.trim() || !form.email.trim() || !form.phone.trim()) { toast.error('Please fill required fields'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/subscription/request', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const data = await res.json()
      if (res.ok) { toast.success('Subscription request submitted!'); setSent(true) }
      else { toast.error(data.error || 'Failed to submit request') }
    } catch { toast.error('Network error. Please try again.') } finally { setLoading(false) }
  }

  if (sent) return (
    <section data-landing="true" className="min-h-screen flex items-center justify-center px-4" style={{ background: C.bg }}>
      <div className="max-w-md w-full text-center p-8 rounded-xl border" style={{ background: C.paper, borderColor: C.rule }}>
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full" style={{ background: 'rgba(46,125,91,.12)' }}><Check className="h-7 w-7" style={{ color: C.verify }} /></div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: C.navy }}>Request Submitted!</h2>
        <p className="mb-6" style={{ color: C.inkSoft }}>Our team will contact you within 24 hours.</p>
        <Button onClick={onBack} className="h-10 text-sm font-semibold rounded-lg text-white" style={{ background: C.navy }}>Back to Home</Button>
      </div>
    </section>
  )

  return (
    <section data-landing="true" className="min-h-screen py-16 sm:py-20 px-4" style={{ background: C.bg }}>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-medium hover:underline" style={{ color: C.inkSoft }}>
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </button>
        </div>
        <div className="text-center mb-8">
          <SectionLabel className="text-center">Get Started</SectionLabel>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-2" style={{ color: C.navy }}>Request a Subscription</h1>
          <p style={{ color: C.inkSoft, fontSize: '16px' }}>Fill in the details and our team will reach out to you.</p>
        </div>
        <div className="rounded-xl border p-6 sm:p-8" style={{ background: C.paper, borderColor: C.rule }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold" style={{ color: C.inkSoft }}>Company Name *</Label>
                <Input placeholder="Your company" value={form.companyName} onChange={(e) => update('companyName', e.target.value)} className="h-10 text-sm rounded-lg" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold" style={{ color: C.inkSoft }}>Contact Name *</Label>
                <Input placeholder="Full name" value={form.contactName} onChange={(e) => update('contactName', e.target.value)} className="h-10 text-sm rounded-lg" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold" style={{ color: C.inkSoft }}>Email *</Label>
                <Input type="email" placeholder="email@company.com" value={form.email} onChange={(e) => update('email', e.target.value)} className="h-10 text-sm rounded-lg" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold" style={{ color: C.inkSoft }}>Phone *</Label>
                <Input placeholder="+91 XXXXX XXXXX" value={form.phone} onChange={(e) => update('phone', e.target.value)} className="h-10 text-sm rounded-lg" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold" style={{ color: C.inkSoft }}>Address</Label>
              <Input placeholder="Office address" value={form.address} onChange={(e) => update('address', e.target.value)} className="h-10 text-sm rounded-lg" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold" style={{ color: C.inkSoft }}>Plan</Label>
                <select value={form.plan} onChange={(e) => update('plan', e.target.value)} className="w-full h-10 rounded-lg border bg-white px-3 text-sm" style={{ borderColor: C.rule }}>
                  <option value="">Select plan</option><option value="starter">Starter</option><option value="standard">Standard</option><option value="professional">Professional</option><option value="enterprise">Enterprise</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold" style={{ color: C.inkSoft }}>Employee Count</Label>
                <Input placeholder="e.g. 50" value={form.employeeCount} onChange={(e) => update('employeeCount', e.target.value)} className="h-10 text-sm rounded-lg" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold" style={{ color: C.inkSoft }}>Message</Label>
              <Textarea placeholder="Tell us about your requirements..." rows={3} value={form.message} onChange={(e) => update('message', e.target.value)} className="text-sm rounded-lg" />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" className="flex-1 h-10 text-sm font-semibold rounded-lg text-white" style={{ background: C.navy }} disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}Submit Request
              </Button>
              <Button type="button" variant="outline" onClick={onBack} className="h-10 font-semibold rounded-lg">Back</Button>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════
   FAQ ACCORDION
   ═══════════════════════════════════════════════════════ */
function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  return (
    <div className="mt-8 sm:mt-10 max-w-3xl mx-auto">
      {FAQ_DATA.map((item, i) => {
        const isOpen = openIndex === i
        return (
          <Reveal key={i} delay={0.05 + i * 0.03}>
            <div className="border-b last:border-b-0" style={{ borderColor: C.ruleSoft }}>
              <button
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className="w-full flex items-start justify-between gap-4 py-4 sm:py-5 text-left group"
                aria-expanded={isOpen}
              >
                <span className="text-[14.5px] sm:text-[15px] font-semibold leading-[1.45]" style={{ color: C.ink }}>{item.q}</span>
                <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.25 }} className="shrink-0 mt-1">
                  <ChevronDown className="h-4 w-4" style={{ color: C.inkSoft }} />
                </motion.span>
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <p className="pb-5 text-[13.5px] sm:text-[14px] leading-[1.65] max-w-[62ch]" style={{ color: C.inkSoft }}>{item.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Reveal>
        )
      })}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   CONTACT FORM
   ═══════════════════════════════════════════════════════ */
function ContactForm() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' })
  const [loading, setLoading] = useState(false)
  const update = (k: string, v: string) => setForm((p) => ({ ...p, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) { toast.error('Please fill required fields'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/subscription/request', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactName: form.name, email: form.email, phone: form.phone, message: form.message, type: 'contact' }),
      })
      const data = await res.json()
      if (res.ok) { toast.success('Message sent! We will get back to you soon.'); setForm({ name: '', email: '', phone: '', message: '' }) }
      else { toast.error(data.error || 'Failed to send message') }
    } catch { toast.error('Network error. Please try again.') } finally { setLoading(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3.5">
      <div className="space-y-1.5">
        <Label className="text-[11px] font-semibold" style={{ color: C.inkSoft }}>Name *</Label>
        <Input placeholder="Your name" value={form.name} onChange={(e) => update('name', e.target.value)} className="h-9 text-sm rounded-lg" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="space-y-1.5">
          <Label className="text-[11px] font-semibold" style={{ color: C.inkSoft }}>Email *</Label>
          <Input type="email" placeholder="email@company.com" value={form.email} onChange={(e) => update('email', e.target.value)} className="h-9 text-sm rounded-lg" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[11px] font-semibold" style={{ color: C.inkSoft }}>Phone</Label>
          <Input placeholder="+91 XXXXX XXXXX" value={form.phone} onChange={(e) => update('phone', e.target.value)} className="h-9 text-sm rounded-lg" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label className="text-[11px] font-semibold" style={{ color: C.inkSoft }}>Message *</Label>
        <Textarea placeholder="How can we help?" rows={3} value={form.message} onChange={(e) => update('message', e.target.value)} className="text-sm rounded-lg" />
      </div>
      <Button type="submit" className="w-full h-9 text-sm font-semibold rounded-lg text-white" style={{ background: C.navy }} disabled={loading}>
        {loading ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Send className="mr-2 h-3.5 w-3.5" />}Send Message
      </Button>
    </form>
  )
}

/* ═══════════════════════════════════════════════════════
   NEWSLETTER FORM
   ═══════════════════════════════════════════════════════ */
function NewsletterForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) { toast.error('Please enter your email'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/subscription/request', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, type: 'newsletter' }),
      })
      const data = await res.json()
      if (res.ok) { toast.success('Subscribed!'); setEmail('') }
      else { toast.error(data.error || 'Failed to subscribe') }
    } catch { toast.error('Network error. Please try again.') } finally { setLoading(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 w-full max-w-sm">
      <Input type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)}
        className="h-10 text-sm rounded-lg bg-white/10 border-white/20 text-white placeholder:text-white/40 focus-visible:ring-white/30" required />
      <Button type="submit" className="h-10 px-5 text-sm font-semibold rounded-lg shrink-0" style={{ background: C.gold, color: C.navyDeep }} disabled={loading}>
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Subscribe'}
      </Button>
    </form>
  )
}

/* ═══════════════════════════════════════════════════════
   MAIN LANDING COMPONENT
   ═══════════════════════════════════════════════════════ */
export function Landing() {
  useLedgerFonts()
  const [view, setView] = useState<LandingView>('home')
  const [mobileMenu, setMobileMenu] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [loginOpen, setLoginOpen] = useState(false)
  const homeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth'
    const h = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', h, { passive: true })
    return () => window.removeEventListener('scroll', h)
  }, [])

  const scrollTo = useCallback((id: string) => { setMobileMenu(false); const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }) }, [])
  const goHome = useCallback(() => { setView('home'); window.scrollTo({ top: 0, behavior: 'smooth' }) }, [])

  if (view === 'register') return <RegistrationForm onBack={goHome} />
  if (view === 'subscribe') return <SubscriptionForm onBack={goHome} />

  const NAV_LINKS = [
    { id: 'features', label: 'Features' },
    { id: 'services', label: 'Services' },
    { id: 'ai', label: 'AI' },
    { id: 'portals', label: 'Portals' },
    { id: 'industries', label: 'Industries' },
    { id: 'faq', label: 'FAQ' },
    { id: 'contact', label: 'Contact' },
  ]

  return (
    <div ref={homeRef} data-landing="true" role="region" aria-label="Landing page" className="min-h-screen flex flex-col" style={{ ...fontBody, background: C.bg, color: C.ink }}>

      {/* ─── NAVIGATION ─── */}
      <nav className="sticky top-0 z-50 transition-all duration-300" style={{
        background: scrolled ? 'rgba(255,255,255,.95)' : 'rgba(255,255,255,.88)',
        backdropFilter: 'blur(16px)',
        borderBottom: scrolled ? '1px solid ' + C.rule : '1px solid transparent',
        boxShadow: scrolled ? '0 1px 12px rgba(0,0,0,.06)' : 'none',
      }}>
        <div className="max-w-[1200px] mx-auto px-5 sm:px-6 flex items-center justify-between h-[60px] sm:h-[64px]">
          {/* Brand */}
          <button onClick={goHome} className="flex items-center gap-2.5 shrink-0" aria-label="HPHRMS Home">
            <BrandLogo size="sm" showText={false} />
            <div className="leading-none">
              <span className="text-[17px] sm:text-[19px] font-extrabold tracking-tight block" style={{ color: C.navy }}>HPHRMS</span>
              <span className="text-[10px] font-semibold tracking-[0.12em] uppercase block" style={{ color: C.inkSoft }}>Enterprise AI</span>
            </div>
          </button>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-1" style={{ fontSize: '13.5px', fontWeight: 500 }}>
            {NAV_LINKS.map((link) => (
              <button key={link.id} onClick={() => scrollTo(link.id)}
                className="px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:text-[var(--navy)] hover:bg-gray-50"
                style={{ color: C.inkSoft }}>{link.label}</button>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-2.5">
            <a href={SOCIAL.whatsapp} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-green-50 hover:text-green-700"
              style={{ color: C.verify }}>
              <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
            </a>
            <button onClick={() => setLoginOpen(true)}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 hover:-translate-y-[0.5px] hover:shadow-lg"
              style={{ background: C.navy, color: '#fff' }}>Login</button>
            <button onClick={() => setView('register')}
              className="px-4 py-2 rounded-lg text-sm font-semibold border-2 transition-all duration-200 hover:bg-[var(--navy)] hover:text-white hover:border-[var(--navy)]"
              style={{ borderColor: C.navy, color: C.navy }}>Register</button>
          </div>

          {/* Mobile Toggle */}
          <button className="lg:hidden p-2 rounded-lg" onClick={() => setMobileMenu(!mobileMenu)} style={{ color: C.ink }} aria-label={mobileMenu ? 'Close menu' : 'Open menu'}>
            {mobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenu && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }}
              className="lg:hidden overflow-hidden border-t" style={{ background: 'rgba(255,255,255,.98)', borderColor: C.rule }}>
              <div className="px-5 py-4 space-y-1">
                {NAV_LINKS.map((link) => (
                  <button key={link.id} onClick={() => scrollTo(link.id)} className="block w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors" style={{ color: C.inkSoft }}>{link.label}</button>
                ))}
                <div className="flex gap-2 pt-3 border-t mt-3" style={{ borderColor: C.ruleSoft }}>
                  <button onClick={() => { setMobileMenu(false); setLoginOpen(true) }} className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white text-center" style={{ background: C.navy }}>Login</button>
                  <button onClick={() => { setMobileMenu(false); setView('register') }} className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-center border-2" style={{ borderColor: C.navy, color: C.navy }}>Register</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <LoginDialog open={loginOpen} onClose={() => setLoginOpen(false)} />

      {/* ═══════════════════════════════════════════════════════
         SECTION 1: HERO
         ═══════════════════════════════════════════════════════ */}
      <header className="relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${C.navyDeep} 0%, ${C.navy} 50%, ${C.navySoft} 100%)` }}>
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full opacity-[0.07]" style={{ background: 'radial-gradient(circle, ' + C.gold + ' 0%, transparent 70%)' }} />
          <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] rounded-full opacity-[0.05]" style={{ background: 'radial-gradient(circle, ' + C.gold + ' 0%, transparent 70%)' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-[0.03]" style={{ background: 'radial-gradient(circle, white 0%, transparent 60%)' }} />
        </div>

        <div className="relative max-w-[1200px] mx-auto px-5 sm:px-6 py-20 sm:py-28 lg:py-36">
          <div className="max-w-3xl">
            <Reveal>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-6" style={{ background: 'rgba(212,175,55,.15)', border: '1px solid rgba(212,175,55,.25)' }}>
                <Sparkles className="h-3.5 w-3.5" style={{ color: C.gold }} />
                <span className="text-xs font-semibold tracking-wide" style={{ color: C.goldLight }}>AI-Powered Enterprise Workforce Platform</span>
              </div>
            </Reveal>

            <Reveal delay={0.08}>
              <h1 className="text-[clamp(2.2rem,5.5vw,3.8rem)] font-extrabold leading-[1.05] tracking-[-0.03em] text-white">
                The Workforce Platform
                <br />
                <span style={{ color: C.gold }}>Built for India.</span>
              </h1>
            </Reveal>

            <Reveal delay={0.16}>
              <p className="mt-6 max-w-[54ch] text-base sm:text-lg leading-[1.7]" style={{ color: 'rgba(255,255,255,.72)' }}>
                HPHRMS by HP ENTERPRISE manages your complete workforce — HRMS, payroll, compliance,
                AI analytics, and manpower supply — on one secure, multi-tenant SaaS platform.
              </p>
            </Reveal>

            <Reveal delay={0.2}>
              <p className="mt-3 text-sm font-semibold italic" style={{ color: C.goldLight }}>
                {BRAND.tagline}
              </p>
            </Reveal>

            <Reveal delay={0.25}>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href={SOCIAL.whatsapp} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-200 hover:-translate-y-[1px] hover:shadow-xl"
                  style={{ background: C.gold, color: C.navyDeep }}>
                  <MessageCircle className="h-4 w-4" /> Book a Demo
                </a>
                <button onClick={() => setView('register')}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold border-2 text-white transition-all duration-200 hover:bg-white hover:text-[var(--navy)] hover:border-white"
                  style={{ borderColor: 'rgba(255,255,255,.3)' }}>
                  Get Started <ArrowRight className="h-4 w-4" />
                </button>
                <button onClick={() => setLoginOpen(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium text-white/80 transition-all duration-200 hover:text-white hover:bg-white/10">
                  Sign In
                </button>
              </div>
            </Reveal>

            {/* Trust badges row */}
            <Reveal delay={0.35}>
              <div className="mt-12 pt-8 border-t flex flex-wrap items-center gap-x-6 gap-y-3" style={{ borderColor: 'rgba(255,255,255,.12)' }}>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" style={{ color: C.gold }} />
                  <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,.55)' }}>GST: {BRAND.gstin}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" style={{ color: C.gold }} />
                  <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,.55)' }}>UDYAM: {BRAND.udyam}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4" style={{ color: C.gold }} />
                  <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,.55)' }}>SOC 2 Compliant</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4" style={{ color: C.gold }} />
                  <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,.55)' }}>PAN India</span>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════
         SECTION 2: TRUST STRIP
         ═══════════════════════════════════════════════════════ */}
      <section className="py-6 sm:py-8 border-b" style={{ background: C.paper, borderColor: C.rule }}>
        <div className="max-w-[1200px] mx-auto px-5 sm:px-6">
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
            {TRUST_BADGES.map((badge, i) => (
              <Reveal key={i} delay={i * 0.04}>
                <div className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5" style={{ color: C.gold }} />
                  <span className="text-xs sm:text-sm font-medium" style={{ color: C.inkSoft }}>{badge}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
         SECTION 3: FEATURES
         ═══════════════════════════════════════════════════════ */}
      <section id="features" className="py-16 sm:py-20 lg:py-24" style={{ background: C.paper }}>
        <div className="max-w-[1200px] mx-auto px-5 sm:px-6">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto">
              <SectionLabel className="text-center">Platform Features</SectionLabel>
              <SectionTitle className="mx-auto">Everything you need to manage your workforce</SectionTitle>
              <SectionSub className="mx-auto">A comprehensive suite of tools designed for Indian businesses — from startup to enterprise.</SectionSub>
            </div>
          </Reveal>

          <div className="mt-12 sm:mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {FEATURES_DATA.map(({ title, desc, icon: Icon }, i) => (
              <Reveal key={i} delay={0.04 + i * 0.04}>
                <div className="group relative p-5 sm:p-6 rounded-xl border transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                  style={{ background: C.paper, borderColor: C.rule }}>
                  <div className="flex items-start gap-4">
                    <div className="shrink-0 flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: 'rgba(0,43,92,.07)' }}>
                      <Icon className="h-5 w-5" style={{ color: C.navy }} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-[15px] font-bold" style={{ color: C.ink }}>{title}</h3>
                      <p className="mt-1.5 text-[13px] leading-[1.6]" style={{ color: C.inkSoft }}>{desc}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
         SECTION 4: SERVICES
         ═══════════════════════════════════════════════════════ */}
      <section id="services" className="py-16 sm:py-20 lg:py-24 border-t" style={{ background: C.bg, borderColor: C.rule }}>
        <div className="max-w-[1200px] mx-auto px-5 sm:px-6">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto">
              <SectionLabel className="text-center">Our Services</SectionLabel>
              <SectionTitle className="mx-auto">Comprehensive workforce solutions</SectionTitle>
              <SectionSub className="mx-auto">From HR management and recruitment to safety consultancy and engineering support — all under one roof.</SectionSub>
            </div>
          </Reveal>

          <div className="mt-12 sm:mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {SERVICES_DATA.map(({ title, desc, icon: Icon }, i) => (
              <Reveal key={i} delay={0.04 + i * 0.04}>
                <div className="group relative p-5 sm:p-6 rounded-xl border transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                  style={{ background: C.paper, borderColor: C.rule }}>
                  <div className="flex items-start gap-4">
                    <div className="shrink-0 flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: 'rgba(212,175,55,.1)' }}>
                      <Icon className="h-5 w-5" style={{ color: C.amber }} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-[15px] font-bold" style={{ color: C.ink }}>{title}</h3>
                      <p className="mt-1.5 text-[13px] leading-[1.6]" style={{ color: C.inkSoft }}>{desc}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
         SECTION 5: AI INTELLIGENCE
         ═══════════════════════════════════════════════════════ */}
      <section id="ai" className="py-16 sm:py-20 lg:py-24" style={{ background: C.navy }}>
        <div className="max-w-[1200px] mx-auto px-5 sm:px-6">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto">
              <p className="text-xs font-bold tracking-[0.18em] uppercase mb-3 text-center" style={{ fontFamily: 'monospace', color: C.goldLight }}>HPAI Intelligence</p>
              <SectionTitle className="mx-auto text-white">Your AI-powered workforce assistant</SectionTitle>
              <p className="mt-4 max-w-[58ch] text-base leading-[1.65] mx-auto" style={{ color: 'rgba(255,255,255,.6)' }}>
                Ask questions in plain language. Get answers from your own company data.
                HPAI is scoped to each user's permissions — it sees only what you're allowed to see.
              </p>
            </div>
          </Reveal>

          <div className="mt-12 sm:mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {AI_CAPS.map(({ title, desc, icon: Icon }, i) => (
              <Reveal key={i} delay={0.04 + i * 0.04}>
                <div className="group p-5 sm:p-6 rounded-xl border transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                  style={{ background: 'rgba(255,255,255,.05)', borderColor: 'rgba(255,255,255,.1)' }}>
                  <div className="flex items-start gap-4">
                    <div className="shrink-0 flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: 'rgba(212,175,55,.15)' }}>
                      <Icon className="h-5 w-5" style={{ color: C.gold }} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-[15px] font-bold text-white">{title}</h3>
                      <p className="mt-1.5 text-[13px] leading-[1.6]" style={{ color: 'rgba(255,255,255,.55)' }}>{desc}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.3}>
            <div className="mt-12 text-center">
              <div className="inline-flex items-center gap-3 px-5 py-3 rounded-xl" style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.1)' }}>
                <Bot className="h-5 w-5" style={{ color: C.gold }} />
                <span className="text-sm font-medium text-white">Available 24/7 across Admin, Employee, and Client portals</span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
         SECTION 6: HOW IT WORKS
         ═══════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20 lg:py-24 border-t" style={{ background: C.paper, borderColor: C.rule }}>
        <div className="max-w-[1200px] mx-auto px-5 sm:px-6">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto">
              <SectionLabel className="text-center">How It Works</SectionLabel>
              <SectionTitle className="mx-auto">Go live in four simple steps</SectionTitle>
              <SectionSub className="mx-auto">From demo to full deployment — our team handles everything.</SectionSub>
            </div>
          </Reveal>

          <div className="mt-12 sm:mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map(({ num, title, desc, icon: StepIcon }, i) => (
              <Reveal key={i} delay={0.08 + i * 0.08}>
                <div className="relative text-center">
                  {/* Connector line */}
                  {i < 3 && (
                    <div className="hidden lg:block absolute top-8 left-[60%] w-[80%] h-px" style={{ background: C.rule }} />
                  )}
                  <div className="relative inline-flex h-16 w-16 items-center justify-center rounded-2xl mb-4" style={{ background: 'linear-gradient(135deg, ' + C.navy + ', ' + C.navySoft + ')' }}>
                    <StepIcon className="h-7 w-7 text-white" />
                    <span className="absolute -top-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ background: C.gold, color: C.navyDeep }}>{num}</span>
                  </div>
                  <h3 className="text-base font-bold" style={{ color: C.ink }}>{title}</h3>
                  <p className="mt-2 text-[13px] leading-[1.6] max-w-[22ch] mx-auto" style={{ color: C.inkSoft }}>{desc}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.4}>
            <div className="mt-12 text-center">
              <a href={SOCIAL.whatsapp} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-200 hover:-translate-y-[1px] hover:shadow-lg"
                style={{ background: C.navy, color: '#fff' }}>
                <MessageCircle className="h-4 w-4" /> Schedule Your Free Demo <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
         SECTION 7: PORTALS
         ═══════════════════════════════════════════════════════ */}
      <section id="portals" className="py-16 sm:py-20 lg:py-24 border-t" style={{ background: C.bg, borderColor: C.rule }}>
        <div className="max-w-[1200px] mx-auto px-5 sm:px-6">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto">
              <SectionLabel className="text-center">Dedicated Portals</SectionLabel>
              <SectionTitle className="mx-auto">One platform, three experiences</SectionTitle>
              <SectionSub className="mx-auto">Each portal is role-specific with its own dashboard, navigation, and permissions. Zero data crossover.</SectionSub>
            </div>
          </Reveal>

          <div className="mt-12 sm:mt-14 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {PORTALS_DATA.map(({ title, desc, items, icon: PortalIcon }, i) => (
              <Reveal key={i} delay={0.08 + i * 0.08}>
                <div className="group relative p-6 sm:p-7 rounded-xl border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 h-full"
                  style={{ background: C.paper, borderColor: C.rule }}>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: i === 0 ? 'rgba(0,43,92,.08)' : i === 1 ? 'rgba(46,125,91,.08)' : 'rgba(212,175,55,.1)' }}>
                      <PortalIcon className="h-5 w-5" style={{ color: i === 0 ? C.navy : i === 1 ? C.verify : C.amber }} />
                    </div>
                    <h3 className="text-lg font-bold" style={{ color: C.ink }}>{title}</h3>
                  </div>
                  <p className="text-[13.5px] leading-[1.6] mb-5" style={{ color: C.inkSoft }}>{desc}</p>
                  <ul className="space-y-2.5">
                    {items.map((item, j) => (
                      <li key={j} className="flex items-start gap-2.5">
                        <Check className="h-4 w-4 shrink-0 mt-0.5" style={{ color: i === 0 ? C.navy : i === 1 ? C.verify : C.gold }} />
                        <span className="text-[13px]" style={{ color: C.inkSoft }}>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
         SECTION 8: INDUSTRIES
         ═══════════════════════════════════════════════════════ */}
      <section id="industries" className="py-16 sm:py-20 lg:py-24 border-t" style={{ background: C.paper, borderColor: C.rule }}>
        <div className="max-w-[1200px] mx-auto px-5 sm:px-6">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto">
              <SectionLabel className="text-center">Industries We Serve</SectionLabel>
              <SectionTitle className="mx-auto">Built for every sector</SectionTitle>
              <SectionSub className="mx-auto">From construction sites to corporate offices — HPHRMS adapts to your industry's unique workforce requirements.</SectionSub>
            </div>
          </Reveal>

          <div className="mt-12 sm:mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {INDUSTRIES.map(({ name, desc, icon: IndIcon }, i) => (
              <Reveal key={i} delay={0.04 + i * 0.04}>
                <div className="group p-5 rounded-xl border transition-all duration-300 hover:shadow-lg hover:-translate-y-1 h-full"
                  style={{ background: C.bg, borderColor: C.rule }}>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg mb-3" style={{ background: 'rgba(0,43,92,.06)' }}>
                    <IndIcon className="h-5 w-5" style={{ color: C.navy }} />
                  </div>
                  <h3 className="text-[14px] font-bold mb-1.5" style={{ color: C.ink }}>{name}</h3>
                  <p className="text-[12.5px] leading-[1.55]" style={{ color: C.inkSoft }}>{desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
         SECTION 9: TECHNOLOGY & SECURITY
         ═══════════════════════════════════════════════════════ */}
      <section className="py-16 sm:py-20 lg:py-24 border-t" style={{ background: C.bg, borderColor: C.rule }}>
        <div className="max-w-[1200px] mx-auto px-5 sm:px-6">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto">
              <SectionLabel className="text-center">Technology & Security</SectionLabel>
              <SectionTitle className="mx-auto">Enterprise-grade infrastructure</SectionTitle>
              <SectionSub className="mx-auto">Built with security-first architecture and designed for scale, reliability, and compliance.</SectionSub>
            </div>
          </Reveal>

          <div className="mt-12 sm:mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {TECH_DATA.map(({ title, desc, icon: TechIcon }, i) => (
              <Reveal key={i} delay={0.04 + i * 0.04}>
                <div className="p-5 sm:p-6 rounded-xl border h-full" style={{ background: C.paper, borderColor: C.rule }}>
                  <div className="flex items-start gap-4">
                    <div className="shrink-0 flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: 'rgba(0,43,92,.06)' }}>
                      <TechIcon className="h-5 w-5" style={{ color: C.navy }} />
                    </div>
                    <div>
                      <h3 className="text-[15px] font-bold" style={{ color: C.ink }}>{title}</h3>
                      <p className="mt-1.5 text-[13px] leading-[1.6]" style={{ color: C.inkSoft }}>{desc}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
         SECTION 10: FAQ
         ═══════════════════════════════════════════════════════ */}
      <section id="faq" className="py-16 sm:py-20 lg:py-24 border-t" style={{ background: C.paper, borderColor: C.rule }}>
        <div className="max-w-[1200px] mx-auto px-5 sm:px-6">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto">
              <SectionLabel className="text-center">Frequently Asked Questions</SectionLabel>
              <SectionTitle className="mx-auto">Common questions, clear answers</SectionTitle>
            </div>
          </Reveal>
          <FaqAccordion />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
         CONTACT SECTION
         ═══════════════════════════════════════════════════════ */}
      <section id="contact" className="py-16 sm:py-20 lg:py-24 border-t" style={{ background: C.bg, borderColor: C.rule }}>
        <div className="max-w-[1200px] mx-auto px-5 sm:px-6">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto">
              <SectionLabel className="text-center">Get in Touch</SectionLabel>
              <SectionTitle className="mx-auto">Let's discuss your requirements</SectionTitle>
              <SectionSub className="mx-auto">Whether you need HRMS software, manpower supply, or safety consultancy — we're here to help.</SectionSub>
            </div>
          </Reveal>

          <div className="mt-12 sm:mt-14 grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Contact Info */}
            <div className="lg:col-span-2 space-y-6">
              <Reveal delay={0.1}>
                <div className="p-5 rounded-xl border" style={{ background: C.paper, borderColor: C.rule }}>
                  <h3 className="text-sm font-bold mb-4" style={{ color: C.ink }}>Contact Information</h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <Phone className="h-4 w-4 mt-0.5 shrink-0" style={{ color: C.navy }} />
                      <div>
                        <p className="text-[13px] font-semibold" style={{ color: C.ink }}>{BRAND.phone}</p>
                        <p className="text-[12px]" style={{ color: C.inkSoft }}>Managing Director</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Phone className="h-4 w-4 mt-0.5 shrink-0" style={{ color: C.navy }} />
                      <div>
                        <p className="text-[13px] font-semibold" style={{ color: C.ink }}>{BRAND.hrPhone}</p>
                        <p className="text-[12px]" style={{ color: C.inkSoft }}>HR & EHS Director</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Mail className="h-4 w-4 mt-0.5 shrink-0" style={{ color: C.navy }} />
                      <a href={`mailto:${SOCIAL.email}`} className="text-[13px] font-semibold hover:underline" style={{ color: C.ink }}>{SOCIAL.email}</a>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 mt-0.5 shrink-0" style={{ color: C.navy }} />
                      <div>
                        <p className="text-[13px] font-semibold" style={{ color: C.ink }}>Head Office</p>
                        <p className="text-[12px] leading-[1.5]" style={{ color: C.inkSoft }}>{BRAND.headOffice.full}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 mt-0.5 shrink-0" style={{ color: C.navy }} />
                      <div>
                        <p className="text-[13px] font-semibold" style={{ color: C.ink }}>Branch Office</p>
                        <p className="text-[12px] leading-[1.5]" style={{ color: C.inkSoft }}>{BRAND.branchOffice.full}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Reveal>

              <Reveal delay={0.15}>
                <div className="p-5 rounded-xl border" style={{ background: C.paper, borderColor: C.rule }}>
                  <h3 className="text-sm font-bold mb-3" style={{ color: C.ink }}>Follow Us</h3>
                  <SocialLinks variant="icons" />
                </div>
              </Reveal>
            </div>

            {/* Contact Form */}
            <Reveal delay={0.1} direction="right" className="lg:col-span-3">
              <div className="p-6 rounded-xl border" style={{ background: C.paper, borderColor: C.rule }}>
                <h3 className="text-sm font-bold mb-4" style={{ color: C.ink }}>Send us a message</h3>
                <ContactForm />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
         NEWSLETTER CTA
         ═══════════════════════════════════════════════════════ */}
      <section className="py-12 sm:py-14" style={{ background: C.navy }}>
        <div className="max-w-[1200px] mx-auto px-5 sm:px-6 text-center">
          <Reveal>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Stay updated with HP ENTERPRISE</h2>
            <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,.55)' }}>Get the latest news, product updates, and workforce insights delivered to your inbox.</p>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="flex justify-center">
              <NewsletterForm />
            </div>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="mt-6 flex justify-center gap-4">
              <a href={SOCIAL.instagram} target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-white transition-colors" aria-label="Instagram"><Instagram className="h-5 w-5" /></a>
              <a href={SOCIAL.linkedin} target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-white transition-colors" aria-label="LinkedIn"><Linkedin className="h-5 w-5" /></a>
              <a href={SOCIAL.facebook} target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-white transition-colors" aria-label="Facebook"><Facebook className="h-5 w-5" /></a>
              <a href={SOCIAL.twitter} target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-white transition-colors" aria-label="X"><Twitter className="h-5 w-5" /></a>
              <a href={SOCIAL.youtube} target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-white transition-colors" aria-label="YouTube"><Youtube className="h-5 w-5" /></a>
              <a href={SOCIAL.whatsapp} target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-white transition-colors" aria-label="WhatsApp"><MessageCircle className="h-5 w-5" /></a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
         FOOTER
         ═══════════════════════════════════════════════════════ */}
      <footer className="border-t" style={{ background: C.navyDeep, borderColor: 'rgba(255,255,255,.08)' }}>
        <div className="max-w-[1200px] mx-auto px-5 sm:px-6 py-12 sm:py-14">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
            {/* Brand */}
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <BrandLogo size="sm" showText={false} variant="light" />
                <div className="leading-none">
                  <span className="text-[17px] font-extrabold text-white block">HP ENTERPRISE</span>
                  <span className="text-[10px] font-semibold tracking-[0.12em] uppercase block" style={{ color: 'rgba(255,255,255,.4)' }}>HPHRMS Enterprise AI</span>
                </div>
              </div>
              <p className="text-[12.5px] leading-[1.6] mb-4" style={{ color: 'rgba(255,255,255,.5)' }}>{BRAND.tagline}</p>
              <SocialLinks variant="icons" className="opacity-70" />
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-xs font-bold tracking-[0.15em] uppercase mb-4" style={{ color: C.goldLight }}>Platform</h4>
              <ul className="space-y-2.5">
                {[{ label: 'Features', id: 'features' }, { label: 'Services', id: 'services' }, { label: 'AI Intelligence', id: 'ai' }, { label: 'Portals', id: 'portals' }, { label: 'Industries', id: 'industries' }, { label: 'FAQ', id: 'faq' }].map((link) => (
                  <li key={link.id}>
                    <button onClick={() => scrollTo(link.id)} className="text-[13px] transition-colors hover:text-white" style={{ color: 'rgba(255,255,255,.5)' }}>{link.label}</button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal & Compliance */}
            <div>
              <h4 className="text-xs font-bold tracking-[0.15em] uppercase mb-4" style={{ color: C.goldLight }}>Legal</h4>
              <ul className="space-y-2.5">
                <li className="text-[13px]" style={{ color: 'rgba(255,255,255,.5)' }}>
                  <span className="block font-semibold text-white/70">GSTIN:</span> {BRAND.gstin}
                </li>
                <li className="text-[13px]" style={{ color: 'rgba(255,255,255,.5)' }}>
                  <span className="block font-semibold text-white/70">PAN:</span> {BRAND.pan}
                </li>
                <li className="text-[13px]" style={{ color: 'rgba(255,255,255,.5)' }}>
                  <span className="block font-semibold text-white/70">UDYAM:</span> {BRAND.udyam}
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-xs font-bold tracking-[0.15em] uppercase mb-4" style={{ color: C.goldLight }}>Contact</h4>
              <ul className="space-y-2.5">
                <li>
                  <a href={`tel:${BRAND.phone}`} className="flex items-center gap-2 text-[13px] transition-colors hover:text-white" style={{ color: 'rgba(255,255,255,.5)' }}>
                    <Phone className="h-3.5 w-3.5" /> {BRAND.phone}
                  </a>
                </li>
                <li>
                  <a href={`mailto:${SOCIAL.email}`} className="flex items-center gap-2 text-[13px] transition-colors hover:text-white" style={{ color: 'rgba(255,255,255,.5)' }}>
                    <Mail className="h-3.5 w-3.5" /> {SOCIAL.email}
                  </a>
                </li>
                <li>
                  <a href={SOCIAL.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-[13px] transition-colors hover:text-white" style={{ color: 'rgba(255,255,255,.5)' }}>
                    <Globe className="h-3.5 w-3.5" /> {SOCIAL.website.replace('https://', '')}
                  </a>
                </li>
                <li className="flex items-start gap-2 text-[13px]" style={{ color: 'rgba(255,255,255,.5)' }}>
                  <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  <span>{BRAND.headOffice.city}, {BRAND.headOffice.state}</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-10 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-3" style={{ borderColor: 'rgba(255,255,255,.08)' }}>
            <p className="text-[12px]" style={{ color: 'rgba(255,255,255,.35)' }}>
              &copy; {new Date().getFullYear()} {BRAND.name}. All rights reserved.
            </p>
            <div className="flex items-center gap-4">
              <a href={SOCIAL.hphrms} target="_blank" rel="noopener noreferrer" className="text-[12px] transition-colors hover:text-white" style={{ color: 'rgba(255,255,255,.35)' }}>{SOCIAL.hphrms.replace('https://', '')}</a>
              <a href={SOCIAL.website} target="_blank" rel="noopener noreferrer" className="text-[12px] transition-colors hover:text-white" style={{ color: 'rgba(255,255,255,.35)' }}>{SOCIAL.website.replace('https://', '')}</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp button */}
      <a href={SOCIAL.whatsapp} target="_blank" rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-xl transition-all duration-300 hover:scale-110 hover:shadow-2xl"
        style={{ background: '#25D366' }}
        aria-label="Chat on WhatsApp">
        <MessageCircle className="h-6 w-6 text-white" />
      </a>
    </div>
  )
}
