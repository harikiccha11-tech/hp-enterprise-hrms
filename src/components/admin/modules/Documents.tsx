'use client'
import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { SectionTitle, EmptyState } from '@/components/shared'
import { toast } from 'sonner'
import {
  FileText, Search, Download, FilePlus2, Award, Loader2, Sparkles,
} from 'lucide-react'
import { api, docTypeLabel, fmtDate, initials } from '../lib'
import { DOCUMENT_TYPES } from '@/lib/constants'

interface EmployeeLite {
  id: string; fullName: string; employeeCode: string | null; designation: string | null; department: string | null
}
interface GeneratedDoc {
  id: string
  docType: string
  title: string
  generatedAt: string
  metaJson: string | null
}

export function Documents({ refreshKey }: { refreshKey: number }) {
  const [employees, setEmployees] = useState<EmployeeLite[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [docs, setDocs] = useState<GeneratedDoc[]>([])
  const [loadingEmps, setLoadingEmps] = useState(true)
  const [loadingDocs, setLoadingDocs] = useState(false)
  const [generating, setGenerating] = useState<string | null>(null)
  const [autoGenerating, setAutoGenerating] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    api<{ employees: EmployeeLite[] }>('/api/admin/employees?status=APPROVED')
      .then((d) => setEmployees(d.employees || []))
      .catch((e: any) => toast.error(e.message || 'Failed to load employees'))
      .finally(() => setLoadingEmps(false))
  }, [])

  const loadDocs = useCallback(async () => {
    if (!selectedId) { setDocs([]); return }
    setLoadingDocs(true)
    try {
      const data = await api<{ docs: GeneratedDoc[] }>(`/api/admin/employees/${selectedId}/documents`)
      setDocs(data.docs || [])
    } catch (e: any) {
      toast.error(e.message || 'Failed to load documents')
    } finally {
      setLoadingDocs(false)
    }
  }, [selectedId, refreshKey])

  useEffect(() => { loadDocs() }, [loadDocs])

  const generate = async (docType: string) => {
    if (!selectedId) return
    setGenerating(docType)
    try {
      await api(`/api/admin/employees/${selectedId}/documents`, {
        method: 'POST',
        body: JSON.stringify({ docType }),
      })
      toast.success(`${docTypeLabel(docType)} generated`)
      loadDocs()
    } catch (e: any) {
      toast.error(e.message || 'Generation failed')
    } finally {
      setGenerating(null)
    }
  }

  const filteredEmps = search.trim()
    ? employees.filter((e) => [e.fullName, e.employeeCode, e.designation, e.department].filter(Boolean).some((v) => v!.toLowerCase().includes(search.trim().toLowerCase())))
    : employees

  const selected = employees.find((e) => e.id === selectedId)
  const existingTypes = new Set(docs.map((d) => d.docType))

  const autoGenerateAll = async () => {
    if (!selectedId) return
    setAutoGenerating(true)
    try {
      const data = await api<{ generated: number }>(`/api/auto-docs?employeeId=${selectedId}`, { method: 'POST' })
      toast.success(`${data.generated || 'All'} documents generated successfully`)
      loadDocs()
    } catch (e: any) {
      toast.error(e.message || 'Auto-generation failed')
    } finally {
      setAutoGenerating(false)
    }
  }

  return (
    <div className="space-y-5">
      <SectionTitle title="Documents" desc="Generate official documents for employees" />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Employee picker */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Select Employee</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search employee…"
                className="pl-9"
              />
            </div>
            <div className="max-h-[60vh] space-y-1 overflow-y-auto scroll-thin pr-1">
              {loadingEmps ? (
                Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)
              ) : filteredEmps.length === 0 ? (
                <EmptyState icon={FileText} title="No employees" />
              ) : (
                filteredEmps.map((e) => (
                  <button
                    key={e.id}
                    onClick={() => setSelectedId(e.id)}
                    className={`flex w-full items-center gap-2.5 rounded-lg border p-2.5 text-left transition-colors ${
                      selectedId === e.id ? 'border-[var(--gold)] bg-[var(--gold)]/5' : 'hover:bg-muted/40'
                    }`}
                  >
                    <Avatar className="h-8 w-8 ring-1 ring-[var(--gold)]/30">
                      <AvatarFallback className="bg-[var(--navy)]/10 text-[10px] font-bold text-[var(--navy)]">
                        {initials(e.fullName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[var(--navy)] dark:text-white">{e.fullName}</p>
                      <p className="truncate text-[11px] text-muted-foreground">{e.employeeCode} • {e.designation || '—'}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Doc generator + list */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Documents</CardTitle>
                {selected && (
                  <p className="text-xs text-muted-foreground mt-0.5">{selected.fullName} • {selected.employeeCode}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {selectedId && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-[var(--gold)]/40 text-[#8a6f24] hover:bg-[var(--gold)]/5"
                    onClick={autoGenerateAll}
                    disabled={autoGenerating}
                  >
                    {autoGenerating ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Generating…</> : <><Sparkles className="mr-1.5 h-3.5 w-3.5" /> Auto-Generate All</>}
                  </Button>
                )}
                {docs.length > 0 && (
                  <Badge variant="outline" className="gap-1 border-[var(--gold)]/40 text-[#8a6f24]">
                    <Award className="h-3 w-3" /> {docs.length} generated
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {!selectedId ? (
              <EmptyState icon={FileText} title="Select an employee" desc="Choose an employee from the list to manage their documents" />
            ) : (
              <div className="space-y-5">
                {/* Generate buttons */}
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Generate Document</p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {DOCUMENT_TYPES.filter((t) => t !== 'salary_slip' && t !== 'attendance_sheet').map((t) => {
                      const has = existingTypes.has(t)
                      return (
                        <Button
                          key={t}
                          variant="outline"
                          size="sm"
                          disabled={generating === t}
                          onClick={() => generate(t)}
                          className="h-auto flex-col items-start gap-0.5 p-2.5 text-left"
                        >
                          {generating === t ? (
                            <Loader2 className="h-4 w-4 animate-spin text-[var(--gold)]" />
                          ) : (
                            <FilePlus2 className={`h-4 w-4 ${has ? 'text-emerald-600' : 'text-[var(--navy)] dark:text-[var(--gold-light)]'}`} />
                          )}
                          <span className="text-xs font-medium">{docTypeLabel(t)}</span>
                          {has && <span className="text-[10px] text-emerald-600">Exists</span>}
                        </Button>
                      )
                    })}
                  </div>
                </div>

                {/* Generated docs list */}
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Generated Documents</p>
                  {loadingDocs ? (
                    <div className="space-y-2">
                      {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                    </div>
                  ) : docs.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-6 text-center">
                      <Award className="mx-auto h-8 w-8 text-muted-foreground/50" />
                      <p className="mt-2 text-sm text-muted-foreground">No documents generated yet</p>
                      <p className="text-xs text-muted-foreground">Use the buttons above to generate official documents</p>
                    </div>
                  ) : (
                    <div className="max-h-72 space-y-1.5 overflow-y-auto scroll-thin pr-1">
                      {docs.map((d) => (
                        <div
                          key={d.id}
                          className="flex items-center justify-between rounded-lg border p-2.5 hover:bg-muted/40 transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="grid h-8 w-8 place-items-center rounded-md bg-[var(--navy)]/10">
                              <FileText className="h-4 w-4 text-[var(--navy)] dark:text-[var(--gold-light)]" />
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-[var(--navy)] dark:text-white">{d.title}</p>
                              <p className="text-[11px] text-muted-foreground">{fmtDate(d.generatedAt)}</p>
                            </div>
                          </div>
                          <Button
                            size="sm" variant="ghost" className="h-8 w-8 p-0"
                            aria-label="View document"
                            onClick={() => window.open(`/api/documents/${d.id}`, '_blank')}
                          >
                            <Download className="h-3.5 w-3.5 text-[var(--gold)]" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
