import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole, audit } from '@/lib/guards'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const CMS_KEYS = [
  'website.heroTitle', 'website.heroSubtitle', 'website.ctaText',
  'website.footerText', 'website.metaDescription',
  'website.features', // JSON array
]

export async function GET() {
  try {
    const { error } = await requireRole('OWNER', 'SUPER_ADMIN')
    if (error) return error

    const settings = await db.setting.findMany({
      where: { key: { startsWith: 'website.' } },
    })
    const map: Record<string, string> = {}
    for (const s of settings) map[s.key] = s.value

    // Default values
    const data = {
      heroTitle: map['website.heroTitle'] || 'HPHRMS — AI-Powered Human Resource Management',
      heroSubtitle: map['website.heroSubtitle'] || 'Streamline your HR operations with intelligent automation and real-time analytics.',
      ctaText: map['website.ctaText'] || 'Start Free Trial',
      footerText: map['website.footerText'] || '© 2025 HPHRMS Technologies Pvt. Ltd. All rights reserved.',
      metaDescription: map['website.metaDescription'] || 'HPHRMS is a comprehensive AI-powered HR management system for modern Indian enterprises.',
      features: map['website.features'] ? JSON.parse(map['website.features']) : [
        'AI-Powered Payroll', 'Real-time Attendance', 'Smart Recruitment', 'Leave Management',
        'Performance Reviews', 'Compliance & Security',
      ],
    }

    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { error, cu } = await requireRole('OWNER', 'SUPER_ADMIN')
    if (error) return error

    const body = await req.json()
    const validKeys = new Set(CMS_KEYS)

    for (const [k, v] of Object.entries(body)) {
      if (!validKeys.has(k)) continue
      const val = typeof v === 'string' ? v : JSON.stringify(v)
      await db.setting.upsert({
        where: { key: k },
        update: { value: val },
        create: { key: k, value: val },
      })
    }

    await audit(cu!.user.id, 'UPDATE', 'WebsiteCMS', 'all', 'Updated website CMS')
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}
