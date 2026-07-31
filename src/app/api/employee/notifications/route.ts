import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const cu = await getCurrentUser()
  if (!cu) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const notifications = await db.notification.findMany({ where: { userId: cu.user.id }, orderBy: { createdAt: 'desc' }, take: 100 })
  return NextResponse.json({ notifications })
}
