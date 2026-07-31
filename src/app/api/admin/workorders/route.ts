import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole, audit } from '@/lib/guards'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const { error } = await requireRole('OWNER', 'SUPER_ADMIN', 'HR_MANAGER')
  if (error) return error
  const workOrders = await db.workOrder.findMany({ include: { client: true, project: true, _count: { select: { invoices: true } } }, orderBy: { createdAt: 'desc' } })
  return NextResponse.json({ workOrders })
}

export async function POST(req: NextRequest) {
  const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN', 'HR_MANAGER')
  if (error) return error
  try {
    const body = await req.json()
    const wo = await db.workOrder.create({ data: {
      woNumber: body.woNumber, clientId: body.clientId, projectId: body.projectId || null,
      title: body.title, value: Number(body.value) || 0,
      startDate: body.startDate ? new Date(body.startDate) : null, endDate: body.endDate ? new Date(body.endDate) : null,
      status: body.status || 'OPEN',
    } })
    await audit(cu!.user.id, 'CREATE_WORKORDER', 'WorkOrder', wo.id, wo.woNumber)
    return NextResponse.json({ ok: true, workOrder: wo })
  } catch (e) { return NextResponse.json({ error: 'Failed' }, { status: 500 }) }
}
