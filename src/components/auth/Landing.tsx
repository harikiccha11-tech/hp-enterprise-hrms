'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import { BRAND, SERVICES, HPHRMS_FEATURES, TRUST_BADGES, SOCIAL } from '@/lib/constants'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { RegistrationForm } from '@/components/auth/RegistrationForm'
import { ForgotPasswordDialog } from '@/components/auth/ForgotPasswordDialog'
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  Building2, ShieldCheck, Users, FileText, Clock, Wallet, ArrowRight, ArrowLeft, Lock, User as UserIcon,
  Sparkles, Sun, Moon, CreditCard, Crown, Check, Bot, Fingerprint,
  CalendarDays, FolderKanban, ClipboardList, ReceiptText, BarChart3, Megaphone, ScrollText,
  Settings, UserCog, Zap, Shield, Bell, Star, Headphones, TrendingUp, Send, Loader2,
  Phone, Mail, MapPin, ChevronRight, ExternalLink, Menu, X, Award, Globe2,
  HardHat, LandPlot, Truck, DollarSign, MonitorSmartphone, GraduationCap, Handshake,
  type LucideIcon, Play, ChevronDown,
} from 'lucide-react'

// ── Types ────────────────────────────────────────────────────────────────────

type LandingView = 'home' | 'login-admin' | 'login-employee' | 'login-client' | 'register' | 'subscribe'

// ── Inline Social SVGs ───────────────────────────────────────────────────────

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" /><circle cx="12" cy="12" r="5" /><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  )
}
function LinkedInIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
}
function FacebookIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
}
function XTwitterIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
}
function YouTubeIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
}
function ThreadsIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.8-.946-.612-1.59-1.494-1.862-2.557-.56-2.168.33-4.764 2.553-6.573 1.402-1.14 3.02-1.786 4.598-1.864 1.818-.09 3.37.445 4.502 1.388.137.114.27.234.398.36l.087.083c.055-1.15-.031-2.273-.393-3.266-.672-1.86-2.088-3.063-4.375-3.71l.573-2.023c2.832.746 4.788 2.353 5.69 4.696.605 1.544.76 3.28.558 5.28.02.04.04.08.058.12.68 1.56.818 3.546-.543 5.464-1.445 2.037-3.47 3.295-6.023 3.737a10.3 10.3 0 01-1.646.132zm-.044-11.496c-1.093.055-2.275.535-3.327 1.391-1.52 1.236-2.122 3.048-1.77 4.424.137.527.453.974.913 1.273.452.293 1.043.446 1.72.41 1.1-.06 1.886-.408 2.475-1.082.59-.68.957-1.72 1.096-3.108l-.037-.03c-.474-.508-1.22-.927-2.07-.278z" /></svg>
}
function RedditIcon({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" /></svg>
}

// ── Service Icons Mapping ───────────────────────────────────────────────────

const SERVICE_ICONS: LucideIcon[] = [
  Users, UserCog, HardHat, ShieldCheck, Settings, Truck,
  LandPlot, Handshake, Wallet, MonitorSmartphone, GraduationCap,
]

// ── Feature icons for HPHRMS ────────────────────────────────────────────────

const FEATURE_ICONS: LucideIcon[] = [
  Bot, Users, Megaphone, Clock, CalendarDays, Wallet,
  UserCog, CalendarDays, FolderKanban, ReceiptText, BarChart3, Building2, Shield,
]

// ── Portal Configs ───────────────────────────────────────────────────────────

interface PortalConfig {
  id: LandingView
  title: string
  description: string
  icon: LucideIcon
  features: string[]
}

const PORTALS: PortalConfig[] = [
  {
    id: 'login-admin',
    title: 'Admin Console',
    description: 'Complete HR & workforce management dashboard',
    icon: Shield,
    features: ['Employee Management', 'Payroll & Attendance', 'Recruitment & ATS', 'Reports & Analytics', 'Document Management'],
  },
  {
    id: 'login-employee',
    title: 'Employee Portal',
    description: 'Self-service portal for all employees',
    icon: UserIcon,
    features: ['View Payslips', 'Apply Leaves', 'Attendance History', 'Document Downloads', 'Profile Management'],
  },
  {
    id: 'login-client',
    title: 'Client Portal',
    description: 'Dedicated access for business clients',
    icon: Building2,
    features: ['Workforce Dashboard', 'Invoice Management', 'Project Tracking', 'Compliance Reports', 'Support Tickets'],
  },
]

// ── Pricing Plans ────────────────────────────────────────────────────────────

interface PricingPlan {
  name: string
  price: string
  period: string
  description: string
  popular?: boolean
  features: string[]
}

const PRICING_PLANS: PricingPlan[] = [
  {
    name: 'Free',
    price: '₹0',
    period: 'forever',
    description: 'Get started with basic HR tools',
    features: ['Up to 10 Employees', 'Basic Attendance', 'Leave Management', 'Employee Directory', 'Email Support'],
  },
  {
    name: 'Starter',
    price: '₹2,999',
    period: '/month',
    description: 'Perfect for growing businesses',
    features: ['Up to 50 Employees', 'Payroll Processing', 'Recruitment Module', 'Shift Management', 'Priority Support', 'GST Invoices'],
  },
  {
    name: 'Professional',
    price: '₹7,999',
    period: '/month',
    description: 'For established organizations',
    popular: true,
    features: ['Up to 250 Employees', 'AI HR Assistant', 'Full ATS & Recruitment', 'Multi-Branch Support', 'Advanced Analytics', 'Document Management', 'Dedicated Account Manager'],
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'Tailored for large enterprises',
    features: ['Unlimited Employees', 'Custom Integrations', 'Enterprise Security (SSO)', 'API Access', 'White-Label Options', '24/7 Premium Support', 'On-Premise Deployment', 'SLA Guarantee'],
  },
]

// ── Social Links ─────────────────────────────────────────────────────────────

const SOCIAL_ITEMS = [
  { href: SOCIAL.instagram, icon: InstagramIcon, label: 'Instagram', color: '#E4405F', gradient: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)' },
  { href: SOCIAL.linkedin, icon: LinkedInIcon, label: 'LinkedIn', color: '#0A66C2' },
  { href: SOCIAL.facebook, icon: FacebookIcon, label: 'Facebook', color: '#1877F2' },
  { href: SOCIAL.twitter, icon: XTwitterIcon, label: 'X', color: '#000000' },
  { href: SOCIAL.youtube, icon: YouTubeIcon, label: 'YouTube', color: '#FF0000' },
  { href: SOCIAL.threads, icon: ThreadsIcon, label: 'Threads', color: '#000000' },
  { href: SOCIAL.reddit, icon: RedditIcon, label: 'Reddit', color: '#FF4500' },
]

// ── Portal Login Form ────────────────────────────────────────────────────────

function PortalLoginForm({ portal, onBack }: { portal: PortalConfig; onBack: () => void }) {
  const { setUser } = useAppStore()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [forgotOpen, setForgotOpen] = useState(false)
  const Icon = portal.icon

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password.trim()) {
      toast.error('Please enter username and password')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      })
      const data = await res.json()
      if (res.ok && data.user) {
        setUser(data.user)
        toast.success('Welcome back!')
      } else {
        toast.error(data.error || 'Login failed. Please check your credentials.')
      }
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <section className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0a0e1a 0%, #0d1528 30%, #0f1d36 60%, #081225 100%)' }}>
        {/* Animated bg orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <div className="absolute top-1/4 -left-32 w-96 h-96 rounded-full opacity-[0.07] blur-[100px]" style={{ background: 'var(--gold, #D4AF37)' }} />
          <div className="absolute bottom-1/4 -right-32 w-80 h-80 rounded-full opacity-[0.05] blur-[100px]" style={{ background: '#6366f1' }} />
        </div>
        <div className="w-full max-w-md relative z-10">
          <Card className="border-0 shadow-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(24px)' }}>
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: 'linear-gradient(135deg, var(--gold, #D4AF37), #E8C96A)' }}>
                <Icon className="h-7 w-7 text-[var(--navy,#002B5C)]" />
              </div>
              <CardTitle className="text-2xl font-bold text-white">{portal.title}</CardTitle>
              <CardDescription className="text-gray-400 mt-1">{portal.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-username" className="text-gray-300 text-sm">Username</Label>
                  <Input
                    id="login-username"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="h-11 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-[var(--gold,#D4AF37)] focus:ring-[var(--gold,#D4AF37)]/20"
                    autoComplete="username"
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="login-password" className="text-gray-300 text-sm">Password</Label>
                    <button type="button" onClick={() => setForgotOpen(true)} className="text-xs text-gray-400 hover:text-[var(--gold,#D4AF37)] transition-colors">
                      Forgot password?
                    </button>
                  </div>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 bg-white/5 border-white/10 text-white placeholder:text-gray-500 focus:border-[var(--gold,#D4AF37)] focus:ring-[var(--gold,#D4AF37)]/20"
                    autoComplete="current-password"
                  />
                </div>
                <Button type="submit" className="w-full h-11 font-semibold text-base" style={{ background: 'linear-gradient(135deg, var(--gold, #D4AF37), #E8C96A)', color: 'var(--navy, #002B5C)' }} disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
                  Sign In
                </Button>
                <Button type="button" variant="ghost" className="w-full text-gray-400 hover:text-white hover:bg-white/5" onClick={onBack}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Home
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
      <ForgotPasswordDialog open={forgotOpen} onOpenChange={setForgotOpen} />
    </>
  )
}

// ── Subscription Form ────────────────────────────────────────────────────────

function SubscriptionForm({ onBack }: { onBack: () => void }) {
  const [form, setForm] = useState({ companyName: '', contactName: '', email: '', phone: '', address: '', plan: '', employeeCount: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const update = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.companyName.trim() || !form.contactName.trim() || !form.email.trim() || !form.phone.trim()) {
      toast.error('Please fill in all required fields')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/subscription/request', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const data = await res.json()
      if (res.ok) { toast.success('Subscription request submitted!'); setSent(true) }
      else { toast.error(data.error || 'Failed to submit request') }
    } catch { toast.error('Network error. Please try again.') } finally { setLoading(false) }
  }

  if (sent) {
    return (
      <section className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0a0e1a, #0d1528)' }}>
        <Card className="border-0 shadow-2xl max-w-md w-full text-center relative z-10" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <CardContent className="py-12">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full" style={{ background: 'rgba(212,175,55,0.1)' }}>
              <Check className="h-8 w-8 text-[var(--gold,#D4AF37)]" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Request Submitted!</h2>
            <p className="text-gray-400 mb-6">Our team will contact you within 24 hours.</p>
            <Button onClick={onBack} style={{ background: 'var(--gold, #D4AF37)', color: 'var(--navy, #002B5C)' }}>Back to Home</Button>
          </CardContent>
        </Card>
      </section>
    )
  }

  return (
    <section className="min-h-screen py-20 px-4 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0a0e1a, #0d1528)' }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute top-0 right-1/4 w-96 h-96 rounded-full opacity-[0.04] blur-[100px]" style={{ background: 'var(--gold, #D4AF37)' }} />
      </div>
      <div className="max-w-2xl mx-auto relative z-10">
        <div className="text-center mb-10">
          <Badge className="mb-4 px-4 py-1" style={{ background: 'rgba(212,175,55,0.1)', color: 'var(--gold, #D4AF37)', border: '1px solid rgba(212,175,55,0.2)' }}>Get Started</Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-white">Request a Subscription</h2>
          <p className="text-gray-400 mt-2">Fill in the details and our team will reach out to you.</p>
        </div>
        <Card style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-300 text-sm">Company Name *</Label>
                  <Input placeholder="Your company" value={form.companyName} onChange={(e) => update('companyName', e.target.value)} className="bg-white/5 border-white/10 text-white placeholder:text-gray-500" />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300 text-sm">Contact Name *</Label>
                  <Input placeholder="Full name" value={form.contactName} onChange={(e) => update('contactName', e.target.value)} className="bg-white/5 border-white/10 text-white placeholder:text-gray-500" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-300 text-sm">Email *</Label>
                  <Input type="email" placeholder="email@company.com" value={form.email} onChange={(e) => update('email', e.target.value)} className="bg-white/5 border-white/10 text-white placeholder:text-gray-500" />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300 text-sm">Phone *</Label>
                  <Input placeholder="+91 XXXXX XXXXX" value={form.phone} onChange={(e) => update('phone', e.target.value)} className="bg-white/5 border-white/10 text-white placeholder:text-gray-500" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300 text-sm">Address</Label>
                <Input placeholder="Office address" value={form.address} onChange={(e) => update('address', e.target.value)} className="bg-white/5 border-white/10 text-white placeholder:text-gray-500" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-300 text-sm">Plan</Label>
                  <Select value={form.plan} onValueChange={(v) => update('plan', v)}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white"><SelectValue placeholder="Select plan" /></SelectTrigger>
                    <SelectContent><SelectItem value="free">Free</SelectItem><SelectItem value="starter">Starter</SelectItem><SelectItem value="professional">Professional</SelectItem><SelectItem value="enterprise">Enterprise</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300 text-sm">Employee Count</Label>
                  <Input placeholder="e.g. 50" value={form.employeeCount} onChange={(e) => update('employeeCount', e.target.value)} className="bg-white/5 border-white/10 text-white placeholder:text-gray-500" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300 text-sm">Message</Label>
                <Textarea placeholder="Tell us about your requirements..." rows={3} value={form.message} onChange={(e) => update('message', e.target.value)} className="bg-white/5 border-white/10 text-white placeholder:text-gray-500" />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" className="flex-1 h-11 font-semibold" style={{ background: 'linear-gradient(135deg, var(--gold, #D4AF37), #E8C96A)', color: 'var(--navy, #002B5C)' }} disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                  Submit Request
                </Button>
                <Button type="button" variant="outline" className="border-white/10 text-gray-400 hover:text-white hover:bg-white/5" onClick={onBack}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN LANDING COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

export function Landing() {
  const { darkMode, setDarkMode, lang, setUser, hpaiOpen, setHpaiOpen } = useAppStore()
  const [view, setView] = useState<LandingView>('home')
  const [mobileMenu, setMobileMenu] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const homeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollTo = useCallback((id: string) => {
    setMobileMenu(false)
    const el = document.getElementById(id)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  const goHome = useCallback(() => {
    setView('home'); setMobileMenu(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const portalForView = (v: LandingView) => PORTALS.find((p) => p.id === v) || PORTALS[0]

  // ── Non-home views ───────────────────────────────────────────────────────
  if (view === 'register') return <RegistrationForm onBack={goHome} />
  if (view === 'subscribe') return <SubscriptionForm onBack={goHome} />
  if (view === 'login-admin' || view === 'login-employee' || view === 'login-client') {
    return <PortalLoginForm portal={portalForView(view)} onBack={goHome} />
  }

  // ── HOME VIEW ─────────────────────────────────────────────────────────────
  return (
    <div ref={homeRef} className="min-h-screen bg-white" style={{ color: '#1a1a2e' }}>
      {/* ── NO TOP BAR — Clean SaaS start ────────────────────────────────── */}

      {/* ── Navigation ───────────────────────────────────────────────────── */}
      <nav
        className={cn(
          'sticky top-0 z-50 w-full transition-all duration-500',
          scrolled ? 'shadow-xl' : 'bg-transparent',
        )}
        style={{
          backgroundColor: scrolled ? 'rgba(255,255,255,0.92)' : 'transparent',
          backdropFilter: scrolled ? 'blur(20px) saturate(180%)' : 'none',
        }}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[72px]">
            {/* Logo */}
            <button onClick={goHome} className="flex items-center gap-2.5 shrink-0" aria-label="HPHRMS Home">
              <BrandLogo size={36} />
              <div className="flex flex-col">
                <span className={cn(
                  'font-extrabold text-[15px] tracking-tight leading-tight transition-colors duration-300',
                  scrolled ? 'text-[var(--navy,#002B5C)]' : 'text-white',
                )}>
                  HPHRMS
                </span>
                <span className={cn(
                  'text-[10px] font-medium tracking-widest uppercase leading-tight transition-colors duration-300',
                  scrolled ? 'text-gray-400' : 'text-white/60',
                )}>
                  by HP Enterprise
                </span>
              </div>
            </button>

            {/* Center Links — Desktop */}
            <div className="hidden lg:flex items-center gap-1">
              {[
                { id: 'features', label: 'Features' },
                { id: 'pricing', label: 'Pricing' },
                { id: 'services', label: 'Services' },
                { id: 'trust', label: 'Trust' },
                { id: 'contact', label: 'Contact' },
              ].map((link) => (
                <button
                  key={link.id}
                  onClick={() => scrollTo(link.id)}
                  className={cn(
                    'px-3.5 py-2 rounded-lg text-[13px] font-medium transition-all duration-200',
                    scrolled
                      ? 'text-gray-600 hover:text-[var(--navy,#002B5C)] hover:bg-gray-100'
                      : 'text-white/75 hover:text-white hover:bg-white/10',
                  )}
                >
                  {link.label}
                </button>
              ))}
            </div>

            {/* Right Actions — Desktop */}
            <div className="hidden lg:flex items-center gap-3">
              <LanguageSwitcher />
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={cn(
                  'p-2 rounded-lg transition-all duration-200',
                  scrolled ? 'text-gray-500 hover:bg-gray-100 hover:text-gray-700' : 'text-white/60 hover:text-white hover:bg-white/10',
                )}
                aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
              <Button
                variant="ghost"
                className={cn(
                  'text-sm font-medium h-9',
                  scrolled ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-100' : 'text-white/80 hover:text-white hover:bg-white/10',
                )}
                onClick={() => setView('login-admin')}
              >
                Login
              </Button>
              <Button
                className="text-sm font-semibold h-9 px-5 rounded-lg"
                style={{ background: 'linear-gradient(135deg, var(--gold, #D4AF37), #E8C96A)', color: 'var(--navy, #002B5C)' }}
                onClick={() => setView('subscribe')}
              >
                Start Free Trial
              </Button>
            </div>

            {/* Mobile Hamburger */}
            <button
              className={cn(
                'lg:hidden p-2 rounded-lg transition-colors',
                scrolled ? 'text-gray-700' : 'text-white',
              )}
              onClick={() => setMobileMenu(!mobileMenu)}
              aria-label={mobileMenu ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenu}
            >
              {mobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenu && (
          <div className="lg:hidden border-t border-gray-100 bg-white/98 shadow-xl" style={{ backdropFilter: 'blur(20px)' }}>
            <div className="px-4 py-4 space-y-1">
              {['features', 'pricing', 'services', 'trust', 'contact'].map((id) => (
                <button
                  key={id}
                  onClick={() => scrollTo(id)}
                  className="block w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors capitalize"
                >
                  {id}
                </button>
              ))}
              <hr className="my-3 border-gray-100" />
              <div className="flex items-center gap-3 px-4 py-2">
                <LanguageSwitcher />
                <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100" aria-label="Toggle dark mode">
                  {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>
              </div>
              <div className="flex gap-2 px-4 pt-2">
                <Button variant="outline" className="flex-1 text-sm h-10" onClick={() => { setView('login-admin'); setMobileMenu(false) }}>
                  Login
                </Button>
                <Button className="flex-1 text-sm font-semibold h-10" style={{ background: 'linear-gradient(135deg, var(--gold, #D4AF37), #E8C96A)', color: 'var(--navy, #002B5C)' }} onClick={() => { setView('subscribe'); setMobileMenu(false) }}>
                  Start Free Trial
                </Button>
              </div>
              {/* Social links in mobile menu */}
              <div className="flex items-center gap-2 px-4 pt-4 pb-1">
                <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mr-1">Follow us</span>
                {SOCIAL_ITEMS.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-8 w-8 items-center justify-center rounded-md transition-all duration-200 hover:scale-110"
                    style={{ color: s.color }}
                    aria-label={s.label}
                  >
                    <s.icon className="h-3.5 w-3.5" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* ══════════════════════════════════════════════════════════════════════
          HERO SECTION — Premium Luxury SaaS Style
         ══════════════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-[92vh] flex items-center overflow-hidden" style={{ background: 'linear-gradient(160deg, #060a18 0%, #0c1429 25%, #0f1a38 50%, #121e42 75%, #0a1228 100%)' }}>
        {/* Animated mesh gradient background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          {/* Gold glow top-right */}
          <div className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full opacity-[0.08] blur-[120px] animate-[pulse_8s_ease-in-out_infinite]" style={{ background: 'radial-gradient(circle, var(--gold, #D4AF37) 0%, transparent 70%)' }} />
          {/* Deep blue glow center-left */}
          <div className="absolute top-1/2 -left-48 w-[500px] h-[500px] rounded-full opacity-[0.12] blur-[120px] animate-[pulse_10s_ease-in-out_infinite_2s]" style={{ background: 'radial-gradient(circle, #1e3a8a 0%, transparent 70%)' }} />
          {/* Subtle purple glow bottom */}
          <div className="absolute -bottom-20 right-1/4 w-[400px] h-[400px] rounded-full opacity-[0.06] blur-[100px] animate-[pulse_12s_ease-in-out_infinite_4s]" style={{ background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)' }} />
          {/* Gold accent bottom-left */}
          <div className="absolute bottom-0 left-1/3 w-[300px] h-[300px] rounded-full opacity-[0.05] blur-[80px]" style={{ background: 'radial-gradient(circle, var(--gold, #D4AF37) 0%, transparent 60%)' }} />
          {/* Grid overlay */}
          <div className="absolute inset-0" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }} />
          {/* Top fade */}
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#060a18] to-transparent" />
          {/* Bottom fade */}
          <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-white to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 lg:py-28">
          <div className="max-w-3xl">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8 text-sm font-medium" style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid rgba(212,175,55,0.2)', color: 'var(--gold, #D4AF37)' }}>
              <Sparkles className="h-3.5 w-3.5" />
              AI-Powered HR Platform
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{ background: 'rgba(212,175,55,0.15)' }}>New</span>
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[4.25rem] font-extrabold text-white leading-[1.1] tracking-tight">
              The Smarter Way to
              <br />
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, var(--gold, #D4AF37) 0%, #E8C96A 50%, #D4AF37 100%)' }}>
                Manage Your
              </span>
              <br />
              Entire Workforce
            </h1>

            {/* Subtitle */}
            <p className="mt-6 text-lg sm:text-xl text-gray-300/90 max-w-xl leading-relaxed">
              HPHRMS is the next-generation AI-powered HR management system that automates payroll, attendance, recruitment, and compliance — all in one platform.
            </p>

            {/* CTAs */}
            <div className="mt-10 flex flex-wrap gap-4">
              <Button
                size="lg"
                className="text-base font-semibold h-12 px-8 rounded-xl shadow-lg shadow-[var(--gold,#D4AF37)]/20 hover:shadow-xl hover:shadow-[var(--gold,#D4AF37)]/30 transition-all duration-300"
                style={{ background: 'linear-gradient(135deg, var(--gold, #D4AF37), #E8C96A)', color: 'var(--navy, #002B5C)' }}
                onClick={() => setView('subscribe')}
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-base font-medium h-12 px-8 rounded-xl border-white/20 text-white hover:bg-white/10 hover:text-white hover:border-white/30 transition-all duration-300"
                onClick={() => setView('login-admin')}
              >
                <Play className="mr-2 h-4 w-4" />
                Login to Dashboard
              </Button>
            </div>

            {/* Micro trust */}
            <div className="mt-12 flex flex-wrap items-center gap-6 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {['bg-emerald-500', 'bg-amber-500', 'bg-sky-500', 'bg-rose-500'].map((bg, i) => (
                    <div key={i} className={cn('h-7 w-7 rounded-full border-2 border-[#0c1429] flex items-center justify-center text-[10px] font-bold text-white', bg)}>
                      {String.fromCharCode(65 + i)}
                    </div>
                  ))}
                </div>
                <span>Trusted by <strong className="text-white">100+</strong> businesses</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-[var(--gold,#D4AF37)]" />
                <span>GSTIN: {BRAND.gstin}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Star className="h-4 w-4 text-[var(--gold,#D4AF37)]" />
                <span>UDYAM Registered</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          LOGOS / TRUST STRIP
         ══════════════════════════════════════════════════════════════════════ */}
      <section className="py-10 bg-gray-50/80 border-b border-gray-100" aria-label="Trust indicators">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
            {TRUST_BADGES.map((badge, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-gray-400 font-medium">
                <Check className="h-4 w-4 text-emerald-500" />
                {badge}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          HPHRMS FEATURES — Product Showcase
         ══════════════════════════════════════════════════════════════════════ */}
      <section id="features" className="py-20 sm:py-28 bg-white" aria-label="HPHRMS Features">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 px-4 py-1 text-sm" style={{ background: 'rgba(212,175,55,0.08)', color: 'var(--gold, #D4AF37)', border: '1px solid rgba(212,175,55,0.15)' }}>Product Features</Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight">
              Everything You Need to
              <br />
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, var(--navy, #002B5C), var(--navy-light, #0A4488))' }}>
                Run HR Smarter
              </span>
            </h2>
            <p className="mt-4 text-gray-500 max-w-2xl mx-auto text-lg">
              Powerful modules designed for modern Indian enterprises — from hiring to payroll, all powered by AI.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {HPHRMS_FEATURES.map((feature, i) => {
              const Icon = FEATURE_ICONS[i] || Zap
              return (
                <div
                  key={i}
                  className="group relative p-6 rounded-2xl bg-gray-50/80 border border-gray-100 hover:bg-white hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-1 transition-all duration-300 cursor-default"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl mb-4 transition-all duration-300" style={{ background: 'linear-gradient(135deg, var(--navy, #002B5C), var(--navy-light, #0A4488))' }}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 group-hover:text-[var(--navy,#002B5C)] transition-colors">
                    {feature}
                  </h3>
                  <p className="mt-1.5 text-sm text-gray-400 leading-relaxed">
                    Streamline your {feature.toLowerCase()} with intelligent automation and real-time insights.
                  </p>
                  <div className="absolute bottom-0 left-6 right-6 h-0.5 bg-gradient-to-r from-[var(--navy,#002B5C)] to-[var(--gold,#D4AF37)] scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left rounded-full" />
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SERVICES — Enterprise Solutions
         ══════════════════════════════════════════════════════════════════════ */}
      <section id="services" className="py-20 sm:py-28 relative overflow-hidden" style={{ background: 'linear-gradient(160deg, #060a18 0%, #0c1429 50%, #101d3a 100%)' }} aria-label="Our services">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <div className="absolute top-0 left-1/3 w-[500px] h-[500px] rounded-full opacity-[0.05] blur-[120px]" style={{ background: 'radial-gradient(circle, var(--gold, #D4AF37) 0%, transparent 70%)' }} />
          <div className="absolute -bottom-20 right-1/4 w-[400px] h-[400px] rounded-full opacity-[0.06] blur-[100px]" style={{ background: 'radial-gradient(circle, #1e3a8a 0%, transparent 70%)' }} />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 px-4 py-1 text-sm" style={{ background: 'rgba(212,175,55,0.1)', color: 'var(--gold, #D4AF37)', border: '1px solid rgba(212,175,55,0.2)' }}>Enterprise Solutions</Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
              Comprehensive
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, var(--gold, #D4AF37), #E8C96A)' }}> Business Services </span>
              by HP Enterprise
            </h2>
            <p className="mt-4 text-gray-400 max-w-2xl mx-auto text-lg">
              From manpower supply to safety consultancy — end-to-end workforce solutions for every industry.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {SERVICES.map((service, i) => {
              const Icon = SERVICE_ICONS[i] || Settings
              return (
                <div
                  key={i}
                  className="group p-5 rounded-2xl transition-all duration-300 hover:-translate-y-1 cursor-default"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.borderColor = 'rgba(212,175,55,0.2)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)' }}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ background: 'rgba(212,175,55,0.1)' }}>
                      <Icon className="h-5 w-5" style={{ color: 'var(--gold, #D4AF37)' }} />
                    </div>
                    <h3 className="text-sm font-semibold text-gray-200 group-hover:text-white transition-colors leading-snug">
                      {service}
                    </h3>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          PRICING
         ══════════════════════════════════════════════════════════════════════ */}
      <section id="pricing" className="py-20 sm:py-28 bg-white" aria-label="Pricing plans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 px-4 py-1 text-sm" style={{ background: 'rgba(212,175,55,0.08)', color: 'var(--gold, #D4AF37)', border: '1px solid rgba(212,175,55,0.15)' }}>Pricing</Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight">
              Simple, Transparent
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, var(--navy, #002B5C), var(--navy-light, #0A4488))' }}> Pricing </span>
            </h2>
            <p className="mt-4 text-gray-500 max-w-2xl mx-auto text-lg">
              Start free. Scale as you grow. All plans include GST invoices and professional support.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
            {PRICING_PLANS.map((plan, i) => (
              <div
                key={i}
                className={cn(
                  'rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl',
                  plan.popular
                    ? 'relative bg-gradient-to-b from-[var(--navy,#002B5C)] to-[var(--navy-light,#0A4488)] text-white shadow-2xl shadow-[var(--navy,#002B5C)]/20 scale-[1.03] ring-2 ring-[var(--gold,#D4AF37)]/30'
                    : 'bg-white border border-gray-200 hover:border-gray-300',
                )}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider" style={{ background: 'linear-gradient(135deg, var(--gold, #D4AF37), #E8C96A)', color: 'var(--navy, #002B5C)' }}>
                    Most Popular
                  </div>
                )}
                <h3 className={cn('text-lg font-bold', plan.popular ? 'text-white' : 'text-gray-900')}>{plan.name}</h3>
                <p className={cn('text-sm mt-1', plan.popular ? 'text-gray-300' : 'text-gray-500')}>{plan.description}</p>
                <div className="mt-5 mb-6">
                  <span className={cn('text-4xl font-extrabold', plan.popular ? 'text-white' : 'text-gray-900')}>{plan.price}</span>
                  {plan.period && <span className={cn('text-sm ml-1', plan.popular ? 'text-gray-300' : 'text-gray-400')}>{plan.period}</span>}
                </div>
                <ul className="space-y-2.5 mb-8">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-2.5 text-sm">
                      <Check className={cn('h-4 w-4 mt-0.5 shrink-0', plan.popular ? 'text-[var(--gold,#D4AF37)]' : 'text-emerald-500')} />
                      <span className={plan.popular ? 'text-gray-200' : 'text-gray-600'}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className={cn(
                    'w-full h-10 font-semibold rounded-lg',
                    plan.popular
                      ? 'text-white'
                      : 'border-gray-200 text-gray-700 hover:border-[var(--navy,#002B5C)] hover:text-[var(--navy,#002B5C)]',
                  )}
                  style={plan.popular ? { background: 'linear-gradient(135deg, var(--gold, #D4AF37), #E8C96A)', color: 'var(--navy, #002B5C)' } : undefined}
                  variant={plan.popular ? 'default' : 'outline'}
                  onClick={() => setView('subscribe')}
                >
                  {plan.price === '₹0' ? 'Get Started Free' : plan.price === 'Custom' ? 'Contact Sales' : 'Get Started'}
                  <ArrowRight className="ml-2 h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          TRUST & COMPLIANCE
         ══════════════════════════════════════════════════════════════════════ */}
      <section id="trust" className="py-20 sm:py-28 bg-gray-50" aria-label="Trust and compliance">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 px-4 py-1 text-sm" style={{ background: 'rgba(212,175,55,0.08)', color: 'var(--gold, #D4AF37)', border: '1px solid rgba(212,175,55,0.15)' }}>Trusted & Compliant</Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight">
              Trust &
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, var(--navy, #002B5C), var(--navy-light, #0A4488))' }}> Compliance </span>
            </h2>
            <p className="mt-4 text-gray-500 max-w-2xl mx-auto text-lg">
              Registered, verified, and compliant — your data and business are in safe hands.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* GSTIN Card */}
            <div className="rounded-2xl p-8 bg-white border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: 'linear-gradient(135deg, var(--navy, #002B5C), var(--navy-light, #0A4488))' }}>
                <ShieldCheck className="h-8 w-8 text-[var(--gold,#D4AF37)]" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">GST Registered</h3>
              <p className="mt-2 text-sm text-gray-500">GSTIN</p>
              <p className="mt-1 text-base font-mono font-bold text-gray-900 tracking-wide">{BRAND.gstin}</p>
            </div>
            {/* UDYAM Card */}
            <div className="rounded-2xl p-8 bg-white border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: 'linear-gradient(135deg, var(--navy, #002B5C), var(--navy-light, #0A4488))' }}>
                <Award className="h-8 w-8 text-[var(--gold,#D4AF37)]" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">UDYAM Registered</h3>
              <p className="mt-2 text-sm text-gray-500">MSME Registration</p>
              <p className="mt-1 text-base font-mono font-bold text-gray-900 tracking-wide">{BRAND.udyam}</p>
            </div>
            {/* PAN Card */}
            <div className="rounded-2xl p-8 bg-white border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: 'linear-gradient(135deg, var(--navy, #002B5C), var(--navy-light, #0A4488))' }}>
                <FileText className="h-8 w-8 text-[var(--gold,#D4AF37)]" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">PAN Verified</h3>
              <p className="mt-2 text-sm text-gray-500">Permanent Account Number</p>
              <p className="mt-1 text-base font-mono font-bold text-gray-900 tracking-wide">{BRAND.pan}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          PORTAL ACCESS
         ══════════════════════════════════════════════════════════════════════ */}
      <section id="portal" className="py-20 sm:py-28 bg-white" aria-label="Portal access">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 px-4 py-1 text-sm" style={{ background: 'rgba(212,175,55,0.08)', color: 'var(--gold, #D4AF37)', border: '1px solid rgba(212,175,55,0.15)' }}>Secure Access</Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight">
              Choose Your
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, var(--navy, #002B5C), var(--navy-light, #0A4488))' }}> Portal </span>
            </h2>
            <p className="mt-4 text-gray-500 max-w-2xl mx-auto text-lg">
              Sign in to your dedicated portal and manage operations seamlessly.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PORTALS.map((portal) => {
              const Icon = portal.icon
              return (
                <div
                  key={portal.id}
                  className="group rounded-2xl p-6 bg-gray-50/80 border border-gray-100 hover:bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                  onClick={() => setView(portal.id)}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: 'linear-gradient(135deg, var(--navy, #002B5C), var(--navy-light, #0A4488))' }}>
                      <Icon className="h-6 w-6 text-[var(--gold,#D4AF37)]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{portal.title}</h3>
                      <p className="text-sm text-gray-500">{portal.description}</p>
                    </div>
                  </div>
                  <ul className="space-y-2 mb-6">
                    {portal.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                        <Check className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full h-10 font-semibold rounded-lg text-white"
                    style={{ background: 'linear-gradient(135deg, var(--navy, #002B5C), var(--navy-light, #0A4488))' }}
                    onClick={(e) => { e.stopPropagation(); setView(portal.id) }}
                  >
                    <Lock className="mr-2 h-4 w-4" />
                    Sign In
                    <ArrowRight className="ml-auto h-3.5 w-3.5" />
                  </Button>
                </div>
              )
            })}
          </div>
          <div className="text-center mt-6">
            <button onClick={() => setView('register')} className="text-sm text-gray-400 hover:text-[var(--navy,#002B5C)] transition-colors underline-offset-4 hover:underline">
              New here? Create an account →
            </button>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          CONTACT
         ══════════════════════════════════════════════════════════════════════ */}
      <section id="contact" className="py-20 sm:py-28 relative overflow-hidden" style={{ background: 'linear-gradient(160deg, #060a18 0%, #0c1429 50%, #101d3a 100%)' }} aria-label="Contact information">
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full opacity-[0.05] blur-[120px]" style={{ background: 'radial-gradient(circle, var(--gold, #D4AF37) 0%, transparent 70%)' }} />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4 px-4 py-1 text-sm" style={{ background: 'rgba(212,175,55,0.1)', color: 'var(--gold, #D4AF37)', border: '1px solid rgba(212,175,55,0.2)' }}>Get in Touch</Badge>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
              Let&apos;s Build Something
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(135deg, var(--gold, #D4AF37), #E8C96A)' }}> Great Together </span>
            </h2>
            <p className="mt-4 text-gray-400 max-w-2xl mx-auto text-lg">
              Reach out for workforce solutions, partnerships, or support.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Phone Cards */}
            <a href={"tel:" + BRAND.phone.replace(/\s/g, '')} className="group p-6 rounded-2xl transition-all duration-300 hover:-translate-y-1" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl mb-4" style={{ background: 'rgba(212,175,55,0.1)' }}>
                <Phone className="h-6 w-6 text-[var(--gold,#D4AF37)]" />
              </div>
              <h3 className="text-sm font-medium text-gray-400 mb-1">Business Phone</h3>
              <p className="text-lg font-bold text-white group-hover:text-[var(--gold,#D4AF37)] transition-colors">{BRAND.phone}</p>
            </a>
            <a href={"tel:" + BRAND.hrPhone.replace(/\s/g, '')} className="group p-6 rounded-2xl transition-all duration-300 hover:-translate-y-1" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl mb-4" style={{ background: 'rgba(212,175,55,0.1)' }}>
                <Headphones className="h-6 w-6 text-[var(--gold,#D4AF37)]" />
              </div>
              <h3 className="text-sm font-medium text-gray-400 mb-1">HR Contact</h3>
              <p className="text-lg font-bold text-white group-hover:text-[var(--gold,#D4AF37)] transition-colors">{BRAND.hrPhone}</p>
            </a>
            <a href={"mailto:" + BRAND.email} className="group p-6 rounded-2xl transition-all duration-300 hover:-translate-y-1" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl mb-4" style={{ background: 'rgba(212,175,55,0.1)' }}>
                <Mail className="h-6 w-6 text-[var(--gold,#D4AF37)]" />
              </div>
              <h3 className="text-sm font-medium text-gray-400 mb-1">Email</h3>
              <p className="text-base font-bold text-white group-hover:text-[var(--gold,#D4AF37)] transition-colors break-all">{BRAND.email}</p>
            </a>
          </div>

          {/* Offices + CTA row */}
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Head Office */}
            <div className="p-6 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl mb-4" style={{ background: 'rgba(212,175,55,0.1)' }}>
                <MapPin className="h-6 w-6 text-[var(--gold,#D4AF37)]" />
              </div>
              <h3 className="text-sm font-semibold text-white mb-2">Head Office</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{BRAND.headOffice.full}</p>
            </div>
            {/* Branch Office */}
            <div className="p-6 rounded-2xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl mb-4" style={{ background: 'rgba(212,175,55,0.1)' }}>
                <MapPin className="h-6 w-6 text-[var(--gold,#D4AF37)]" />
              </div>
              <h3 className="text-sm font-semibold text-white mb-2">Branch Office</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{BRAND.branchOffice.full}</p>
            </div>
            {/* CTA Card */}
            <div className="rounded-2xl p-6 flex flex-col justify-center" style={{ background: 'linear-gradient(135deg, var(--navy, #002B5C), var(--navy-light, #0A4488))' }}>
              <h3 className="text-xl font-bold text-white mb-3">Ready to Transform Your Workforce?</h3>
              <p className="text-gray-300 text-sm mb-5">Get a free consultation and see how HPHRMS can streamline your HR operations.</p>
              <div className="space-y-2.5">
                <a href={SOCIAL.whatsapp} target="_blank" rel="noopener noreferrer">
                  <Button className="w-full h-10 font-semibold" style={{ background: 'linear-gradient(135deg, var(--gold, #D4AF37), #E8C96A)', color: 'var(--navy, #002B5C)' }}>
                    Chat on WhatsApp
                    <ExternalLink className="ml-2 h-3.5 w-3.5" />
                  </Button>
                </a>
                <a href={SOCIAL.recruitment} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="w-full h-10 font-medium border-white/20 text-white hover:bg-white/10 hover:text-white">
                    Recruitment Form
                    <ExternalLink className="ml-2 h-3.5 w-3.5" />
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          FOOTER
         ══════════════════════════════════════════════════════════════════════ */}
      <footer className="bg-[#060a18] border-t border-white/5" role="contentinfo">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
            {/* Column 1 — Brand */}
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <BrandLogo size={32} />
                <div className="flex flex-col">
                  <span className="font-extrabold text-[15px] text-white tracking-tight">HPHRMS</span>
                  <span className="text-[10px] font-medium tracking-widest uppercase text-gray-500">by HP Enterprise</span>
                </div>
              </div>
              <p className="text-sm text-gray-400 mb-4 leading-relaxed">{BRAND.tagline}</p>
              <a href={BRAND.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-[var(--gold,#D4AF37)] transition-colors">
                <Globe2 className="h-4 w-4" />
                hpserve.site
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            {/* Column 2 — Quick Links */}
            <div>
              <h4 className="text-xs font-semibold text-white uppercase tracking-widest mb-5">Quick Links</h4>
              <ul className="space-y-3">
                {[
                  { id: 'features', label: 'Features' },
                  { id: 'pricing', label: 'Pricing' },
                  { id: 'services', label: 'Services' },
                  { id: 'trust', label: 'Trust & Compliance' },
                  { id: 'contact', label: 'Contact Us' },
                ].map((link) => (
                  <li key={link.id}>
                    <button onClick={() => scrollTo(link.id)} className="text-sm text-gray-400 hover:text-[var(--gold,#D4AF37)] transition-colors inline-flex items-center gap-1.5">
                      <ChevronRight className="h-3 w-3" />{link.label}
                    </button>
                  </li>
                ))}
                <li>
                  <a href={SOCIAL.recruitment} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-400 hover:text-[var(--gold,#D4AF37)] transition-colors inline-flex items-center gap-1.5">
                    <ChevronRight className="h-3 w-3" />Recruitment Form
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 3 — Contact */}
            <div>
              <h4 className="text-xs font-semibold text-white uppercase tracking-widest mb-5">Contact</h4>
              <ul className="space-y-3">
                <li className="flex items-start gap-2.5 text-sm text-gray-400">
                  <Phone className="h-4 w-4 mt-0.5 shrink-0 text-[var(--gold,#D4AF37)]" />
                  <span>{BRAND.phone}</span>
                </li>
                <li className="flex items-start gap-2.5 text-sm text-gray-400">
                  <Headphones className="h-4 w-4 mt-0.5 shrink-0 text-[var(--gold,#D4AF37)]" />
                  <span>{BRAND.hrPhone}</span>
                </li>
                <li className="flex items-start gap-2.5 text-sm text-gray-400">
                  <Mail className="h-4 w-4 mt-0.5 shrink-0 text-[var(--gold,#D4AF37)]" />
                  <span className="break-all">{BRAND.email}</span>
                </li>
                <li className="flex items-start gap-2.5 text-sm text-gray-400">
                  <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-[var(--gold,#D4AF37)]" />
                  <span className="leading-relaxed">{BRAND.headOffice.full}</span>
                </li>
                <li className="flex items-start gap-2.5 text-sm text-gray-400">
                  <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-[var(--gold,#D4AF37)]" />
                  <span className="leading-relaxed">{BRAND.branchOffice.full}</span>
                </li>
              </ul>
            </div>

            {/* Column 4 — Social */}
            <div>
              <h4 className="text-xs font-semibold text-white uppercase tracking-widest mb-5">Follow Us</h4>
              <div className="flex flex-wrap gap-2.5">
                {SOCIAL_ITEMS.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 transition-all duration-200 hover:scale-110 hover:shadow-lg"
                    style={{ color: s.color }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = s.gradient || s.color
                      e.currentTarget.style.color = '#fff'
                      e.currentTarget.style.borderColor = 'transparent'
                      e.currentTarget.style.boxShadow = `0 4px 14px ${s.color}40`
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.color = s.color
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                    aria-label={s.label}
                  >
                    <s.icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
              {/* Legal badges in footer */}
              <div className="mt-6 space-y-2">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <ShieldCheck className="h-3.5 w-3.5 text-[var(--gold,#D4AF37)]" />
                  GSTIN: {BRAND.gstin}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Award className="h-3.5 w-3.5 text-[var(--gold,#D4AF37)]" />
                  UDYAM: {BRAND.udyam}
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <FileText className="h-3.5 w-3.5 text-[var(--gold,#D4AF37)]" />
                  PAN: {BRAND.pan}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-12 pt-8 border-t border-white/5">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-xs text-gray-500">© {new Date().getFullYear()} HP ENTERPRISE. All rights reserved.</p>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Bot className="h-3.5 w-3.5 text-[var(--gold,#D4AF37)]" />
                Powered by <strong className="text-gray-400">HPHRMS AI</strong>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
