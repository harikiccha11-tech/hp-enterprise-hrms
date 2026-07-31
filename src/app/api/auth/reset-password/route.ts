import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, hashPassword, verifyPassword, audit } from '@/lib/auth'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const cu = await getCurrentUser()
    if (!cu) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { currentPassword, newPassword } = await req.json()
    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }
    const user = cu.user
    if (user.mustResetPassword !== true || currentPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: 'Current password is required' }, { status: 400 })
      }
      const ok = await verifyPassword(currentPassword, user.passwordHash)
      if (!ok) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
    }
    const hash = await hashPassword(newPassword)
    await db.user.update({ where: { id: user.id }, data: { passwordHash: hash, mustResetPassword: false } })
    await audit(user.id, 'PASSWORD_RESET', 'User', user.id)
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('reset password error', e)
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 })
  }
}
