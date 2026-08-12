import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/guards'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Count working days in a month (exclude Sundays) */
function workingDaysInMonth(year: number, month: number): number {
  const daysInMonth = new Date(year, month, 0).getDate()
  let count = 0
  for (let d = 1; d <= daysInMonth; d++) {
    const day = new Date(year, month - 1, d).getDay()
    if (day !== 0) count++ // 0 = Sunday
  }
  return count
}

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

interface EmployeeSummary {
  employeeId: string
  employeeCode: string
  employeeName: string
  department: string | null
  designation: string | null
  site: string
  presentDays: number
  absentDays: number
  halfDays: number
  lateDays: number
  leaveDays: number
  totalWorkingHours: number
  totalOvertime: number
  avgWorkingHours: number
  workingDaysInMonth: number
  attendancePercentage: number
}

function toCSVRow(summary: EmployeeSummary): string {
  const esc = (v: string | number | null) => {
    if (v == null) return ''
    const s = String(v)
    if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`
    return s
  }
  return [
    esc(summary.employeeCode),
    esc(summary.employeeName),
    esc(summary.department),
    esc(summary.designation),
    esc(summary.site),
    summary.presentDays,
    summary.absentDays,
    summary.halfDays,
    summary.lateDays,
    summary.leaveDays,
    summary.totalWorkingHours,
    summary.totalOvertime,
    summary.avgWorkingHours,
  ].join(',')
}

export async function GET(request: NextRequest) {
  const { error: authErr, cu } = await requireRole('OWNER', 'SUPER_ADMIN', 'HR_MANAGER', 'CLIENT')
  if (authErr) return authErr

  const aid = cu!.user.accountId
  if (!aid) return NextResponse.json({ error: 'No account linked' }, { status: 400 })

  const { searchParams } = request.nextUrl
  const month = parseInt(searchParams.get('month') || '0', 10)
  const year = parseInt(searchParams.get('year') || '0', 10)
  const department = searchParams.get('department')?.trim() || ''
  const siteId = searchParams.get('siteId')?.trim() || ''
  const employeeId = searchParams.get('employeeId')?.trim() || ''
  const clientId = searchParams.get('clientId')?.trim() || ''
  const download = searchParams.get('download')?.trim() || ''

  if (!month || month < 1 || month > 12) {
    return NextResponse.json({ error: 'Invalid month (1-12 required)' }, { status: 400 })
  }
  if (!year || year < 2000 || year > 2100) {
    return NextResponse.json({ error: 'Invalid year required' }, { status: 400 })
  }

  const monthStart = new Date(year, month - 1, 1, 0, 0, 0, 0)
  const monthEnd = new Date(year, month, 0, 23, 59, 59, 999)
  const workingDays = workingDaysInMonth(year, month)

  try {
    // Build employee filter
    const empWhere: Record<string, unknown> = { accountId: aid, status: { in: ['ACTIVE', 'APPROVED'] } }
    if (department) empWhere.department = department
    if (employeeId) empWhere.id = employeeId
    if (clientId) empWhere.assignedClientId = clientId

    // If CLIENT role, only show employees assigned to their client account
    if (cu!.user.role === 'CLIENT') {
      // For CLIENT users, find employees via assignedClientId
      // The CLIENT user's accountId IS the client's accountId
      const clientRecord = await db.client.findFirst({
        where: { accountId: aid },
        select: { id: true },
      })
      if (clientRecord) {
        empWhere.assignedClientId = clientRecord.id
      }
    }

    // If siteId filter, only include employees assigned to that site
    if (siteId) {
      const siteEmps = await db.siteAssignment.findMany({
        where: { id: siteId, accountId: aid },
        select: { employeeId: true },
      })
      const siteEmpIds = siteEmps.map(e => e.employeeId)
      if (siteEmpIds.length > 0) {
        empWhere.id = { in: siteEmpIds }
      } else {
        empWhere.id = '__none__' // no match
      }
    }

    // Fetch all employees matching the filter
    const employees = await db.employee.findMany({
      where: empWhere,
      select: {
        id: true,
        employeeCode: true,
        fullName: true,
        department: true,
        designation: true,
      },
    })

    // For each employee, get their active site assignment for context
    const empIds = employees.map(e => e.id)

    // Fetch all site assignments for these employees (active ones)
    const siteAssMap = new Map<string, string>()
    if (empIds.length > 0) {
      const siteAss = await db.siteAssignment.findMany({
        where: {
          employeeId: { in: empIds },
          status: 'active',
          accountId: aid,
        },
        select: { employeeId: true, siteName: true },
      })
      for (const sa of siteAss) {
        if (!siteAssMap.has(sa.employeeId)) {
          siteAssMap.set(sa.employeeId, sa.siteName)
        }
      }
    }

    // Fetch all attendance records for the month for these employees
    let attendanceRecords: Array<{
      employeeId: string
      status: string
      workingHours: number | null
      overtime: number | null
      date: Date
    }> = []

    if (empIds.length > 0) {
      attendanceRecords = await db.attendance.findMany({
        where: {
          employeeId: { in: empIds },
          accountId: aid,
          date: { gte: monthStart, lte: monthEnd },
        },
        select: {
          employeeId: true,
          status: true,
          workingHours: true,
          overtime: true,
          date: true,
        },
      })
    }

    // Group attendance by employee
    const grouped = new Map<string, typeof attendanceRecords>()
    for (const r of attendanceRecords) {
      const list = grouped.get(r.employeeId) || []
      list.push(r)
      grouped.set(r.employeeId, list)
    }

    // Build summaries
    const summaries: EmployeeSummary[] = employees.map(emp => {
      const records = grouped.get(emp.id) || []
      const recordDates = new Set(records.map(r => r.date.toISOString().slice(0, 10)))

      const presentDays = records.filter(r => ['PRESENT', 'LATE'].includes(r.status)).length
      const halfDays = records.filter(r => r.status === 'HALF_DAY').length
      const lateDays = records.filter(r => r.status === 'LATE').length
      const leaveDays = records.filter(r => ['LEAVE', 'ON_LEAVE', 'WFH'].includes(r.status)).length
      const totalWorkingHours = Math.round(records.reduce((s, r) => s + (r.workingHours || 0), 0) * 100) / 100
      const totalOvertime = Math.round(records.reduce((s, r) => s + (r.overtime || 0), 0) * 100) / 100

      // Absent = working days - present - leave - halfDays*0.5 (rounded)
      const effectiveDays = presentDays + leaveDays + halfDays * 0.5
      const absentDays = Math.max(0, Math.round((workingDays - effectiveDays) * 10) / 10)

      const avgWorkingHours = presentDays + halfDays > 0
        ? Math.round(totalWorkingHours / (presentDays + halfDays * 0.5) * 100) / 100
        : 0

      const attendancePercentage = workingDays > 0
        ? Math.round((presentDays + halfDays * 0.5) / workingDays * 10000) / 100
        : 0

      return {
        employeeId: emp.id,
        employeeCode: emp.employeeCode || '',
        employeeName: emp.fullName,
        department: emp.department,
        designation: emp.designation,
        site: siteAssMap.get(emp.id) || '',
        presentDays,
        absentDays,
        halfDays,
        lateDays,
        leaveDays,
        totalWorkingHours,
        totalOvertime,
        avgWorkingHours,
        workingDaysInMonth: workingDays,
        attendancePercentage,
      }
    })

    // CSV download
    if (download === 'csv') {
      const header = 'Employee Code,Employee Name,Department,Designation,Site,Present Days,Absent Days,Half Days,Late Days,Leave Days,Total Hours,Total OT,Avg Hours/Day'
      const rows = summaries.map(toCSVRow).join('\n')
      const csv = header + '\n' + rows

      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="attendance-summary-${MONTH_NAMES[month - 1]}-${year}.csv"`,
        },
      })
    }

    return NextResponse.json({
      month,
      year,
      monthName: MONTH_NAMES[month - 1],
      workingDaysInMonth: workingDays,
      totalEmployees: summaries.length,
      summaries,
    })
  } catch (e) {
    console.error('monthly-summary error', e)
    return NextResponse.json({ error: 'Failed to generate summary' }, { status: 500 })
  }
}
