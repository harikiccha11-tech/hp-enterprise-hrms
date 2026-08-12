import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/guards'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET — list offboarding tasks for an employee, optional status filter
export async function GET(req: NextRequest) {
  try {
    const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN', 'HR_MANAGER')
    if (error) return error

    const { searchParams } = new URL(req.url)
    const employeeId = searchParams.get('employeeId') || undefined
    const status = searchParams.get('status') || undefined

    const where: Record<string, unknown> = { accountId: cu!.user.accountId }
    if (employeeId) where.employeeId = employeeId
    if (status) where.status = status

    const tasks = await db.offboardingTask.findMany({
      where,
      orderBy: [{ status: 'asc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
    })
    return NextResponse.json({ tasks })
  } catch (e) {
    console.error('[offboarding] GET failed:', e)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}

// POST — create task or bulk create (array of tasks)
export async function POST(req: NextRequest) {
  const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN', 'HR_MANAGER')
  if (error) return error
  const aid = cu!.user.accountId
  try {
    const body = await req.json()

    // Bulk create
    if (Array.isArray(body)) {
      const created = await db.$transaction(
        body.map((item: Record<string, any>) =>
          db.offboardingTask.create({
            data: {
              employeeId: item.employeeId,
              accountId: aid,
              task: item.task,
              category: item.category || null,
              dueDate: item.dueDate ? new Date(item.dueDate) : null,
              status: item.status || 'PENDING',
              notes: item.notes || null,
            },
          })
        )
      )
      return NextResponse.json({ ok: true, tasks: created })
    }

    // Single create
    const task = await db.offboardingTask.create({
      data: {
        employeeId: body.employeeId,
        accountId: aid,
        task: body.task,
        category: body.category || null,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        status: body.status || 'PENDING',
        notes: body.notes || null,
      },
    })
    return NextResponse.json({ ok: true, task })
  } catch (e) {
    console.error('[offboarding] POST failed:', e)
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
  }
}

const ALLOWED_PATCH_FIELDS = ['task', 'category', 'dueDate', 'status', 'notes']

// PATCH — update task (status, notes, etc.)
export async function PATCH(req: NextRequest) {
  const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN', 'HR_MANAGER')
  if (error) return error
  try {
    const body = await req.json()
    const { id } = body
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    const existing = await db.offboardingTask.findUnique({ where: { id } })
    if (!existing || existing.accountId !== cu!.user.accountId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const updateData: Record<string, unknown> = {}
    for (const key of ALLOWED_PATCH_FIELDS) {
      if (key in body) updateData[key] = body[key]
    }
    if ('dueDate' in updateData && updateData.dueDate) updateData.dueDate = new Date(updateData.dueDate as string)
    if (updateData.status === 'COMPLETED') {
      updateData.completedAt = new Date()
    }

    const task = await db.offboardingTask.update({ where: { id }, data: updateData })
    return NextResponse.json({ ok: true, task })
  } catch (e) {
    console.error('[offboarding] PATCH failed:', e)
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
  }
}

// DELETE — delete task
export async function DELETE(req: NextRequest) {
  const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN')
  if (error) return error
  try {
    const { id } = await req.json()
    const existing = await db.offboardingTask.findUnique({ where: { id } })
    if (!existing || existing.accountId !== cu!.user.accountId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    await db.offboardingTask.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[offboarding] DELETE failed:', e)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
