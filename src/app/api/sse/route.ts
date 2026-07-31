import { NextRequest } from 'next/server'
import { verifySessionToken } from '@/lib/auth'
import { subscribe } from '@/lib/sse-bus'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// NOTE: subscribe/publish now live in @/lib/sse-bus (globalThis singleton)
// so listeners survive Turbopack HMR module re-evaluations.

export async function GET(req: NextRequest) {
  const token = req.cookies.get('hpe_session')?.value
  const session = token ? await verifySessionToken(token) : null
  if (!session) return new Response('Unauthorized', { status: 401 })

  const stream = new ReadableStream({
    start(controller) {
      const enc = new TextEncoder()
      const send = (data: any) => {
        try { controller.enqueue(enc.encode(`data: ${JSON.stringify(data)}\n\n`)) } catch {}
      }
      // initial heartbeat
      send({ type: 'connected', at: new Date().toISOString() })

      const unsub = subscribe(session.userId, send)

      const heartbeat = setInterval(() => {
        try { controller.enqueue(enc.encode(`:heartbeat\n\n`)) } catch {}
      }, 25000)

      req.signal.addEventListener('abort', () => {
        clearInterval(heartbeat)
        unsub()
        try { controller.close() } catch {}
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
