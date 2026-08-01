import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const cu = await getCurrentUser()
    if (!cu) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const notifications = await db.notification.findMany({ where: { userId: cu.user.id }, orderBy: { createdAt: 'desc' }, take: 100 })
    const unread = notifications.filter(n => !n.read).length
    return NextResponse.json({ notifications, unread })
  } catch (e) {
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const cu = await getCurrentUser()
    if (!cu) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { id, all } = await req.json()
    if (all) {
      await db.notification.updateMany({ where: { userId: cu.user.id, read: false }, data: { read: true } })
    } else if (id) {
      const notif = await db.notification.findFirst({ where: { id, userId: cu.user.id } })
      if (!notif) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      await db.notification.update({ where: { id }, data: { read: true } })
    }
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}
