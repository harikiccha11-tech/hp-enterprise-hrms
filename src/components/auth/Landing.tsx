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
  Sparkles, Crown, Check, Bot, Fingerprint,
  CalendarDays, FolderKanban, ClipboardList, ReceiptText, BarChart3, Megaphone, ScrollText,
  Settings, UserCog, Zap, Shield, Bell, Star, Headphones, TrendingUp, Send, Loader2,
  Phone, Mail, MapPin, ChevronRight, ExternalLink, Menu, X, Award, Globe2,
  HardHat, LandPlot, Truck, DollarSign, MonitorSmartphone, GraduationCap, Handshake,
  type LucideIcon, Eye, Target, Briefcase, Wrench, Warehouse, Store, UserCheck,
} from 'lucide-react'
import Image from 'next/image'

// ── Types ────────────────────────────────────────────────────────────────────

type LandingView = 'home' | 'register' | 'subscribe'

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

// ── Social Side Menu Config ─────────────────────────────────────────────────

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

// ── Service Detail Data ─────────────────────────────────────────────────────

interface ServiceDetail {
  title: string; short: string; icon: LucideIcon; image: string
  description: string; benefits: string[]; industries: string[]; process: string[]
}

const SERVICE_DETAILS: ServiceDetail[] = [
  {
    title: 'Human Resource Management',
    short: 'Complete workforce lifecycle management powered by AI',
    icon: Users, image: '/service-hr.png',
    description: 'Our comprehensive HR management service covers the entire employee lifecycle from onboarding to exit. We handle employee records, performance tracking, policy compliance, and organizational development.',
    benefits: ['End-to-end employee lifecycle management', 'AI-powered performance analytics', 'Compliance with Indian labour laws', 'Employee engagement & retention programs', 'Organizational structure optimization'],
    industries: ['IT & Technology', 'Construction & Infrastructure', 'Manufacturing', 'Healthcare', 'BFSI'],
    process: ['Workforce assessment & planning', 'HR policy design & implementation', 'Employee onboarding & documentation', 'Ongoing HR operations & support', 'Performance reviews & analytics'],
  },
  {
    title: 'Recruitment & Talent Acquisition',
    short: 'End-to-end hiring pipeline with smart screening',
    icon: Target, image: '/service-recruitment.png',
    description: 'We manage the complete recruitment cycle from job posting and candidate sourcing to interviewing, offer negotiation, and onboarding. Our AI-powered ATS helps you find the right talent faster.',
    benefits: ['AI-powered applicant tracking system (ATS)', 'Multi-channel candidate sourcing', 'Structured interview frameworks', 'Background verification support', 'Faster time-to-hire with smart screening'],
    industries: ['IT & Technology', 'Construction', 'Manufacturing', 'Healthcare', 'BFSI', 'Logistics'],
    process: ['Requirement gathering & job description', 'Candidate sourcing & screening', 'Interview coordination & assessment', 'Offer negotiation & acceptance', 'Onboarding & documentation'],
  },
  {
    title: 'Safety (EHS) Consultancy',
    short: 'Environmental, Health & Safety compliance solutions',
    icon: HardHat, image: '/service-safety.png',
    description: 'Our EHS consultancy ensures your organization meets all safety regulations and standards. From safety audits to training programs, we build a culture of safety at your workplace.',
    benefits: ['Comprehensive safety audits & inspections', 'Regulatory compliance management', 'Safety training & certification programs', 'Incident investigation & reporting', 'Emergency response planning'],
    industries: ['Construction', 'Manufacturing', 'Oil & Gas', 'Chemical Plants', 'Mining', 'Infrastructure'],
    process: ['Site assessment & hazard identification', 'Safety audit & gap analysis', 'Compliance plan development', 'Training implementation', 'Ongoing monitoring & support'],
  },
  {
    title: 'Engineering & Project Support',
    short: 'Multi-discipline engineering for construction & industrial projects',
    icon: Wrench, image: '/service-engineering.png',
    description: 'We provide skilled engineering professionals across all disciplines for construction, industrial, and infrastructure projects. Our engineers bring expertise in planning, execution, and quality assurance.',
    benefits: ['Multi-discipline engineering professionals', 'Project planning & scheduling support', 'Quality assurance & quality control', 'Construction management services', 'Technical documentation & reporting'],
    industries: ['Construction', 'Infrastructure', 'Industrial Plants', 'Oil & Gas', 'Power Generation', 'Metro & Rail'],
    process: ['Project requirement analysis', 'Resource planning & deployment', 'Engineering execution & monitoring', 'Quality control & documentation', 'Project handover & close-out'],
  },
  {
    title: 'Payroll Management',
    short: 'Accurate, compliant payroll processing for your workforce',
    icon: Wallet, image: '/service-payroll.png',
    description: 'Our payroll management service handles salary processing, statutory compliance (PF, ESI, PT, TDS), and payslip generation. We ensure timely and accurate payroll every month.',
    benefits: ['Timely monthly payroll processing', 'Statutory compliance (PF, ESI, PT, TDS)', 'Automated payslip generation', 'Leave & attendance integration', 'Year-end tax forms (Form 16)'],
    industries: ['All Industries', 'IT & Technology', 'Construction', 'Manufacturing', 'Healthcare'],
    process: ['Employee data verification', 'Attendance & leave processing', 'Salary calculation & statutory deductions', 'Payslip generation & distribution', 'Compliance filing & reporting'],
  },
  {
    title: 'Manpower Supply',
    short: 'Skilled & unskilled workforce deployment across India',
    icon: Truck, image: '/service-manpower.png',
    description: 'We supply skilled, semi-skilled, and unskilled manpower for construction, industrial, and service sectors. Our vast network enables rapid deployment across India.',
    benefits: ['Pan-India manpower deployment', 'Skilled & unskilled workforce', 'Rapid mobilization capability', 'Compliance-managed staffing', 'Flexible contract durations'],
    industries: ['Construction', 'Manufacturing', 'Logistics', 'Hospitality', 'Facility Management', 'Security Services'],
    process: ['Workforce requirement assessment', 'Candidate sourcing & screening', 'Documentation & compliance', 'Deployment & orientation', 'Ongoing management & support'],
  },
]

// ── Portal Configs — ALL PORTALS ────────────────────────────────────────────

interface PortalConfig {
  id: string
  title: string
  description: string
  icon: LucideIcon
  features: string[]
  role: string
  color: string
  requestAccess?: boolean
}

const PORTALS: PortalConfig[] = [
  {
    id: 'owner', title: 'Owner Dashboard', description: 'Full system ownership with billing, company settings, and complete control over all modules.',
    icon: Crown, role: 'OWNER', color: '#D4AF37',
    features: ['Company Settings & Branding', 'Billing & Subscription Management', 'User & Role Management', 'Audit Logs & Activity Reports', 'System Configuration'],
  },
  {
    id: 'admin', title: 'Admin Console', description: 'Complete HR & workforce management dashboard with full operational control.',
    icon: Shield, role: 'SUPER_ADMIN', color: '#002B5C',
    features: ['Employee Management', 'Payroll & Attendance', 'Recruitment & ATS', 'Reports & Analytics', 'Document Management', 'Shift & Roster Management'],
  },
  {
    id: 'hr', title: 'HR Manager Portal', description: 'Day-to-day HR operations including recruitment, onboarding, and employee management.',
    icon: UserCog, role: 'HR_MANAGER', color: '#0A4488',
    features: ['Employee Onboarding', 'Leave Management', 'Recruitment Pipeline', 'Performance Tracking', 'Employee Grievances', 'Policy Management'],
  },
  {
    id: 'employee', title: 'Employee Portal', description: 'Self-service portal for all employees to manage their work life.',
    icon: UserIcon, role: 'EMPLOYEE', color: '#166534',
    features: ['View Payslips', 'Apply Leaves', 'Attendance History', 'Document Downloads', 'Profile Management', 'Task & Assignment View'],
  },
  {
    id: 'client', title: 'Client Portal', description: 'Dedicated access for business clients to track workforce and invoices.',
    icon: Building2, role: 'CLIENT', color: '#7C2D12',
    features: ['Workforce Dashboard', 'Invoice Management', 'Project Tracking', 'Compliance Reports', 'Support Tickets'],
  },
  {
    id: 'recruitment', title: 'Recruitment Portal', description: 'AI-powered recruitment portal for candidates and hiring managers.',
    icon: Target, role: 'CANDIDATE', color: '#6D28D9',
    features: ['Job Search & Apply', 'Application Tracking', 'Interview Scheduling', 'Offer Management', 'Candidate Assessment'],
    requestAccess: true,
  },
  {
    id: 'ehs', title: 'EHS Safety Portal', description: 'Safety compliance management, incident reporting, and audit tracking.',
    icon: HardHat, role: 'EHS', color: '#B45309',
    features: ['Safety Audit Management', 'Incident Reporting', 'Compliance Tracking', 'Safety Training Records', 'PPE Management', 'Emergency Protocols'],
    requestAccess: true,
  },
  {
    id: 'payroll', title: 'Payroll Portal', description: 'Dedicated payroll processing, statutory compliance, and salary management.',
    icon: DollarSign, role: 'FINANCE', color: '#0369A1',
    features: ['Salary Processing', 'PF/ESI/TDS Filing', 'Payslip Generation', 'Reimbursement Management', 'Tax Reports (Form 16)', 'Bank Integration'],
    requestAccess: true,
  },
  {
    id: 'manpower', title: 'Manpower Supply Portal', description: 'Manpower deployment tracking, vendor management, and workforce allocation.',
    icon: Truck, role: 'VENDOR', color: '#4338CA',
    features: ['Workforce Deployment', 'Vendor Management', 'Attendance & Billing', 'Contract Management', 'Site Allocation', 'Compliance Documents'],
    requestAccess: true,
  },
  {
    id: 'engineering', title: 'Engineering Portal', description: 'Engineering project support, resource planning, and discipline tracking.',
    icon: Wrench, role: 'MANAGER', color: '#0F766E',
    features: ['Project Resource Planning', 'Discipline Tracking', 'Site Progress Reports', 'QA/QC Management', 'Technical Documentation', 'Billing & Measurement'],
    requestAccess: true,
  },
]

// ── Pricing Plans ────────────────────────────────────────────────────────────

interface PricingPlan { name: string; price: string; period: string; description: string; popular?: boolean; features: string[] }

const PRICING_PLANS: PricingPlan[] = [
  { name: 'Starter', price: '₹4,999', period: '/month', description: 'For small businesses getting started with HR digitization.', features: ['Up to 50 Employees', 'Basic HR Management', 'Attendance Tracking', 'Leave Management', 'Payslip Generation', 'Email Support'] },
  { name: 'Professional', price: '₹14,999', period: '/month', description: 'For growing companies that need complete workforce management.', popular: true, features: ['Up to 500 Employees', 'All Starter Features', 'Recruitment & ATS', 'Payroll Processing', 'PF/ESI Compliance', 'Multi-Branch Support', 'Reports & Analytics', 'Priority Support'] },
  { name: 'Enterprise', price: 'Custom', period: '', description: 'For large organizations with complex workforce requirements.', features: ['Unlimited Employees', 'All Professional Features', 'API Management', 'Custom Integrations', 'Dedicated Account Manager', 'SLA Guarantee', 'On-Premise Option', '24/7 Phone Support'] },
]

// ══════════════════════════════════════════════════════════════════════════════
// SCROLL REVEAL COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

function Reveal({ children, delay = 0, direction = 'up', className = '' }: { children: React.ReactNode; delay?: number; direction?: 'up' | 'left' | 'right'; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })
  const dirMap = { up: { y: 40 }, left: { x: -40 }, right: { x: 40 } }
  return (
    <motion.div ref={ref} className={className}
      initial={{ opacity: 0, ...dirMap[direction] }}
      animate={isInView ? { opacity: 1, x: 0, y: 0 } : { opacity: 0, ...dirMap[direction] }}
      transition={{ duration: 0.6, delay, ease: [0.25, 0.4, 0.25, 1] }}
    >
      {children}
    </motion.div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// SOCIAL SIDE MENU
// ══════════════════════════════════════════════════════════════════════════════

function SocialSideMenu() {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="fixed left-0 top-1/2 -translate-y-1/2 z-50 flex items-center">
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 'auto', opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="overflow-hidden bg-white/95 backdrop-blur-sm shadow-xl rounded-r-xl border border-l-0 border-gray-200"
          >
            <div className="flex flex-col py-2 px-1.5 gap-1">
              {SOCIAL_ITEMS.map((s) => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors whitespace-nowrap"
                  aria-label={s.label}>
                  <s.icon className="h-4 w-4 shrink-0" style={{ color: s.color }} />
                  <span>{s.label}</span>
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <button
        onClick={() => setExpanded(!expanded)}
        className="h-10 w-10 rounded-r-xl bg-white shadow-lg border border-l-0 border-gray-200 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:shadow-xl transition-all duration-200"
        aria-label={expanded ? 'Close social menu' : 'Open social menu'}
      >
        {expanded ? <X className="h-4 w-4" /> : <Globe2 className="h-4 w-4" />}
      </button>
    </div>
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
        <motion.div className="fixed inset-0 z-[100] flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            className="relative z-10 bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            initial={{ scale: 0.9, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 30 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            {/* Modal image header */}
            <div className="relative h-48 sm:h-56 overflow-hidden rounded-t-2xl">
              <Image src={service.image} alt={service.title} fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <button onClick={onClose} className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/40 transition-colors">
                <X className="h-5 w-5" />
              </button>
              <div className="absolute bottom-4 left-6 flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl flex items-center justify-center" style={{ background: '#D4AF37' }}>
                  <Icon className="h-6 w-6" style={{ color: '#002B5C' }} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{service.title}</h3>
                  <p className="text-sm text-gray-200">{service.short}</p>
                </div>
              </div>
            </div>
            {/* Modal body */}
            <div className="p-6 space-y-6">
              <p className="text-gray-800 leading-relaxed">{service.description}</p>
              {/* Benefits */}
              <div>
                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Key Benefits</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {service.benefits.map((b) => (
                    <div key={b} className="flex items-start gap-2 text-sm text-gray-700">
                      <Check className="h-4 w-4 mt-0.5 shrink-0 text-emerald-600" />{b}
                    </div>
                  ))}
                </div>
              </div>
              {/* Industries */}
              <div>
                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Industries We Serve</h4>
                <div className="flex flex-wrap gap-2">
                  {service.industries.map((ind) => (
                    <Badge key={ind} variant="outline" className="text-xs font-medium border-gray-200 text-gray-700">{ind}</Badge>
                  ))}
                </div>
              </div>
              {/* Process */}
              <div>
                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Our Process</h4>
                <ol className="space-y-3">
                  {service.process.map((step, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="flex-shrink-0 h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: '#002B5C' }}>{i + 1}</span>
                      <span className="text-sm text-gray-700 pt-0.5">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
              {/* CTA buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <a href={SOCIAL.whatsapp} target="_blank" rel="noopener noreferrer"
                  className="flex-1 h-11 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold text-white transition-all hover:opacity-90" style={{ background: '#25D366' }}>
                  <WhatsAppIcon className="h-4 w-4" />Chat on WhatsApp
                </a>
                <a href={`tel:${BRAND.phone}`}
                  className="flex-1 h-11 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold text-white transition-all hover:opacity-90" style={{ background: '#002B5C' }}>
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
// INLINE PORTAL LOGIN CARD
// ══════════════════════════════════════════════════════════════════════════════

function PortalLoginCard({ portal, onForgotPassword }: { portal: PortalConfig; onForgotPassword: () => void }) {
  const { setUser } = useAppStore()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const Icon = portal.icon

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password.trim()) { toast.error('Please enter username and password'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: username.trim(), password }) })
      const data = await res.json()
      if (res.ok && data.user) { setUser(data.user); toast.success(`Welcome to ${portal.title}!`) }
      else { toast.error(data.error || 'Login failed. Please check your credentials.') }
    } catch { toast.error('Network error. Please try again.') } finally { setLoading(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor={`login-${portal.id}`} className="text-gray-800 text-xs font-semibold uppercase tracking-wider">Username</Label>
        <Input id={`login-${portal.id}`} placeholder="Enter your username" value={username} onChange={(e) => setUsername(e.target.value)} className="h-10 text-sm bg-white border-gray-200 focus:border-gray-400" autoComplete="username" />
      </div>
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor={`pass-${portal.id}`} className="text-gray-800 text-xs font-semibold uppercase tracking-wider">Password</Label>
          <button type="button" onClick={onForgotPassword} className="text-[11px] font-semibold hover:underline" style={{ color: portal.color }}>Forgot?</button>
        </div>
        <Input id={`pass-${portal.id}`} type="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-10 text-sm bg-white border-gray-200 focus:border-gray-400" autoComplete="current-password" />
      </div>
      <Button type="submit" className="w-full h-10 font-semibold text-sm text-white" style={{ background: portal.color }} disabled={loading}>
        {loading ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Lock className="mr-2 h-3.5 w-3.5" />}
        Sign In to {portal.title}
      </Button>
    </form>
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
            <p className="text-gray-600 mb-6">Our team will contact you within 24 hours.</p>
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
          <p className="text-gray-600 mt-2">Fill in the details and our team will reach out to you.</p>
        </div>
        <Card className="shadow-lg">
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2"><Label className="text-gray-800 text-sm font-medium">Company Name *</Label><Input placeholder="Your company" value={form.companyName} onChange={(e) => update('companyName', e.target.value)} /></div>
                <div className="space-y-2"><Label className="text-gray-800 text-sm font-medium">Contact Name *</Label><Input placeholder="Full name" value={form.contactName} onChange={(e) => update('contactName', e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2"><Label className="text-gray-800 text-sm font-medium">Email *</Label><Input type="email" placeholder="email@company.com" value={form.email} onChange={(e) => update('email', e.target.value)} /></div>
                <div className="space-y-2"><Label className="text-gray-800 text-sm font-medium">Phone *</Label><Input placeholder="+91 XXXXX XXXXX" value={form.phone} onChange={(e) => update('phone', e.target.value)} /></div>
              </div>
              <div className="space-y-2"><Label className="text-gray-800 text-sm font-medium">Address</Label><Input placeholder="Office address" value={form.address} onChange={(e) => update('address', e.target.value)} /></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2"><Label className="text-gray-800 text-sm font-medium">Plan</Label>
                  <select value={form.plan} onChange={(e) => update('plan', e.target.value)} className="w-full h-10 rounded-md border border-gray-200 bg-white px-3 text-sm">
                    <option value="">Select plan</option>
                    <option value="free">Free</option>
                    <option value="starter">Starter</option>
                    <option value="professional">Professional</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
                <div className="space-y-2"><Label className="text-gray-800 text-sm font-medium">Employee Count</Label><Input placeholder="e.g. 50" value={form.employeeCount} onChange={(e) => update('employeeCount', e.target.value)} /></div>
              </div>
              <div className="space-y-2"><Label className="text-gray-800 text-sm font-medium">Message</Label><Textarea placeholder="Tell us about your requirements..." rows={3} value={form.message} onChange={(e) => update('message', e.target.value)} /></div>
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
  const [expandedPortal, setExpandedPortal] = useState<string | null>(null)
  const [forgotOpen, setForgotOpen] = useState(false)
  const homeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollTo = useCallback((id: string) => { setMobileMenu(false); const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }) }, [])
  const goHome = useCallback(() => { setView('home'); window.scrollTo({ top: 0, behavior: 'smooth' }) }, [])
  const openServiceModal = useCallback((service: ServiceDetail) => { setActiveService(service); setServiceModalOpen(true) }, [])
  const togglePortal = useCallback((id: string) => { setExpandedPortal((prev) => (prev === id ? null : id)) }, [])

  const NAV_LINKS = [
    { id: 'features', label: 'Features' },
    { id: 'services', label: 'Services' },
    { id: 'portals', label: 'All Portals' },
    { id: 'pricing', label: 'Pricing' },
    { id: 'contact', label: 'Contact' },
  ]

  if (view === 'register') return <RegistrationForm onBack={goHome} />
  if (view === 'subscribe') return <SubscriptionForm onBack={goHome} />

  return (
    <div ref={homeRef} className="min-h-screen flex flex-col bg-white">
      <SocialSideMenu />
      <ServiceModal service={activeService} open={serviceModalOpen} onClose={() => setServiceModalOpen(false)} />
      <ForgotPasswordDialog open={forgotOpen} onOpenChange={setForgotOpen} />

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
                <span className="text-[10px] font-medium tracking-widest uppercase leading-tight text-gray-500">by HP Enterprise</span>
              </div>
            </button>

            <div className="hidden lg:flex items-center gap-1">
              {NAV_LINKS.map((link) => (
                <button key={link.id} onClick={() => scrollTo(link.id)} className="px-3.5 py-2 rounded-lg text-[13px] font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200">
                  {link.label}
                </button>
              ))}
            </div>

            <div className="hidden lg:flex items-center gap-3">
              <LanguageSwitcher />
              <Button variant="ghost" className="text-sm font-semibold h-9 text-gray-700 hover:text-gray-900 hover:bg-gray-100" onClick={() => scrollTo('portals')}>Login</Button>
              <Button className="text-sm font-bold h-9 px-5 rounded-lg text-white" style={{ background: '#D4AF37', color: '#002B5C' }} onClick={() => setView('subscribe')}>Start Free Trial</Button>
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
                  <button key={link.id} onClick={() => scrollTo(link.id)} className="block w-full text-left px-4 py-2.5 rounded-lg text-sm font-semibold text-gray-800 hover:bg-gray-50 hover:text-gray-900 transition-colors capitalize">{link.label}</button>
                ))}
                <div className="pt-3 flex flex-col gap-2">
                  <Button variant="outline" className="w-full text-sm font-semibold" onClick={() => { scrollTo('portals'); setMobileMenu(false) }}>Login to Portal</Button>
                  <Button className="w-full text-sm font-bold text-white" style={{ background: '#D4AF37', color: '#002B5C' }} onClick={() => { setView('subscribe'); setMobileMenu(false) }}>Start Free Trial</Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ══════════════════════════════════════════════════════════════════════
          HERO SECTION
         ══════════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #001A3D 0%, #002B5C 40%, #0A4488 100%)' }}>
        {/* Hero background image */}
        <div className="absolute inset-0">
          <Image src="/hero-banner.png" alt="" fill className="object-cover opacity-20" priority />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(0,26,61,0.85) 0%, rgba(0,43,92,0.75) 40%, rgba(10,68,136,0.70) 100%)' }} />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
          <div className="max-w-3xl">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.25, 0.4, 0.25, 1] }}>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8 text-sm font-semibold bg-white/10 border border-white/20 text-white backdrop-blur-sm">
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
                <Button size="lg" className="text-base font-bold h-12 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300" style={{ background: '#D4AF37', color: '#002B5C' }} onClick={() => scrollTo('portals')}>
                  Access All Portals<ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button size="lg" variant="outline" className="text-base font-semibold h-12 px-8 rounded-xl border-white/30 text-white hover:bg-white/10 hover:text-white transition-all duration-300" onClick={() => scrollTo('services')}>
                  Explore Services
                </Button>
                <Button size="lg" variant="outline" className="text-base font-semibold h-12 px-8 rounded-xl border-white/30 text-white hover:bg-white/10 hover:text-white transition-all duration-300" onClick={() => setView('subscribe')}>
                  Book a Demo
                </Button>
              </div>

              <div className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-white font-medium">
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
                <div className="flex items-center gap-1.5 text-sm text-gray-800 font-semibold">
                  <Check className="h-3.5 w-3.5 text-emerald-600" />{badge}
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
              <Badge className="mb-4 px-4 py-1 text-sm font-semibold" style={{ background: 'rgba(0,43,92,0.06)', color: '#002B5C', border: '1px solid rgba(0,43,92,0.1)' }}>Enterprise Solutions</Badge>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight">
                Comprehensive
                <br />
                <span style={{ color: '#002B5C' }}>Business Services</span>
              </h2>
              <p className="mt-4 text-gray-700 max-w-2xl mx-auto text-lg font-medium">
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
                    <div className="relative h-48 overflow-hidden">
                      <Image src={service.image} alt={service.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      <div className="absolute bottom-3 left-4 flex items-center gap-2">
                        <div className="h-9 w-9 rounded-lg flex items-center justify-center" style={{ background: '#D4AF37' }}>
                          <Icon className="h-4.5 w-4.5" style={{ color: '#002B5C' }} />
                        </div>
                        <span className="text-xs font-bold text-white uppercase tracking-wider">{service.short.split(' ').slice(0, 3).join(' ')}</span>
                      </div>
                    </div>
                    <div className="p-5">
                      <h3 className="text-lg font-bold text-gray-900 mb-1.5">{service.title}</h3>
                      <p className="text-sm text-gray-600 leading-relaxed mb-4">{service.short}</p>
                      <div className="flex items-center gap-1.5 text-sm font-bold" style={{ color: '#002B5C' }}>
                        View Details <ChevronRight className="h-3.5 w-3.5" />
                      </div>
                    </div>
                  </motion.div>
                </Reveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          AI FEATURES SECTION
         ══════════════════════════════════════════════════════════════════════ */}
      <section id="features" className="py-20 sm:py-24 bg-white" aria-label="AI Features">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center mb-14">
              <Badge className="mb-4 px-4 py-1 text-sm font-semibold" style={{ background: 'rgba(0,43,92,0.06)', color: '#002B5C', border: '1px solid rgba(0,43,92,0.1)' }}>Powered by AI</Badge>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight">
                Intelligent
                <br />
                <span style={{ color: '#002B5C' }}>Platform Features</span>
              </h2>
              <p className="mt-4 text-gray-700 max-w-2xl mx-auto text-lg font-medium">
                Every feature is designed to make workforce management smarter, faster, and more efficient.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {HPHRMS_FEATURES.map((feature, i) => {
              const featureIcons: Record<string, LucideIcon> = {
                'AI HR Assistant': Bot, 'Employee Management': Users, 'Recruitment & ATS': Target,
                'Attendance Management': Clock, 'Leave Management': CalendarDays, 'Payroll Processing': Wallet,
                'Employee Self Service (ESS)': MonitorSmartphone, 'Shift & Roster Management': ClipboardList,
                'Document Management': FileText, 'Reports & Analytics': BarChart3,
                'Multi Branch Management': Building2, 'Enterprise Grade Security': Shield,
              }
              const Icon = featureIcons[feature] || Zap
              return (
                <Reveal key={feature} delay={i * 0.05}>
                  <motion.div whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="flex items-start gap-4 p-5 rounded-xl bg-white border border-gray-100 hover:shadow-lg hover:border-gray-200 transition-all duration-300 group"
                  >
                    <div className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(0,43,92,0.06)' }}>
                      <Icon className="h-5 w-5" style={{ color: '#002B5C' }} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 mb-1">{feature}</h3>
                      <p className="text-xs text-gray-500 leading-relaxed">AI-enhanced {feature.toLowerCase()} for your organization.</p>
                    </div>
                  </motion.div>
                </Reveal>
              )
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          ALL PORTALS — Inline Login on Main Landing Page
         ══════════════════════════════════════════════════════════════════════ */}
      <section id="portals" className="py-20 sm:py-24 bg-gray-50" aria-label="All portal access">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center mb-14">
              <Badge className="mb-4 px-4 py-1 text-sm font-semibold" style={{ background: 'rgba(0,43,92,0.06)', color: '#002B5C', border: '1px solid rgba(0,43,92,0.1)' }}>All Access Portals</Badge>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight">
                Every Portal.
                <br />
                <span style={{ color: '#002B5C' }}>One Platform.</span>
              </h2>
              <p className="mt-4 text-gray-700 max-w-2xl mx-auto text-lg font-medium">
                Select your role and login directly. Need access? Request it via WhatsApp — we will set it up for you.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {PORTALS.map((portal, i) => {
              const Icon = portal.icon
              const isExpanded = expandedPortal === portal.id
              return (
                <Reveal key={portal.id} delay={i * 0.06}>
                  <motion.div
                    whileHover={{ y: -4 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 bg-white"
                  >
                    {/* Portal card header */}
                    <div
                      className="relative p-6 cursor-pointer"
                      style={{ background: `linear-gradient(160deg, ${portal.color}, ${portal.color}dd)` }}
                      onClick={() => togglePortal(portal.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-white/20 backdrop-blur-sm">
                            <Icon className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-xl font-bold text-white">{portal.title}</h3>
                              <Badge className="text-[10px] font-bold px-2 py-0.5" style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}>{portal.role}</Badge>
                            </div>
                            <p className="text-sm text-white/80 leading-relaxed">{portal.description}</p>
                          </div>
                        </div>
                        <motion.div
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          transition={{ duration: 0.3 }}
                          className="shrink-0 mt-1"
                        >
                          <ChevronRight className="h-5 w-5 text-white/70" />
                        </motion.div>
                      </div>

                      {/* Features preview when not expanded */}
                      {!isExpanded && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {portal.features.slice(0, 3).map((f) => (
                            <span key={f} className="inline-flex items-center gap-1 text-xs font-medium text-white/80 bg-white/10 rounded-full px-2.5 py-1">
                              <Check className="h-3 w-3" />{f}
                            </span>
                          ))}
                          {portal.features.length > 3 && (
                            <span className="text-xs font-medium text-white/60">+{portal.features.length - 3} more</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Expandable login / access section */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: [0.25, 0.4, 0.25, 1] }}
                          className="overflow-hidden"
                        >
                          <div className="p-6 bg-white border-t border-gray-100">
                            {/* All features list */}
                            <div className="mb-5">
                              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Portal Capabilities</h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {portal.features.map((f) => (
                                  <div key={f} className="flex items-center gap-2 text-sm text-gray-800 font-medium">
                                    <Check className="h-3.5 w-3.5 shrink-0" style={{ color: portal.color }} />{f}
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Login form for non-request portals */}
                            {!portal.requestAccess ? (
                              <PortalLoginCard portal={portal} onForgotPassword={() => setForgotOpen(true)} />
                            ) : (
                              <div className="space-y-3">
                                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                                  <p className="text-sm font-semibold text-amber-900 mb-1">Access Required</p>
                                  <p className="text-xs text-amber-700 leading-relaxed">This portal requires setup and access provisioning. Contact us to get your credentials.</p>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-3">
                                  <a href={SOCIAL.whatsapp} target="_blank" rel="noopener noreferrer"
                                    className="flex-1 h-10 rounded-xl flex items-center justify-center gap-2 text-sm font-bold text-white transition-all hover:opacity-90" style={{ background: '#25D366' }}>
                                    <WhatsAppIcon className="h-4 w-4" />Request via WhatsApp
                                  </a>
                                  <a href={`tel:${BRAND.phone}`}
                                    className="flex-1 h-10 rounded-xl flex items-center justify-center gap-2 text-sm font-bold text-white transition-all hover:opacity-90" style={{ background: portal.color }}>
                                    <Phone className="h-4 w-4" />Call Us
                                  </a>
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Bottom bar - always visible */}
                    <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full" style={{ background: portal.color }} />
                        <span className="text-xs font-semibold text-gray-500">Role: {portal.role}</span>
                      </div>
                      <button
                        onClick={() => togglePortal(portal.id)}
                        className="text-xs font-bold transition-colors hover:underline"
                        style={{ color: portal.color }}
                      >
                        {isExpanded ? 'Collapse' : 'Login / Access'}
                      </button>
                    </div>
                  </motion.div>
                </Reveal>
              )
            })}
          </div>

          {/* Portal summary note */}
          <Reveal delay={0.3}>
            <div className="mt-10 p-6 rounded-2xl bg-white border border-gray-200 shadow-sm">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(0,43,92,0.06)' }}>
                  <Headphones className="h-6 w-6" style={{ color: '#002B5C' }} />
                </div>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-gray-900 mb-1">Need Access to a Portal?</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">Contact our support team to get your portal credentials. We will set up your account and provide training within 24 hours.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                  <a href={SOCIAL.whatsapp} target="_blank" rel="noopener noreferrer"
                    className="h-10 px-5 rounded-xl flex items-center justify-center gap-2 text-sm font-bold text-white transition-all hover:opacity-90" style={{ background: '#25D366' }}>
                    <WhatsAppIcon className="h-4 w-4" />WhatsApp
                  </a>
                  <a href={`tel:${BRAND.phone}`}
                    className="h-10 px-5 rounded-xl flex items-center justify-center gap-2 text-sm font-bold text-white transition-all hover:opacity-90" style={{ background: '#002B5C' }}>
                    <Phone className="h-4 w-4" />{BRAND.phone}
                  </a>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          PRICING SECTION
         ══════════════════════════════════════════════════════════════════════ */}
      <section id="pricing" className="py-20 sm:py-24 bg-white" aria-label="Pricing plans">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center mb-14">
              <Badge className="mb-4 px-4 py-1 text-sm font-semibold" style={{ background: 'rgba(0,43,92,0.06)', color: '#002B5C', border: '1px solid rgba(0,43,92,0.1)' }}>Pricing</Badge>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight">
                Simple, Transparent
                <br />
                <span style={{ color: '#002B5C' }}>Pricing</span>
              </h2>
              <p className="mt-4 text-gray-700 max-w-xl mx-auto text-lg font-medium">Start free, scale as you grow. No hidden charges.</p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {PRICING_PLANS.map((plan, i) => (
              <Reveal key={plan.name} delay={i * 0.1}>
                <motion.div whileHover={{ y: -6 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
                  <div className={cn('relative rounded-2xl overflow-hidden h-full flex flex-col', plan.popular ? 'shadow-xl border-2' : 'shadow-sm border')} style={plan.popular ? { borderColor: '#D4AF37' } : { borderColor: '#E5E7EB' }}>
                    {plan.popular && (
                      <div className="text-center py-2 text-xs font-bold uppercase tracking-widest text-white" style={{ background: '#D4AF37', color: '#002B5C' }}>
                        Most Popular
                      </div>
                    )}
                    <div className="p-6 flex-1 flex flex-col">
                      <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                      <p className="text-sm text-gray-600 mt-1 mb-4">{plan.description}</p>
                      <div className="mb-6">
                        <span className="text-3xl font-extrabold text-gray-900">{plan.price}</span>
                        <span className="text-sm text-gray-500 font-medium">{plan.period}</span>
                      </div>
                      <ul className="space-y-2.5 flex-1 mb-6">
                        {plan.features.map((f) => (
                          <li key={f} className="flex items-center gap-2 text-sm text-gray-800 font-medium">
                            <Check className="h-4 w-4 shrink-0 text-emerald-600" />{f}
                          </li>
                        ))}
                      </ul>
                      <Button
                        className={cn('w-full h-11 font-bold rounded-xl text-sm', plan.popular ? 'text-white' : 'border-gray-200 text-gray-800 hover:bg-gray-50')}
                        style={plan.popular ? { background: '#002B5C' } : {}}
                        variant={plan.popular ? 'default' : 'outline'}
                        onClick={() => setView('subscribe')}
                      >
                        {plan.price === 'Custom' ? 'Contact Sales' : 'Get Started'} <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
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
              <Badge className="mb-4 px-4 py-1 text-sm font-semibold" style={{ background: 'rgba(0,43,92,0.06)', color: '#002B5C', border: '1px solid rgba(0,43,92,0.1)' }}>Get In Touch</Badge>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight">
                Let&apos;s Build Something
                <br />
                <span style={{ color: '#002B5C' }}>Great Together</span>
              </h2>
              <p className="mt-4 text-gray-700 max-w-xl mx-auto text-lg font-medium">Reach out for demos, inquiries, or partnership opportunities.</p>
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
                      <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{item.label}</div>
                      <div className="text-sm font-semibold text-gray-800 group-hover:text-gray-900 transition-colors leading-relaxed">{item.value}</div>
                    </div>
                  </a>
                ))}

                <div className="pt-4">
                  <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Connect With Us</div>
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
                  <CardDescription className="text-gray-600 font-medium">We typically respond within 24 hours.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={(e) => { e.preventDefault(); toast.success('Message sent! We will get back to you soon.') }} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2"><Label className="text-gray-800 text-sm font-medium">Name</Label><Input placeholder="Your name" /></div>
                      <div className="space-y-2"><Label className="text-gray-800 text-sm font-medium">Email</Label><Input type="email" placeholder="you@company.com" /></div>
                    </div>
                    <div className="space-y-2"><Label className="text-gray-800 text-sm font-medium">Subject</Label><Input placeholder="How can we help?" /></div>
                    <div className="space-y-2"><Label className="text-gray-800 text-sm font-medium">Message</Label><Textarea placeholder="Tell us about your requirements..." rows={4} /></div>
                    <Button type="submit" className="w-full h-11 font-bold text-white rounded-xl" style={{ background: '#002B5C' }}>
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
      <footer className="mt-auto bg-gray-900 text-gray-300" role="contentinfo">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {/* Brand */}
            <div className="lg:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <BrandLogo size={32} />
                <div className="flex flex-col">
                  <span className="font-extrabold text-sm text-white">HP ENTERPRISE</span>
                  <span className="text-[9px] font-semibold tracking-widest uppercase text-gray-400">Building Safer Tomorrow</span>
                </div>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed mb-4">{BRAND.taglineFull}</p>
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
                  <li key={s}><span className="text-sm text-gray-300 hover:text-white transition-colors cursor-default font-medium">{s}</span></li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Legal & Compliance</h4>
              <ul className="space-y-2.5 text-sm text-gray-300">
                <li className="flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />GSTIN: {BRAND.gstin}</li>
                <li className="flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />PAN: {BRAND.pan}</li>
                <li className="flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />UDYAM: {BRAND.udyam}</li>
                <li className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-gray-400" />Bengaluru, Karnataka</li>
                <li className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-gray-400" />Chitradurga, Karnataka</li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Contact</h4>
              <ul className="space-y-2.5 text-sm text-gray-300">
                <li className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" />{BRAND.phone}</li>
                <li className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" />{BRAND.hrPhone}</li>
                <li className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" />{BRAND.email}</li>
                <li className="flex items-center gap-2"><Globe2 className="h-3.5 w-3.5" /><a href={BRAND.website} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors font-medium">{BRAND.website}</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-gray-400 font-medium">&copy; {new Date().getFullYear()} HP ENTERPRISE. All rights reserved.</p>
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span>Managing Director: {BRAND.managingDirector}</span>
              <span className="hidden sm:inline">&bull;</span>
              <span className="hidden sm:inline">EHS Director: {BRAND.ehsDirector}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}