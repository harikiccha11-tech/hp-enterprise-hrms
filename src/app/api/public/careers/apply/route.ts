import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

/** Public endpoint — submit a job application */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { jobPostingId, fullName, email, phone, experience, currentCompany, currentCtc, expectedCtc, noticePeriod, skills, source, resumeUrl, remarks } = body

    if (!fullName || !email || !jobPostingId) {
      return NextResponse.json({ error: 'Name, email, and job ID are required.' }, { status: 400 })
    }

    // Verify the job posting is open
    const job = await db.jobPosting.findUnique({
      where: { id: jobPostingId },
      select: { status: true, title: true },
    })

    if (!job) {
      return NextResponse.json({ error: 'Job posting not found.' }, { status: 404 })
    }

    if (job.status !== 'OPEN') {
      return NextResponse.json({ error: 'This position is no longer accepting applications.' }, { status: 400 })
    }

    // Check for duplicate application by email+job
    const existing = await db.candidate.findFirst({
      where: { email: email.trim().toLowerCase(), jobPostingId },
    })
    if (existing) {
      return NextResponse.json({ error: 'You have already applied for this position.' }, { status: 409 })
    }

    const candidate = await db.candidate.create({
      data: {
        fullName: String(fullName).trim(),
        email: String(email).trim().toLowerCase(),
        phone: phone ? String(phone).trim() : null,
        experience: experience || null,
        currentCompany: currentCompany || null,
        currentCtc: currentCtc ? Number(currentCtc) : null,
        expectedCtc: expectedCtc ? Number(expectedCtc) : null,
        noticePeriod: noticePeriod || null,
        skills: skills || null,
        source: source || 'career_page',
        resume: resumeUrl || null,
        remarks: remarks || `Applied via career page for: ${job.title}`,
        jobPostingId,
        status: 'NEW',
      },
    })

    return NextResponse.json({
      ok: true,
      id: candidate.id,
      message: 'Application submitted successfully! Our HR team will review your profile.',
    })
  } catch (e) {
    console.error('Career apply error:', e)
    return NextResponse.json({ error: 'Failed to submit application.' }, { status: 500 })
  }
}
