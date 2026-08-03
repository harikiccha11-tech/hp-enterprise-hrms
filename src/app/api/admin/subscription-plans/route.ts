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
    const where: any = {}
    if (status) where.status = status
    const items = await db.subscriptionPlan.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    })
    return NextResponse.json({ items })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to load subscription plans' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN')
  if (error) return error
  try {
    const body = await req.json()
    const { name, description, priceINR, priceUSD, interval, maxEmployees, features, status, trialDays, sortOrder, isPopular } = body
    if (!name?.trim()) return NextResponse.json({ error: 'Plan name is required' }, { status: 400 })
    const existing = await db.subscriptionPlan.findFirst({ where: { name: name.trim() } })
    if (existing) return NextResponse.json({ error: 'Plan with this name already exists' }, { status: 409 })
    const item = await db.subscriptionPlan.create({
      data: {
        name: name.trim(),
        description: description || null,
        priceINR: priceINR ?? null,
        priceUSD: priceUSD ?? null,
        interval: interval || 'MONTHLY',
        maxEmployees: maxEmployees ?? null,
        features: typeof features === 'string' ? features : JSON.stringify(features || []),
        status: status || 'ACTIVE',
        trialDays: trialDays ?? 14,
        sortOrder: sortOrder ?? 0,
        isPopular: isPopular ?? false,
      },
    })
    await (await import('@/lib/audit')).audit(cu!.user.id, 'CREATE_SUBSCRIPTION_PLAN', 'SubscriptionPlan', item.id, item.name)
    return NextResponse.json({ ok: true, item })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create subscription plan' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN')
  if (error) return error
  try {
    const { id, ...data } = await req.json()
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    if (data.name) {
      const existing = await db.subscriptionPlan.findFirst({ where: { name: data.name.trim(), id: { not: id } } })
      if (existing) return NextResponse.json({ error: 'Plan with this name already exists' }, { status: 409 })
    }
    const update: any = {}
    if (data.name !== undefined) update.name = data.name.trim()
    if (data.description !== undefined) update.description = data.description || null
    if (data.priceINR !== undefined) update.priceINR = data.priceINR ?? null
    if (data.priceUSD !== undefined) update.priceUSD = data.priceUSD ?? null
    if (data.interval !== undefined) update.interval = data.interval
    if (data.maxEmployees !== undefined) update.maxEmployees = data.maxEmployees ?? null
    if (data.features !== undefined) update.features = typeof data.features === 'string' ? data.features : JSON.stringify(data.features || [])
    if (data.status !== undefined) update.status = data.status
    if (data.trialDays !== undefined) update.trialDays = data.trialDays
    if (data.sortOrder !== undefined) update.sortOrder = data.sortOrder
    if (data.isPopular !== undefined) update.isPopular = data.isPopular
    const item = await db.subscriptionPlan.update({ where: { id }, data: update })
    await (await import('@/lib/audit')).audit(cu!.user.id, 'UPDATE_SUBSCRIPTION_PLAN', 'SubscriptionPlan', id)
    return NextResponse.json({ ok: true, item })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to update subscription plan' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN')
  if (error) return error
  try {
    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    await db.subscriptionPlan.delete({ where: { id } })
    await (await import('@/lib/audit')).audit(cu!.user.id, 'DELETE_SUBSCRIPTION_PLAN', 'SubscriptionPlan', id)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to delete subscription plan' }, { status: 500 })
  }
}
