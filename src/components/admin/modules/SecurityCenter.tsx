'use client'
import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { SectionTitle, StatCard } from '@/components/shared'
import { api } from '../lib'
import { fmtDateTime } from '../lib'
import { Shield, AlertTriangle, Users, Lock, Activity } from 'lucide-react'

interface AuditEntry {
  id: string; action: string; entity: string; entityId: string | null
  details: string | null; ip: string | null; at: string
  user: { id: string; username: string; email: string; role: string } | null
}

interface SecurityData {
  failedLogins: number; recentLogins: number; activeSessions: number
  lockedAccounts: number; securityEvents: number; recentLogs: AuditEntry[]
}

const actionColor: Record<string, string> = {
  LOGIN: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30',
  FAILED_LOGIN: 'bg-red-500/10 text-red-700 border-red-500/30',
  LOGOUT: 'bg-gray-500/10 text-gray-700 border-gray-500/30',
  SECURITY: 'bg-amber-500/10 text-amber-700 border-amber-500/30',
}

export function SecurityCenter({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const [data, setData] = useState<SecurityData | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const d = await api<SecurityData>('/api/admin/security')
      setData(d)
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])
  useEffect(() => {
    const iv = setInterval(load, 30000)
    return () => clearInterval(iv)
  }, [load])

  if (loading) {
    return (
      <div className="space-y-5">
        <SectionTitle title="Security Center" desc="Monitor security events and login activity" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-5">
      <SectionTitle title="Security Center" desc="Monitor security events and login activity" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={AlertTriangle} label="Failed Logins (24h)" value={data.failedLogins} accent="red" />
        <StatCard icon={Users} label="Active Sessions" value={data.activeSessions} accent="green" />
        <StatCard icon={Lock} label="Locked Accounts" value={data.lockedAccounts} accent="amber" />
        <StatCard icon={Activity} label="Security Events (24h)" value={data.securityEvents} accent="navy" />
      </div>

      <Card>
        <CardContent className="pt-6">
          <h3 className="text-sm font-semibold text-[var(--navy)] dark:text-white mb-3">Recent Security Events</h3>
          {data.recentLogs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No security events recorded</p>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>IP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.recentLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{fmtDateTime(log.at)}</TableCell>
                      <TableCell><Badge className={actionColor[log.action] || 'bg-gray-500/10 text-gray-700 border-gray-500/30'}>{log.action}</Badge></TableCell>
                      <TableCell className="text-sm font-medium">{log.user?.username || 'System'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{log.details || log.entity || '—'}</TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">{log.ip || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
