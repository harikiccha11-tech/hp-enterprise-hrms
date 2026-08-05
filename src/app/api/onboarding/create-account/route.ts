import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, audit, getSession } from '@/lib/auth'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

export const runtime = 'nodejs'

// Rate limit: 3 account creation attempts per hour per IP
const MAX_ACCOUNT_CREATIONS = 3
const WINDOW_MS = 60 * 60 * 1000

export async function POST(req: NextRequest) {
  // Rate limiting first — before any auth check
  const ip = getClientIp(req)
  if (!checkRateLimit(`onboarding:${ip}`, MAX_ACCOUNT_CREATIONS, WINDOW_MS)) {
    return NextResponse.json(
      { error: 'Too many account creation attempts. Please try again later.' },
      { status: 429 }
    )
  }

  // Auth check — only authenticated OWNER or SUPER_ADMIN can create new tenant accounts
  const session = await getSession()
  if (!session || (session.role !== 'OWNER' && session.role !== 'SUPER_ADMIN')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const {
      organizationName,
      accountType,
      contactEmail,
      contactPhone,
      adminName,
      adminEmail,
      adminPassword,
      city,
      state,
      pincode,
    } = body

    if (!organizationName || !accountType || !adminName || !adminEmail || !adminPassword) {
      return NextResponse.json(
        { error: 'Organization name, account type, admin name, email, and password are required' },
        { status: 400 }
      )
    }

    if (!['hrms_saas', 'manpower_supply', 'hybrid'].includes(accountType)) {
      return NextResponse.json({ error: 'Invalid account type' }, { status: 400 })
    }

    if (adminPassword.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    const existingUser = await db.user.findUnique({ where: { email: adminEmail.toLowerCase().trim() } })
    if (existingUser) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 409 })
    }

    const account = await db.account.create({
      data: {
        organizationName,
        accountType,
        status: 'active',
        billingContactEmail: contactEmail || adminEmail,
        billingPhone: contactPhone,
        city,
        state,
        pincode,
      },
    })

    const passwordHash = await hashPassword(adminPassword)
    const username = adminEmail.toLowerCase().trim().split('@')[0]
    const user = await db.user.create({
      data: {
        username,
        email: adminEmail.toLowerCase().trim(),
        passwordHash,
        role: 'SUPER_ADMIN',
        accountId: account.id,
        clientRole: 'admin',
        mustResetPassword: true,
      },
    })

    await db.employee.create({
      data: {
        fullName: adminName,
        email: adminEmail.toLowerCase().trim(),
        designation: 'Administrator',
        department: 'Management',
        userId: user.id,
        accountId: account.id,
        employeeType: 'internal',
        status: 'APPROVED',
        employmentType: 'Full-time',
      },
    })

    // Do NOT auto-login — new admin must authenticate separately
    try { await audit(session.userId, 'ACCOUNT_CREATED', 'Account', account.id) } catch {}

    return NextResponse.json({
      success: true,
      message: 'Account created successfully. The new administrator will receive login credentials.',
      account: {
        id: account.id,
        organizationName: account.organizationName,
        accountType: account.accountType,
        status: account.status,
      },
    })
  } catch (e) {
    console.error('Create account error:', e)
    return NextResponse.json({ error: 'Failed to create account. Please try again.' }, { status: 500 })
  }
}
