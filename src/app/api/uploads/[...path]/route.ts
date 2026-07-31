import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { readFile } from 'fs/promises'
import path from 'path'

export const runtime = 'nodejs'

export async function GET(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const cu = await getCurrentUser()
  if (!cu) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { path: segs } = await params
  // expected: employees/{employeeId}/{file}
  if (segs[0] !== 'employees') return NextResponse.json({ error: 'Invalid' }, { status: 400 })
  const employeeId = segs[1]
  if (!employeeId) return NextResponse.json({ error: 'Invalid' }, { status: 400 })

  // find the document record by path
  const relPath = segs.join('/')
  const doc = await db.employeeDocument.findFirst({ where: { filePath: relPath }, include: { employee: { include: { user: true } } } })
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (cu.user.role === 'EMPLOYEE' && doc.employee.userId !== cu.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const abs = path.join(process.cwd(), 'upload', relPath)
  try {
    const buf = await readFile(abs)
    return new NextResponse(buf, {
      headers: {
        'Content-Type': doc.mimeType || 'application/octet-stream',
        'Content-Disposition': `inline; filename="${doc.fileName}"`,
      },
    })
  } catch {
    return NextResponse.json({ error: 'File not found on disk' }, { status: 404 })
  }
}
