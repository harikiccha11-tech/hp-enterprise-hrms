// Shared client-side types for the HP ENTERPRISE workforce management system
export type View =
  | 'login'
  | 'register'
  | 'forgot'
  | 'admin'
  | 'employee'

export interface AppUser {
  id: string
  username: string
  email: string
  role: 'SUPER_ADMIN' | 'HR_MANAGER' | 'EMPLOYEE'
  mustResetPassword: boolean
  employeeId?: string | null
  employee?: {
    id: string
    employeeCode: string | null
    fullName: string
    designation: string | null
    department: string | null
  } | null
}
