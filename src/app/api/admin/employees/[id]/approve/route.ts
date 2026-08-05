import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, generateSecureTempPassword, audit } from '@/lib/auth'
import { requireRole } from '@/lib/guards'
import { generateDocument } from '@/lib/docservice'
import { formatEmployeeCode } from '@/lib/constants'
import { notify } from '@/lib/notify'

export const runtime = 'nodejs'

function genUsername(name: string, code: string): string {
  const parts = name.toLowerCase().split(/\s+/).filter(Boolean)
  const first = parts[0] || 'employee'
  const last = parts.length > 1 ? parts[parts.length - 1] : ''
  return `${first}${last ? '.' + last : ''}`.replace(/[^a-z.]/g, '').slice(0, 24) || `emp.${code.toLowerCase()}`
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN', 'HR_MANAGER')
  if (error) return error
  try {
    const { id } = await params
    const body = await req.json().catch(() => ({}))
    const emp = await db.employee.findUnique({ where: { id } })
    if (!emp) return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    if (emp.status === 'APPROVED') return NextResponse.json({ error: 'Already approved' }, { status: 400 })

    // Designation/department/join defaults
    const designation = body.designation || emp.currentDesignation || 'Project Engineer'
    const department = body.department || 'Projects'
    const salary = Number(body.salary || 0) || emp.salary || 0
    const basic = Math.round(salary * 0.5)
    const hra = Math.round(salary * 0.2)
    const allowances = Math.round(salary * 0.1)
    const specialAllowance = salary - basic - hra - allowances

    const username = genUsername(emp.fullName, '')
    const tempPassword = generateSecureTempPassword()
    const passwordHash = await hashPassword(tempPassword)
    const joinDate = body.joinDate ? new Date(body.joinDate) : new Date()

    // Atomic: use $transaction to prevent race conditions on employee code
    const result = await db.$transaction(async (tx) => {
      // Generate employee code inside transaction (serializable isolation)
      const approvedCount = await tx.employee.count({ where: { status: 'APPROVED' } })
      const employeeCode = formatEmployeeCode(approvedCount + 1)

      // Create login user
      const user = await tx.user.create({
        data: {
          username,
          email: emp.email,
          passwordHash,
          role: 'EMPLOYEE',
          accountId: emp.accountId,
          mustResetPassword: true,
        },
      })

      // Update employee
      const updated = await tx.employee.update({
        where: { id },
        data: {
          status: 'APPROVED',
          employeeCode,
          designation,
          department,
          salary,
          basic,
          hra,
          allowances,
          specialAllowance,
          joinDate,
          employmentType: body.employmentType || 'Full-time',
          userId: user.id,
          reviewedBy: cu!.user.id,
          reviewedAt: new Date(),
        },
      })

      // Leave balance
      await tx.leaveBalance.upsert({
        where: { employeeId: id },
        update: {},
        create: { employeeId: id, casual: 12, sick: 12, earned: 15 },
      })

      return { user, employeeCode, updated }
    })

    // Generate documents outside transaction (non-critical, PDF rendering)
    try { await generateDocument(id, 'offer_letter', cu!.user.id) } catch (e) { console.error('offer letter gen failed', e) }
    try { await generateDocument(id, 'appointment_letter', cu!.user.id) } catch (e) { console.error('appointment letter gen failed', e) }
    try { await generateDocument(id, 'id_card', cu!.user.id) } catch (e) { console.error('id card gen failed', e) }

    // Notify employee
    await notify(
      result.user.id,
      'Welcome to HP ENTERPRISE!',
      `Your application has been approved. Username: ${username}. Please login and reset your temporary password.`,
      'SUCCESS',
      '/employee',
    )

    await audit(cu!.user.id, 'APPROVE_EMPLOYEE', 'Employee', id, `Approved ${emp.fullName} as ${result.employeeCode}`)

    return NextResponse.json({
      ok: true,
      employee: result.updated,
      message: 'Employee approved. Temporary credentials sent via notification.',
    })
  } catch (e) {
    console.error('approve error', e)
    return NextResponse.json({ error: 'Approval failed' }, { status: 500 })
  }
}
