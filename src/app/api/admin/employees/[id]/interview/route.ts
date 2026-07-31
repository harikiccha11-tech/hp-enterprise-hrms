import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, audit } from '@/lib/auth'

export const runtime = 'nodejs'

// Set interview status / schedule interview
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const cu = await getCurrentUser()
  if (!cu) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['OWNER', 'SUPER_ADMIN', 'HR_MANAGER'].includes(cu.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  try {
    const { id } = await params
    const { status, interviewDate, notes } = await req.json()
    // status: SCHEDULED | COMPLETED | PASSED | FAILED | NONE
    const data: any = { interviewStatus: status }
    if (interviewDate) data.interviewDate = new Date(interviewDate)
    if (notes !== undefined) data.interviewNotes = notes
    if (status === 'NONE') { data.interviewStatus = null; data.interviewDate = null; data.interviewNotes = null }

    const emp = await db.employee.update({ where: { id }, data })
    await audit(cu.user.id, 'INTERVIEW_' + status, 'Employee', id, `Interview ${status} for ${emp.fullName}`)
    return NextResponse.json({ ok: true, employee: emp })
  } catch (e) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
