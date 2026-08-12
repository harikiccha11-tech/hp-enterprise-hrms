import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole, audit } from '@/lib/guards'

export const runtime = 'nodejs'

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN')
  if (error) return error
  const aid = cu!.user.accountId
  try {
    const { id } = await params
    const emp = await db.employee.findUnique({ where: { id }, include: { user: true } })
    if (!emp || emp.accountId !== aid) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await db.$transaction(async (tx) => {
      if (emp.user) await tx.user.delete({ where: { id: emp.user.id } })
      await tx.employee.delete({ where: { id } })
    })

    await audit(cu!.user.id, 'DELETE_EMPLOYEE', 'Employee', id, `Deleted ${emp.fullName}`)
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('delete employee', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
