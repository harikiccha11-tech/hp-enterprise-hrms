import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/guards'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
  const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN', 'HR_MANAGER')
  if (error) return error
  const accountId = cu.user.accountId
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') || 'employees'

  switch (type) {
    case 'employees': {
      const employees = await db.employee.findMany({ where: { accountId, status: 'APPROVED' }, select: { employeeCode: true, fullName: true, designation: true, department: true, email: true, mobile: true, joinDate: true, salary: true }, orderBy: { employeeCode: 'asc' } })
      return NextResponse.json({ rows: employees, columns: ['Code','Name','Designation','Department','Email','Mobile','Join Date','Salary'] })
    }
    case 'attendance': {
      const records = await db.attendance.findMany({ where: { accountId }, include: { employee: { select: { employeeCode: true, fullName: true } } }, orderBy: { date: 'desc' }, take: 1000 })
      const rows = records.map(r => ({ code: r.employee.employeeCode, name: r.employee.fullName, date: r.date, punchIn: r.punchIn, punchOut: r.punchOut, hours: r.workingHours, overtime: r.overtime, status: r.status }))
      return NextResponse.json({ rows, columns: ['Code','Name','Date','Punch In','Punch Out','Hours','Overtime','Status'] })
    }
    case 'payroll': {
      const payrolls = await db.payroll.findMany({ where: { accountId }, include: { employee: { select: { employeeCode: true, fullName: true } } }, orderBy: [{ year: 'desc' }, { month: 'desc' }] })
      const rows = payrolls.map(p => ({ code: p.employee.employeeCode, name: p.employee.fullName, month: p.month, year: p.year, gross: p.grossSalary, deductions: p.pfEmployee + p.esiEmployee + p.professionalTax + p.lopAmount, net: p.netSalary, status: p.status }))
      return NextResponse.json({ rows, columns: ['Code','Name','Month','Year','Gross','Deductions','Net','Status'] })
    }
    case 'clients': {
      const clients = await db.client.findMany({ where: { accountId }, include: { _count: { select: { projects: true, invoices: true } } } })
      const rows = clients.map(c => ({ name: c.clientName, company: c.companyName, gst: c.gst, email: c.email, phone: c.phone, projects: c._count.projects, invoices: c._count.invoices }))
      return NextResponse.json({ rows, columns: ['Client','Company','GST','Email','Phone','Projects','Invoices'] })
    }
    case 'projects': {
      const projects = await db.project.findMany({ where: { accountId }, include: { client: true, _count: { select: { members: true } } } })
      const rows = projects.map(p => ({ name: p.projectName, client: p.client?.clientName, site: p.site, status: p.status, members: p._count.members, startDate: p.startDate }))
      return NextResponse.json({ rows, columns: ['Project','Client','Site','Status','Members','Start Date'] })
    }
    case 'invoices': {
      const invoices = await db.invoice.findMany({ where: { accountId }, include: { client: true } })
      const rows = invoices.map(i => ({ number: i.invoiceNumber, client: i.client?.clientName, amount: i.amount, tax: i.tax, total: i.total, status: i.status, issueDate: i.issueDate }))
      return NextResponse.json({ rows, columns: ['Invoice #','Client','Amount','Tax','Total','Status','Issue Date'] })
    }
    case 'audit': {
      const logs = await db.auditLog.findMany({ where: { accountId }, include: { user: { select: { username: true } } }, orderBy: { at: 'desc' }, take: 1000 })
      const rows = logs.map(l => ({ at: l.at, user: l.user?.username || 'system', action: l.action, entity: l.entity, entityId: l.entityId, details: l.details, ip: l.ip }))
      return NextResponse.json({ rows, columns: ['Time','User','Action','Entity','Entity ID','Details','IP'] })
    }
    default:
      return NextResponse.json({ rows: [], columns: [] })
  }
  } catch {
    return NextResponse.json({ error: 'Report generation failed' }, { status: 500 })
  }
}
