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

  const [client, projects, workOrders, invoices, announcements, unreadNotifications] = await Promise.all([
    db.client.findUnique({ where: { id: clientId } }),
    db.project.findMany({
      where: { clientId },
      include: { members: true },
      orderBy: { createdAt: 'desc' },
    }),
    db.workOrder.findMany({
      where: { clientId },
      include: { project: { select: { projectName: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    db.invoice.findMany({
      where: { clientId },
      include: { workOrder: { select: { title: true } } },
      orderBy: { issueDate: 'desc' },
    }),
    db.announcement.findMany({
      where: { audience: 'ALL' },
      orderBy: { postedAt: 'desc' },
      take: 20,
    }),
    db.notification.count({
      where: { userId: cu.user.id, read: false },
    }),
  ])

  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 })

  const activeProjects = projects.filter((p) => p.status === 'ACTIVE')
  const workOrderValue = workOrders.reduce((sum, wo) => sum + wo.value, 0)
  const invoiceTotal = invoices.reduce((sum, inv) => sum + inv.total, 0)
  const paidAmount = invoices
    .filter((inv) => inv.status === 'PAID')
    .reduce((sum, inv) => sum + inv.total, 0)

  return NextResponse.json({
    client: {
      id: client.id,
      clientName: client.clientName,
      companyName: client.companyName,
      email: client.email,
      phone: client.phone,
      address: client.address,
      gst: client.gst,
    },
    stats: {
      totalProjects: projects.length,
      activeProjects: activeProjects.length,
      workOrderValue,
      invoiceTotal,
      paidAmount,
    },
    projects: projects.map((p) => ({
      id: p.id,
      projectName: p.projectName,
      site: p.site,
      startDate: p.startDate ? p.startDate.toISOString().slice(0, 10) : null,
      endDate: p.endDate ? p.endDate.toISOString().slice(0, 10) : null,
      status: p.status,
      description: p.description,
      memberCount: p.members.length,
    })),
    workOrders: workOrders.map((wo) => ({
      id: wo.id,
      woNumber: wo.woNumber,
      title: wo.title,
      value: wo.value,
      startDate: wo.startDate ? wo.startDate.toISOString().slice(0, 10) : null,
      endDate: wo.endDate ? wo.endDate.toISOString().slice(0, 10) : null,
      status: wo.status,
      projectName: wo.project?.projectName ?? null,
    })),
    invoices: invoices.map((inv) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      amount: inv.amount,
      tax: inv.tax,
      total: inv.total,
      status: inv.status,
      issueDate: inv.issueDate.toISOString().slice(0, 10),
      dueDate: inv.dueDate ? inv.dueDate.toISOString().slice(0, 10) : null,
      workOrderTitle: inv.workOrder?.title ?? null,
    })),
    announcements: announcements.map((a) => ({
      id: a.id,
      title: a.title,
      message: a.body,
      createdAt: a.postedAt.toISOString(),
    })),
    unreadNotifications,
  })
}
