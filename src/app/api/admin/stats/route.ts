import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/guards'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const { error } = await requireRole('OWNER', 'SUPER_ADMIN', 'HR_MANAGER')
  if (error) return error

  const [
    totalEmployees, pendingApplications, todayAttendance, pendingLeaves,
    totalClients, activeProjects, totalPayroll, maleCount, femaleCount,
  ] = await Promise.all([
    db.employee.count({ where: { status: 'APPROVED' } }),
    db.employee.count({ where: { status: 'PENDING' } }),
    db.attendance.count({ where: { date: { gte: new Date(new Date().setHours(0,0,0,0)), lte: new Date(new Date().setHours(23,59,59,999)) }, status: { in: ['PRESENT', 'LATE', 'HALF_DAY'] } } }),
    db.leave.count({ where: { status: 'PENDING' } }),
    db.client.count(),
    db.project.count({ where: { status: 'ACTIVE' } }),
    db.payroll.aggregate({ _sum: { netSalary: true } }),
    db.employee.count({ where: { status: 'APPROVED', gender: 'Male' } }),
    db.employee.count({ where: { status: 'APPROVED', gender: 'Female' } }),
  ])

  // department distribution
  const employees = await db.employee.findMany({ where: { status: 'APPROVED' }, select: { department: true, designation: true } })
  const deptMap: Record<string, number> = {}
  for (const e of employees) { const d = e.department || 'Unassigned'; deptMap[d] = (deptMap[d] || 0) + 1 }
  const departments = Object.entries(deptMap).map(([name, value]) => ({ name, value }))

  // last 6 months payroll
  const now = new Date()
  const monthly: { month: string; amount: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const m = d.getMonth() + 1, y = d.getFullYear()
    const agg = await db.payroll.aggregate({ where: { month: m, year: y }, _sum: { netSalary: true } })
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
}
