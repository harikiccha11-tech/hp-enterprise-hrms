import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/guards'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const startTime = Date.now()

export async function GET() {
  const { error } = await requireRole('OWNER', 'SUPER_ADMIN')
  if (error) return error
  try {
    // DB connection check
    let dbStatus = true
    let dbLatency = 0
    const dbStart = Date.now()
    try {
      await db.$queryRaw`SELECT 1`
      dbLatency = Date.now() - dbStart
    } catch {
      dbStatus = false
    }

    const uptime = Math.floor((Date.now() - startTime) / 1000)
    const hours = Math.floor(uptime / 3600)
    const minutes = Math.floor((uptime % 3600) / 60)

    // Entity counts
    const [users, employees, notifications, candidates, projects, clients, vendors, assets] = await Promise.all([
      db.user.count(),
      db.employee.count(),
      db.notification.count(),
      db.candidate.count(),
      db.project.count(),
      db.client.count(),
      db.vendor.count(),
      db.asset.count(),
    ])

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    const [employeesThisWeek, employeesUpdatedWeek, candidatesThisWeek, projectsThisWeek] = await Promise.all([
      db.employee.count({ where: { createdAt: { gte: oneWeekAgo } } }),
      db.employee.count({ where: { updatedAt: { gte: oneWeekAgo } } }),
      db.candidate.count({ where: { appliedAt: { gte: oneWeekAgo } } }),
      db.project.count({ where: { createdAt: { gte: oneWeekAgo } } }),
    ])

    // Memory usage (Node.js)
    const memUsage = process.memoryUsage()

    return NextResponse.json({
      database: { status: dbStatus, latency: dbLatency },
      uptime: { hours, minutes, raw: uptime },
      memory: {
        rss: Math.round(memUsage.rss / 1024 / 1024),
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      },
      counts: { users, employees, notifications, candidates, projects, clients, vendors, assets },
      weeklyStats: {
        employeesCreated: employeesThisWeek,
        employeesUpdated: employeesUpdatedWeek,
        candidatesCreated: candidatesThisWeek,
        projectsCreated: projectsThisWeek,
      },
    })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to load system health' }, { status: 500 })
  }
}
