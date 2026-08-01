import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const cu = await getCurrentUser()
    if (!cu) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const employeeId = cu.user.employee?.id
    if (!employeeId) return NextResponse.json({ error: 'No employee profile' }, { status: 400 })

    const emp = await db.employee.findUnique({
      where: { id: employeeId },
      include: {
        documents: true,
        generatedDocs: { orderBy: { generatedAt: 'desc' } },
        leaves: { orderBy: { appliedAt: 'desc' }, take: 10 },
        attendance: { orderBy: { date: 'desc' }, take: 30 },
        payrolls: { orderBy: [{ year: 'desc' }, { month: 'desc' }], take: 12, include: { salarySlip: true } },
        projectAssignments: { include: { project: { include: { client: true } } } },
        leaveBalance: true,
      },
    })
    if (!emp) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthAttendance = emp.attendance.filter(a => a.date >= monthStart)
    const presentDays = monthAttendance.filter(a => ['PRESENT', 'LATE'].includes(a.status)).length
    const todayRecord = emp.attendance.find(a => {
      const d = new Date(a.date); d.setHours(0,0,0,0)
      const t = new Date(); t.setHours(0,0,0,0)
      return d.getTime() === t.getTime()
    })

    const pendingLeaves = emp.leaves.filter(l => l.status === 'PENDING').length
    const unreadNotifs = await db.notification.count({ where: { userId: cu.user.id, read: false } })

    return NextResponse.json({
      employee: emp,
      stats: {
        presentDays,
        todayPunchIn: todayRecord?.punchIn || null,
        todayPunchOut: todayRecord?.punchOut || null,
        pendingLeaves,
        unreadNotifs,
        leaveBalance: emp.leaveBalance,
        totalDocuments: emp.generatedDocs.length,
      },
    })
  } catch (e) {
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}
