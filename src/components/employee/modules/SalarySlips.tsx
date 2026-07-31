'use client'
import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { StatCard, EmptyState } from '@/components/shared'
import { toast } from 'sonner'
import {
  Wallet,
  Download,
  TrendingUp,
  Banknote,
  CalendarRange,
  Eye,
  FileWarning,
} from 'lucide-react'
import { formatINR, fmtDate, monthName } from '../lib'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'

interface Slip {
  id: string
  employeeId: string
  payrollId: string
  month: number
  year: number
  netSalary: number
  generatedAt: string
  // matched doc id (for download)
  docId?: string | null
}

interface GenDoc {
  id: string
  docType: string
  title: string
  filePath: string | null
  metaJson: string | null
  generatedAt: string
}

export function SalarySlips() {
  const [slips, setSlips] = useState<Slip[]>([])
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      // Pull slips + matching generated PDF docs in parallel
      const [slipsRes, dashRes] = await Promise.all([
        fetch('/api/employee/salary-slips', { cache: 'no-store' }),
        fetch('/api/employee/dashboard', { cache: 'no-store' }),
      ])
      if (!slipsRes.ok) throw new Error('Failed to load salary slips')
      const slipsJson = await slipsRes.json()
      const rawSlips: Slip[] = slipsJson.slips || []

      // From the dashboard, pull generated docs of type salary_slip and match by month/year
      let docsByPeriod = new Map<string, string>()
      if (dashRes.ok) {
        const dashJson = await dashRes.json()
        const genDocs: GenDoc[] = dashJson.employee?.generatedDocs || []
        for (const d of genDocs) {
          if (d.docType !== 'salary_slip') continue
          let m: number | null = null
          let y: number | null = null
          try {
            const meta = d.metaJson ? JSON.parse(d.metaJson) : {}
            m = Number(meta.month)
            y = Number(meta.year)
          } catch {}
          // Fallback: parse from title "Salary Slip — M/Y"
          if (!m || !y) {
            const match = d.title?.match(/(\d+)\/(\d+)/)
            if (match) { m = Number(match[1]); y = Number(match[2]) }
          }
          if (m && y) docsByPeriod.set(`${m}-${y}`, d.id)
        }
      }

      const merged = rawSlips.map(s => ({
        ...s,
        docId: docsByPeriod.get(`${s.month}-${s.year}`) || null,
      }))
      setSlips(merged)
    } catch (e: any) {
      toast.error(e.message || 'Failed to load salary slips')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const openDoc = (id: string) => {
    setDownloading(id)
    window.open(`/api/documents/${id}`, '_blank', 'noopener,noreferrer')
    setTimeout(() => setDownloading(null), 800)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
        </div>
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
    )
  }

  if (slips.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <EmptyState icon={Wallet} title="No salary slips yet" desc="Your monthly payslips will appear here once payroll is processed by HR." />
        </CardContent>
      </Card>
    )
  }

  const total = slips.reduce((s, x) => s + x.netSalary, 0)
  const avg = total / slips.length
  const latest = slips[0]
  const chartData = [...slips].reverse().map(s => ({
    label: `${monthName(s.month).slice(0, 3)} ${String(s.year).slice(2)}`,
    net: s.netSalary,
  }))

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard icon={Banknote} label="Latest Net Pay" value={formatINR(latest.netSalary)} sub={`${monthName(latest.month)} ${latest.year}`} accent="gold" />
        <StatCard icon={CalendarRange} label="Total Slips" value={slips.length} sub="Payslips available" accent="navy" />
        <StatCard icon={TrendingUp} label="Average Net Pay" value={formatINR(avg)} sub="Across all slips" accent="green" />
      </div>

      {/* Earnings trend */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-[var(--gold)]" /> Net Salary Trend
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#C9A961" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#C9A961" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(10,31,68,0.08)" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#5A6A8A' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#5A6A8A' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #DDE3EE', fontSize: 12 }}
                  formatter={(v: any) => [formatINR(v), 'Net Pay']}
                />
                <Area type="monotone" dataKey="net" stroke="#C9A961" strokeWidth={2} fill="url(#netGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Slips list */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Wallet className="h-4 w-4 text-[var(--gold)]" /> All Payslips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-[28rem] overflow-y-auto scroll-thin">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-card">
                <tr className="border-b text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Period</th>
                  <th className="py-2 pr-4 font-medium">Generated</th>
                  <th className="py-2 pr-4 font-medium">Net Salary</th>
                  <th className="py-2 pr-4 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {slips.map((s) => (
                  <tr key={s.id} className="border-b last:border-0 hover:bg-muted/40">
                    <td className="py-3 pr-4">
                      <p className="font-semibold text-[var(--navy)] dark:text-white">{monthName(s.month)} {s.year}</p>
                    </td>
                    <td className="py-3 pr-4 text-muted-foreground">{fmtDate(s.generatedAt)}</td>
                    <td className="py-3 pr-4 font-bold text-[var(--navy)] dark:text-white">{formatINR(s.netSalary)}</td>
                    <td className="py-3 pr-4 text-right">
                      {s.docId ? (
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openDoc(s.docId!)}
                            disabled={downloading === s.docId}
                          >
                            <Eye className="mr-1.5 h-3.5 w-3.5" />
                            {downloading === s.docId ? 'Opening…' : 'View'}
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => openDoc(s.docId!)}
                            disabled={downloading === s.docId}
                            className="bg-[var(--navy)] hover:bg-[var(--navy-light)]"
                          >
                            <Download className="mr-1.5 h-3.5 w-3.5" /> PDF
                          </Button>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-amber-600">
                          <FileWarning className="h-3.5 w-3.5" /> PDF not available
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
