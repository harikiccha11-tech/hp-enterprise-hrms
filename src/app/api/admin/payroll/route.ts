import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole, audit } from '@/lib/guards'
import { generateDocument } from '@/lib/docservice'
import { notify } from '@/lib/notify'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function getSetting(key: string, fallback: string): Promise<string> {
  const s = await db.setting.findUnique({ where: { key } })
  return s?.value ?? fallback
}

// Calculate payroll for an employee for a given month/year
export async function POST(req: NextRequest) {
  const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN')
  if (error) return error
  try {
    const { employeeId, month, year, action } = await req.json()
    const m = Number(month), y = Number(year)
    if (!m || !y) return NextResponse.json({ error: 'month & year required' }, { status: 400 })

    const emp = await db.employee.findUnique({ where: { id: employeeId }, include: { user: true } })
    if (!emp) return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    if (!emp.basic || !emp.salary) return NextResponse.json({ error: 'Salary structure not configured' }, { status: 400 })

    const pfRate = parseFloat(await getSetting('payroll.pfRate', '12')) / 100
    const esiRate = parseFloat(await getSetting('payroll.esiRate', '0.75')) / 100
    const professionalTax = parseFloat(await getSetting('payroll.professionalTax', '200'))
    const standardWorkingDays = parseFloat(await getSetting('payroll.standardWorkingDays', '30'))
    const overtimeRate = parseFloat(await getSetting('payroll.overtimeRate', '1.5'))

    // Attendance for the month
    const start = new Date(y, m - 1, 1)
    const end = new Date(y, m, 0, 23, 59, 59, 999)
    const records = await db.attendance.findMany({ where: { employeeId, date: { gte: start, lte: end } } })
    const fullDays = records.filter(r => r.status === 'PRESENT' || r.status === 'LATE').length
    const halfDays = records.filter(r => r.status === 'HALF_DAY').length
    const effectivePresent = fullDays + (halfDays * 0.5)
    const totalOvertime = records.reduce((s, r) => s + (r.overtime || 0), 0)

    // LOP: unapproved absences (absent days beyond approved leave)
    const approvedLeaves = await db.leave.findMany({ where: { employeeId, status: 'APPROVED', fromDate: { gte: start }, toDate: { lte: end } } })
    const approvedLeaveDays = approvedLeaves.reduce((s, l) => s + l.days, 0)
    const lopDays = Math.max(0, standardWorkingDays - effectivePresent - approvedLeaveDays)

    const basic = emp.basic
    const hra = emp.hra || 0
    const allowances = emp.allowances || 0
    const specialAllowance = emp.specialAllowance || 0
    const grossSalary = basic + hra + allowances + specialAllowance

    const perDaySalary = grossSalary / standardWorkingDays
    const lopAmount = Math.round(lopDays * perDaySalary)
    const overtimePay = Math.round((totalOvertime * (grossSalary / standardWorkingDays / 8)) * overtimeRate)

    const pfEmployee = basic >= 15000 ? Math.round(15000 * pfRate) : Math.round(basic * pfRate)
    const esiEmployee = grossSalary <= 21000 ? Math.round(grossSalary * esiRate) : 0
    const totalDeductions = pfEmployee + esiEmployee + professionalTax + lopAmount
    const netSalary = Math.max(0, grossSalary + overtimePay - totalDeductions)

    // upsert payroll
    const existing = await db.payroll.findUnique({ where: { employeeId_month_year: { employeeId, month: m, year: y } }, include: { salarySlip: true } })
    const payload = {
      basic, hra, allowances, specialAllowance, grossSalary,
      overtimePay, lopDays, lopAmount,
      pfEmployee, esiEmployee, professionalTax,
      netSalary,
      status: action === 'mark_paid' ? 'PAID' : 'GENERATED',
      processedBy: cu!.user.id,
    }

    let payroll
    if (existing) {
      payroll = await db.payroll.update({ where: { id: existing.id }, data: payload })
      if (existing.salarySlip) await db.salarySlip.delete({ where: { id: existing.salarySlip.id } })
    } else {
      payroll = await db.payroll.create({ data: { ...payload, employeeId, month: m, year: y } })
    }

    // create salary slip record
    const slip = await db.salarySlip.create({
      data: { employeeId, payrollId: payroll.id, month: m, year: y, netSalary },
    })

    // Generate PDF salary slip
    try {
      await generateDocument(employeeId, 'salary_slip', cu!.user.id, {
        month: m, year: y,
        earnings: [
          { label: 'Basic', amount: basic },
          { label: 'House Rent Allowance', amount: hra },
          { label: 'Allowances', amount: allowances },
          { label: 'Special Allowance', amount: specialAllowance },
          { label: 'Overtime', amount: overtimePay },
        ],
        deductions: [
          { label: 'Provident Fund (PF)', amount: pfEmployee },
          { label: 'ESI', amount: esiEmployee },
          { label: 'Professional Tax', amount: professionalTax },
          { label: 'Loss of Pay', amount: lopAmount },
        ],
        netPay: netSalary, gross: grossSalary + overtimePay, totalDeductions,
        workingDays: standardWorkingDays, presentDays: effectivePresent, lopDays,
        uan: emp.uan, bankAccount: emp.bankAccount,
      })
    } catch (e) { console.error('salary slip pdf', e) }

    // Notify employee
    if (emp.user) {
      await notify(
        emp.user.id,
        'Salary Slip Generated',
        `Your salary slip for ${start.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })} is now available. Net Pay: ₹ ${netSalary.toLocaleString('en-IN')}`,
        'PAYROLL',
        '/employee?tab=salary',
      )
    }
    await audit(cu!.user.id, 'PROCESS_PAYROLL', 'Payroll', payroll.id, `${emp.fullName} ${m}/${y} net ₹${netSalary}`)
    return NextResponse.json({ ok: true, payroll, slip })
  } catch (e) {
    console.error('payroll error', e)
    return NextResponse.json({ error: 'Payroll processing failed' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const { error } = await requireRole('OWNER', 'SUPER_ADMIN', 'HR_MANAGER')
  if (error) return error
  const { searchParams } = new URL(req.url)
  const month = searchParams.get('month')
  const year = searchParams.get('year')
  const where: any = {}
  if (month) where.month = Number(month)
  if (year) where.year = Number(year)
  const payrolls = await db.payroll.findMany({
    where,
    include: { employee: { select: { id: true, fullName: true, employeeCode: true, designation: true, department: true } } },
    orderBy: [{ year: 'desc' }, { month: 'desc' }],
    take: 500,
  })
  return NextResponse.json({ payrolls })
}
