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
    // notify all relevant users
    const users = audience === 'ADMIN'
      ? await db.user.findMany({ where: { role: { in: ['OWNER', 'SUPER_ADMIN', 'HR_MANAGER'] } } })
      : await db.user.findMany({ where: { role: audience === 'EMPLOYEE' ? 'EMPLOYEE' : { in: ['OWNER', 'SUPER_ADMIN', 'HR_MANAGER', 'EMPLOYEE'] } } })
    for (const u of users) {
      await notify(u.id, 'Company Announcement', title, 'ANNOUNCEMENT')
    }
    await audit(cu!.user.id, 'POST_ANNOUNCEMENT', 'Announcement', ann.id, title)
    return NextResponse.json({ ok: true, announcement: ann })
  } catch (e) { return NextResponse.json({ error: 'Failed' }, { status: 500 }) }
}

export async function PATCH(req: NextRequest) {
  const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN', 'HR_MANAGER')
  if (error) return error
  try {
    const { id, ...data } = await req.json()
    const ann = await db.announcement.update({ where: { id }, data })
    await audit(cu!.user.id, 'UPDATE_ANNOUNCEMENT', 'Announcement', id, data.title || '')
    return NextResponse.json({ ok: true, announcement: ann })
  } catch (e) { return NextResponse.json({ error: 'Failed' }, { status: 500 }) }
}

export async function DELETE(req: NextRequest) {
  const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN')
  if (error) return error
  try {
    const { id } = await req.json()
    await db.announcement.delete({ where: { id } })
    await audit(cu!.user.id, 'DELETE_ANNOUNCEMENT', 'Announcement', id)
    return NextResponse.json({ ok: true })
  } catch (e) { return NextResponse.json({ error: 'Failed' }, { status: 500 }) }
}