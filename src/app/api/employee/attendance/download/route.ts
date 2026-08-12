import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DAY_NAMES = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']

export async function GET(request: NextRequest) {
  try {
    const cu = await getCurrentUser()
    if (!cu) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const employeeId = cu.user.employee?.id
    if (!employeeId) return NextResponse.json({ error: 'No employee profile' }, { status: 400 })

    const { searchParams } = request.nextUrl
    const now = new Date()
    const month = parseInt(searchParams.get('month') || String(now.getMonth() + 1), 10)
    const year = parseInt(searchParams.get('year') || String(now.getFullYear()), 10)

    if (month < 1 || month > 12 || year < 2000 || year > 2100) {
      return NextResponse.json({ error: 'Invalid month/year' }, { status: 400 })
    }

    const monthStart = new Date(year, month - 1, 1, 0, 0, 0, 0)
    const monthEnd = new Date(year, month, 0, 23, 59, 59, 999)

    // Get employee info
    const employee = await db.employee.findUnique({
      where: { id: employeeId },
      select: { employeeCode: true, fullName: true },
    })
    if (!employee) return NextResponse.json({ error: 'Employee not found' }, { status: 404 })

    // Get all attendance records for the month
    const records = await db.attendance.findMany({
      where: { employeeId, date: { gte: monthStart, lte: monthEnd } },
      include: { siteAssignment: { select: { siteName: true } } },
      orderBy: { date: 'asc' },
    })

    // Calculate stats
    const presentDays = records.filter(r => ['PRESENT', 'LATE'].includes(r.status)).length
    const halfDays = records.filter(r => r.status === 'HALF_DAY').length
    const lateDays = records.filter(r => r.status === 'LATE').length
    const leaveDays = records.filter(r => ['LEAVE', 'ON_LEAVE', 'WFH'].includes(r.status)).length
    const totalHours = Math.round(records.reduce((s, r) => s + (r.workingHours || 0), 0) * 100) / 100
    const totalOT = Math.round(records.reduce((s, r) => s + (r.overtime || 0), 0) * 100) / 100

    // Build CSV
    const esc = (v: string | number | null) => {
      if (v == null) return ''
      const s = String(v)
      if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`
      return s
    }

    const header = 'Date,Day,Status,Punch In,Punch Out,Working Hours,Overtime,Late Arrival,Site'
    const rows = records.map(r => {
      const d = new Date(r.date)
      return [
        esc(d.toISOString().slice(0, 10)),
        esc(DAY_NAMES[d.getDay()]),
        esc(r.status),
        r.punchIn ? esc(new Date(r.punchIn).toISOString().slice(11, 16)) : '',
        r.punchOut ? esc(new Date(r.punchOut).toISOString().slice(11, 16)) : '',
        r.workingHours != null ? r.workingHours : '',
        r.overtime != null ? r.overtime : '',
        r.lateArrival ? 'Yes' : 'No',
        esc(r.siteAssignment?.siteName || ''),
      ].join(',')
    }).join('\n')

    // Summary section
    const summary = [
      '',
      'SUMMARY',
      `Total Present,${presentDays}`,
      `Total Absent,${Math.max(0, presentDays + halfDays + leaveDays > 0 ? '' : '0')}`,
      `Total Late,${lateDays}`,
      `Total Half Days,${halfDays}`,
      `Total Leave,${leaveDays}`,
      `Total Hours,${totalHours}`,
      `Total OT,${totalOT}`,
    ].join('\n')

    const csv = header + '\n' + rows + summary

    const code = employee.employeeCode || 'unknown'
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="attendance-report-${code}-${month}-${year}.csv"`,
      },
    })
  } catch (e) {
    console.error('employee download error', e)
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 })
  }
}
