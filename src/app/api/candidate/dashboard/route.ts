import { NextResponse } from 'next/server'
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

    const [totalApplications, pendingApplications, interviewScheduled, offers] = await Promise.all([
      db.candidateApplication.count({
        where: { candidateId: candidate.id },
      }),
      db.candidateApplication.count({
        where: { candidateId: candidate.id, status: { in: ['APPLIED', 'SCREENING', 'SHORTLISTED'] } },
      }),
      db.candidateApplication.count({
        where: { candidateId: candidate.id, status: 'INTERVIEW' },
      }),
      db.candidateApplication.count({
        where: { candidateId: candidate.id, status: { in: ['OFFER', 'HIRED'] } },
      }),
    ])

    const unreadNotifications = await db.notification.count({
      where: { userId: cu.user.id, read: false },
    })

    return NextResponse.json({
      candidate: {
        name: candidate.fullName,
        email: candidate.email,
        phone: candidate.phone,
        status: candidate.status,
      },
      stats: {
        totalApplications,
        pendingApplications,
        interviewScheduled,
        offers,
        unreadNotifications,
      },
    })
  } catch (e) {
    console.error('[candidate/dashboard] GET failed:', e)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}
