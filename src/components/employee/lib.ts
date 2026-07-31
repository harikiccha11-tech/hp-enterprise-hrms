// Shared helpers for the Employee Portal (pure functions, safe for client)
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

/** Initials from a name */
export function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join('')
}

/** Compute hours between two timestamps, rounded to 2 decimals */
export function hoursBetween(a: string | Date, b: string | Date): number {
  try {
    return Math.round(((new Date(b).getTime() - new Date(a).getTime()) / 3600000) * 100) / 100
  } catch {
    return 0
  }
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
