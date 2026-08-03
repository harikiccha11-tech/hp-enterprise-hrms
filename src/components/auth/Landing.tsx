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
import { motion, useInView, AnimatePresence } from 'framer-motion'
import {
  Building2, ShieldCheck, Users, FileText, Clock, Wallet, ArrowRight, ArrowLeft, Lock, User as UserIcon,
  Sparkles, Sun, Moon, CreditCard, Crown, Check, Bot, Fingerprint,
  CalendarDays, FolderKanban, ClipboardList, ReceiptText, BarChart3, Megaphone, ScrollText,
  Settings, UserCog, Zap, Shield, Bell, Star, Headphones, TrendingUp, Send, Loader2,
  Phone, Mail, MapPin, ChevronRight, ExternalLink, Menu, X, Award, Globe2,
  HardHat, LandPlot, Truck, DollarSign, MonitorSmartphone, GraduationCap, Handshake,
  type LucideIcon, Play, ChevronDown, Eye, Target, Palette,
} from 'lucide-react'
import Image from 'next/image'

// ── Types ────────────────────────────────────────────────────────────────────

type LandingView = 'home' | 'login-admin' | 'login-employee' | 'login-client' | 'register' | 'subscribe'

// ── Inline Social SVGs ──────────────────────────────────────────────────────

function InstagramIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
}
function LinkedInIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
}
function FacebookIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
}
function XTwitterIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
}
function YouTubeIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
}
function ThreadsIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor"><path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.8-.946-.612-1.59-1.494-1.862-2.557-.56-2.168.33-4.764 2.553-6.573 1.402-1.14 3.02-1.786 4.598-1.864 1.818-.09 3.37.445 4.502 1.388.137.114.27.234.398.36l.087.083c.055-1.15-.031-2.273-.393-3.266-.672-1.86-2.088-3.063-4.375-3.71l.573-2.023c2.832.746 4.788 2.353 5.69 4.696.605 1.544.76 3.28.558 5.28.02.04.04.08.058.12.68 1.56.818 3.546-.543 5.464-1.445 2.037-3.47 3.295-6.023 3.737a10.3 10.3 0 01-1.646.132zm-.044-11.496c-1.093.055-2.275.535-3.327 1.391-1.52 1.236-2.122 3.048-1.77 4.424.137.527.453.974.913 1.273.452.293 1.043.446 1.72.41 1.1-.06 1.886-.408 2.475-1.082.59-.68.957-1.72 1.096-3.108l-.037-.03c-.474-.508-1.22-.927-2.07-.278z"/></svg>
}
function RedditIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/></svg>
}
function WhatsAppIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
}

// ── Social Items ─────────────────────────────────────────────────────────────

const SOCIAL_ITEMS = [
  { href: SOCIAL.whatsapp, icon: WhatsAppIcon, label: 'WhatsApp', color: '#25D366', hoverBg: '#25D366' },
  { href: SOCIAL.instagram, icon: InstagramIcon, label: 'Instagram', color: '#E4405F', hoverBg: '#E4405F' },
  { href: SOCIAL.linkedin, icon: LinkedInIcon, label: 'LinkedIn', color: '#0A66C2', hoverBg: '#0A66C2' },
  { href: SOCIAL.facebook, icon: FacebookIcon, label: 'Facebook', color: '#1877F2', hoverBg: '#1877F2' },
  { href: SOCIAL.twitter, icon: XTwitterIcon, label: 'X', color: '#000000', hoverBg: '#14171A' },
  { href: SOCIAL.youtube, icon: YouTubeIcon, label: 'YouTube', color: '#FF0000', hoverBg: '#FF0000' },
  { href: SOCIAL.threads, icon: ThreadsIcon, label: 'Threads', color: '#000000', hoverBg: '#333333' },
  { href: SOCIAL.reddit, icon: RedditIcon, label: 'Reddit', color: '#FF4500', hoverBg: '#FF4500' },
]

// ── Service Detail Data ─────────────────────────────────────────────────────

interface ServiceDetail {
  title: string
  short: string
  icon: LucideIcon
  image: string
  description: string
  benefits: string[]
  industries: string[]
  process: string[]
}

const SERVICE_DETAILS: ServiceDetail[] = [
  {
    title: 'Human Resource Management',
    short: 'Complete workforce lifecycle management powered by AI',
    icon: Users,
    image: '/service-hr.png',
    description: 'Our comprehensive HR management service covers the entire employee lifecycle — from onboarding to exit. We handle employee records, performance tracking, policy compliance, and organizational development to help you build a strong, engaged workforce.',
    benefits: ['End-to-end employee lifecycle management', 'AI-powered performance analytics', 'Compliance with Indian labour laws', 'Employee engagement & retention programs', 'Organizational structure optimization'],
    industries: ['IT & Technology', 'Construction & Infrastructure', 'Manufacturing', 'Healthcare', 'BFSI'],
    process: ['Workforce assessment & planning', 'HR policy design & implementation', 'Employee onboarding & documentation', 'Ongoing HR operations & support', 'Performance reviews & analytics'],
  },
  {
    title: 'Recruitment & Talent Acquisition',
    short: 'End-to-end hiring pipeline with smart screening',
    icon: Target,
    image: '/service-recruitment.png',
    description: 'We manage the complete recruitment cycle — from job posting and candidate sourcing to interviewing, offer negotiation, and onboarding. Our AI-powered ATS helps you find the right talent faster while reducing hiring costs.',
    benefits: ['AI-powered applicant tracking system (ATS)', 'Multi-channel candidate sourcing', 'Structured interview frameworks', 'Background verification support', 'Faster time-to-hire with smart screening'],
    industries: ['All sectors — IT, Construction, Manufacturing, Services', 'Startups to Enterprise'],
    process: ['Requirement gathering & JD creation', 'Candidate sourcing & screening', 'Interview coordination & assessment', 'Offer management & negotiation', 'Onboarding & first-90-days support'],
  },
  {
    title: 'Safety (EHS) Consultancy',
    short: 'Environment, Health & Safety compliance and training',
    icon: HardHat,
    image: '/service-safety.png',
    description: 'HP Enterprise provides expert EHS consultancy services ensuring your organization meets all safety regulations. Our qualified EHS officers conduct audits, risk assessments, and training programs to create safer workplaces.',
    benefits: ['Qualified EHS officers on-site', 'Safety audit & compliance reporting', 'Risk assessment & hazard identification', 'Incident investigation & corrective actions', 'Safety training & awareness programs'],
    industries: ['Construction', 'Manufacturing', 'Oil & Gas', 'Power Plants', 'Infrastructure', 'Industrial'],
    process: ['Site safety assessment', 'Hazard identification & risk analysis', 'Safety plan development', 'Training delivery & certification', 'Ongoing monitoring & compliance audit'],
  },
  {
    title: 'Engineering & Project Support',
    short: 'Multi-discipline engineering for construction & infrastructure',
    icon: Settings,
    image: '/service-engineering.png',
    description: 'We provide skilled engineering professionals across all disciplines — civil, structural, MEP, HVAC, electrical, and more. Our engineers support projects from planning through execution, ensuring quality and timeline adherence.',
    benefits: ['Multi-discipline engineering team', 'Site supervision & quality control', 'Project planning & scheduling', 'Bill verification & quantity surveying', 'Testing & commissioning support'],
    industries: ['Commercial Buildings', 'Residential Projects', 'Airports', 'Metro Rail', 'Hospitals', 'Industrial Plants'],
    process: ['Project requirement analysis', 'Resource allocation & deployment', 'Execution & site supervision', 'Quality assurance & documentation', 'Project handover & closure'],
  },
  {
    title: 'Payroll Management',
    short: 'Automated payroll with PF, ESI, TDS & GST compliance',
    icon: Wallet,
    image: '/service-payroll.png',
    description: 'Our payroll management service ensures accurate, timely salary processing with full statutory compliance. We handle PF, ESI, TDS, professional tax, and GST invoicing — so you can focus on growing your business.',
    benefits: ['Accurate & timely salary processing', 'PF, ESI, TDS statutory compliance', 'GST invoice generation', 'Payslip delivery via HPHRMS portal', 'Year-end tax documentation'],
    industries: ['All sectors requiring payroll outsourcing'],
    process: ['Employee data verification', 'Attendance & leave consolidation', 'Salary computation & statutory deductions', 'Payslip generation & distribution', 'Monthly compliance filings'],
  },
  {
    title: 'Manpower Supply',
    short: 'Skilled & unskilled workforce deployment across India',
    icon: Users,
    image: '/service-manpower.png',
    description: 'HP Enterprise supplies both skilled and unskilled manpower to construction sites, factories, offices, and industrial projects across India. We handle recruitment, documentation, safety training, and payroll for deployed workers.',
    benefits: ['Pan-India workforce deployment', 'Pre-screened & trained workers', 'Complete documentation & compliance', 'Flexible staffing — short-term & long-term', 'Single vendor for all manpower needs'],
    industries: ['Construction', 'Infrastructure', 'Manufacturing', 'Facility Management', 'Logistics & Warehousing'],
    process: ['Workforce requirement analysis', 'Candidate sourcing & screening', 'Safety induction & training', 'Deployment & attendance management', 'Payroll & compliance management'],
  },
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
  { id: 'login-admin', title: 'Admin Console', description: 'Complete HR & workforce management dashboard', icon: Shield, features: ['Employee Management', 'Payroll & Attendance', 'Recruitment & ATS', 'Reports & Analytics', 'Document Management'] },
  { id: 'login-employee', title: 'Employee Portal', description: 'Self-service portal for all employees', icon: UserIcon, features: ['View Payslips', 'Apply Leaves', 'Attendance History', 'Document Downloads', 'Profile Management'] },
  { id: 'login-client', title: 'Client Portal', description: 'Dedicated access for business clients', icon: Building2, features: ['Workforce Dashboard', 'Invoice Management', 'Project Tracking', 'Compliance Reports', 'Support Tickets'] },
]

// ── Pricing Plans ────────────────────────────────────────────────────────────

interface PricingPlan { name: string; price: string; period: string; description: string; popular?: boolean; features: string[] }

const PRICING_PLANS: PricingPlan[] = [
  { name: 'Free', price: '₹0', period: 'forever', description: 'Get started with basic HR tools', features: ['Up to 10 Employees', 'Basic Attendance', 'Leave Management', 'Employee Directory', 'Email Support'] },
  { name: 'Starter', price: '₹2,999', period: '/month', description: 'Perfect for growing businesses', features: ['Up to 50 Employees', 'Payroll Processing', 'Recruitment Module', 'Shift Management', 'Priority Support', 'GST Invoices'] },
  { name: 'Professional', price: '₹7,999', period: '/month', description: 'For established organizations', popular: true, features: ['Up to 250 Employees', 'AI HR Assistant', 'Full ATS & Recruitment', 'Multi-Branch Support', 'Advanced Analytics', 'Document Management', 'Dedicated Account Manager'] },
  { name: 'Enterprise', price: 'Custom', period: '', description: 'Tailored for large enterprises', features: ['Unlimited Employees', 'Custom Integrations', 'Enterprise Security (SSO)', 'API Access', 'White-Label Options', '24/7 Premium Support', 'On-Premise Deployment', 'SLA Guarantee'] },
]

// ══════════════════════════════════════════════════════════════════════════════
// SOCIAL MEDIA SIDE MENU
// ══════════════════════════════════════════════════════════════════════════════

function SocialSideMenu() {
  const [expanded, setExpanded] = useState(false)
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  return (
    <div className="fixed left-0 top-1/2 -translate-y-1/2 z-50 hidden md:flex flex-col items-end">
      <button
        onClick={() => setExpanded(!expanded)}
        className="absolute -right-8 top-1/2 -translate-y-1/2 w-7 h-7 rounded-r-lg flex items-center justify-center transition-all duration-300"
        style={{ background: '#002B5C' }}
        aria-label={expanded ? 'Close social menu' : 'Open social menu'}
      >
        <ChevronRight className={cn('h-3.5 w-3.5 text-white transition-transform duration-300', expanded && 'rotate-180')} />
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 44, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden rounded-l-xl bg-white shadow-xl border-r-0 border border-gray-200"
          >
            <div className="flex flex-col items-center py-3 gap-1 w-[44px]">
              {SOCIAL_ITEMS.map((s, i) => (
                <motion.a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: i * 0.04, duration: 0.25 }}
                  className="relative flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200 group"
                  style={{ color: hoveredIdx === i ? '#fff' : s.color }}
                  onMouseEnter={() => setHoveredIdx(i)}
                  onMouseLeave={() => setHoveredIdx(null)}
                  aria-label={s.label}
                >
                  <motion.div
                    className="absolute inset-0 rounded-lg"
                    initial={false}
                    animate={{ scale: hoveredIdx === i ? 1 : 0, opacity: hoveredIdx === i ? 1 : 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ background: s.hoverBg }}
                  />
                  <s.icon className="h-4 w-4 relative z-10" />
                  <AnimatePresence>
                    {hoveredIdx === i && (
                      <motion.div
                        initial={{ x: -4, opacity: 0, scale: 0.9 }}
                        animate={{ x: 0, opacity: 1, scale: 1 }}
                        exit={{ x: -4, opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-full ml-2 px-2 py-1 rounded-md text-[11px] font-medium text-white whitespace-nowrap pointer-events-none bg-gray-900"
                      >
                        {s.label}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {!expanded && (
        <div
          className="w-1 rounded-l-full cursor-pointer hover:w-1.5 transition-all duration-300"
          style={{ background: 'linear-gradient(180deg, #D4AF37, #002B5C, #D4AF37)', height: '160px' }}
          onClick={() => setExpanded(true)}
        />
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// SCROLL REVEAL WRAPPER
// ══════════════════════════════════════════════════════════════════════════════

function Reveal({ children, className, delay = 0, direction = 'up' }: {
  children: React.ReactNode; className?: string; delay?: number; direction?: 'up' | 'down' | 'left' | 'right'
}) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const dir = { up: { y: 40 }, down: { y: -40 }, left: { x: 40 }, right: { x: -40 } }[direction]

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, ...dir }}
      animate={inView ? { opacity: 1, x: 0, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.25, 0.4, 0.25, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// SERVICE DETAIL MODAL
// ══════════════════════════════════════════════════════════════════════════════

function ServiceModal({ service, open, onClose }: { service: ServiceDetail | null; open: boolean; onClose: () => void }) {
  if (!service) return null
  const Icon = service.icon

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative z-10 bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header image */}
            <div className="relative h-56 sm:h-64 overflow-hidden">
              <Image src={service.image} alt={service.title} fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <button onClick={onClose} className="absolute top-4 right-4 h-9 w-9 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white transition-colors shadow-lg" aria-label="Close">
                <X className="h-4 w-4 text-gray-800" />
              </button>
              <div className="absolute bottom-4 left-6 right-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: '#002B5C' }}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">{service.title}</h2>
                </div>
                <p className="text-gray-200 text-sm">{service.short}</p>
              </div>
            </div>

            {/* Body */}
            <div className="overflow-y-auto max-h-[calc(90vh-16rem)] p-6 space-y-6">
              <p className="text-gray-700 leading-relaxed">{service.description}</p>

              {/* Benefits */}
              <div>
                <h3 className="text-sm font-bold text-[#002B5C] uppercase tracking-wider mb-3">Key Benefits</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {service.benefits.map((b) => (
                    <div key={b} className="flex items-start gap-2 p-2.5 rounded-lg bg-gray-50">
                      <Check className="h-4 w-4 mt-0.5 text-emerald-600 shrink-0" />
                      <span className="text-sm text-gray-700">{b}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Industries */}
              <div>
                <h3 className="text-sm font-bold text-[#002B5C] uppercase tracking-wider mb-3">Industries Served</h3>
                <div className="flex flex-wrap gap-2">
                  {service.industries.map((ind) => (
                    <span key={ind} className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">{ind}</span>
                  ))}
                </div>
              </div>

              {/* Process */}
              <div>
                <h3 className="text-sm font-bold text-[#002B5C] uppercase tracking-wider mb-3">Our Process</h3>
                <div className="space-y-3">
                  {service.process.map((step, i) => (
                    <div key={step} className="flex items-start gap-3">
                      <div className="h-7 w-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white" style={{ background: '#002B5C' }}>{i + 1}</div>
                      <div className="pt-1">
                        <span className="text-sm font-medium text-gray-800">{step}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <a href={SOCIAL.whatsapp} target="_blank" rel="noopener noreferrer" className="flex-1 h-11 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold text-white transition-all hover:opacity-90" style={{ background: '#25D366' }}>
                  <WhatsAppIcon className="h-4 w-4" style={{ color: '#fff' }} />Chat on WhatsApp
                </a>
                <a href={`tel:${BRAND.phone}`} className="flex-1 h-11 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold text-white transition-all hover:opacity-90" style={{ background: '#002B5C' }}>
                  <Phone className="h-4 w-4" />Call {BRAND.phone}
                </a>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// PORTAL LOGIN FORM
// ══════════════════════════════════════════════════════════════════════════════

function PortalLoginForm({ portal, onBack }: { portal: PortalConfig; onBack: () => void }) {
  const { setUser } = useAppStore()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [forgotOpen, setForgotOpen] = useState(false)
  const Icon = portal.icon

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password.trim()) { toast.error('Please enter username and password'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: username.trim(), password }) })
      const data = await res.json()
      if (res.ok && data.user) { setUser(data.user); toast.success('Welcome back!') }
      else { toast.error(data.error || 'Login failed. Please check your credentials.') }
    } catch { toast.error('Network error. Please try again.') } finally { setLoading(false) }
  }

  return (
    <>
      <section className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #001A3D 0%, #002B5C 50%, #0A4488 100%)' }}>
        <div className="w-full max-w-md relative z-10">
          <Card className="border-0 shadow-2xl bg-white">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: '#002B5C' }}>
                <Icon className="h-7 w-7 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">{portal.title}</CardTitle>
              <CardDescription className="text-gray-500 mt-1">{portal.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-username" className="text-gray-700 text-sm font-medium">Username</Label>
                  <Input id="login-username" placeholder="Enter your username" value={username} onChange={(e) => setUsername(e.target.value)} className="h-11" autoComplete="username" autoFocus />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="login-password" className="text-gray-700 text-sm font-medium">Password</Label>
                    <button type="button" onClick={() => setForgotOpen(true)} className="text-xs font-medium hover:underline" style={{ color: '#002B5C' }}>Forgot password?</button>
                  </div>
                  <Input id="login-password" type="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-11" autoComplete="current-password" />
                </div>
                <Button type="submit" className="w-full h-11 font-semibold text-base text-white" style={{ background: '#002B5C' }} disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}Sign In
                </Button>
                <Button type="button" variant="ghost" className="w-full text-gray-500 hover:text-gray-800" onClick={onBack}>
                  <ArrowLeft className="mr-2 h-4 w-4" />Back to Home
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

// ══════════════════════════════════════════════════════════════════════════════
// SUBSCRIPTION FORM
// ══════════════════════════════════════════════════════════════════════════════

function SubscriptionForm({ onBack }: { onBack: () => void }) {
  const [form, setForm] = useState({ companyName: '', contactName: '', email: '', phone: '', address: '', plan: '', employeeCount: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const update = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.companyName.trim() || !form.contactName.trim() || !form.email.trim() || !form.phone.trim()) { toast.error('Please fill in all required fields'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/subscription/request', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) })
      const data = await res.json()
      if (res.ok) { toast.success('Subscription request submitted!'); setSent(true) } else { toast.error(data.error || 'Failed to submit request') }
    } catch { toast.error('Network error. Please try again.') } finally { setLoading(false) }
  }

  if (sent) {
    return (
      <section className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
        <Card className="shadow-xl max-w-md w-full text-center">
          <CardContent className="py-12">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50"><Check className="h-8 w-8 text-emerald-600" /></div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Submitted!</h2>
            <p className="text-gray-500 mb-6">Our team will contact you within 24 hours.</p>
            <Button onClick={onBack} style={{ background: '#002B5C' }} className="text-white">Back to Home</Button>
          </CardContent>
        </Card>
      </section>
    )
  }

  return (
    <section className="min-h-screen py-20 px-4 bg-gray-50">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <Badge className="mb-4 px-4 py-1 text-sm" style={{ background: 'rgba(0,43,92,0.08)', color: '#002B5C', border: '1px solid rgba(0,43,92,0.12)' }}>Get Started</Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Request a Subscription</h2>
          <p className="text-gray-500 mt-2">Fill in the details and our team will reach out to you.</p>
        </div>
        <Card className="shadow-lg">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2"><Label className="text-gray-700 text-sm font-medium">Company Name *</Label><Input placeholder="Your company" value={form.companyName} onChange={(e) => update('companyName', e.target.value)} /></div>
                <div className="space-y-2"><Label className="text-gray-700 text-sm font-medium">Contact Name *</Label><Input placeholder="Full name" value={form.contactName} onChange={(e) => update('contactName', e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2"><Label className="text-gray-700 text-sm font-medium">Email *</Label><Input type="email" placeholder="email@company.com" value={form.email} onChange={(e) => update('email', e.target.value)} /></div>
                <div className="space-y-2"><Label className="text-gray-700 text-sm font-medium">Phone *</Label><Input placeholder="+91 XXXXX XXXXX" value={form.phone} onChange={(e) => update('phone', e.target.value)} /></div>
              </div>
              <div className="space-y-2"><Label className="text-gray-700 text-sm font-medium">Address</Label><Input placeholder="Office address" value={form.address} onChange={(e) => update('address', e.target.value)} /></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2"><Label className="text-gray-700 text-sm font-medium">Plan</Label><Select value={form.plan} onValueChange={(v) => update('plan', v)}><SelectTrigger><SelectValue placeholder="Select plan" /></SelectTrigger><SelectContent><SelectItem value="free">Free</SelectItem><SelectItem value="starter">Starter</SelectItem><SelectItem value="professional">Professional</SelectItem><SelectItem value="enterprise">Enterprise</SelectItem></SelectContent></Select></div>
                <div className="space-y-2"><Label className="text-gray-700 text-sm font-medium">Employee Count</Label><Input placeholder="e.g. 50" value={form.employeeCount} onChange={(e) => update('employeeCount', e.target.value)} /></div>
              </div>
              <div className="space-y-2"><Label className="text-gray-700 text-sm font-medium">Message</Label><Textarea placeholder="Tell us about your requirements..." rows={3} value={form.message} onChange={(e) => update('message', e.target.value)} /></div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" className="flex-1 h-11 font-semibold text-white" style={{ background: '#002B5C' }} disabled={loading}>{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}Submit Request</Button>
                <Button type="button" variant="outline" onClick={onBack}>Cancel</Button>
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
  const [activeService, setActiveService] = useState<ServiceDetail | null>(null)
  const [serviceModalOpen, setServiceModalOpen] = useState(false)
  const homeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollTo = useCallback((id: string) => { setMobileMenu(false); const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }) }, [])
  const goHome = useCallback(() => { setView('home'); setMobileMenu(false); window.scrollTo({ top: 0, behavior: 'smooth' }) }, [])
  const openServiceModal = useCallback((service: ServiceDetail) => { setActiveService(service); setServiceModalOpen(true) }, [])
  const portalForView = (v: LandingView) => PORTALS.find((p) => p.id === v) || PORTALS[0]

  const NAV_LINKS = [
    { id: 'features', label: 'Features' },
    { id: 'services', label: 'Services' },
    { id: 'pricing', label: 'Pricing' },
    { id: 'portals', label: 'Portals' },
    { id: 'contact', label: 'Contact' },
  ]

  if (view === 'register') return <RegistrationForm onBack={goHome} />
  if (view === 'subscribe') return <SubscriptionForm onBack={goHome} />
  if (view === 'login-admin' || view === 'login-employee' || view === 'login-client') {
    return <PortalLoginForm portal={portalForView(view)} onBack={goHome} />
  }

  return (
    <div ref={homeRef} className="min-h-screen flex flex-col bg-white">
      <SocialSideMenu />
      <ServiceModal service={activeService} open={serviceModalOpen} onClose={() => setServiceModalOpen(false)} />

      {/* ── NAVIGATION ─────────────────────────────────────────────────────── */}
      <nav
        className={cn('sticky top-0 z-40 w-full transition-all duration-300', scrolled ? 'bg-white/95 shadow-md backdrop-blur-lg' : 'bg-white')}
        role="navigation" aria-label="Main navigation"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[72px]">
            <button onClick={goHome} className="flex items-center gap-2.5 shrink-0" aria-label="HPHRMS Home">
              <BrandLogo size={36} />
              <div className="flex flex-col">
                <span className="font-extrabold text-[15px] tracking-tight leading-tight text-gray-900">HPHRMS</span>
                <span className="text-[10px] font-medium tracking-widest uppercase leading-tight text-gray-400">by HP Enterprise</span>
              </div>
            </button>

            <div className="hidden lg:flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <button key={link.id} onClick={() => scrollTo(link.id)} className="px-3.5 py-2 rounded-lg text-[13px] font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200">
                  {link.label}
                </button>
              ))}
            </div>

            <div className="hidden lg:flex items-center gap-3">
              <LanguageSwitcher />
              <Button variant="ghost" className="text-sm font-medium h-9 text-gray-600 hover:text-gray-900 hover:bg-gray-100" onClick={() => setView('login-admin')}>Login</Button>
              <Button className="text-sm font-semibold h-9 px-5 rounded-lg text-white" style={{ background: '#D4AF37', color: '#002B5C' }} onClick={() => setView('subscribe')}>Start Free Trial</Button>
            </div>

            <button className="lg:hidden p-2 rounded-lg text-gray-700" onClick={() => setMobileMenu(!mobileMenu)} aria-label={mobileMenu ? 'Close menu' : 'Open menu'} aria-expanded={mobileMenu}>
              {mobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenu && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="lg:hidden overflow-hidden bg-white border-t border-gray-100 shadow-lg"
            >
              <div className="px-4 py-4 space-y-1">
                {NAV_LINKS.map((link) => (
                  <button key={link.id} onClick={() => scrollTo(link.id)} className="block w-full text-left px-4 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors capitalize">{link.label}</button>
                ))}
                <hr className="my-3 border-gray-100" />
                <div className="flex items-center gap-3 px-4 py-2">
                  <LanguageSwitcher />
                </div>
                <div className="flex gap-2 px-4 pt-2">
                  <Button variant="outline" className="flex-1 text-sm h-10" onClick={() => { setView('login-admin'); setMobileMenu(false) }}>Login</Button>
                  <Button className="flex-1 text-sm font-semibold h-10 text-white" style={{ background: '#D4AF37', color: '#002B5C' }} onClick={() => { setView('subscribe'); setMobileMenu(false) }}>Start Free Trial</Button>
                </div>
                <div className="flex items-center gap-2 px-4 pt-4 pb-1">
                  <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mr-1">Follow us</span>
                  {SOCIAL_ITEMS.map((s) => (
                    <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className="flex h-8 w-8 items-center justify-center rounded-md transition-all duration-200 hover:scale-110" style={{ color: s.color }} aria-label={s.label}><s.icon className="h-3.5 w-3.5" /></a>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ══════════════════════════════════════════════════════════════════════
          HERO SECTION
         ══════════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(160deg, #001A3D 0%, #002B5C 40%, #0A4488 100%)' }}>
        {/* Real background image */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <Image src="/hero-banner.png" alt="" fill className="object-cover opacity-30" priority />
          <div className="absolute inset-0 bg-gradient-to-r from-[#001A3D] via-[#002B5C]/90 to-[#0A4488]/70" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
          <div className="max-w-3xl">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.25, 0.4, 0.25, 1] }}>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8 text-sm font-medium bg-white/10 border border-white/20 text-white backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5" style={{ color: '#D4AF37' }} />AI-Powered HR Platform
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{ background: '#D4AF37', color: '#002B5C' }}>New</span>
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-[1.1] tracking-tight">
                The Smarter Way to
                <br />
                <span style={{ color: '#D4AF37' }}>Manage Your</span>
                <br />
                Entire Workforce
              </h1>

              <p className="mt-6 text-lg sm:text-xl text-gray-200 max-w-xl leading-relaxed">
                HPHRMS is the next-generation AI-powered HR management system that automates payroll, attendance, recruitment, and compliance — all in one platform built for Indian enterprises.
              </p>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.3, ease: [0.25, 0.4, 0.25, 1] }}>
              <div className="mt-10 flex flex-wrap gap-4">
                <Button size="lg" className="text-base font-semibold h-12 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300" style={{ background: '#D4AF37', color: '#002B5C' }} onClick={() => setView('subscribe')}>
                  Book a Demo<ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" className="text-base font-medium h-12 px-8 rounded-xl border-white/30 text-white hover:bg-white/10 hover:text-white transition-all duration-300" onClick={() => setView('login-admin')}>
                  Login to Dashboard
                </Button>
                <Button size="lg" variant="outline" className="text-base font-medium h-12 px-8 rounded-xl border-white/30 text-white hover:bg-white/10 hover:text-white transition-all duration-300" onClick={() => scrollTo('services')}>
                  Explore HPHRMS AI
                </Button>
              </div>

              <div className="mt-12 flex flex-wrap items-center gap-6 text-sm text-gray-300">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" style={{ color: '#D4AF37' }} />
                  <span>GSTIN: {BRAND.gstin}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4" style={{ color: '#D4AF37' }} />
                  <span>UDYAM Registered</span>
                </div>
                <div className="flex items-center gap-2">
                  <Globe2 className="h-4 w-4" style={{ color: '#D4AF37' }} />
                  <span>Pan India Operations</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          TRUST BADGES STRIP
         ══════════════════════════════════════════════════════════════════════ */}
      <section className="py-5 bg-white border-b border-gray-100" aria-label="Trust indicators">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2.5">
            {TRUST_BADGES.map((badge, i) => (
              <Reveal key={i} delay={i * 0.03}>
                <div className="flex items-center gap-1.5 text-sm text-gray-500 font-medium">
                  <Check className="h-3.5 w-3.5 text-emerald-500" />{badge}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          SERVICES — Clickable Cards with Detail Modals
         ══════════════════════════════════════════════════════════════════════ */}
      <section id="services" className="py-20 sm:py-24 bg-gray-50" aria-label="Our services">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center mb-14">
              <Badge className="mb-4 px-4 py-1 text-sm" style={{ background: 'rgba(0,43,92,0.06)', color: '#002B5C', border: '1px solid rgba(0,43,92,0.1)' }}>Enterprise Solutions</Badge>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight">
                Comprehensive
                <br />
                <span style={{ color: '#002B5C' }}>Business Services</span>
              </h2>
              <p className="mt-4 text-gray-500 max-w-2xl mx-auto text-lg">
                From HR management to engineering support — we deliver end-to-end workforce solutions. Click any service to learn more.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICE_DETAILS.map((service, i) => {
              const Icon = service.icon
              return (
                <Reveal key={service.title} delay={i * 0.08}>
                  <motion.div
                    whileHover={{ y: -6 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="group relative bg-white rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-shadow duration-300 border border-gray-100 h-full"
                    onClick={() => openServiceModal(service)}
                  >
                    {/* Image header */}
                    <div className="relative h-48 overflow-hidden">
                      <Image src={service.image} alt={service.title} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                      <div className="absolute bottom-3 left-4">
                        <div className="h-10 w-10 rounded-xl flex items-center justify-center shadow-lg" style={{ background: '#D4AF37' }}>
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                      </div>
                      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm text-xs font-semibold text-gray-800 flex items-center gap-1">
                          <Eye className="h-3 w-3" />View Details
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#002B5C] transition-colors mb-2">{service.title}</h3>
                      <p className="text-sm text-gray-500 leading-relaxed mb-4">{service.short}</p>
                      <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: '#002B5C' }}>
                        Learn more <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>

                    {/* Bottom accent line */}
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#002B5C] to-[#D4AF37] scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
                  </motion.div>
                </Reveal>
              )
            })}
          </div>

          {/* All services grid below */}
          <Reveal>
            <div className="mt-14">
              <h3 className="text-lg font-bold text-gray-900 mb-6 text-center">All Services</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {SERVICES.map((service, i) => (
                  <div key={service} className="flex items-center gap-3 p-3 rounded-xl hover:bg-white hover:shadow-sm transition-all duration-200 cursor-default border border-transparent hover:border-gray-100">
                    <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#002B5C' }}>
                      <Check className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-sm font-medium text-gray-700">{service}</span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          HPHRMS FEATURES
         ══════════════════════════════════════════════════════════════════════ */}
      <section id="features" className="py-20 sm:py-24 bg-white" aria-label="HPHRMS Features">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center mb-14">
              <Badge className="mb-4 px-4 py-1 text-sm" style={{ background: 'rgba(212,175,55,0.1)', color: '#92780a', border: '1px solid rgba(212,175,55,0.2)' }}>Product Features</Badge>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight">
                Everything You Need to
                <br />
                <span style={{ color: '#002B5C' }}>Run HR Smarter</span>
              </h2>
              <p className="mt-4 text-gray-500 max-w-2xl mx-auto text-lg">Powerful modules designed for modern Indian enterprises — from hiring to payroll, all powered by AI.</p>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {HPHRMS_FEATURES.map((feature, i) => {
              const Icon = FEATURE_ICONS[i] || Zap
              return (
                <Reveal key={i} delay={i * 0.04}>
                  <div className="group relative p-6 rounded-2xl bg-gray-50 border border-gray-100 hover:bg-white hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-default">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl mb-4" style={{ background: '#002B5C' }}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 group-hover:text-[#002B5C] transition-colors">{feature}</h3>
                    <p className="mt-1.5 text-sm text-gray-500 leading-relaxed">Streamline your {feature.toLowerCase()} with intelligent automation and real-time insights.</p>
                    <div className="absolute bottom-0 left-6 right-6 h-0.5 bg-gradient-to-r from-[#002B5C] to-[#D4AF37] scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left rounded-full" />
                  </div>
                </Reveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          WHY HPHRMS — Trust & Credibility
         ══════════════════════════════════════════════════════════════════════ */}
      <section className="py-16 bg-white" style={{ background: 'linear-gradient(160deg, #001A3D 0%, #002B5C 50%, #0A4488 100%)' }} aria-label="Why HPHRMS">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <Reveal>
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Trusted by Businesses
                <br />
                <span style={{ color: '#D4AF37' }}>Across India</span>
              </h2>
              <p className="mt-4 text-gray-300 max-w-2xl mx-auto text-lg">Growing with every successful project and satisfied client. We deliver results, not promises.</p>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Building2, title: 'Registered Business', desc: 'GSTIN & UDYAM certified enterprise', value: BRAND.gstin },
              { icon: ShieldCheck, title: 'Enterprise Security', desc: 'Role-based access, encrypted data, audit trails', value: null },
              { icon: Bot, title: 'AI-Powered Platform', desc: 'Smart automation for HR, payroll & compliance', value: null },
              { icon: Headphones, title: 'Dedicated Support', desc: 'Direct access to our team via phone, email & WhatsApp', value: BRAND.phone },
            ].map((item, i) => (
              <Reveal key={i} delay={i * 0.1}>
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300 text-center">
                  <div className="h-12 w-12 mx-auto mb-4 rounded-xl flex items-center justify-center" style={{ background: 'rgba(212,175,55,0.15)' }}>
                    <item.icon className="h-6 w-6" style={{ color: '#D4AF37' }} />
                  </div>
                  <h3 className="text-base font-bold text-white mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
                  {item.value && <p className="mt-2 text-xs font-mono text-gray-500">{item.value}</p>}
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          PRICING
         ══════════════════════════════════════════════════════════════════════ */}
      <section id="pricing" className="py-20 sm:py-24 bg-gray-50" aria-label="Pricing plans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center mb-14">
              <Badge className="mb-4 px-4 py-1 text-sm" style={{ background: 'rgba(212,175,55,0.1)', color: '#92780a', border: '1px solid rgba(212,175,55,0.2)' }}>Simple Pricing</Badge>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight">
                Plans That
                <br />
                <span style={{ color: '#002B5C' }}>Scale With You</span>
              </h2>
              <p className="mt-4 text-gray-500 max-w-2xl mx-auto text-lg">Start free. Upgrade as you grow. No hidden fees.</p>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PRICING_PLANS.map((plan, i) => (
              <Reveal key={plan.name} delay={i * 0.1}>
                <div className={cn('relative rounded-2xl p-6 h-full flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-xl', plan.popular ? 'bg-[#002B5C] text-white shadow-2xl scale-[1.02]' : 'bg-white border border-gray-200 shadow-sm')}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider" style={{ background: '#D4AF37', color: '#002B5C' }}>Most Popular</div>
                  )}
                  <div className="mb-6">
                    <h3 className={cn('text-lg font-bold mb-1', plan.popular ? 'text-white' : 'text-gray-900')}>{plan.name}</h3>
                    <p className={cn('text-sm', plan.popular ? 'text-gray-300' : 'text-gray-500')}>{plan.description}</p>
                  </div>
                  <div className="mb-6">
                    <span className={cn('text-4xl font-extrabold', plan.popular ? 'text-white' : 'text-gray-900')}>{plan.price}</span>
                    {plan.period && <span className={cn('text-sm ml-1', plan.popular ? 'text-gray-400' : 'text-gray-500')}>{plan.period}</span>}
                  </div>
                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <Check className={cn('h-4 w-4 mt-0.5 shrink-0', plan.popular ? 'text-[#D4AF37]' : 'text-emerald-500')} />
                        <span className={plan.popular ? 'text-gray-200' : 'text-gray-600'}>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button className={cn('w-full font-semibold rounded-xl h-11', plan.popular ? 'text-[#002B5C]' : '')} style={!plan.popular ? { background: '#002B5C', color: '#fff' } : { background: '#D4AF37' }} onClick={() => setView('subscribe')}>
                    {plan.price === 'Custom' ? 'Contact Sales' : 'Get Started'}
                  </Button>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          PORTAL ACCESS CARDS
         ══════════════════════════════════════════════════════════════════════ */}
      <section id="portals" className="py-20 sm:py-24 bg-white" aria-label="Portal access">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center mb-14">
              <Badge className="mb-4 px-4 py-1 text-sm" style={{ background: 'rgba(0,43,92,0.06)', color: '#002B5C', border: '1px solid rgba(0,43,92,0.1)' }}>Portal Access</Badge>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight">
                Your Dedicated
                <br />
                <span style={{ color: '#002B5C' }}>Workspace Awaits</span>
              </h2>
              <p className="mt-4 text-gray-500 max-w-xl mx-auto text-lg">Select your portal to get started.</p>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {PORTALS.map((portal, i) => (
              <Reveal key={portal.id} delay={i * 0.12}>
                <motion.div whileHover={{ y: -6 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
                  <div
                    className="group relative rounded-2xl overflow-hidden cursor-pointer border border-gray-100 hover:shadow-xl transition-all duration-300 h-full"
                    style={{ background: 'linear-gradient(160deg, #001A3D, #002B5C)' }}
                    onClick={() => setView(portal.id)}
                  >
                    <div className="relative z-10 p-8">
                      <div className="h-12 w-12 rounded-xl flex items-center justify-center mb-5" style={{ background: '#D4AF37' }}>
                        <portal.icon className="h-6 w-6" style={{ color: '#002B5C' }} />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">{portal.title}</h3>
                      <p className="text-sm text-gray-300 mb-6">{portal.description}</p>
                      <ul className="space-y-2.5">
                        {portal.features.map((f) => (
                          <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                            <Check className="h-3.5 w-3.5 shrink-0" style={{ color: '#D4AF37' }} />{f}
                          </li>
                        ))}
                      </ul>
                      <div className="mt-6 flex items-center gap-2 text-sm font-semibold group-hover:gap-3 transition-all duration-300" style={{ color: '#D4AF37' }}>
                        Access Portal <ArrowRight className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          CONTACT SECTION
         ══════════════════════════════════════════════════════════════════════ */}
      <section id="contact" className="py-20 sm:py-24 bg-gray-50" aria-label="Contact us">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center mb-14">
              <Badge className="mb-4 px-4 py-1 text-sm" style={{ background: 'rgba(0,43,92,0.06)', color: '#002B5C', border: '1px solid rgba(0,43,92,0.1)' }}>Get In Touch</Badge>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight">
                Let&apos;s Build Something
                <br />
                <span style={{ color: '#002B5C' }}>Great Together</span>
              </h2>
              <p className="mt-4 text-gray-500 max-w-xl mx-auto text-lg">Reach out to us for demos, inquiries, or partnership opportunities.</p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <Reveal direction="left">
              <div className="space-y-4">
                {[
                  { icon: Phone, label: 'Call Us', value: BRAND.phone, href: `tel:${BRAND.phone}` },
                  { icon: Phone, label: 'HR Helpline', value: BRAND.hrPhone, href: `tel:${BRAND.hrPhone}` },
                  { icon: Mail, label: 'Email Us', value: BRAND.email, href: `mailto:${BRAND.email}` },
                  { icon: Globe2, label: 'Website', value: BRAND.website, href: BRAND.website },
                  { icon: MapPin, label: 'Head Office', value: BRAND.headOffice.full, href: `https://maps.google.com/?q=${encodeURIComponent(BRAND.headOffice.full)}` },
                  { icon: MapPin, label: 'Branch Office', value: BRAND.branchOffice.full, href: `https://maps.google.com/?q=${encodeURIComponent(BRAND.branchOffice.full)}` },
                ].map((item, i) => (
                  <a key={i} href={item.href} target={item.href.startsWith('http') ? '_blank' : undefined} rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined} className="flex items-start gap-4 p-4 rounded-xl bg-white border border-gray-100 hover:shadow-md transition-all duration-200 group">
                    <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(0,43,92,0.06)' }}>
                      <item.icon className="h-5 w-5" style={{ color: '#002B5C' }} />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{item.label}</div>
                      <div className="text-sm font-medium text-gray-800 group-hover:text-[#002B5C] transition-colors leading-relaxed">{item.value}</div>
                    </div>
                  </a>
                ))}

                <div className="pt-4">
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Connect With Us</div>
                  <div className="flex flex-wrap gap-2">
                    {SOCIAL_ITEMS.map((s) => (
                      <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className="h-10 w-10 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-110 hover:shadow-md bg-white border border-gray-100" style={{ color: s.color }} aria-label={s.label}>
                        <s.icon className="h-4 w-4" />
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </Reveal>

            <Reveal direction="right">
              <Card className="shadow-lg border-gray-100">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-gray-900">Send Us a Message</CardTitle>
                  <CardDescription className="text-gray-500">We typically respond within 24 hours.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={(e) => { e.preventDefault(); toast.success('Message sent! We will get back to you soon.') }} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2"><Label className="text-gray-700 text-sm font-medium">Name</Label><Input placeholder="Your name" /></div>
                      <div className="space-y-2"><Label className="text-gray-700 text-sm font-medium">Email</Label><Input type="email" placeholder="you@company.com" /></div>
                    </div>
                    <div className="space-y-2"><Label className="text-gray-700 text-sm font-medium">Subject</Label><Input placeholder="How can we help?" /></div>
                    <div className="space-y-2"><Label className="text-gray-700 text-sm font-medium">Message</Label><Textarea placeholder="Tell us about your requirements..." rows={4} /></div>
                    <Button type="submit" className="w-full h-11 font-semibold text-white rounded-xl" style={{ background: '#002B5C' }}>
                      <Send className="mr-2 h-4 w-4" />Send Message
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          FOOTER — Sticky to bottom
         ══════════════════════════════════════════════════════════════════════ */}
      <footer className="mt-auto bg-gray-900 text-gray-400" role="contentinfo">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {/* Brand */}
            <div className="lg:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <BrandLogo size={32} />
                <div className="flex flex-col">
                  <span className="font-extrabold text-sm text-white">HP ENTERPRISE</span>
                  <span className="text-[9px] font-medium tracking-widest uppercase text-gray-500">Building Safer Tomorrow</span>
                </div>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed mb-4">{BRAND.taglineFull}</p>
              <div className="flex flex-wrap gap-2">
                {SOCIAL_ITEMS.map((s) => (
                  <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className="h-8 w-8 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110 bg-gray-800" style={{ color: s.color }} aria-label={s.label}><s.icon className="h-3.5 w-3.5" /></a>
                ))}
              </div>
            </div>

            {/* Services */}
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Services</h4>
              <ul className="space-y-2.5">
                {SERVICES.slice(0, 6).map((s) => (
                  <li key={s}><span className="text-sm text-gray-400 hover:text-white transition-colors cursor-default">{s}</span></li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Legal & Compliance</h4>
              <ul className="space-y-2.5 text-sm text-gray-400">
                <li className="flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />GSTIN: {BRAND.gstin}</li>
                <li className="flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />PAN: {BRAND.pan}</li>
                <li className="flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />UDYAM: {BRAND.udyam}</li>
                <li className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-gray-500" />Bengaluru, Karnataka</li>
                <li className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-gray-500" />Chitradurga, Karnataka</li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Contact</h4>
              <ul className="space-y-2.5 text-sm text-gray-400">
                <li className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" />{BRAND.phone}</li>
                <li className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" />{BRAND.hrPhone}</li>
                <li className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" />{BRAND.email}</li>
                <li className="flex items-center gap-2"><Globe2 className="h-3.5 w-3.5" /><a href={BRAND.website} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">{BRAND.website}</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-gray-500">© {new Date().getFullYear()} HP ENTERPRISE. All rights reserved.</p>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span>Managing Director: {BRAND.managingDirector}</span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline">EHS Director: {BRAND.ehsDirector}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}