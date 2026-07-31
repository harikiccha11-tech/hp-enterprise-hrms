import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const cu = await getCurrentUser()
  if (!cu) return NextResponse.json({ user: null }, { status: 200 })
  const { user, session } = cu
  return NextResponse.json({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      mustResetPassword: user.mustResetPassword,
      employeeId: user.employee?.id ?? null,
      employee: user.employee
        ? {
            id: user.employee.id,
            employeeCode: user.employee.employeeCode,
            fullName: user.employee.fullName,
            designation: user.employee.designation,
            department: user.employee.department,
          }
        : null,
    },
  })
}
