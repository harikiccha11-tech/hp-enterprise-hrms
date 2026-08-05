'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import { BRAND, HPHRMS_FEATURES, SERVICES, TRUST_BADGES, SOCIAL } from '@/lib/constants'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { RegistrationForm } from '@/components/auth/RegistrationForm'
import { ForgotPasswordDialog } from '@/components/auth/ForgotPasswordDialog'
import { HpAiChat } from '@/components/shared/HpAiChat'
import { SocialLinks } from '@/components/shared/SocialLinks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import {
  Building2, ShieldCheck, Users, FileText, ArrowRight, ArrowLeft, Lock,
  Sparkles, Check, Bot, Menu, X, Phone, Mail, MapPin, ChevronRight,
  Send, Loader2, Eye, EyeOff, User as UserIcon, Zap, BarChart3,
  ClipboardList, Brain, FileSearch, Bell, Settings, Briefcase,
  LayoutDashboard, UserCheck, ExternalLink,
  type LucideIcon,
} from 'lucide-react'

/* ═══════════════════════════════════════════════════════
   LEDGER DESIGN SYSTEM
   ═══════════════════════════════════════════════════════ */
const C = {
  ink:      '#16213E',
  inkDeep:  '#0A0F1E',
  inkSoft:  '#4A5673',
  ledger:   '#EEF1F0',
  ledgerW:  '#F6F7F5',
  rule:     '#C9D3D0',
  ruleSoft: '#DEE5E3',
  amber:    '#E8A33D',
  verify:   '#2E7D5B',
  paper:    '#FFFFFF',
} as const

type LandingView = 'home' | 'register' | 'subscribe'

/* ═══════════════════════════════════════════════════════
   FONTS — load Bricolage Grotesque, Public Sans, IBM Plex Mono
   ═══════════════════════════════════════════════════════ */
function useLedgerFonts() {
  useEffect(() => {
    if (typeof document === 'undefined') return
    const id = 'ledger-fonts'
    if (document.getElementById(id)) return
    const link = document.createElement('link')
    link.id = id
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wdth,wght@12..96,75..100,400;12..96,75..100,600;12..96,75..100,800&family=Public+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap'
    document.head.appendChild(link)
  }, [])
}

/* ═══════════════════════════════════════════════════════
   FONT STYLE HELPERS
   ═══════════════════════════════════════════════════════ */
const fontDisplay = { fontFamily: "'Bricolage Grotesque', sans-serif" }
const fontBody    = { fontFamily: "'Public Sans', sans-serif" }
const fontMono    = { fontFamily: "'IBM Plex Mono', monospace" }

/* ═══════════════════════════════════════════════════════
   DATA: Service images mapping
   ═══════════════════════════════════════════════════════ */
const SERVICE_IMAGES: Record<string, string> = {
  'Human Resource Management': '/images/hr-management.jpg',
  'Recruitment & Talent Acquisition': '/images/recruitment.jpg',
  'Skilled & Unskilled Manpower Supply': '/images/employee-management.jpg',
  'Safety (EHS) Consultancy': '/images/ehs-safety.jpg',
  'Engineering & Project Support': '/images/engineering.jpg',
  'Construction Labour Supply': '/images/construction.jpg',
  'Land Survey & Engineering Services': '/images/corporate-meeting.jpg',
  'Vendor Coordination': '/images/ai-workforce.jpg',
  'Payroll Management': '/images/payroll.jpg',
  'Website Design & Development': '/images/corporate-meeting.jpg',
  'Safety Training & Compliance Support': '/images/ehs-safety.jpg',
}

const SERVICE_DESC: Record<string, string> = {
  'Human Resource Management': 'End-to-end HR lifecycle management from hire to retire with AI-powered insights.',
  'Recruitment & Talent Acquisition': 'AI-powered recruitment, ATS, and talent pipeline management for faster hiring.',
  'Skilled & Unskilled Manpower Supply': 'Trained workforce deployment across sites — skilled, semi-skilled and unskilled.',
  'Safety (EHS) Consultancy': 'EHS auditing, safety training and regulatory compliance for zero-incident workplaces.',
  'Engineering & Project Support': 'Multi-discipline engineering professionals — MEP, civil, structural and more.',
  'Construction Labour Supply': 'Trained construction workforce for residential, commercial and industrial projects.',
  'Land Survey & Engineering Services': 'Total station survey, topography, contour mapping and engineering drawings.',
  'Vendor Coordination': 'Vendor management, procurement support and multi-vendor coordination services.',
  'Payroll Management': 'Statutory payroll with PF, ESI, TDS, gratuity and compliance filings.',
  'Website Design & Development': 'Professional web design, development and digital transformation services.',
  'Safety Training & Compliance Support': 'OSHA-aligned safety programs, certifications and ongoing compliance support.',
}

/* ═══════════════════════════════════════════════════════
   DATA: Portals
   ═══════════════════════════════════════════════════════ */
const PORTALS = [
  {
    title: 'Admin Portal',
    icon: LayoutDashboard,
    desc: 'Full operational control for HR managers, finance teams and administrators.',
    items: [
      'Employee lifecycle management',
      'Payroll processing & statutory compliance',
      'Recruitment pipeline & onboarding',
      'Real-time reports & analytics dashboard',
      'Multi-branch & multi-company admin',
      'Document generation & management',
    ],
  },
  {
    title: 'Employee Portal',
    icon: UserCheck,
    desc: 'Self-service access for every team member — anytime, anywhere.',
    items: [
      'View payslips & tax documents',
      'Apply for leave & track attendance',
      'Update personal information',
      'Download letters & certificates',
      'Raise help desk tickets',
      'Access company announcements',
    ],
  },
  {
    title: 'Client Portal',
    icon: Users,
    desc: 'Workforce visibility for client organisations — without exposing your costs.',
    items: [
      'View deployed workforce at sites',
      'Daily attendance & timesheets',
      'Invoice & payment tracking',
      'Site-wise performance metrics',
      'Leave and shift status overview',
      'Approval workflows for timesheets',
    ],
  },
  {
    title: 'HPAI Chat',
    icon: Bot,
    desc: 'Your AI-powered workforce assistant — available 24/7, scoped to your data.',
    items: [
      'Ask questions in plain language',
      'Get answers from real company data',
      'Generate documents instantly',
      'Workforce planning & gap analysis',
      'Compliance status & alerts',
      'Executive daily briefings',
    ],
  },
]

/* ═══════════════════════════════════════════════════════
   DATA: Muster Roll (signature table)
   ═══════════════════════════════════════════════════════ */
interface MusterRow { num: string; name: string; code: string; role: string; marks: ('P'|'A'|'H')[]; mandays: number }
const MUSTER_DATA: MusterRow[] = [
  { num: '01', name: 'Manjunath B', code: 'HPE-0412', role: 'Safety Steward', marks: ['P','P','P','P','P'], mandays: 5.0 },
  { num: '02', name: 'Shivakumar R', code: 'HPE-0418', role: 'Helper — Gr II', marks: ['P','A','A','A','P'], mandays: 2.0 },
  { num: '03', name: 'Lakshmi Devi', code: 'HPE-0431', role: 'Housekeeping', marks: ['P','P','H','P','P'], mandays: 4.5 },
  { num: '04', name: 'Anand Kumar', code: 'HPE-0455', role: 'Electrician', marks: ['P','P','P','P','A'], mandays: 4.0 },
  { num: '05', name: 'Ravi Shankar', code: 'HPE-0467', role: 'Security — Night', marks: ['P','P','P','P','P'], mandays: 5.0 },
]

/* ═══════════════════════════════════════════════════════
   DATA: Three Things We Do
   ═══════════════════════════════════════════════════════ */
const THREE_MODES = [
  { tag: 'Mode 1', label: 'HRMS SAAS', title: 'You employ them', desc: 'Your permanent staff, your payroll, your data. HPHRMS is the software you run it on.',
    items: ['Full employee lifecycle', 'Payroll with PF, ESI and TDS', 'Attendance, leave, performance', 'Recruitment and onboarding', 'You own every record'] },
  { tag: 'Mode 2', label: 'MANPOWER SUPPLY', title: 'HP Enterprise employs them', desc: 'We supply the workforce and carry the statutory liability. You see the work, not our cost sheet.',
    items: ['Who is deployed, at which site', 'Site-wise daily attendance', 'Timesheets you approve', 'Invoices and payment status', 'No access to worker salaries'] },
  { tag: 'Mode 3', label: 'HYBRID', title: 'Both, kept separate', desc: '80 of your own people and 20 of ours, in one portal, with two sets of permissions.',
    items: ['Internal staff on full HRMS', 'Contract workers on deployment view', 'Payroll runs only on your staff', 'Invoices raised only on ours', 'No accidental crossover'] },
]

/* ═══════════════════════════════════════════════════════
   DATA: AI Features
   ═══════════════════════════════════════════════════════ */
interface AiFeature { title: string; desc: string; query: string; icon: LucideIcon }
const AI_FEATURES: AiFeature[] = [
  { title: 'HR Chat Assistant', desc: 'Ask anything about your workforce and get an answer grounded in your live records.', query: '"Who\'s on leave next week at Site 04?"', icon: Bot },
  { title: 'Attendance Assistant', desc: 'Spots absence patterns against each worker\'s own baseline, not a blanket threshold.', query: '"Which sites ran short-staffed last month?"', icon: ClipboardList },
  { title: 'Payroll Assistant', desc: 'Explains what moved and why — department cost, PF and ESI totals, month on month.', query: '"Why did payroll rise 8% in July?"', icon: BarChart3 },
  { title: 'Recruitment Assistant', desc: 'Drafts job descriptions and interview structures grounded in your current headcount.', query: '"Draft a JD for a site safety officer"', icon: Users },
  { title: 'Document Assistant', desc: 'Offer letters, deployment letters, experience certificates — filled from real records.', query: '"Experience certificate for HPE-0412"', icon: FileText },
  { title: 'Report Generator', desc: 'Describe the report you want. Get a table you can export, not a paragraph.', query: '"Site-wise mandays, last quarter"', icon: FileSearch },
  { title: 'Workforce Planning', desc: 'Flags where you\'ll be short before the shift starts, based on deployment and leave.', query: '"Where am I short next week?"', icon: Brain },
  { title: 'Compliance Alerts', desc: 'Contracts, safety training, police verification and medical fitness, before they lapse.', query: '"What expires in the next 30 days?"', icon: ShieldCheck },
  { title: 'Executive Dashboard', desc: 'A daily brief on what changed and what needs a decision. Under 200 words.', query: '"What needs my attention today?"', icon: Zap },
  { title: 'Notification Center', desc: 'Every alert the system raises, ranked by severity, in one place across all sites.', query: 'Delivered in-app, email or WhatsApp', icon: Bell },
]

/* ═══════════════════════════════════════════════════════
   DATA: India Compliance
   ═══════════════════════════════════════════════════════ */
const INDIA_COMPLIANCE = [
  { label: 'PF', full: 'Provident Fund', desc: 'EPF auto-calculation, monthly ECR filing, KYC management' },
  { label: 'ESI', full: 'Employee State Insurance', desc: 'ESI contribution, IP registration, claim tracking' },
  { label: 'Gratuity', full: 'Payment of Gratuity Act', desc: 'Gratuity liability calculation, Form-I, annual returns' },
  { label: 'PT', full: 'Professional Tax', desc: 'State-wise slab calculation, monthly/annual filing' },
  { label: 'CLRA', full: 'Contract Labour Act', desc: 'License management, contractor compliance, RC filing' },
  { label: 'BOCW', full: 'Building & Other Construction Workers', desc: 'Registration, cess calculation, welfare fund' },
  { label: 'Factories', full: 'Factories Act 1948', desc: 'License renewal, returns, safety compliance records' },
  { label: 'Maternity', full: 'Maternity Benefit Act', desc: 'Leave tracking, advance payment, crèche compliance' },
]

/* ═══════════════════════════════════════════════════════
   DATA: Module Register
   ═══════════════════════════════════════════════════════ */
interface ModRow { num: string; name: string; layer: 'AI' | 'Core' | 'Manpower' | 'Platform' }
const MODULES: ModRow[] = [
  { num: '01', name: 'AI Dashboard', layer: 'AI' },
  { num: '02', name: 'AI Chat Assistant', layer: 'AI' },
  { num: '03', name: 'Core HR', layer: 'Core' },
  { num: '04', name: 'Employee Management', layer: 'Core' },
  { num: '05', name: 'Attendance & GPS', layer: 'Core' },
  { num: '06', name: 'Shift & Rosters', layer: 'Core' },
  { num: '07', name: 'Leave Management', layer: 'Core' },
  { num: '08', name: 'Payroll', layer: 'Core' },
  { num: '09', name: 'Recruitment', layer: 'Core' },
  { num: '10', name: 'Onboarding', layer: 'Core' },
  { num: '11', name: 'Performance Management', layer: 'Core' },
  { num: '12', name: 'Learning & Training', layer: 'Core' },
  { num: '13', name: 'Asset Management', layer: 'Core' },
  { num: '14', name: 'Help Desk', layer: 'Core' },
  { num: '15', name: 'Client Portal', layer: 'Manpower' },
  { num: '16', name: 'Manpower Management', layer: 'Manpower' },
  { num: '17', name: 'Project & Site Management', layer: 'Manpower' },
  { num: '18', name: 'Document Management', layer: 'Core' },
  { num: '19', name: 'Compliance', layer: 'Core' },
  { num: '20', name: 'Analytics & BI', layer: 'AI' },
  { num: '21', name: 'Mobile App', layer: 'Platform' },
  { num: '22', name: 'API & Integrations', layer: 'Platform' },
  { num: '23', name: 'Multi-Company & Multi-Branch', layer: 'Platform' },
]

/* ═══════════════════════════════════════════════════════
   DATA: Data Access Separation
   ═══════════════════════════════════════════════════════ */
const HP_SEES = ['Worker salary and CTC', 'Bank, Aadhaar and PAN details', 'PF, ESI and statutory filings', 'Daily rate versus internal cost', 'Margin per site, per worker', 'Every client account']
const CLIENT_SEES = [
  { text: 'Who is deployed at their sites', visible: true },
  { text: 'Daily attendance and timesheets', visible: true },
  { text: 'Leave and shift status', visible: true },
  { text: 'Invoices and payment history', visible: true },
  { text: 'Worker salaries', visible: false },
  { text: 'Your cost or margin', visible: false },
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
   SECTION EYEBROW — mono uppercase label
   ═══════════════════════════════════════════════════════ */
function Eyebrow({ children, className = '', style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <p className={cn('text-[11px] sm:text-[11.5px] font-semibold tracking-[0.16em] uppercase', className)} style={{ ...fontMono, color: C.inkSoft, ...style }}>
      {children}
    </p>
  )
}

/* ═══════════════════════════════════════════════════════
   SECTION HEADING — display font
   ═══════════════════════════════════════════════════════ */
function SectionHeading({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <h2 className={cn('text-[clamp(1.75rem,4vw,2.75rem)] font-extrabold leading-[1.05] tracking-[-0.03em] max-w-[20ch]', className)} style={fontDisplay}>
      {children}
    </h2>
  )
}

/* ═══════════════════════════════════════════════════════
   MUSTER ROLL TABLE (signature element)
   ═══════════════════════════════════════════════════════ */
function MusterRoll() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })
  const markStyle = (m: string) => {
    if (m === 'P') return { background: 'rgba(46,125,91,.13)', color: C.verify, borderColor: 'rgba(46,125,91,.3)' }
    if (m === 'A') return { background: 'rgba(200,60,60,.1)', color: '#B03636', borderColor: 'rgba(176,54,54,.28)' }
    return { background: 'rgba(232,163,61,.16)', color: '#996213', borderColor: 'rgba(232,163,61,.38)' }
  }
  return (
    <motion.div ref={ref}
      initial={{ opacity: 0, y: 24 }} animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      transition={{ duration: 0.6, delay: 0.2, ease: EASE as unknown as number[] }}
      className="mt-12 sm:mt-14 bg-[var(--paper,#FFF)] border rounded-lg overflow-hidden"
      style={{ borderColor: C.rule, boxShadow: '0 1px 0 var(--rule-soft), 0 14px 40px -22px rgba(10,15,30,.32)' }}>
      {/* Header */}
      <div className="flex justify-between items-center px-4 sm:px-[18px] py-3 sm:py-[13px] border-b-2" style={{ borderBottomColor: C.ink, background: C.ledgerW }}>
        <span className="text-[10px] sm:text-[11.5px] font-semibold tracking-[0.1em] uppercase" style={{ ...fontMono }}>Muster Roll · Site 04 · Peenya</span>
        <span className="text-[10px] sm:text-[11px] hidden sm:block" style={{ ...fontMono, color: C.inkSoft }}>Week 32 · Mon–Fri</span>
      </div>
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[500px]" style={{ ...fontBody, fontSize: '13.5px', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ ...fontMono, fontSize: '10.5px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.inkSoft }}>
              <th className="text-center w-10 p-2.5 sm:p-[10px] sm:px-3.5 border-b" style={{ borderColor: C.rule, background: C.ledgerW }}>#</th>
              <th className="text-left p-2.5 sm:p-[10px] sm:px-3.5 border-b" style={{ borderColor: C.rule, background: C.ledgerW }}>Worker</th>
              <th className="text-left p-2.5 sm:p-[10px] sm:px-3.5 border-b hidden sm:table-cell" style={{ borderColor: C.rule, background: C.ledgerW }}>Posting</th>
              <th className="text-left p-2.5 sm:p-[10px] sm:px-3.5 border-b" style={{ borderColor: C.rule, background: C.ledgerW }}>M T W T F</th>
              <th className="text-left p-2.5 sm:p-[10px] sm:px-3.5 border-b" style={{ borderColor: C.rule, background: C.ledgerW }}>Mandays</th>
            </tr>
          </thead>
          <tbody>
            {MUSTER_DATA.map((row, i) => (
              <motion.tr key={row.num}
                initial={{ opacity: 0, y: 7 }} animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 7 }}
                transition={{ duration: 0.42, delay: 0.4 + i * 0.15, ease: [0.2, 0.7, 0.3, 1] as unknown as number[] }}
                className="hover:bg-[var(--ledger-warm,#F6F7F5)] transition-colors">
                <td className="text-center p-2.5 sm:p-[11px] sm:px-3.5 border-b" style={{ ...fontMono, fontSize: '11px', color: C.inkSoft, borderColor: C.ruleSoft }}>{row.num}</td>
                <td className="p-2.5 sm:p-[11px] sm:px-3.5 border-b" style={{ borderColor: C.ruleSoft }}>
                  <span className="font-semibold block" style={{ color: C.ink }}>{row.name}</span>
                  <span className="block" style={{ ...fontMono, fontSize: '11px', color: C.inkSoft }}>{row.code}</span>
                </td>
                <td className="p-2.5 sm:p-[11px] sm:px-3.5 border-b hidden sm:table-cell" style={{ fontSize: '12.5px', color: C.inkSoft, borderColor: C.ruleSoft }}>{row.role}</td>
                <td className="p-2.5 sm:p-[11px] sm:px-3.5 border-b" style={{ borderColor: C.ruleSoft }}>
                  <span className="flex gap-1 sm:gap-[5px]">
                    {row.marks.map((m, j) => (
                      <span key={j} className="w-5 h-5 sm:w-[21px] sm:h-[21px] rounded-[3px] grid place-items-center text-[10px] sm:text-[10.5px] font-semibold border" style={{ ...fontMono, ...markStyle(m) }}>{m === 'H' ? '½' : m}</span>
                    ))}
                  </span>
                </td>
                <td className="p-2.5 sm:p-[11px] sm:px-3.5 border-b font-bold" style={{ borderColor: C.ruleSoft, color: C.ink }}>{row.mandays.toFixed(1)}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* AI Readout */}
      <motion.div
        initial={{ opacity: 0 }} animate={isInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.5, delay: 1.3, ease: 'easeOut' }}
        className="border-t-2 flex gap-3.5 items-start p-4 sm:px-[18px] sm:py-[17px]" style={{ borderColor: C.ink, background: C.ink }}>
        <span className="text-[10px] font-semibold tracking-[0.1em] whitespace-nowrap px-2 py-1 rounded-[3px] shrink-0" style={{ ...fontMono, background: C.amber, color: C.inkDeep }}>AI</span>
        <p className="text-[13px] sm:text-[14px] leading-[1.55]" style={{ color: 'rgba(255,255,255,.9)' }}>
          <b className="text-white font-semibold">Shivakumar R was absent 3 of 5 days</b> against his own 8-week average of 0.4.
          Site 04 ran below contracted strength on Tue–Thu. Two safety training certificates
          at this site expire before the 28th. <b className="text-white font-semibold">Billable mandays this week: 20.5 of 25.</b>
        </p>
      </motion.div>
    </motion.div>
  )
}

/* ═══════════════════════════════════════════════════════
   LOGIN DIALOG (inline, not a modal)
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
              <div className="rounded-lg border p-6 sm:p-8" style={{ background: C.paper, borderColor: C.rule }}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold" style={{ ...fontDisplay, color: C.ink }}>Sign In</h3>
                  <button onClick={onClose} className="p-1.5 rounded-md hover:bg-[var(--ledger,#EEF1F0)] transition-colors" aria-label="Close">
                    <X className="h-4 w-4" style={{ color: C.inkSoft }} />
                  </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold" style={{ ...fontMono, color: C.inkSoft }}>Username</Label>
                    <Input placeholder="Enter username" value={username} onChange={(e) => setUsername(e.target.value)} className="h-10 text-sm rounded-md" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold" style={{ ...fontMono, color: C.inkSoft }}>Password</Label>
                    <div className="relative">
                      <Input type={showPw ? 'text' : 'password'} placeholder="Enter password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-10 text-sm rounded-md pr-10" />
                      <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-10 rounded-md text-sm font-semibold text-white" style={{ background: C.ink }} disabled={loading}>
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
    <section data-landing="true" className="min-h-screen flex items-center justify-center px-4" style={{ background: C.ledger }}>
      <div className="max-w-md w-full text-center p-8 rounded-lg border" style={{ background: C.paper, borderColor: C.rule }}>
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full" style={{ background: `rgba(46,125,91,.12)` }}><Check className="h-7 w-7" style={{ color: C.verify }} /></div>
        <h2 className="text-2xl font-bold mb-2" style={{ ...fontDisplay, color: C.ink }}>Request Submitted!</h2>
        <p className="mb-6" style={{ ...fontBody, color: C.inkSoft }}>Our team will contact you within 24 hours.</p>
        <Button onClick={onBack} className="h-10 text-sm font-semibold rounded-md text-white" style={{ background: C.ink }}>Back to Home</Button>
      </div>
    </section>
  )

  return (
    <section data-landing="true" className="min-h-screen py-16 sm:py-20 px-4" style={{ background: C.ledger }}>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-medium hover:underline" style={{ ...fontMono, color: C.inkSoft }}>
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </button>
        </div>
        <div className="text-center mb-8">
          <Eyebrow className="mb-3">Get Started</Eyebrow>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-2" style={{ ...fontDisplay, color: C.ink }}>Request a Subscription</h1>
          <p style={{ ...fontBody, color: C.inkSoft, fontSize: '16px' }}>Fill in the details and our team will reach out to you.</p>
        </div>
        <div className="rounded-lg border p-6 sm:p-8" style={{ background: C.paper, borderColor: C.rule }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold" style={{ ...fontMono, color: C.inkSoft }}>Company Name *</Label>
                <Input placeholder="Your company" value={form.companyName} onChange={(e) => update('companyName', e.target.value)} className="h-10 text-sm rounded-md" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold" style={{ ...fontMono, color: C.inkSoft }}>Contact Name *</Label>
                <Input placeholder="Full name" value={form.contactName} onChange={(e) => update('contactName', e.target.value)} className="h-10 text-sm rounded-md" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold" style={{ ...fontMono, color: C.inkSoft }}>Email *</Label>
                <Input type="email" placeholder="email@company.com" value={form.email} onChange={(e) => update('email', e.target.value)} className="h-10 text-sm rounded-md" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold" style={{ ...fontMono, color: C.inkSoft }}>Phone *</Label>
                <Input placeholder="+91 XXXXX XXXXX" value={form.phone} onChange={(e) => update('phone', e.target.value)} className="h-10 text-sm rounded-md" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold" style={{ ...fontMono, color: C.inkSoft }}>Address</Label>
              <Input placeholder="Office address" value={form.address} onChange={(e) => update('address', e.target.value)} className="h-10 text-sm rounded-md" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold" style={{ ...fontMono, color: C.inkSoft }}>Plan</Label>
                <select value={form.plan} onChange={(e) => update('plan', e.target.value)} className="w-full h-10 rounded-md border bg-white px-3 text-sm" style={{ borderColor: C.rule, ...fontBody }}>
                  <option value="">Select plan</option><option value="free">Free</option><option value="starter">Starter</option><option value="professional">Professional</option><option value="enterprise">Enterprise</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold" style={{ ...fontMono, color: C.inkSoft }}>Employee Count</Label>
                <Input placeholder="e.g. 50" value={form.employeeCount} onChange={(e) => update('employeeCount', e.target.value)} className="h-10 text-sm rounded-md" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold" style={{ ...fontMono, color: C.inkSoft }}>Message</Label>
              <Textarea placeholder="Tell us about your requirements..." rows={3} value={form.message} onChange={(e) => update('message', e.target.value)} className="text-sm rounded-md" />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" className="flex-1 h-10 text-sm font-semibold rounded-md text-white" style={{ background: C.ink }} disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}Submit Request
              </Button>
              <Button type="button" variant="outline" onClick={onBack} className="h-10 font-semibold rounded-md">Back</Button>
            </div>
          </form>
        </div>
      </div>
    </section>
  )
}

/* ═══════════════════════════════════════════════════════
   LAYER TAG COLORS
   ═══════════════════════════════════════════════════════ */
function layerTagStyle(layer: string) {
  switch (layer) {
    case 'AI': return { background: 'rgba(232,163,61,.18)', color: '#8A5A11' }
    case 'Core': return { background: 'rgba(22,33,62,.08)', color: C.inkSoft }
    case 'Manpower': return { background: 'rgba(46,125,91,.13)', color: C.verify }
    default: return { background: 'rgba(74,86,115,.12)', color: C.inkSoft }
  }
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

  // Route to sub-views
  if (view === 'register') return <RegistrationForm onBack={goHome} />
  if (view === 'subscribe') return <SubscriptionForm onBack={goHome} />

  const NAV_LINKS = [
    { id: 'services', label: 'Services' },
    { id: 'features', label: 'Features' },
    { id: 'modes', label: 'How it works' },
    { id: 'portals', label: 'Portals' },
    { id: 'ai', label: 'AI' },
    { id: 'modules', label: 'Modules' },
    { id: 'compliance', label: 'Compliance' },
    { id: 'separation', label: 'Data access' },
    { id: 'cta', label: 'Apply' },
  ]

  return (
    <div ref={homeRef} data-landing="true" role="region" aria-label="Landing page" className="min-h-screen flex flex-col" style={{ ...fontBody, background: C.ledger, color: C.ink }}>
      {/* Scoped styles for ruled background and font overrides */}
      <style>{`
        .ledger-ruled {
          background-image: repeating-linear-gradient(
            to bottom,
            transparent 0, transparent 43px,
            ${C.ruleSoft} 43px, ${C.ruleSoft} 44px
          );
        }
        .ledger-ruled-dark {
          background-image: repeating-linear-gradient(
            to bottom,
            transparent 0, transparent 43px,
            rgba(255,255,255,.06) 43px, rgba(255,255,255,.06) 44px
          );
        }
      `}</style>

      {/* ─── NAV ─── */}
      <nav className="sticky top-0 z-50 transition-all duration-300" style={{
        background: scrolled ? 'rgba(238,241,240,.92)' : 'rgba(238,241,240,.88)',
        backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${C.rule}`
      }}>
        <div className="max-w-[1160px] mx-auto px-5 sm:px-6 flex items-center justify-between h-[58px] sm:h-[62px]">
          {/* Brand */}
          <button onClick={goHome} className="flex items-center gap-2.5 shrink-0" aria-label="HPHRMS Home">
            <BrandLogo size="sm" showText={false} />
            <div className="leading-none">
              <span className="text-[17px] sm:text-[19px] font-extrabold tracking-[-0.02em] block" style={fontDisplay}>HPHRMS</span>
            </div>
          </button>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-6" style={{ fontSize: '14px', fontWeight: 500 }}>
            {NAV_LINKS.map((link) => (
              link.id === 'cta'
                ? <a key={link.id} href={SOCIAL.recruitment} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-[var(--ink,#16213E)]" style={{ color: C.amber, fontWeight: 600 }}>{link.label}</a>
                : <button key={link.id} onClick={() => scrollTo(link.id)} className="transition-colors hover:text-[var(--ink,#16213E)]" style={{ color: C.inkSoft }}>{link.label}</button>
            ))}
            <button onClick={() => setLoginOpen(true)} className="px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200 hover:-translate-y-[1px] hover:shadow-[0_6px_18px_rgba(22,33,62,.24)]" style={{ background: C.ink, color: '#fff' }}>
              Login
            </button>
            <button onClick={() => setView('register')} className="px-4 py-2 rounded-md text-sm font-semibold border-[1.5px] transition-all duration-200 hover:bg-[var(--ink,#16213E)] hover:text-white" style={{ borderColor: C.ink, color: C.ink }}>
              Register
            </button>
          </div>

          {/* Mobile Menu Toggle */}
          <button className="lg:hidden p-2 rounded-md" onClick={() => setMobileMenu(!mobileMenu)} style={{ color: C.ink }} aria-label={mobileMenu ? 'Close menu' : 'Open menu'}>
            {mobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenu && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="lg:hidden overflow-hidden border-t" style={{ background: 'rgba(238,241,240,.97)', borderColor: C.rule }}>
              <div className="px-5 py-4 space-y-1">
                {NAV_LINKS.map((link) => (
                  link.id === 'cta'
                    ? <a key={link.id} href={SOCIAL.recruitment} target="_blank" rel="noopener noreferrer" className="block w-full text-left px-4 py-3 rounded-md text-sm font-medium transition-colors" style={{ color: C.amber, fontWeight: 600 }}>{link.label}</a>
                    : <button key={link.id} onClick={() => scrollTo(link.id)} className="block w-full text-left px-4 py-3 rounded-md text-sm font-medium capitalize transition-colors" style={{ color: C.inkSoft }}>{link.label}</button>
                ))}
                <div className="flex gap-2 pt-3">
                  <button onClick={() => { setMobileMenu(false); setLoginOpen(true) }} className="flex-1 py-2.5 rounded-md text-sm font-semibold text-white text-center" style={{ background: C.ink }}>Login</button>
                  <button onClick={() => { setMobileMenu(false); setView('register') }} className="flex-1 py-2.5 rounded-md text-sm font-semibold text-center border-[1.5px]" style={{ borderColor: C.ink, color: C.ink }}>Register</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <LoginDialog open={loginOpen} onClose={() => setLoginOpen(false)} />

      {/* ─── HERO ─── */}
      <header className="ledger-ruled py-16 sm:py-20 lg:py-[76px] border-b" style={{ borderColor: C.rule }}>
        <div className="max-w-[1160px] mx-auto px-5 sm:px-6">
          <Reveal>
            <div className="flex items-center gap-2.5 mb-5 sm:mb-[22px]" style={{ ...fontMono, fontSize: '11.5px', fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: C.inkSoft }}>
              <span>Workforce Operating System · Karnataka · PAN India</span>
              <span className="hidden sm:block flex-1 h-[1.5px] max-w-[180px]" style={{ background: C.rule }} />
            </div>
          </Reveal>
          <Reveal delay={0.05}>
            <h1 className="text-[clamp(2.4rem,6.4vw,4.5rem)] font-extrabold leading-[0.98] tracking-[-0.035em] max-w-[16ch]" style={fontDisplay}>
              Your muster roll already knows. Now it{' '}
              <span style={{ color: C.amber, WebkitTextStroke: '1.5px ' + C.ink, paintOrder: 'stroke fill' }}>tells you.</span>
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-5 sm:mt-6 max-w-[56ch] leading-[1.72]" style={{ fontSize: 'clamp(16.5px,2vw,19px)', color: C.inkSoft }}>
              HPHRMS Enterprise AI runs HRMS software, manpower outsourcing and client workforce management
              on one platform — with every company's data walled off from every other company's.
              Built for Indian statutory payroll, not adapted to it.
            </p>
          </Reveal>
          {/* Brand Tagline */}
          <Reveal delay={0.12}>
            <p className="mt-3 max-w-[60ch] leading-[1.5]" style={{ fontSize: 'clamp(15px,1.8vw,17px)', color: C.amber, fontWeight: 600, fontStyle: 'italic' }}>
              {BRAND.tagline}
            </p>
          </Reveal>
          <Reveal delay={0.14}>
            <p className="mt-1.5 max-w-[66ch] leading-[1.45]" style={{ fontSize: 'clamp(12.5px,1.4vw,14px)', color: C.inkSoft }}>
              {BRAND.taglineFull}
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="flex flex-wrap gap-3 sm:gap-3.5 mt-7 sm:mt-[34px]">
              <button onClick={() => setView('subscribe')} className="px-5 py-2.5 rounded-md text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-[1px] hover:shadow-[0_6px_18px_rgba(22,33,62,.24)]" style={{ background: C.ink }}>
                Book a Demo <ArrowRight className="inline ml-1.5 h-3.5 w-3.5" />
              </button>
              <button onClick={() => scrollTo('modes')} className="px-5 py-2.5 rounded-md text-sm font-semibold border-[1.5px] transition-all duration-200 hover:bg-[var(--ink,#16213E)] hover:text-white" style={{ borderColor: C.ink, color: C.ink }}>
                See the three modes
              </button>
            </div>
          </Reveal>

          {/* Muster Roll Signature Table */}
          <MusterRoll />
        </div>
      </header>

      {/* ─── SERVICES SHOWCASE ─── */}
      <section id="services" className="py-16 sm:py-20 lg:py-[84px] border-b" style={{ borderColor: C.rule, background: C.paper }}>
        <div className="max-w-[1160px] mx-auto px-5 sm:px-6">
          <Reveal>
            <Eyebrow className="mb-3.5">What we deliver</Eyebrow>
          </Reveal>
          <Reveal delay={0.05}>
            <SectionHeading>End-to-end workforce and project services</SectionHeading>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-4 max-w-[60ch]" style={{ fontSize: '16.5px', color: C.inkSoft }}>
              From HR management and payroll to EHS consultancy and engineering — every service you need
              to run compliant, efficient operations across India.
            </p>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-10 sm:mt-11">
            {SERVICES.map((service, i) => {
              const imgSrc = SERVICE_IMAGES[service]
              return (
                <Reveal key={service} delay={0.12 + i * 0.04}>
                  <motion.div className="relative rounded-lg border overflow-hidden transition-all duration-200 hover:-translate-y-[3px] cursor-default flex flex-col"
                    style={{ borderColor: C.rule, background: C.paper }}
                    whileHover={{ boxShadow: '0 16px 38px -24px rgba(10,15,30,.4)' }}>
                    {imgSrc && (
                      <div className="relative w-full h-40 overflow-hidden">
                        <img src={imgSrc} alt={service} className="w-full h-full object-cover transition-transform duration-500" loading="lazy" />
                        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(10,15,30,.52) 0%, transparent 60%)' }} />
                        <span className="absolute bottom-3 left-4 text-[10px] font-semibold tracking-[0.1em] uppercase px-2 py-1 rounded-[3px]" style={{ ...fontMono, background: C.amber, color: C.inkDeep }}>
                          {String(i + 1).padStart(2, '0')}
                        </span>
                      </div>
                    )}
                    <div className="p-5 flex-1 flex flex-col">
                      <h3 className="text-[15.5px] font-bold tracking-[-0.01em] mb-1.5" style={fontDisplay}>{service}</h3>
                      <p className="text-[13px] leading-[1.55] flex-1" style={{ color: C.inkSoft }}>{SERVICE_DESC[service] || 'Comprehensive service delivery by HP Enterprise.'}</p>
                      <div className="mt-3 flex items-center gap-1.5 text-[12px] font-semibold" style={{ color: C.verify }}>
                        <span style={{ ...fontMono }}>✓</span>
                        <span style={{ ...fontMono }}>Available</span>
                      </div>
                    </div>
                  </motion.div>
                </Reveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── HPHRMS FEATURES ─── */}
      <section id="features" className="py-16 sm:py-20 lg:py-[84px] border-b" style={{ borderColor: C.rule, background: C.ledgerW }}>
        <div className="max-w-[1160px] mx-auto px-5 sm:px-6">
          <Reveal>
            <Eyebrow className="mb-3.5">Platform capabilities</Eyebrow>
          </Reveal>
          <Reveal delay={0.05}>
            <SectionHeading>Twelve core features, one unified platform</SectionHeading>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-4 max-w-[60ch]" style={{ fontSize: '16.5px', color: C.inkSoft }}>
              HPHRMS packs enterprise-grade capabilities into a single, multi-tenant platform
              — designed for Indian workforce management from the ground up.
            </p>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-10 sm:mt-11">
            {HPHRMS_FEATURES.map((feature, i) => (
              <Reveal key={feature} delay={0.12 + i * 0.03}>
                <div className="flex items-center gap-3 px-5 py-3.5 rounded-lg border transition-all duration-200 hover:-translate-y-[1px] hover:shadow-[0_8px_24px_-16px_rgba(10,15,30,.18)]" style={{ background: C.paper, borderColor: C.rule }}>
                  <span className="text-[13px] font-bold shrink-0" style={{ ...fontMono, color: C.verify }}>✓</span>
                  <span className="text-[14px] font-medium" style={{ color: C.ink }}>{feature}</span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── THREE THINGS WE DO ─── */}
      <section id="modes" className="py-16 sm:py-20 lg:py-[84px] border-b" style={{ borderColor: C.rule }}>
        <div className="max-w-[1160px] mx-auto px-5 sm:px-6">
          <Reveal>
            <Eyebrow className="mb-3.5">One platform, three businesses</Eyebrow>
          </Reveal>
          <Reveal delay={0.05}>
            <SectionHeading>Software, manpower, or both — the same login</SectionHeading>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-4 max-w-[60ch]" style={{ fontSize: '16.5px', color: C.inkSoft }}>
              Most HR systems assume you employ everyone you manage. In India, that assumption breaks the
              moment you take on contract labour. HPHRMS handles both relationships without pretending they're the same thing.
            </p>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mt-10 sm:mt-11">
            {THREE_MODES.map((mode, i) => (
              <Reveal key={mode.tag} delay={0.15 + i * 0.06}>
                <motion.div className="relative p-6 sm:p-[26px_24px] rounded-lg border transition-all duration-200 hover:-translate-y-[3px] cursor-default"
                  style={{ background: C.paper, borderColor: C.rule }}
                  whileHover={{ boxShadow: '0 16px 38px -24px rgba(10,15,30,.4)' }}>
                  <span className="absolute top-6 right-6 text-[10px] font-semibold tracking-[0.08em] uppercase px-2 py-1 rounded-[3px]" style={{ ...fontMono, background: C.ledger, color: C.inkSoft }}>{mode.tag}</span>
                  <p className="text-[11px] font-semibold tracking-[0.1em] uppercase mb-3.5" style={{ ...fontMono, color: C.inkSoft }}>{mode.label}</p>
                  <h3 className="text-xl font-extrabold tracking-[-0.02em] mb-2" style={fontDisplay}>{mode.title}</h3>
                  <p className="text-[14.5px] mb-4" style={{ color: C.inkSoft }}>{mode.desc}</p>
                  <ul className="list-none text-[13.5px]">
                    {mode.items.map((item) => (
                      <li key={item} className="py-1.5 border-t flex gap-2.5 items-baseline" style={{ borderColor: C.ruleSoft }}>
                        <span className="w-[5px] h-[5px] rounded-full shrink-0 mt-[7px]" style={{ background: C.amber }} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PORTALS SHOWCASE ─── */}
      <section id="portals" className="py-16 sm:py-20 lg:py-[84px] border-b" style={{ borderColor: C.rule, background: C.ledgerW }}>
        <div className="max-w-[1160px] mx-auto px-5 sm:px-6">
          <Reveal>
            <Eyebrow className="mb-3.5">Role-based access</Eyebrow>
          </Reveal>
          <Reveal delay={0.05}>
            <SectionHeading>Four portals. One platform. Zero overlap.</SectionHeading>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-4 max-w-[60ch]" style={{ fontSize: '16.5px', color: C.inkSoft }}>
              Every user sees only what their role permits. Admins manage, employees self-serve,
              clients monitor — and HPAI Chat assists all of them with context-aware intelligence.
            </p>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-10 sm:mt-11">
            {PORTALS.map((portal, i) => {
              const Icon = portal.icon
              return (
                <Reveal key={portal.title} delay={0.12 + i * 0.06}>
                  <motion.div className="relative p-6 sm:p-[26px_24px] rounded-lg border transition-all duration-200 hover:-translate-y-[3px] cursor-default"
                    style={{ background: C.paper, borderColor: C.rule }}
                    whileHover={{ boxShadow: '0 16px 38px -24px rgba(10,15,30,.4)' }}>
                    <div className="flex items-start gap-4 mb-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ background: 'rgba(22,33,62,.08)' }}>
                        <Icon className="h-5 w-5" style={{ color: C.ink }} />
                      </div>
                      <div>
                        <h3 className="text-lg font-extrabold tracking-[-0.02em]" style={fontDisplay}>{portal.title}</h3>
                        <p className="text-[13.5px] mt-0.5" style={{ color: C.inkSoft }}>{portal.desc}</p>
                      </div>
                    </div>
                    <ul className="list-none text-[13.5px]">
                      {portal.items.map((item) => (
                        <li key={item} className="py-1.5 border-t flex gap-2.5 items-baseline" style={{ borderColor: C.ruleSoft }}>
                          <span className="w-[5px] h-[5px] rounded-full shrink-0 mt-[7px]" style={{ background: C.amber }} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                </Reveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── AI FEATURES ─── */}
      <section id="ai" className="ledger-ruled-dark py-16 sm:py-20 lg:py-[84px]" style={{ background: C.ink, color: '#fff', borderBottom: 'none' }}>
        <div className="max-w-[1160px] mx-auto px-5 sm:px-6">
          <Reveal>
            <Eyebrow className="mb-3.5" style={{ color: C.amber }}>AI that reads your records — not the internet</Eyebrow>
          </Reveal>
          <Reveal delay={0.05}>
            <SectionHeading className="text-white">Ask in plain language. Get answers from your own data.</SectionHeading>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-4 max-w-[60ch]" style={{ fontSize: '16.5px', color: 'rgba(255,255,255,.72)' }}>
              Every assistant is scoped to one company's records and one user's permissions. It reads;
              it does not write. And it will tell you when it doesn't have the number rather than inventing one.
            </p>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-px mt-10 sm:mt-11 border overflow-hidden rounded-lg" style={{ background: 'rgba(255,255,255,.13)', borderColor: 'rgba(255,255,255,.13)' }}>
            {AI_FEATURES.map((feat, i) => {
              const Icon = feat.icon
              return (
                <Reveal key={feat.title} delay={0.15 + i * 0.03}>
                  <motion.div className="p-5 sm:p-6 transition-colors duration-200" style={{ background: C.ink }} whileHover={{ background: '#1D2B4F' }}>
                    <Icon className="h-5 w-5 mb-2" style={{ color: C.amber }} />
                    <h4 className="text-[15px] sm:text-[16.5px] font-semibold tracking-[-0.01em] mb-1.5" style={fontDisplay}>{feat.title}</h4>
                    <p className="text-[13.5px] leading-[1.5]" style={{ color: 'rgba(255,255,255,.65)' }}>{feat.desc}</p>
                    <span className="mt-2.5 block text-[11.5px] leading-[1.45]" style={{ ...fontMono, color: C.amber }}>{feat.query}</span>
                  </motion.div>
                </Reveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* ─── MODULE REGISTER ─── */}
      <section id="modules" className="py-16 sm:py-20 lg:py-[84px] border-b" style={{ borderColor: C.rule }}>
        <div className="max-w-[1160px] mx-auto px-5 sm:px-6">
          <Reveal>
            <Eyebrow className="mb-3.5">The full register</Eyebrow>
          </Reveal>
          <Reveal delay={0.05}>
            <SectionHeading>Twenty-three modules, switched on by account type</SectionHeading>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-4 max-w-[60ch]" style={{ fontSize: '16.5px', color: C.inkSoft }}>
              A manpower client never sees a payroll screen. An HRMS client never sees an invoice.
              The platform shows each company only what its contract entitles it to.
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="mt-10 sm:mt-11 border rounded-lg overflow-hidden" style={{ borderColor: C.rule }}>
              {/* Header Row */}
              <div className="hidden sm:grid grid-cols-[44px_1fr_128px] px-4 py-2.5 border-b-2" style={{ ...fontMono, fontSize: '10.5px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.inkSoft, borderColor: C.ink, background: C.ledgerW }}>
                <span>#</span><span>Module</span><span>Layer</span>
              </div>
              <div className="sm:hidden grid grid-cols-[34px_1fr] px-4 py-2.5 border-b-2" style={{ ...fontMono, fontSize: '10.5px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.inkSoft, borderColor: C.ink, background: C.ledgerW }}>
                <span>#</span><span>Module</span>
              </div>
              {/* Module Rows */}
              {MODULES.map((mod) => (
                <div key={mod.num} className="hidden sm:grid grid-cols-[44px_1fr_128px] px-4 py-3 border-b last:border-b-0 items-center transition-colors hover:bg-[var(--ledger-warm,#F6F7F5)]" style={{ borderColor: C.ruleSoft }}>
                  <span className="text-[11px]" style={{ ...fontMono, color: C.inkSoft }}>{mod.num}</span>
                  <span className="text-[14.5px] font-medium" style={{ color: C.ink }}>{mod.name}</span>
                  <span className="text-[10px] font-semibold tracking-[0.06em] uppercase px-2 py-[3px] rounded-[3px] justify-self-start" style={{ ...fontMono, ...layerTagStyle(mod.layer) }}>{mod.layer}</span>
                </div>
              ))}
              {/* Mobile: simpler rows */}
              {MODULES.map((mod) => (
                <div key={`m-${mod.num}`} className="sm:hidden grid grid-cols-[34px_1fr] px-4 py-3 border-b last:border-b-0 items-center" style={{ borderColor: C.ruleSoft }}>
                  <span className="text-[11px]" style={{ ...fontMono, color: C.inkSoft }}>{mod.num}</span>
                  <span className="text-[14px] font-medium" style={{ color: C.ink }}>{mod.name}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── INDIA COMPLIANCE ─── */}
      <section id="compliance" className="py-16 sm:py-20 lg:py-[84px] border-b" style={{ borderColor: C.rule, background: C.ledgerW }}>
        <div className="max-w-[1160px] mx-auto px-5 sm:px-6">
          <Reveal>
            <Eyebrow className="mb-3.5">India statutory compliance</Eyebrow>
          </Reveal>
          <Reveal delay={0.05}>
            <SectionHeading>Built for Indian payroll. Not adapted to it.</SectionHeading>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-4 max-w-[60ch]" style={{ fontSize: '16.5px', color: C.inkSoft }}>
              PF, ESI, Gratuity, Professional Tax — the platform was designed in Karnataka for Indian statutory
              compliance from day one. No bolt-on modules, no afterthought.
            </p>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-10 sm:mt-11">
            {INDIA_COMPLIANCE.map((item, i) => (
              <Reveal key={item.label} delay={0.15 + i * 0.04}>
                <div className="p-5 rounded-lg border transition-all duration-200 hover:-translate-y-[2px] hover:shadow-[0_8px_24px_-16px_rgba(10,15,30,.2)]" style={{ background: C.paper, borderColor: C.rule }}>
                  <span className="text-[11px] font-semibold tracking-[0.1em] uppercase px-2 py-1 rounded-[3px] inline-block mb-3" style={{ ...fontMono, background: `rgba(46,125,91,.12)`, color: C.verify }}>{item.label}</span>
                  <h4 className="text-[15px] font-semibold mb-1.5" style={fontDisplay}>{item.full}</h4>
                  <p className="text-[13px] leading-[1.5]" style={{ color: C.inkSoft }}>{item.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── DATA ACCESS SEPARATION ─── */}
      <section id="separation" className="py-16 sm:py-20 lg:py-[84px] border-b" style={{ borderColor: C.rule }}>
        <div className="max-w-[1160px] mx-auto px-5 sm:px-6">
          <Reveal>
            <Eyebrow className="mb-3.5">Data access</Eyebrow>
          </Reveal>
          <Reveal delay={0.05}>
            <SectionHeading>Your client sees the work. Not your cost sheet.</SectionHeading>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-4 max-w-[60ch]" style={{ fontSize: '16.5px', color: C.inkSoft }}>
              In manpower supply, the margin is the business. HPHRMS enforces that boundary in the database
              itself — through row-level security, not through a hidden button.
            </p>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-10 sm:mt-11">
            <Reveal delay={0.15} direction="left">
              <div className="rounded-lg border overflow-hidden" style={{ borderColor: C.rule }}>
                <div className="px-5 py-3 border-b" style={{ ...fontMono, fontSize: '11px', fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase', background: C.ink, color: '#fff' }}>HP Enterprise sees</div>
                <ul className="list-none py-2" style={{ background: C.paper }}>
                  {HP_SEES.map((item) => (
                    <li key={item} className="px-5 py-2.5 text-[14px] flex items-center gap-2.5 border-b last:border-b-0" style={{ borderColor: C.ruleSoft }}>
                      <span className="text-[13px] font-semibold w-4 shrink-0" style={{ ...fontMono, color: C.verify }}>✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
            <Reveal delay={0.2} direction="right">
              <div className="rounded-lg border overflow-hidden" style={{ borderColor: C.rule }}>
                <div className="px-5 py-3 border-b" style={{ ...fontMono, fontSize: '11px', fontWeight: 600, letterSpacing: '0.09em', textTransform: 'uppercase', background: C.ledgerW, color: C.inkSoft }}>The client sees</div>
                <ul className="list-none py-2" style={{ background: C.paper }}>
                  {CLIENT_SEES.map((item) => (
                    <li key={item.text} className="px-5 py-2.5 text-[14px] flex items-center gap-2.5 border-b last:border-b-0" style={{ borderColor: C.ruleSoft }}>
                      {item.visible
                        ? <span className="text-[13px] font-semibold w-4 shrink-0" style={{ ...fontMono, color: C.verify }}>✓</span>
                        : <span className="text-[13px] font-semibold w-4 shrink-0" style={{ ...fontMono, color: '#B03636' }}>✕</span>
                      }
                      <span style={item.visible ? {} : { color: C.inkSoft }}>{item.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ─── TRUST / VERIFICATION ─── */}
      <section className="py-16 sm:py-20 lg:py-[84px] border-b" style={{ borderColor: C.rule, background: C.ledgerW }}>
        <div className="max-w-[1160px] mx-auto px-5 sm:px-6">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto">
              <Eyebrow className="mb-3.5 justify-center">Verification & Trust</Eyebrow>
              <SectionHeading className="mx-auto text-center">Registered. Verified. Accountable.</SectionHeading>
              <p className="mt-4" style={{ fontSize: '16.5px', color: C.inkSoft }}>
                Every claim verified with government registrations. No anonymous entity.
              </p>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-10 sm:mt-11">
            {TRUST_BADGES.map((badge, i) => (
              <Reveal key={badge} delay={0.1 + i * 0.03}>
                <div className="flex items-center gap-3 px-5 py-3.5 rounded-lg border" style={{ background: C.paper, borderColor: C.rule }}>
                  <ShieldCheck className="h-4 w-4 shrink-0" style={{ color: C.verify }} />
                  <span className="text-[14px] font-medium" style={{ color: C.ink }}>{badge}</span>
                </div>
              </Reveal>
            ))}
          </div>
          {/* Legal IDs */}
          <Reveal delay={0.3}>
            <div className="mt-8 flex flex-wrap justify-center gap-4 sm:gap-6">
              {[{ label: 'GSTIN', value: BRAND.gstin }, { label: 'UDYAM', value: BRAND.udyam }, { label: 'PAN', value: BRAND.pan }].map((item) => (
                <div key={item.label} className="flex items-center gap-2 px-4 py-2 rounded-md border" style={{ borderColor: C.rule, background: C.paper }}>
                  <span className="text-[10px] font-semibold tracking-[0.1em] uppercase" style={{ ...fontMono, color: C.inkSoft }}>{item.label}</span>
                  <span className="text-[12px] font-medium" style={{ ...fontMono, color: C.ink }}>{item.value}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section id="cta" className="py-16 sm:py-20 lg:py-[84px] text-center" style={{ background: C.ledgerW, borderBottom: 'none' }}>
        <div className="max-w-[1160px] mx-auto px-5 sm:px-6">
          <Reveal>
            <Eyebrow className="mb-3.5 justify-center">Get started</Eyebrow>
          </Reveal>
          <Reveal delay={0.05}>
            <SectionHeading className="mx-auto text-center">See it running on your own site data</SectionHeading>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-4 mx-auto" style={{ fontSize: '16.5px', color: C.inkSoft, maxWidth: '56ch' }}>
              A 30-minute walkthrough on your numbers — one site, one week of attendance, one invoice.
              You'll know within the demo whether it fits how you already work.
            </p>
          </Reveal>
          <Reveal delay={0.15}>
            <div className="flex flex-wrap gap-3 sm:gap-3.5 justify-center mt-7 sm:mt-8">
              <button onClick={() => setView('subscribe')} className="px-5 py-2.5 rounded-md text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-[1px] hover:shadow-[0_6px_18px_rgba(22,33,62,.24)]" style={{ background: C.ink }}>
                Book a Demo <ArrowRight className="inline ml-1.5 h-3.5 w-3.5" />
              </button>
              <a href={SOCIAL.whatsapp} target="_blank" rel="noopener noreferrer" className="px-5 py-2.5 rounded-md text-sm font-semibold border-[1.5px] transition-all duration-200 hover:bg-[var(--ink,#16213E)] hover:text-white" style={{ borderColor: C.ink, color: C.ink }}>
                Message on WhatsApp
              </a>
              <a href={SOCIAL.recruitment} target="_blank" rel="noopener noreferrer" className="px-5 py-2.5 rounded-md text-sm font-semibold transition-all duration-200 hover:-translate-y-[1px] hover:shadow-[0_6px_18px_rgba(232,163,61,.3)]" style={{ background: C.amber, color: C.inkDeep }}>
                Apply Now <ExternalLink className="inline ml-1.5 h-3.5 w-3.5" />
              </a>
            </div>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="mt-5" style={{ ...fontMono, fontSize: '11.5px', color: C.inkSoft, letterSpacing: '0.03em' }}>
              Data hosted in India · Mumbai region · No card required to trial
            </p>
          </Reveal>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="mt-auto" style={{ background: C.inkDeep, color: 'rgba(255,255,255,.62)', padding: '52px 0 34px', fontSize: '13.5px' }}>
        <div className="max-w-[1160px] mx-auto px-5 sm:px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-9">
            {/* Brand Column */}
            <div>
              <p className="text-[19px] font-extrabold text-white mb-3" style={fontDisplay}>HPHRMS Enterprise AI</p>
              <p className="leading-[1.6] max-w-[38ch]">
                An AI-powered Workforce Operating System for HRMS software, manpower outsourcing and
                client workforce management — in one secure, multi-tenant platform.
              </p>
              <div className="mt-4 leading-[1.7]" style={{ ...fontMono, fontSize: '11.5px' }}>
                <p>HP Enterprise</p>
                <p>{BRAND.headOffice.full}</p>
              </div>
            </div>
            {/* Platform Links */}
            <div>
              <h5 className="text-[10.5px] font-semibold tracking-[0.13em] uppercase mb-3" style={{ ...fontMono, color: 'rgba(255,255,255,.42)' }}>Platform</h5>
              <div className="space-y-1">
                {NAV_LINKS.filter(l => l.id !== 'cta').map((link) => (
                  <button key={link.id} onClick={() => scrollTo(link.id)} className="block py-1 transition-colors hover:text-white">{link.label}</button>
                ))}
                <button onClick={() => setView('subscribe')} className="block py-1 transition-colors hover:text-white">Book a Demo</button>
              </div>
              <h5 className="text-[10.5px] font-semibold tracking-[0.13em] uppercase mt-6 mb-3" style={{ ...fontMono, color: 'rgba(255,255,255,.42)' }}>Careers</h5>
              <a href={SOCIAL.recruitment} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 py-1 transition-colors hover:text-white">
                <ExternalLink className="h-3.5 w-3.5 shrink-0" />Apply Now
              </a>
            </div>
            {/* Company / Contact */}
            <div>
              <h5 className="text-[10.5px] font-semibold tracking-[0.13em] uppercase mb-3" style={{ ...fontMono, color: 'rgba(255,255,255,.42)' }}>Company</h5>
              <div className="space-y-1">
                <a href={`tel:${BRAND.phone}`} className="flex items-center gap-2.5 py-1 transition-colors hover:text-white">
                  <Phone className="h-3.5 w-3.5 shrink-0" />{BRAND.phone}
                </a>
                <a href={`mailto:${BRAND.email}`} className="flex items-center gap-2.5 py-1 transition-colors hover:text-white">
                  <Mail className="h-3.5 w-3.5 shrink-0" />{BRAND.email}
                </a>
                <span className="flex items-center gap-2.5 py-1">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />{BRAND.headOffice.city}, {BRAND.headOffice.state}
                </span>
              </div>
              <h5 className="text-[10.5px] font-semibold tracking-[0.13em] uppercase mt-6 mb-3" style={{ ...fontMono, color: 'rgba(255,255,255,.42)' }}>HR Enquiries</h5>
              <a href={`tel:${BRAND.hrPhone}`} className="flex items-center gap-2.5 py-1 transition-colors hover:text-white">
                <Phone className="h-3.5 w-3.5 shrink-0" />{BRAND.hrPhone}
              </a>
            </div>
          </div>

          {/* Connect With Us — Social Media Links */}
          <div className="mt-9 pt-5 border-t" style={{ borderColor: 'rgba(255,255,255,.11)' }}>
            <h5 className="text-[10.5px] font-semibold tracking-[0.13em] uppercase mb-4" style={{ ...fontMono, color: 'rgba(255,255,255,.42)' }}>Connect With Us</h5>
            <SocialLinks variant="footer" />
          </div>

          {/* Bottom Bar */}
          <div className="mt-5 pt-5 border-t flex flex-col sm:flex-row items-center justify-between gap-3 flex-wrap" style={{ borderColor: 'rgba(255,255,255,.11)', ...fontMono, fontSize: '11px', color: 'rgba(255,255,255,.42)' }}>
            <span>© {new Date().getFullYear()} HP Enterprise · hphrms.com</span>
            <span>{BRAND.gstin} · {BRAND.udyam}</span>
          </div>
        </div>
      </footer>

      {/* Floating AI Chat */}
      <HpAiChat />
    </div>
  )
}
