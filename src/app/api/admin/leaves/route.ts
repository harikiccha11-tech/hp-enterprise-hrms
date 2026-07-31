import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole, audit } from '@/lib/guards'
import { getCurrentUser } from '@/lib/auth'
import { notify } from '@/lib/notify'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const cu = await getCurrentUser()
  if (!cu) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')

  const where: any = {}
  if (status && status !== 'ALL') where.status = status
  if (cu.user.role === 'EMPLOYEE') where.employeeId = cu.user.employee?.id

  const leaves = await db.leave.findMany({
    where,
    include: { employee: { select: { id: true, fullName: true, employeeCode: true, designation: true } } },
    orderBy: { appliedAt: 'desc' },
    take: 300,
  })
  return NextResponse.json({ leaves })
}

export async function POST(req: NextRequest) {
  const cu = await getCurrentUser()
  if (!cu) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const body = await req.json()
    // Employee applies for leave
    if (cu.user.role === 'EMPLOYEE') {
      const employeeId = cu.user.employee?.id
      if (!employeeId) return NextResponse.json({ error: 'No employee profile' }, { status: 400 })
      const from = new Date(body.fromDate)
      const to = new Date(body.toDate)
      const days = Math.max(1, Math.round((to.getTime() - from.getTime()) / 86400000) + 1)
      const leave = await db.leave.create({
        data: {
          employeeId,
          leaveType: body.leaveType,
          fromDate: from,
          toDate: to,
          days,
          reason: body.reason,
          status: 'PENDING',
        },
      })
      // notify admins
      const admins = await db.user.findMany({ where: { role: { in: ['SUPER_ADMIN', 'HR_MANAGER'] } } })
      for (const a of admins) {
        await notify(
          a.id,
          'New Leave Application',
          `${cu.user.username} applied for ${days} day(s) ${body.leaveType} leave.`,
          'LEAVE',
          '/admin?tab=leaves',
        )
      }
      await audit(cu.user.id, 'APPLY_LEAVE', 'Leave', leave.id, `${body.leaveType} ${days}d`)
      return NextResponse.json({ ok: true, leave })
    }
    // Admin create on behalf
    const { error } = await requireRole('OWNER', 'SUPER_ADMIN', 'HR_MANAGER')
    if (error) return error
    const from = new Date(body.fromDate)
    const to = new Date(body.toDate)
    const days = Math.max(1, Math.round((to.getTime() - from.getTime()) / 86400000) + 1)
    const leave = await db.leave.create({
      data: { employeeId: body.employeeId, leaveType: body.leaveType, fromDate: from, toDate: to, days, reason: body.reason, status: body.status || 'PENDING' },
    })
    return NextResponse.json({ ok: true, leave })
  } catch (e) {
    console.error('leave apply', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
