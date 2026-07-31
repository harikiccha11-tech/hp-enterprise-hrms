import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, audit } from '@/lib/auth'

export const runtime = 'nodejs'

// Assign a client to an employee (after hiring)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const cu = await getCurrentUser()
  if (!cu) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!['OWNER', 'SUPER_ADMIN', 'HR_MANAGER'].includes(cu.user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  try {
    const { id } = await params
    const { clientId, projectId, role } = await req.json()
    const emp = await db.employee.findUnique({ where: { id } })
    if (!emp) return NextResponse.json({ error: 'Employee not found' }, { status: 404 })

    await db.employee.update({ where: { id }, data: { assignedClientId: clientId || null } })

    // Also assign to project if provided
    if (projectId) {
      const existing = await db.projectMember.findUnique({ where: { projectId_employeeId: { projectId, employeeId: id } } })
      if (!existing) {
        await db.projectMember.create({ data: { projectId, employeeId: id, role: role || 'Assigned' } })
      }
    }

    const client = clientId ? await db.client.findUnique({ where: { id: clientId } }) : null
    await audit(cu.user.id, 'ASSIGN_CLIENT', 'Employee', id, `Assigned client ${client?.clientName || 'none'} to ${emp.fullName}`)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
