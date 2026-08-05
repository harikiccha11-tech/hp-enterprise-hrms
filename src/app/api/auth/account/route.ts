import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const cu = await getCurrentUser()
    if (!cu) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { user } = cu
    if (!user.account) {
      return NextResponse.json({ account: null }, { status: 200 })
    }

    return NextResponse.json({
      account: {
        id: user.account.id,
        organizationName: user.account.organizationName,
        accountType: user.account.accountType,
        status: user.account.status,
        createdAt: user.account.createdAt.toISOString(),
      },
    })
  } catch (e) {
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}
