import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole, audit } from '@/lib/guards'
import { hashPassword } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const { error } = await requireRole('OWNER', 'SUPER_ADMIN', 'HR_MANAGER')
  if (error) return error
  const clients = await db.client.findMany({ include: { _count: { select: { projects: true, invoices: true } } }, orderBy: { createdAt: 'desc' } })
  return NextResponse.json({ clients })
}

export async function POST(req: NextRequest) {
  const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN', 'HR_MANAGER')
  if (error) return error
  try {
    const body = await req.json()
    const client = await db.client.create({ data: {
      clientName: body.clientName, companyName: body.companyName || null, gst: body.gst || null,
      email: body.email || null, phone: body.phone || null, address: body.address || null,
      contactsJson: body.contacts ? JSON.stringify(body.contacts) : null,
    } })
    await audit(cu!.user.id, 'CREATE_CLIENT', 'Client', client.id, client.clientName)

    // Auto-create a CLIENT user account linked to this client
    let generatedUsername = ''
    let generatedPassword = 'Client@123'
    try {
      // Generate username from client name: lowercase, spaces→dots, append '.client'
      const base = body.clientName.toLowerCase().replace(/[^a-z0-9]+/g, '.').replace(/\.+$/, '') + '.client'

      // Check for username collision and add number suffix if needed
      let username = base
      let suffix = 0
      while (await db.user.findUnique({ where: { username } })) {
        suffix++
        username = `${base}${suffix}`
      }
      generatedUsername = username

      // Use client email or generate one
      const email = body.email?.trim()
        ? body.email.trim()
        : `${base.replace(/\.client$/, '')}@client.local`

      await db.user.create({
        data: {
          username,
          email,
          passwordHash: await hashPassword(generatedPassword),
          role: 'CLIENT',
          clientId: client.id,
          mustResetPassword: true,
        },
      })
    } catch (userErr) {
      console.error('Auto-create client user failed:', userErr)
      // Don't fail the client creation if user creation fails
    }

    return NextResponse.json({ ok: true, client, credentials: { username: generatedUsername, password: generatedPassword } })
  } catch (e) { return NextResponse.json({ error: 'Failed' }, { status: 500 }) }
}

export async function PATCH(req: NextRequest) {
  const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN', 'HR_MANAGER')
  if (error) return error
  try {
    const { id, ...data } = await req.json()
    if (data.contacts) data.contactsJson = JSON.stringify(data.contacts); delete data.contacts
    const client = await db.client.update({ where: { id }, data })
    await audit(cu!.user.id, 'UPDATE_CLIENT', 'Client', id)
    return NextResponse.json({ ok: true, client })
  } catch (e) { return NextResponse.json({ error: 'Failed' }, { status: 500 }) }
}

export async function DELETE(req: NextRequest) {
  const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN')
  if (error) return error
  try {
    const { id } = await req.json()
    await db.client.delete({ where: { id } })
    await audit(cu!.user.id, 'DELETE_CLIENT', 'Client', id)
    return NextResponse.json({ ok: true })
  } catch (e) { return NextResponse.json({ error: 'Failed' }, { status: 500 }) }
}
