import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole, audit } from '@/lib/guards'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN', 'HR_MANAGER')
    if (error) return error
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') || undefined
    const q = searchParams.get('q') || undefined

    const employees = await db.employee.findMany({
      where: {
        ...(status && status !== 'ALL' ? { status } : {}),
        ...(q
          ? {
              OR: [
                { fullName: { contains: q } },
                { email: { contains: q } },
                { employeeCode: { contains: q } },
                { mobile: { contains: q } },
              ],
            }
          : {}),
      },
      include: {
        user: { select: { id: true, username: true, locked: true, mustResetPassword: true, lastLoginAt: true } },
        _count: { select: { documents: true, generatedDocs: true } },
        assignedClient: { select: { id: true, clientName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
    })
    return NextResponse.json({ employees })
  } catch (e) {
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN', 'HR_MANAGER')
  if (error) return error
  try {
    const body = await req.json()
    const { id, ...data } = body
    if (!id) return NextResponse.json({ error: 'Employee id required' }, { status: 400 })
    // HR cannot edit salary/role-critical fields beyond employee records (UI enforces; API keeps it simple)
    const allowed: Record<string, any> = {}
    for (const k of [
      'fullName','fatherName','motherName','dob','gender','bloodGroup','mobile','alternateMobile',
      'email','address','emergencyContact','aadhaar','pan','uan','esic','passport','drivingLicence',
      'bankHolder','bankName','bankBranch','bankAccount','bankIfsc','designation','department',
      'joinDate','employmentType','salary','basic','hra','allowances','specialAllowance',
      'currentDesignation','totalExperience','relevantExperience','currentCompany','previousCompany',
      'currentSalary','expectedSalary','noticePeriod','disciplines','projectTypes','skills','status',
    ]) {
      if (k in data) allowed[k] = data[k]
    }
    if (allowed.dob) allowed.dob = new Date(allowed.dob)
    if (allowed.joinDate) allowed.joinDate = new Date(allowed.joinDate)
    const updated = await db.employee.update({ where: { id }, data: allowed })
    await audit(cu!.user.id, 'UPDATE_EMPLOYEE', 'Employee', id, JSON.stringify(allowed).slice(0, 500))
    return NextResponse.json({ employee: updated })
  } catch (e) {
    console.error('update employee error', e)
    return NextResponse.json({ error: 'Failed to update employee' }, { status: 500 })
  }
}
