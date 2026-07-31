import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { readFile } from 'fs/promises'
import path from 'path'

export const runtime = 'nodejs'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const cu = await getCurrentUser()
  if (!cu) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const doc = await db.generatedDocument.findUnique({ where: { id }, include: { employee: { include: { user: true } } } })
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (cu.user.role === 'EMPLOYEE' && doc.employee.userId !== cu.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const abs = path.join(process.cwd(), 'upload', doc.filePath)
  try {
    const buf = await readFile(abs)
    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${doc.docType}.pdf"`,
      },
    })
  } catch {
    return NextResponse.json({ error: 'File not found on disk' }, { status: 404 })
  }
}
