import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { audit } from '@/lib/audit'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const cu = await getCurrentUser()
    if (!cu) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const employeeId = cu.user.employee?.id
    if (!employeeId) return NextResponse.json({ error: 'No employee profile' }, { status: 400 })

    const today = new Date()
    const start = new Date(today.setHours(0, 0, 0, 0))
    const end = new Date(today.setHours(23, 59, 59, 999))
    const todayRecord = await db.attendance.findFirst({ where: { employeeId, date: { gte: start, lte: end } } })

    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    const monthRecords = await db.attendance.findMany({ where: { employeeId, date: { gte: monthStart } }, orderBy: { date: 'desc' } })
    const presentDays = monthRecords.filter(r => ['PRESENT', 'LATE'].includes(r.status)).length
    const totalHours = monthRecords.reduce((s, r) => s + (r.workingHours || 0), 0)

    return NextResponse.json({ todayRecord, monthRecords, stats: { presentDays, totalHours: Math.round(totalHours * 10) / 10 } })
  } catch (e) {
    return NextResponse.json({ error: 'Request failed' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const cu = await getCurrentUser()
  if (!cu) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const employeeId = cu.user.employee?.id
  if (!employeeId) return NextResponse.json({ error: 'No employee profile' }, { status: 400 })

  try {
    const body = await req.json()
    const { action } = body // punch_in | punch_out
    const now = new Date()
    const today = new Date(now); today.setHours(0, 0, 0, 0)
    const endOfDay = new Date(now); endOfDay.setHours(23, 59, 59, 999)

    let record = await db.attendance.findFirst({ where: { employeeId, date: { gte: today, lte: endOfDay } } })

    // Location data from the browser (geolocation API)
    const lat = body.lat ? Number(body.lat) : null
    const lng = body.lng ? Number(body.lng) : null
    const address = body.address ? String(body.address) : null

    if (action === 'punch_in') {
      if (record && record.punchIn) return NextResponse.json({ error: 'Already punched in today' }, { status: 400 })
      // late check
      const s = await db.setting.findUnique({ where: { key: 'payroll.workStartTime' } })
      const grace = await db.setting.findUnique({ where: { key: 'payroll.lateGraceMinutes' } })
      let late = false
      if (s) {
        const [hh, mm] = s.value.split(':').map(Number)
        const start = new Date(today); start.setHours(hh, mm, 0, 0)
        const g = Number(grace?.value || 15)
        if (now.getTime() > start.getTime() + g * 60000) late = true
      }
      const locData: any = {
        punchIn: now,
        status: late ? 'LATE' : 'PRESENT',
        lateArrival: late,
        punchInLat: lat,
        punchInLng: lng,
        punchInAddress: address,
      }
      if (record) {
        record = await db.attendance.update({ where: { id: record.id }, data: locData })
      } else {
        record = await db.attendance.create({ data: { employeeId, date: today, ...locData } })
      }
      await audit(cu.user.id, 'PUNCH_IN', 'Attendance', record.id, address ? `at ${address}` : '')
    } else if (action === 'punch_out') {
      if (!record || !record.punchIn) return NextResponse.json({ error: 'Please punch in first' }, { status: 400 })
      if (record.punchOut) return NextResponse.json({ error: 'Already punched out' }, { status: 400 })
      const diff = (now.getTime() - new Date(record.punchIn).getTime()) / 3600000
      const workingHours = Math.round(diff * 100) / 100
      const overtime = Math.max(0, Math.round((diff - 9) * 100) / 100)
      record = await db.attendance.update({
        where: { id: record.id },
        data: {
          punchOut: now, workingHours, overtime,
          punchOutLat: lat, punchOutLng: lng, punchOutAddress: address,
        },
      })
      await audit(cu.user.id, 'PUNCH_OUT', 'Attendance', record.id, `${workingHours}h ${address ? 'at ' + address : ''}`)
    }
    return NextResponse.json({ ok: true, record })
  } catch (e) {
    console.error('punch error', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
