import { getCurrentUser } from './auth'
import { NextResponse } from 'next/server'

// Re-export for backwards compatibility — many admin routes import { audit } from '@/lib/guards'
export { audit } from './audit'

export async function requireRole(...roles: string[]) {
  const cu = await getCurrentUser()
  if (!cu) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), cu: null }
  }
  if (!roles.includes(cu.user.role)) {
    return { error: NextResponse.json({ error: 'Forbidden — insufficient permissions' }, { status: 403 }), cu: null }
  }
  return { error: null, cu }
}
