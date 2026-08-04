import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, createSessionToken, setSessionCookie, audit } from '@/lib/auth'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
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
        mustResetPassword: false,
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

    const token = await createSessionToken({
      userId: user.id,
      username: user.username,
      role: user.role as 'OWNER' | 'SUPER_ADMIN' | 'HR_MANAGER' | 'EMPLOYEE' | 'CLIENT',
      accountId: account.id,
      accountType: account.accountType,
      clientRole: user.clientRole,
    })
    await setSessionCookie(token)

    try { await audit(user.id, 'ACCOUNT_CREATED', 'Account', account.id) } catch {}

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        accountId: account.id,
        accountType: account.accountType,
        clientRole: user.clientRole,
      },
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
