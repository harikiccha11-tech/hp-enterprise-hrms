import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const cu = await getCurrentUser()
    if (!cu) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const accountId = cu.user.accountId
    if (!accountId) {
      // Default branding for users without an account
      return NextResponse.json({
        display_name: 'HPHRMS',
        primary_color: '#16213E',
        accent_color: '#E8A33D',
        sidebar_style: 'dark',
        hide_hphrms_branding: false,
      })
    }

    const branding = await db.clientBranding.findUnique({
      where: { accountId },
    })

    if (!branding) {
      return NextResponse.json({
        display_name: 'HPHRMS',
        primary_color: '#16213E',
        accent_color: '#E8A33D',
        sidebar_style: 'dark',
        hide_hphrms_branding: false,
      })
    }

    return NextResponse.json({
      display_name: branding.displayName || 'HPHRMS',
      logo_url: branding.logoUrl || undefined,
      primary_color: branding.primaryColor,
      accent_color: branding.accentColor,
      sidebar_style: branding.sidebarStyle,
      support_email: branding.supportEmail || undefined,
      support_phone: branding.supportPhone || undefined,
      hide_hphrms_branding: branding.hideHphrmsBranding,
    })
  } catch (e) {
    console.error('[Portal Branding]', e)
    return NextResponse.json({ error: 'Failed to load branding' }, { status: 500 })
  }
}
