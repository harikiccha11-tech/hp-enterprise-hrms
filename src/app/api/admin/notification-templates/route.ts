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
    const category = sp.get('category') || ''
    const where: any = {}
    if (category) where.category = category
    const items = await db.notificationTemplate.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ items })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to load notification templates' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN')
  if (error) return error
  try {
    const body = await req.json()
    const { name, title, body: tplBody, type, category, status } = body
    if (!name?.trim()) return NextResponse.json({ error: 'Template name is required' }, { status: 400 })
    if (!title?.trim()) return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    if (!tplBody?.trim()) return NextResponse.json({ error: 'Body is required' }, { status: 400 })
    const existing = await db.notificationTemplate.findFirst({ where: { name: name.trim() } })
    if (existing) return NextResponse.json({ error: 'Template with this name already exists' }, { status: 409 })
    const item = await db.notificationTemplate.create({
      data: {
        name: name.trim(),
        title: title.trim(),
        body: tplBody.trim(),
        type: type || null,
        category: category || null,
        status: status || 'ACTIVE',
      },
    })
    await (await import('@/lib/audit')).audit(cu!.user.id, 'CREATE_NOTIFICATION_TEMPLATE', 'NotificationTemplate', item.id, item.name)
    return NextResponse.json({ ok: true, item })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create notification template' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN')
  if (error) return error
  try {
    const { id, ...data } = await req.json()
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    if (data.name) {
      const existing = await db.notificationTemplate.findFirst({ where: { name: data.name.trim(), id: { not: id } } })
      if (existing) return NextResponse.json({ error: 'Template with this name already exists' }, { status: 409 })
    }
    const update: any = {}
    if (data.name !== undefined) update.name = data.name.trim()
    if (data.title !== undefined) update.title = data.title.trim()
    if (data.body !== undefined) update.body = data.body.trim()
    if (data.type !== undefined) update.type = data.type || null
    if (data.category !== undefined) update.category = data.category || null
    if (data.status !== undefined) update.status = data.status
    const item = await db.notificationTemplate.update({ where: { id }, data: update })
    await (await import('@/lib/audit')).audit(cu!.user.id, 'UPDATE_NOTIFICATION_TEMPLATE', 'NotificationTemplate', id)
    return NextResponse.json({ ok: true, item })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to update notification template' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN')
  if (error) return error
  try {
    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    await db.notificationTemplate.delete({ where: { id } })
    await (await import('@/lib/audit')).audit(cu!.user.id, 'DELETE_NOTIFICATION_TEMPLATE', 'NotificationTemplate', id)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to delete notification template' }, { status: 500 })
  }
}
