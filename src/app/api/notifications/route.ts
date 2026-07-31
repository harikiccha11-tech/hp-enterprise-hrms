import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const cu = await getCurrentUser()
  if (!cu) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const notifications = await db.notification.findMany({ where: { userId: cu.user.id }, orderBy: { createdAt: 'desc' }, take: 100 })
  const unread = notifications.filter(n => !n.read).length
  return NextResponse.json({ notifications, unread })
}

export async function PATCH(req: NextRequest) {
  const cu = await getCurrentUser()
  if (!cu) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id, all } = await req.json()
  if (all) {
    await db.notification.updateMany({ where: { userId: cu.user.id, read: false }, data: { read: true } })
  } else if (id) {
    await db.notification.update({ where: { id }, data: { read: true } })
  }
  return NextResponse.json({ ok: true })
}
