import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const cu = await getCurrentUser()
    if (!cu) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (cu.user.role !== 'CLIENT') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const accountId = cu.user.accountId
    if (!accountId) return NextResponse.json({ error: 'No account linked' }, { status: 400 })

    // Get all employees with department info for this account
    const employees = await db.employee.findMany({
      where: {
        accountId,
        status: 'APPROVED',
        department: { not: null },
      },
      select: {
        department: true,
      },
    })

    // Aggregate departments with employee counts
    const deptMap = new Map<string, number>()
    for (const emp of employees) {
      const dept = emp.department!
      deptMap.set(dept, (deptMap.get(dept) || 0) + 1)
    }

    const departments = Array.from(deptMap.entries())
      .map(([name, employeeCount]) => ({ name, employeeCount }))
      .sort((a, b) => a.name.localeCompare(b.name))

    return NextResponse.json({ departments })
  } catch {
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}
