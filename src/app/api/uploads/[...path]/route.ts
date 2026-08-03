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
  const relPath = segs.join('/')

  // Attendance selfies: attendance/{employeeId}/{file}
  if (segs[0] === 'attendance') {
    const employeeId = segs[1]
    if (!employeeId) return NextResponse.json({ error: 'Invalid' }, { status: 400 })
    // Allow employee to see their own, admins/HR see all, clients see their assigned employees
    if (cu.user.role === 'EMPLOYEE' && cu.user.employee?.id !== employeeId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const abs = path.join(process.cwd(), 'upload', relPath)
    try {
      const buf = await readFile(abs)
      const ext = relPath.split('.').pop()?.toLowerCase() || 'jpg'
      const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg'
      return new NextResponse(buf, {
        headers: { 'Content-Type': mime, 'Cache-Control': 'public, max-age=86400' },
      })
    } catch {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }
  }

  // Employee documents: employees/{employeeId}/{file}
  if (segs[0] !== 'employees') return NextResponse.json({ error: 'Invalid' }, { status: 400 })
  const employeeId = segs[1]
  if (!employeeId) return NextResponse.json({ error: 'Invalid' }, { status: 400 })

  // find the document record by path
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
