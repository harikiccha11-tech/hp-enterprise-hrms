import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/guards'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { error } = await requireRole('OWNER', 'SUPER_ADMIN', 'HR_MANAGER')
  if (error) return error
  const { searchParams } = new URL(req.url)
  const limit = Number(searchParams.get('limit')) || 200
  const logs = await db.auditLog.findMany({ include: { user: { select: { username: true, role: true } } }, orderBy: { at: 'desc' }, take: limit })
  return NextResponse.json({ logs })
}
