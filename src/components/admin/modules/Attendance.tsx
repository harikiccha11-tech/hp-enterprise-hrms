'use client'
import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { SectionTitle, StatusBadge, EmptyState } from '@/components/shared'
import { toast } from 'sonner'
import { Fingerprint, Calendar, Pencil, MapPin, Trash2, Download, Camera, Building2 } from 'lucide-react'
import { useAuth } from '@/lib/store'
import { api, fmtDate, fmtTime } from '../lib'

interface AttendanceRecord {
  id: string
  date: string
  punchIn: string | null
  punchOut: string | null
  workingHours: number | null
  overtime: number | null
  lateArrival: boolean
  status: string
  punchInLat?: number | null
  punchInLng?: number | null
  punchInAddress?: string | null
  punchOutLat?: number | null
  punchOutLng?: number | null
  punchOutAddress?: string | null
  punchInSelfie?: string | null
  punchOutSelfie?: string | null
  employee: {
    id: string
    fullName: string
    employeeCode: string | null
    designation: string | null
    department: string | null
    assignedClient?: { id: string; clientName: string } | null
  }
}

interface ClientOption {
  id: string
  clientName: string
}

const STATUS_OPTIONS = [
  { value: 'PRESENT', label: 'Present' },
  { value: 'LATE', label: 'Late' },
  { value: 'HALF_DAY', label: 'Half Day' },
  { value: 'ABSENT', label: 'Absent' },
  { value: 'LEAVE', label: 'On Leave' },
  { value: 'HOLIDAY', label: 'Holiday' },
]

/* ── Helper: Selfie thumbnail column cell ─────────── */
function SelfieCell(props: {
  record: AttendanceRecord
  onOpen: (url: string, label: string) => void
}) {
  const { record, onOpen } = props
  const hasIn = !!record.punchInSelfie
  const hasOut = !!record.punchOutSelfie

  if (!hasIn && !hasOut) {
    return <span className="text-xs text-muted-foreground">—</span>
  }

  const inUrl = '/api/uploads/' + (record.punchInSelfie || '')
  const outUrl = '/api/uploads/' + (record.punchOutSelfie || '')
  const base = record.employee.fullName + ' - ' + fmtDate(record.date)

  return (
    <div className="flex gap-1.5">
      {hasIn && (
        <button
          type="button"
          onClick={function () { onOpen(inUrl, 'Punch In - ' + base) }}
        >
          <img
            src={inUrl}
            alt="In"
            className="h-7 w-7 rounded-full object-cover border-2 border-emerald-400 hover:scale-110 transition-transform cursor-pointer"
          />
        </button>
      )}
      {hasOut && (
        <button
          type="button"
          onClick={function () { onOpen(outUrl, 'Punch Out - ' + base) }}
        >
          <img
            src={outUrl}
            alt="Out"
            className="h-7 w-7 rounded-full object-cover border-2 border-rose-400 hover:scale-110 transition-transform cursor-pointer"
          />
        </button>
      )}
    </div>
  )
}

/* ── Helper: Location link column cell ─────────────── */
function LocationCell(props: { record: AttendanceRecord }) {
  const { record } = props
  if (!record.punchInAddress) {
    return <span className="text-muted-foreground">—</span>
  }
  const href =
    'https://www.openstreetmap.org/?mlat=' +
    record.punchInLat +
    '&mlon=' +
    record.punchInLng +
    '#map=16/' +
    record.punchInLat +
    '/' +
    record.punchInLng

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-1 text-muted-foreground hover:text-[var(--navy)] dark:hover:text-[var(--gold)]"
      title={record.punchInAddress}
    >
      <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-[var(--gold)]" />
      <span className="line-clamp-1">{record.punchInAddress}</span>
    </a>
  )
}

/* ── Helper: Client name column cell ───────────────── */
function ClientNameCell(props: { record: AttendanceRecord }) {
  const client = props.record.employee.assignedClient
  const name = client ? client.clientName : ''
  if (!name) {
    return <span className="text-muted-foreground">—</span>
  }
  return <span className="text-xs">{name}</span>
}

/* ── Helper: Tracked location card in the sidebar ──── */
function LocationCard(props: { record: AttendanceRecord }) {
  const r = props.record
  const href =
    'https://www.openstreetmap.org/?mlat=' +
    r.punchInLat +
    '&mlon=' +
    r.punchInLng +
    '#map=16/' +
    r.punchInLat +
    '/' +
    r.punchInLng

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-start gap-2 rounded-lg border border-[var(--gold)]/20 bg-card p-2.5 hover:border-[var(--gold)] transition"
    >
      {r.punchInSelfie && (
        <img
          src={'/api/uploads/' + r.punchInSelfie}
          alt={r.employee.fullName}
          className="h-8 w-8 rounded-full object-cover border-2 border-[var(--gold)]/30"
        />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold text-[var(--navy)] dark:text-white">{r.employee.fullName}</p>
        <p className="truncate text-[11px] text-muted-foreground">{r.punchInAddress}</p>
        <p className="text-[10px] text-[var(--gold)] mt-0.5">
          {r.punchIn ? fmtTime(r.punchIn) : ''} → {r.punchOut ? fmtTime(r.punchOut) : 'working…'}
        </p>
      </div>
    </a>
  )
}

/* ── Main component ─────────────────────────────────── */
export function Attendance({ refreshKey }: { refreshKey: number }) {
  const { user } = useAuth()
  const isSuperAdmin = user?.role === 'OWNER' || user?.role === 'SUPER_ADMIN'
  const isClient = user?.role === 'CLIENT'
  const [list, setList] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [date, setDate] = useState('')
  const [clientId, setClientId] = useState<string | null>(null)
  const [clients, setClients] = useState<ClientOption[]>([])
  const [editing, setEditing] = useState<AttendanceRecord | null>(null)
  const [deleting, setDeleting] = useState<AttendanceRecord | null>(null)
  const [selfieView, setSelfieView] = useState<{ url: string; label: string } | null>(null)

  /* ── Load clients for filter dropdown ── */
  useEffect(
    function () {
      if (isClient) return
      api<{ clients: ClientOption[] }>('/api/admin/clients?limit=100')
        .then(function (d) {
          setClients(d.clients || [])
        })
        .catch(function () {
          /* ignore */
        })
    },
    [isClient],
  )

  /* ── Load attendance records ── */
  const load = useCallback(
    async function () {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (date) params.set('date', date)
        if (clientId) params.set('clientId', clientId)
        const data = await api<{ records: AttendanceRecord[] }>(
          '/api/admin/attendance?' + params.toString(),
        )
        setList(data.records || [])
      } catch (e: any) {
        toast.error(e.message || 'Failed to load attendance')
      } finally {
        setLoading(false)
      }
    },
    [date, clientId],
  )

  useEffect(
    function () {
      load()
    },
    [load, refreshKey],
  )

  /* ── Named handlers (no inline arrow fns in JSX) ── */
  const handleClientFilterChange = function (v: string) {
    if (v === '_all') {
      setClientId(undefined)
    } else {
      setClientId(v)
    }
  }

  const handleClearFilters = function () {
    setDate('')
    setClientId(undefined)
  }

  const handleOpenSelfie = function (url: string, label: string) {
    setSelfieView({ url: url, label: label })
  }

  const handleCloseSelfie = function () {
    setSelfieView(null)
  }

  const handleExportCSV = function () {
    const esc = function (s: string) {
      return '"' + s.replace(/"/g, '""') + '"'
    }
    const cols = [
      { key: 'employee.employeeCode', label: 'Code' },
      { key: 'employee.fullName', label: 'Name' },
      { key: 'employee.assignedClient.clientName', label: 'Client' },
      { key: 'date', label: 'Date' },
      { key: 'punchIn', label: 'Punch In' },
      { key: 'punchOut', label: 'Punch Out' },
      { key: 'workingHours', label: 'Hours' },
      { key: 'overtime', label: 'OT' },
      { key: 'status', label: 'Status' },
    ]
    let csv = cols.map(function (c) {
      return c.label
    }).join(',') + '\n'
    for (const r of list) {
      const row = cols
        .map(function (c) {
          const parts = c.key.split('.')
          let v: any = r
          for (const p of parts) {
            v = v && v[p]
          }
          return typeof v === 'string' ? esc(v) : v != null ? String(v) : ''
        })
        .join(',')
      csv += row + '\n'
    }
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'attendance_' + new Date().toISOString().slice(0, 10) + '.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  /* ── Pre-computed values (avoid complex expressions in JSX) ── */
  const trackedRecords = list.filter(function (r) {
    return r.punchInAddress
  })
  const trackedCount = trackedRecords.length
  const showLocationCards = !loading && list.length > 0 && trackedCount > 0
  const showClientFilter = !isClient && clients.length > 0
  const hasFilters = !!(date || clientId)
  const sectionDesc = isClient
    ? 'Attendance records for your assigned employees'
    : 'Daily punch records — filter by date and client'
  const deletingName = deleting ? deleting.employee.fullName : ''
  const deletingDate = deleting ? fmtDate(deleting.date) : ''

  return (
    <div className="space-y-5">
      <SectionTitle
        title="Attendance"
        desc={sectionDesc}
        action={
          <div className="flex flex-wrap items-center gap-2">
            {list.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleExportCSV}>
                <Download className="mr-1.5 h-3.5 w-3.5" /> Export CSV
              </Button>
            )}
            {showClientFilter && (
              <Select value={clientId || '_all'} onValueChange={handleClientFilterChange}>
                <SelectTrigger className="w-[180px] h-9">
                  <Building2 className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
                  <SelectValue placeholder="All Clients" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_all">All Clients</SelectItem>
                  {clients.map(function (c) {
                    return (
                      <SelectItem key={c.id} value={c.id}>
                        {c.clientName}
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            )}
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="date"
                value={date}
                onChange={function (e) {
                  setDate(e.target.value)
                }}
                className="pl-9 w-[180px] h-9"
              />
            </div>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                Clear
              </Button>
            )}
          </div>
        }
      />

      {/* Live check-in locations */}
      {showLocationCards && (
        <Card className="border-[var(--gold)]/30 bg-[var(--gold)]/5">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="h-4 w-4 text-[var(--gold)]" />
              <h3 className="text-sm font-bold text-[var(--navy)] dark:text-white">Live Check-in Locations</h3>
              <Badge variant="outline" className="border-[var(--gold)]/40 text-[#8a6f24]">
                {trackedCount} tracked
              </Badge>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 max-h-48 overflow-y-auto scroll-thin">
              {trackedRecords.map(function (r) {
                return <LocationCard key={r.id} record={r} />
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 8 }).map(function (_, i) {
                return <Skeleton key={i} className="h-14 w-full" />
              })}
            </div>
          ) : list.length === 0 ? (
            <EmptyState
              icon={Fingerprint}
              title="No attendance records"
              desc="Try selecting a different date or client"
            />
          ) : (
            <div className="max-h-[65vh] overflow-y-auto scroll-thin rounded-lg border">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-card">
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    {!isClient && (
                      <TableHead className="hidden lg:table-cell">Client</TableHead>
                    )}
                    <TableHead>Date</TableHead>
                    <TableHead>Punch In</TableHead>
                    <TableHead>Punch Out</TableHead>
                    <TableHead className="hidden md:table-cell">Hours</TableHead>
                    <TableHead className="hidden lg:table-cell">OT</TableHead>
                    <TableHead className="hidden sm:table-cell">Selfie</TableHead>
                    <TableHead className="hidden xl:table-cell">Location</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.map(function (r) {
                    return (
                      <TableRow key={r.id} className="hover:bg-muted/40">
                        <TableCell>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-[var(--navy)] dark:text-white">
                              {r.employee.fullName}
                            </p>
                            <p className="truncate text-[11px] text-muted-foreground">
                              {r.employee.employeeCode || '—'} • {r.employee.department || '—'}
                            </p>
                          </div>
                        </TableCell>
                        {!isClient && (
                          <TableCell className="hidden lg:table-cell">
                            <ClientNameCell record={r} />
                          </TableCell>
                        )}
                        <TableCell className="text-sm whitespace-nowrap">{fmtDate(r.date)}</TableCell>
                        <TableCell className="text-sm whitespace-nowrap">
                          {r.punchIn ? fmtTime(r.punchIn) : '—'}
                        </TableCell>
                        <TableCell className="text-sm whitespace-nowrap">
                          {r.punchOut ? fmtTime(r.punchOut) : '—'}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm">
                          {r.workingHours ? r.workingHours + 'h' : '—'}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm">
                          {r.overtime ? (
                            <Badge variant="outline" className="border-[var(--gold)]/40 text-[#8a6f24]">
                              {r.overtime}h
                            </Badge>
                          ) : (
                            '—'
                          )}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <SelfieCell record={r} onOpen={handleOpenSelfie} />
                        </TableCell>
                        <TableCell className="hidden xl:table-cell text-xs max-w-[200px]">
                          <LocationCell record={r} />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <StatusBadge status={r.status} />
                            {r.lateArrival && (
                              <Badge variant="outline" className="border-amber-500/30 text-amber-700">
                                Late
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 gap-1"
                              onClick={function () {
                                setEditing(r)
                              }}
                            >
                              <Pencil className="h-3.5 w-3.5" /> Edit
                            </Button>
                            {isSuperAdmin && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                title="Delete record"
                                onClick={function () {
                                  setDeleting(r)
                                }}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
          {!loading && list.length > 0 && (
            <p className="mt-3 text-xs text-muted-foreground">
              {list.length} record{list.length > 1 ? 's' : ''}
            </p>
          )}
        </CardContent>
      </Card>

      {editing && (
        <EditAttendanceDialog
          record={editing}
          onClose={function () {
            setEditing(null)
          }}
          onSuccess={function () {
            setEditing(null)
            load()
          }}
        />
      )}

      {/* Selfie viewer dialog */}
      <Dialog
        open={!!selfieView}
        onOpenChange={function (o) {
          if (!o) handleCloseSelfie()
        }}
      >
        <DialogContent className="max-w-md p-0 overflow-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>{selfieView ? selfieView.label : ''}</DialogTitle>
            <DialogDescription>Attendance selfie capture</DialogDescription>
          </DialogHeader>
          {selfieView && (
            <div className="space-y-0">
              <div className="bg-black flex items-center justify-center">
                <img
                  src={selfieView.url}
                  alt={selfieView.label}
                  className="max-h-[70vh] w-full object-contain"
                />
              </div>
              <div className="p-3 text-center">
                <p className="text-sm font-medium">{selfieView.label}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleting}
        onOpenChange={function (o) {
          if (!o) setDeleting(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-700">Delete attendance record?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the attendance record for{' '}
              <strong>{deletingName}</strong> on <strong>{deletingDate}</strong>. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={async function () {
                if (!deleting) return
                try {
                  await api('/api/admin/attendance', {
                    method: 'DELETE',
                    body: JSON.stringify({ id: deleting.id }),
                  })
                  toast.success('Attendance record deleted')
                  setDeleting(null)
                  load()
                } catch (e: any) {
                  toast.error(e.message || 'Delete failed')
                }
              }}
            >
              <Trash2 className="mr-1 h-4 w-4" /> Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

/* ── Edit dialog (separate component, no Turbopack issue) ── */
function EditAttendanceDialog(props: {
  record: AttendanceRecord
  onClose: () => void
  onSuccess: () => void
}) {
  const { record, onClose, onSuccess } = props
  const toLocalInput = function (d: string | null) {
    if (!d) return ''
    try {
      const dt = new Date(d)
      const pad = function (n: number) {
        return String(n).padStart(2, '0')
      }
      return (
        dt.getFullYear() +
        '-' +
        pad(dt.getMonth() + 1) +
        '-' +
        pad(dt.getDate()) +
        'T' +
        pad(dt.getHours()) +
        ':' +
        pad(dt.getMinutes())
      )
    } catch {
      return ''
    }
  }

  const [punchIn, setPunchIn] = useState(toLocalInput(record.punchIn))
  const [punchOut, setPunchOut] = useState(toLocalInput(record.punchOut))
  const [status, setStatus] = useState(record.status)
  const [saving, setSaving] = useState(false)

  const submit = async function () {
    setSaving(true)
    try {
      await api('/api/admin/attendance', {
        method: 'PATCH',
        body: JSON.stringify({
          id: record.id,
          punchIn: punchIn ? new Date(punchIn).toISOString() : undefined,
          punchOut: punchOut ? new Date(punchOut).toISOString() : undefined,
          status,
        }),
      })
      toast.success('Attendance updated')
      onSuccess()
    } catch (e: any) {
      toast.error(e.message || 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={function (o) { if (!o) onClose() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5" /> Edit Attendance
          </DialogTitle>
          <DialogDescription>
            {record.employee.fullName} • {fmtDate(record.date)}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="at-in">Punch In</Label>
            <Input
              id="at-in"
              type="datetime-local"
              value={punchIn}
              onChange={function (e) {
                setPunchIn(e.target.value)
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="at-out">Punch Out</Label>
            <Input
              id="at-out"
              type="datetime-local"
              value={punchOut}
              onChange={function (e) {
                setPunchOut(e.target.value)
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="at-status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="at-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map(function (s) {
                  return (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="bg-[var(--navy)] text-white hover:bg-[var(--navy-light)]"
            onClick={submit}
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
