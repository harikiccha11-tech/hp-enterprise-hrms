import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/guards'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const { error } = await requireRole('OWNER', 'SUPER_ADMIN')
  if (error) return error
  try {
    const now = new Date()
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    // Failed login attempts in last 24h
    const failedLogins = await db.auditLog.count({
      where: {
        action: 'FAILED_LOGIN',
        at: { gte: twentyFourHoursAgo },
      },
    })

    // Recent logins (last 24h)
    const recentLogins = await db.auditLog.count({
      where: {
        action: 'LOGIN',
        at: { gte: twentyFourHoursAgo },
      },
    })

    // Active users (logged in last 24h)
    const activeSessions = await db.user.count({
      where: {
        lastLoginAt: { gte: twentyFourHoursAgo },
      },
    })

    // Locked accounts
    const lockedAccounts = await db.user.count({
      where: { locked: true },
    })

    // Total security events in last 24h
    const securityEvents = await db.auditLog.count({
      where: {
        action: { in: ['LOGIN', 'FAILED_LOGIN', 'LOGOUT', 'SECURITY'] },
        at: { gte: twentyFourHoursAgo },
      },
    })

    // Recent audit logs (security-related)
    const recentLogs = await db.auditLog.findMany({
      where: {
        action: { in: ['LOGIN', 'FAILED_LOGIN', 'LOGOUT', 'SECURITY'] },
      },
      take: 50,
      orderBy: { at: 'desc' },
      include: {
        user: {
          select: { id: true, username: true, email: true, role: true },
        },
      },
    })

    return NextResponse.json({
      failedLogins,
      recentLogins,
      activeSessions,
      lockedAccounts,
      securityEvents,
      recentLogs,
    })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to load security data' }, { status: 500 })
  }
}
