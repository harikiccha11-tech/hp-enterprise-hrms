import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, audit } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const cu = await getCurrentUser()
  if (!cu) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const employeeId = cu.user.employee?.id
  if (!employeeId) return NextResponse.json({ error: 'No employee profile' }, { status: 400 })
  const emp = await db.employee.findUnique({ where: { id: employeeId }, include: { documents: true, leaveBalance: true, projectAssignments: { include: { project: { include: { client: true } } } } } })
  return NextResponse.json({ employee: emp })
}

export async function PATCH(req: NextRequest) {
  const cu = await getCurrentUser()
  if (!cu) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const employeeId = cu.user.employee?.id
  if (!employeeId) return NextResponse.json({ error: 'No employee profile' }, { status: 400 })
  try {
    const body = await req.json()
    // employees can only edit permitted fields
    const allowed: any = {}
    for (const k of ['mobile','alternateMobile','address','emergencyContact','bloodGroup','bankHolder','bankName','bankBranch','bankAccount','bankIfsc']) {
      if (k in body) allowed[k] = body[k]
    }
    const emp = await db.employee.update({ where: { id: employeeId }, data: allowed })
    await audit(cu.user.id, 'UPDATE_PROFILE', 'Employee', employeeId, JSON.stringify(allowed).slice(0, 300))
    return NextResponse.json({ ok: true, employee: emp })
  } catch (e) { return NextResponse.json({ error: 'Failed' }, { status: 500 }) }
}
