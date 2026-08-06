import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
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

    const applications = await db.candidateApplication.findMany({
      where: { candidateId: candidate.id },
      include: {
        jobPosting: {
          select: {
            id: true,
            title: true,
            department: true,
            location: true,
            type: true,
          },
        },
        account: {
          select: {
            organizationName: true,
          },
        },
      },
      orderBy: { appliedDate: 'desc' },
    })

    return NextResponse.json({
      applications: applications.map((app) => ({
        id: app.id,
        status: app.status,
        appliedDate: app.appliedDate,
        coverLetter: app.coverLetter,
        job: {
          id: app.jobPosting.id,
          title: app.jobPosting.title,
          department: app.jobPosting.department,
          location: app.jobPosting.location,
          employmentType: app.jobPosting.type,
        },
        company: {
          name: app.account.organizationName,
        },
      })),
    })
  } catch (e) {
    console.error('[candidate/applications] GET failed:', e)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
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

    const body = await req.json()
    const { jobPostingId, coverLetter } = body

    if (!jobPostingId) {
      return NextResponse.json({ error: 'Job posting ID is required' }, { status: 400 })
    }

    // Verify job posting exists and is open
    const job = await db.jobPosting.findUnique({
      where: { id: jobPostingId },
      select: { id: true, title: true, status: true, accountId: true },
    })
    if (!job || job.status !== 'OPEN') {
      return NextResponse.json({ error: 'Job posting not found or is not open' }, { status: 404 })
    }

    // Check for duplicate application
    const existing = await db.candidateApplication.findUnique({
      where: {
        candidateId_jobPostingId: {
          candidateId: candidate.id,
          jobPostingId,
        },
      },
    })
    if (existing) {
      return NextResponse.json({ error: 'You have already applied for this position' }, { status: 409 })
    }

    const application = await db.candidateApplication.create({
      data: {
        candidateId: candidate.id,
        jobPostingId,
        coverLetter: coverLetter || null,
        accountId: job.accountId || candidate.accountId,
      },
      include: {
        jobPosting: {
          select: { id: true, title: true, department: true, location: true, type: true },
        },
      },
    })

    return NextResponse.json({
      ok: true,
      application: {
        id: application.id,
        status: application.status,
        appliedDate: application.appliedDate,
        job: application.jobPosting,
      },
    })
  } catch (e) {
    console.error('[candidate/applications] POST failed:', e)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}
