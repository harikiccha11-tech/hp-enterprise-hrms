import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/guards'
import { hashPassword } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const VALID_ROLES = ['OWNER', 'SUPER_ADMIN', 'HR_MANAGER', 'EMPLOYEE', 'CLIENT']

export async function GET() {
  const { error } = await requireRole('OWNER', 'SUPER_ADMIN')
  if (error) return error
  try {
    const users = await db.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        locked: true,
        lastLoginAt: true,
        createdAt: true,
        employee: { select: { fullName: true } },
      },
    })
    // Group by role
    const grouped: Record<string, typeof users> = {}
    for (const u of users) {
      if (!grouped[u.role]) grouped[u.role] = []
      grouped[u.role].push(u)
    }
    return NextResponse.json({ users, grouped })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to load users' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN')
  if (error) return error
  try {
    const body = await req.json()
    const { username, email, password, role } = body
    if (!username?.trim()) return NextResponse.json({ error: 'Username is required' }, { status: 400 })
    if (!email?.trim()) return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    if (!password?.trim()) return NextResponse.json({ error: 'Password is required' }, { status: 400 })
    if (!role || !VALID_ROLES.includes(role)) return NextResponse.json({ error: 'Invalid role' }, { status: 400 })

    const existingUser = await db.user.findFirst({ where: { OR: [{ username: username.trim().toLowerCase() }, { email: email.trim().toLowerCase() }] } })
    if (existingUser) return NextResponse.json({ error: 'User with this username or email already exists' }, { status: 409 })

    const passwordHash = await hashPassword(password)
    const user = await db.user.create({
      data: {
        username: username.trim().toLowerCase(),
        email: email.trim().toLowerCase(),
        passwordHash,
        role,
      },
      select: { id: true, username: true, email: true, role: true, createdAt: true },
    })
    await (await import('@/lib/audit')).audit(cu!.user.id, 'CREATE_USER', 'User', user.id, user.username)
    return NextResponse.json({ ok: true, user })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN')
  if (error) return error
  try {
    const { id, role } = await req.json()
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    if (!role || !VALID_ROLES.includes(role)) return NextResponse.json({ error: 'Invalid role' }, { status: 400 })

    // Don't allow changing own role
    if (id === cu!.user.id) return NextResponse.json({ error: 'Cannot change your own role' }, { status: 400 })

    const user = await db.user.update({
      where: { id },
      data: { role },
      select: { id: true, username: true, email: true, role: true },
    })
    await (await import('@/lib/audit')).audit(cu!.user.id, 'UPDATE_USER_ROLE', 'User', id, `Changed role to ${role}`)
    return NextResponse.json({ ok: true, user })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to update user role' }, { status: 500 })
  }
}
