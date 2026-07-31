// SSE pub/sub bus — uses globalThis to survive HMR module re-evaluations
// This ensures listeners registered by the SSE route persist even when other
// route modules are recompiled by the dev server.

type Listener = (data: any) => void

const globalForSSE = globalThis as unknown as {
  __hpeSseListeners?: Map<string, Set<Listener>>
}

const listeners: Map<string, Set<Listener>> =
  globalForSSE.__hpeSseListeners ?? new Map<string, Set<Listener>>()
globalForSSE.__hpeSseListeners = listeners

export function subscribe(userId: string, fn: Listener): () => void {
  if (!listeners.has(userId)) listeners.set(userId, new Set())
  listeners.get(userId)!.add(fn)
  return () => {
    listeners.get(userId)?.delete(fn)
  }
}

export function publish(userId: string, data: any) {
  const subs = listeners.get(userId)
  if (!subs || subs.size === 0) return
  subs.forEach((fn) => {
    try {
      fn(data)
    } catch {}
  })
}

export function getListenerCount(): number {
  let total = 0
  listeners.forEach((s) => { total += s.size })
  return total
}
