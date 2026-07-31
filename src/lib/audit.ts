import { db } from './db'
import { headers } from 'next/headers'

export async function audit(
  userId: string | null,
  action: string,
  entity: string,
  entityId?: string,
  details?: string
) {
  try {
    let ip = 'unknown'
    try {
      const h = await headers()
      ip = h.get('x-forwarded-for') || h.get('x-real-ip') || 'unknown'
    } catch {}
    await db.auditLog.create({
      data: { userId, action, entity, entityId, details, ip },
    })
  } catch (e) {
    // never let audit failure break a request
    console.error('audit log error', e)
  }
}
