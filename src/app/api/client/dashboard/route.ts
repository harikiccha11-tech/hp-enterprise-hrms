import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const cu = await getCurrentUser()
  if (!cu) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (cu.user.role !== 'CLIENT') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const clientId = cu.user.clientId
  if (!clientId) return NextResponse.json({ error: 'No client profile linked' }, { status: 400 })

  const [client, projects, workOrders, invoices, announcements] = await Promise.all([
    db.client.findUnique({ where: { id: clientId } }),
    db.project.findMany({
      where: { clientId },
      include: {
        members: {
          include: {
            employee: {
              select: { id: true, fullName: true, designation: true, department: true, mobile: true, email: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    db.workOrder.findMany({
      where: { clientId },
      include: { project: true },
      orderBy: { createdAt: 'desc' },
    }),
    db.invoice.findMany({
      where: { clientId },
      include: { workOrder: true },
      orderBy: { issueDate: 'desc' },
    }),
    db.announcement.findMany({
      where: { audience: { in: ['ALL', 'ADMIN'] } },
      orderBy: { postedAt: 'desc' },
      take: 20,
    }),
  ])

  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  const activeProjects = projects.filter(p => p.status === 'ACTIVE')
  const totalWorkOrderValue = workOrders.reduce((sum, wo) => sum + wo.value, 0)
  const totalInvoiceAmount = invoices.reduce((sum, inv) => sum + inv.total, 0)
  const paidInvoiceAmount = invoices.filter(inv => inv.status === 'PAID').reduce((sum, inv) => sum + inv.total, 0)

  return NextResponse.json({
    client,
    projects,
    workOrders,
    invoices,
    announcements,
    stats: {
      totalProjects: projects.length,
      activeProjects: activeProjects.length,
      totalWorkOrderValue,
      totalInvoiceAmount,
      paidInvoiceAmount,
    },
  })
}