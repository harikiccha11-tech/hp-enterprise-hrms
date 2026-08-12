import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole, audit } from '@/lib/guards'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN', 'HR_MANAGER')
    if (error) return error
    const aid = cu!.user.accountId
    const invoices = await db.invoice.findMany({ where: { accountId: aid }, include: { client: true, workOrder: true }, orderBy: { issueDate: 'desc' } })
    return NextResponse.json({ invoices })
  } catch (e) {
    console.error('invoices GET error', e)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN', 'HR_MANAGER')
  if (error) return error
  const aid = cu!.user.accountId
  try {
    const body = await req.json()
    const count = await db.invoice.count({ where: { accountId: aid } })
    const invoiceNumber = body.invoiceNumber || `HPE-INV-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`
    const amount = Number(body.amount) || 0
    const tax = Number(body.tax) || 0
    const inv = await db.invoice.create({ data: {
      accountId: aid, invoiceNumber, clientId: body.clientId, workOrderId: body.workOrderId || null,
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
  const aid = cu!.user.accountId
  try {
    const { id, dueDate, ...data } = await req.json()
    const existing = await db.invoice.findUnique({ where: { id } })
    if (!existing || existing.accountId !== aid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (data.amount !== undefined) data.amount = Number(data.amount) || 0
    if (data.tax !== undefined) data.tax = Number(data.tax) || 0
    if (data.amount !== undefined || data.tax !== undefined) {
      data.total = (Number(data.amount ?? existing?.amount) || 0) + (Number(data.tax ?? existing?.tax) || 0)
    }
    if (dueDate) data.dueDate = new Date(dueDate)
    const inv = await db.invoice.update({ where: { id }, data })
    await audit(cu!.user.id, 'UPDATE_INVOICE', 'Invoice', id)
    return NextResponse.json({ ok: true, invoice: inv })
  } catch (e) { return NextResponse.json({ error: 'Failed' }, { status: 500 }) }
}

export async function DELETE(req: NextRequest) {
  const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN')
  if (error) return error
  const aid = cu!.user.accountId
  try {
    const { id } = await req.json()
    const existing = await db.invoice.findUnique({ where: { id } })
    if (!existing || existing.accountId !== aid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    await db.invoice.delete({ where: { id } })
    await audit(cu!.user.id, 'DELETE_INVOICE', 'Invoice', id)
    return NextResponse.json({ ok: true })
  } catch (e) { return NextResponse.json({ error: 'Failed' }, { status: 500 }) }
}