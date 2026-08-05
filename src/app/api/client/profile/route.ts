import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const cu = await getCurrentUser()
    if (!cu) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (cu.user.role !== 'CLIENT') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const clientId = cu.user.clientId
    if (!clientId) return NextResponse.json({ error: 'No client profile linked' }, { status: 400 })

    const client = await db.client.findUnique({ where: { id: clientId } })
    if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

    return NextResponse.json({
      id: client.id,
      clientName: client.clientName,
      companyName: client.companyName,
      email: client.email,
      phone: client.phone,
      address: client.address,
      gst: client.gst,
      createdAt: client.createdAt.toISOString(),
    })
  } catch {
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const cu = await getCurrentUser()
    if (!cu) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (cu.user.role !== 'CLIENT') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const clientId = cu.user.clientId
    if (!clientId) return NextResponse.json({ error: 'No client profile linked' }, { status: 400 })

    const body = await req.json()
    const { clientName, companyName, email, phone, address, gst } = body

    const updated = await db.client.update({
      where: { id: clientId },
      data: {
        ...(clientName !== undefined && { clientName }),
        ...(companyName !== undefined && { companyName }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(address !== undefined && { address }),
        ...(gst !== undefined && { gst }),
      },
    })

    return NextResponse.json({
      id: updated.id,
      clientName: updated.clientName,
      companyName: updated.companyName,
      email: updated.email,
      phone: updated.phone,
      address: updated.address,
      gst: updated.gst,
    })
  } catch {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}
