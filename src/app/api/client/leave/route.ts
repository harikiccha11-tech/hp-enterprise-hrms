import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { resolveClientId, getClientEmployeeIds } from '@/lib/client-scope'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const cu = await getCurrentUser()
    if (!cu) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (cu.user.role !== 'CLIENT') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const accountId = cu.user.accountId
    if (!accountId) return NextResponse.json({ error: 'No account linked' }, { status: 400 })

    const clientId = await resolveClientId(cu.user.clientId, accountId)
    if (!clientId) return NextResponse.json({ leaves: [] })

    const clientEmpIds = await getClientEmployeeIds(db, clientId, accountId)
    if (clientEmpIds.length === 0) return NextResponse.json({ leaves: [] })

    const { searchParams } = request.nextUrl
    const statusFilter = searchParams.get('status')?.trim() || ''

    const where: Record<string, unknown> = {
      accountId,
      employeeId: { in: clientEmpIds },
    }

    if (statusFilter) {
      where.status = statusFilter
    }

    const records = await db.leave.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            employeeCode: true,
            department: true,
          },
        },
      },
      orderBy: { appliedAt: 'desc' },
      take: 500,
    })

    return NextResponse.json({
      leaves: records.map((r) => ({
        id: r.id,
        employeeId: r.employeeId,
        employeeName: r.employee.fullName,
        employeeCode: r.employee.employeeCode,
        department: r.employee.department,
        leaveType: r.leaveType,
        startDate: r.fromDate.toISOString().slice(0, 10),
        endDate: r.toDate.toISOString().slice(0, 10),
        days: r.days,
        status: r.status,
        reason: r.reason,
        comments: r.comments,
        appliedAt: r.appliedAt.toISOString(),
        reviewedAt: r.reviewedAt ? r.reviewedAt.toISOString() : null,
      })),
    })
  } catch {
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}
