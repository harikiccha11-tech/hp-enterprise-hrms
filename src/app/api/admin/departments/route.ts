import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole, audit } from '@/lib/guards'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN', 'HR_MANAGER')
  if (error) return error
  const aid = cu!.user.accountId
  try {
    const departments = await db.department.findMany({
      where: { accountId: aid },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ departments })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to load departments' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN', 'HR_MANAGER')
  if (error) return error
  const aid = cu!.user.accountId
  try {
    const body = await req.json()
    const { name, code, description, headName, headEmail, status } = body
    if (!name?.trim()) return NextResponse.json({ error: 'Department name is required' }, { status: 400 })
    if (!code?.trim()) return NextResponse.json({ error: 'Department code is required' }, { status: 400 })
    const byName = await db.department.findFirst({ where: { name: name.trim(), accountId: aid } })
    if (byName) return NextResponse.json({ error: 'Department with this name already exists' }, { status: 409 })
    const byCode = await db.department.findFirst({ where: { code: code.trim().toUpperCase(), accountId: aid } })
    if (byCode) return NextResponse.json({ error: 'Department with this code already exists' }, { status: 409 })
    const dept = await db.department.create({
      data: {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description || null,
        headName: headName || null,
        headEmail: headEmail || null,
        status: status || 'ACTIVE',
        accountId: aid,
      },
    })
    await audit(cu!.user.id, 'CREATE_DEPARTMENT', 'Department', dept.id, dept.name)
    return NextResponse.json({ ok: true, department: dept })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create department' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN', 'HR_MANAGER')
  if (error) return error
  const aid = cu!.user.accountId
  try {
    const { id, name, code, description, headName, headEmail, status } = await req.json()
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    const existing = await db.department.findUnique({ where: { id } })
    if (!existing || existing.accountId !== aid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (name) {
      const byName = await db.department.findFirst({ where: { name: name.trim(), id: { not: id }, accountId: aid } })
      if (byName) return NextResponse.json({ error: 'Department with this name already exists' }, { status: 409 })
    }
    if (code) {
      const byCode = await db.department.findFirst({ where: { code: code.trim().toUpperCase(), id: { not: id }, accountId: aid } })
      if (byCode) return NextResponse.json({ error: 'Department with this code already exists' }, { status: 409 })
    }
    const data: any = {}
    if (name !== undefined) data.name = name.trim()
    if (code !== undefined) data.code = code.trim().toUpperCase()
    if (description !== undefined) data.description = description || null
    if (headName !== undefined) data.headName = headName || null
    if (headEmail !== undefined) data.headEmail = headEmail || null
    if (status !== undefined) data.status = status
    const dept = await db.department.update({ where: { id }, data })
    await audit(cu!.user.id, 'UPDATE_DEPARTMENT', 'Department', id)
    return NextResponse.json({ ok: true, department: dept })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to update department' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN')
  if (error) return error
  const aid = cu!.user.accountId
  try {
    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    const existing = await db.department.findUnique({ where: { id } })
    if (!existing || existing.accountId !== aid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    await db.department.delete({ where: { id } })
    await audit(cu!.user.id, 'DELETE_DEPARTMENT', 'Department', id)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to delete department' }, { status: 500 })
  }
}
