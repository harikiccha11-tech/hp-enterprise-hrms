import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET() {
  const start = Date.now()
  let dbOk = false
  try {
    await db.$queryRaw`SELECT 1`
    dbOk = true
  } catch {
    // db not reachable
  }
  const latency = Date.now() - start

  const status = dbOk ? 'ok' : 'degraded'
  const statusCode = dbOk ? 200 : 503

  return NextResponse.json({
    status,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      database: dbOk ? 'ok' : 'error',
    },
    latency_ms: latency,
  }, { status: statusCode })
}
