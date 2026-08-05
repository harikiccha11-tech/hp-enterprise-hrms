import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

/** Public endpoint — returns active subscription plans for the landing page */
export async function GET() {
  try {
    const plans = await db.subscriptionPlan.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        name: true,
        description: true,
        priceINR: true,
        priceUSD: true,
        interval: true,
        maxEmployees: true,
        features: true,
        trialDays: true,
        isPopular: true,
      },
    })

    return NextResponse.json({ plans })
  } catch (e) {
    console.error('Public pricing error:', e)
    return NextResponse.json({ plans: [] })
  }
}
