import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { verifyPassword, createSessionToken, setSessionCookie, audit } from '@/lib/auth'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json()
    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 })
    }
    const user = await db.user.findUnique({
      where: { username: String(username).toLowerCase().trim() },
      include: { employee: true },
    })
    if (!user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }
    if (user.locked) {
      return NextResponse.json({ error: 'Account is locked. Contact your administrator.' }, { status: 403 })
    }
    const ok = await verifyPassword(password, user.passwordHash)
    if (!ok) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } })
    const token = await createSessionToken({
      userId: user.id,
      username: user.username,
      role: user.role as 'OWNER' | 'SUPER_ADMIN' | 'HR_MANAGER' | 'EMPLOYEE',
      employeeId: user.employee?.id,
    })
    await setSessionCookie(token)
    await audit(user.id, 'LOGIN', 'User', user.id)

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
  } catch (e) {
    console.error('login error', e)
    return NextResponse.json({ error: 'Login failed' }, { status: 500 })
  }
}
