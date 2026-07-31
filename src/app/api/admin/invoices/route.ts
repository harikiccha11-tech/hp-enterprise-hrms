import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole, audit } from '@/lib/guards'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const { error } = await requireRole('OWNER', 'SUPER_ADMIN', 'HR_MANAGER')
  if (error) return error
  const invoices = await db.invoice.findMany({ include: { client: true, workOrder: true }, orderBy: { issueDate: 'desc' } })
  return NextResponse.json({ invoices })
}

export async function POST(req: NextRequest) {
  const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN', 'HR_MANAGER')
  if (error) return error
  try {
    const body = await req.json()
    const count = await db.invoice.count()
    const invoiceNumber = body.invoiceNumber || `HPE-INV-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`
    const amount = Number(body.amount) || 0
    const tax = Number(body.tax) || 0
    const inv = await db.invoice.create({ data: {
      invoiceNumber, clientId: body.clientId, workOrderId: body.workOrderId || null,
      amount, tax, total: amount + tax, status: body.status || 'DRAFT',
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
    } })
    await audit(cu!.user.id, 'CREATE_INVOICE', 'Invoice', inv.id, invoiceNumber)
    return NextResponse.json({ ok: true, invoice: inv })
  } catch (e) { return NextResponse.json({ error: 'Failed' }, { status: 500 }) }
}

export async function PATCH(req: NextRequest) {
  const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN', 'HR_MANAGER')
  if (error) return error
  try {
    const { id, ...data } = await req.json()
    if (data.amount) { data.total = Number(data.amount) + Number(data.tax || 0) }
    const inv = await db.invoice.update({ where: { id }, data })
    return NextResponse.json({ ok: true, invoice: inv })
  } catch (e) { return NextResponse.json({ error: 'Failed' }, { status: 500 }) }
}
