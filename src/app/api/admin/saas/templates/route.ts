import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole, audit } from '@/lib/guards'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { error } = await requireRole('SUPER_ADMIN')
    if (error) return error

    const url = new URL(req.url)
    const type = url.searchParams.get('type') || 'email'

    if (type === 'email') {
      const templates = await db.emailTemplate.findMany({ orderBy: { updatedAt: 'desc' } })
      return NextResponse.json({
        templates: templates.map((t) => ({
          id: t.id,
          name: t.name,
          subject: t.subject,
          body: t.body,
          variables: t.variables ? JSON.parse(t.variables) : [],
          category: t.category,
          status: t.status,
          updatedAt: t.updatedAt.toISOString().split('T')[0],
        })),
      })
    }

    if (type === 'whatsapp') {
      // WhatsApp templates stored as content items
      const items = await db.contentItem.findMany({
        where: { type: 'whatsapp_template' },
        orderBy: { createdAt: 'desc' },
      })
      return NextResponse.json({
        templates: items.map((item) => {
          let content: any = {}
          try { content = item.content ? JSON.parse(item.content) : {} } catch { content = {} }
          return {
            id: item.id,
            name: item.title,
            category: content.category || '',
            language: content.language || 'English',
            status: content.status || 'Pending',
            content: content.content || '',
          }
        }),
      })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (e) {
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { error, cu } = await requireRole('SUPER_ADMIN')
    if (error) return error

    const body = await req.json()
    const { type } = body

    if (type === 'email') {
      const { name, subject, body: emailBody, variables, category } = body
      if (!name || !subject) return NextResponse.json({ error: 'Name and subject required' }, { status: 400 })

      const template = await db.emailTemplate.create({
        data: {
          name,
          subject,
          body: emailBody || '',
          variables: variables ? JSON.stringify(variables) : null,
          category: category || 'General',
        },
      })
      await audit(cu!.user.id, 'CREATE', 'EmailTemplate', template.id, `Created: ${name}`)
      return NextResponse.json({ ok: true, template }, { status: 201 })
    }

    if (type === 'whatsapp') {
      const { name, category, language, content: msgContent } = body
      if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 })

      const item = await db.contentItem.create({
        data: {
          type: 'whatsapp_template',
          title: name,
          content: JSON.stringify({ category, language, status: 'Pending', content: msgContent }),
          status: 'published',
        },
      })
      await audit(cu!.user.id, 'CREATE', 'ContentItem', item.id, `WhatsApp template: ${name}`)
      return NextResponse.json({ ok: true, id: item.id }, { status: 201 })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (e) {
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { error, cu } = await requireRole('SUPER_ADMIN')
    if (error) return error

    const body = await req.json()
    const { type, id } = body

    if (type === 'email') {
      const { name, subject, body: emailBody, variables, category, status } = body
      await db.emailTemplate.update({
        where: { id },
        data: {
          ...(name !== undefined && { name }),
          ...(subject !== undefined && { subject }),
          ...(emailBody !== undefined && { body: emailBody }),
          ...(variables !== undefined && { variables: JSON.stringify(variables) }),
          ...(category !== undefined && { category }),
          ...(status !== undefined && { status }),
        },
      })
      await audit(cu!.user.id, 'UPDATE', 'EmailTemplate', id, `Updated: ${name}`)
      return NextResponse.json({ ok: true })
    }

    if (type === 'whatsapp') {
      const { name, category, language, content: msgContent, status: itemStatus } = body
      const existing = await db.contentItem.findUnique({ where: { id } })
      if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

      let existingContent: any = {}
      try { existingContent = existing.content ? JSON.parse(existing.content) : {} } catch { existingContent = {} }

      await db.contentItem.update({
        where: { id },
        data: {
          ...(name !== undefined && { title: name }),
          content: JSON.stringify({
            ...existingContent,
            ...(category !== undefined && { category }),
            ...(language !== undefined && { language }),
            ...(msgContent !== undefined && { content: msgContent }),
            ...(itemStatus !== undefined && { status: itemStatus }),
          }),
        },
      })
      await audit(cu!.user.id, 'UPDATE', 'ContentItem', id, `WhatsApp template updated`)
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (e) {
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { error, cu } = await requireRole('SUPER_ADMIN')
    if (error) return error

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    const type = searchParams.get('type')

    if (!id || !type) return NextResponse.json({ error: 'ID and type required' }, { status: 400 })

    if (type === 'email') {
      await db.emailTemplate.delete({ where: { id } })
      await audit(cu!.user.id, 'DELETE', 'EmailTemplate', id, 'Deleted')
    } else if (type === 'whatsapp') {
      await db.contentItem.delete({ where: { id } })
      await audit(cu!.user.id, 'DELETE', 'ContentItem', id, 'WhatsApp template deleted')
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}
