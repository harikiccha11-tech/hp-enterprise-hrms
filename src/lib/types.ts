// Shared client-side types for the HP ENTERPRISE workforce management system
export type View =
  | 'login'
  | 'register'
  | 'forgot'
  | 'admin'
  | 'employee'
  | 'client'

export interface AppUser {
  id: string
  username: string
  email: string
  role: 'OWNER' | 'SUPER_ADMIN' | 'HR_MANAGER' | 'EMPLOYEE' | 'CLIENT'
  mustResetPassword: boolean
  employeeId?: string | null
  clientId?: string | null
  accountId?: string | null
  accountType?: string | null
  clientRole?: string | null
  client?: {
    id: string
    clientName: string
    companyName: string | null
    email: string | null
    phone: string | null
  } | null
  employee?: {
    id: string
    employeeCode: string | null
    fullName: string
    designation: string | null
    department: string | null
  } | null
  account?: {
    id: string
    organizationName: string
    accountType: string
    status: string
  } | null
}
