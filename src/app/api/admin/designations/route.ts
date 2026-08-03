import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole, audit } from '@/lib/guards'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const { error } = await requireRole('OWNER', 'SUPER_ADMIN', 'HR_MANAGER')
  if (error) return error
  try {
    const designations = await db.designation.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ designations })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to load designations' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN', 'HR_MANAGER')
  if (error) return error
  try {
    const body = await req.json()
    const { title, level, department, minSalary, maxSalary, description, status } = body
    if (!title?.trim()) return NextResponse.json({ error: 'Designation title is required' }, { status: 400 })
    const existing = await db.designation.findFirst({ where: { title: title.trim() } })
    if (existing) return NextResponse.json({ error: 'Designation with this title already exists' }, { status: 409 })
    const desig = await db.designation.create({
      data: {
        title: title.trim(),
        level: level || null,
        department: department || null,
        minSalary: minSalary ? Number(minSalary) : null,
        maxSalary: maxSalary ? Number(maxSalary) : null,
        description: description || null,
        status: status || 'ACTIVE',
      },
    })
    await audit(cu!.user.id, 'CREATE_DESIGNATION', 'Designation', desig.id, desig.title)
    return NextResponse.json({ ok: true, designation: desig })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create designation' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN', 'HR_MANAGER')
  if (error) return error
  try {
    const { id, title, level, department, minSalary, maxSalary, description, status } = await req.json()
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    if (title) {
      const existing = await db.designation.findFirst({ where: { title: title.trim(), id: { not: id } } })
      if (existing) return NextResponse.json({ error: 'Designation with this title already exists' }, { status: 409 })
    }
    const data: any = {}
    if (title !== undefined) data.title = title.trim()
    if (level !== undefined) data.level = level || null
    if (department !== undefined) data.department = department || null
    if (minSalary !== undefined) data.minSalary = minSalary ? Number(minSalary) : null
    if (maxSalary !== undefined) data.maxSalary = maxSalary ? Number(maxSalary) : null
    if (description !== undefined) data.description = description || null
    if (status !== undefined) data.status = status
    const desig = await db.designation.update({ where: { id }, data })
    await audit(cu!.user.id, 'UPDATE_DESIGNATION', 'Designation', id)
    return NextResponse.json({ ok: true, designation: desig })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to update designation' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN')
  if (error) return error
  try {
    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    await db.designation.delete({ where: { id } })
    await audit(cu!.user.id, 'DELETE_DESIGNATION', 'Designation', id)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to delete designation' }, { status: 500 })
  }
}
