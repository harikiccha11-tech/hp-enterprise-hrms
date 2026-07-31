import { db } from './db'
import { publish } from './sse-bus'

export async function notify(userId: string, title: string, message: string, type: string = 'INFO', link?: string) {
  const n = await db.notification.create({
    data: { userId, title, message, type, link },
  })
  // publish to SSE subscribers via the global bus (survives HMR)
  try {
    publish(userId, { type: 'notification', notification: { id: n.id, title, message, type, link, createdAt: n.createdAt } })
  } catch {}
  return n
}

export async function notifyMany(userIds: string[], title: string, message: string, type: string = 'ANNOUNCEMENT', link?: string) {
  for (const id of userIds) await notify(id, title, message, type, link)
}
