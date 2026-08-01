import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const cu = await getCurrentUser()
    if (!cu) return NextResponse.json({ user: null }, { status: 200 })
    const { user, session } = cu

    // If CLIENT role, resolve linked client
    let linkedClient = null
    if (user.role === 'CLIENT' && user.clientId) {
      linkedClient = await db.client.findUnique({ where: { id: user.clientId } })
    }

    return NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        mustResetPassword: user.mustResetPassword,
        employeeId: user.employee?.id ?? null,
        clientId: linkedClient?.id ?? null,
        client: linkedClient
          ? {
              id: linkedClient.id,
              clientName: linkedClient.clientName,
              companyName: linkedClient.companyName,
              email: linkedClient.email,
              phone: linkedClient.phone,
            }
          : null,
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
  } catch (e) {
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}
