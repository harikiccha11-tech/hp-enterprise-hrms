import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Generate a human-readable ticket ID like TKT-ABC123 */
function generateTicketId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let suffix = ''
  for (let i = 0; i < 6; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)]
  }
  return `TKT-${suffix}`
}

/** GET /api/employee/support — Return support tickets for the current user */
export async function GET() {
  try {
    const cu = await getCurrentUser()
    if (!cu) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const tickets = await db.supportTicket.findMany({
      where: { userId: cu.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return NextResponse.json({ tickets })
  } catch (e) {
    console.error('[SupportTicket GET]', e)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}

/** POST /api/employee/support — Create a new support ticket */
export async function POST(req: NextRequest) {
  try {
    const cu = await getCurrentUser()
    if (!cu) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { subject, category, priority, description } = body || {}

    if (!subject?.trim() || !description?.trim()) {
      return NextResponse.json(
        { error: 'Subject and description are required' },
        { status: 400 },
      )
    }

    // Generate a unique ticket ID
    let ticketId = generateTicketId()
    // Ensure uniqueness (very unlikely collision, but check anyway)
    const existing = await db.supportTicket.findUnique({ where: { ticketId } })
    if (existing) ticketId = generateTicketId() + 'X'

    const ticket = await db.supportTicket.create({
      data: {
        ticketId,
        accountId: cu.user.accountId || null,
        userId: cu.user.id,
        employeeId: cu.user.employee?.id || null,
        subject: subject.trim(),
        category: category || 'General',
        priority: priority || 'Medium',
        description: description.trim(),
        status: 'Open',
      },
    })

    return NextResponse.json({ success: true, ticket }, { status: 201 })
  } catch (e) {
    console.error('[SupportTicket POST]', e)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}
