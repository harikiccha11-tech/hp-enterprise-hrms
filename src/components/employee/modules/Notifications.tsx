'use client'
import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/shared'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  Bell,
  BellOff,
  CheckCheck,
  Info,
  CheckCircle2,
  AlertTriangle,
  CalendarDays,
  Wallet,
  FileText,
  Megaphone,
  Circle,
} from 'lucide-react'
import { fmtDateTime, fmtRelative } from '../lib'

interface NotificationItem {
  id: string
  title: string
  message: string
  type: string
  read: boolean
  createdAt: string
  link?: string | null
}

const TYPE_ICON: Record<string, any> = {
  INFO: Info,
  SUCCESS: CheckCircle2,
  WARNING: AlertTriangle,
  LEAVE: CalendarDays,
  PAYROLL: Wallet,
  DOCUMENT: FileText,
  ANNOUNCEMENT: Megaphone,
}

const TYPE_COLOR: Record<string, string> = {
  INFO: 'bg-sky-500/10 text-sky-600',
  SUCCESS: 'bg-emerald-500/10 text-emerald-600',
  WARNING: 'bg-amber-500/10 text-amber-600',
  LEAVE: 'bg-violet-500/10 text-violet-600',
  PAYROLL: 'bg-[var(--gold)]/15 text-[#8a6f24]',
  DOCUMENT: 'bg-blue-500/10 text-blue-600',
  ANNOUNCEMENT: 'bg-rose-500/10 text-rose-600',
}

export function Notifications({ onChanged }: { onChanged?: () => void }) {
  const [items, setItems] = useState<NotificationItem[]>([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/notifications', { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed')
      setItems(json.notifications || [])
      setUnread(json.unread || 0)
    } catch (e: any) {
      toast.error(e.message || 'Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const markOne = async (id: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      setItems(arr => arr.map(n => n.id === id ? { ...n, read: true } : n))
      setUnread(u => Math.max(0, u - 1))
      onChanged?.()
    } catch {}
  }

  const markAll = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
      })
      setItems(arr => arr.map(n => ({ ...n, read: true })))
      setUnread(0)
      onChanged?.()
      toast.success('All notifications marked as read')
    } catch {
      toast.error('Failed to update notifications')
    }
  }

  const filtered = filter === 'unread' ? items.filter(n => !n.read) : items

  return (
    <div className="space-y-6">
      {/* Header card */}
      <Card className="overflow-hidden border-0 shadow-lg">
        <div className="relative">
          <div className="absolute inset-0 hpe-sidebar-gradient" />
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 90% 0%, #C9A961 0, transparent 50%)' }} />
          <CardContent className="relative flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 text-white">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-[var(--gold)]/20 ring-1 ring-[var(--gold)]/30">
                <Bell className="h-6 w-6 text-[var(--gold-light)]" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Notifications</h2>
                <p className="text-sm text-blue-100/80">
                  {unread > 0 ? `${unread} unread notification${unread > 1 ? 's' : ''}` : 'All caught up — no unread notifications'}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="inline-flex rounded-lg border border-white/15 bg-white/10 p-1">
                <button
                  onClick={() => setFilter('all')}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                    filter === 'all' ? 'bg-[var(--gold)] text-[var(--navy)]' : 'text-blue-100 hover:text-white'
                  )}
                >
                  All ({items.length})
                </button>
                <button
                  onClick={() => setFilter('unread')}
                  className={cn(
                    'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                    filter === 'unread' ? 'bg-[var(--gold)] text-[var(--navy)]' : 'text-blue-100 hover:text-white'
                  )}
                >
                  Unread ({unread})
                </button>
              </div>
              {unread > 0 && (
                <Button onClick={markAll} className="bg-[var(--gold)] text-[var(--navy)] hover:bg-[var(--gold-light)]">
                  <CheckCheck className="mr-2 h-4 w-4" /> Mark all read
                </Button>
              )}
            </div>
          </CardContent>
        </div>
      </Card>

      {/* List */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-3 p-4">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-lg" />)}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={filter === 'unread' ? BellOff : Bell}
              title={filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
              desc={filter === 'unread' ? 'You have read all your notifications.' : 'Your notifications and announcements will appear here.'}
            />
          ) : (
            <ul className="divide-y">
              {filtered.map((n) => {
                const Icon = TYPE_ICON[n.type] || Info
                const color = TYPE_COLOR[n.type] || 'bg-sky-500/10 text-sky-600'
                return (
                  <li
                    key={n.id}
                    className={cn(
                      'flex gap-3 p-4 transition-colors hover:bg-muted/40',
                      !n.read && 'bg-[var(--gold)]/5'
                    )}
                  >
                    <div className={cn('grid h-10 w-10 shrink-0 place-items-center rounded-lg', color)}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className={cn('text-sm', n.read ? 'font-medium text-[var(--navy)] dark:text-white' : 'font-bold text-[var(--navy)] dark:text-white')}>
                            {n.title}
                          </p>
                          <p className="mt-0.5 text-sm text-muted-foreground">{n.message}</p>
                          <p className="mt-1 text-[11px] text-muted-foreground">
                            {fmtDateTime(n.createdAt)} • {fmtRelative(n.createdAt)}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          {!n.read && (
                            <>
                              <Circle className="h-2.5 w-2.5 fill-[var(--gold)] text-[var(--gold)]" />
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 text-xs"
                                onClick={() => markOne(n.id)}
                              >
                                Mark read
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                      {n.link && (n.link.startsWith('/') || n.link.startsWith('http://') || n.link.startsWith('https://')) && (
                        <a
                          href={n.link}
                          className="mt-2 inline-block text-xs font-medium text-[var(--navy)] hover:underline dark:text-[var(--gold-light)]"
                        >
                          View details →
                        </a>
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
