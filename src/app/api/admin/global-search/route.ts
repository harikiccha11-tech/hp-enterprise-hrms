import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/guards'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { error } = await requireRole('OWNER', 'SUPER_ADMIN', 'HR_MANAGER')
  if (error) return error
  try {
    const q = req.nextUrl.searchParams.get('q') || ''
    if (!q.trim() || q.length < 2) {
      return NextResponse.json({ results: {} })
    }
    const term = q.trim()

    const [employees, clients, projects, vendors, candidates, assets] = await Promise.all([
      db.employee.findMany({
        where: {
          OR: [
            { fullName: { contains: term, mode: 'insensitive' } },
            { personalEmail: { contains: term, mode: 'insensitive' } },
            { employeeCode: { contains: term, mode: 'insensitive' } },
          ],
        },
        take: 10,
        select: { id: true, fullName: true, employeeCode: true, personalEmail: true, status: true, designation: true },
      }),
      db.client.findMany({
        where: {
          OR: [
            { clientName: { contains: term, mode: 'insensitive' } },
            { companyName: { contains: term, mode: 'insensitive' } },
            { email: { contains: term, mode: 'insensitive' } },
          ],
        },
        take: 10,
        select: { id: true, clientName: true, companyName: true, email: true },
      }),
      db.project.findMany({
        where: {
          OR: [
            { projectName: { contains: term, mode: 'insensitive' } },
            { description: { contains: term, mode: 'insensitive' } },
          ],
        },
        take: 10,
        select: { id: true, projectName: true, status: true, site: true },
      }),
      db.vendor.findMany({
        where: {
          OR: [
            { vendorName: { contains: term, mode: 'insensitive' } },
            { companyName: { contains: term, mode: 'insensitive' } },
            { email: { contains: term, mode: 'insensitive' } },
          ],
        },
        take: 10,
        select: { id: true, vendorName: true, companyName: true, category: true, status: true },
      }),
      db.candidate.findMany({
        where: {
          OR: [
            { fullName: { contains: term, mode: 'insensitive' } },
            { email: { contains: term, mode: 'insensitive' } },
            { skills: { contains: term, mode: 'insensitive' } },
          ],
        },
        take: 10,
        select: { id: true, fullName: true, email: true, status: true, currentCompany: true },
      }),
      db.asset.findMany({
        where: {
          OR: [
            { name: { contains: term, mode: 'insensitive' } },
            { serialNumber: { contains: term, mode: 'insensitive' } },
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
