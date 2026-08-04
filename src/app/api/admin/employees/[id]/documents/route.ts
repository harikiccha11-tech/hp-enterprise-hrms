import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole, audit } from '@/lib/guards'
import { generateDocument } from '@/lib/docservice'
import { notify } from '@/lib/notify'

export const runtime = 'nodejs'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN', 'HR_MANAGER', 'EMPLOYEE')
  if (error) return error
  const { id } = await params

  // If EMPLOYEE role, verify they access their own documents
  if (cu!.user.role === 'EMPLOYEE') {
    const emp = await db.employee.findUnique({ where: { id }, select: { userId: true } })
    if (!emp || emp.userId !== cu!.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const [generated, uploaded] = await Promise.all([
    db.generatedDocument.findMany({ where: { employeeId: id }, orderBy: { generatedAt: 'desc' } }),
    db.employeeDocument.findMany({ where: { employeeId: id }, orderBy: { uploadedAt: 'desc' } }),
  ])
  return NextResponse.json({ docs: generated, uploaded })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN', 'HR_MANAGER')
  if (error) return error
  try {
    const { id } = await params
    const { docType, extra } = await req.json()
    const doc = await generateDocument(id, docType, cu!.user.id, extra)
    // notify employee
    const emp = await db.employee.findUnique({ where: { id }, include: { user: true } })
    if (emp?.user) {
      await notify(
        emp.user.id,
        'New Document Generated',
        `Your ${doc.title} is now available for download.`,
        'DOCUMENT',
        '/employee?tab=documents',
      )
    }
    await audit(cu!.user.id, 'GENERATE_DOCUMENT', 'GeneratedDocument', doc.id, `${docType} for ${emp?.fullName}`)
    return NextResponse.json({ ok: true, doc })
  } catch (e) {
    console.error('generate doc error', e)
    return NextResponse.json({ error: 'Document generation failed' }, { status: 500 })
  }
}
