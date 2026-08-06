import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const cu = await getCurrentUser()
    if (!cu) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (cu.user.role !== 'CLIENT') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const accountId = cu.user.accountId
    if (!accountId) return NextResponse.json({ error: 'No account linked' }, { status: 400 })

    const { searchParams } = request.nextUrl
    const search = searchParams.get('search')?.trim() || ''
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)))
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {
      accountId,
      status: 'APPROVED',
    }

    if (search) {
      where.OR = [
        { fullName: { contains: search } },
        { email: { contains: search } },
        { employeeCode: { contains: search } },
      ]
    }

    const [employees, total] = await Promise.all([
      db.employee.findMany({
        where,
        select: {
          id: true,
          employeeCode: true,
          fullName: true,
          email: true,
          mobile: true,
          department: true,
          designation: true,
          joinDate: true,
          status: true,
        },
        orderBy: { fullName: 'asc' },
        skip,
        take: limit,
      }),
      db.employee.count({ where }),
    ])

    return NextResponse.json({
      employees: employees.map((e) => ({
        id: e.id,
        employeeCode: e.employeeCode,
        firstName: e.fullName.split(' ')[0] || '',
        lastName: e.fullName.split(' ').slice(1).join(' ') || '',
        fullName: e.fullName,
        email: e.email,
        phone: e.mobile,
        department: e.department,
        designation: e.designation,
        dateOfJoining: e.joinDate ? e.joinDate.toISOString().slice(0, 10) : null,
        status: e.status,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch {
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}
