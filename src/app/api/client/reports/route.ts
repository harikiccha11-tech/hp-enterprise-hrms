import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const cu = await getCurrentUser()
    if (!cu) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (cu.user.role !== 'CLIENT') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const accountId = cu.user.accountId
    if (!accountId) return NextResponse.json({ error: 'No account linked' }, { status: 400 })

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()

    // Run all summary queries in parallel
    const [
      totalEmployees,
      activeEmployees,
      onLeaveEmployees,
      departmentCount,
      presentToday,
      absentToday,
      monthlyPayroll,
    ] = await Promise.all([
      // Total approved employees
      db.employee.count({
        where: { accountId, status: 'APPROVED' },
      }),
      // Active employees (APPROVED status, not on leave)
      db.employee.count({
        where: { accountId, status: 'APPROVED' },
      }),
      // Employees currently on leave (approved leave overlapping today)
      db.leave.count({
        where: {
          accountId,
          status: 'APPROVED',
          fromDate: { lte: todayEnd },
          toDate: { gte: todayStart },
        },
      }),
      // Distinct department count
      db.employee
        .findMany({
          where: { accountId, status: 'APPROVED', department: { not: null } },
          select: { department: true },
          distinct: ['department'],
        })
        .then((depts) => depts.length),
      // Present today
      db.attendance.count({
        where: {
          accountId,
          date: { gte: todayStart, lte: todayEnd },
          status: { in: ['PRESENT', 'LATE', 'HALF_DAY', 'WFH'] },
        },
      }),
      // Absent today
      db.attendance.count({
        where: {
          accountId,
          date: { gte: todayStart, lte: todayEnd },
          status: 'ABSENT',
        },
      }),
      // Payroll paid this month
      db.payroll.aggregate({
        where: {
          accountId,
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
        active: activeEmployees,
        onLeave: onLeaveEmployees,
        departments: departmentCount,
      },
      attendance: {
        presentToday: presentToday,
        absentToday: absentToday,
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
