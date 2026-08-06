import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole, audit } from '@/lib/guards'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const BRANDING_KEYS = [
  'branding.companyName', 'branding.logoUrl', 'branding.primaryColor', 'branding.accentColor',
  'branding.faviconUrl', 'branding.loginMessage', 'branding.emailSender',
  'branding.secondaryColor', 'branding.backgroundColor', 'branding.customCss',
  'branding.activeTheme',
]

export async function GET() {
  try {
    const { error } = await requireRole('OWNER', 'SUPER_ADMIN')
    if (error) return error

    const settings = await db.setting.findMany({
      where: { key: { startsWith: 'branding.' } },
    })
    const map: Record<string, string> = {}
    for (const s of settings) map[s.key] = s.value

    const data = {
      companyName: map['branding.companyName'] || 'HPHRMS Enterprise',
      logoUrl: map['branding.logoUrl'] || '/logo.png',
      primaryColor: map['branding.primaryColor'] || '#002B5C',
      accentColor: map['branding.accentColor'] || '#D4AF37',
      faviconUrl: map['branding.faviconUrl'] || '/favicon.ico',
      loginMessage: map['branding.loginMessage'] || 'Welcome to your HR management portal.',
      emailSender: map['branding.emailSender'] || 'HPHRMS System',
      secondaryColor: map['branding.secondaryColor'] || '#1a3a6b',
      backgroundColor: map['branding.backgroundColor'] || '#ffffff',
      customCss: map['branding.customCss'] || '/* Custom CSS overrides */\n.hero-section {\n  min-height: 60vh;\n}',
      activeTheme: map['branding.activeTheme'] || 'navy',
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
    const validKeys = new Set(BRANDING_KEYS)

    for (const [k, v] of Object.entries(body)) {
      if (!validKeys.has(k)) continue
      await db.setting.upsert({
        where: { key: k },
        update: { value: String(v) },
        create: { key: k, value: String(v) },
      })
    }

    await audit(cu!.user.id, 'UPDATE', 'Branding', 'all', 'Updated branding settings')
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}
