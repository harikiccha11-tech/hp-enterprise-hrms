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
import { BarChart3, Download, Printer, Search, FileSpreadsheet } from 'lucide-react'
import { api, downloadCSV, fmtDate, fmtDateTime, formatINR } from '../lib'

const REPORT_TYPES = [
  { value: 'employees', label: 'Employees' },
  { value: 'attendance', label: 'Attendance' },
  { value: 'payroll', label: 'Payroll' },
  { value: 'clients', label: 'Clients' },
  { value: 'projects', label: 'Projects' },
  { value: 'invoices', label: 'Invoices' },
  { value: 'audit', label: 'Audit Logs' },
]

// Pretty-print a cell value based on column name
function formatCell(col: string, value: any): string {
  if (value === null || value === undefined) return '—'
  if (col.toLowerCase().includes('date') || col.toLowerCase().includes('time')) {
    if (col.toLowerCase().includes('time') || col.toLowerCase().includes('punch')) {
      return fmtDateTime(value)
    }
    return fmtDate(value)
  }
  if (col.toLowerCase().includes('salary') || col.toLowerCase().includes('gross') ||
      col.toLowerCase().includes('net') || col.toLowerCase().includes('deduction') ||
      col.toLowerCase().includes('amount') || col.toLowerCase().includes('tax') ||
      col.toLowerCase().includes('total') || col.toLowerCase().includes('value')) {
    const n = Number(value)
    if (!isNaN(n) && n > 0) return formatINR(n)
  }
  return String(value)
}

export function Reports() {
  const [type, setType] = useState('employees')
  const [rows, setRows] = useState<Record<string, any>[]>([])
  const [columns, setColumns] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api<{ rows: Record<string, any>[]; columns: string[] }>(`/api/admin/reports?type=${type}`)
      setRows(data.rows || [])
      setColumns(data.columns || [])
    } catch (e: any) {
      toast.error(e.message || 'Failed to load report')
    } finally {
      setLoading(false)
    }
  }, [type])

  useEffect(() => { load() }, [load])

  const filteredRows = search.trim()
    ? rows.filter((r) => Object.values(r).some((v) => v !== null && String(v).toLowerCase().includes(search.trim().toLowerCase())))
    : rows

  const handleExport = () => {
    if (filteredRows.length === 0) { toast.error('Nothing to export'); return }
    const filename = `${type}_report_${new Date().toISOString().slice(0, 10)}.csv`
    downloadCSV(filename, columns, filteredRows)
    toast.success('CSV exported')
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-5">
      <SectionTitle
        title="Reports"
        desc="Generate, search & export operational reports"
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExport} disabled={loading || filteredRows.length === 0}>
              <Download className="mr-1 h-4 w-4" /> Export CSV
            </Button>
            <Button variant="outline" onClick={handlePrint} disabled={loading || filteredRows.length === 0}>
              <Printer className="mr-1 h-4 w-4" /> Print
            </Button>
          </div>
        }
      />

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-[var(--gold)]" />
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {REPORT_TYPES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search rows…"
                className="pl-9"
              />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <Badge variant="outline" className="gap-1 border-[var(--gold)]/40 text-[#8a6f24]">
              <FileSpreadsheet className="h-3 w-3" /> {filteredRows.length} row{filteredRows.length !== 1 ? 's' : ''}
            </Badge>
            <span className="text-xs text-muted-foreground">{columns.length} column{columns.length !== 1 ? 's' : ''}</span>
          </div>

          <div className="mt-4">
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : filteredRows.length === 0 ? (
              <EmptyState icon={BarChart3} title="No data" desc={search ? 'No matching rows. Try clearing the search.' : 'This report has no rows yet.'} />
            ) : (
              <div className="max-h-[60vh] overflow-auto scroll-thin rounded-lg border">
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-card">
                    <TableRow>
                      {columns.map((c) => <TableHead key={c} className="whitespace-nowrap">{c}</TableHead>)}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRows.slice(0, 500).map((r, i) => (
                      <TableRow key={i} className="hover:bg-muted/40">
                        {columns.map((c) => {
                          const value = Object.values(r)[columns.indexOf(c)]
                          return (
                            <TableCell key={c} className="whitespace-nowrap text-sm">
                              {formatCell(c, value)}
                            </TableCell>
                          )
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            {filteredRows.length > 500 && (
              <p className="mt-2 text-xs text-muted-foreground">Showing first 500 rows of {filteredRows.length}. Use search or export CSV for full data.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
