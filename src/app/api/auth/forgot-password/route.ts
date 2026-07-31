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
    const user = await db.user.findUnique({ where: { username } })
    if (!user) {
      return NextResponse.json({ error: 'No account found with that username' }, { status: 404 })
    }
    const tempPassword = 'Temp@123'
    const hash = await hashPassword(tempPassword)
    await db.user.update({
      where: { id: user.id },
      data: { passwordHash: hash, mustResetPassword: true },
    })
    await audit(user.id, 'PASSWORD_RESET', 'User', user.id)
    return NextResponse.json({
      ok: true,
      message: 'Password has been reset to Temp@123. Please login and change it.',
    })
  } catch (e) {
    console.error('forgot password error', e)
    return NextResponse.json({ error: 'Failed to reset password' }, { status: 500 })
  }
}
