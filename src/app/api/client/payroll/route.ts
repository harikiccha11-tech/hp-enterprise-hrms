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

    const records = await db.payroll.findMany({
      where: { accountId },
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
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      take: 500,
    })

    return NextResponse.json({
      payrolls: records.map((r) => {
        const totalDeductions =
          r.pfEmployee +
          r.esiEmployee +
          r.professionalTax +
          r.incomeTaxDeduction +
          r.lopAmount

        return {
          id: r.id,
          employeeId: r.employeeId,
          employeeName: r.employee.fullName,
          employeeCode: r.employee.employeeCode,
          department: r.employee.department,
          month: r.month,
          year: r.year,
          basicSalary: r.basic,
          hra: r.hra,
          allowances: r.allowances,
          specialAllowance: r.specialAllowance,
          grossSalary: r.grossSalary,
          overtimePay: r.overtimePay,
          deductions: totalDeductions,
          pfEmployee: r.pfEmployee,
          esiEmployee: r.esiEmployee,
          professionalTax: r.professionalTax,
          incomeTax: r.incomeTaxDeduction,
          lopAmount: r.lopAmount,
          netSalary: r.netSalary,
          status: r.status,
          processedAt: r.processedAt.toISOString(),
        }
      }),
    })
  } catch {
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}
