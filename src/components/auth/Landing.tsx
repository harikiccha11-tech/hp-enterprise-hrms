'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import { BRAND, SERVICES, HPHRMS_FEATURES, TRUST_BADGES } from '@/lib/constants'
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
import { t } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import {
  Building2, ShieldCheck, Users, FileText, Clock, Wallet, ArrowRight, ArrowLeft, Lock, User as UserIcon,
  Sparkles, Sun, Moon, CreditCard, Crown, Check, Bot, Fingerprint,
  CalendarDays, FolderKanban, ClipboardList, ReceiptText, BarChart3, Megaphone, ScrollText,
  Settings, UserCog, Zap, Shield, Bell, Star, Headphones, TrendingUp, Send, Loader2,
  Phone, Mail, MapPin, ChevronRight, ExternalLink, Menu, X, Award, Globe2,
  HardHat, LandPlot, Truck, DollarSign, MonitorSmartphone, GraduationCap, Handshake,
  type LucideIcon,
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
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  )
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  )
}

function XTwitterIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  )
}

function ThreadsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.8-.946-.612-1.59-1.494-1.862-2.557-.56-2.168.33-4.764 2.553-6.573 1.402-1.14 3.02-1.786 4.598-1.864 1.818-.09 3.37.445 4.502 1.388.137.114.27.234.398.36l.087.083c.055-1.15-.031-2.273-.393-3.266-.672-1.86-2.088-3.063-4.375-3.71l.573-2.023c2.832.746 4.788 2.353 5.69 4.696.605 1.544.76 3.28.558 5.28.02.04.04.08.058.12.68 1.56.818 3.546-.543 5.464-1.445 2.037-3.47 3.295-6.023 3.737a10.3 10.3 0 01-1.646.132zm-.044-11.496c-1.093.055-2.275.535-3.327 1.391-1.52 1.236-2.122 3.048-1.77 4.424.137.527.453.974.913 1.273.452.293 1.043.446 1.72.41 1.1-.06 1.886-.408 2.475-1.082.59-.68.957-1.72 1.096-3.108l-.037-.03c-.474-.508-1.22-.927-2.07-.278z" />
    </svg>
  )
}

function RedditIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
    </svg>
  )
}

// ── Service Icons Mapping ───────────────────────────────────────────────────

const SERVICE_ICONS: LucideIcon[] = [
  Users, UserCog, HardHat, ShieldCheck, Settings, Truck,
  LandPlot, Handshake, Wallet, MonitorSmartphone, GraduationCap,
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
    price: '₹19,999',
    period: '/month',
    description: 'Custom solutions for large enterprises',
    features: ['Unlimited Employees', 'Custom Integrations', 'Enterprise Security (SSO)', 'API Access', 'White-Label Options', '24/7 Premium Support', 'On-Premise Deployment', 'SLA Guarantee'],
  },
]

// ── Social Links (all inline strings) ────────────────────────────────────────

const SOCIAL_LINKS = {
  instagram: 'https://www.instagram.com/hpenterpriseofficial',
  linkedin: 'https://www.linkedin.com/in/hariprasad-np-4408a8423',
  facebook: 'https://www.facebook.com/share/1DNBdqGcvb/',
  twitter: 'https://x.com/hpenterpri5nww',
  youtube: 'https://www.youtube.com/@HPEnterpriseIndia',
  threads: 'https://www.threads.com/@hpenterpriseofficial',
  reddit: 'https://www.reddit.com/u/HPEnterpriseIndia/',
}

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
      <section className="min-h-[70vh] flex items-center justify-center py-20 px-4" style={{ background: 'linear-gradient(135deg, var(--navy, #002B5C) 0%, var(--navy-deep, #001A3D) 100%)' }}>
        <div className="w-full max-w-md">
          <Card className="border-0 shadow-2xl backdrop-blur-sm" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(212,175,55,0.2)' }}>
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: 'linear-gradient(135deg, var(--navy, #002B5C), var(--navy-light, #0A4488))' }}>
                <Icon className="h-8 w-8" style={{ color: 'var(--gold, #D4AF37)' }} />
              </div>
              <CardTitle className="text-2xl font-bold text-white">{portal.title}</CardTitle>
              <CardDescription className="text-gray-300 mt-1">{portal.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-username" className="text-gray-200">Username</Label>
                  <Input
                    id="login-username"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-[var(--gold,#D4AF37)]"
                    autoComplete="username"
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="login-password" className="text-gray-200">Password</Label>
                    <button type="button" onClick={() => setForgotOpen(true)} className="text-xs hover:underline" style={{ color: 'var(--gold, #D4AF37)' }}>
                      Forgot password?
                    </button>
                  </div>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-[var(--gold,#D4AF37)]"
                    autoComplete="current-password"
                  />
                </div>
                <Button type="submit" className="w-full font-semibold text-white" style={{ background: 'linear-gradient(135deg, var(--gold, #D4AF37), var(--gold-light, #E8C96A))' }} disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
                  Sign In
                </Button>
                <Button type="button" variant="ghost" className="w-full text-gray-300 hover:text-white hover:bg-white/10" onClick={onBack}>
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
  const [form, setForm] = useState({
    companyName: '', contactName: '', email: '', phone: '', address: '', plan: '', employeeCount: '', message: '',
  })
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
      const res = await fetch('/api/subscription/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success('Subscription request submitted successfully!')
        setSent(true)
      } else {
        toast.error(data.error || 'Failed to submit request')
      }
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <section className="min-h-[70vh] flex items-center justify-center py-20 px-4" style={{ background: 'linear-gradient(135deg, var(--navy, #002B5C), var(--navy-deep, #001A3D))' }}>
        <Card className="border-0 shadow-2xl max-w-md w-full text-center" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(212,175,55,0.2)' }}>
          <CardContent className="py-12">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full" style={{ background: 'rgba(212,175,55,0.15)' }}>
              <Check className="h-8 w-8" style={{ color: 'var(--gold, #D4AF37)' }} />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Request Submitted!</h2>
            <p className="text-gray-300 mb-6">Our team will contact you within 24 hours.</p>
            <Button onClick={onBack} className="font-semibold" style={{ background: 'var(--gold, #D4AF37)', color: 'var(--navy, #002B5C)' }}>
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </section>
    )
  }

  return (
    <section className="min-h-[70vh] py-20 px-4" style={{ background: 'linear-gradient(135deg, var(--navy, #002B5C), var(--navy-deep, #001A3D))' }}>
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <Badge className="mb-4" style={{ background: 'rgba(212,175,55,0.15)', color: 'var(--gold, #D4AF37)', border: '1px solid rgba(212,175,55,0.3)' }}>Get Started</Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-white">Request a Subscription</h2>
          <p className="text-gray-300 mt-2">Fill in the details and our team will reach out to you.</p>
        </div>
        <Card className="border-0 shadow-2xl" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(212,175,55,0.2)' }}>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-200">Company Name *</Label>
                  <Input placeholder="Your company" value={form.companyName} onChange={(e) => update('companyName', e.target.value)} className="bg-white/10 border-white/20 text-white placeholder:text-gray-400" />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-200">Contact Name *</Label>
                  <Input placeholder="Full name" value={form.contactName} onChange={(e) => update('contactName', e.target.value)} className="bg-white/10 border-white/20 text-white placeholder:text-gray-400" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-200">Email *</Label>
                  <Input type="email" placeholder="email@company.com" value={form.email} onChange={(e) => update('email', e.target.value)} className="bg-white/10 border-white/20 text-white placeholder:text-gray-400" />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-200">Phone *</Label>
                  <Input placeholder="+91 XXXXX XXXXX" value={form.phone} onChange={(e) => update('phone', e.target.value)} className="bg-white/10 border-white/20 text-white placeholder:text-gray-400" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-200">Address</Label>
                <Input placeholder="Office address" value={form.address} onChange={(e) => update('address', e.target.value)} className="bg-white/10 border-white/20 text-white placeholder:text-gray-400" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-200">Plan</Label>
                  <Select value={form.plan} onValueChange={(v) => update('plan', v)}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white"><SelectValue placeholder="Select plan" /></SelectTrigger>
                    <SelectContent><SelectItem value="free">Free</SelectItem><SelectItem value="starter">Starter</SelectItem><SelectItem value="professional">Professional</SelectItem><SelectItem value="enterprise">Enterprise</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-200">Employee Count</Label>
                  <Input placeholder="e.g. 50" value={form.employeeCount} onChange={(e) => update('employeeCount', e.target.value)} className="bg-white/10 border-white/20 text-white placeholder:text-gray-400" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-200">Message</Label>
                <Textarea placeholder="Tell us about your requirements..." rows={3} value={form.message} onChange={(e) => update('message', e.target.value)} className="bg-white/10 border-white/20 text-white placeholder:text-gray-400" />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" className="flex-1 font-semibold text-white" style={{ background: 'linear-gradient(135deg, var(--gold, #D4AF37), var(--gold-light, #E8C96A))' }} disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                  Submit Request
                </Button>
                <Button type="button" variant="outline" className="border-white/20 text-gray-300 hover:text-white hover:bg-white/10" onClick={onBack}>
                  Cancel
                </Button>
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
  const [activeSection, setActiveSection] = useState('')
  const homeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
      const sections = ['services', 'hphrms', 'trust', 'portal', 'pricing', 'contact']
      for (const id of sections.reverse()) {
        const el = document.getElementById(id)
        if (el && window.scrollY >= el.offsetTop - 200) {
          setActiveSection(id)
          break
        }
      }
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollTo = useCallback((id: string) => {
    setMobileMenu(false)
    const el = document.getElementById(id)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [])

  const goHome = useCallback(() => {
    setView('home')
    setMobileMenu(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const portalForView = (v: LandingView) => PORTALS.find((p) => p.id === v) || PORTALS[0]

  // ── Non-home views ───────────────────────────────────────────────────────
  if (view === 'register') {
    return <RegistrationForm onBack={goHome} />
  }
  if (view === 'subscribe') {
    return <SubscriptionForm onBack={goHome} />
  }
  if (view === 'login-admin' || view === 'login-employee' || view === 'login-client') {
    return <PortalLoginForm portal={portalForView(view)} onBack={goHome} />
  }

  // ── HOME VIEW ─────────────────────────────────────────────────────────────
  return (
    <div ref={homeRef} className="min-h-screen bg-white dark:bg-gray-950">
      {/* ── 1. GST Trust Bar ────────────────────────────────────────────────── */}
      <div
        className="w-full py-2 px-4 text-center text-xs sm:text-sm font-medium tracking-wide overflow-x-auto whitespace-nowrap"
        style={{ background: 'linear-gradient(90deg, var(--navy, #002B5C), var(--navy-light, #0A4488), var(--gold, #D4AF37))', color: '#fff' }}
        role="banner"
        aria-label="Business registration information"
      >
        <span className="inline-flex items-center gap-4 sm:gap-8">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" style={{ color: 'var(--gold, #D4AF37)' }} />
            GSTIN: 29ANZPH4067Q1ZS
          </span>
          <span className="hidden sm:inline" style={{ color: 'rgba(255,255,255,0.4)' }}>|</span>
          <span className="inline-flex items-center gap-1.5">
            <Award className="h-3.5 w-3.5" style={{ color: 'var(--gold, #D4AF37)' }} />
            UDYAM: UDYAM-KR-10-0014648
          </span>
          <span className="hidden sm:inline" style={{ color: 'rgba(255,255,255,0.4)' }}>|</span>
          <span className="inline-flex items-center gap-1.5">
            <FileText className="h-3.5 w-3.5" style={{ color: 'var(--gold, #D4AF37)' }} />
            PAN: ANZPH4067Q
          </span>
        </span>
      </div>

      {/* ── 2. Navigation ───────────────────────────────────────────────────── */}
      <nav
        className={cn(
          'sticky top-0 z-50 w-full transition-all duration-300',
          scrolled
            ? 'shadow-lg backdrop-blur-xl'
            : 'bg-transparent',
        )}
        style={{
          backgroundColor: scrolled ? (darkMode ? 'rgba(3,7,18,0.85)' : 'rgba(255,255,255,0.88)') : 'transparent',
          borderBottom: scrolled ? '1px solid rgba(212,175,55,0.15)' : 'none',
        }}
        role="navigation"
        aria-label="Main navigation"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <button onClick={goHome} className="flex items-center gap-2 shrink-0" aria-label="HP ENTERPRISE Home">
              <BrandLogo size={36} />
              <span className={cn('hidden sm:block font-bold text-lg tracking-tight', scrolled ? 'text-[var(--navy,#002B5C)] dark:text-white' : 'text-white')}>
                HP ENTERPRISE
              </span>
            </button>

            {/* Center Links — Desktop */}
            <div className="hidden md:flex items-center gap-1">
              {[
                { id: 'services', label: 'Services' },
                { id: 'hphrms', label: 'HPHRMS' },
                { id: 'trust', label: 'Trust' },
                { id: 'contact', label: 'Contact' },
              ].map((link) => (
                <button
                  key={link.id}
                  onClick={() => scrollTo(link.id)}
                  className={cn(
                    'px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                    activeSection === link.id
                      ? 'text-[var(--gold,#D4AF37)] bg-[var(--gold,#D4AF37)]/10'
                      : scrolled
                        ? 'text-gray-700 dark:text-gray-300 hover:text-[var(--gold,#D4AF37)] hover:bg-gray-100 dark:hover:bg-gray-800'
                        : 'text-white/80 hover:text-white hover:bg-white/10',
                  )}
                >
                  {link.label}
                </button>
              ))}
            </div>

            {/* Right Actions — Desktop */}
            <div className="hidden md:flex items-center gap-2">
              <LanguageSwitcher />
              <button
                onClick={() => setDarkMode(!darkMode)}
                className={cn(
                  'p-2 rounded-lg transition-all duration-200',
                  scrolled ? 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800' : 'text-white/80 hover:text-white hover:bg-white/10',
                )}
                aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {darkMode ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
              </button>
              <Button
                variant={scrolled ? 'outline' : 'ghost'}
                className={cn(
                  'text-sm font-medium transition-all duration-200',
                  !scrolled && 'text-white border-white/30 hover:bg-white/10 hover:text-white',
                )}
                onClick={() => setView('login-admin')}
              >
                <Lock className="mr-1.5 h-3.5 w-3.5" />
                Login
              </Button>
              <Button
                className="text-sm font-semibold text-white transition-all duration-200"
                style={{ background: 'linear-gradient(135deg, var(--gold, #D4AF37), var(--gold-light, #E8C96A))' }}
                onClick={() => setView('subscribe')}
              >
                Subscribe
              </Button>
            </div>

            {/* Mobile Hamburger */}
            <button
              className={cn(
                'md:hidden p-2 rounded-lg transition-colors',
                scrolled ? 'text-gray-700 dark:text-gray-300' : 'text-white',
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
          <div className="md:hidden border-t border-gray-200 dark:border-gray-800" style={{ backgroundColor: darkMode ? 'rgba(3,7,18,0.97)' : 'rgba(255,255,255,0.97)' }}>
            <div className="px-4 py-3 space-y-1">
              {[{ id: 'services', label: 'Services' }, { id: 'hphrms', label: 'HPHRMS' }, { id: 'trust', label: 'Trust' }, { id: 'contact', label: 'Contact' }].map((link) => (
                <button
                  key={link.id}
                  onClick={() => scrollTo(link.id)}
                  className="block w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  {link.label}
                </button>
              ))}
              <hr className="my-2 border-gray-200 dark:border-gray-700" />
              <div className="flex items-center gap-2 px-3 py-2">
                <LanguageSwitcher />
                <button onClick={() => setDarkMode(!darkMode)} className="p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800" aria-label="Toggle dark mode">
                  {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </button>
              </div>
              <div className="flex gap-2 px-3 pt-1">
                <Button variant="outline" className="flex-1 text-sm" onClick={() => { setView('login-admin'); setMobileMenu(false) }}>
                  <Lock className="mr-1.5 h-3.5 w-3.5" /> Login
                </Button>
                <Button className="flex-1 text-sm font-semibold text-white" style={{ background: 'var(--gold, #D4AF37)' }} onClick={() => { setView('subscribe'); setMobileMenu(false) }}>
                  Subscribe
                </Button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* ── 3. Hero Section ─────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, var(--navy-deep, #001A3D) 0%, var(--navy, #002B5C) 40%, var(--navy-light, #0A4488) 100%)' }}
        aria-label="Hero"
      >
        {/* Decorative orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-20 blur-3xl" style={{ background: 'radial-gradient(circle, var(--gold, #D4AF37), transparent 70%)' }} />
          <div className="absolute top-1/2 -left-40 w-80 h-80 rounded-full opacity-10 blur-3xl" style={{ background: 'radial-gradient(circle, var(--gold, #D4AF37), transparent 70%)' }} />
          <div className="absolute bottom-0 right-1/4 w-64 h-64 rounded-full opacity-10 blur-3xl" style={{ background: 'radial-gradient(circle, #fff, transparent 70%)' }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 lg:py-40">
          <div className="max-w-3xl">
            <Badge className="mb-6 px-4 py-1.5 text-sm font-medium" style={{ background: 'rgba(212,175,55,0.15)', color: 'var(--gold, #D4AF37)', border: '1px solid rgba(212,175,55,0.3)' }}>
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              {BRAND.subTagline}
            </Badge>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-white leading-tight tracking-tight">
              HP <span style={{ color: 'var(--gold, #D4AF37)' }}>ENTERPRISE</span>
            </h1>
            <p className="mt-4 text-xl sm:text-2xl md:text-3xl font-medium" style={{ color: 'var(--gold, #D4AF37)' }}>
              {BRAND.tagline}
            </p>
            <p className="mt-3 text-base sm:text-lg text-gray-300 max-w-xl">
              {BRAND.taglineFull}
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <a href="https://hphrms.com" target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="font-semibold text-base px-6" style={{ background: 'linear-gradient(135deg, var(--gold, #D4AF37), var(--gold-light, #E8C96A))', color: 'var(--navy, #002B5C)' }}>
                  <Bot className="mr-2 h-5 w-5" />
                  Explore HPHRMS AI
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </a>
              <Button size="lg" variant="outline" className="font-semibold text-base px-6 border-white/30 text-white hover:bg-white/10 hover:text-white" onClick={() => setView('login-admin')}>
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
            <p className="mt-6 text-sm text-gray-400">
              Visit us at{' '}
              <a href="https://hpserve.site" target="_blank" rel="noopener noreferrer" className="underline hover:text-[var(--gold,#D4AF37)] transition-colors">
                hpserve.site
              </a>
            </p>
          </div>
        </div>
      </section>

      {/* ── 4. Trust Badges Strip ───────────────────────────────────────────── */}
      <section id="trust" className="py-12 sm:py-16 bg-gray-50 dark:bg-gray-900" aria-label="Trust and compliance badges">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <Badge className="mb-3" style={{ background: 'rgba(212,175,55,0.1)', color: 'var(--gold, #D4AF37)', border: '1px solid rgba(212,175,55,0.2)' }}>Trusted & Compliant</Badge>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Trust & Compliance</h2>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-thin">
            {TRUST_BADGES.map((badge, i) => (
              <div
                key={i}
                className="snap-start shrink-0 w-56 sm:w-auto flex-1 min-w-[200px] p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 backdrop-blur-sm hover:shadow-lg hover:border-[var(--gold,#D4AF37)]/30 transition-all duration-300"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg" style={{ background: 'rgba(212,175,55,0.1)' }}>
                    <Check className="h-5 w-5" style={{ color: 'var(--gold, #D4AF37)' }} />
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200 leading-snug">{badge}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. Services Section ─────────────────────────────────────────────── */}
      <section id="services" className="py-16 sm:py-24 bg-white dark:bg-gray-950" aria-label="Our services">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-3" style={{ background: 'rgba(212,175,55,0.1)', color: 'var(--gold, #D4AF37)', border: '1px solid rgba(212,175,55,0.2)' }}>What We Offer</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">Our Services</h2>
            <p className="mt-3 text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
              Comprehensive workforce and business solutions tailored to your organizational needs.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {SERVICES.map((service, i) => {
              const Icon = SERVICE_ICONS[i] || Settings
              return (
                <div
                  key={i}
                  className="group relative p-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/40 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-default"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-all duration-300"
                      style={{ background: 'rgba(212,175,55,0.08)' }}
                    >
                      <Icon className="h-6 w-6" style={{ color: 'var(--gold, #D4AF37)' }} />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white group-hover:text-[var(--gold,#D4AF37)] transition-colors">
                        {service}
                      </h3>
                    </div>
                  </div>
                  <div className="absolute bottom-0 left-0 h-0.5 w-0 group-hover:w-full transition-all duration-500" style={{ background: 'linear-gradient(90deg, var(--gold, #D4AF37), var(--navy-light, #0A4488))' }} />
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── 6. HPHRMS AI Section ────────────────────────────────────────────── */}
      <section id="hphrms" className="py-16 sm:py-24 bg-gray-50 dark:bg-gray-900" aria-label="HPHRMS AI Platform">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-3" style={{ background: 'rgba(212,175,55,0.1)', color: 'var(--gold, #D4AF37)', border: '1px solid rgba(212,175,55,0.2)' }}>
              <Bot className="mr-1.5 h-3.5 w-3.5" /> AI-Powered
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">HPHRMS AI Platform</h2>
            <p className="mt-3 text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
              The next-generation human resource management system powered by artificial intelligence, built for modern Indian enterprises.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
            {/* Features List — 3 cols */}
            <div className="lg:col-span-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {HPHRMS_FEATURES.map((feature, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 hover:border-[var(--gold,#D4AF37)]/30 hover:shadow-sm transition-all duration-200"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: 'rgba(212,175,55,0.1)' }}>
                      <Check className="h-4 w-4" style={{ color: 'var(--gold, #D4AF37)' }} />
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA Card — 2 cols */}
            <div className="lg:col-span-2">
              <div
                className="rounded-2xl p-8 text-white shadow-2xl relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, var(--navy, #002B5C), var(--navy-light, #0A4488))' }}
              >
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-20 blur-2xl" style={{ background: 'radial-gradient(circle, var(--gold, #D4AF37), transparent)' }} aria-hidden="true" />
                <Badge className="mb-4" style={{ background: 'rgba(212,175,55,0.2)', color: 'var(--gold, #D4AF37)', border: '1px solid rgba(212,175,55,0.3)' }}>
                  <Sparkles className="mr-1.5 h-3 w-3" /> Powered by AI
                </Badge>
                <h3 className="text-2xl font-bold mb-2">Transform Your HR</h3>
                <p className="text-gray-300 text-sm mb-6">
                  Experience the future of workforce management with AI-driven insights, automation, and intelligence.
                </p>
                <a href="https://hphrms.com" target="_blank" rel="noopener noreferrer">
                  <Button className="w-full font-semibold text-white" style={{ background: 'linear-gradient(135deg, var(--gold, #D4AF37), var(--gold-light, #E8C96A))', color: 'var(--navy, #002B5C)' }}>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open HPHRMS AI Platform
                  </Button>
                </a>
                <div className="mt-6 space-y-2 text-xs text-gray-400">
                  <p className="flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5" style={{ color: 'var(--gold, #D4AF37)' }} /> GSTIN: 29ANZPH4067Q1ZS</p>
                  <p className="flex items-center gap-2"><Award className="h-3.5 w-3.5" style={{ color: 'var(--gold, #D4AF37)' }} /> UDYAM: UDYAM-KR-10-0014648</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. Portal Access Section ────────────────────────────────────────── */}
      <section id="portal" className="py-16 sm:py-24 bg-white dark:bg-gray-950" aria-label="Portal access">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-3" style={{ background: 'rgba(212,175,55,0.1)', color: 'var(--gold, #D4AF37)', border: '1px solid rgba(212,175,55,0.2)' }}>Secure Access</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">Portal Access</h2>
            <p className="mt-3 text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
              Choose your portal to sign in and manage your workforce operations.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PORTALS.map((portal) => {
              const Icon = portal.icon
              return (
                <Card
                  key={portal.id}
                  className="group border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/40 hover:shadow-xl hover:border-[var(--gold,#D4AF37)]/30 transition-all duration-300 overflow-hidden"
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: 'linear-gradient(135deg, var(--navy, #002B5C), var(--navy-light, #0A4488))' }}>
                        <Icon className="h-6 w-6" style={{ color: 'var(--gold, #D4AF37)' }} />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-bold text-gray-900 dark:text-white">{portal.title}</CardTitle>
                        <CardDescription className="text-sm text-gray-500 dark:text-gray-400">{portal.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 mb-6">
                      {portal.features.map((f, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                          <Check className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--gold, #D4AF37)' }} />
                          {f}
                        </li>
                      ))}
                    </ul>
                    <Button
                      className="w-full font-semibold text-white"
                      style={{ background: 'linear-gradient(135deg, var(--navy, #002B5C), var(--navy-light, #0A4488))' }}
                      onClick={() => setView(portal.id)}
                    >
                      <Lock className="mr-2 h-4 w-4" />
                      Sign In
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
          <div className="text-center mt-6">
            <button onClick={() => setView('register')} className="text-sm text-gray-500 dark:text-gray-400 hover:text-[var(--gold,#D4AF37)] transition-colors underline-offset-4 hover:underline">
              New here? Create an account →
            </button>
          </div>
        </div>
      </section>

      {/* ── 8. Pricing Section ──────────────────────────────────────────────── */}
      <section id="pricing" className="py-16 sm:py-24 bg-gray-50 dark:bg-gray-900" aria-label="Pricing plans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-3" style={{ background: 'rgba(212,175,55,0.1)', color: 'var(--gold, #D4AF37)', border: '1px solid rgba(212,175,55,0.2)' }}>Pricing</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">Simple, Transparent Pricing</h2>
            <p className="mt-3 text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
              Choose the plan that fits your organization. All plans include GST invoices and professional support.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PRICING_PLANS.map((plan, i) => (
              <Card
                key={i}
                className={cn(
                  'relative overflow-hidden border bg-white dark:bg-gray-800/40 transition-all duration-300 hover:shadow-xl',
                  plan.popular
                    ? 'border-[var(--gold,#D4AF37)] shadow-lg scale-[1.02] dark:shadow-[var(--gold,#D4AF37)]/10'
                    : 'border-gray-200 dark:border-gray-700 hover:border-[var(--gold,#D4AF37)]/30',
                )}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0">
                    <div className="px-3 py-1 text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, var(--gold, #D4AF37), var(--gold-light, #E8C96A))', color: 'var(--navy, #002B5C)' }}>
                      Most Popular
                    </div>
                  </div>
                )}
                <CardHeader className="pb-2 pt-6">
                  <CardTitle className="text-lg font-bold text-gray-900 dark:text-white">{plan.name}</CardTitle>
                  <CardDescription className="text-sm text-gray-500 dark:text-gray-400">{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="mb-4">
                    <span className="text-3xl font-extrabold text-gray-900 dark:text-white">{plan.price}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400 ml-1">{plan.period}</span>
                  </div>
                  <ul className="space-y-2 mb-6">
                    {plan.features.map((f, j) => (
                      <li key={j} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <Check className="h-3.5 w-3.5 shrink-0" style={{ color: plan.popular ? 'var(--gold, #D4AF37)' : 'var(--navy-light, #0A4488)' }} />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={cn(
                      'w-full font-semibold',
                      plan.popular
                        ? 'text-white'
                        : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:border-[var(--gold,#D4AF37)]',
                    )}
                    style={plan.popular ? { background: 'linear-gradient(135deg, var(--gold, #D4AF37), var(--gold-light, #E8C96A))', color: 'var(--navy, #002B5C)' } : undefined}
                    variant={plan.popular ? 'default' : 'outline'}
                    onClick={() => setView('subscribe')}
                  >
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── 9. Contact Section ──────────────────────────────────────────────── */}
      <section id="contact" className="py-16 sm:py-24 bg-white dark:bg-gray-950" aria-label="Contact information">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge className="mb-3" style={{ background: 'rgba(212,175,55,0.1)', color: 'var(--gold, #D4AF37)', border: '1px solid rgba(212,175,55,0.2)' }}>Get in Touch</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">Contact Us</h2>
            <p className="mt-3 text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
              Reach out to us for workforce solutions, partnerships, or support.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left — Contact Info */}
            <div className="space-y-6">
              {/* Phone Numbers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/40">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: 'rgba(212,175,55,0.1)' }}>
                      <Phone className="h-5 w-5" style={{ color: 'var(--gold, #D4AF37)' }} />
                    </div>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Business Phone</span>
                  </div>
                  <a href="tel:+918073748271" className="text-lg font-semibold text-gray-900 dark:text-white hover:text-[var(--gold,#D4AF37)] transition-colors">
                    +91 80737 48271
                  </a>
                </div>
                <div className="p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/40">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: 'rgba(212,175,55,0.1)' }}>
                      <Headphones className="h-5 w-5" style={{ color: 'var(--gold, #D4AF37)' }} />
                    </div>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">HR Contact</span>
                  </div>
                  <a href="tel:+917337792436" className="text-lg font-semibold text-gray-900 dark:text-white hover:text-[var(--gold,#D4AF37)] transition-colors">
                    +91 73377 92436
                  </a>
                </div>
              </div>

              {/* Email & WhatsApp */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <a href="mailto:hpenterpriseofficial11@gmail.com" className="p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/40 hover:border-[var(--gold,#D4AF37)]/30 hover:shadow-md transition-all duration-200 group">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: 'rgba(212,175,55,0.1)' }}>
                      <Mail className="h-5 w-5" style={{ color: 'var(--gold, #D4AF37)' }} />
                    </div>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-[var(--gold,#D4AF37)] transition-colors break-all">
                    hpenterpriseofficial11@gmail.com
                  </p>
                </a>
                <a href="https://wa.me/message/65PDYODAFJZAN1" target="_blank" rel="noopener noreferrer" className="p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/40 hover:border-green-400/50 hover:shadow-md transition-all duration-200 group">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                      <svg className="h-5 w-5 text-green-500" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                    </div>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">WhatsApp</span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-green-500 transition-colors">
                    Chat with us
                  </p>
                </a>
              </div>

              {/* Offices */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/40">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: 'rgba(212,175,55,0.1)' }}>
                      <MapPin className="h-5 w-5" style={{ color: 'var(--gold, #D4AF37)' }} />
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">Head Office</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                    JeevaGurunadan Building, Kalkere Market Road, Ramamurthy Nagar, Bengaluru – 560016, Karnataka, India
                  </p>
                </div>
                <div className="p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/40">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ background: 'rgba(212,175,55,0.1)' }}>
                      <MapPin className="h-5 w-5" style={{ color: 'var(--gold, #D4AF37)' }} />
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">Branch Office</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                    Venkateshwara Nilaya Building, Behind Hanuman Mandir, Nagenahalli, Hosadurga Taluk, Chitradurga – 577515, Karnataka, India
                  </p>
                </div>
              </div>

              {/* GSTIN & UDYAM */}
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/40">
                  <ShieldCheck className="h-4 w-4" style={{ color: 'var(--gold, #D4AF37)' }} />
                  <span className="text-sm text-gray-600 dark:text-gray-300"><span className="font-medium">GSTIN:</span> 29ANZPH4067Q1ZS</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/40">
                  <Award className="h-4 w-4" style={{ color: 'var(--gold, #D4AF37)' }} />
                  <span className="text-sm text-gray-600 dark:text-gray-300"><span className="font-medium">UDYAM:</span> UDYAM-KR-10-0014648</span>
                </div>
              </div>
            </div>

            {/* Right — Contact CTA Card */}
            <div
              className="rounded-2xl p-8 text-white shadow-2xl relative overflow-hidden flex flex-col justify-between"
              style={{ background: 'linear-gradient(135deg, var(--navy, #002B5C), var(--navy-light, #0A4488))' }}
            >
              <div className="absolute top-0 right-0 w-48 h-48 rounded-full opacity-15 blur-3xl" style={{ background: 'radial-gradient(circle, var(--gold, #D4AF37), transparent)' }} aria-hidden="true" />
              <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full opacity-10 blur-3xl" style={{ background: 'radial-gradient(circle, #fff, transparent)' }} aria-hidden="true" />
              <div className="relative">
                <Badge className="mb-4" style={{ background: 'rgba(212,175,55,0.2)', color: 'var(--gold, #D4AF37)', border: '1px solid rgba(212,175,55,0.3)' }}>
                  Let&apos;s Connect
                </Badge>
                <h3 className="text-2xl sm:text-3xl font-bold mb-3">Ready to Transform Your Workforce?</h3>
                <p className="text-gray-300 text-sm sm:text-base mb-8">
                  Contact us today for a free consultation. Our team of experts will help you find the perfect workforce solution for your business.
                </p>
              </div>
              <div className="relative space-y-3">
                <a href="https://wa.me/message/65PDYODAFJZAN1" target="_blank" rel="noopener noreferrer">
                  <Button className="w-full font-semibold text-white mb-3" style={{ background: 'linear-gradient(135deg, var(--gold, #D4AF37), var(--gold-light, #E8C96A))', color: 'var(--navy, #002B5C)' }}>
                    Chat on WhatsApp
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </a>
                <a href="https://docs.google.com/forms/d/e/1FAIpQLSfxMyayr18xiVYf8L9MlZjxrRHfGpvzC7KAubf3fGUuUSNWtQ/viewForm?usp=header" target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" className="w-full font-semibold border-white/30 text-white hover:bg-white/10 hover:text-white">
                    Fill Recruitment Form
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 10. Footer ──────────────────────────────────────────────────────── */}
      <footer
        className="border-t border-gray-200 dark:border-gray-800"
        style={{ background: darkMode ? 'var(--navy-deep, #001A3D)' : 'linear-gradient(180deg, #f8f9fa, #fff)' }}
        role="contentinfo"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {/* Column 1 — Company Info */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <BrandLogo size={32} />
                <span className="text-lg font-bold text-gray-900 dark:text-white">HP ENTERPRISE</span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 leading-relaxed">
                {BRAND.tagline}
              </p>
              <a
                href="https://hpserve.site"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-medium hover:text-[var(--gold,#D4AF37)] transition-colors"
                style={{ color: 'var(--navy-light, #0A4488)' }}
              >
                <Globe2 className="h-4 w-4" />
                hpserve.site
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            {/* Column 2 — Quick Links */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">Quick Links</h4>
              <ul className="space-y-2.5">
                {[
                  { id: 'services', label: 'Services' },
                  { id: 'hphrms', label: 'HPHRMS AI' },
                  { id: 'trust', label: 'Trust & Compliance' },
                  { id: 'contact', label: 'Contact Us' },
                ].map((link) => (
                  <li key={link.id}>
                    <button
                      onClick={() => scrollTo(link.id)}
                      className="text-sm text-gray-500 dark:text-gray-400 hover:text-[var(--gold,#D4AF37)] transition-colors inline-flex items-center gap-1"
                    >
                      <ChevronRight className="h-3 w-3" />
                      {link.label}
                    </button>
                  </li>
                ))}
                <li>
                  <a
                    href="https://docs.google.com/forms/d/e/1FAIpQLSfxMyayr18xiVYf8L9MlZjxrRHfGpvzC7KAubf3fGUuUSNWtQ/viewForm?usp=header"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-gray-500 dark:text-gray-400 hover:text-[var(--gold,#D4AF37)] transition-colors inline-flex items-center gap-1"
                  >
                    <ChevronRight className="h-3 w-3" />
                    Recruitment Form
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 3 — Contact */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">Contact</h4>
              <ul className="space-y-3">
                <li className="flex items-start gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <Phone className="h-4 w-4 mt-0.5 shrink-0" style={{ color: 'var(--gold, #D4AF37)' }} />
                  <span>+91 80737 48271</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <Headphones className="h-4 w-4 mt-0.5 shrink-0" style={{ color: 'var(--gold, #D4AF37)' }} />
                  <span>+91 73377 92436</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <Mail className="h-4 w-4 mt-0.5 shrink-0" style={{ color: 'var(--gold, #D4AF37)' }} />
                  <span className="break-all">hpenterpriseofficial11@gmail.com</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <MapPin className="h-4 w-4 mt-0.5 shrink-0" style={{ color: 'var(--gold, #D4AF37)' }} />
                  <span className="leading-relaxed">JeevaGurunadan Building, Kalkere Market Road, Ramamurthy Nagar, Bengaluru – 560016</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-500 dark:text-gray-400">
                  <MapPin className="h-4 w-4 mt-0.5 shrink-0" style={{ color: 'var(--gold, #D4AF37)' }} />
                  <span className="leading-relaxed">Venkateshwara Nilaya Building, Nagenahalli, Chitradurga – 577515</span>
                </li>
              </ul>
            </div>

            {/* Column 4 — Social */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wider mb-4">Follow Us</h4>
              <div className="flex flex-wrap gap-3">
                <a
                  href="https://www.instagram.com/hpenterpriseofficial"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-[var(--gold,#D4AF37)] hover:border-[var(--gold,#D4AF37)]/30 transition-all duration-200"
                  aria-label="Instagram"
                >
                  <InstagramIcon className="h-4.5 w-4.5" />
                </a>
                <a
                  href="https://www.linkedin.com/in/hariprasad-np-4408a8423"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-[var(--gold,#D4AF37)] hover:border-[var(--gold,#D4AF37)]/30 transition-all duration-200"
                  aria-label="LinkedIn"
                >
                  <LinkedInIcon className="h-4.5 w-4.5" />
                </a>
                <a
                  href="https://www.facebook.com/share/1DNBdqGcvb/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-[var(--gold,#D4AF37)] hover:border-[var(--gold,#D4AF37)]/30 transition-all duration-200"
                  aria-label="Facebook"
                >
                  <FacebookIcon className="h-4.5 w-4.5" />
                </a>
                <a
                  href="https://x.com/hpenterpri5nww"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-[var(--gold,#D4AF37)] hover:border-[var(--gold,#D4AF37)]/30 transition-all duration-200"
                  aria-label="X / Twitter"
                >
                  <XTwitterIcon className="h-4.5 w-4.5" />
                </a>
                <a
                  href="https://www.youtube.com/@HPEnterpriseIndia"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-[var(--gold,#D4AF37)] hover:border-[var(--gold,#D4AF37)]/30 transition-all duration-200"
                  aria-label="YouTube"
                >
                  <YouTubeIcon className="h-4.5 w-4.5" />
                </a>
                <a
                  href="https://www.threads.com/@hpenterpriseofficial"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-[var(--gold,#D4AF37)] hover:border-[var(--gold,#D4AF37)]/30 transition-all duration-200"
                  aria-label="Threads"
                >
                  <ThreadsIcon className="h-4.5 w-4.5" />
                </a>
                <a
                  href="https://www.reddit.com/u/HPEnterpriseIndia/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:text-[var(--gold,#D4AF37)] hover:border-[var(--gold,#D4AF37)]/30 transition-all duration-200"
                  aria-label="Reddit"
                >
                  <RedditIcon className="h-4.5 w-4.5" />
                </a>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-12 pt-6 border-t border-gray-200 dark:border-gray-800">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
              <p>© 2025 HP ENTERPRISE. All rights reserved.</p>
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" style={{ color: 'var(--gold, #D4AF37)' }} />
                  GSTIN: 29ANZPH4067Q1ZS
                </span>
                <span className="hidden sm:inline" style={{ color: 'rgba(156,163,175,0.4)' }}>|</span>
                <span className="flex items-center gap-1">
                  <Award className="h-3.5 w-3.5" style={{ color: 'var(--gold, #D4AF37)' }} />
                  UDYAM: UDYAM-KR-10-0014648
                </span>
                <span className="hidden sm:inline" style={{ color: 'rgba(156,163,175,0.4)' }}>|</span>
                <span className="flex items-center gap-1">
                  <Bot className="h-3.5 w-3.5" style={{ color: 'var(--gold, #D4AF37)' }} />
                  Powered by HPHRMS AI
                </span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
