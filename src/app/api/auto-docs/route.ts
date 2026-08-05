import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole, audit } from '@/lib/guards'
import { generateDocument } from '@/lib/docservice'
import { DOCUMENT_TYPES } from '@/lib/constants'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// POST /api/auto-docs?employeeId=xxx
// Auto-generates ALL document types for an employee (except salary_slip which needs payroll data)
export async function POST(req: NextRequest) {
  const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN', 'HR_MANAGER')
  if (error) return error
  try {
    const employeeId = new URL(req.url).searchParams.get('employeeId')
    if (!employeeId) return NextResponse.json({ error: 'Employee ID required' }, { status: 400 })

    const emp = await db.employee.findUnique({ where: { id: employeeId } })
    if (!emp) return NextResponse.json({ error: 'Employee not found' }, { status: 404 })

    // Types that need payroll data (skip)
    const skipTypes = new Set(['salary_slip'])
    const results: { type: string; ok: boolean; error?: string }[] = []

    for (const docType of DOCUMENT_TYPES) {
      if (skipTypes.has(docType)) continue
      try {
        await generateDocument(employeeId, docType, cu!.user.id)
        results.push({ type: docType, ok: true })
      } catch (e) {
        console.error('[auto-docs] failed to generate', docType, e)
        results.push({ type: docType, ok: false, error: 'Failed' })
      }
    }

    await audit(cu!.user.id, 'AUTO_GENERATE_DOCS', 'Employee', employeeId, `Generated ${results.filter(r => r.ok).length}/${results.length} docs for ${emp.fullName}`)
    return NextResponse.json({ ok: true, results, employeeName: emp.fullName })
  } catch (e) {
    console.error('auto-docs error', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
