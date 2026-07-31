// Shared helpers for the Admin Portal (pure functions, safe for client)
import { format, formatDistanceToNow } from 'date-fns'

/** Format currency in Indian numbering system: ₹ 1,23,456 */
export function formatINR(n: number | null | undefined): string {
  if (n === null || n === undefined || isNaN(n as number)) return '₹ 0'
  return '₹ ' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 0 })
}

/** Format a date as "12 Apr 2025" */
export function fmtDate(d: string | Date | null | undefined): string {
  if (!d) return '—'
  try {
    return format(new Date(d), 'dd MMM yyyy')
  } catch {
    return '—'
  }
}

/** Format a date+time as "12 Apr 2025, 9:28 AM" */
export function fmtDateTime(d: string | Date | null | undefined): string {
  if (!d) return '—'
  try {
    return format(new Date(d), 'dd MMM yyyy, h:mm a')
  } catch {
    return '—'
  }
}

/** Format a time only: "9:28 AM" */
export function fmtTime(d: string | Date | null | undefined): string {
  if (!d) return '—'
  try {
    return format(new Date(d), 'h:mm a')
  } catch {
    return '—'
  }
}

/** Format relative time: "5 minutes ago" */
export function fmtRelative(d: string | Date | null | undefined): string {
  if (!d) return '—'
  try {
    return formatDistanceToNow(new Date(d), { addSuffix: true })
  } catch {
    return '—'
  }
}

/** Month name from integer (1-12) */
export function monthName(m: number | null | undefined): string {
  if (!m || m < 1 || m > 12) return '—'
  return format(new Date(2000, m - 1, 1), 'MMMM')
}

/** Initials from a name */
export function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join('')
}

/** Pretty label for document type keys */
export function docTypeLabel(t: string): string {
  const map: Record<string, string> = {
    offer_letter: 'Offer Letter',
    appointment_letter: 'Appointment Letter',
    id_card: 'ID Card',
    joining_letter: 'Joining Letter',
    employment_agreement: 'Employment Agreement',
    nda: 'Non-Disclosure Agreement',
    salary_slip: 'Salary Slip',
    attendance_sheet: 'Attendance Sheet',
    warning_letter: 'Warning Letter',
    promotion_letter: 'Promotion Letter',
    transfer_letter: 'Transfer Letter',
    confirmation_letter: 'Confirmation Letter',
    experience_letter: 'Experience Letter',
    relieving_letter: 'Relieving Letter',
    no_due_certificate: 'No-Due Certificate',
    full_final_settlement: 'Full & Final Settlement',
  }
  return map[t] || t.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

/** Leave type label */
export function leaveTypeLabel(t: string): string {
  const map: Record<string, string> = {
    CL: 'Casual Leave',
    SL: 'Sick Leave',
    EL: 'Earned Leave',
    PL: 'Privilege Leave',
    LOP: 'Loss of Pay',
    WFH: 'Work From Home',
  }
  return map[t] || t
}

/** Wrapper around fetch with JSON + error handling */
export async function api<T = any>(
  url: string,
  opts: RequestInit = {}
): Promise<T> {
  const res = await fetch(url, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
    cache: 'no-store',
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error((data as any)?.error || `Request failed (${res.status})`)
  }
  return data as T
}

/** Column descriptor for downloadCSV — key maps to row property, label is the CSV header */
export interface CSVColumn {
  key: string
  label: string
}

/** Download CSV from rows + column descriptors. Uses column keys to access row values. */
export function downloadCSV(filename: string, columns: (string | CSVColumn)[], rows: Record<string, any>[]) {
  const esc = (v: any) => {
    if (v === null || v === undefined) return ''
    const s = String(v).replace(/"/g, '""')
    if (/[",\n]/.test(s)) return `"${s}"`
    return s
  }
  const normalized = columns.map((c) =>
    typeof c === 'string' ? { key: c, label: c } : c
  )
  const lines = [normalized.map((c) => c.label).join(',')]
  for (const r of rows) {
    const values = normalized.map((col) => esc(r[col.key]))
    lines.push(values.join(','))
  }
  const csv = lines.join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 500)
}

/** Copy text to clipboard with a toast feedback hook (caller shows toast) */
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    // Fallback for older browsers
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      return true
    } catch {
      return false
    }
  }
}

/** Parse a JSON string safely */
export function parseJSON<T>(s: string | null | undefined, fallback: T): T {
  if (!s) return fallback
  try {
    return JSON.parse(s) as T
  } catch {
    return fallback
  }
}
