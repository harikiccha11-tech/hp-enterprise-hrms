import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const cu = await getCurrentUser()
    if (!cu) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (cu.user.role !== 'CANDIDATE') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const candidate = await db.candidate.findUnique({
      where: { userId: cu.user.id },
    })
    if (!candidate) {
      return NextResponse.json({ error: 'Candidate profile not found' }, { status: 404 })
    }

    const { searchParams } = new URL(req.url)
    const statusFilter = searchParams.get('status') || undefined

    const where: Record<string, unknown> = { candidateId: candidate.id }
    if (statusFilter) where.status = statusFilter

    const interviews = await db.interview.findMany({
      where,
      include: {
        jobPosting: {
          select: { id: true, title: true, department: true },
        },
      },
      orderBy: { date: 'asc' },
    })

    return NextResponse.json({
      interviews: interviews.map((intv) => ({
        id: intv.id,
        date: intv.date,
        time: intv.time,
        type: intv.type,
        status: intv.status,
        interviewerName: intv.interviewerName,
        notes: intv.notes,
        location: intv.location,
        jobTitle: intv.jobPosting.title,
        jobDepartment: intv.jobPosting.department,
      })),
    })
  } catch (e) {
    console.error('[candidate/interviews] GET failed:', e)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}
