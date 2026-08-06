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
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        skills: true,
        experience: true,
        education: true,
        summary: true,
        resume: true,
        currentCompany: true,
        currentCtc: true,
        expectedCtc: true,
        noticePeriod: true,
      },
    })
    if (!candidate) {
      return NextResponse.json({ error: 'Candidate profile not found' }, { status: 404 })
    }

    // Parse name into first/last
    const nameParts = candidate.fullName.trim().split(/\s+/)
    const firstName = nameParts[0] || ''
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : ''

    return NextResponse.json({
      firstName,
      lastName,
      email: candidate.email,
      phone: candidate.phone,
      skills: candidate.skills ? (safeParseJson(candidate.skills) ?? candidate.skills) : null,
      experience: candidate.experience ? (safeParseJson(candidate.experience) ?? candidate.experience) : null,
      education: candidate.education ? (safeParseJson(candidate.education) ?? candidate.education) : null,
      summary: candidate.summary,
      resumeUrl: candidate.resume,
      currentCompany: candidate.currentCompany,
      currentCtc: candidate.currentCtc,
      expectedCtc: candidate.expectedCtc,
      noticePeriod: candidate.noticePeriod,
    })
  } catch (e) {
    console.error('[candidate/resume] GET failed:', e)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
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
    const { firstName, lastName, email, phone, skills, experience, education, summary } = body

    // Reconstruct full name
    const fullName = [firstName, lastName].filter(Boolean).join(' ').trim() || candidate.fullName

    const updated = await db.candidate.update({
      where: { id: candidate.id },
      data: {
        fullName,
        email: email || candidate.email,
        phone: phone !== undefined ? phone : candidate.phone,
        skills: skills !== undefined ? (typeof skills === 'string' ? skills : JSON.stringify(skills)) : candidate.skills,
        experience: experience !== undefined ? (typeof experience === 'string' ? experience : JSON.stringify(experience)) : candidate.experience,
        education: education !== undefined ? (typeof education === 'string' ? education : JSON.stringify(education)) : candidate.education,
        summary: summary !== undefined ? summary : candidate.summary,
      },
    })

    return NextResponse.json({
      ok: true,
      candidate: {
        id: updated.id,
        fullName: updated.fullName,
        email: updated.email,
        phone: updated.phone,
      },
    })
  } catch (e) {
    console.error('[candidate/resume] PUT failed:', e)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}

/** Safe JSON parse — returns parsed value or null on failure */
function safeParseJson(str: string): unknown {
  try {
    return JSON.parse(str)
  } catch {
    return null
  }
}
