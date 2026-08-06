import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole, audit } from '@/lib/guards'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const VALID_TYPES = ['faq', 'blog', 'career', 'banner', 'social', 'landing_section']

export async function GET(req: NextRequest) {
  try {
    const { error } = await requireRole('OWNER', 'SUPER_ADMIN')
    if (error) return error

    const url = new URL(req.url)
    const type = url.searchParams.get('type') || ''

    const where: any = {}
    if (type && VALID_TYPES.includes(type)) {
      where.type = type
    }

    const items = await db.contentItem.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
    })

    // Parse content JSON for each item
    const result = items.map((item) => {
      let parsed: any = {}
      try { parsed = item.content ? JSON.parse(item.content) : {} } catch { parsed = {} }
      let meta: any = {}
      try { meta = item.metadata ? JSON.parse(item.metadata) : {} } catch { meta = {} }
      return {
        id: item.id,
        type: item.type,
        title: item.title,
        slug: item.slug,
        status: item.status,
        sortOrder: item.sortOrder,
        ...parsed,
        ...meta,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      }
    })

    return NextResponse.json({ items: result })
  } catch (e) {
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN')
    if (error) return error

    const body = await req.json()
    const { type, title, slug, content, status, sortOrder, metadata } = body

    if (!type || !VALID_TYPES.includes(type)) {
      return NextResponse.json({ error: 'Invalid or missing content type' }, { status: 400 })
    }
    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    // Separate content fields from metadata
    const contentFields: Record<string, any> = { ...body }
    delete contentFields.type
    delete contentFields.title
    delete contentFields.slug
    delete contentFields.content
    delete contentFields.status
    delete contentFields.sortOrder
    delete contentFields.metadata

    const item = await db.contentItem.create({
      data: {
        type,
        title,
        slug: slug || `${type}-${Date.now()}`,
        content: content || (Object.keys(contentFields).length > 0 ? JSON.stringify(contentFields) : null),
        status: status || 'published',
        sortOrder: sortOrder ?? 0,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    })

    await audit(cu!.user.id, 'CREATE', 'ContentItem', item.id, `Created ${type}: ${title}`)
    return NextResponse.json({ item }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN')
    if (error) return error

    const body = await req.json()
    const { id, sortOrder, reorder } = body

    // Handle bulk reorder (landing page sections, FAQs)
    if (reorder && Array.isArray(reorder)) {
      for (const item of reorder) {
        await db.contentItem.update({ where: { id: item.id }, data: { sortOrder: item.sortOrder } })
      }
      await audit(cu!.user.id, 'UPDATE', 'ContentItem', 'bulk', 'Reordered content items')
      return NextResponse.json({ ok: true })
    }

    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

    const existing = await db.contentItem.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const updateData: any = {}
    if (body.title !== undefined) updateData.title = body.title
    if (body.slug !== undefined) updateData.slug = body.slug
    if (body.status !== undefined) updateData.status = body.status
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder

    // Everything else goes into content JSON
    const contentFields: Record<string, any> = { ...body }
    delete contentFields.id
    delete contentFields.title
    delete contentFields.slug
    delete contentFields.status
    delete contentFields.sortOrder
    delete contentFields.reorder

    if (Object.keys(contentFields).length > 0) {
      // Merge with existing content
      let existingContent: any = {}
      try { existingContent = existing.content ? JSON.parse(existing.content) : {} } catch { existingContent = {} }
      updateData.content = JSON.stringify({ ...existingContent, ...contentFields })
    }

    const updated = await db.contentItem.update({ where: { id }, data: updateData })
    await audit(cu!.user.id, 'UPDATE', 'ContentItem', id, `Updated ${existing.type}: ${existing.title}`)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN')
    if (error) return error

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })

    const existing = await db.contentItem.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await db.contentItem.delete({ where: { id } })
    await audit(cu!.user.id, 'DELETE', 'ContentItem', id, `Deleted ${existing.type}: ${existing.title}`)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}
