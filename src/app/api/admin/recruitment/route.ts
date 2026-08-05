import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/guards'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET — list job postings with candidate count, optional filter by status & search
export async function GET(req: NextRequest) {
  try {
    const { error } = await requireRole('OWNER', 'SUPER_ADMIN', 'HR_MANAGER')
    if (error) return error

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') || undefined
    const search = searchParams.get('search') || undefined

    const where: Record<string, unknown> = {}
    if (status) where.status = status
    if (search) {
      (where as Record<string, Record<string, unknown>>).OR = [
        { title: { contains: search } },
        { department: { contains: search } },
        { designation: { contains: search } },
        { location: { contains: search } },
      ]
    }

    const jobs = await db.jobPosting.findMany({
      where,
      include: { _count: { select: { candidates: true } } },
      orderBy: { postedAt: 'desc' },
    })
    return NextResponse.json({ jobs })
  } catch (e) {
    console.error('[recruitment] GET failed:', e)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}

// POST — create job posting
export async function POST(req: NextRequest) {
  const { error } = await requireRole('OWNER', 'SUPER_ADMIN', 'HR_MANAGER')
  if (error) return error
  try {
    const body = await req.json()
    const job = await db.jobPosting.create({
      data: {
        title: body.title,
        department: body.department || null,
        designation: body.designation || null,
        location: body.location || null,
        type: body.type || 'FULL_TIME',
        experience: body.experience || null,
        salaryMin: body.salaryMin ? Number(body.salaryMin) : null,
        salaryMax: body.salaryMax ? Number(body.salaryMax) : null,
        description: body.description || null,
        requirements: body.requirements || null,
        status: body.status || 'DRAFT',
        postedBy: body.postedBy || null,
      },
    })
    return NextResponse.json({ ok: true, job })
  } catch (e) {
    console.error('[recruitment] POST failed:', e)
    return NextResponse.json({ error: 'Failed to create job posting' }, { status: 500 })
  }
}

// PATCH — update job posting (status or fields)
export async function PATCH(req: NextRequest) {
  const { error } = await requireRole('OWNER', 'SUPER_ADMIN', 'HR_MANAGER')
  if (error) return error
  try {
    const { id, ...data } = await req.json()
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    const update: Record<string, unknown> = { ...data }
    if (data.salaryMin !== undefined) update.salaryMin = data.salaryMin ? Number(data.salaryMin) : null
    if (data.salaryMax !== undefined) update.salaryMax = data.salaryMax ? Number(data.salaryMax) : null
    if (data.status === 'CLOSED') update.closedAt = new Date()

    const job = await db.jobPosting.update({ where: { id }, data: update })
    return NextResponse.json({ ok: true, job })
  } catch (e) {
    console.error('[recruitment] PATCH failed:', e)
    return NextResponse.json({ error: 'Failed to update job posting' }, { status: 500 })
  }
}

// DELETE — delete job posting
export async function DELETE(req: NextRequest) {
  const { error } = await requireRole('OWNER', 'SUPER_ADMIN')
  if (error) return error
  try {
    const { id } = await req.json()
    await db.jobPosting.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[recruitment] DELETE failed:', e)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
