import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole, audit } from '@/lib/guards'
import { notify } from '@/lib/notify'

export const runtime = 'nodejs'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN', 'HR_MANAGER')
  if (error) return error
  try {
    const { id } = await params
    const { action, comments } = await req.json()
    const leave = await db.leave.findUnique({ where: { id }, include: { employee: { include: { user: true } } } })
    if (!leave) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const status = action === 'approve' ? 'APPROVED' : 'REJECTED'

    // Atomic: leave status + leave action + balance update in one transaction
    const updated = await db.$transaction(async (tx) => {
      const l = await tx.leave.update({
        where: { id },
        data: { status, reviewedBy: cu!.user.id, reviewedAt: new Date(), comments: comments || null },
      })
      await tx.leaveAction.create({ data: { leaveId: id, userId: cu!.user.id, action: status, comments: comments || null } })

      // Update leave balances if approved
      if (status === 'APPROVED') {
        const balance = await tx.leaveBalance.findUnique({ where: { employeeId: leave.employeeId } })
        if (balance) {
          const typeMap: Record<string, 'casual' | 'sick' | 'earned'> = { CL: 'casual', SL: 'sick', EL: 'earned', PL: 'earned' }
          const field = typeMap[leave.leaveType]
          if (field) {
            const update: Record<string, number> = {}
            if (field === 'casual') update.usedCasual = (balance.usedCasual ?? 0) + leave.days
            if (field === 'sick') update.usedSick = (balance.usedSick ?? 0) + leave.days
            if (field === 'earned') update.usedEarned = (balance.usedEarned ?? 0) + leave.days
            await tx.leaveBalance.update({ where: { employeeId: leave.employeeId }, data: update })
          }
        }
      }
      return l
    })

    if (leave.employee.user) {
      await notify(
        leave.employee.user.id,
        `Leave ${status}`,
        `Your ${leave.leaveType} leave request for ${leave.days} day(s) has been ${status.toLowerCase()}.`,
        status === 'APPROVED' ? 'SUCCESS' : 'WARNING',
        '/employee?tab=leaves',
      )
    }
    await audit(cu!.user.id, 'LEAVE_' + status, 'Leave', id, `${status} leave for ${leave.employee.fullName}`)
    return NextResponse.json({ ok: true, leave: updated })
  } catch (e) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
