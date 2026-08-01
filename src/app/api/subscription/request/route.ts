import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { companyName, contactName, email, phone, address, plan, employeeCount, message } = body

    if (!companyName || !contactName || !email || !plan) {
      return NextResponse.json({ error: 'Company name, contact name, email and plan are required' }, { status: 400 })
    }

    const validPlans = ['free', 'starter', 'professional', 'enterprise']
    if (!validPlans.includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 })
    }

    const record = await db.subscriptionRequest.create({
      data: {
        companyName: String(companyName).trim(),
        contactName: String(contactName).trim(),
        email: String(email).trim().toLowerCase(),
        phone: phone ? String(phone).trim() : null,
        address: address ? String(address).trim() : null,
        plan,
        employeeCount: employeeCount ? String(employeeCount).trim() : null,
        message: message ? String(message).trim() : null,
      },
    })

    return NextResponse.json({
      ok: true,
      id: record.id,
      message: 'Thank you! Your subscription request has been submitted. Our team will contact you within 24 hours.',
    })
  } catch (e: any) {
    console.error('Subscription request error:', e)
    return NextResponse.json({ error: 'Failed to submit request' }, { status: 500 })
  }
}
