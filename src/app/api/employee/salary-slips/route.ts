import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  const cu = await getCurrentUser()
  if (!cu) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const employeeId = cu.user.employee?.id
  if (!employeeId) return NextResponse.json({ error: 'No employee profile' }, { status: 400 })
  const slips = await db.salarySlip.findMany({
    where: { employeeId },
    orderBy: [{ year: 'desc' }, { month: 'desc' }],
  })
  return NextResponse.json({ slips })
}
