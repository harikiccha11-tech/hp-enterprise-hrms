'use client'
import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { StatCard, StatusBadge, EmptyState } from '@/components/shared'
import { toast } from 'sonner'
import {
  LogIn,
  LogOut,
  Clock,
  CalendarCheck,
  Timer,
  AlertTriangle,
  TrendingUp,
  Fingerprint,
  MapPin,
  LocateFixed,
} from 'lucide-react'
import { fmtTime, hoursBetween } from '../lib'
import { format } from 'date-fns'
import { SelfieCapture } from './SelfieCapture'

interface AttendanceRow {
  id: string
  date: string
  punchIn: string | null
  punchOut: string | null
  workingHours: number | null
  overtime: number | null
  status: string
  lateArrival: boolean
  punchInLat?: number | null
  punchInLng?: number | null
  punchInAddress?: string | null
  punchOutLat?: number | null
  punchOutLng?: number | null
  punchOutAddress?: string | null
  punchInSelfie?: string | null
  punchOutSelfie?: string | null
}

interface AttendanceData {
  todayRecord: AttendanceRow | null
  monthRecords: AttendanceRow[]
  stats: { presentDays: number; totalHours: number }
}

// Capture browser geolocation + reverse-geocode to an address
function captureLocation(): Promise<{ lat: number; lng: number; address: string } | null> {
  return new Promise((resolve) => {
    if (!('geolocation' in navigator)) {
      resolve(null)
      return
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        let address = `${lat.toFixed(5)}, ${lng.toFixed(5)}`
        try {
          const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&zoom=16`, {
            headers: { 'Accept': 'application/json' },
          })
          if (r.ok) {
            const j = await r.json()
            if (j.display_name) address = j.display_name
          }
        } catch {}
        resolve({ lat, lng, address })
      },
      () => resolve(null),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
    )
  })
}

export function Attendance({ refreshKey }: { refreshKey: number }) {
  const [data, setData] = useState<AttendanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [punching, setPunching] = useState<'punch_in' | 'punch_out' | null>(null)
  const [now, setNow] = useState(new Date())
  const [locStatus, setLocStatus] = useState<'idle' | 'capturing'>('idle')
  const [selfieOpen, setSelfieOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<'punch_in' | 'punch_out' | null>(null)
  const [pendingSelfie, setPendingSelfie] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/employee/attendance', { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed')
      setData(json)
    } catch (e: any) {
      toast.error(e.message || 'Failed to load attendance')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load, refreshKey])

  // Live timer while punched in
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const today = data?.todayRecord || null
  const isPunchedIn = !!today?.punchIn
  const isPunchedOut = !!today?.punchOut

  const liveHours = isPunchedIn && !isPunchedOut && today?.punchIn
    ? hoursBetween(today.punchIn, now)
    : (today?.workingHours || 0)

  // When user clicks punch in/out, open selfie camera first
  const handlePunchClick = (action: 'punch_in' | 'punch_out') => {
    setPendingAction(action)
    setSelfieOpen(true)
  }

  // After selfie is captured, proceed with punch
  const handleSelfieSubmit = async (selfieBase64: string) => {
    setSelfieOpen(false)
    setPendingSelfie(selfieBase64)
    if (pendingAction) {
      await doPunch(pendingAction, selfieBase64)
    }
    setPendingAction(null)
    setPendingSelfie(null)
  }

  const handleSelfieCancel = () => {
    setSelfieOpen(false)
    setPendingAction(null)
  }

  const doPunch = async (action: 'punch_in' | 'punch_out', selfie?: string | null) => {
    setPunching(action)
    setLocStatus('capturing')
    try {
      const loc = await captureLocation()
      setLocStatus('idle')
      const payload: any = { action }
      if (loc) {
        payload.lat = loc.lat
        payload.lng = loc.lng
        payload.address = loc.address
      }
      if (selfie) {
        payload.selfie = selfie
      }
      const res = await fetch('/api/employee/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Punch failed')
      if (loc) {
        toast.success(action === 'punch_in' ? `Punched in at ${loc.address.slice(0, 50)}` : `Punched out at ${loc.address.slice(0, 50)}`)
      } else {
        toast.success(action === 'punch_in' ? 'Punched in successfully' : 'Punched out successfully')
      }
      load()
    } catch (e: any) {
      toast.error(e.message || 'Punch failed')
    } finally {
      setPunching(null)
      setLocStatus('idle')
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-56 w-full rounded-2xl" />
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
        </div>
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
    )
  }

  const monthRecords = data?.monthRecords || []
  const totalHours = data?.stats.totalHours || 0
  const presentDays = data?.stats.presentDays || 0
  const lateDays = monthRecords.filter(r => r.lateArrival).length
  const overtimeTotal = monthRecords.reduce((s, r) => s + (r.overtime || 0), 0)

  return (
    <div className="space-y-6">
      {/* Selfie capture modal */}
      {pendingAction && (
        <SelfieCapture
          open={selfieOpen}
          action={pendingAction}
          onSubmit={handleSelfieSubmit}
          onCancel={handleSelfieCancel}
        />
      )}

      {/* Punch card */}
      <Card className="overflow-hidden border-0 shadow-lg">
        <div className="relative">
          <div className="absolute inset-0 hpe-sidebar-gradient" />
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 90% 0%, #C9A961 0, transparent 50%), radial-gradient(circle at 10% 100%, #16306B 0, transparent 50%)' }} />
          <CardContent className="relative p-6 sm:p-8">
            <div className="grid gap-6 md:grid-cols-2 md:items-center">
              {/* Left: status */}
              <div className="text-white">
                <div className="flex items-center gap-2 text-[var(--gold-light)]">
                  <Fingerprint className="h-5 w-5" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Today's Attendance</span>
                </div>
                <p className="mt-1 text-2xl font-bold sm:text-3xl">
                  {isPunchedOut ? 'Day Completed' : isPunchedIn ? 'You are Clocked In' : 'Not Clocked In Yet'}
                </p>
                <p className="mt-1 text-sm text-blue-100/80">{format(now, 'EEEE, dd MMMM yyyy')}</p>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-white/15 bg-white/10 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-blue-100/70">Punch In</p>
                    <p className="mt-0.5 text-base font-bold text-emerald-300">{today?.punchIn ? fmtTime(today.punchIn) : '—'}</p>
                    {today?.punchInAddress && (
                      <p className="mt-1 flex items-start gap-1 text-[10px] text-blue-100/60 leading-tight">
                        <MapPin className="mt-0.5 h-2.5 w-2.5 shrink-0" />
                        <span className="line-clamp-2">{today.punchInAddress}</span>
                      </p>
                    )}
                    {today?.punchInSelfie && (
                      <p className="mt-1 text-[10px] text-emerald-300/80">✓ Selfie captured</p>
                    )}
                  </div>
                  <div className="rounded-lg border border-white/15 bg-white/10 p-3">
                    <p className="text-[10px] uppercase tracking-wider text-blue-100/70">Punch Out</p>
                    <p className="mt-0.5 text-base font-bold text-rose-300">{today?.punchOut ? fmtTime(today.punchOut) : '—'}</p>
                    {today?.punchOutAddress && (
                      <p className="mt-1 flex items-start gap-1 text-[10px] text-blue-100/60 leading-tight">
                        <MapPin className="mt-0.5 h-2.5 w-2.5 shrink-0" />
                        <span className="line-clamp-2">{today.punchOutAddress}</span>
                      </p>
                    )}
                    {today?.punchOutSelfie && (
                      <p className="mt-1 text-[10px] text-emerald-300/80">✓ Selfie captured</p>
                    )}
                  </div>
                </div>
                {locStatus === 'capturing' && (
                  <div className="mt-3 inline-flex items-center gap-2 rounded-md bg-[var(--gold)]/20 px-2.5 py-1 text-xs font-medium text-[var(--gold-light)]">
                    <LocateFixed className="h-3.5 w-3.5 animate-pulse" /> Capturing your location…
                  </div>
                )}
                {today?.lateArrival && (
                  <div className="mt-3 inline-flex items-center gap-2 rounded-md bg-amber-500/20 px-2.5 py-1 text-xs font-medium text-amber-300">
                    <AlertTriangle className="h-3.5 w-3.5" /> Late arrival marked
                  </div>
                )}
              </div>

              {/* Right: live timer + buttons */}
              <div className="rounded-xl border border-white/15 bg-white/10 p-5 backdrop-blur-sm">
                <div className="flex items-center gap-2 text-blue-100/80">
                  <Timer className="h-4 w-4" />
                  <span className="text-xs uppercase tracking-wider">Working Hours</span>
                </div>
                <p className="mt-1 font-mono text-4xl font-black tracking-tight text-white">
                  {formatDuration(liveHours)}
                </p>
                {isPunchedIn && !isPunchedOut && (
                  <p className="mt-1 text-xs text-emerald-300">● Live tracking</p>
                )}
                {isPunchedOut && (today?.overtime || 0) > 0 && (
                  <p className="mt-1 text-xs text-[var(--gold-light)]">Overtime: {today.overtime} hrs</p>
                )}

                <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                  <Button
                    onClick={() => handlePunchClick('punch_in')}
                    disabled={isPunchedIn || !!punching}
                    className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    <LogIn className="mr-2 h-4 w-4" />
                    {punching === 'punch_in' ? 'Punching…' : 'Punch In'}
                  </Button>
                  <Button
                    onClick={() => handlePunchClick('punch_out')}
                    disabled={!isPunchedIn || isPunchedOut || !!punching}
                    className="flex-1 bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    {punching === 'punch_out' ? 'Punching…' : 'Punch Out'}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={CalendarCheck} label="Present Days (Month)" value={presentDays} accent="navy" sub="Including today" />
        <StatCard icon={Clock} label="Total Hours" value={`${totalHours}h`} accent="gold" sub="This month" />
        <StatCard icon={AlertTriangle} label="Late Arrivals" value={lateDays} accent="amber" sub="This month" />
        <StatCard icon={TrendingUp} label="Overtime" value={`${overtimeTotal.toFixed(1)}h`} accent="green" sub="This month" />
      </div>

      {/* History table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Attendance History — {format(new Date(), 'MMMM yyyy')}</CardTitle>
        </CardHeader>
        <CardContent>
          {monthRecords.length === 0 ? (
            <EmptyState icon={CalendarCheck} title="No attendance records yet" desc="Your punch history for this month will appear here." />
          ) : (
            <div className="max-h-[28rem] overflow-y-auto scroll-thin">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-card">
                  <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">Date</th>
                    <th className="py-2 pr-4 font-medium">Punch In</th>
                    <th className="py-2 pr-4 font-medium">Punch Out</th>
                    <th className="py-2 pr-4 font-medium">Hours</th>
                    <th className="py-2 pr-4 font-medium">OT</th>
                    <th className="py-2 pr-4 font-medium">Selfie</th>
                    <th className="py-2 pr-4 font-medium">Location</th>
                    <th className="py-2 pr-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {monthRecords.map((r) => (
                    <tr key={r.id} className="border-b last:border-0 hover:bg-muted/40">
                      <td className="py-2.5 pr-4 font-medium text-[var(--navy)] dark:text-white">{format(new Date(r.date), 'dd MMM')}</td>
                      <td className="py-2.5 pr-4">{r.punchIn ? fmtTime(r.punchIn) : '—'}</td>
                      <td className="py-2.5 pr-4">{r.punchOut ? fmtTime(r.punchOut) : '—'}</td>
                      <td className="py-2.5 pr-4">{r.workingHours != null ? `${r.workingHours}h` : '—'}</td>
                      <td className="py-2.5 pr-4">{r.overtime ? `${r.overtime}h` : '—'}</td>
                      <td className="py-2.5 pr-4">
                        <div className="flex gap-1">
                          {r.punchInSelfie ? (
                            <img src={`/api/uploads/${r.punchInSelfie}`} alt="In" className="h-6 w-6 rounded-full object-cover border border-emerald-400" />
                          ) : <span className="text-muted-foreground text-xs">—</span>}
                          {r.punchOutSelfie ? (
                            <img src={`/api/uploads/${r.punchOutSelfie}`} alt="Out" className="h-6 w-6 rounded-full object-cover border border-rose-400" />
                          ) : <span className="text-muted-foreground text-xs">—</span>}
                        </div>
                      </td>
                      <td className="py-2.5 pr-4 max-w-[150px]">
                        {r.punchInAddress ? (
                          <span className="flex items-start gap-1 text-xs text-muted-foreground">
                            <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-[var(--gold)]" />
                            <span className="line-clamp-1" title={r.punchInAddress}>{r.punchInAddress}</span>
                          </span>
                        ) : <span className="text-xs text-muted-foreground">—</span>}
                      </td>
                      <td className="py-2.5 pr-4">
                        <div className="flex items-center gap-1.5">
                          <StatusBadge status={r.status} />
                          {r.lateArrival && <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function formatDuration(h: number): string {
  const hours = Math.floor(h)
  const minutes = Math.floor((h - hours) * 60)
  const seconds = Math.floor(((h - hours) * 60 - minutes) * 60)
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}
