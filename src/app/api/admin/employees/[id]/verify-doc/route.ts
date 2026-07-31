import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, audit } from '@/lib/auth'

export const runtime = 'nodejs'

// Verify/unverify a single uploaded document
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const cu = await getCurrentUser()
  if (!cu) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['OWNER', 'SUPER_ADMIN', 'HR_MANAGER'].includes(cu.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  try {
    const { id } = await params
    const { docId, verified, note } = await req.json()
    const doc = await db.employeeDocument.findUnique({ where: { id: docId } })
    if (!doc || doc.employeeId !== id) return NextResponse.json({ error: 'Document not found' }, { status: 404 })

    const updated = await db.employeeDocument.update({
      where: { id: docId },
      data: {
        verified,
        verifiedBy: cu.user.id,
        verifiedAt: new Date(),
        verifyNote: note || null,
      },
    })
    await audit(cu.user.id, verified ? 'VERIFY_DOC' : 'UNVERIFY_DOC', 'EmployeeDocument', docId, `${verified ? 'Verified' : 'Unverified'} ${doc.documentType} for employee ${id}`)

    // Update employee documentsVerified flag — true if ALL docs are verified
    const allDocs = await db.employeeDocument.findMany({ where: { employeeId: id } })
    const allVerified = allDocs.length > 0 && allDocs.every((d) => d.verified)
    await db.employee.update({ where: { id }, data: { documentsVerified: allVerified } })

    return NextResponse.json({ ok: true, doc: updated, allVerified })
  } catch (e) {
    console.error('verify doc error', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
