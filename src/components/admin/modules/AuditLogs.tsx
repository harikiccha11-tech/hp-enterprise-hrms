'use client'
import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { SectionTitle, EmptyState } from '@/components/shared'
import { toast } from 'sonner'
import { ScrollText, Lock, Search, Activity } from 'lucide-react'
import { api, fmtDateTime } from '../lib'

interface AuditLog {
  id: string
  action: string
  entity: string
  entityId: string | null
  details: string | null
  ip: string | null
  at: string
  user: { username: string; role: string } | null
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'text-emerald-700 bg-emerald-500/10 border-emerald-500/30',
  UPDATE: 'text-sky-700 bg-sky-500/10 border-sky-500/30',
  DELETE: 'text-red-700 bg-red-500/10 border-red-500/30',
  APPROVE: 'text-emerald-700 bg-emerald-500/10 border-emerald-500/30',
  REJECT: 'text-red-700 bg-red-500/10 border-red-500/30',
  LOGIN: 'text-[var(--navy)] bg-[var(--navy)]/5 border-[var(--navy)]/30',
  LOCK: 'text-amber-700 bg-amber-500/10 border-amber-500/30',
  UNLOCK: 'text-emerald-700 bg-emerald-500/10 border-emerald-500/30',
  RESET: 'text-amber-700 bg-amber-500/10 border-amber-500/30',
  PROCESS: 'text-[#8a6f24] bg-[var(--gold)]/10 border-[var(--gold)]/30',
}

function actionColor(action: string): string {
  for (const [k, v] of Object.entries(ACTION_COLORS)) {
    if (action.includes(k)) return v
  }
  return 'text-gray-700 bg-gray-500/10 border-gray-500/30'
}

export function AuditLogs({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const [list, setList] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [limit, setLimit] = useState('200')
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api<{ logs: AuditLog[] }>(`/api/admin/audit?limit=${limit}`)
      setList(data.logs || [])
    } catch (e: any) {
      toast.error(e.message || 'Failed to load audit logs')
    } finally {
      setLoading(false)
    }
  }, [limit])

  useEffect(() => { load() }, [load])

  const filtered = search.trim()
    ? list.filter((l) => [l.action, l.entity, l.details, l.user?.username, l.ip].filter(Boolean).some((v) => v!.toLowerCase().includes(search.trim().toLowerCase())))
    : list

  if (!isSuperAdmin) {
    return (
      <div className="space-y-5">
        <SectionTitle title="Audit Logs" desc="System activity trail" />
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={Lock}
              title="Owner / Super Admin only"
              desc="Audit logs are restricted to senior roles for security & compliance."
            />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <SectionTitle
        title="Audit Logs"
        desc="Complete activity trail — all admin actions are recorded"
        action={
          <div className="flex items-center gap-2">
            <Select value={limit} onValueChange={setLimit}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="50">Last 50</SelectItem>
                <SelectItem value="200">Last 200</SelectItem>
                <SelectItem value="500">Last 500</SelectItem>
                <SelectItem value="1000">Last 1000</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />

      <Card>
        <CardContent className="pt-6">
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by user, action, entity, IP…"
                className="pl-9"
              />
            </div>
            <Badge variant="outline" className="gap-1 self-start sm:self-auto">
              <Activity className="h-3 w-3" /> {filtered.length} of {list.length}
            </Badge>
          </div>

          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState icon={ScrollText} title="No logs found" desc={search ? 'Try a different search' : 'Audit events will appear here'} />
          ) : (
            <div className="max-h-[65vh] overflow-y-auto scroll-thin rounded-lg border">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-card">
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead className="hidden md:table-cell">Entity</TableHead>
                    <TableHead className="hidden lg:table-cell">Details</TableHead>
                    <TableHead className="hidden md:table-cell">IP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.slice(0, 500).map((l) => (
                    <TableRow key={l.id} className="hover:bg-muted/40">
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{fmtDateTime(l.at)}</TableCell>
                      <TableCell>
                        <p className="text-sm font-medium text-[var(--navy)] dark:text-white">{l.user?.username || 'system'}</p>
                        {l.user?.role && <p className="text-[10px] text-muted-foreground">{l.user.role.replace('_', ' ').toLowerCase()}</p>}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`font-mono text-[10px] ${actionColor(l.action)}`}>
                          {l.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm">{l.entity}</TableCell>
                      <TableCell className="hidden lg:table-cell max-w-xs">
                        <p className="truncate text-xs text-muted-foreground">{l.details || '—'}</p>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs font-mono text-muted-foreground">{l.ip || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {filtered.length > 500 && (
            <p className="mt-2 text-xs text-muted-foreground">Showing first 500 of {filtered.length}. Refine search for more.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
