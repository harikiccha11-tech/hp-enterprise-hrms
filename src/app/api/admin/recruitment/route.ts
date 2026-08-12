import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/guards'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET — list job postings with candidate count, optional filter by status & search
export async function GET(req: NextRequest) {
  try {
    const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN', 'HR_MANAGER')
    if (error) return error

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') || undefined
    const search = searchParams.get('search') || undefined

    const where: Record<string, unknown> = { accountId: cu!.user.accountId }
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
  const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN', 'HR_MANAGER')
  if (error) return error
  try {
    const body = await req.json()
    const job = await db.jobPosting.create({
      data: {
        accountId: cu!.user.accountId,
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

const ALLOWED_PATCH_FIELDS = ['title', 'department', 'designation', 'location', 'type', 'experience', 'salaryMin', 'salaryMax', 'description', 'requirements', 'status', 'postedBy']

// PATCH — update job posting (status or fields)
export async function PATCH(req: NextRequest) {
  const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN', 'HR_MANAGER')
  if (error) return error
  try {
    const body = await req.json()
    const { id } = body
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    const existing = await db.jobPosting.findUnique({ where: { id } })
    if (!existing || existing.accountId !== cu!.user.accountId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const updateData: Record<string, unknown> = {}
    for (const key of ALLOWED_PATCH_FIELDS) {
      if (key in body) updateData[key] = body[key]
    }
    if ('salaryMin' in updateData) updateData.salaryMin = updateData.salaryMin ? Number(updateData.salaryMin) : null
    if ('salaryMax' in updateData) updateData.salaryMax = updateData.salaryMax ? Number(updateData.salaryMax) : null
    if (updateData.status === 'CLOSED') updateData.closedAt = new Date()

    const job = await db.jobPosting.update({ where: { id }, data: updateData })
    return NextResponse.json({ ok: true, job })
  } catch (e) {
    console.error('[recruitment] PATCH failed:', e)
    return NextResponse.json({ error: 'Failed to update job posting' }, { status: 500 })
  }
}

// DELETE — delete job posting
export async function DELETE(req: NextRequest) {
  const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN')
  if (error) return error
  try {
    const { id } = await req.json()
    const existing = await db.jobPosting.findUnique({ where: { id } })
    if (!existing || existing.accountId !== cu!.user.accountId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    await db.jobPosting.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[recruitment] DELETE failed:', e)
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}
