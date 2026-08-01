import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { requireRole, audit } from '@/lib/guards'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const KEYS = [
  'payroll.pfRate','payroll.pfEmployerRate','payroll.esiRate','payroll.esiEmployerRate',
  'payroll.professionalTax','payroll.standardWorkingDays','payroll.workStartTime',
  'payroll.workEndTime','payroll.lateGraceMinutes','payroll.overtimeRate',
  'leave.casualAnnual','leave.sickAnnual','leave.earnedAnnual','leave.carryForwardCap',
  'company.adminEmail',
]

export async function GET() {
  try {
    const { error } = await requireRole('OWNER', 'SUPER_ADMIN', 'HR_MANAGER')
    if (error) return error
    const settings = await db.setting.findMany()
    const map: Record<string, string> = {}
    for (const s of settings) map[s.key] = s.value
    for (const k of KEYS) if (!(k in map)) map[k] = ''
    return NextResponse.json({ settings: map })
  } catch (e) {
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  const { error, cu } = await requireRole('OWNER')
  if (error) return error
  try {
    const { settings } = await req.json()
    const validKeys = new Set(KEYS)
    for (const k of Object.keys(settings)) {
      if (!validKeys.has(k)) {
        return NextResponse.json({ error: `Invalid setting key: ${k}` }, { status: 400 })
      }
    }
    for (const [k, v] of Object.entries(settings)) {
      await db.setting.upsert({ where: { key: k }, update: { value: String(v) }, create: { key: k, value: String(v) } })
    }
    await audit(cu!.user.id, 'UPDATE_SETTINGS', 'Setting', 'all', 'Updated system settings')
    return NextResponse.json({ ok: true })
  } catch (e) { return NextResponse.json({ error: 'Failed' }, { status: 500 }) }
}