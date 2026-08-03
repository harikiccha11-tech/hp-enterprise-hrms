import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, hashPassword, audit } from '@/lib/auth'

export const runtime = 'nodejs'

// Reset password (Owner only)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const cu = await getCurrentUser()
  if (!cu) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['OWNER', 'SUPER_ADMIN'].includes(cu.user.role)) return NextResponse.json({ error: 'Only Owner or Super Admin can manage users' }, { status: 403 })
  try {
    const { id } = await params
    const body = await req.json()
    const target = await db.user.findUnique({ where: { id } })
    if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    if (target.role === 'OWNER') return NextResponse.json({ error: 'Cannot modify another Owner' }, { status: 403 })

    if (body.action === 'reset_password') {
      const newPass = body.password
      if (!newPass || newPass.length < 8) return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
      await db.user.update({ where: { id }, data: { passwordHash: await hashPassword(newPass), mustResetPassword: false, locked: false } })
      await audit(cu.user.id, 'RESET_USER_PASSWORD', 'User', id, `Reset password for ${target.username}`)
      return NextResponse.json({ ok: true })
    }
    if (body.action === 'lock') {
      await db.user.update({ where: { id }, data: { locked: true } })
      await audit(cu.user.id, 'LOCK_USER', 'User', id, `Locked ${target.username}`)
      return NextResponse.json({ ok: true })
    }
    if (body.action === 'unlock') {
      await db.user.update({ where: { id }, data: { locked: false } })
      await audit(cu.user.id, 'UNLOCK_USER', 'User', id, `Unlocked ${target.username}`)
      return NextResponse.json({ ok: true })
    }
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (e) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}

// Delete user (Owner only, cannot delete OWNER)
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const cu = await getCurrentUser()
  if (!cu) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['OWNER', 'SUPER_ADMIN'].includes(cu.user.role)) return NextResponse.json({ error: 'Only Owner or Super Admin can delete users' }, { status: 403 })
  try {
    const { id } = await params
    const target = await db.user.findUnique({ where: { id } })
    if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    if (target.role === 'OWNER') return NextResponse.json({ error: 'Cannot delete an Owner' }, { status: 403 })
    if (id === cu.user.id) return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 403 })
    await db.user.delete({ where: { id } })
    await audit(cu.user.id, 'DELETE_USER', 'User', id, `Deleted ${target.username}`)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
