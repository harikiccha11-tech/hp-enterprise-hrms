import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole } from '@/lib/guards'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { error } = await requireRole('SUPER_ADMIN')
    if (error) return error

    const accounts = await db.account.findMany({
      where: { status: { in: ['active', 'trial'] } },
      include: { _count: { select: { employees: true } } },
    })

    const planForCount = (count: number) => {
      if (count > 500) return 'Enterprise'
      if (count > 100) return 'Professional'
      if (count > 25) return 'Standard'
      return 'Starter'
    }

    const planPrice: Record<string, number> = { Starter: 2999, Standard: 6999, Professional: 12999, Enterprise: 24999 }

    let totalMrr = 0
    const byPlan: Record<string, { clients: number; mrr: number }> = {}
    const topClients: { name: string; mrr: number; plan: string; since: string }[] = []

    for (const a of accounts) {
      const plan = planForCount(a._count.employees)
      const mrr = planPrice[plan] || 0
      totalMrr += mrr

      if (!byPlan[plan]) byPlan[plan] = { clients: 0, mrr: 0 }
      byPlan[plan].clients++
      byPlan[plan].mrr += mrr

      topClients.push({
        name: a.organizationName,
        mrr,
        plan,
        since: new Date(a.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
      })
    }

    topClients.sort((a, b) => b.mrr - a.mrr)

    const revenueByPlan = Object.entries(byPlan).map(([plan, data]) => ({
      plan,
      clients: data.clients,
      mrr: data.mrr,
      pct: totalMrr > 0 ? Math.round((data.mrr / totalMrr) * 100) : 0,
    }))

    // Generate monthly trend from invoice data
    const now = new Date()
    const monthlyRevenue = []
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const mStart = new Date(d.getFullYear(), d.getMonth(), 1)
      const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 1)
      const invoiceTotal = await db.invoice.aggregate({
        _sum: { total: true },
        where: { issueDate: { gte: mStart, lt: mEnd }, status: { in: ['PAID', 'paid', 'SENT', 'sent'] } },
      })
      monthlyRevenue.push({
        month: months[d.getMonth()],
        amount: invoiceTotal._sum.total || totalMrr, // fallback to MRR if no invoices
      })
    }

    return NextResponse.json({
      mrr: totalMrr,
      arr: totalMrr * 12,
      totalRevenue: totalMrr,
      accounts: {
        total: accounts.length,
        active: accounts.filter(a => a.status === 'active').length,
        trial: accounts.filter(a => a.status === 'trial').length,
      },
      revenueByPlan,
      topClients: topClients.slice(0, 5),
      monthlyRevenue,
    })
  } catch (e) {
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}
