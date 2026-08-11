import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const cu = await getCurrentUser()
    if (!cu) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (cu.user.role !== 'CLIENT') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const accountId = cu.user.accountId
    if (!accountId) return NextResponse.json({ error: 'No account linked' }, { status: 400 })

    const { searchParams } = request.nextUrl
    const statusFilter = searchParams.get('status')?.trim() || ''

    const where: Record<string, unknown> = { accountId }

    if (statusFilter) {
      where.status = statusFilter
    }

    const [records, account] = await Promise.all([
      db.invoice.findMany({
        where,
        include: {
          client: {
            select: {
              clientName: true,
              companyName: true,
            },
          },
        },
        orderBy: { issueDate: 'desc' },
        take: 500,
      }),
      db.account.findUnique({
        where: { id: accountId },
        select: {
          expiresAt: true,
          organizationName: true,
          status: true,
        },
      }),
    ])

    // Derive current period end from latest invoice billingPeriodEnd or account expiresAt
    const latestInvoice = records[0]
    const currentPeriodEnd =
      latestInvoice?.billingPeriodEnd?.toISOString() ||
      account?.expiresAt?.toISOString() ||
      null

    return NextResponse.json({
      invoices: records.map((inv) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        clientName: inv.client?.clientName || inv.client?.companyName || null,
        amount: inv.amount,
        tax: inv.tax,
        gstAmount: inv.gstAmount,
        total: inv.total || inv.finalAmount,
        status: inv.status,
        issueDate: inv.issueDate ? inv.issueDate.toISOString().slice(0, 10) : null,
        dueDate: inv.dueDate || inv.paymentDueDate
          ? (inv.dueDate || inv.paymentDueDate)!.toISOString().slice(0, 10)
          : null,
        paymentDate: inv.paymentDate ? inv.paymentDate.toISOString().slice(0, 10) : null,
        createdAt: inv.createdAt.toISOString(),
      })),
      currentPeriodEnd,
      accountStatus: account?.status || null,
    })
  } catch {
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}
