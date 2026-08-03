import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { requireRole, audit } from '@/lib/guards'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const cu = await getCurrentUser()
  if (!cu) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['OWNER', 'SUPER_ADMIN', 'HR_MANAGER', 'EMPLOYEE', 'CLIENT'].includes(cu.user.role))
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date')
  const employeeId = searchParams.get('employeeId')
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const clientId = searchParams.get('clientId')

  const where: any = {}
  // Scope employee role to their own records only
  if (cu.user.role === 'EMPLOYEE') {
    where.employeeId = cu.user.employee?.id
  }
  // Scope CLIENT role to employees assigned to their client
  if (cu.user.role === 'CLIENT' && cu.user.clientId) {
    where.employee = { assignedClientId: cu.user.clientId }
  }
  // Admin filter by client
  if (clientId) {
    where.employee = { ...(where.employee || {}), assignedClientId: clientId }
  }
  if (employeeId) where.employeeId = employeeId
  if (date) {
    const d = new Date(date)
    where.date = { gte: new Date(d.setHours(0, 0, 0, 0)), lte: new Date(d.setHours(23, 59, 59, 999)) }
  } else if (from || to) {
    where.date = {}
    if (from) where.date.gte = new Date(from)
    if (to) where.date.lte = new Date(to)
  }

  try {
    const records = await db.attendance.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true, fullName: true, employeeCode: true, designation: true, department: true,
            assignedClient: { select: { id: true, clientName: true } },
          }
        }
      },
      orderBy: { date: 'desc' },
      take: 500,
    })
    return NextResponse.json({ records })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to load attendance' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN', 'HR_MANAGER')
  if (error) return error
  try {
    const { id, action, punchIn, punchOut, status } = await req.json()
    const data: any = {}
    if (punchIn) data.punchIn = new Date(punchIn)
    if (punchOut) data.punchOut = new Date(punchOut)
    if (status) data.status = status
    if (data.punchIn && data.punchOut) {
      const diff = (new Date(data.punchOut).getTime() - new Date(data.punchIn).getTime()) / 3600000
      data.workingHours = Math.round(diff * 100) / 100
      data.overtime = Math.max(0, Math.round((diff - 9) * 100) / 100)
    }
    const rec = await db.attendance.update({ where: { id }, data: { ...data, markedBy: cu!.user.id, markedById: cu!.user.id } })
    await audit(cu!.user.id, 'EDIT_ATTENDANCE', 'Attendance', id, action || 'updated')
    return NextResponse.json({ ok: true, record: rec })
  } catch (e) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN')
  if (error) return error
  try {
    const { id } = await req.json()
    await db.attendance.delete({ where: { id } })
    await audit(cu!.user.id, 'DELETE_ATTENDANCE', 'Attendance', id)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
