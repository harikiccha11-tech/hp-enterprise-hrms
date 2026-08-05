import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { type, companyName, contactName, email, phone, address, plan, employeeCount, message } = body

    const requestType = type || 'subscription'

    // Newsletter type — only contactName and email are required
    if (requestType === 'newsletter') {
      if (!contactName || !email) {
        return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
      }

      const normalizedEmail = String(email).trim().toLowerCase()

      // Duplicate prevention: check for existing newsletter subscription
      const recent = await db.subscriptionRequest.findFirst({
        where: { email: normalizedEmail, plan: 'newsletter' },
        orderBy: { createdAt: 'desc' },
      })
      if (recent) {
        return NextResponse.json({
          ok: true,
          message: 'You are already subscribed! Thank you for your interest.',
        })
      }

      const record = await db.subscriptionRequest.create({
        data: {
          companyName: companyName ? String(companyName).trim() : String(contactName).trim(),
          contactName: String(contactName).trim(),
          email: normalizedEmail,
          plan: 'newsletter',
          message: 'Newsletter subscription',
        },
      })

      return NextResponse.json({
        ok: true,
        id: record.id,
        message: 'You are subscribed! Welcome to HPHRMS AI updates.',
      })
    }

    // Demo / subscription type
    if (!companyName || !contactName || !email) {
      return NextResponse.json({ error: 'Company name, contact name, and email are required' }, { status: 400 })
    }

    const validPlans = [
      'free', 'starter', 'standard', 'professional', 'business',
      'enterprise', 'enterprise plus', 'enterprise-plus', 'custom', 'newsletter',
    ]

    const normalizedPlan = plan ? String(plan).trim().toLowerCase() : 'professional'
    if (!validPlans.includes(normalizedPlan)) {
      return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 })
    }

    const record = await db.subscriptionRequest.create({
      data: {
        companyName: String(companyName).trim(),
        contactName: String(contactName).trim(),
        email: String(email).trim().toLowerCase(),
        phone: phone ? String(phone).trim() : null,
        address: address ? String(address).trim() : null,
        plan: normalizedPlan,
        employeeCount: employeeCount ? String(employeeCount).trim() : null,
        message: message ? String(message).trim() : null,
      },
    })

    const responseMessage = requestType === 'demo'
      ? 'Demo request submitted! Our team will contact you within 24 hours.'
      : 'Thank you! Your subscription request has been submitted. Our team will contact you within 24 hours.'

    return NextResponse.json({
      ok: true,
      id: record.id,
      message: responseMessage,
    })
  } catch (e) {
    console.error('Subscription request error:', e)
    return NextResponse.json({ error: 'Failed to submit request' }, { status: 500 })
  }
}
