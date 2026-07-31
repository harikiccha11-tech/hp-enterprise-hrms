'use client'
import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { SectionTitle, StatusBadge, EmptyState } from '@/components/shared'
import { toast } from 'sonner'
import { Wallet, Lock, Download, Play, Calendar, FileText } from 'lucide-react'
import { api, fmtDate, formatINR, monthName, downloadCSV, type CSVColumn } from '../lib'

interface PayrollRow {
  id: string
  month: number
  year: number
  basic: number
  hra: number
  allowances: number
  specialAllowance: number
  grossSalary: number
  overtimePay: number
  lopDays: number
  lopAmount: number
  pfEmployee: number
  esiEmployee: number
  professionalTax: number
  netSalary: number
  status: string
  processedAt: string
  employee: { id: string; fullName: string; employeeCode: string | null; designation: string | null; department: string | null }
}

interface EmployeeLite {
  id: string; fullName: string; employeeCode: string | null; designation: string | null
}

export function Payroll({ refreshKey, isSuperAdmin }: { refreshKey: number; isSuperAdmin: boolean }) {
  const [list, setList] = useState<PayrollRow[]>([])
  const [employees, setEmployees] = useState<EmployeeLite[]>([])
  const [loading, setLoading] = useState(true)
  const [month, setMonth] = useState(String(new Date().getMonth() + 1))
  const [year, setYear] = useState(String(new Date().getFullYear()))
  const [processing, setProcessing] = useState(false)

  // Form state
  const [empId, setEmpId] = useState('')
  const [action, setAction] = useState<'generate' | 'mark_paid'>('generate')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (month) params.set('month', month)
      if (year) params.set('year', year)
      const [pRes, eRes] = await Promise.all([
        api<{ payrolls: PayrollRow[] }>(`/api/admin/payroll?${params.toString()}`),
        api<{ employees: EmployeeLite[] }>(`/api/admin/employees?status=APPROVED`),
      ])
      setList(pRes.payrolls || [])
      setEmployees(eRes.employees || [])
    } catch (e: any) {
      toast.error(e.message || 'Failed to load payroll')
    } finally {
      setLoading(false)
    }
  }, [month, year])

  useEffect(() => { load() }, [load, refreshKey])

  const processPayroll = async () => {
    if (!empId) { toast.error('Select an employee'); return }
    setProcessing(true)
    try {
      await api('/api/admin/payroll', {
        method: 'POST',
        body: JSON.stringify({
          employeeId: empId,
          month: Number(month),
          year: Number(year),
          action,
        }),
      })
      toast.success(`Payroll ${action === 'mark_paid' ? 'processed & marked paid' : 'generated'} successfully`)
      setEmpId('')
      load()
    } catch (e: any) {
      toast.error(e.message || 'Payroll processing failed')
    } finally {
      setProcessing(false)
    }
  }

  if (!isSuperAdmin) {
    return (
      <div className="space-y-5">
        <SectionTitle title="Payroll" desc="Run payroll & generate salary slips" />
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={Lock}
              title="Owner / Super Admin only"
              desc="Payroll processing is restricted to Owner / Super Admin role. Contact your system administrator for access."
            />
            <p className="mt-2 text-center text-xs text-muted-foreground">
              You can still view reports including payroll summaries from the Reports module.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <SectionTitle title="Payroll" desc="Process monthly payroll, generate salary slips & view register" />

      {/* Process payroll */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Play className="h-4 w-4 text-[var(--gold)]" /> Process Payroll
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <Label>Employee *</Label>
              <Select value={empId} onValueChange={setEmpId}>
                <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                <SelectContent className="max-h-72">
                  {employees.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.fullName} {e.employeeCode ? `(${e.employeeCode})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Month *</Label>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-72">
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i + 1} value={String(i + 1)}>{monthName(i + 1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Year *</Label>
              <Input type="number" value={year} onChange={(e) => setYear(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Action</Label>
              <Select value={action} onValueChange={(v: any) => setAction(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="generate">Generate Slip</SelectItem>
                  <SelectItem value="mark_paid">Generate & Mark Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button
              className="bg-[var(--navy)] text-white hover:bg-[var(--navy-light)]"
              onClick={processPayroll}
              disabled={processing || !empId}
            >
              <Play className="mr-2 h-4 w-4" /> {processing ? 'Processing…' : 'Process Payroll'}
            </Button>
          </div>
          <Alert className="mt-4 border-[var(--gold)]/30 bg-[var(--gold)]/5">
            <FileText className="h-4 w-4 text-[#8a6f24]" />
            <AlertTitle className="text-[#8a6f24]">Auto-calculations</AlertTitle>
            <AlertDescription className="text-xs text-[#8a6f24]/80">
              The system computes PF (12% of basic, capped at ₹15,000), ESI (0.75% if gross ≤ ₹21,000), Professional Tax, LOP based on attendance, and overtime — using settings from the Settings module.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Register */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">Payroll Register</CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {month ? monthName(Number(month)) : 'All months'} {year || ''} • {list.length} record{list.length !== 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All months</SelectItem>
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i + 1} value={String(i + 1)}>{monthName(i + 1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input type="number" value={year} onChange={(e) => setYear(e.target.value)} className="w-24" />
              <Button variant="outline" size="sm" disabled={list.length === 0}
                onClick={() => downloadCSV(`payroll-${month !== 'ALL' ? monthName(Number(month)) : 'all'}-${year}.csv`,
                  [
                    { key: 'Code', label: 'Code' }, { key: 'Name', label: 'Name' },
                    { key: 'Month', label: 'Month' }, { key: 'Year', label: 'Year' },
                    { key: 'Gross', label: 'Gross' }, { key: 'Basic', label: 'Basic' },
                    { key: 'HRA', label: 'HRA' }, { key: 'Allowances', label: 'Allowances' },
                    { key: 'PF', label: 'PF' }, { key: 'ESI', label: 'ESI' },
                    { key: 'PT', label: 'PT' }, { key: 'LOP Days', label: 'LOP Days' },
                    { key: 'LOP Amount', label: 'LOP Amount' }, { key: 'Overtime', label: 'Overtime' },
                    { key: 'Net', label: 'Net' }, { key: 'Status', label: 'Status' },
                  ] as CSVColumn[],
                  list.map((p) => ({
                    Code: p.employee.employeeCode || '', Name: p.employee.fullName,
                    Month: monthName(p.month), Year: p.year,
                    Gross: p.grossSalary, Basic: p.basic, HRA: p.hra, Allowances: p.allowances,
                    PF: p.pfEmployee, ESI: p.esiEmployee, PT: p.professionalTax,
                    'LOP Days': p.lopDays, 'LOP Amount': p.lopAmount, Overtime: p.overtimePay,
                    Net: p.netSalary, Status: p.status,
                  }))
                )}
              >
                <Download className="mr-1 h-3.5 w-3.5" /> Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : list.length === 0 ? (
            <EmptyState icon={Wallet} title="No payroll records" desc="Try a different month/year or process payroll above" />
          ) : (
            <div className="max-h-[60vh] overflow-y-auto scroll-thin rounded-lg border">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-card">
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead className="text-right">Gross</TableHead>
                    <TableHead className="hidden md:table-cell text-right">Deductions</TableHead>
                    <TableHead className="text-right">Net Pay</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Slip</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.map((p) => {
                    const deductions = p.pfEmployee + p.esiEmployee + p.professionalTax + p.lopAmount
                    return (
                      <TableRow key={p.id} className="hover:bg-muted/40">
                        <TableCell>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-[var(--navy)] dark:text-white">{p.employee.fullName}</p>
                            <p className="truncate text-[11px] text-muted-foreground">{p.employee.employeeCode || '—'}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{monthName(p.month)} {p.year}</TableCell>
                        <TableCell className="text-right text-sm font-mono">{formatINR(p.grossSalary + p.overtimePay)}</TableCell>
                        <TableCell className="hidden md:table-cell text-right text-sm font-mono text-red-600">-{formatINR(deductions)}</TableCell>
                        <TableCell className="text-right text-sm font-bold font-mono text-emerald-700">{formatINR(p.netSalary)}</TableCell>
                        <TableCell><StatusBadge status={p.status} /></TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm" variant="ghost" className="h-8 w-8 p-0"
                            aria-label="Download salary slip"
                            onClick={() => {
                              // Find latest salary slip PDF — fetch docs for employee
                              fetch(`/api/admin/employees/${p.employee.id}/documents`, { cache: 'no-store' })
                                .then((r) => r.json())
                                .then((d) => {
                                  const docs = (d.docs || []) as { docType: string; id: string; metaJson?: string }[]
                                  const slips = docs.filter((x) => x.docType === 'salary_slip')
                                  // Match by month/year if metaJson has it
                                  const match = slips.find((s) => {
                                    try {
                                      const m = s.metaJson ? JSON.parse(s.metaJson) : {}
                                      return (m.month === p.month && m.year === p.year)
                                    } catch { return false }
                                  }) || slips[0]
                                  if (match) {
                                    window.open(`/api/documents/${match.id}`, '_blank')
                                  } else {
                                    toast.error('Salary slip PDF not found')
                                  }
                                })
                                .catch(() => toast.error('Failed to load documents'))
                            }}
                          >
                            <Download className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
