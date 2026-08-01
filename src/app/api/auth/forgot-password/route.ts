import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, audit } from '@/lib/auth'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const { username } = await req.json()
    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 })
    }
    const normalized = String(username).toLowerCase().trim()
    const user = await db.user.findUnique({ where: { username: normalized } })
    // Always return the same message to prevent username enumeration
    if (!user) {
      return NextResponse.json({ ok: true, message: 'If an account exists with that username, the password has been reset. Please contact admin for the new password.' })
    }
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#'
    const tempPassword = 'Temp@' + Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
    const hash = await hashPassword(tempPassword)
    await db.user.update({
      where: { id: user.id },
      data: { passwordHash: hash, mustResetPassword: true },
    })
    await audit(user.id, 'PASSWORD_RESET', 'User', user.id)
    return NextResponse.json({
      ok: true,
      message: 'If an account exists with that username, the password has been reset. Please contact admin for the new password.',
    })
  } catch (e) {
    console.error('forgot password error', e)
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 })
  }
}
