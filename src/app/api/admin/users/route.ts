import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, hashPassword, audit } from '@/lib/auth'
import { requireRole } from '@/lib/guards'
import { ROLE_LABELS } from '@/lib/constants'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { error } = await requireRole('OWNER', 'SUPER_ADMIN')
    if (error) return error
    const users = await db.user.findMany({
      where: { role: { in: ['OWNER', 'SUPER_ADMIN', 'HR_MANAGER', 'CLIENT'] } },
      orderBy: { createdAt: 'asc' },
      select: { id: true, username: true, email: true, role: true, locked: true, mustResetPassword: true, lastLoginAt: true, createdAt: true, employee: { select: { id: true, fullName: true, employeeCode: true } } },
    })
    return NextResponse.json({ users })
  } catch (e) {
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const cu = await getCurrentUser()
  if (!cu) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['OWNER', 'SUPER_ADMIN'].includes(cu.user.role)) return NextResponse.json({ error: 'Only the Owner or Super Admin can create accounts' }, { status: 403 })
  try {
    const body = await req.json()
    const { username, email, password, role, fullName } = body
    if (!username || !email || !password) return NextResponse.json({ error: 'Username, email and password are required' }, { status: 400 })
    const allowedRoles = ['SUPER_ADMIN', 'HR_MANAGER', 'CLIENT']
    if (!allowedRoles.includes(role)) return NextResponse.json({ error: 'Owner can only create Admin, HR Manager, or Client accounts' }, { status: 400 })
    if (password.length < 8) return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })

    // For CLIENT role, clientId is required
    let clientId: string | undefined
    if (role === 'CLIENT') {
      clientId = body.clientId
      if (!clientId) return NextResponse.json({ error: 'Client ID is required for CLIENT role' }, { status: 400 })
      const clientExists = await db.client.findUnique({ where: { id: clientId } })
      if (!clientExists) return NextResponse.json({ error: 'Selected client does not exist' }, { status: 400 })
    }

    const existing = await db.user.findFirst({ where: { OR: [{ username: username.toLowerCase().trim() }, { email: email.toLowerCase().trim() }] } })
    if (existing) return NextResponse.json({ error: 'Username or email already exists' }, { status: 400 })

    const user = await db.user.create({
      data: {
        username: username.toLowerCase().trim(),
        email: email.toLowerCase().trim(),
        passwordHash: await hashPassword(password),
        role,
        clientId: clientId || null,
        mustResetPassword: role === 'CLIENT' ? true : false,
      },
    })
    await audit(cu.user.id, 'CREATE_USER', 'User', user.id, `Created ${ROLE_LABELS[role]}: ${user.username}`)
    return NextResponse.json({ ok: true, user: { id: user.id, username: user.username, email: user.email, role: user.role } })
  } catch (e) {
    console.error('create user error', e)
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}
