import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const cu = await getCurrentUser()
    if (!cu) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const accountId = cu.user.accountId
    const role = cu.user.role

    if (!accountId) {
      return NextResponse.json({ error: 'No account linked' }, { status: 400 })
    }

    const account = await db.account.findUnique({
      where: { id: accountId },
      select: { organizationName: true, accountType: true },
    })

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    const isManpower = account.accountType !== 'hrms_saas'
    const isHrms = account.accountType !== 'manpower_supply'

    const today = new Date()
    const thirtyDaysFromNow = new Date(today)
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

    const [deployedHeadcount, presentToday, notMarkedToday, postingsEnding30d, timesheetsAwaiting, internalHeadcount, pendingLeaves, unreadNotifications, criticalAlerts] =
      await Promise.all([
        isManpower
          ? db.siteAssignment.count({ where: { accountId, status: 'active' } })
          : Promise.resolve(0),
        isManpower
          ? db.attendance.count({
              where: {
                date: today,
                status: 'PRESENT',
                employee: { accountId, employeeType: 'hp_deployed' },
              },
            })
          : Promise.resolve(0),
        isManpower
          ? db.siteAssignment.count({
              where: { accountId, status: 'active' },
            }) - db.attendance.count({
              where: {
                date: today,
                employee: { accountId, employeeType: 'hp_deployed' },
              },
            })
          : Promise.resolve(0),
        isManpower
          ? db.siteAssignment.count({
              where: {
                accountId,
                status: 'active',
                expectedEndDate: { lte: thirtyDaysFromNow, gte: today },
              },
            })
          : Promise.resolve(0),
        isManpower
          ? db.timesheet.count({
              where: { accountId, status: 'client_review' },
            })
          : Promise.resolve(0),
        isHrms
          ? db.employee.count({ where: { accountId, employeeType: 'internal', status: { in: ['APPROVED', 'ACTIVE'] } } })
          : Promise.resolve(0),
        isHrms
          ? db.leave.count({ where: { status: 'PENDING' } })
          : Promise.resolve(0),
        db.notification.count({
          where: {
            accountId,
            userId: cu.user.id,
            status: 'queued',
          },
        }),
        db.aiInsight.count({
          where: {
            accountId,
            severity: { in: ['high', 'critical'] },
            resolvedAt: null,
          },
        }),
      ])

    return NextResponse.json({
      organization: account.organizationName,
      account_type: account.accountType,
      role: role || 'viewer',
      as_of: today.toISOString(),
      deployed_headcount: deployedHeadcount,
      present_today: presentToday,
      not_marked_today: Math.max(0, notMarkedToday),
      postings_ending_30d: postingsEnding30d,
      timesheets_awaiting_approval: timesheetsAwaiting,
      internal_headcount: internalHeadcount,
      pending_leave_requests: pendingLeaves,
      open_alerts: unreadNotifications,
      critical_alerts: criticalAlerts,
    })
  } catch (e) {
    console.error('[Portal Summary]', e)
    return NextResponse.json({ error: 'Failed to load dashboard' }, { status: 500 })
  }
}
