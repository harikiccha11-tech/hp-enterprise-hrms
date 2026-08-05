import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/guards'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN', 'HR_MANAGER')
  if (error) return error
  try {
    const q = req.nextUrl.searchParams.get('q') || ''
    if (!q.trim() || q.length < 2) {
      return NextResponse.json({ results: {} })
    }
    const term = q.trim()
    const accountId = cu.user.accountId

    const [employees, clients, projects, vendors, candidates, assets] = await Promise.all([
      db.employee.findMany({
        where: {
          accountId,
          OR: [
            { fullName: { contains: term } },
            { email: { contains: term } },
            { employeeCode: { contains: term } },
          ],
        },
        take: 10,
        select: { id: true, fullName: true, employeeCode: true, email: true, status: true, designation: true },
      }),
      db.client.findMany({
        where: {
          accountId,
          OR: [
            { clientName: { contains: term } },
            { companyName: { contains: term } },
            { email: { contains: term } },
          ],
        },
        take: 10,
        select: { id: true, clientName: true, companyName: true, email: true },
      }),
      db.project.findMany({
        where: {
          accountId,
          OR: [
            { projectName: { contains: term } },
            { description: { contains: term } },
          ],
        },
        take: 10,
        select: { id: true, projectName: true, status: true, site: true },
      }),
      // NOTE: Vendor model has no accountId field — cannot scope to tenant.
      // Kept unscoped until schema is updated with tenant isolation.
      db.vendor.findMany({
        where: {
          OR: [
            { vendorName: { contains: term } },
            { companyName: { contains: term } },
            { email: { contains: term } },
          ],
        },
        take: 10,
        select: { id: true, vendorName: true, companyName: true, category: true, status: true },
      }),
      // NOTE: Candidate model has no accountId field — cannot scope to tenant.
      // Kept unscoped until schema is updated with tenant isolation.
      db.candidate.findMany({
        where: {
          OR: [
            { fullName: { contains: term } },
            { email: { contains: term } },
            { skills: { contains: term } },
          ],
        },
        take: 10,
        select: { id: true, fullName: true, email: true, status: true, currentCompany: true },
      }),
      // NOTE: Asset model has no accountId field — cannot scope to tenant.
      // Kept unscoped until schema is updated with tenant isolation.
      db.asset.findMany({
        where: {
          OR: [
            { name: { contains: term } },
            { serialNumber: { contains: term } },
          ],
        },
        take: 10,
        select: { id: true, name: true, category: true, status: true, serialNumber: true },
      }),
    ])

    const results: Record<string, any[]> = {}
    if (employees.length) results.employees = employees
    if (clients.length) results.clients = clients
    if (projects.length) results.projects = projects
    if (vendors.length) results.vendors = vendors
    if (candidates.length) results.candidates = candidates
    if (assets.length) results.assets = assets

    return NextResponse.json({ results })
  } catch (e) {
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
