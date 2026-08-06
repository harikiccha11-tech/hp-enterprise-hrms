import { NextResponse } from 'next/server'
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

    // Get all project IDs for this client
    const projects = await db.project.findMany({
      where: { clientId },
      select: { id: true, projectName: true },
    })
    const projectIds = projects.map((p) => p.id)
    const projectMap = Object.fromEntries(projects.map((p) => [p.id, p.projectName]))

    // Get work orders for this client
    const workOrders = await db.workOrder.findMany({
      where: { clientId },
      select: { id: true, woNumber: true, title: true },
    })
    const woMap = Object.fromEntries(workOrders.map((w) => [w.id, { woNumber: w.woNumber, title: w.title }]))

    // Get invoices for this client
    const invoices = await db.invoice.findMany({
      where: { clientId },
      select: { id: true, invoiceNumber: true, total: true, status: true, issueDate: true },
      orderBy: { issueDate: 'desc' },
    })

    // Get announcements
    const announcements = await db.announcement.findMany({
      where: { audience: 'ALL' },
      orderBy: { postedAt: 'desc' },
      take: 20,
    })

    // Build a document list from available data
    const documents: { id: string; name: string; type: string; ref: string; date: string }[] = []

    for (const inv of invoices) {
      documents.push({
        id: `inv-${inv.id}`,
        name: `Invoice ${inv.invoiceNumber}`,
        type: 'Invoice',
        ref: inv.invoiceNumber,
        date: inv.issueDate ? inv.issueDate.toISOString().slice(0, 10) : '',
      })
    }

    for (const wo of workOrders) {
      documents.push({
        id: `wo-${wo.id}`,
        name: `Work Order ${wo.woNumber} — ${wo.title}`,
        type: 'Work Order',
        ref: wo.woNumber,
        date: '',
      })
    }

    for (const a of announcements) {
      documents.push({
        id: `ann-${a.id}`,
        name: a.title,
        type: 'Announcement',
        ref: '',
        date: a.postedAt.toISOString().slice(0, 10),
      })
    }

    return NextResponse.json({
      projects,
      documents: documents.sort((a, b) => b.date.localeCompare(a.date)),
    })
  } catch {
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}
