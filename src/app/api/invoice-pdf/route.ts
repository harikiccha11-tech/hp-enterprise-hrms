import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/guards'
import { InvoiceDoc } from '@/lib/pdfgen'
import { pdf } from '@react-pdf/renderer'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN', 'HR_MANAGER', 'CLIENT')
  if (error) return error
  try {
    const invoiceId = new URL(req.url).searchParams.get('id')
    if (!invoiceId) return NextResponse.json({ error: 'Invoice ID required' }, { status: 400 })

    const inv = await db.invoice.findUnique({
      where: { id: invoiceId },
      include: { client: true, workOrder: { select: { title: true } } },
    })
    if (!inv) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })

    // Scope CLIENT role to their own invoices only
    if (cu!.user.role === 'CLIENT' && inv.clientId !== cu!.user.clientId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const doc = InvoiceDoc({
      invoiceNumber: inv.invoiceNumber,
      issueDate: inv.issueDate?.toLocaleDateString('en-IN') || '',
      dueDate: inv.dueDate?.toLocaleDateString('en-IN') || null,
      clientName: inv.client?.clientName || '',
      companyName: inv.client?.companyName || '',
      clientAddress: inv.client?.address || '',
      clientGst: inv.client?.gst || '',
      workOrderTitle: inv.workOrder?.title || null,
      amount: inv.amount,
      tax: inv.tax,
      total: inv.total,
      status: inv.status,
    })

    const bytes = await pdf(doc).toBuffer()
    return new NextResponse(bytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${inv.invoiceNumber}.pdf"`,
      },
    })
  } catch (e) {
    console.error('invoice pdf error', e)
    return NextResponse.json({ error: 'Failed to generate invoice PDF' }, { status: 500 })
  }
}
