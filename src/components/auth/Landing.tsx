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
  { v: '500+', l: 'Manpower Deployed' }, { v: '15+', l: 'Project Types' },
  { v: '16', l: 'HR Documents' }, { v: '99.9%', l: 'Uptime' },
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
  {
    key: 'admin' as const,
    title: 'Admin Console',
    subtitle: 'Owner / Super Admin / HR Manager',
    icon: ShieldCheck,
    color: 'var(--navy)',
    features: ['Full employee management', 'Payroll & leave approval', 'Client & project handling', 'Document generation (16+ types)', 'Reports with CSV export', 'Audit logs & settings'],
    sampleUser: 'owner / Owner@123',
  },
  {
    key: 'employee' as const,
    title: 'Employee Portal',
    subtitle: 'Self-Service for All Employees',
    icon: Users,
    color: 'var(--gold)',
    features: ['Punch in/out with GPS', 'Leave application & balance', 'Download salary slips & documents', 'Profile & bank details', 'Change password', 'Notifications & announcements'],
    sampleUser: 'arjun.sharma / Employee@123',
  },
  {
    key: 'client' as const,
    title: 'Client Portal',
    subtitle: 'Clients & Contractors',
    icon: Building2,
    color: '#0A4488',
    features: ['Project progress dashboard', 'Work order tracking', 'Invoice viewing & PDF download', 'Team deployment overview', 'Live notifications', 'Communication with admin'],
    sampleUser: 'infosys.client / Client@123',
  },
]

// ── Login Form Component ───────────────────────────────────────────────────

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
      const res = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Invalid credentials'); return }
      setUser(data.user)
      toast.success(`Welcome back, ${data.user.username}!`)