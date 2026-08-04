import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/guards'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { error } = await requireRole('OWNER', 'SUPER_ADMIN', 'HR_MANAGER')
  if (error) return error
  try {
    const sp = req.nextUrl.searchParams
    const status = sp.get('status') || ''
    const category = sp.get('category') || ''
    const search = sp.get('search') || ''
    const where: any = {}
    if (status) where.status = status
    if (category) where.category = category
    if (search) {
      where.OR = [
        { description: { contains: search } },
      ]
    }
    const expenses = await db.expense.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ expenses })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to load expenses' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN', 'HR_MANAGER')
  if (error) return error
  try {
    const body = await req.json()
    const { employeeId, category, amount, description, date } = body
    if (!employeeId) return NextResponse.json({ error: 'Employee ID is required' }, { status: 400 })
    if (!category) return NextResponse.json({ error: 'Category is required' }, { status: 400 })
    if (!amount || Number(amount) <= 0) return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 })
    const expense = await db.expense.create({
      data: {
        employeeId,
        category,
        amount: Number(amount),
        description: description || '',
        date: date ? new Date(date) : new Date(),
        status: 'PENDING',
      },
    })
    return NextResponse.json({ ok: true, expense })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN', 'HR_MANAGER')
  if (error) return error
  try {
    const { id, status, remarks } = await req.json()
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    const data: any = {}
    if (remarks !== undefined) data.remarks = remarks
    if (status === 'APPROVED' || status === 'REJECTED') {
      data.status = status
      data.approvedBy = cu!.user.id
      data.approvedAt = new Date()
    } else if (status === 'REIMBURSED') {
      data.status = status
    } else if (status) {
      data.status = status
    }
    const expense = await db.expense.update({ where: { id }, data })
    return NextResponse.json({ ok: true, expense })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to update expense' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN')
  if (error) return error
  try {
    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    await db.expense.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 })
  }
}
