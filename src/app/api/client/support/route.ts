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

    // Use the Notification model to store support tickets tagged with SUPPORT_TICKET type
    const tickets = await db.notification.findMany({
      where: {
        userId: cu.user.id,
        type: 'SUPPORT_TICKET',
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ tickets: tickets.map((t) => ({ id: t.id, title: t.title, message: t.message, status: t.read ? 'RESOLVED' : 'OPEN', createdAt: t.createdAt.toISOString() })) })
  } catch {
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const cu = await getCurrentUser()
    if (!cu) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (cu.user.role !== 'CLIENT') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const clientId = cu.user.clientId
    if (!clientId) return NextResponse.json({ error: 'No client profile linked' }, { status: 400 })

    const body = await req.json()
    const { subject, description } = body
    if (!subject?.trim()) return NextResponse.json({ error: 'Subject is required' }, { status: 400 })
    if (!description?.trim()) return NextResponse.json({ error: 'Description is required' }, { status: 400 })

    const ticket = await db.notification.create({
      data: {
        userId: cu.user.id,
        title: subject.trim(),
        message: description.trim(),
        type: 'SUPPORT_TICKET',
        read: false,
      },
    })

    return NextResponse.json({ id: ticket.id, title: ticket.title, message: ticket.message, status: 'OPEN', createdAt: ticket.createdAt.toISOString() })
  } catch {
    return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 })
  }
}
