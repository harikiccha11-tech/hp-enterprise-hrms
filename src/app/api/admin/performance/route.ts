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
    const period = sp.get('period') || ''
    const year = sp.get('year') || ''
    const search = sp.get('search') || ''
    const where: any = {}
    if (status) where.status = status
    if (period) where.reviewPeriod = period
    if (year) where.year = year
    if (search) {
      where.employee = {
        OR: [
          { fullName: { contains: search } },
          { employeeCode: { contains: search } },
        ],
      }
    }
    const reviews = await db.performanceReview.findMany({
      where,
      include: {
        employee: { select: { id: true, fullName: true, employeeCode: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ reviews })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to load performance reviews' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN', 'HR_MANAGER')
  if (error) return error
  try {
    const body = await req.json()
    const { employeeId, reviewPeriod, year, rating, strengths, improvements, goals, feedback, reviewerName, status } = body
    if (!employeeId) return NextResponse.json({ error: 'Employee ID is required' }, { status: 400 })
    if (!reviewPeriod) return NextResponse.json({ error: 'Review period is required' }, { status: 400 })
    if (!year) return NextResponse.json({ error: 'Year is required' }, { status: 400 })
    const review = await db.performanceReview.create({
      data: {
        employeeId,
        reviewPeriod,
        year: String(year),
        rating: rating || 0,
        strengths: strengths || '',
        improvements: improvements || '',
        goals: goals || '',
        feedback: feedback || '',
        reviewerId: cu!.user.id,
        reviewerName: reviewerName || cu!.user.username || '',
        status: status || 'DRAFT',
      },
    })
    return NextResponse.json({ ok: true, review })
  } catch (e: any) {
    if (e?.code === 'P2002') {
      return NextResponse.json({ error: 'A review for this employee, period, and year already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to create performance review' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN', 'HR_MANAGER')
  if (error) return error
  try {
    const { id, rating, strengths, improvements, goals, feedback, status, reviewerName, reviewedAt } = await req.json()
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    const data: any = {}
    if (rating !== undefined) data.rating = rating
    if (strengths !== undefined) data.strengths = strengths
    if (improvements !== undefined) data.improvements = improvements
    if (goals !== undefined) data.goals = goals
    if (feedback !== undefined) data.feedback = feedback
    if (status !== undefined) data.status = status
    if (reviewerName !== undefined) data.reviewerName = reviewerName
    if (status === 'REVIEWED' || status === 'COMPLETED') {
      data.reviewedAt = reviewedAt ? new Date(reviewedAt) : new Date()
    }
    const review = await db.performanceReview.update({ where: { id }, data })
    return NextResponse.json({ ok: true, review })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to update performance review' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN')
  if (error) return error
  try {
    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    await db.performanceReview.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to delete performance review' }, { status: 500 })
  }
}
