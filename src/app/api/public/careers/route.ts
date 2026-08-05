import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

/** Public endpoint — returns open job postings for the landing page careers section */
export async function GET() {
  try {
    const jobs = await db.jobPosting.findMany({
      where: { status: 'OPEN' },
      orderBy: { postedAt: 'desc' },
      select: {
        id: true,
        title: true,
        department: true,
        designation: true,
        location: true,
        type: true,
        experience: true,
        salaryMin: true,
        salaryMax: true,
        description: true,
        requirements: true,
        postedAt: true,
      },
    })

    return NextResponse.json({ jobs })
  } catch (e) {
    console.error('Public careers error:', e)
    return NextResponse.json({ jobs: [] })
  }
}
