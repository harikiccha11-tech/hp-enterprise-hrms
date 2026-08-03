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
    const items = await db.emailTemplate.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ items })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to load email templates' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN')
  if (error) return error
  try {
    const body = await req.json()
    const { name, subject, body: htmlBody, variables, category, status } = body
    if (!name?.trim()) return NextResponse.json({ error: 'Template name is required' }, { status: 400 })
    if (!subject?.trim()) return NextResponse.json({ error: 'Subject is required' }, { status: 400 })
    if (!htmlBody?.trim()) return NextResponse.json({ error: 'Body is required' }, { status: 400 })
    const existing = await db.emailTemplate.findFirst({ where: { name: name.trim() } })
    if (existing) return NextResponse.json({ error: 'Template with this name already exists' }, { status: 409 })
    const item = await db.emailTemplate.create({
      data: {
        name: name.trim(),
        subject: subject.trim(),
        body: htmlBody.trim(),
        variables: variables || null,
        category: category || null,
        status: status || 'ACTIVE',
      },
    })
    await (await import('@/lib/audit')).audit(cu!.user.id, 'CREATE_EMAIL_TEMPLATE', 'EmailTemplate', item.id, item.name)
    return NextResponse.json({ ok: true, item })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create email template' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN')
  if (error) return error
  try {
    const { id, ...data } = await req.json()
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    if (data.name) {
      const existing = await db.emailTemplate.findFirst({ where: { name: data.name.trim(), id: { not: id } } })
      if (existing) return NextResponse.json({ error: 'Template with this name already exists' }, { status: 409 })
    }
    const update: any = {}
    if (data.name !== undefined) update.name = data.name.trim()
    if (data.subject !== undefined) update.subject = data.subject.trim()
    if (data.body !== undefined) update.body = data.body.trim()
    if (data.variables !== undefined) update.variables = data.variables || null
    if (data.category !== undefined) update.category = data.category || null
    if (data.status !== undefined) update.status = data.status
    const item = await db.emailTemplate.update({ where: { id }, data: update })
    await (await import('@/lib/audit')).audit(cu!.user.id, 'UPDATE_EMAIL_TEMPLATE', 'EmailTemplate', id)
    return NextResponse.json({ ok: true, item })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to update email template' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN')
  if (error) return error
  try {
    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    await db.emailTemplate.delete({ where: { id } })
    await (await import('@/lib/audit')).audit(cu!.user.id, 'DELETE_EMAIL_TEMPLATE', 'EmailTemplate', id)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to delete email template' }, { status: 500 })
  }
}
