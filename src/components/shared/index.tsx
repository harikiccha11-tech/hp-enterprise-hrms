'use client'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

export function StatCard({ icon: Icon, label, value, sub, accent = 'navy', className }: {
  icon: LucideIcon
  label: string
  value: string | number
  sub?: string
  accent?: 'navy' | 'gold' | 'green' | 'red' | 'amber'
  className?: string
}) {
  const colors: Record<string, string> = {
    navy: 'bg-[var(--navy)]/10 text-[var(--navy)]',
    gold: 'bg-[var(--gold)]/15 text-[#8a6f24]',
    green: 'bg-emerald-500/10 text-emerald-600',
    red: 'bg-red-500/10 text-red-600',
    amber: 'bg-amber-500/10 text-amber-600',
  }
  return (
    <div className={cn('rounded-xl border bg-card p-5 lift', className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-bold text-[var(--navy)] dark:text-white">{value}</p>
          {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
        </div>
        <div className={cn('grid h-11 w-11 place-items-center rounded-lg', colors[accent])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
}

export function SectionTitle({ title, desc, action }: { title: string; desc?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
      <div>
        <h2 className="text-xl font-bold text-[var(--navy)] dark:text-white">{title}</h2>
        {desc && <p className="text-sm text-muted-foreground mt-0.5">{desc}</p>}
      </div>
      {action}
    </div>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    PENDING: 'bg-amber-500/10 text-amber-700 border-amber-500/30',
    APPROVED: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30',
    REJECTED: 'bg-red-500/10 text-red-700 border-red-500/30',
    TERMINATED: 'bg-gray-500/10 text-gray-700 border-gray-500/30',
    PRESENT: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30',
    LATE: 'bg-amber-500/10 text-amber-700 border-amber-500/30',
    ABSENT: 'bg-red-500/10 text-red-700 border-red-500/30',
    HALF_DAY: 'bg-sky-500/10 text-sky-700 border-sky-500/30',
    LEAVE: 'bg-violet-500/10 text-violet-700 border-violet-500/30',
    HOLIDAY: 'bg-gray-500/10 text-gray-700 border-gray-500/30',
    GENERATED: 'bg-sky-500/10 text-sky-700 border-sky-500/30',
    PAID: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30',
    HELD: 'bg-amber-500/10 text-amber-700 border-amber-500/30',
    ACTIVE: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30',
    COMPLETED: 'bg-sky-500/10 text-sky-700 border-sky-500/30',
    ON_HOLD: 'bg-amber-500/10 text-amber-700 border-amber-500/30',
    OPEN: 'bg-sky-500/10 text-sky-700 border-sky-500/30',
    DRAFT: 'bg-gray-500/10 text-gray-700 border-gray-500/30',
    SENT: 'bg-sky-500/10 text-sky-700 border-sky-500/30',
    OVERDUE: 'bg-red-500/10 text-red-700 border-red-500/30',
  }
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold', map[status] || 'bg-gray-500/10 text-gray-700 border-gray-500/30')}>
      {status.replace('_', ' ')}
    </span>
  )
}

export function EmptyState({ icon: Icon, title, desc }: { icon: LucideIcon; title: string; desc?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-full bg-muted">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <p className="mt-3 font-semibold text-[var(--navy)] dark:text-white">{title}</p>
      {desc && <p className="mt-1 text-sm text-muted-foreground max-w-sm">{desc}</p>}
    </div>
  )
}
