import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, generateSecureTempPassword, audit } from '@/lib/auth'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

export const runtime = 'nodejs'

// Rate limit: 5 resets per hour per IP
const MAX_RESETS = 5
const WINDOW_MS = 60 * 60 * 1000

export async function POST(req: NextRequest) {
  // Rate limiting
  const ip = getClientIp(req)
  if (!checkRateLimit(`forgot-pw:${ip}`, MAX_RESETS, WINDOW_MS)) {
    return NextResponse.json(
      { error: 'Too many password reset attempts. Please try again later.' },
      { status: 429 }
    )
  }

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
    const tempPassword = generateSecureTempPassword()
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
