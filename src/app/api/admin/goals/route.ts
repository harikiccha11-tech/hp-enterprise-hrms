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
        { title: { contains: search } },
      ]
    }
    const goals = await db.goal.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ goals })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to load goals' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN', 'HR_MANAGER')
  if (error) return error
  try {
    const body = await req.json()
    const { employeeId, title, description, category, priority, progress, targetDate, status, weight } = body
    if (!employeeId) return NextResponse.json({ error: 'Employee ID is required' }, { status: 400 })
    if (!title?.trim()) return NextResponse.json({ error: 'Goal title is required' }, { status: 400 })
    const goal = await db.goal.create({
      data: {
        employeeId,
        title: title.trim(),
        description: description || '',
        category: category || 'Technical',
        priority: priority || 'MEDIUM',
        progress: progress || 0,
        targetDate: targetDate ? new Date(targetDate) : null,
        status: status || 'NOT_STARTED',
        weight: weight ? Number(weight) : null,
      },
    })
    return NextResponse.json({ ok: true, goal })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create goal' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN', 'HR_MANAGER')
  if (error) return error
  try {
    const { id, title, description, category, priority, progress, targetDate, status, weight } = await req.json()
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    const data: any = {}
    if (title !== undefined) data.title = title.trim()
    if (description !== undefined) data.description = description
    if (category !== undefined) data.category = category
    if (priority !== undefined) data.priority = priority
    if (progress !== undefined) data.progress = Number(progress)
    if (targetDate !== undefined) data.targetDate = targetDate ? new Date(targetDate) : null
    if (status !== undefined) data.status = status
    if (weight !== undefined) data.weight = weight ? Number(weight) : null
    const goal = await db.goal.update({ where: { id }, data })
    return NextResponse.json({ ok: true, goal })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to update goal' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN')
  if (error) return error
  try {
    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    await db.goal.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to delete goal' }, { status: 500 })
  }
}
