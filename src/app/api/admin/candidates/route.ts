import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/guards'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET — list candidates with jobPosting relation, filter by status/source/search
export async function GET(req: NextRequest) {
  const { error } = await requireRole('OWNER', 'SUPER_ADMIN', 'HR_MANAGER')
  if (error) return error

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || undefined
  const source = searchParams.get('source') || undefined
  const search = searchParams.get('search') || undefined

  const where: Record<string, any> = {}
  if (status) where.status = status
  if (source) where.source = source
  if (search) {
    where.OR = [
      { fullName: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { skills: { contains: search, mode: 'insensitive' } },
      { currentCompany: { contains: search, mode: 'insensitive' } },
    ]
  }

  const candidates = await db.candidate.findMany({
    where,
    include: { jobPosting: { select: { id: true, title: true } } },
    orderBy: { appliedAt: 'desc' },
  })
  return NextResponse.json({ candidates })
}

// POST — create candidate, optionally linked to a job posting
export async function POST(req: NextRequest) {
  const { error } = await requireRole('OWNER', 'SUPER_ADMIN', 'HR_MANAGER')
  if (error) return error
  try {
    const body = await req.json()
    const candidate = await db.candidate.create({
      data: {
        fullName: body.fullName,
        email: body.email,
        phone: body.phone || null,
        resume: body.resume || null,
        experience: body.experience || null,
        currentCompany: body.currentCompany || null,
        currentCtc: body.currentCtc ? Number(body.currentCtc) : null,
        expectedCtc: body.expectedCtc ? Number(body.expectedCtc) : null,
        noticePeriod: body.noticePeriod || null,
        skills: body.skills || null,
        source: body.source || null,
        status: body.status || 'NEW',
        jobPostingId: body.jobPostingId || null,
        remarks: body.remarks || null,
      },
    })
    return NextResponse.json({ ok: true, candidate })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to create candidate' }, { status: 500 })
  }
}

// PATCH — update candidate (status, remarks, or other fields)
export async function PATCH(req: NextRequest) {
  const { error } = await requireRole('OWNER', 'SUPER_ADMIN', 'HR_MANAGER')
  if (error) return error
  try {
    const { id, ...data } = await req.json()
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    const update: Record<string, any> = { ...data }
    if (data.currentCtc !== undefined) update.currentCtc = data.currentCtc ? Number(data.currentCtc) : null
    if (data.expectedCtc !== undefined) update.expectedCtc = data.expectedCtc ? Number(data.expectedCtc) : null

    const candidate = await db.candidate.update({ where: { id }, data: update })
    return NextResponse.json({ ok: true, candidate })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to update candidate' }, { status: 500 })
  }
}

// DELETE — delete candidate
export async function DELETE(req: NextRequest) {
  const { error } = await requireRole('OWNER', 'SUPER_ADMIN')
  if (error) return error
  try {
    const { id } = await req.json()
    await db.candidate.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to delete' }, { status: 500 })
  }
}
