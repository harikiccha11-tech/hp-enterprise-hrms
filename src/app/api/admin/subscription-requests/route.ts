import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireAuth } from '@/lib/guards'

export const runtime = 'nodejs'

const VALID_STATUSES = ['NEW', 'CONTACTED', 'CONVERTED', 'REJECTED']

/** GET — list all subscription/demo/contact/newsletter requests */
export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth(req)
    if (!user || (user.role !== 'OWNER' && user.role !== 'SUPER_ADMIN' && user.role !== 'HR_MANAGER')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const page = Math.max(1, Number(searchParams.get('page')) || 1)
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 50))
    const plan = searchParams.get('plan')
    const status = searchParams.get('status')

    const where: any = {}
    if (plan && plan !== 'ALL') where.plan = plan
    if (status && status !== 'ALL') where.status = status

    const [items, total] = await Promise.all([
      db.subscriptionRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.subscriptionRequest.count({ where }),
    ])

    return NextResponse.json({ items, total, page, limit })
  } catch (e: any) {
    if (e?.message?.includes('Unauthorized')) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    console.error('Admin subscription requests error:', e)
    return NextResponse.json({ error: 'Failed to load requests' }, { status: 500 })
  }
}

/** PATCH — update status */
export async function PATCH(req: NextRequest) {
  try {
    const user = await requireAuth(req)
    if (!user || (user.role !== 'OWNER' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { id, status } = await req.json()
    if (!id || !status) {
      return NextResponse.json({ error: 'ID and status are required' }, { status: 400 })
    }
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    await db.subscriptionRequest.update({ where: { id }, data: { status } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    if (e?.message?.includes('Unauthorized')) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    console.error('Admin subscription request update error:', e)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

/** DELETE — remove a request */
export async function DELETE(req: NextRequest) {
  try {
    const user = await requireAuth(req)
    if (!user || (user.role !== 'OWNER' && user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { id } = await req.json()
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    await db.subscriptionRequest.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    if (e?.message?.includes('Unauthorized')) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    console.error('Admin subscription request delete error:', e)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
