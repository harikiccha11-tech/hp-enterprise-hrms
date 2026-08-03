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
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import {
  Building2, ShieldCheck, Users, FileText, Clock, Wallet, ArrowRight, ArrowLeft, Lock, User as UserIcon,
  Sparkles, Crown, Check, Bot,
  CalendarDays, ClipboardList, BarChart3,
  Settings, UserCog, Zap, Shield, Bell, Star, Headphones, Send, Loader2,
  Phone, Mail, MapPin, ChevronRight, Menu, X, Award, Globe2,
  HardHat, Truck, DollarSign, MonitorSmartphone,
  type LucideIcon, Eye, Target, Wrench, UserPlus, Briefcase, FileUp, GraduationCap, Landmark, Search,
} from 'lucide-react'
import Image from 'next/image'

type LandingView = 'home' | 'register' | 'subscribe' | 'apply' | 'apply-pick' | 'portal-pick' | 'portal-login'

function InstagramIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
}
function LinkedInIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
}
function FacebookIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
}
function TwitterXIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
}
function YouTubeIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>
}
function ThreadsIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor"><path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.796-2.045 1.647-1.619 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.797-1.063-.684-1.685-1.74-1.752-2.976-.065-1.218.42-2.33 1.366-3.129.906-.763 2.143-1.192 3.678-1.274 1.062-.058 2.043.042 2.928.291-.082-.584-.262-1.058-.534-1.411-.4-.521-1.08-.838-2.077-.965l.249-2.022c1.45.178 2.556.713 3.287 1.591.505.605.847 1.37 1.024 2.281.936-.655 1.637-1.441 2.11-2.383.67-1.33.716-2.712.14-3.716-.68-1.19-2.282-1.868-4.505-2.012l.127-2.03c2.868.18 5.064 1.165 6.19 2.878.866 1.326.949 3.04.23 4.715-.48 1.126-1.258 2.078-2.32 2.857.084.228.16.465.226.714.31 1.157.27 3.395-1.7 5.327-1.766 1.735-3.868 2.58-6.42 2.6zM10.67 14.22c-.987.053-1.787.296-2.376.722-.566.41-.825.93-.79 1.5.033.58.35 1.07.895 1.42.47.295 1.077.434 1.712.4.954-.05 1.656-.38 2.139-.98.344-.425.576-1.01.7-1.75-.633-.147-1.34-.21-2.28-.312z"/></svg>
}
function RedditIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor"><path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/></svg>
}
function WhatsAppIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <svg className={className} style={style} viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
}

const SOCIAL_ITEMS: { label: string; icon: LucideIcon; href: string; color: string }[] = [
  { label: 'Website', icon: Globe2, href: SOCIAL.website, color: '#002B5C' },
  { label: 'HPHRMS', icon: MonitorSmartphone, href: SOCIAL.hphrms, color: '#002B5C' },
  { label: 'Instagram', icon: InstagramIcon, href: SOCIAL.instagram, color: '#E4405F' },
  { label: 'Threads', icon: ThreadsIcon, href: SOCIAL.threads, color: '#000000' },
  { label: 'LinkedIn', icon: LinkedInIcon, href: SOCIAL.linkedin, color: '#0A66C2' },
  { label: 'Facebook', icon: FacebookIcon, href: SOCIAL.facebook, color: '#1877F2' },
  { label: 'Twitter / X', icon: TwitterXIcon, href: SOCIAL.twitter, color: '#000000' },
  { label: 'YouTube', icon: YouTubeIcon, href: SOCIAL.youtube, color: '#FF0000' },
  { label: 'Reddit', icon: RedditIcon, href: SOCIAL.reddit, color: '#FF4500' },
  { label: 'WhatsApp', icon: WhatsAppIcon, href: SOCIAL.whatsapp, color: '#25D366' },
]

interface ServiceDetail {
  title: string; short: string; icon: LucideIcon; image: string
  description: string; benefits: string[]; industries: string[]; process: string[]
}

const SERVICE_DETAILS: ServiceDetail[] = [
  { title: 'Human Resource Management', short: 'Complete workforce lifecycle management powered by AI', icon: Users, image: '/service-hr.png',
    description: 'Our comprehensive HR management service covers the entire employee lifecycle from onboarding to exit. We handle employee records, performance tracking, policy compliance, and organizational development.',
    benefits: ['End-to-end employee lifecycle management', 'AI-powered performance analytics', 'Compliance with Indian labour laws', 'Employee engagement & retention programs', 'Organizational structure optimization'],
    industries: ['IT & Technology', 'Construction & Infrastructure', 'Manufacturing', 'Healthcare', 'BFSI'],
    process: ['Workforce assessment & planning', 'HR policy design & implementation', 'Employee onboarding & documentation', 'Ongoing HR operations & support', 'Performance reviews & analytics'],
  },
  { title: 'Recruitment & Talent Acquisition', short: 'End-to-end hiring pipeline with smart screening', icon: Target, image: '/service-recruitment.png',
    description: 'We manage the complete recruitment cycle from job posting and candidate sourcing to interviewing, offer negotiation, and onboarding. Our AI-powered ATS helps you find the right talent faster.',
    benefits: ['AI-powered applicant tracking system (ATS)', 'Multi-channel candidate sourcing', 'Structured interview frameworks', 'Background verification support', 'Faster time-to-hire with smart screening'],
    industries: ['IT & Technology', 'Construction', 'Manufacturing', 'Healthcare', 'BFSI', 'Logistics'],
    process: ['Requirement gathering & job description', 'Candidate sourcing & screening', 'Interview coordination & assessment', 'Offer negotiation & acceptance', 'Onboarding & documentation'],
  },
  { title: 'Safety (EHS) Consultancy', short: 'Environmental, Health & Safety compliance solutions', icon: HardHat, image: '/service-safety.png',
    description: 'Our EHS consultancy ensures your organization meets all safety regulations and standards. From safety audits to training programs, we build a culture of safety at your workplace.',
    benefits: ['Comprehensive safety audits & inspections', 'Regulatory compliance management', 'Safety training & certification programs', 'Incident investigation & reporting', 'Emergency response planning'],
    industries: ['Construction', 'Manufacturing', 'Oil & Gas', 'Chemical Plants', 'Mining', 'Infrastructure'],
    process: ['Site assessment & hazard identification', 'Safety audit & gap analysis', 'Compliance plan development', 'Training implementation', 'Ongoing monitoring & support'],
  },
  { title: 'Engineering & Project Support', short: 'Multi-discipline engineering for construction & industrial projects', icon: Wrench, image: '/service-engineering.png',
    description: 'We provide skilled engineering professionals across all disciplines for construction, industrial, and infrastructure projects.',
    benefits: ['Multi-discipline engineering professionals', 'Project planning & scheduling support', 'Quality assurance & quality control', 'Construction management services', 'Technical documentation & reporting'],
    industries: ['Construction', 'Infrastructure', 'Industrial Plants', 'Oil & Gas', 'Power Generation', 'Metro & Rail'],
    process: ['Project requirement analysis', 'Resource planning & deployment', 'Engineering execution & monitoring', 'Quality control & documentation', 'Project handover & close-out'],
  },
  { title: 'Payroll Management', short: 'Accurate, compliant payroll processing for your workforce', icon: Wallet, image: '/service-payroll.png',
    description: 'Our payroll management service handles salary processing, statutory compliance (PF, ESI, PT, TDS), and payslip generation.',
    benefits: ['Timely monthly payroll processing', 'Statutory compliance (PF, ESI, PT, TDS)', 'Automated payslip generation', 'Leave & attendance integration', 'Year-end tax forms (Form 16)'],
    industries: ['All Industries', 'IT & Technology', 'Construction', 'Manufacturing', 'Healthcare'],
    process: ['Employee data verification', 'Attendance & leave processing', 'Salary calculation & statutory deductions', 'Payslip generation & distribution', 'Compliance filing & reporting'],
  },
  { title: 'Manpower Supply', short: 'Skilled & unskilled workforce deployment across India', icon: Truck, image: '/service-manpower.png',
    description: 'We supply skilled, semi-skilled, and unskilled manpower for construction, industrial, and service sectors across India.',
    benefits: ['Pan-India manpower deployment', 'Skilled & unskilled workforce', 'Rapid mobilization capability', 'Compliance-managed staffing', 'Flexible contract durations'],
    industries: ['Construction', 'Manufacturing', 'Logistics', 'Hospitality', 'Facility Management', 'Security Services'],
    process: ['Workforce requirement assessment', 'Candidate sourcing & screening', 'Documentation & compliance', 'Deployment & orientation', 'Ongoing management & support'],
  },
]

interface PortalConfig {
  id: string; title: string; description: string; icon: LucideIcon
  features: string[]; role: string; color: string; requestAccess?: boolean
}

const PORTALS: PortalConfig[] = [
  { id: 'owner', title: 'Owner Dashboard', description: 'Full system ownership with billing, company settings, and complete control over all modules.',
    icon: Crown, role: 'OWNER', color: '#D4AF37',
    features: ['Company Settings & Branding', 'Billing & Subscription Management', 'User & Role Management', 'Audit Logs & Activity Reports', 'System Configuration'],
  },
  { id: 'admin', title: 'Admin Console', description: 'Complete HR & workforce management dashboard with full operational control.',
    icon: Shield, role: 'SUPER_ADMIN', color: '#002B5C',
    features: ['Employee Management', 'Payroll & Attendance', 'Recruitment & ATS', 'Reports & Analytics', 'Document Management', 'Shift & Roster Management'],
  },
  { id: 'hr', title: 'HR Manager Portal', description: 'Day-to-day HR operations including recruitment, onboarding, and employee management.',
    icon: UserCog, role: 'HR_MANAGER', color: '#0A4488',
    features: ['Employee Onboarding', 'Leave Management', 'Recruitment Pipeline', 'Performance Tracking', 'Employee Grievances', 'Policy Management'],
  },
  { id: 'employee', title: 'Employee Portal', description: 'Self-service portal for all employees to manage their work life.',
    icon: UserIcon, role: 'EMPLOYEE', color: '#166534',
    features: ['View Payslips', 'Apply Leaves', 'Attendance History', 'Document Downloads', 'Profile Management', 'Task & Assignment View'],
  },
  { id: 'client', title: 'Client Portal', description: 'Dedicated access for business clients to track workforce and invoices.',
    icon: Building2, role: 'CLIENT', color: '#7C2D12',
    features: ['Workforce Dashboard', 'Invoice Management', 'Project Tracking', 'Compliance Reports', 'Support Tickets'],
  },
  { id: 'recruitment', title: 'Recruitment Portal', description: 'AI-powered recruitment portal for candidates and hiring managers.',
    icon: Target, role: 'CANDIDATE', color: '#6D28D9',
    features: ['Job Search & Apply', 'Application Tracking', 'Interview Scheduling', 'Offer Management', 'Candidate Assessment'], requestAccess: true,
  },
  { id: 'ehs', title: 'EHS Safety Portal', description: 'Safety compliance management, incident reporting, and audit tracking.',
    icon: HardHat, role: 'EHS', color: '#B45309',
    features: ['Safety Audit Management', 'Incident Reporting', 'Compliance Tracking', 'Safety Training Records', 'PPE Management', 'Emergency Protocols'], requestAccess: true,
  },
  { id: 'payroll', title: 'Payroll Portal', description: 'Dedicated payroll processing, statutory compliance, and salary management.',
    icon: DollarSign, role: 'FINANCE', color: '#0369A1',
    features: ['Salary Processing', 'PF/ESI/TDS Filing', 'Payslip Generation', 'Reimbursement Management', 'Tax Reports (Form 16)', 'Bank Integration'], requestAccess: true,
  },
  { id: 'manpower', title: 'Manpower Supply Portal', description: 'Manpower deployment tracking, vendor management, and workforce allocation.',
    icon: Truck, role: 'VENDOR', color: '#4338CA',
    features: ['Workforce Deployment', 'Vendor Management', 'Attendance & Billing', 'Contract Management', 'Site Allocation', 'Compliance Documents'], requestAccess: true,
  },
  { id: 'engineering', title: 'Engineering Portal', description: 'Engineering project support, resource planning, and discipline tracking.',
    icon: Wrench, role: 'MANAGER', color: '#0F766E',
    features: ['Project Resource Planning', 'Discipline Tracking', 'Site Progress Reports', 'QA/QC Management', 'Technical Documentation', 'Billing & Measurement'], requestAccess: true,
  },
]

interface PricingPlan { name: string; price: string; period: string; description: string; popular?: boolean; features: string[] }

const PRICING_PLANS: PricingPlan[] = [
  { name: 'Starter', price: '₹4,999', period: '/month', description: 'For small businesses getting started with HR digitization.', features: ['Up to 50 Employees', 'Basic HR Management', 'Attendance Tracking', 'Leave Management', 'Payslip Generation', 'Email Support'] },
  { name: 'Professional', price: '₹14,999', period: '/month', description: 'For growing companies that need complete workforce management.', popular: true, features: ['Up to 500 Employees', 'All Starter Features', 'Recruitment & ATS', 'Payroll Processing', 'PF/ESI Compliance', 'Multi-Branch Support', 'Reports & Analytics', 'Priority Support'] },
  { name: 'Enterprise', price: 'Custom', period: '', description: 'For large organizations with complex workforce requirements.', features: ['Unlimited Employees', 'All Professional Features', 'API Management', 'Custom Integrations', 'Dedicated Account Manager', 'SLA Guarantee', 'On-Premise Option', '24/7 Phone Support'] },
]

const LUXURY_EASE = [0.22, 1, 0.36, 1] as const

function Reveal({ children, delay = 0, direction = 'up', className = '' }: { children: React.ReactNode; delay?: number; direction?: 'up' | 'left' | 'right'; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-40px' })
  const offsets = { up: { y: 50, x: 0 }, left: { y: 0, x: -50 }, right: { y: 0, x: 50 } }
  return (
    <motion.div ref={ref} className={className}
      initial={{ opacity: 0, ...offsets[direction] }}
      animate={isInView ? { opacity: 1, x: 0, y: 0 } : { opacity: 0, ...offsets[direction] }}
      transition={{ duration: 0.8, delay, ease: LUXURY_EASE }}
    >
      {children}
    </motion.div>
  )
}

function SocialSideMenu() {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="fixed left-0 top-1/2 -translate-y-1/2 z-50 flex items-center">
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 'auto', opacity: 1 }} exit={{ width: 0, opacity: 0 }}
            className="overflow-hidden bg-white/95 backdrop-blur-md shadow-2xl rounded-r-2xl border border-l-0 border-gray-200"
          >
            <div className="flex flex-col py-3 px-2 gap-1">
              {SOCIAL_ITEMS.map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors whitespace-nowrap" aria-label={s.label}>
                  <s.icon className="h-4 w-4 shrink-0" style={{ color: s.color }} />
                  <span className="text-gray-800 font-semibold">{s.label}</span>
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <button onClick={() => setExpanded(!expanded)}
        className="h-11 w-11 rounded-r-2xl bg-white shadow-xl border border-l-0 border-gray-200 flex items-center justify-center text-gray-600 hover:text-gray-900 transition-all duration-300"
        aria-label={expanded ? 'Close social menu' : 'Open social menu'}>
        {expanded ? <X className="h-4 w-4" /> : <Globe2 className="h-4 w-4" />}
      </button>
    </div>
  )
}

function ServiceModal({ service, open, onClose }: { service: ServiceDetail | null; open: boolean; onClose: () => void }) {
  if (!service) return null
  const Icon = service.icon
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[100] flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
          <motion.div className="relative z-10 bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            initial={{ scale: 0.92, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.92, opacity: 0, y: 30 }}
            transition={{ type: 'spring', stiffness: 280, damping: 28 }}>
            <div className="relative h-52 sm:h-60 overflow-hidden rounded-t-3xl">
              <Image src={service.image} alt={service.title} fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
              <button onClick={onClose} className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/40 transition-colors">
                <X className="h-5 w-5" />
              </button>
              <div className="absolute bottom-5 left-6 flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: '#D4AF37' }}>
                  <Icon className="h-6 w-6" style={{ color: '#002B5C' }} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{service.title}</h3>
                  <p className="text-sm text-gray-200 font-medium">{service.short}</p>
                </div>
              </div>
            </div>
            <div className="p-7 space-y-6">
              <p className="text-gray-800 leading-relaxed font-medium">{service.description}</p>
              <div>
                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Key Benefits</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {service.benefits.map((b) => (
                    <div key={b} className="flex items-start gap-2 text-sm text-gray-700 font-medium"><Check className="h-4 w-4 mt-0.5 shrink-0 text-emerald-600" />{b}</div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Industries We Serve</h4>
                <div className="flex flex-wrap gap-2">
                  {service.industries.map((ind) => (<Badge key={ind} variant="outline" className="text-xs font-semibold border-gray-200 text-gray-700">{ind}</Badge>))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Our Process</h4>
                <ol className="space-y-3">
                  {service.process.map((step, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="flex-shrink-0 h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: '#002B5C' }}>{i + 1}</span>
                      <span className="text-sm text-gray-700 font-medium pt-0.5">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <a href={SOCIAL.whatsapp} target="_blank" rel="noopener noreferrer" className="flex-1 h-12 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold text-white transition-all hover:opacity-90" style={{ background: '#25D366' }}>
                  <WhatsAppIcon className="h-4 w-4" />Chat on WhatsApp
                </a>
                <a href={`tel:${BRAND.phone}`} className="flex-1 h-12 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold text-white transition-all hover:opacity-90" style={{ background: '#002B5C' }}>
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

function SubscriptionForm({ onBack }: { onBack: () => void }) {
  const [form, setForm] = useState({ companyName: '', contactName: '', email: '', phone: '', address: '', plan: '', employeeCount: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const update = (f: string, v: string) => setForm((p) => ({ ...p, [f]: v }))
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
  if (sent) return (
    <section className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <Card className="shadow-xl max-w-md w-full text-center"><CardContent className="py-12">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50"><Check className="h-8 w-8 text-emerald-600" /></div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Submitted!</h2>
        <p className="text-gray-600 mb-6 font-medium">Our team will contact you within 24 hours.</p>
        <Button onClick={onBack} style={{ background: '#002B5C' }} className="text-white font-bold">Back to Home</Button>
      </CardContent></Card>
    </section>
  )
  return (
    <section className="min-h-screen py-20 px-4 bg-gray-50">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <Badge className="mb-4 px-4 py-1 text-sm font-bold" style={{ background: '#D4AF37', color: '#002B5C' }}>Get Started</Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900">Request a Subscription</h2>
          <p className="text-gray-600 mt-2 font-medium">Fill in the details and our team will reach out to you.</p>
        </div>
        <Card className="shadow-lg"><CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="text-gray-800 text-sm font-bold">Company Name *</Label><Input placeholder="Your company" value={form.companyName} onChange={(e) => update('companyName', e.target.value)} /></div>
              <div className="space-y-2"><Label className="text-gray-800 text-sm font-bold">Contact Name *</Label><Input placeholder="Full name" value={form.contactName} onChange={(e) => update('contactName', e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="text-gray-800 text-sm font-bold">Email *</Label><Input type="email" placeholder="email@company.com" value={form.email} onChange={(e) => update('email', e.target.value)} /></div>
              <div className="space-y-2"><Label className="text-gray-800 text-sm font-bold">Phone *</Label><Input placeholder="+91 XXXXX XXXXX" value={form.phone} onChange={(e) => update('phone', e.target.value)} /></div>
            </div>
            <div className="space-y-2"><Label className="text-gray-800 text-sm font-bold">Address</Label><Input placeholder="Office address" value={form.address} onChange={(e) => update('address', e.target.value)} /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="text-gray-800 text-sm font-bold">Plan</Label>
                <select value={form.plan} onChange={(e) => update('plan', e.target.value)} className="w-full h-11 rounded-md border border-gray-200 bg-white px-3 text-sm font-medium">
                  <option value="">Select plan</option><option value="free">Free</option><option value="starter">Starter</option><option value="professional">Professional</option><option value="enterprise">Enterprise</option>
                </select>
              </div>
              <div className="space-y-2"><Label className="text-gray-800 text-sm font-bold">Employee Count</Label><Input placeholder="e.g. 50" value={form.employeeCount} onChange={(e) => update('employeeCount', e.target.value)} /></div>
            </div>
            <div className="space-y-2"><Label className="text-gray-800 text-sm font-bold">Message</Label><Textarea placeholder="Tell us about your requirements..." rows={3} value={form.message} onChange={(e) => update('message', e.target.value)} /></div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" className="flex-1 h-11 font-bold text-white" style={{ background: '#002B5C' }} disabled={loading}>{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}Submit Request</Button>
              <Button type="button" variant="outline" onClick={onBack} className="font-bold">Cancel</Button>
            </div>
          </form>
        </CardContent></Card>
      </div>
    </section>
  )
}

const APPLY_OPTIONS = [
  { id: 'general', title: 'General Application', description: 'Apply for any open position at HP Enterprise', icon: UserPlus, color: '#002B5C', tag: 'All Departments' },
  { id: 'recruitment', title: 'Recruitment Portal', description: 'Join our recruitment and talent acquisition team', icon: Target, color: '#6D28D9', tag: 'HR & Recruitment' },
  { id: 'ehs', title: 'EHS Safety Portal', description: 'Join the Environment, Health & Safety division', icon: HardHat, color: '#B45309', tag: 'Safety' },
  { id: 'payroll', title: 'Payroll Portal', description: 'Join the payroll processing and finance team', icon: DollarSign, color: '#0369A1', tag: 'Finance' },
  { id: 'manpower', title: 'Manpower Supply Portal', description: 'Join workforce deployment and vendor management', icon: Truck, color: '#4338CA', tag: 'Operations' },
  { id: 'engineering', title: 'Engineering Portal', description: 'Join engineering project support and planning', icon: Wrench, color: '#0F766E', tag: 'Engineering' },
]

function SinglePortalLoginView({ portalId, onBack, onApply }: { portalId: string; onBack: () => void; onApply: () => void }) {
  const portal = PORTALS.find((p) => p.id === portalId)
  const { setUser } = useAppStore()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showForgot, setShowForgot] = useState(false)
  const [forgotOpen, setForgotOpen] = useState(false)
  if (!portal) return <div>Portal not found</div>
  const Icon = portal.icon
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password.trim()) { toast.error('Please enter username and password'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: username.trim(), password, role: portal.role }) })
      const data = await res.json()
      if (res.ok && data.user) { setUser(data.user); toast.success(`Welcome to ${portal.title}!`) }
      else { toast.error(data.error || 'Login failed. Please check your credentials.') }
    } catch { toast.error('Network error. Please try again.') } finally { setLoading(false) }
  }
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white">
      <header className="sticky top-0 z-40 border-b bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <BrandLogo />
          <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft className="mr-1 h-4 w-4" /> All Portals</Button>
        </div>
      </header>
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: LUXURY_EASE }} className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="mx-auto mb-4 h-16 w-16 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: portal.color }}>
              <Icon className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900 mb-1">{portal.title}</h1>
            <p className="text-sm text-gray-500 font-medium">Sign in to access your {portal.title}</p>
          </div>
          <Card className="shadow-xl border-gray-200">
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="portal-username" className="text-gray-800 text-xs font-bold uppercase tracking-wider">Username</Label>
                  <Input id="portal-username" placeholder="Enter your username" value={username} onChange={(e) => setUsername(e.target.value)} className="h-12 text-sm" autoComplete="username" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="portal-password" className="text-gray-800 text-xs font-bold uppercase tracking-wider">Password</Label>
                    <button type="button" onClick={() => setForgotOpen(true)} className="text-[11px] font-bold hover:underline" style={{ color: portal.color }}>Forgot Password?</button>
                  </div>
                  <Input id="portal-password" type="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 text-sm" autoComplete="current-password" />
                </div>
                <Button type="submit" className="w-full h-12 font-bold text-sm text-white" style={{ background: portal.color }} disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}Sign In to {portal.title}
                </Button>
              </form>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-[11px] text-gray-400 font-bold uppercase">or</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <a href={SOCIAL.whatsapp} target="_blank" rel="noopener noreferrer" className="h-10 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold text-white transition-all hover:opacity-90" style={{ background: '#25D366' }}>
                  <WhatsAppIcon className="h-3.5 w-3.5" />WhatsApp
                </a>
                <a href={`tel:${BRAND.phone}`} className="h-10 rounded-xl flex items-center justify-center gap-1.5 text-xs font-bold text-white transition-all hover:opacity-90" style={{ background: portal.color }}>
                  <Phone className="h-3.5 w-3.5" />Call Support
                </a>
              </div>
              {portal.requestAccess && (
                <div className="mt-4 rounded-xl bg-amber-50 border border-amber-200/60 p-4">
                  <p className="text-xs font-bold text-gray-800 mb-2">Don&apos;t have an account?</p>
                  <Button onClick={onApply} className="w-full h-10 font-bold text-sm text-white" style={{ background: '#166534' }}>
                    <UserPlus className="mr-2 h-4 w-4" />Apply to Join {portal.title}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
          <div className="mt-6 flex flex-wrap gap-1.5 justify-center">
            {portal.features.map((f) => (
              <span key={f} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-gray-200 text-[10px] font-bold text-gray-500">
                <Check className="h-2.5 w-2.5" style={{ color: portal.color }} />{f}
              </span>
            ))}
          </div>
          <p className="mt-4 text-center text-[11px] text-gray-400 font-medium">{BRAND.name} &middot; GSTIN: {BRAND.gstin}</p>
          <ForgotPasswordDialog open={forgotOpen} onOpenChange={setForgotOpen} />
        </motion.div>
      </div>
    </div>
  )
}

function PortalPickerView({ onPick, onBack }: { onPick: (title: string) => void; onBack: () => void }) {
  const [hovered, setHovered] = useState<string | null>(null)
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white">
      <header className="sticky top-0 z-40 border-b bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <BrandLogo />
          <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft className="mr-1 h-4 w-4" /> Back to Home</Button>
        </div>
      </header>
      <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:py-16">
        <div className="text-center mb-10">
          <Badge className="mb-4 px-4 py-1 text-sm font-bold" style={{ background: '#D4AF37', color: '#002B5C' }}><UserPlus className="h-3.5 w-3.5 mr-1.5" />Join HP Enterprise</Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">Where Do You Want to Join?</h1>
          <p className="text-gray-600 text-lg font-medium max-w-2xl mx-auto">Select the department or portal you are applying for. You will fill a complete onboarding form with all your details and documents.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {APPLY_OPTIONS.map((opt) => {
            const Icon = opt.icon
            const isHovered = hovered === opt.id
            return (
              <motion.button key={opt.id}
                onClick={() => onPick(opt.title)}
                onMouseEnter={() => setHovered(opt.id)}
                onMouseLeave={() => setHovered(null)}
                whileHover={{ y: -4, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="relative text-left rounded-2xl border-2 bg-white p-6 shadow-sm transition-all duration-300 group cursor-pointer"
                style={{ borderColor: isHovered ? opt.color : '#E5E7EB', boxShadow: isHovered ? `0 10px 30px ${opt.color}20` : undefined }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="h-14 w-14 rounded-2xl flex items-center justify-center shadow-md" style={{ background: opt.color }}>
                    <Icon className="h-7 w-7 text-white" />
                  </div>
                  <Badge variant="outline" className="text-[10px] font-bold px-2 py-0.5" style={{ borderColor: `${opt.color}40`, color: opt.color }}>{opt.tag}</Badge>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1.5">{opt.title}</h3>
                <p className="text-sm text-gray-500 font-medium leading-relaxed mb-4">{opt.description}</p>
                <div className="flex items-center gap-1.5 text-sm font-bold" style={{ color: opt.color }}>
                  Select & Fill Application <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </motion.button>
            )
          })}
        </div>
        <div className="mt-10 rounded-2xl bg-amber-50 border border-amber-200/60 p-6">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#D4AF37' }}><ClipboardList className="h-5 w-5" style={{ color: '#002B5C' }} /></div>
            <div>
              <h3 className="font-bold text-gray-900 mb-1">Complete Onboarding Form — 7 Steps</h3>
              <div className="flex flex-wrap gap-2 mt-2">
                {[`Personal Details`, `Identity (Aadhaar/PAN)`, `Bank Details`, `Education`, `Experience`, `Documents Upload (14 files)`, `Declaration`].map((step) => (
                  <span key={step} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-[11px] font-bold text-amber-800">
                    <Check className="h-2.5 w-2.5" />{step}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-400 font-medium">
          <Building2 className="h-3.5 w-3.5" /> {BRAND.name} · GSTIN: {BRAND.gstin}
        </div>
      </div>
    </div>
  )
}

const LOGIN_PORTALS = PORTALS.filter((p) => !p.requestAccess)
const APPLY_PORTALS = PORTALS.filter((p) => p.requestAccess)

function PortalLoginPickerView({ onBack, onSelect, onApply }: { onBack: () => void; onSelect: (id: string) => void; onApply: () => void }) {
  const [search, setSearch] = useState('')
  const filteredLogin = LOGIN_PORTALS.filter((p) => !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase()))
  const filteredApply = APPLY_PORTALS.filter((p) => !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase()))
  const hasResults = filteredLogin.length > 0 || filteredApply.length > 0
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white">
      <header className="sticky top-0 z-40 border-b bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <BrandLogo />
          <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft className="mr-1 h-4 w-4" /> Back to Home</Button>
        </div>
      </header>
      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:py-16">
        <div className="text-center mb-10">
          <Badge className="mb-4 px-4 py-1 text-sm font-bold" style={{ background: '#D4AF37', color: '#002B5C' }}><Shield className="h-3.5 w-3.5 mr-1.5" />All Portals</Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-3">Select Your Portal</h1>
          <p className="text-gray-600 text-lg font-medium max-w-2xl mx-auto mb-6">Choose from {PORTALS.length} specialized portals. Sign in or apply to join.</p>
          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Search portals..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 h-11" />
          </div>
        </div>
        {!hasResults && (
          <div className="text-center py-12">
            <p className="text-gray-400 font-medium">No portals found matching your search.</p>
          </div>
        )}
        {filteredLogin.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-5">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: '#002B5C' }}><Lock className="h-4 w-4 text-white" /></div>
              <h2 className="text-lg font-extrabold text-gray-900">Login Portals</h2>
              <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{filteredLogin.length}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredLogin.map((portal) => {
                const Icon = portal.icon
                return (
                  <motion.button key={portal.id} onClick={() => onSelect(portal.id)} whileHover={{ y: -3 }} whileTap={{ scale: 0.98 }}
                    className="text-left rounded-2xl border-2 border-gray-200 bg-white p-6 shadow-sm hover:shadow-lg transition-all duration-300 group cursor-pointer" style={{ borderColor: undefined }}>
                    <div className="h-14 w-14 rounded-2xl flex items-center justify-center shadow-md mb-4" style={{ background: portal.color }}>
                      <Icon className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{portal.title}</h3>
                    <p className="text-sm text-gray-500 font-medium leading-relaxed mb-3">{portal.description}</p>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {portal.features.slice(0, 3).map((f) => (
                        <span key={f} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-[10px] font-bold text-gray-600">
                          <Check className="h-2.5 w-2.5" />{f}
                        </span>
                      ))}
                      {portal.features.length > 3 && <span className="text-[10px] font-bold text-gray-400">+{portal.features.length - 3} more</span>}
                    </div>
                    <div className="flex items-center gap-1.5 text-sm font-bold" style={{ color: portal.color }}>
                      <Lock className="h-3.5 w-3.5" />Sign In <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </motion.button>
                )
              })}
            </div>
          </div>
        )}
        {filteredApply.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-5">
              <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: '#166534' }}><UserPlus className="h-4 w-4 text-white" /></div>
              <h2 className="text-lg font-extrabold text-gray-900">Apply to Join Portals</h2>
              <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{filteredApply.length}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredApply.map((portal) => {
                const Icon = portal.icon
                return (
                  <motion.button key={portal.id} onClick={() => onSelect(portal.id)} whileHover={{ y: -3 }} whileTap={{ scale: 0.98 }}
                    className="text-left rounded-2xl border-2 border-green-200 bg-white p-6 shadow-sm hover:shadow-lg hover:border-green-400 transition-all duration-300 group cursor-pointer">
                    <div className="flex items-start justify-between mb-4">
                      <div className="h-14 w-14 rounded-2xl flex items-center justify-center shadow-md" style={{ background: portal.color }}>
                        <Icon className="h-7 w-7 text-white" />
                      </div>
                      <Badge className="text-[10px] font-bold px-2 py-0.5" style={{ background: '#166534', color: '#fff' }}>Apply</Badge>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{portal.title}</h3>
                    <p className="text-sm text-gray-500 font-medium leading-relaxed mb-3">{portal.description}</p>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {portal.features.slice(0, 3).map((f) => (
                        <span key={f} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 text-[10px] font-bold text-green-700">
                          <Check className="h-2.5 w-2.5" />{f}
                        </span>
                      ))}
                      {portal.features.length > 3 && <span className="text-[10px] font-bold text-gray-400">+{portal.features.length - 3} more</span>}
                    </div>
                    <div className="flex items-center gap-1.5 text-sm font-bold" style={{ color: '#166534' }}>
                      <UserPlus className="h-3.5 w-3.5" />Apply & Fill Form <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </motion.button>
                )
              })}
            </div>
          </div>
        )}
        <div className="text-center pt-4">
          <p className="text-sm text-gray-500 font-medium mb-3">Or apply for any department directly?</p>
          <Button size="lg" className="h-11 font-bold text-white" style={{ background: '#166534' }} onClick={onApply}>
            <UserPlus className="mr-2 h-4 w-4" />Apply to Join HP Enterprise
          </Button>
        </div>
      </div>
    </div>
  )
}

export function Landing() {
  const { setUser, hpaiOpen, setHpaiOpen } = useAppStore()
  const [view, setView] = useState<LandingView>('home')
  const [mobileMenu, setMobileMenu] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [activeService, setActiveService] = useState<ServiceDetail | null>(null)
  const [serviceModalOpen, setServiceModalOpen] = useState(false)
  const [appliedPortal, setAppliedPortal] = useState<string>('')
  const [selectedPortalId, setSelectedPortalId] = useState<string>('')
  const homeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    document.documentElement.style.scrollBehavior = 'smooth'
    const h = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', h, { passive: true })
    return () => window.removeEventListener('scroll', h)
  }, [])

  const scrollTo = useCallback((id: string) => { setMobileMenu(false); const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }) }, [])
  const goHome = useCallback(() => { setView('home'); window.scrollTo({ top: 0, behavior: 'smooth' }) }, [])
  const openServiceModal = useCallback((s: ServiceDetail) => { setActiveService(s); setServiceModalOpen(true) }, [])


  const NAV_LINKS = [
    { id: 'features', label: 'Features' }, { id: 'services', label: 'Services' },
    { id: 'join', label: 'Join Now' }, { id: 'portals', label: 'All Portals' }, { id: 'pricing', label: 'Pricing' }, { id: 'contact', label: 'Contact' },
  ]

  const openApplyForm = useCallback((portalTitle?: string) => { if (portalTitle) { setAppliedPortal(portalTitle); setView('apply') } else { setView('apply-pick') } }, [])

  if (view === 'register') return <RegistrationForm onBack={goHome} />
  if (view === 'apply') return <RegistrationForm onBack={goHome} appliedFor={appliedPortal} />
  if (view === 'apply-pick') return <PortalPickerView onPick={(title) => { setAppliedPortal(title); setView('apply') }} onBack={goHome} />
  if (view === 'portal-pick') return <PortalLoginPickerView onBack={goHome} onSelect={(id) => { setSelectedPortalId(id); setView('portal-login') }} onApply={() => openApplyForm()} />
  if (view === 'portal-login') return <SinglePortalLoginView portalId={selectedPortalId} onBack={() => setView('portal-pick')} onApply={() => { const p = PORTALS.find((pp) => pp.id === selectedPortalId); openApplyForm(p?.title) }} />
  if (view === 'subscribe') return <SubscriptionForm onBack={goHome} />

  return (
    <div ref={homeRef} className="min-h-screen flex flex-col" style={{ background: '#FFFFFF' }}>
      <SocialSideMenu />
      <ServiceModal service={activeService} open={serviceModalOpen} onClose={() => setServiceModalOpen(false)} />

      <nav className={cn('sticky top-0 z-40 w-full transition-all duration-500', scrolled ? 'bg-white/90 shadow-lg shadow-gray-200/50 backdrop-blur-xl' : 'bg-white/50 backdrop-blur-sm')} role="navigation" aria-label="Main navigation">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[76px]">
            <button onClick={goHome} className="flex items-center gap-2.5 shrink-0" aria-label="HPHRMS Home">
              <BrandLogo size={38} />
              <div className="flex flex-col">
                <span className="font-extrabold text-[16px] tracking-tight leading-tight text-gray-900">HPHRMS</span>
                <span className="text-[10px] font-bold tracking-[0.2em] uppercase leading-tight text-gray-400">by HP Enterprise</span>
              </div>
            </button>
            <div className="hidden lg:flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <button key={link.id} onClick={() => scrollTo(link.id)} className="px-4 py-2.5 rounded-xl text-[13px] font-bold text-gray-500 hover:text-gray-900 hover:bg-gray-100/80 transition-all duration-300">{link.label}</button>
              ))}
            </div>
            <div className="hidden lg:flex items-center gap-3">
              <LanguageSwitcher />
              <Button variant="ghost" className="text-sm font-bold h-10 text-gray-600 hover:text-gray-900 hover:bg-gray-100 px-5" onClick={() => setView('portal-pick')}>Login</Button>
              <Button className="text-sm font-bold h-10 px-5 rounded-xl text-white shadow-md hover:shadow-lg transition-all duration-300" style={{ background: '#166534' }} onClick={() => openApplyForm()}>Apply to Join</Button>
              <Button className="text-sm font-bold h-10 px-6 rounded-xl text-gray-900 shadow-md shadow-amber-200/50 hover:shadow-lg transition-all duration-300" style={{ background: '#D4AF37' }} onClick={() => setView('subscribe')}>Start Free Trial</Button>
            </div>
            <button className="lg:hidden p-2 rounded-xl text-gray-600" onClick={() => setMobileMenu(!mobileMenu)} aria-label={mobileMenu ? 'Close menu' : 'Open menu'} aria-expanded={mobileMenu}>
              {mobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        <AnimatePresence>
          {mobileMenu && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.4, ease: LUXURY_EASE }} className="lg:hidden overflow-hidden bg-white/95 backdrop-blur-xl border-t border-gray-100 shadow-xl">
              <div className="px-4 py-5 space-y-1">
                {NAV_LINKS.map((link) => (
                  <button key={link.id} onClick={() => scrollTo(link.id)} className="block w-full text-left px-4 py-3 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors capitalize">{link.label}</button>
                ))}
                <div className="pt-3 flex flex-col gap-2">
                  <Button variant="outline" className="w-full text-sm font-bold" onClick={() => { setView('portal-pick'); setMobileMenu(false) }}>Login to Portal</Button>
                  <Button className="w-full text-sm font-bold text-white" style={{ background: '#166534' }} onClick={() => { openApplyForm(); setMobileMenu(false) }}>Apply to Join</Button>
                  <Button className="w-full text-sm font-bold text-gray-900" style={{ background: '#D4AF37' }} onClick={() => { setView('subscribe'); setMobileMenu(false) }}>Start Free Trial</Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(160deg, #F8FAFC 0%, #FEFCE8 30%, #FFFFFF 60%, #F0FDF4 100%)' }} />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-30 blur-3xl" style={{ background: 'radial-gradient(circle, #D4AF37 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full opacity-20 blur-3xl" style={{ background: 'radial-gradient(circle, #002B5C 0%, transparent 70%)' }} />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 lg:py-40">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="space-y-8">
              <Reveal>
                <Badge className="px-4 py-1.5 text-sm font-bold shadow-sm" style={{ background: '#D4AF37', color: '#002B5C' }}>
                  <Sparkles className="h-3.5 w-3.5 mr-1.5" />AI-Powered Workforce Solutions
                </Badge>
              </Reveal>
              <Reveal delay={0.1}>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1]" style={{ color: '#002B5C' }}>
                  {BRAND.tagline}
                </h1>
              </Reveal>
              <Reveal delay={0.2}>
                <p className="text-lg sm:text-xl text-gray-600 font-medium leading-relaxed max-w-xl">
                  {BRAND.subTagline}. From HR management to EHS consultancy, engineering support to payroll — we deliver excellence across every vertical.
                </p>
              </Reveal>
              <Reveal delay={0.3}>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button size="lg" className="h-13 text-base font-bold px-8 rounded-2xl text-white shadow-lg shadow-gray-900/20 hover:shadow-xl transition-all duration-300" style={{ background: '#002B5C' }} onClick={() => setView('portal-pick')}>
                    Access Portals <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button size="lg" className="h-13 text-base font-bold px-8 rounded-2xl text-white shadow-lg shadow-emerald-900/20 hover:shadow-xl transition-all duration-300" style={{ background: '#166534' }} onClick={() => openApplyForm()}>
                    <UserPlus className="mr-2 h-5 w-5" />Apply to Join
                  </Button>
                  <Button size="lg" className="h-13 text-base font-bold px-8 rounded-2xl text-gray-900 shadow-md shadow-amber-200/50 hover:shadow-lg transition-all duration-300" style={{ background: '#D4AF37' }} onClick={() => setView('subscribe')}>
                    Start Free Trial <Zap className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </Reveal>
              <Reveal delay={0.4}>
                <div className="flex items-center gap-3 pt-2">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="h-9 w-9 rounded-full border-2 border-white shadow-md flex items-center justify-center text-[11px] font-bold text-white" style={{ background: ['#002B5C', '#0A4488', '#D4AF37', '#166534'][i - 1] }}>
                        {['HP', 'HR', 'EHS', 'EN'][i - 1]}
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">10+ Specialized Portals</p>
                    <p className="text-xs text-gray-500 font-medium">One platform, complete workforce management</p>
                  </div>
                </div>
              </Reveal>
            </div>
            <Reveal delay={0.2} direction="right">
              <div className="relative">
                <div className="rounded-3xl overflow-hidden shadow-2xl shadow-gray-900/10 border border-gray-100 bg-gradient-to-br from-gray-50 to-gray-100 p-8 flex items-center justify-center min-h-[400px]">
                  <div className="grid grid-cols-3 gap-3 w-full max-w-md">
                    {HPHRMS_FEATURES.slice(0, 9).map((f, idx) => {
                      const ics: LucideIcon[] = [Bot, Users, Target, Clock, CalendarDays, Wallet, UserIcon, Settings, FileText]
                      const Ic = ics[idx]
                      return (
                        <div key={f} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 flex flex-col items-center gap-1.5">
                          <Ic className="h-5 w-5" style={{ color: idx % 2 === 0 ? '#002B5C' : '#D4AF37' }} />
                          <span className="text-[9px] font-bold text-gray-500 text-center leading-tight">{f.split(' ').slice(0, 2).join(' ')}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
                <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-xl p-4 border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: '#D4AF37' }}><Bot className="h-5 w-5 text-white" /></div>
                    <div>
                      <p className="text-xs font-bold text-gray-900">HP AI Assistant</p>
                      <p className="text-[11px] text-gray-500 font-medium">Always ready to help</p>
                    </div>
                  </div>
                </div>
                <div className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-xl p-4 border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-emerald-100"><ShieldCheck className="h-5 w-5 text-emerald-600" /></div>
                    <div>
                      <p className="text-xs font-bold text-gray-900">Enterprise Security</p>
                      <p className="text-[11px] text-gray-500 font-medium">Bank-grade encryption</p>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="relative z-10 -mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 p-6">
              <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
                {TRUST_BADGES.map((badge) => (
                  <div key={badge} className="flex items-center gap-2 text-sm font-semibold text-gray-600">
                    <Award className="h-4 w-4 text-amber-500" />
                    {badge}
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 sm:py-28 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto mb-16">
              <Badge className="mb-4 px-4 py-1 text-sm font-bold" style={{ background: '#D4AF37', color: '#002B5C' }}>Features</Badge>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">Everything You Need to Manage Your Workforce</h2>
              <p className="text-gray-600 text-lg font-medium">HPHRMS is packed with powerful features designed for modern Indian businesses.</p>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {HPHRMS_FEATURES.map((feature, i) => {
              const icons: LucideIcon[] = [Bot, Users, Target, Clock, CalendarDays, Wallet, UserIcon, Settings, FileText, BarChart3, Building2, Shield]
              const FeatureIcon = icons[i % icons.length]
              return (
                <Reveal key={feature} delay={i * 0.05}>
                  <div className="group bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-lg hover:border-amber-200/60 transition-all duration-300 hover:-translate-y-1">
                    <div className="h-11 w-11 rounded-xl flex items-center justify-center mb-4 shadow-sm" style={{ background: '#002B5C' }}>
                      <FeatureIcon className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="font-bold text-gray-900 mb-1.5">{feature}</h3>
                    <p className="text-sm text-gray-500 font-medium leading-relaxed">Comprehensive {feature.toLowerCase()} capabilities for your organization.</p>
                  </div>
                </Reveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto mb-16">
              <Badge className="mb-4 px-4 py-1 text-sm font-bold" style={{ background: '#D4AF37', color: '#002B5C' }}>Our Services</Badge>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">End-to-End Workforce Solutions</h2>
              <p className="text-gray-600 text-lg font-medium">From hiring to payroll, safety to engineering — we cover every aspect of workforce management.</p>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {SERVICE_DETAILS.map((service, i) => {
              const Icon = service.icon
              return (
                <Reveal key={service.title} delay={i * 0.08}>
                  <div className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer" onClick={() => openServiceModal(service)}>
                    <div className="relative h-48 overflow-hidden">
                      <Image src={service.image} alt={service.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ background: '#D4AF37' }}>
                            <Icon className="h-4 w-4" style={{ color: '#002B5C' }} />
                          </div>
                          <h3 className="text-lg font-bold text-white">{service.title}</h3>
                        </div>
                        <p className="text-sm text-gray-200 font-medium">{service.short}</p>
                      </div>
                    </div>
                    <div className="p-5">
                      <div className="flex flex-wrap gap-2 mb-4">
                        {service.industries.slice(0, 3).map((ind) => (
                          <Badge key={ind} variant="secondary" className="text-[11px] font-semibold px-2.5 py-0.5">{ind}</Badge>
                        ))}
                        {service.industries.length > 3 && <Badge variant="secondary" className="text-[11px] font-semibold px-2.5 py-0.5">+{service.industries.length - 3}</Badge>}
                      </div>
                      <div className="flex items-center gap-1.5 text-sm font-bold" style={{ color: '#002B5C' }}>
                        Learn More <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </div>
                </Reveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* Join Our Team Banner */}
      <section id="join" className="py-20 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl" style={{ background: 'linear-gradient(135deg, #002B5C 0%, #0A4488 50%, #166534 100%)' }}>
              <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, #D4AF37 0%, transparent 50%), radial-gradient(circle at 80% 20%, #D4AF37 0%, transparent 50%)' }} />
              <div className="relative z-10 px-8 sm:px-12 lg:px-16 py-14 sm:py-20">
                <div className="grid lg:grid-cols-2 gap-10 items-center">
                  <div className="space-y-6">
                    <Badge className="px-4 py-1.5 text-sm font-bold shadow-sm" style={{ background: '#D4AF37', color: '#002B5C' }}>
                      <UserPlus className="h-3.5 w-3.5 mr-1.5" />We're Hiring
                    </Badge>
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight">Join HP Enterprise — Build Your Career</h2>
                    <p className="text-lg text-gray-200 font-medium leading-relaxed max-w-lg">Apply with your complete profile — personal details, education, experience, identity documents, bank details, and more. One form, everything we need.</p>
                    <div className="flex flex-wrap gap-3 pt-2">
                      <Button size="lg" className="h-13 text-base font-bold px-8 rounded-2xl text-white shadow-xl hover:shadow-2xl transition-all duration-300" style={{ background: '#D4AF37', color: '#002B5C' }} onClick={() => openApplyForm()}>
                        <UserPlus className="mr-2 h-5 w-5" />Apply Now — Fill All Details
                      </Button>
                      <a href={SOCIAL.whatsapp} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center h-13 px-6 rounded-2xl text-sm font-bold text-white bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 transition-all duration-300">
                        <WhatsAppIcon className="mr-2 h-4 w-4" />Chat on WhatsApp
                      </a>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { icon: UserIcon, title: 'Personal Details', desc: 'Name, DOB, Gender, Address, Emergency Contact' },
                      { icon: FileText, title: 'Identity Documents', desc: 'Aadhaar, PAN, Passport Photo, Medical Cert' },
                      { icon: Landmark, title: 'Bank Details', desc: 'Account, IFSC, Passbook Upload' },
                      { icon: GraduationCap, title: 'Education', desc: 'Multiple Qualifications with Certificates' },
                      { icon: Briefcase, title: 'Experience & Salary', desc: 'Company, Designation, CTC, Notice Period' },
                      { icon: FileUp, title: 'All Documents', desc: 'Resume, Salary Slips, Relieving, Address Proof' },
                    ].map((item) => (
                      <div key={item.title} className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10 hover:bg-white/15 transition-colors">
                        <item.icon className="h-6 w-6 mb-2" style={{ color: '#D4AF37' }} />
                        <h3 className="text-sm font-bold text-white mb-1">{item.title}</h3>
                        <p className="text-[11px] text-gray-300 font-medium leading-relaxed">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Portals Section */}
      <section id="portals" className="py-20 sm:py-28 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto mb-16">
              <Badge className="mb-4 px-4 py-1 text-sm font-bold" style={{ background: '#D4AF37', color: '#002B5C' }}>All Portals</Badge>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">Access Your Dedicated Portal</h2>
              <p className="text-gray-600 text-lg font-medium">Each role gets a tailored experience. Select your portal and sign in.</p>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {PORTALS.map((portal, i) => {
              const Icon = portal.icon
              return (
                <Reveal key={portal.id} delay={i * 0.04}>
                  <motion.button onClick={() => { setSelectedPortalId(portal.id); setView('portal-login') }} whileHover={{ y: -3 }} whileTap={{ scale: 0.98 }}
                    className={cn('text-left rounded-2xl border-2 bg-white p-5 shadow-sm hover:shadow-lg transition-all duration-300 group cursor-pointer w-full', portal.requestAccess ? 'border-green-200 hover:border-green-400' : 'border-gray-200 hover:border-gray-400')}>
                    <div className="h-12 w-12 rounded-2xl flex items-center justify-center shadow-md mb-3" style={{ background: portal.color }}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 mb-0.5 leading-tight">{portal.title}</h3>
                    <p className="text-xs text-gray-500 font-medium leading-relaxed mb-3 line-clamp-2">{portal.description}</p>
                    <div className="flex items-center gap-1 text-xs font-bold" style={{ color: portal.requestAccess ? '#166534' : portal.color }}>
                      {portal.requestAccess ? <UserPlus className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                      {portal.requestAccess ? 'Apply to Join' : 'Sign In'}
                      <ArrowRight className="h-3 w-3 ml-auto group-hover:translate-x-1 transition-transform" />
                    </div>
                  </motion.button>
                </Reveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto mb-16">
              <Badge className="mb-4 px-4 py-1 text-sm font-bold" style={{ background: '#D4AF37', color: '#002B5C' }}>Pricing</Badge>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">Simple, Transparent Pricing</h2>
              <p className="text-gray-600 text-lg font-medium">Choose the plan that fits your business. No hidden fees, no surprises.</p>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {PRICING_PLANS.map((plan, i) => (
              <Reveal key={plan.name} delay={i * 0.1}>
                <div className={cn(
                  'relative bg-white rounded-2xl p-6 border-2 transition-all duration-300 hover:-translate-y-1',
                  plan.popular ? 'border-amber-400 shadow-xl shadow-amber-100/50 scale-[1.02]' : 'border-gray-200 shadow-md hover:shadow-lg'
                )}>
                  {plan.popular && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                      <Badge className="px-4 py-1 text-sm font-bold shadow-sm" style={{ background: '#D4AF37', color: '#002B5C' }}>Most Popular</Badge>
                    </div>
                  )}
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-3xl font-extrabold" style={{ color: '#002B5C' }}>{plan.price}</span>
                      {plan.period && <span className="text-gray-500 font-medium">{plan.period}</span>}
                    </div>
                    <p className="text-sm text-gray-500 font-medium mt-2">{plan.description}</p>
                  </div>
                  <ul className="space-y-3 mb-6">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-sm text-gray-700 font-medium">
                        <Check className="h-4 w-4 shrink-0 text-emerald-600" />{f}
                      </li>
                    ))}
                  </ul>
                  <Button
                    className={cn('w-full h-11 font-bold text-sm transition-all duration-300', plan.popular ? 'text-gray-900 shadow-md shadow-amber-200/50 hover:shadow-lg' : 'text-white hover:opacity-90')}
                    style={{ background: plan.popular ? '#D4AF37' : '#002B5C' }}
                    onClick={() => setView('subscribe')}
                  >
                    {plan.price === 'Custom' ? 'Contact Sales' : 'Get Started'} <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 sm:py-28 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto mb-16">
              <Badge className="mb-4 px-4 py-1 text-sm font-bold" style={{ background: '#D4AF37', color: '#002B5C' }}>Contact Us</Badge>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-4">Get In Touch</h2>
              <p className="text-gray-600 text-lg font-medium">Have questions? We would love to hear from you. Reach out to us anytime.</p>
            </div>
          </Reveal>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <Reveal delay={0.1}>
              <a href={`tel:${BRAND.phone}`} className="block bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 text-center">
                <div className="mx-auto h-14 w-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: '#002B5C' }}>
                  <Phone className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 mb-1">Call Us</h3>
                <p className="text-sm text-gray-500 font-medium">{BRAND.phone}</p>
                <p className="text-sm text-gray-400 font-medium mt-1">Mon–Sat, 9 AM–7 PM</p>
              </a>
            </Reveal>
            <Reveal delay={0.2}>
              <a href={`mailto:${BRAND.email}`} className="block bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 text-center">
                <div className="mx-auto h-14 w-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: '#0A4488' }}>
                  <Mail className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 mb-1">Email Us</h3>
                <p className="text-sm text-gray-500 font-medium">{BRAND.email}</p>
                <p className="text-sm text-gray-400 font-medium mt-1">We reply within 24 hours</p>
              </a>
            </Reveal>
            <Reveal delay={0.3}>
              <a href={SOCIAL.whatsapp} target="_blank" rel="noopener noreferrer" className="block bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 text-center">
                <div className="mx-auto h-14 w-14 rounded-2xl flex items-center justify-center mb-4" style={{ background: '#25D366' }}>
                  <WhatsAppIcon className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 mb-1">WhatsApp</h3>
                <p className="text-sm text-gray-500 font-medium">Chat with us instantly</p>
                <p className="text-sm text-gray-400 font-medium mt-1">Quick response guaranteed</p>
              </a>
            </Reveal>
          </div>
          <Reveal delay={0.35}>
            <div className="mt-12 bg-white rounded-2xl p-8 border border-gray-200 shadow-sm max-w-5xl mx-auto">
              <h3 className="text-lg font-bold text-gray-900 mb-6">Leadership</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm" style={{ background: '#002B5C' }}>
                    <Crown className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-base">{BRAND.managingDirector}</p>
                    <p className="text-sm text-gray-500 font-medium">Managing Director</p>
                    <a href={`tel:${BRAND.mdPhone}`} className="inline-flex items-center gap-1.5 mt-2 text-xs font-bold" style={{ color: '#002B5C' }}>
                      <Phone className="h-3 w-3" />{BRAND.mdPhone}
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm" style={{ background: '#B45309' }}>
                    <HardHat className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-base">{BRAND.ehsDirector}</p>
                    <p className="text-sm text-gray-500 font-medium">EHS Director</p>
                    <a href={`tel:${BRAND.ehsPhone}`} className="inline-flex items-center gap-1.5 mt-2 text-xs font-bold" style={{ color: '#B45309' }}>
                      <Phone className="h-3 w-3" />{BRAND.ehsPhone}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
          <Reveal delay={0.4}>
            <div className="mt-6 bg-white rounded-2xl p-8 border border-gray-200 shadow-sm max-w-5xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Office Locations</h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 mt-0.5 shrink-0" style={{ color: '#002B5C' }} />
                      <div>
                        <p className="text-sm font-bold text-gray-900">Head Office</p>
                        <p className="text-sm text-gray-500 font-medium">{BRAND.headOffice.full}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 mt-0.5 shrink-0" style={{ color: '#0A4488' }} />
                      <div>
                        <p className="text-sm font-bold text-gray-900">Branch Office</p>
                        <p className="text-sm text-gray-500 font-medium">{BRAND.branchOffice.full}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Business Details</h3>
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600 font-medium">GSTIN: {BRAND.gstin}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600 font-medium">UDYAM: {BRAND.udyam}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600 font-medium">PAN: {BRAND.pan}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <UserIcon className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600 font-medium">Managing Director: {BRAND.managingDirector}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto" style={{ background: '#002B5C' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <BrandLogo size={34} />
                <div className="flex flex-col">
                  <span className="font-extrabold text-[15px] tracking-tight leading-tight text-white">HPHRMS</span>
                  <span className="text-[9px] font-bold tracking-[0.2em] uppercase leading-tight text-gray-400">by HP Enterprise</span>
                </div>
              </div>
              <p className="text-sm text-gray-300 font-medium leading-relaxed mb-4">{BRAND.taglineFull}</p>
              <div className="flex items-center gap-2">
                {SOCIAL_ITEMS.slice(2).map((s) => (
                  <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className="h-9 w-9 rounded-lg bg-white/10 flex items-center justify-center text-gray-300 hover:bg-white/20 hover:text-white transition-colors" aria-label={s.label}>
                    <s.icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Services</h4>
              <ul className="space-y-2">
                {SERVICE_DETAILS.map((s) => (
                  <li key={s.title}>
                    <button onClick={() => openServiceModal(s)} className="text-sm text-gray-300 hover:text-white font-medium transition-colors text-left">{s.title}</button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Quick Links</h4>
              <ul className="space-y-2">
                {NAV_LINKS.map((link) => (
                  <li key={link.id}>
                    <button onClick={() => scrollTo(link.id)} className="text-sm text-gray-300 hover:text-white font-medium transition-colors text-left">{link.label}</button>
                  </li>
                ))}
                <li>
                  <button onClick={() => setView('subscribe')} className="text-sm text-gray-300 hover:text-white font-medium transition-colors text-left">Start Free Trial</button>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Contact</h4>
              <ul className="space-y-3">
                <li className="flex items-start gap-2.5">
                  <Phone className="h-4 w-4 mt-0.5 shrink-0 text-gray-400" />
                  <a href={`tel:${BRAND.phone}`} className="text-sm text-gray-300 hover:text-white font-medium transition-colors">{BRAND.phone}</a>
                </li>
                <li className="flex items-start gap-2.5">
                  <Mail className="h-4 w-4 mt-0.5 shrink-0 text-gray-400" />
                  <a href={`mailto:${BRAND.email}`} className="text-sm text-gray-300 hover:text-white font-medium transition-colors">{BRAND.email}</a>
                </li>
                <li className="flex items-start gap-2.5">
                  <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-gray-400" />
                  <span className="text-sm text-gray-300 font-medium">{BRAND.headOffice.city}, {BRAND.headOffice.state}</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-10 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-400 font-medium">&copy; {new Date().getFullYear()} {BRAND.legalName}. All rights reserved.</p>
            <p className="text-sm text-gray-400 font-medium">GSTIN: {BRAND.gstin} &middot; UDYAM: {BRAND.udyam}</p>
          </div>
        </div>
      </footer>

      {/* AI Chat FAB */}
      <motion.button
        onClick={() => setHpaiOpen(true)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full flex items-center justify-center shadow-xl text-white hover:shadow-2xl transition-shadow duration-300"
        style={{ background: 'linear-gradient(135deg, #002B5C 0%, #0A4488 100%)' }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Open HP AI Assistant"
      >
        <Bot className="h-6 w-6" />
        <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-emerald-400 border-2 border-white" />
      </motion.button>
    </div>
  )
}