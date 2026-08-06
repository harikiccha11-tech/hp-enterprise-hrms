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

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || undefined
    const department = searchParams.get('department') || undefined
    const location = searchParams.get('location') || undefined
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10', 10)))
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {
      status: 'OPEN',
      isPublic: true,
    }

    if (search) {
      ;(where as Record<string, Record<string, unknown>>).OR = [
        { title: { contains: search } },
        { department: { contains: search } },
        { designation: { contains: search } },
        { location: { contains: search } },
      ]
    }
    if (department) where.department = department
    if (location) where.location = location

    const [jobs, total] = await Promise.all([
      db.jobPosting.findMany({
        where,
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
        orderBy: { postedAt: 'desc' },
        skip,
        take: limit,
      }),
      db.jobPosting.count({ where }),
    ])

    return NextResponse.json({
      jobs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (e) {
    console.error('[candidate/jobs] GET failed:', e)
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}
