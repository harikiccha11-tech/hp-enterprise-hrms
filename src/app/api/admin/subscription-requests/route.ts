import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/guards'
import { audit } from '@/lib/auth'

export const runtime = 'nodejs'

const VALID_STATUSES = ['NEW', 'CONTACTED', 'CONVERTED', 'REJECTED']

/** GET — list all subscription/demo/contact/newsletter requests */
export async function GET(req: NextRequest) {
  const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN', 'HR_MANAGER')
  if (error) return error

  try {
    const { searchParams } = new URL(req.url)
    const page = Math.max(1, Number(searchParams.get('page')) || 1)
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit')) || 50))
    const plan = searchParams.get('plan')
    const status = searchParams.get('status')

    const where: Record<string, string> = {}
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
  } catch (e) {
    console.error('Admin subscription requests error:', e)
    return NextResponse.json({ error: 'Failed to load requests' }, { status: 500 })
  }
}

/** PATCH — update status */
export async function PATCH(req: NextRequest) {
  const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN')
  if (error) return error

  try {
    const { id, status } = await req.json()
    if (!id || !status) {
      return NextResponse.json({ error: 'ID and status are required' }, { status: 400 })
    }
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    await db.subscriptionRequest.update({ where: { id }, data: { status } })
    try { await audit(cu!.user.id, 'UPDATE_SUBSCRIPTION_REQUEST', 'SubscriptionRequest', id, `Status → ${status}`) } catch {}
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Admin subscription request update error:', e)
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}

/** DELETE — remove a request */
export async function DELETE(req: NextRequest) {
  const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN')
  if (error) return error

  try {
    const { id } = await req.json()
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    await db.subscriptionRequest.delete({ where: { id } })
    try { await audit(cu!.user.id, 'DELETE_SUBSCRIPTION_REQUEST', 'SubscriptionRequest', id) } catch {}
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Admin subscription request delete error:', e)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
