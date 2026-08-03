import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole, audit } from '@/lib/guards'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const { error } = await requireRole('OWNER', 'SUPER_ADMIN', 'HR_MANAGER')
  if (error) return error
  try {
    const branches = await db.branch.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ branches })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to load branches' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN', 'HR_MANAGER')
  if (error) return error
  try {
    const body = await req.json()
    const { name, code, address, city, state, pincode, phone, email, isHead, status } = body
    if (!name?.trim()) return NextResponse.json({ error: 'Branch name is required' }, { status: 400 })
    if (!code?.trim()) return NextResponse.json({ error: 'Branch code is required' }, { status: 400 })
    const byCode = await db.branch.findFirst({ where: { code: code.trim().toUpperCase() } })
    if (byCode) return NextResponse.json({ error: 'Branch with this code already exists' }, { status: 409 })
    const branch = await db.branch.create({
      data: {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        address: address || null,
        city: city || null,
        state: state || null,
        pincode: pincode || null,
        phone: phone || null,
        email: email || null,
        isHead: !!isHead,
        status: status || 'ACTIVE',
      },
    })
    await audit(cu!.user.id, 'CREATE_BRANCH', 'Branch', branch.id, branch.name)
    return NextResponse.json({ ok: true, branch })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create branch' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN', 'HR_MANAGER')
  if (error) return error
  try {
    const { id, name, code, address, city, state, pincode, phone, email, isHead, status } = await req.json()
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    if (code) {
      const byCode = await db.branch.findFirst({ where: { code: code.trim().toUpperCase(), id: { not: id } } })
      if (byCode) return NextResponse.json({ error: 'Branch with this code already exists' }, { status: 409 })
    }
    const data: any = {}
    if (name !== undefined) data.name = name.trim()
    if (code !== undefined) data.code = code.trim().toUpperCase()
    if (address !== undefined) data.address = address || null
    if (city !== undefined) data.city = city || null
    if (state !== undefined) data.state = state || null
    if (pincode !== undefined) data.pincode = pincode || null
    if (phone !== undefined) data.phone = phone || null
    if (email !== undefined) data.email = email || null
    if (isHead !== undefined) data.isHead = !!isHead
    if (status !== undefined) data.status = status
    const branch = await db.branch.update({ where: { id }, data })
    await audit(cu!.user.id, 'UPDATE_BRANCH', 'Branch', id)
    return NextResponse.json({ ok: true, branch })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to update branch' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN')
  if (error) return error
  try {
    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    await db.branch.delete({ where: { id } })
    await audit(cu!.user.id, 'DELETE_BRANCH', 'Branch', id)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to delete branch' }, { status: 500 })
  }
}
