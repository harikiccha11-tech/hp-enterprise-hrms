'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/shared'
import { api } from '../lib'
import { Search, Users, Building2, FileText, Truck, UserCheck, Monitor, Loader2 } from 'lucide-react'

interface SearchResult {
  id: string
  fullName?: string; employeeCode?: string; personalEmail?: string; status?: string; designation?: string
  clientName?: string; companyName?: string; email?: string
  projectName?: string; site?: string
  vendorName?: string; category?: string
  currentCompany?: string; skills?: string
  name?: string; serialNumber?: string
}

const GROUP_CONFIG: Record<string, { label: string; icon: any; module: string; subKey: string }> = {
  employees: { label: 'Employees', icon: Users, module: 'Employees', subKey: 'fullName' },
  clients: { label: 'Clients', icon: Building2, module: 'Clients', subKey: 'clientName' },
  projects: { label: 'Projects', icon: FileText, module: 'Projects', subKey: 'projectName' },
  vendors: { label: 'Vendors', icon: Truck, module: 'Vendors', subKey: 'vendorName' },
  candidates: { label: 'Candidates', icon: UserCheck, module: 'Recruitment', subKey: 'fullName' },
  assets: { label: 'Assets', icon: Monitor, module: 'Assets', subKey: 'name' },
}

const statusColor: Record<string, string> = {
  APPROVED: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30',
  ACTIVE: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30',
  PENDING: 'bg-amber-500/10 text-amber-700 border-amber-500/30',
  NEW: 'bg-sky-500/10 text-sky-700 border-sky-500/30',
  OPEN: 'bg-sky-500/10 text-sky-700 border-sky-500/30',
  ASSIGNED: 'bg-violet-500/10 text-violet-700 border-violet-500/30',
  AVAILABLE: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30',
}

export function GlobalSearch({ onNavigate }: { onNavigate?: (module: string) => void }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Record<string, SearchResult[]>>({})
  const [searching, setSearching] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 2) { setResults({}); return }
    setSearching(true)
    try {
      const data = await api<{ results: Record<string, SearchResult[]> }>(`/api/admin/global-search?q=${encodeURIComponent(q)}`)
      setResults(data.results || {})
    } catch {} finally { setSearching(false) }
  }, [])

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => doSearch(query), 300)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [query, doSearch])

  const hasResults = Object.keys(results).length > 0
  const totalResults = Object.values(results).reduce((s, arr) => s + arr.length, 0)

  return (
    <div className="space-y-5">
      <div className="relative max-w-2xl mx-auto">
        <Search className="absolute left-5 top-1/2 h-6 w-6 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search employees, clients, projects, vendors, candidates, assets..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-14 pr-10 h-14 text-lg rounded-2xl border-2 focus:border-[var(--navy)]"
          autoFocus
        />
        {searching && <Loader2 className="absolute right-5 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-muted-foreground" />}
      </div>

      {!query && (
        <div className="text-center py-12">
          <div className="grid h-16 w-16 place-items-center rounded-full bg-muted mx-auto">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="mt-4 text-lg font-semibold text-[var(--navy)] dark:text-white">Global Search</p>
          <p className="text-sm text-muted-foreground mt-1">Type at least 2 characters to search across all entities</p>
        </div>
      )}

      {query.length >= 2 && !searching && !hasResults && (
        <EmptyState icon={Search} title="No results found" desc={`No matches for "${query}" across any entity`} />
      )}

      {hasResults && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Found <strong>{totalResults}</strong> results across <strong>{Object.keys(results).length}</strong> categories</p>
          {Object.entries(results).map(([group, items]) => {
            const config = GROUP_CONFIG[group]
            if (!config) return null
            const Icon = config.icon
            return (
              <Card key={group}>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className="h-4 w-4 text-[var(--navy)]" />
                    <h3 className="font-semibold text-sm text-[var(--navy)] dark:text-white">{config.label}</h3>
                    <Badge variant="outline" className="text-xs">{items.length}</Badge>
                  </div>
                  <div className="space-y-1">
                    {items.map((item) => {
                      const name = (item as any)[config.subKey] || item.fullName || item.projectName || item.vendorName || item.name || ''
                      const sub = item.designation || item.companyName || item.site || item.category || item.currentCompany || item.serialNumber || ''
                      const status = item.status
                      return (
                        <button
                          key={item.id}
                          className="w-full flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-left hover:bg-muted/50 transition-colors"
                          onClick={() => onNavigate?.(config.module)}
                        >
                          <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{name}</p>
                            {sub && <p className="text-xs text-muted-foreground truncate">{sub}</p>}
                          </div>
                          {status && <Badge className={statusColor[status] || 'bg-gray-500/10 text-gray-700 border-gray-500/30'}>{status}</Badge>}
                        </button>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}