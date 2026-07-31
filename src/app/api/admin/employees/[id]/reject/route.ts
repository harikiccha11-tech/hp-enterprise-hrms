import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { audit } from '@/lib/auth'
import { requireRole } from '@/lib/guards'

export const runtime = 'nodejs'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN', 'HR_MANAGER')
  if (error) return error
  try {
    const { id } = await params
    const { reason } = await req.json().catch(() => ({}))
    const emp = await db.employee.update({
      where: { id },
      data: { status: 'REJECTED', rejectReason: reason || 'Application rejected', reviewedBy: cu!.user.id, reviewedAt: new Date() },
    })
    await audit(cu!.user.id, 'REJECT_EMPLOYEE', 'Employee', id, `Rejected ${emp.fullName}: ${reason || ''}`)
    return NextResponse.json({ ok: true, employee: emp })
  } catch (e) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
