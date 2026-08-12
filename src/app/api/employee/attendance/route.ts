import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { audit } from '@/lib/audit'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Save a base64 selfie image to disk and return the relative file path */
async function saveSelfie(employeeId: string, action: string, base64Data: string): Promise<string> {
  // Strip data URL prefix if present
  const matches = base64Data.match(/^data:image\/(\w+);base64,(.+)$/)
  const ext = matches ? matches[1] : 'jpg'
  const data = matches ? matches[2] : base64Data

  const dir = path.join(process.cwd(), 'upload', 'attendance', employeeId)
  await mkdir(dir, { recursive: true })

  const fileName = `${action}_${new Date().toISOString().replace(/[:.]/g, '-')}.${ext}`
  const filePath = path.join(dir, fileName)
  await writeFile(filePath, Buffer.from(data, 'base64'))

  return `attendance/${employeeId}/${fileName}`
}

/** Count working days in a month (exclude Sundays) */
function workingDaysInMonth(year: number, month: number): number {
  const daysInMonth = new Date(year, month, 0).getDate()
  let count = 0
  for (let d = 1; d <= daysInMonth; d++) {
    const day = new Date(year, month - 1, d).getDay()
    if (day !== 0) count++
  }
  return count
}

export async function GET() {
  try {
    const cu = await getCurrentUser()
    if (!cu) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const employeeId = cu.user.employee?.id
    if (!employeeId) return NextResponse.json({ error: 'No employee profile' }, { status: 400 })

    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const start = new Date(today); start.setHours(0, 0, 0, 0)
    const end = new Date(today); end.setHours(23, 59, 59, 999)
    const todayRecord = await db.attendance.findFirst({ where: { employeeId, date: { gte: start, lte: end } } })

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthRecords = await db.attendance.findMany({ where: { employeeId, date: { gte: monthStart } }, orderBy: { date: 'desc' } })

    const presentDays = monthRecords.filter(r => ['PRESENT', 'LATE'].includes(r.status)).length
    const halfDays = monthRecords.filter(r => r.status === 'HALF_DAY').length
    const lateDays = monthRecords.filter(r => r.status === 'LATE').length
    const leaveDays = monthRecords.filter(r => ['LEAVE', 'ON_LEAVE', 'WFH'].includes(r.status)).length
    const totalHours = Math.round(monthRecords.reduce((s, r) => s + (r.workingHours || 0), 0) * 100) / 100
    const overtimeTotal = Math.round(monthRecords.reduce((s, r) => s + (r.overtime || 0), 0) * 100) / 100

    // Working days in current month (excluding Sundays)
    const wDays = workingDaysInMonth(now.getFullYear(), now.getMonth() + 1)
    const absentDays = Math.max(0, Math.round((wDays - presentDays - leaveDays - halfDays * 0.5) * 10) / 10)
    const attendancePercentage = wDays > 0
      ? Math.round((presentDays + halfDays * 0.5) / wDays * 10000) / 100
      : 0

    return NextResponse.json({
      todayRecord,
      monthRecords,
      stats: {
        presentDays,
        absentDays,
        halfDays,
        lateDays,
        leaveDays,
        totalHours,
        overtimeTotal,
        workingDaysInMonth: wDays,
        attendancePercentage,
      },
    })
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
    const { action, selfie } = body // punch_in | punch_out, selfie = base64 string
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
      // Save selfie photo if provided
      if (selfie) {
        locData.punchInSelfie = await saveSelfie(employeeId, 'punch_in', selfie)
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
      const updateData: any = {
        punchOut: now, workingHours, overtime,
        punchOutLat: lat, punchOutLng: lng, punchOutAddress: address,
      }
      // Save selfie photo if provided
      if (selfie) {
        updateData.punchOutSelfie = await saveSelfie(employeeId, 'punch_out', selfie)
      }
      record = await db.attendance.update({
        where: { id: record.id },
        data: updateData,
      })
      await audit(cu.user.id, 'PUNCH_OUT', 'Attendance', record.id, `${workingHours}h ${address ? 'at ' + address : ''}`)
    }
    return NextResponse.json({ ok: true, record })
  } catch (e) {
    console.error('punch error', e)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
