import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { resolveClientId, getClientEmployeeIds } from '@/lib/client-scope'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const cu = await getCurrentUser()
    if (!cu) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (cu.user.role !== 'CLIENT') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const accountId = cu.user.accountId
    if (!accountId) return NextResponse.json({ error: 'No account linked' }, { status: 400 })

    const clientId = await resolveClientId(cu.user.clientId, accountId)
    if (!clientId) {
      return NextResponse.json({
        employees: { total: 0, active: 0, onLeave: 0, departments: 0 },
        attendance: { presentToday: 0, absentToday: 0 },
        payroll: { totalPaidThisMonth: 0, month: new Date().getMonth() + 1, year: new Date().getFullYear() },
      })
    }

    const clientEmpIds = await getClientEmployeeIds(db, clientId, accountId)

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()

    // If no employees assigned, return zeros
    const empWhere = clientEmpIds.length > 0 ? { id: { in: clientEmpIds } } : { id: '__none__' }

    // Run all summary queries in parallel
    const [
      totalEmployees,
      onLeaveEmployees,
      departments,
      presentToday,
      absentToday,
      monthlyPayroll,
    ] = await Promise.all([
      // Total approved employees scoped to client
      db.employee.count({
        where: { ...empWhere, accountId, status: 'APPROVED' },
      }),
      // Employees currently on leave (approved leave overlapping today)
      db.leave.count({
        where: {
          accountId,
          employeeId: clientEmpIds.length > 0 ? { in: clientEmpIds } : '__none__',
          status: 'APPROVED',
          fromDate: { lte: todayEnd },
          toDate: { gte: todayStart },
        },
      }),
      // Distinct departments among client employees
      db.employee
        .findMany({
          where: { ...empWhere, accountId, status: 'APPROVED', department: { not: null } },
          select: { department: true },
          distinct: ['department'],
        })
        .then((depts) => depts.length),
      // Present today
      db.attendance.count({
        where: {
          accountId,
          employeeId: clientEmpIds.length > 0 ? { in: clientEmpIds } : '__none__',
          date: { gte: todayStart, lte: todayEnd },
          status: { in: ['PRESENT', 'LATE', 'HALF_DAY', 'WFH'] },
        },
      }),
      // Absent today
      db.attendance.count({
        where: {
          accountId,
          employeeId: clientEmpIds.length > 0 ? { in: clientEmpIds } : '__none__',
          date: { gte: todayStart, lte: todayEnd },
          status: 'ABSENT',
        },
      }),
      // Payroll paid this month
      db.payroll.aggregate({
        where: {
          accountId,
          employeeId: clientEmpIds.length > 0 ? { in: clientEmpIds } : '__none__',
          month: currentMonth,
          year: currentYear,
          status: 'PAID',
        },
        _sum: { netSalary: true },
      }),
    ])

    return NextResponse.json({
      employees: {
        total: totalEmployees,
        active: totalEmployees,
        onLeave: onLeaveEmployees,
        departments,
      },
      attendance: {
        presentToday,
        absentToday,
      },
      payroll: {
        totalPaidThisMonth: monthlyPayroll._sum.netSalary || 0,
        month: currentMonth,
        year: currentYear,
      },
    })
  } catch {
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}
