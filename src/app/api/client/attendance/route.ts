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
    if (!clientId) return NextResponse.json({ attendance: [] })

    const clientEmpIds = await getClientEmployeeIds(db, clientId, accountId)
    if (clientEmpIds.length === 0) return NextResponse.json({ attendance: [] })

    const { searchParams } = request.nextUrl
    const dateFilter = searchParams.get('date')?.trim() || ''
    const fromFilter = searchParams.get('from')?.trim() || ''
    const toFilter = searchParams.get('to')?.trim() || ''
    const employeeIdFilter = searchParams.get('employeeId')?.trim() || ''
    const siteIdFilter = searchParams.get('siteId')?.trim() || ''
    const departmentFilter = searchParams.get('department')?.trim() || ''

    // Start with client-scoped employee IDs
    let scopedEmpIds = clientEmpIds

    // Department filter: further narrow down to employees in that department
    if (departmentFilter) {
      const deptEmployees = await db.employee.findMany({
        where: { id: { in: scopedEmpIds }, department: departmentFilter },
        select: { id: true },
      })
      const deptIds = deptEmployees.map(e => e.id)
      if (deptIds.length > 0) {
        scopedEmpIds = scopedEmpIds.filter(id => deptIds.includes(id))
      } else {
        return NextResponse.json({ attendance: [] })
      }
    }

    // Individual employee filter: must be within client scope
    if (employeeIdFilter) {
      if (!scopedEmpIds.includes(employeeIdFilter)) {
        return NextResponse.json({ attendance: [] })
      }
      scopedEmpIds = [employeeIdFilter]
    }

    const where: Record<string, unknown> = {
      accountId,
      employeeId: { in: scopedEmpIds },
    }

    // Date range filtering (from/to takes priority over single date)
    if (fromFilter && toFilter) {
      const from = new Date(fromFilter)
      const to = new Date(toFilter)
      from.setUTCHours(0, 0, 0, 0)
      to.setUTCHours(23, 59, 59, 999)
      where.date = { gte: from, lte: to }
    } else if (dateFilter) {
      const start = new Date(dateFilter)
      const end = new Date(dateFilter)
      end.setUTCHours(23, 59, 59, 999)
      where.date = { gte: start, lte: end }
    }

    if (siteIdFilter) {
      where.siteAssignmentId = siteIdFilter
    }

    const records = await db.attendance.findMany({
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
      orderBy: { date: 'desc' },
      take: 1000,
    })

    return NextResponse.json({
      attendance: records.map((r) => ({
        id: r.id,
        employeeId: r.employeeId,
        employeeName: r.employee.fullName,
        employeeCode: r.employee.employeeCode,
        employeeDepartment: r.employee.department,
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
