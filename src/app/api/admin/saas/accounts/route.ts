import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole, audit } from '@/lib/guards'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET: List all accounts with enriched data (plan, employee count, etc.)
export async function GET(req: NextRequest) {
  try {
    const { error } = await requireRole('OWNER', 'SUPER_ADMIN')
    if (error) return error

    const url = new URL(req.url)
    const status = url.searchParams.get('status')
    const search = url.searchParams.get('search')

    const where: any = {}
    if (status && status !== 'all') where.status = status
    if (search) where.organizationName = { contains: search }

    const accounts = await db.account.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { employees: true, users: true } },
      },
    })

    // Get plan info from SubscriptionRequest if linked, else derive from employee count
    const planForCount = (count: number) => {
      if (count > 500) return 'Enterprise'
      if (count > 100) return 'Professional'
      if (count > 25) return 'Standard'
      return 'Starter'
    }

    const result = accounts.map((a) => ({
      id: a.id,
      name: a.organizationName,
      plan: planForCount(a._count.employees),
      status: a.status === 'active' ? 'Active' : a.status === 'trial' ? 'Trial' : a.status === 'suspended' ? 'Suspended' : 'Expired',
      employees: a._count.employees,
      mrr: 0, // Will be computed by revenue endpoint
      joinDate: a.createdAt.toISOString().split('T')[0],
      billingContactEmail: a.billingContactEmail,
      billingPhone: a.billingPhone,
    }))

    // Also get pending subscription requests for CompanyApproval module
    const pendingRequests = await db.subscriptionRequest.findMany({
      where: { status: 'NEW' },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ accounts: result, pendingRequests })
  } catch (e) {
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}

// PATCH: Update account status or approve/reject subscription requests
export async function PATCH(req: NextRequest) {
  try {
    const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN')
    if (error) return error

    const body = await req.json()
    const { action, id, ...data } = body

    if (action === 'approve_request' || action === 'reject_request') {
      // Handle subscription request approval/rejection
      const request = await db.subscriptionRequest.findUnique({ where: { id } })
      if (!request) return NextResponse.json({ error: 'Request not found' }, { status: 404 })

      await db.subscriptionRequest.update({
        where: { id },
        data: { status: action === 'approve_request' ? 'CONVERTED' : 'REJECTED' },
      })

      if (action === 'approve_request') {
        // Create an account for approved request
        const planMap: Record<string, string> = { free: 'Starter', starter: 'Starter', professional: 'Professional', enterprise: 'Enterprise' }
        await db.account.create({
          data: {
            organizationName: request.companyName,
            billingContactEmail: request.email,
            billingPhone: request.phone,
            status: 'trial',
            accountType: 'hrms_saas',
            expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          },
        })
      }

      await audit(cu!.user.id, action, 'SubscriptionRequest', id, `Subscription request ${action === 'approve_request' ? 'approved' : 'rejected'}`)
      return NextResponse.json({ ok: true })
    }

    if (id) {
      // Update account fields
      const updateData: any = {}
      if (data.status) updateData.status = data.status.toLowerCase()
      if (data.plan) {
        // Store plan as a setting associated with account
        // Since there's no direct plan field, we use the Setting model
      }

      await db.account.update({ where: { id }, data: updateData })
      await audit(cu!.user.id, 'UPDATE', 'Account', id, `Account updated: ${JSON.stringify(updateData)}`)
      return NextResponse.json({ ok: true })
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  } catch (e) {
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}
