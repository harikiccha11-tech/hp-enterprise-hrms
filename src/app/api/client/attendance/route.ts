import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const cu = await getCurrentUser()
    if (!cu) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (cu.user.role !== 'CLIENT') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const accountId = cu.user.accountId
    if (!accountId) return NextResponse.json({ error: 'No account linked' }, { status: 400 })

    const { searchParams } = request.nextUrl
    const dateFilter = searchParams.get('date')?.trim() || ''
    const employeeIdFilter = searchParams.get('employeeId')?.trim() || ''

    const where: Record<string, unknown> = { accountId }

    if (dateFilter) {
      const start = new Date(dateFilter)
      const end = new Date(dateFilter)
      end.setUTCHours(23, 59, 59, 999)
      where.date = { gte: start, lte: end }
    }

    if (employeeIdFilter) {
      where.employeeId = employeeIdFilter
    }

    const records = await db.attendance.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            employeeCode: true,
          },
        },
      },
      orderBy: { date: 'desc' },
      take: 500,
    })

    return NextResponse.json({
      attendance: records.map((r) => ({
        id: r.id,
        employeeId: r.employeeId,
        employeeName: r.employee.fullName,
        employeeCode: r.employee.employeeCode,
        date: r.date.toISOString().slice(0, 10),
        checkIn: r.punchIn ? r.punchIn.toISOString() : null,
        checkOut: r.punchOut ? r.punchOut.toISOString() : null,
        status: r.status,
        hoursWorked: r.workingHours,
        overtime: r.overtime,
        lateArrival: r.lateArrival,
      })),
    })
  } catch {
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}
