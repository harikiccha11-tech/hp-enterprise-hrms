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
    const search = sp.get('search') || ''
    const where: any = {}
    if (category) where.category = category
    if (search) {
      where.OR = [
        { question: { contains: search } },
        { answer: { contains: search } },
        { tags: { contains: search } },
      ]
    }
    const items = await db.knowledgeBase.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    })
    return NextResponse.json({ items })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to load knowledge base' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN')
  if (error) return error
  try {
    const body = await req.json()
    const { category, question, answer, tags, keywords, enabled, sortOrder } = body
    if (!category?.trim()) return NextResponse.json({ error: 'Category is required' }, { status: 400 })
    if (!question?.trim()) return NextResponse.json({ error: 'Question is required' }, { status: 400 })
    if (!answer?.trim()) return NextResponse.json({ error: 'Answer is required' }, { status: 400 })
    const item = await db.knowledgeBase.create({
      data: {
        category: category.trim(),
        question: question.trim(),
        answer: answer.trim(),
        tags: tags || null,
        keywords: keywords || null,
        enabled: enabled !== undefined ? enabled : true,
        sortOrder: sortOrder || 0,
      },
    })
    await (await import('@/lib/audit')).audit(cu!.user.id, 'CREATE_KNOWLEDGE_BASE', 'KnowledgeBase', item.id, item.question)
    return NextResponse.json({ ok: true, item })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create knowledge base entry' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN')
  if (error) return error
  try {
    const { id, ...data } = await req.json()
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    const update: any = {}
    if (data.category !== undefined) update.category = data.category.trim()
    if (data.question !== undefined) update.question = data.question.trim()
    if (data.answer !== undefined) update.answer = data.answer.trim()
    if (data.tags !== undefined) update.tags = data.tags || null
    if (data.keywords !== undefined) update.keywords = data.keywords || null
    if (data.enabled !== undefined) update.enabled = data.enabled
    if (data.sortOrder !== undefined) update.sortOrder = data.sortOrder
    const item = await db.knowledgeBase.update({ where: { id }, data: update })
    await (await import('@/lib/audit')).audit(cu!.user.id, 'UPDATE_KNOWLEDGE_BASE', 'KnowledgeBase', id)
    return NextResponse.json({ ok: true, item })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to update knowledge base entry' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN')
  if (error) return error
  try {
    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    await db.knowledgeBase.delete({ where: { id } })
    await (await import('@/lib/audit')).audit(cu!.user.id, 'DELETE_KNOWLEDGE_BASE', 'KnowledgeBase', id)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to delete knowledge base entry' }, { status: 500 })
  }
}
