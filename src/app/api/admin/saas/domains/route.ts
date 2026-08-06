import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole, audit } from '@/lib/guards'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { error } = await requireRole('OWNER', 'SUPER_ADMIN')
    if (error) return error

    const domains = await db.customDomain.findMany({ orderBy: { createdAt: 'desc' } })
    return NextResponse.json({
      domains: domains.map((d) => ({
        id: d.id,
        domain: d.domain,
        ssl: d.sslStatus,
        verified: d.verified,
        primary: d.primary,
        accountId: d.accountId,
      })),
    })
  } catch (e) {
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN')
    if (error) return error

    const { domain, accountId } = await req.json()
    if (!domain) return NextResponse.json({ error: 'Domain is required' }, { status: 400 })

    // Check if domain already exists
    const existing = await db.customDomain.findUnique({ where: { domain } })
    if (existing) return NextResponse.json({ error: 'Domain already exists' }, { status: 409 })

    const newDomain = await db.customDomain.create({
      data: { domain, sslStatus: 'Pending', verified: false, primary: false, accountId },
    })

    await audit(cu!.user.id, 'CREATE', 'CustomDomain', newDomain.id, `Added domain: ${domain}`)
    return NextResponse.json({ ok: true, domain: newDomain }, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN')
    if (error) return error

    const body = await req.json()
    const { id, action } = body

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    const existing = await db.customDomain.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Domain not found' }, { status: 404 })

    if (action === 'verify') {
      await db.customDomain.update({ where: { id }, data: { verified: true, sslStatus: 'Active' } })
      await audit(cu!.user.id, 'UPDATE', 'CustomDomain', id, `Verified domain: ${existing.domain}`)
    } else if (action === 'set_primary') {
      // Unset all other primaries first
      await db.customDomain.updateMany({ where: { primary: true }, data: { primary: false } })
      await db.customDomain.update({ where: { id }, data: { primary: true } })
      await audit(cu!.user.id, 'UPDATE', 'CustomDomain', id, `Set primary: ${existing.domain}`)
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN')
    if (error) return error

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    const domain = await db.customDomain.findUnique({ where: { id } })
    if (!domain) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    await db.customDomain.delete({ where: { id } })
    await audit(cu!.user.id, 'DELETE', 'CustomDomain', id, `Removed domain: ${domain.domain}`)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}
