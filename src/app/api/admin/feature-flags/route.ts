import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/guards'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const { error } = await requireRole('OWNER', 'SUPER_ADMIN', 'HR_MANAGER')
  if (error) return error
  try {
    const items = await db.featureFlag.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ items })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to load feature flags' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN')
  if (error) return error
  try {
    const body = await req.json()
    const { key, name, description, enabled, environments } = body
    if (!key?.trim()) return NextResponse.json({ error: 'Key is required' }, { status: 400 })
    if (!name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    const existing = await db.featureFlag.findFirst({ where: { key: key.trim() } })
    if (existing) return NextResponse.json({ error: 'Feature flag with this key already exists' }, { status: 409 })
    const item = await db.featureFlag.create({
      data: {
        key: key.trim(),
        name: name.trim(),
        description: description || null,
        enabled: enabled ?? false,
        environments: typeof environments === 'string' ? environments : JSON.stringify(environments || []),
      },
    })
    await (await import('@/lib/audit')).audit(cu!.user.id, 'CREATE_FEATURE_FLAG', 'FeatureFlag', item.id, item.key)
    return NextResponse.json({ ok: true, item })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create feature flag' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN')
  if (error) return error
  try {
    const { id, ...data } = await req.json()
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    if (data.key) {
      const existing = await db.featureFlag.findFirst({ where: { key: data.key.trim(), id: { not: id } } })
      if (existing) return NextResponse.json({ error: 'Feature flag with this key already exists' }, { status: 409 })
    }
    const update: any = {}
    if (data.key !== undefined) update.key = data.key.trim()
    if (data.name !== undefined) update.name = data.name.trim()
    if (data.description !== undefined) update.description = data.description || null
    if (data.enabled !== undefined) update.enabled = data.enabled
    if (data.environments !== undefined) update.environments = typeof data.environments === 'string' ? data.environments : JSON.stringify(data.environments || [])
    const item = await db.featureFlag.update({ where: { id }, data: update })
    await (await import('@/lib/audit')).audit(cu!.user.id, 'UPDATE_FEATURE_FLAG', 'FeatureFlag', id)
    return NextResponse.json({ ok: true, item })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to update feature flag' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN')
  if (error) return error
  try {
    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    await db.featureFlag.delete({ where: { id } })
    await (await import('@/lib/audit')).audit(cu!.user.id, 'DELETE_FEATURE_FLAG', 'FeatureFlag', id)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to delete feature flag' }, { status: 500 })
  }
}
