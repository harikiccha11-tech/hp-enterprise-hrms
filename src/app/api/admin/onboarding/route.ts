import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/guards'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET — list onboarding tasks for an employee, optional status filter
export async function GET(req: NextRequest) {
  const { error } = await requireRole('OWNER', 'SUPER_ADMIN', 'HR_MANAGER')
  if (error) return error

  const { searchParams } = new URL(req.url)
  const employeeId = searchParams.get('employeeId') || undefined
  const status = searchParams.get('status') || undefined

  const where: Record<string, any> = {}
  if (employeeId) where.employeeId = employeeId
  if (status) where.status = status

  const tasks = await db.onboardingTask.findMany({
    where,
    orderBy: [{ status: 'asc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
  })
  return NextResponse.json({ tasks })
}

// POST — create task or bulk create (array of tasks)
export async function POST(req: NextRequest) {
  const { error } = await requireRole('OWNER', 'SUPER_ADMIN', 'HR_MANAGER')
  if (error) return error
  try {
    const body = await req.json()

    // Bulk create
    if (Array.isArray(body)) {
      const created = await db.$transaction(
        body.map((item: Record<string, any>) =>
          db.onboardingTask.create({
            data: {
              employeeId: item.employeeId,
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
    const task = await db.onboardingTask.create({
      data: {
        employeeId: body.employeeId,
        task: body.task,
        category: body.category || null,
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        status: body.status || 'PENDING',
        notes: body.notes || null,
      },
    })
    return NextResponse.json({ ok: true, task })
  } catch (e: any) {
    console.error('[onboarding] POST failed:', e)
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 })
  }
}

// PATCH — update task (status, notes, etc.)
export async function PATCH(req: NextRequest) {
  const { error } = await requireRole('OWNER', 'SUPER_ADMIN', 'HR_MANAGER')
  if (error) return error
  try {
    const { id, ...data } = await req.json()
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    const update: Record<string, any> = { ...data }
    if (data.dueDate) update.dueDate = new Date(data.dueDate)
    if (data.status === 'COMPLETED') {
      update.completedAt = new Date()
    }

    const task = await db.onboardingTask.update({ where: { id }, data: update })
    return NextResponse.json({ ok: true, task })
  } catch (e: any) {
    console.error('[onboarding] PATCH failed:', e)
    return NextResponse.json({ error: 'Failed to update task' }, { status: 500 })
  }
}

// DELETE — delete task
export async function DELETE(req: NextRequest) {
  const { error } = await requireRole('OWNER', 'SUPER_ADMIN')
  if (error) return error
  try {
    const { id } = await req.json()
    await db.onboardingTask.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    console.error('[onboarding] DELETE failed:', e)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
