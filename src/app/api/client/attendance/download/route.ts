import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { resolveClientId, getClientEmployeeIds } from '@/lib/client-scope'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']

export async function GET(request: NextRequest) {
  try {
    const cu = await getCurrentUser()
    if (!cu) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (cu.user.role !== 'CLIENT') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const accountId = cu.user.accountId
    if (!accountId) return NextResponse.json({ error: 'No account linked' }, { status: 400 })

    const clientId = await resolveClientId(cu.user.clientId, accountId)
    if (!clientId) {
      const csv = 'Employee Code,Employee Name,Department,Designation,Site,Present Days,Absent Days,Half Days,Late Days,Leave Days,Total Hours,Total OT'
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="client-attendance-report.csv"`,
        },
      })
    }

    const { searchParams } = request.nextUrl
    const now = new Date()
    const month = parseInt(searchParams.get('month') || String(now.getMonth() + 1), 10)
    const year = parseInt(searchParams.get('year') || String(now.getFullYear()), 10)
    const employeeId = searchParams.get('employeeId')?.trim() || ''
    const siteId = searchParams.get('siteId')?.trim() || ''

    if (month < 1 || month > 12 || year < 2000 || year > 2100) {
      return NextResponse.json({ error: 'Invalid month/year' }, { status: 400 })
    }

    const monthStart = new Date(year, month - 1, 1, 0, 0, 0, 0)
    const monthEnd = new Date(year, month, 0, 23, 59, 59, 999)

    // Get employee IDs assigned to this specific client
    let clientEmpIds = await getClientEmployeeIds(db, clientId, accountId)

    // Individual employee filter: must be within client scope
    if (employeeId) {
      if (!clientEmpIds.includes(employeeId)) {
        const csv = 'Employee Code,Employee Name,Department,Designation,Site,Present Days,Absent Days,Half Days,Late Days,Leave Days,Total Hours,Total OT'
        return new NextResponse(csv, {
          status: 200,
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="client-attendance-report-${month}-${year}.csv"`,
          },
        })
      }
      clientEmpIds = [employeeId]
    }

    if (clientEmpIds.length === 0) {
      const csv = 'Employee Code,Employee Name,Department,Designation,Site,Present Days,Absent Days,Half Days,Late Days,Leave Days,Total Hours,Total OT'
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="client-attendance-report-${month}-${year}.csv"`,
        },
      })
    }

    // Fetch employees
    const employees = await db.employee.findMany({
      where: { id: { in: clientEmpIds }, status: { in: ['ACTIVE', 'APPROVED'] } },
      select: {
        id: true,
        employeeCode: true,
        fullName: true,
        department: true,
        designation: true,
      },
    })

    const empIds = employees.map(e => e.id)
    if (empIds.length === 0) {
      const csv = 'Employee Code,Employee Name,Department,Designation,Site,Present Days,Absent Days,Half Days,Late Days,Leave Days,Total Hours,Total OT'
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="client-attendance-report-${month}-${year}.csv"`,
        },
      })
    }

    // Get site assignment map
    const siteAssMap = new Map<string, string>()
    const siteWhere: Record<string, unknown> = { employeeId: { in: empIds }, status: 'active', accountId }
    if (siteId) siteWhere.id = siteId

    const siteAss = await db.siteAssignment.findMany({
      where: siteWhere,
      select: { employeeId: true, siteName: true },
    })
    for (const sa of siteAss) {
      if (!siteAssMap.has(sa.employeeId)) siteAssMap.set(sa.employeeId, sa.siteName)
    }

    // If siteId filter, limit employees to those with that site assignment
    let filteredEmpIds = empIds
    if (siteId) {
      const siteEmpIds = siteAss.filter(sa => sa.siteName).map(sa => sa.employeeId)
      filteredEmpIds = empIds.filter(id => siteEmpIds.includes(id))
    }

    // Fetch attendance for filtered employees
    const attWhere: Record<string, unknown> = {
      employeeId: { in: filteredEmpIds },
      accountId,
      date: { gte: monthStart, lte: monthEnd },
    }
    const records = await db.attendance.findMany({
      where: attWhere,
      select: {
        employeeId: true,
        status: true,
        workingHours: true,
        overtime: true,
      },
    })

    // Group by employee
    const grouped = new Map<string, typeof records>()
    for (const r of records) {
      const list = grouped.get(r.employeeId) || []
      list.push(r)
      grouped.set(r.employeeId, list)
    }

    // Build CSV
    const esc = (v: string | number | null) => {
      if (v == null) return ''
      const s = String(v)
      if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`
      return s
    }

    const header = 'Employee Code,Employee Name,Department,Designation,Site,Present Days,Absent Days,Half Days,Late Days,Leave Days,Total Hours,Total OT'
    const rows = employees
      .filter(e => filteredEmpIds.includes(e.id))
      .map(emp => {
        const recs = grouped.get(emp.id) || []
        const presentDays = recs.filter(r => ['PRESENT', 'LATE'].includes(r.status)).length
        const halfDays = recs.filter(r => r.status === 'HALF_DAY').length
        const lateDays = recs.filter(r => r.status === 'LATE').length
        const leaveDays = recs.filter(r => ['LEAVE', 'ON_LEAVE', 'WFH'].includes(r.status)).length
        const totalHours = Math.round(recs.reduce((s, r) => s + (r.workingHours || 0), 0) * 100) / 100
        const totalOT = Math.round(recs.reduce((s, r) => s + (r.overtime || 0), 0) * 100) / 100
        const absentDays = 0 // client view doesn't need absent calc

        return [
          esc(emp.employeeCode),
          esc(emp.fullName),
          esc(emp.department),
          esc(emp.designation),
          esc(siteAssMap.get(emp.id) || ''),
          presentDays,
          absentDays,
          halfDays,
          lateDays,
          leaveDays,
          totalHours,
          totalOT,
        ].join(',')
      }).join('\n')

    const csv = header + '\n' + rows

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="client-attendance-report-${month}-${year}.csv"`,
      },
    })
  } catch (e) {
    console.error('client download error', e)
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 })
  }
}
