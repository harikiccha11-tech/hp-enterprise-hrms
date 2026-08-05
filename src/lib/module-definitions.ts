import {
  LayoutDashboard,
  Settings,
  HelpCircle,
  Users,
  ClipboardCheck,
  DollarSign,
  Calendar,
  Target,
  FileText,
  Star,
  Building2,
  MapPin,
  Clock,
  FileStack,
  Receipt,
  CreditCard,
  BarChart3,
  Bot,
} from 'lucide-react'
import type { AccountType, ClientRole } from './account-context'

export interface NavModule {
  id: string
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  requiresRole?: ClientRole[]
  accountTypes?: AccountType[]
  isSectionHeader?: boolean
}

export const MODULE_DEFINITIONS: NavModule[] = [
  // Common (all accounts)
  { id: 'dashboard', label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { id: 'settings', label: 'Settings', href: '/settings', icon: Settings },
  { id: 'support', label: 'Support', href: '/support', icon: HelpCircle },

  // HRMS SaaS + Hybrid – Internal Staff
  {
    id: 'internal_staff_header',
    label: 'Internal Staff',
    icon: Users,
    isSectionHeader: true,
    accountTypes: ['hrms_saas', 'hybrid'],
  },
  { id: 'employees', label: 'Employees', href: '/employees', icon: Users, accountTypes: ['hrms_saas', 'hybrid'] },
  { id: 'attendance_internal', label: 'Attendance', href: '/attendance', icon: ClipboardCheck, accountTypes: ['hrms_saas', 'hybrid'] },
  {
    id: 'payroll',
    label: 'Payroll',
    href: '/payroll',
    icon: DollarSign,
    accountTypes: ['hrms_saas', 'hybrid'],
    requiresRole: ['admin', 'hr'],
  },
  { id: 'leave', label: 'Leave', href: '/leave', icon: Calendar, accountTypes: ['hrms_saas', 'hybrid'] },
  { id: 'recruitment', label: 'Recruitment', href: '/recruitment', icon: Target, accountTypes: ['hrms_saas', 'hybrid'] },
  { id: 'documents', label: 'Documents', href: '/documents', icon: FileText, accountTypes: ['hrms_saas', 'hybrid'] },
  { id: 'performance', label: 'Performance', href: '/performance', icon: Star, accountTypes: ['hrms_saas', 'hybrid'] },

  // Manpower Supply + Hybrid – Deployed Staff
  {
    id: 'deployed_staff_header',
    label: 'Deployed Staff',
    icon: Building2,
    isSectionHeader: true,
    accountTypes: ['manpower_supply', 'hybrid'],
  },
  { id: 'deployed_staff', label: 'Deployed Staff', href: '/deployed-staff', icon: Building2, accountTypes: ['manpower_supply', 'hybrid'] },
  {
    id: 'site_assignments',
    label: 'Site Assignments',
    href: '/site-assignments',
    icon: MapPin,
    accountTypes: ['manpower_supply', 'hybrid'],
    requiresRole: ['admin', 'hr'],
  },
  {
    id: 'attendance_deployed',
    label: 'Attendance (Deployed)',
    href: '/attendance-deployed',
    icon: ClipboardCheck,
    accountTypes: ['manpower_supply', 'hybrid'],
  },
  { id: 'leave_status', label: 'Leave Status', href: '/leave-status', icon: Calendar, accountTypes: ['manpower_supply', 'hybrid'] },
  { id: 'timesheets', label: 'Timesheets', href: '/timesheets', icon: Clock, accountTypes: ['manpower_supply', 'hybrid'] },
  { id: 'invoices', label: 'Invoices', href: '/invoices', icon: Receipt, accountTypes: ['manpower_supply', 'hybrid'] },
  {
    id: 'payments',
    label: 'Payments',
    href: '/payments',
    icon: CreditCard,
    accountTypes: ['manpower_supply', 'hybrid'],
    requiresRole: ['admin', 'viewer'],
  },

  // Reports & AI
  { id: 'reports', label: 'Reports', href: '/reports', icon: BarChart3 },
  {
    id: 'ai_assistant',
    label: 'AI Assistant',
    href: '/ai-assistant',
    icon: Bot,
    accountTypes: ['hrms_saas', 'hybrid'],
  },
]

export function getVisibleModules(
  accountType: AccountType | null,
  clientRole: ClientRole | null
): NavModule[] {
  if (!accountType || !clientRole) {
    return MODULE_DEFINITIONS.filter((m) =>
      ['dashboard', 'settings', 'support'].includes(m.id)
    )
  }

  return MODULE_DEFINITIONS.filter((m) => {
    if (['dashboard', 'settings', 'support', 'reports'].includes(m.id)) return true
    if (m.isSectionHeader) return true
    if (m.accountTypes && !m.accountTypes.includes(accountType)) return false
    if (m.requiresRole && !m.requiresRole.includes(clientRole)) return false
    return true
  })
}
