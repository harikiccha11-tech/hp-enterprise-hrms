import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, audit } from '@/lib/auth'
import { requireRole } from '@/lib/guards'
import { notify } from '@/lib/notify'

export const runtime = 'nodejs'

function genTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#$'
  let p = ''
  for (let i = 0; i < 12; i++) p += chars[Math.floor(Math.random() * chars.length)]
  return p
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN', 'HR_MANAGER')
  if (error) return error
  try {
    const { id } = await params
    const emp = await db.employee.findUnique({ where: { id }, include: { user: true } })
    if (!emp || !emp.user) return NextResponse.json({ error: 'No login account for this employee' }, { status: 400 })
    const tempPassword = genTempPassword()
    await db.user.update({
      where: { id: emp.user.id },
      data: { passwordHash: await hashPassword(tempPassword), mustResetPassword: true, locked: false },
    })
    await notify(
      emp.user.id,
      'Password Reset by Admin',
      'Your password has been reset. Please login with the new temporary password and change it.',
      'WARNING',
    )
    await audit(cu!.user.id, 'RESET_PASSWORD', 'User', emp.user.id, `Reset password for ${emp.fullName}`)
    return NextResponse.json({ ok: true, message: 'Password reset. New credentials sent via notification.' })
  } catch (e) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN', 'HR_MANAGER')
  if (error) return error
  try {
    const { id } = await params
    const { action } = await req.json() // lock | unlock
    const emp = await db.employee.findUnique({ where: { id }, include: { user: true } })
    if (!emp || !emp.user) return NextResponse.json({ error: 'No login account for this employee' }, { status: 400 })
    const locked = action === 'lock'
    await db.user.update({ where: { id: emp.user.id }, data: { locked } })
    await audit(cu!.user.id, locked ? 'LOCK_ACCOUNT' : 'UNLOCK_ACCOUNT', 'User', emp.user.id, `${locked ? 'Locked' : 'Unlocked'} ${emp.fullName}`)
    return NextResponse.json({ ok: true, locked })
  } catch (e) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
