// HP ENTERPRISE — Auth utilities (JWT + cookie sessions, password hashing)
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { db } from './db'

// Re-export for backwards compatibility — many routes import { audit } from '@/lib/auth'
export { audit } from './audit'

const SESSION_COOKIE = 'hpe_session'
const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'hpe-hrms-dev-secret-change-in-production-0123456789'
)

export const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

export interface SessionPayload {
  userId: string
  username: string
  role: 'OWNER' | 'SUPER_ADMIN' | 'HR_MANAGER' | 'EMPLOYEE' | 'CLIENT'
  employeeId?: string
  // Dual-mode fields
  accountId?: string
  accountType?: 'hrms_saas' | 'manpower_supply' | 'hybrid'
  clientRole?: 'admin' | 'hr' | 'manager' | 'employee' | 'viewer'
}

// --- Password hashing (Web Crypto, works in edge/node) ---
export async function hashPassword(password: string): Promise<string> {
  const enc = new TextEncoder()
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    256
  )
  const hashArr = new Uint8Array(bits)
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('')
  const hashHex = Array.from(hashArr).map(b => b.toString(16).padStart(2, '0')).join('')
  return `pbkdf2$100000$${saltHex}$${hashHex}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$')
  if (parts.length !== 4 || parts[0] !== 'pbkdf2') return false
  const iterations = parseInt(parts[1])
  const salt = Uint8Array.from(parts[2].match(/.{2}/g)!.map(h => parseInt(h, 16)))
  const expected = parts[3]
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    keyMaterial,
    256
  )
  const hashHex = Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2, '0')).join('')
  return hashHex === expected
}

// --- JWT ---
export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + SESSION_MAX_AGE)
    .sign(SECRET)
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET)
    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}

// --- Cookie helpers (server) ---
export async function setSessionCookie(token: string) {
  const c = await cookies()
  c.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  })
}

export async function clearSessionCookie() {
  const c = await cookies()
  c.delete(SESSION_COOKIE)
}

export async function getSession(): Promise<SessionPayload | null> {
  const c = await cookies()
  const token = c.get(SESSION_COOKIE)?.value
  if (!token) return null
  return verifySessionToken(token)
}

export async function getCurrentUser() {
  const session = await getSession()
  if (!session) return null
  const user = await db.user.findUnique({
    where: { id: session.userId },
    include: { employee: true, account: true },
  })
  if (!user) return null
  if (user.locked) return null
  return { session, user }
}

// --- Dual-mode helpers ---

/** Get account type from session (falls back to 'hrms_saas' for backward compat) */
export async function getAccountType(): Promise<'hrms_saas' | 'manpower_supply' | 'hybrid'> {
  const session = await getSession()
  return session?.accountType ?? 'hrms_saas'
}

/** Get client-level role from session (falls back to 'employee' for backward compat) */
export async function getClientRole(): Promise<'admin' | 'hr' | 'manager' | 'employee' | 'viewer'> {
  const session = await getSession()
  if (!session) return 'employee'
  // OWNER/SUPER_ADMIN users are treated as account admins
  if (session.role === 'OWNER' || session.role === 'SUPER_ADMIN') return 'admin'
  return session.clientRole ?? 'employee'
}

// --- Role checks ---
export function hasRole(session: SessionPayload | null, ...roles: string[]): boolean {
  if (!session) return false
  return roles.includes(session.role)
}

export function canManagePayroll(role: string) {
  return role === 'OWNER' || role === 'SUPER_ADMIN'
}
export function canManageEmployees(role: string) {
  return role === 'OWNER' || role === 'SUPER_ADMIN' || role === 'HR_MANAGER'
}
export function canChangeSettings(role: string) {
  return role === 'OWNER'
}
export function canManageUsers(role: string) {
  return role === 'OWNER'
}
