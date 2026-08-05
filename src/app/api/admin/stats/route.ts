import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/guards'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN', 'HR_MANAGER')
    if (error) return error
    const accountId = cu.user.accountId

    const [
      totalEmployees, pendingApplications, todayAttendance, pendingLeaves,
      totalClients, activeProjects, totalPayroll, maleCount, femaleCount,
    ] = await Promise.all([
      db.employee.count({ where: { status: 'APPROVED', accountId } }),
      db.employee.count({ where: { status: 'PENDING', accountId } }),
      db.attendance.count({ where: { accountId, date: { gte: new Date(new Date().setHours(0,0,0,0)), lte: new Date(new Date().setHours(23,59,59,999)) }, status: { in: ['PRESENT', 'LATE', 'HALF_DAY'] } } }),
      db.leave.count({ where: { status: 'PENDING', accountId } }),
      db.client.count({ where: { accountId } }),
      db.project.count({ where: { status: 'ACTIVE', accountId } }),
      db.payroll.aggregate({ where: { accountId }, _sum: { netSalary: true } }),
      db.employee.count({ where: { status: 'APPROVED', gender: 'Male', accountId } }),
      db.employee.count({ where: { status: 'APPROVED', gender: 'Female', accountId } }),
    ])

    // department distribution
    const employees = await db.employee.findMany({ where: { status: 'APPROVED', accountId }, select: { department: true, designation: true } })
    const deptMap: Record<string, number> = {}
    for (const e of employees) { const d = e.department || 'Unassigned'; deptMap[d] = (deptMap[d] || 0) + 1 }
    const departments = Object.entries(deptMap).map(([name, value]) => ({ name, value }))

    // last 6 months payroll
    const now = new Date()
    const monthly: { month: string; amount: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const m = d.getMonth() + 1, y = d.getFullYear()
      const agg = await db.payroll.aggregate({ where: { month: m, year: y, accountId }, _sum: { netSalary: true } })
      monthly.push({ month: d.toLocaleDateString('en-IN', { month: 'short' }), amount: agg._sum.netSalary || 0 })
    }

    return NextResponse.json({
      totalEmployees, pendingApplications, todayAttendance, pendingLeaves,
      totalClients, activeProjects,
      totalPayroll: totalPayroll._sum.netSalary || 0,
      gender: { male: maleCount, female: femaleCount },
      departments,
      monthlyPayroll: monthly,
    })
  } catch (e) {
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}
