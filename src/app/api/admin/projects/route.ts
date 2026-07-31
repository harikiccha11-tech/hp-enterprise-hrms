import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole, audit } from '@/lib/guards'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const { error } = await requireRole('OWNER', 'SUPER_ADMIN', 'HR_MANAGER')
  if (error) return error
  const projects = await db.project.findMany({
    include: { client: true, _count: { select: { members: true, workOrders: true } }, members: { include: { employee: { select: { id: true, fullName: true, employeeCode: true, designation: true } } } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ projects })
}

export async function POST(req: NextRequest) {
  const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN', 'HR_MANAGER')
  if (error) return error
  try {
    const body = await req.json()
    const project = await db.project.create({ data: {
      projectName: body.projectName, clientId: body.clientId, site: body.site || null,
      startDate: body.startDate ? new Date(body.startDate) : null, endDate: body.endDate ? new Date(body.endDate) : null,
      status: body.status || 'ACTIVE', description: body.description || null,
    } })
    if (Array.isArray(body.members)) {
      for (const m of body.members) {
        await db.projectMember.create({ data: { projectId: project.id, employeeId: m.employeeId, role: m.role || null } })
      }
    }
    await audit(cu!.user.id, 'CREATE_PROJECT', 'Project', project.id, project.projectName)
    return NextResponse.json({ ok: true, project })
  } catch (e) { return NextResponse.json({ error: 'Failed' }, { status: 500 }) }
}

export async function PATCH(req: NextRequest) {
  const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN', 'HR_MANAGER')
  if (error) return error
  try {
    const { id, members, ...data } = await req.json()
    if (data.startDate) data.startDate = new Date(data.startDate)
    if (data.endDate) data.endDate = new Date(data.endDate)
    // Update scalar fields first
    const project = await db.project.update({ where: { id }, data })
    // Handle member updates (relation — delete old, create new)
    if (Array.isArray(members)) {
      await db.projectMember.deleteMany({ where: { projectId: id } })
      for (const m of members) {
        if (m.employeeId) {
          await db.projectMember.create({ data: { projectId: id, employeeId: m.employeeId, role: m.role || null } })
        }
      }
    }
    await audit(cu!.user.id, 'UPDATE_PROJECT', 'Project', id)
    return NextResponse.json({ ok: true, project })
  } catch (e) { return NextResponse.json({ error: 'Failed' }, { status: 500 }) }
}

export async function DELETE(req: NextRequest) {
  const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN')
  if (error) return error
  try {
    const { id } = await req.json()
    await db.projectMember.deleteMany({ where: { projectId: id } })
    await db.project.delete({ where: { id } })
    await audit(cu!.user.id, 'DELETE_PROJECT', 'Project', id)
    return NextResponse.json({ ok: true })
  } catch (e) { return NextResponse.json({ error: 'Failed' }, { status: 500 }) }
}