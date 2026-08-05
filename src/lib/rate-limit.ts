/**
 * HPHRMS Rate Limiter — in-memory implementation.
 * To upgrade to Redis, replace the Map + check function with
 * ioredis INCR + EXPIRE commands. The interface stays identical.
 */

interface RateLimitEntry {
  count: number
  windowStart: number
}

const store = new Map<string, RateLimitEntry>()

// Periodic cleanup every 10 minutes to prevent memory leak
const CLEANUP_INTERVAL_MS = 10 * 60 * 1000
let lastCleanup = Date.now()

function cleanup() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return
  lastCleanup = now
  for (const [key, entry] of store) {
    // Remove entries older than 2 hours (generous buffer beyond any window)
    if (now - entry.windowStart > 2 * 60 * 60 * 1000) {
      store.delete(key)
    }
  }
}

/**
 * Check if the request should be allowed.
 * @returns true if allowed, false if rate limited
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number,
): boolean {
  cleanup()
  const now = Date.now()
  const entry = store.get(key)
  if (!entry || now - entry.windowStart > windowMs) {
    store.set(key, { count: 1, windowStart: now })
    return true
  }
  if (entry.count >= maxRequests) {
    return false
  }
  entry.count++
  return true
}

/**
 * Extract client IP from request headers.
 * Handles proxy chains (x-forwarded-for may be comma-separated).
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  const realIp = req.headers.get('x-real-ip')
  if (realIp) return realIp.trim()
  return 'unknown'
}
