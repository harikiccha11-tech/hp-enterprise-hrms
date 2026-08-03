'use client'
import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { SectionTitle, StatCard } from '@/components/shared'
import { api } from '../lib'
import { Database, Server, Cpu, RefreshCw, HardDrive, Users, FileText, Briefcase, Building2, Package, Truck, Monitor } from 'lucide-react'

interface HealthData {
  database: { status: boolean; latency: number }
  uptime: { hours: number; minutes: number; raw: number }
  memory: { rss: number; heapUsed: number; heapTotal: number }
  counts: { users: number; employees: number; notifications: number; candidates: number; projects: number; clients: number; vendors: number; assets: number }
  weeklyStats: { employeesCreated: number; employeesUpdated: number; candidatesCreated: number; projectsCreated: number }
}

export function SystemHealth({ _props }: { _props?: Record<string, never> }) {
  const [data, setData] = useState<HealthData | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const d = await api<HealthData>('/api/admin/system-health')
      setData(d)
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  return (
    <div className="space-y-5">
      <SectionTitle title="System Health" desc="Monitor system status and resource usage" action={
        <Button variant="outline" onClick={load} disabled={loading} className="gap-2"><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh</Button>
      } />

      {loading && !data ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Database} label="Database" value={data.database.status ? 'Connected' : 'Disconnected'} sub={`${data.database.latency}ms`} accent={data.database.status ? 'green' : 'red'} />
            <StatCard icon={Server} label="API Server" value="Running" sub={`Uptime: ${data.uptime.hours}h ${data.uptime.minutes}m`} accent="green" />
            <StatCard icon={Cpu} label="Memory Usage" value={`${data.memory.heapUsed} MB`} sub={`RSS: ${data.memory.rss} MB`} accent="navy" />
            <StatCard icon={HardDrive} label="Heap" value={`${data.memory.heapTotal} MB`} sub={`${Math.round((data.memory.heapUsed / data.memory.heapTotal) * 100)}% used`} accent={data.memory.heapUsed / data.memory.heapTotal > 0.8 ? 'red' : 'navy'} />
          </div>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Entity Counts & Weekly Activity</CardTitle></CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Entity</TableHead>
                      <TableHead className="text-right">Total Count</TableHead>
                      <TableHead className="text-right">Created This Week</TableHead>
                      <TableHead className="text-right">Updated This Week</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <EntityRow icon={Users} name="Users" total={data.counts.users} />
                    <EntityRow icon={Briefcase} name="Employees" total={data.counts.employees} created={data.weeklyStats.employeesCreated} updated={data.weeklyStats.employeesUpdated} />
                    <EntityRow icon={Building2} name="Clients" total={data.counts.clients} />
                    <EntityRow icon={FileText} name="Projects" total={data.counts.projects} created={data.weeklyStats.projectsCreated} />
                    <EntityRow icon={Truck} name="Vendors" total={data.counts.vendors} />
                    <EntityRow icon={Monitor} name="Candidates" total={data.counts.candidates} created={data.weeklyStats.candidatesCreated} />
                    <EntityRow icon={Package} name="Assets" total={data.counts.assets} />
                    <EntityRow icon={FileText} name="Notifications" total={data.counts.notifications} />
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  )
}

function EntityRow({ icon: Icon, name, total, created, updated }: { icon: any; name: string; total: number; created?: number; updated?: number }) {
  return (
    <TableRow>
      <TableCell className="font-medium"><div className="flex items-center gap-2"><Icon className="h-4 w-4 text-muted-foreground" />{name}</div></TableCell>
      <TableCell className="text-right font-semibold">{total}</TableCell>
      <TableCell className="text-right text-emerald-600">{created ?? '—'}</TableCell>
      <TableCell className="text-right text-amber-600">{updated ?? '—'}</TableCell>
    </TableRow>
  )
}