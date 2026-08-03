import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/guards'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const { error } = await requireRole('OWNER', 'SUPER_ADMIN', 'HR_MANAGER')
  if (error) return error
  try {
    const items = await db.paymentGateway.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ items })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to load payment gateways' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN')
  if (error) return error
  try {
    const body = await req.json()
    const { name, type, apiKey, apiSecret, merchantId, isDefault, upiId, bankName, bankAccount, bankIfsc, status } = body
    if (!name?.trim()) return NextResponse.json({ error: 'Gateway name is required' }, { status: 400 })
    if (!type?.trim()) return NextResponse.json({ error: 'Gateway type is required' }, { status: 400 })
    const existing = await db.paymentGateway.findFirst({ where: { name: name.trim() } })
    if (existing) return NextResponse.json({ error: 'Gateway with this name already exists' }, { status: 409 })
    // If setting as default, unset others
    if (isDefault) {
      await db.paymentGateway.updateMany({ where: { isDefault: true }, data: { isDefault: false } })
    }
    const item = await db.paymentGateway.create({
      data: {
        name: name.trim(),
        type: type.trim(),
        apiKey: apiKey || null,
        apiSecret: apiSecret || null,
        merchantId: merchantId || null,
        isDefault: isDefault ?? false,
        upiId: upiId || null,
        bankName: bankName || null,
        bankAccount: bankAccount || null,
        bankIfsc: bankIfsc || null,
        status: status || 'ACTIVE',
      },
    })
    await (await import('@/lib/audit')).audit(cu!.user.id, 'CREATE_PAYMENT_GATEWAY', 'PaymentGateway', item.id, item.name)
    return NextResponse.json({ ok: true, item })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create payment gateway' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN')
  if (error) return error
  try {
    const { id, ...data } = await req.json()
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    if (data.name) {
      const existing = await db.paymentGateway.findFirst({ where: { name: data.name.trim(), id: { not: id } } })
      if (existing) return NextResponse.json({ error: 'Gateway with this name already exists' }, { status: 409 })
    }
    // If setting as default, unset others first
    if (data.isDefault) {
      await db.paymentGateway.updateMany({ where: { isDefault: true, id: { not: id } }, data: { isDefault: false } })
    }
    const update: any = {}
    if (data.name !== undefined) update.name = data.name.trim()
    if (data.type !== undefined) update.type = data.type.trim()
    if (data.apiKey !== undefined) update.apiKey = data.apiKey || null
    if (data.apiSecret !== undefined) update.apiSecret = data.apiSecret || null
    if (data.merchantId !== undefined) update.merchantId = data.merchantId || null
    if (data.isDefault !== undefined) update.isDefault = data.isDefault
    if (data.upiId !== undefined) update.upiId = data.upiId || null
    if (data.bankName !== undefined) update.bankName = data.bankName || null
    if (data.bankAccount !== undefined) update.bankAccount = data.bankAccount || null
    if (data.bankIfsc !== undefined) update.bankIfsc = data.bankIfsc || null
    if (data.status !== undefined) update.status = data.status
    const item = await db.paymentGateway.update({ where: { id }, data: update })
    await (await import('@/lib/audit')).audit(cu!.user.id, 'UPDATE_PAYMENT_GATEWAY', 'PaymentGateway', id)
    return NextResponse.json({ ok: true, item })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to update payment gateway' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN')
  if (error) return error
  try {
    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    await db.paymentGateway.delete({ where: { id } })
    await (await import('@/lib/audit')).audit(cu!.user.id, 'DELETE_PAYMENT_GATEWAY', 'PaymentGateway', id)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to delete payment gateway' }, { status: 500 })
  }
}
