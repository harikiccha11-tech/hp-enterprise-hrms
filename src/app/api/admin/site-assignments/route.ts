import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser, getAccountType } from '@/lib/auth'
import { requireRole } from '@/lib/guards'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const cu = await getCurrentUser()
    if (!cu) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { session, user } = cu

    const accountType = getAccountType(session)

    // Filter by account if the user has an accountId
    const where: any = {}
    if (user.accountId) {
      where.accountId = user.accountId
    }

    const assignments = await db.siteAssignment.findMany({
      where,
      include: {
        employee: { select: { id: true, fullName: true, employeeCode: true, designation: true, department: true } },
        account: { select: { id: true, organizationName: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ assignments })
  } catch (e) {
    console.error('Site assignments error:', e)
    return NextResponse.json({ error: 'Failed to fetch site assignments' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN', 'HR_MANAGER')
    if (error) return error
    const { user } = cu

    const body = await req.json()
    const { employeeId, siteName, location, deploymentDate, expectedEndDate, dailyRate } = body

    if (!employeeId || !siteName || !deploymentDate || !dailyRate) {
      return NextResponse.json({ error: 'Employee, site name, deployment date, and daily rate are required' }, { status: 400 })
    }

    const assignment = await db.siteAssignment.create({
      data: {
        accountId: user.accountId || undefined,
        employeeId,
        siteName,
        location,
        deploymentDate: new Date(deploymentDate),
        expectedEndDate: expectedEndDate ? new Date(expectedEndDate) : null,
        dailyRate: parseFloat(dailyRate),
        status: 'active',
        createdByUserId: user.id,
      },
    })

    return NextResponse.json({ assignment }, { status: 201 })
  } catch (e) {
    console.error('Create site assignment error:', e)
    return NextResponse.json({ error: 'Failed to create site assignment' }, { status: 500 })
  }
}
