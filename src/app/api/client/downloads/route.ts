import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { resolveClientId, getClientEmployeeIds } from '@/lib/client-scope'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const cu = await getCurrentUser()
    if (!cu) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (cu.user.role !== 'CLIENT') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const accountId = cu.user.accountId
    if (!accountId) return NextResponse.json({ error: 'No account linked' }, { status: 400 })

    const clientId = await resolveClientId(cu.user.clientId, accountId)
    if (!clientId) return NextResponse.json({ documents: [] })

    const clientEmpIds = await getClientEmployeeIds(db, clientId, accountId)

    // Fetch generated documents that are client-visible, scoped to client-assigned employees
    const generatedDocs = clientEmpIds.length > 0
      ? await db.generatedDocument.findMany({
          where: {
            accountId,
            clientVisible: true,
            employeeId: { in: clientEmpIds },
          },
          select: {
            id: true,
            title: true,
            documentType: true,
            fileFormat: true,
            storagePath: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 200,
        })
      : []

    // Fetch employee documents that are client-visible, scoped to client-assigned employees
    const empDocs = clientEmpIds.length > 0
      ? await db.employeeDocument.findMany({
          where: {
            accountId,
            clientVisible: true,
            employeeId: { in: clientEmpIds },
          },
          select: {
            id: true,
            fileName: true,
            documentType: true,
            mimeType: true,
            filePath: true,
            uploadedAt: true,
            employee: {
              select: { fullName: true, employeeCode: true },
            },
          },
          orderBy: { uploadedAt: 'desc' },
          take: 200,
        })
      : []

    return NextResponse.json({
      documents: [
        ...generatedDocs.map((doc) => ({
          id: doc.id,
          fileName: doc.title,
          fileType: doc.fileFormat,
          fileSize: null,
          uploadedAt: doc.createdAt.toISOString(),
          category: doc.documentType,
          source: 'generated',
          storagePath: doc.storagePath,
        })),
        ...empDocs.map((doc) => ({
          id: doc.id,
          fileName: doc.fileName,
          fileType: doc.mimeType || 'unknown',
          fileSize: null,
          uploadedAt: doc.uploadedAt.toISOString(),
          category: doc.documentType,
          source: 'employee',
          employeeName: doc.employee.fullName,
          employeeCode: doc.employee.employeeCode,
          filePath: doc.filePath,
        })),
      ].sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt)),
    })
  } catch {
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}
