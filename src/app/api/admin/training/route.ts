import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/guards'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { error } = await requireRole('OWNER', 'SUPER_ADMIN', 'HR_MANAGER')
  if (error) return error
  try {
    const sp = req.nextUrl.searchParams
    const status = sp.get('status') || ''
    const category = sp.get('category') || ''
    const enrollments = sp.get('enrollments') === 'true'
    const where: any = {}
    if (status) where.status = status
    if (category) where.category = category

    if (enrollments) {
      const rows = await db.trainingEnrollment.findMany({
        include: {
          course: { select: { id: true, title: true } },
        },
        orderBy: { enrolledAt: 'desc' },
      })
      return NextResponse.json({ enrollments: rows })
    }

    const courses = await db.trainingCourse.findMany({
      where,
      include: {
        _count: { select: { enrollments: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ courses })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to load training data' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN', 'HR_MANAGER')
  if (error) return error
  try {
    const body = await req.json()
    const { action } = body

    // Enroll employee
    if (action === 'enroll') {
      const { courseId, employeeId } = body
      if (!courseId || !employeeId) return NextResponse.json({ error: 'Course ID and Employee ID are required' }, { status: 400 })
      const existing = await db.trainingEnrollment.findUnique({
        where: { courseId_employeeId: { courseId, employeeId } },
      })
      if (existing) return NextResponse.json({ error: 'Employee is already enrolled in this course' }, { status: 409 })
      const enrollment = await db.trainingEnrollment.create({
        data: { courseId, employeeId, status: 'ENROLLED' },
      })
      return NextResponse.json({ ok: true, enrollment })
    }

    // Update enrollment
    if (action === 'update-enrollment') {
      const { enrollmentId, status, score, feedback } = body
      if (!enrollmentId) return NextResponse.json({ error: 'Enrollment ID is required' }, { status: 400 })
      const data: any = {}
      if (status) data.status = status
      if (score !== undefined) data.score = score ? Number(score) : null
      if (feedback !== undefined) data.feedback = feedback
      if (status === 'COMPLETED') data.completedAt = new Date()
      const enrollment = await db.trainingEnrollment.update({ where: { id: enrollmentId }, data })
      return NextResponse.json({ ok: true, enrollment })
    }

    // Create course
    const { title, description, category, duration, mode, instructor, maxParticipants, status } = body
    if (!title?.trim()) return NextResponse.json({ error: 'Course title is required' }, { status: 400 })
    const course = await db.trainingCourse.create({
      data: {
        title: title.trim(),
        description: description || '',
        category: category || 'Technical',
        duration: duration || '',
        mode: mode || 'Online',
        instructor: instructor || '',
        maxParticipants: maxParticipants ? Number(maxParticipants) : null,
        status: status || 'ACTIVE',
      },
    })
    return NextResponse.json({ ok: true, course })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to process training request' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN', 'HR_MANAGER')
  if (error) return error
  try {
    const { id, title, description, category, duration, mode, instructor, maxParticipants, status } = await req.json()
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    const data: any = {}
    if (title !== undefined) data.title = title.trim()
    if (description !== undefined) data.description = description
    if (category !== undefined) data.category = category
    if (duration !== undefined) data.duration = duration
    if (mode !== undefined) data.mode = mode
    if (instructor !== undefined) data.instructor = instructor
    if (maxParticipants !== undefined) data.maxParticipants = maxParticipants ? Number(maxParticipants) : null
    if (status !== undefined) data.status = status
    const course = await db.trainingCourse.update({ where: { id }, data })
    return NextResponse.json({ ok: true, course })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to update training course' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN')
  if (error) return error
  try {
    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    await db.trainingEnrollment.deleteMany({ where: { courseId: id } })
    await db.trainingCourse.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to delete training course' }, { status: 500 })
  }
}
