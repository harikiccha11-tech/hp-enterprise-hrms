import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole, audit } from '@/lib/guards'
import { getCurrentUser } from '@/lib/auth'
import { notify } from '@/lib/notify'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const cu = await getCurrentUser()
  if (!cu) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const where = cu.user.role === 'EMPLOYEE' ? { audience: { in: ['ALL', 'EMPLOYEE'] } } : {}
  const announcements = await db.announcement.findMany({ where, orderBy: { postedAt: 'desc' } })
  return NextResponse.json({ announcements })
}

export async function POST(req: NextRequest) {
  const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN', 'HR_MANAGER')
  if (error) return error
  try {
    const { title, body, audience } = await req.json()
    const ann = await db.announcement.create({ data: { title, body, audience: audience || 'ALL', postedBy: cu!.user.id } })
    // notify all employees
    const users = audience === 'ADMIN'
      ? await db.user.findMany({ where: { role: { in: ['SUPER_ADMIN', 'HR_MANAGER'] } } })
      : await db.user.findMany({ where: { role: audience === 'EMPLOYEE' ? 'EMPLOYEE' : { in: ['SUPER_ADMIN', 'HR_MANAGER', 'EMPLOYEE'] } } })
    for (const u of users) {
      await notify(u.id, 'Company Announcement', title, 'ANNOUNCEMENT')
    }
    await audit(cu!.user.id, 'POST_ANNOUNCEMENT', 'Announcement', ann.id, title)
    return NextResponse.json({ ok: true, announcement: ann })
  } catch (e) { return NextResponse.json({ error: 'Failed' }, { status: 500 }) }
}
