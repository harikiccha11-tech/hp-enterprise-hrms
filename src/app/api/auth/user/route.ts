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
    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        full_name: user.employee?.fullName ?? user.username,
        client_role: user.clientRole,
        department: user.employee?.department ?? null,
      },
    })
  } catch (e) {
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}
