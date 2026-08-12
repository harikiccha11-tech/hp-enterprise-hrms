import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole, audit } from '@/lib/guards'
import { getCurrentUser } from '@/lib/auth'
import { notify } from '@/lib/notify'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const cu = await getCurrentUser()
    if (!cu) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!['OWNER', 'SUPER_ADMIN', 'HR_MANAGER', 'EMPLOYEE'].includes(cu.user.role))
      return NextResponse.json({ error: 'Forbidden — insufficient permissions' }, { status: 403 })
    const where: any = cu.user.role === 'EMPLOYEE' ? { audience: { in: ['ALL', 'EMPLOYEE'] }, accountId: cu.user.accountId } : { accountId: cu.user.accountId }
    const announcements = await db.announcement.findMany({ where, orderBy: { postedAt: 'desc' } })
    return NextResponse.json({ announcements })
  } catch (e) {
    console.error('announcements GET error', e)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN', 'HR_MANAGER')
  if (error) return error
  try {
    const { title, body, audience } = await req.json()
    const ann = await db.announcement.create({ data: { title, body, audience: audience || 'ALL', postedBy: cu!.user.id, accountId: cu!.user.accountId } })
    // notify all relevant users within the same account
    const users = audience === 'ADMIN'
      ? await db.user.findMany({ where: { role: { in: ['OWNER', 'SUPER_ADMIN', 'HR_MANAGER'] }, accountId: cu!.user.accountId } })
      : await db.user.findMany({ where: { role: audience === 'EMPLOYEE' ? 'EMPLOYEE' : { in: ['OWNER', 'SUPER_ADMIN', 'HR_MANAGER', 'EMPLOYEE'] }, accountId: cu!.user.accountId } })
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
  const aid = cu!.user.accountId
  try {
    const { id, ...data } = await req.json()
    const existing = await db.announcement.findUnique({ where: { id } })
    if (!existing || existing.accountId !== aid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const ann = await db.announcement.update({ where: { id }, data })
    await audit(cu!.user.id, 'UPDATE_ANNOUNCEMENT', 'Announcement', id, data.title || '')
    return NextResponse.json({ ok: true, announcement: ann })
  } catch (e) { return NextResponse.json({ error: 'Failed' }, { status: 500 }) }
}

export async function DELETE(req: NextRequest) {
  const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN')
  if (error) return error
  const aid = cu!.user.accountId
  try {
    const { id } = await req.json()
    const existing = await db.announcement.findUnique({ where: { id } })
    if (!existing || existing.accountId !== aid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    await db.announcement.delete({ where: { id } })
    await audit(cu!.user.id, 'DELETE_ANNOUNCEMENT', 'Announcement', id)
    return NextResponse.json({ ok: true })
  } catch (e) { return NextResponse.json({ error: 'Failed' }, { status: 500 }) }
}