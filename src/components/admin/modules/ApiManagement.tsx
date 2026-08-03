'use client'
import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Separator } from '@/components/ui/separator'
import { SectionTitle, EmptyState } from '@/components/shared'
import { toast } from 'sonner'
import {
  Key, Plus, Search, Copy, Eye, EyeOff, Trash2, Pencil, Webhook,
  BarChart3, ExternalLink, RefreshCw, CheckCircle2, XCircle, Clock,
  ArrowUpRight, ArrowDownRight, Activity, Zap, Shield, BookOpen,
  RotateCcw, Ban, Server, Timer, Users, TrendingUp, AlertTriangle,
} from 'lucide-react'

interface ApiKey {
  id: string
  name: string
  key: string
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED'
  createdAt: string
  lastUsed: string
  totalCalls: number
  rateLimit: string
  expiresAt: string | null
  isEnabled: boolean
}

interface WebhookConfig {
  id: string
  name: string
  url: string
  events: string[]
  status: 'ACTIVE' | 'PAUSED'
  lastTriggered: string
  successRate: number
}

interface UsageStat {
  label: string
  value: string
  change: string
  positive: boolean
  icon: typeof Zap
}

const MOCK_KEYS: ApiKey[] = [
  {
    id: '1', name: 'Production API Key', key: 'hpe_prod_sk_a8f3k2m9x1b4c7d0e5f6g8h2j4k6l9',
    status: 'ACTIVE', createdAt: '2024-11-15T10:30:00Z', lastUsed: '2025-06-14T08:22:00Z', totalCalls: 284729, rateLimit: '1000/min', expiresAt: null, isEnabled: true,
  },
  {
    id: '2', name: 'Staging Environment', key: 'hpe_stg_sk_z3x5c7v9b1n3m5k8p2r4t6y8w0q1s3a',
    status: 'ACTIVE', createdAt: '2025-01-08T14:15:00Z', lastUsed: '2025-06-13T17:45:00Z', totalCalls: 45812, rateLimit: '500/min', expiresAt: '2025-12-31T23:59:59Z', isEnabled: true,
  },
  {
    id: '3', name: 'Mobile App Integration', key: 'hpe_mob_sk_d4f6g8h0j2l4n6p8r0s2t4v6x8z0b2d',
    status: 'ACTIVE', createdAt: '2025-03-22T09:00:00Z', lastUsed: '2025-06-14T06:10:00Z', totalCalls: 128403, rateLimit: '2000/min', expiresAt: '2026-03-22T09:00:00Z', isEnabled: true,
  },
  {
    id: '4', name: 'Legacy Integration (Deprecated)', key: 'hpe_leg_sk_m1n3p5r7t9v1x3z5b7d9f1g3h5j7k9l',
    status: 'REVOKED', createdAt: '2024-06-01T11:00:00Z', lastUsed: '2025-02-28T23:59:00Z', totalCalls: 512048, rateLimit: '200/min', expiresAt: null, isEnabled: false,
  },
  {
    id: '5', name: 'Staging API Key', key: 'hpe_sta_sk_q7w9e2r4t6y8u0i1o3p5a7s9d1f3g5',
    status: 'ACTIVE', createdAt: '2025-04-10T12:00:00Z', lastUsed: '2025-06-12T15:30:00Z', totalCalls: 18920, rateLimit: '100/min', expiresAt: '2025-10-10T12:00:00Z', isEnabled: true,
  },
  {
    id: '6', name: 'Mobile App Key', key: 'hpe_mak_sk_b6n8m0k2j4h6g8f0d2s4a6u8y0e2w4',
    status: 'ACTIVE', createdAt: '2025-05-01T08:00:00Z', lastUsed: '2025-06-14T09:45:00Z', totalCalls: 67215, rateLimit: '10000/min', expiresAt: '2026-05-01T08:00:00Z', isEnabled: false,
  },
]

const MOCK_WEBHOOKS: WebhookConfig[] = [
  { id: '1', name: 'Employee Onboarding', url: 'https://hooks.internal/hr/onboarding', events: ['employee.created', 'employee.approved'], status: 'ACTIVE', lastTriggered: '2025-06-13T14:22:00Z', successRate: 99.8 },
  { id: '2', name: 'Payroll Events', url: 'https://hooks.internal/finance/payroll', events: ['payroll.processed', 'payslip.generated'], status: 'ACTIVE', lastTriggered: '2025-06-01T00:05:00Z', successRate: 100 },
  { id: '3', name: 'Leave Notifications', url: 'https://hooks.internal/notifications/leave', events: ['leave.applied', 'leave.approved', 'leave.rejected'], status: 'PAUSED', lastTriggered: '2025-05-20T09:15:00Z', successRate: 97.2 },
]

const MOCK_STATS: UsageStat[] = [
  { label: 'Total API Calls (30d)', value: '458,944', change: '+12.3%', positive: true, icon: BarChart3 },
  { label: 'Avg Response Time', value: '142ms', change: '-8.1%', positive: true, icon: Timer },
  { label: 'Error Rate', value: '0.12%', change: '-0.05%', positive: true, icon: AlertTriangle },
  { label: 'Active Integrations', value: '7', change: '+2', positive: true, icon: Server },
]

const WEBHOOK_EVENTS = [
  'employee.created', 'employee.approved', 'employee.updated',
  'leave.applied', 'leave.approved', 'leave.rejected',
  'payroll.processed', 'payslip.generated',
  'attendance.marked', 'invoice.generated',
]

const RATE_LIMIT_OPTIONS = [
  { value: '10/min', label: '10/min (Minimal)' },
  { value: '100/min', label: '100/min (Low)' },
  { value: '1000/min', label: '1,000/min (Standard)' },
  { value: '10000/min', label: '10,000/min (High)' },
  { value: 'custom', label: 'Custom' },
]

const EXPIRY_OPTIONS = [
  { value: 'never', label: 'Never' },
  { value: '30', label: '30 days' },
  { value: '90', label: '90 days' },
  { value: '365', label: '1 year' },
  { value: 'custom', label: 'Custom' },
]

function statusColor(status: string, isEnabled?: boolean) {
  if (status === 'ACTIVE' && isEnabled === false) return 'bg-amber-500/10 text-amber-700 border-amber-500/30'
  if (status === 'ACTIVE') return 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30'
  if (status === 'REVOKED' || status === 'EXPIRED') return 'bg-red-500/10 text-red-700 border-red-500/30'
  return 'bg-gray-500/10 text-gray-700 border-gray-500/30'
}

function statusLabel(status: string, isEnabled?: boolean) {
  if (status === 'ACTIVE' && isEnabled === false) return 'DISABLED'
  return status
}

function maskKey(key: string) {
  return key.slice(0, 12) + '••••••••••••••••' + key.slice(-4)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return formatDate(iso)
}

function getExpiryDate(expiryValue: string): string | null {
  if (expiryValue === 'never') return null
  const days = parseInt(expiryValue, 10)
  if (isNaN(days) || days <= 0) return null
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString()
}

export function ApiManagement({ refreshKey }: { refreshKey: number }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [keys, setKeys] = useState<ApiKey[]>(MOCK_KEYS)
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>(MOCK_WEBHOOKS)
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set())
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [creatingKey, setCreatingKey] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [newKeyRateLimit, setNewKeyRateLimit] = useState('1000/min')
  const [newKeyCustomRateLimit, setNewKeyCustomRateLimit] = useState('')
  const [newKeyExpiry, setNewKeyExpiry] = useState('never')
  const [newKeyCustomExpiry, setNewKeyCustomExpiry] = useState('')
  const [creatingWebhook, setCreatingWebhook] = useState(false)
  const [webhookName, setWebhookName] = useState('')
  const [webhookUrl, setWebhookUrl] = useState('')
  const [webhookEvents, setWebhookEvents] = useState<string[]>([])
  const [revoking, setRevoking] = useState<ApiKey | null>(null)
  const [deletingWebhook, setDeletingWebhook] = useState<WebhookConfig | null>(null)
  const [regeneratingKey, setRegeneratingKey] = useState<ApiKey | null>(null)
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set())
  const [bulkRevoking, setBulkRevoking] = useState(false)

  const filteredKeys = useMemo(() => {
    return keys.filter((k) => {
      const matchSearch = !search || k.name.toLowerCase().includes(search.toLowerCase()) || k.key.toLowerCase().includes(search.toLowerCase())
      const matchStatus = !statusFilter || k.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [keys, search, statusFilter, refreshKey])

  const allFilteredSelected = filteredKeys.length > 0 && filteredKeys.every((k) => selectedKeys.has(k.id))
  const someSelected = selectedKeys.size > 0

  const toggleReveal = (id: string) => {
    setRevealedKeys((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const copyKey = (key: string, id: string) => {
    navigator.clipboard.writeText(key)
    setCopiedId(id)
    toast.success('Copied!')
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleCreateKey = () => {
    if (!newKeyName.trim()) { toast.error('Key name is required'); return }
    const resolvedRateLimit = newKeyRateLimit === 'custom' ? (newKeyCustomRateLimit.trim() || '1000/min') : newKeyRateLimit
    const resolvedExpiry = newKeyExpiry === 'custom' ? newKeyCustomExpiry.trim() : newKeyExpiry
    const newKey: ApiKey = {
      id: String(Date.now()),
      name: newKeyName,
      key: `hpe_new_sk_${Math.random().toString(36).slice(2, 34)}`,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      lastUsed: 'Never',
      totalCalls: 0,
      rateLimit: resolvedRateLimit,
      expiresAt: getExpiryDate(resolvedExpiry),
      isEnabled: true,
    }
    setKeys([newKey, ...keys])
    setNewKeyName('')
    setNewKeyRateLimit('1000/min')
    setNewKeyCustomRateLimit('')
    setNewKeyExpiry('never')
    setNewKeyCustomExpiry('')
    setCreatingKey(false)
    toast.success('New API key generated successfully')
  }

  const handleRevoke = () => {
    if (!revoking) return
    setKeys((prev) => prev.map((k) => k.id === revoking.id ? { ...k, status: 'REVOKED' as const, isEnabled: false } : k))
    setRevealedKeys((prev) => { const n = new Set(prev); n.delete(revoking.id); return n })
    setRevoking(null)
    toast.success(`API key "${revoking.name}" has been revoked`)
  }

  const handleRegenerateKey = () => {
    if (!regeneratingKey) return
    setKeys((prev) => prev.map((k) => {
      if (k.id === regeneratingKey.id) {
        return {
          ...k,
          key: `hpe_reg_sk_${Math.random().toString(36).slice(2, 34)}`,
          status: 'ACTIVE' as const,
          isEnabled: true,
          createdAt: new Date().toISOString(),
        }
      }
      return k
    }))
    setRegeneratingKey(null)
    toast.success(`API key regenerated for "${regeneratingKey.name}"`)
  }

  const toggleKeyEnabled = (id: string) => {
    setKeys((prev) => prev.map((k) => {
      if (k.id === id && k.status === 'ACTIVE') {
        const newEnabled = !k.isEnabled
        toast.success(newEnabled ? `API key "${k.name}" enabled` : `API key "${k.name}" disabled`)
        return { ...k, isEnabled: newEnabled }
      }
      return k
    }))
  }

  const toggleSelectKey = (id: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedKeys(new Set())
    } else {
      setSelectedKeys(new Set(filteredKeys.map((k) => k.id)))
    }
  }

  const handleBulkRevoke = () => {
    const ids = selectedKeys
    setKeys((prev) => prev.map((k) => ids.has(k.id) ? { ...k, status: 'REVOKED' as const, isEnabled: false } : k))
    setRevealedKeys((prev) => {
      const n = new Set(prev)
      ids.forEach((id) => n.delete(id))
      return n
    })
    setSelectedKeys(new Set())
    setBulkRevoking(false)
    toast.success(`${ids.size} API key(s) have been bulk revoked`)
  }

  const toggleWebhookStatus = (id: string) => {
    setWebhooks((prev) => prev.map((w) => w.id === id ? { ...w, status: w.status === 'ACTIVE' ? 'PAUSED' as const : 'ACTIVE' as const } : w))
  }

  const handleCreateWebhook = () => {
    if (!webhookName.trim() || !webhookUrl.trim()) { toast.error('Name and URL are required'); return }
    if (webhookEvents.length === 0) { toast.error('Select at least one event'); return }
    const newWh: WebhookConfig = {
      id: String(Date.now()),
      name: webhookName, url: webhookUrl, events: webhookEvents,
      status: 'ACTIVE', lastTriggered: 'Never', successRate: 100,
    }
    setWebhooks([newWh, ...webhooks])
    setWebhookName(''); setWebhookUrl(''); setWebhookEvents([])
    setCreatingWebhook(false)
    toast.success('Webhook created successfully')
  }

  const toggleWebhookEvent = (event: string) => {
    setWebhookEvents((prev) => prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event])
  }

  return (
    <div className="space-y-6">
      <SectionTitle
        title="API Management"
        desc="API keys, webhooks & integrations"
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setCreatingWebhook(true)}>
              <Webhook className="mr-2 h-4 w-4" /> New Webhook
            </Button>
            <Button className="bg-[var(--navy)] text-white hover:bg-[var(--navy-light)]" onClick={() => setCreatingKey(true)}>
              <Plus className="mr-2 h-4 w-4" /> Generate API Key
            </Button>
          </div>
        }
      />

      {/* Usage Stats Dashboard */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {MOCK_STATS.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} className="relative overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--navy)]/10">
                    <Icon className="h-4 w-4 text-[var(--navy)] dark:text-[var(--gold-light)]" />
                  </div>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-[var(--navy)] dark:text-white">{stat.value}</p>
                  <span className={`inline-flex items-center gap-0.5 text-xs font-medium ${stat.positive ? 'text-emerald-600' : 'text-red-600'}`}>
                    {stat.positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {stat.change}
                  </span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* API Usage Timeline Placeholder */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="h-4 w-4 text-[var(--gold)]" /> API Usage Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-muted-foreground/25 bg-muted/30">
            <div className="text-center">
              <BarChart3 className="mx-auto h-10 w-10 text-muted-foreground/40" />
              <p className="mt-2 text-sm text-muted-foreground">Usage chart will render here</p>
              <p className="text-xs text-muted-foreground/60">Connect to analytics backend to see daily call volumes</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Keys Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Key className="h-4 w-4 text-[var(--gold)]" /> API Keys
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search API keys..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v === '_all_' ? '' : v); setSelectedKeys(new Set()) }}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all_">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="REVOKED">Revoked</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bulk Actions Bar */}
          {someSelected && (
            <div className="mb-3 flex items-center gap-3 rounded-lg border border-[var(--gold)]/30 bg-[var(--gold)]/5 px-4 py-2.5">
              <span className="text-sm font-medium text-[var(--navy)] dark:text-[var(--gold-light)]">
                {selectedKeys.size} key{selectedKeys.size > 1 ? 's' : ''} selected
              </span>
              <div className="flex-1" />
              <Button size="sm" variant="outline" className="text-muted-foreground" onClick={() => setSelectedKeys(new Set())}>
                Clear Selection
              </Button>
              <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50" onClick={() => setBulkRevoking(true)}>
                <Ban className="mr-1.5 h-3.5 w-3.5" /> Bulk Revoke
              </Button>
            </div>
          )}

          <div className="max-h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={filteredKeys.length > 0 ? (allFilteredSelected ? true : someSelected && filteredKeys.some((k) => selectedKeys.has(k.id)) ? 'indeterminate' : false) : false}
                      onCheckedChange={() => toggleSelectAll()}
                      aria-label="Select all keys"
                    />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>API Key</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Enabled</TableHead>
                  <TableHead>Rate Limit</TableHead>
                  <TableHead>Total Calls</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredKeys.map((k) => {
                  const revealed = revealedKeys.has(k.id)
                  const displayKey = revealed ? k.key : maskKey(k.key)
                  const isSelected = selectedKeys.has(k.id)
                  return (
                    <TableRow key={k.id} data-selected={isSelected || undefined} className={isSelected ? 'bg-muted/50' : ''}>
                      <TableCell>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelectKey(k.id)}
                          aria-label={`Select ${k.name}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{k.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono max-w-[220px] truncate">{displayKey}</code>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => toggleReveal(k.id)} aria-label={revealed ? 'Hide key' : 'Reveal key'}>
                            {revealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => copyKey(k.key, k.id)} aria-label="Copy key">
                            <Copy className={`h-3.5 w-3.5 ${copiedId === k.id ? 'text-emerald-600' : ''}`} />
                          </Button>
                          {copiedId === k.id && (
                            <span className="text-xs font-medium text-emerald-600">Copied!</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell><Badge className={statusColor(k.status, k.isEnabled)}>{statusLabel(k.status, k.isEnabled)}</Badge></TableCell>
                      <TableCell>
                        {k.status === 'ACTIVE' ? (
                          <Switch
                            checked={k.isEnabled}
                            onCheckedChange={() => toggleKeyEnabled(k.id)}
                            aria-label={`Toggle ${k.name}`}
                          />
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{k.rateLimit}</TableCell>
                      <TableCell className="text-sm font-mono">{k.totalCalls.toLocaleString()}</TableCell>
                      <TableCell className="text-sm">{formatDate(k.createdAt)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{k.lastUsed === 'Never' ? 'Never' : relativeTime(k.lastUsed)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-0.5">
                          {k.status === 'ACTIVE' && (
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-[var(--navy)]" onClick={() => setRegeneratingKey(k)} aria-label="Regenerate key" title="Regenerate key">
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          )}
                          {k.status === 'ACTIVE' && (
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-600 hover:text-red-700" onClick={() => setRevoking(k)} aria-label="Revoke key">
                              <XCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
                {filteredKeys.length === 0 && (
                  <TableRow><TableCell colSpan={10} className="text-center text-muted-foreground py-8">No API keys match your filters</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Webhook Configuration */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Webhook className="h-4 w-4 text-[var(--gold)]" /> Webhook Endpoints
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-96 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>URL</TableHead>
                  <TableHead>Events</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Success Rate</TableHead>
                  <TableHead>Last Triggered</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {webhooks.map((w) => (
                  <TableRow key={w.id}>
                    <TableCell className="font-medium">{w.name}</TableCell>
                    <TableCell>
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono max-w-[200px] truncate block">{w.url}</code>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {w.events.slice(0, 2).map((e) => (
                          <Badge key={e} variant="outline" className="text-[10px]">{e}</Badge>
                        ))}
                        {w.events.length > 2 && (
                          <Badge variant="outline" className="text-[10px]">+{w.events.length - 2}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch checked={w.status === 'ACTIVE'} onCheckedChange={() => toggleWebhookStatus(w.id)} />
                        <Badge className={w.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30' : 'bg-amber-500/10 text-amber-700 border-amber-500/30'}>
                          {w.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      <span className={w.successRate >= 99 ? 'text-emerald-600' : w.successRate >= 95 ? 'text-amber-600' : 'text-red-600'}>
                        {w.successRate}%
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{w.lastTriggered === 'Never' ? 'Never' : relativeTime(w.lastTriggered)}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-600 hover:text-red-700" onClick={() => setDeletingWebhook(w)} aria-label="Delete webhook">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Integration Documentation */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="h-4 w-4 text-[var(--gold)]" /> Integration Documentation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { title: 'Getting Started', desc: 'Authentication, base URL, and your first API call', icon: Zap },
              { title: 'Authentication', desc: 'API key auth, OAuth 2.0, and token management', icon: Shield },
              { title: 'Rate Limiting', desc: 'Quotas, throttling, and best practices', icon: Activity },
              { title: 'Webhooks Guide', desc: 'Setting up and managing webhook endpoints', icon: Webhook },
              { title: 'API Reference', desc: 'Complete endpoint documentation with examples', icon: BookOpen },
              { title: 'SDKs & Libraries', desc: 'Official SDKs for JavaScript, Python, and Java', icon: BarChart3 },
            ].map((doc) => {
              const Icon = doc.icon
              return (
                <button
                  key={doc.title}
                  className="flex items-start gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-muted/60"
                  onClick={() => toast.info(`${doc.title} documentation would open here`)}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--navy)]/10">
                    <Icon className="h-4 w-4 text-[var(--navy)] dark:text-[var(--gold-light)]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-[var(--navy)] dark:text-white">{doc.title}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{doc.desc}</p>
                  </div>
                  <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Generate API Key Dialog */}
      <Dialog open={creatingKey} onOpenChange={(o) => !o && setCreatingKey(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" /> Generate New API Key
            </DialogTitle>
            <DialogDescription>Create a new API key for integration access. Keep it secure.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Key Name *</Label>
              <Input value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} placeholder="e.g. Production API Key" />
            </div>
            <div className="space-y-1.5">
              <Label>Rate Limit</Label>
              <Select value={newKeyRateLimit} onValueChange={setNewKeyRateLimit}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RATE_LIMIT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {newKeyRateLimit === 'custom' && (
                <Input
                  className="mt-1.5"
                  placeholder="e.g. 5000/min"
                  value={newKeyCustomRateLimit}
                  onChange={(e) => setNewKeyCustomRateLimit(e.target.value)}
                />
              )}
            </div>
            <div className="space-y-1.5">
              <Label>Key Expiry</Label>
              <Select value={newKeyExpiry} onValueChange={setNewKeyExpiry}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {EXPIRY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {newKeyExpiry === 'custom' && (
                <Input
                  className="mt-1.5"
                  type="number"
                  min="1"
                  placeholder="Number of days"
                  value={newKeyCustomExpiry}
                  onChange={(e) => setNewKeyCustomExpiry(e.target.value)}
                />
              )}
            </div>
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
              <p className="text-xs text-amber-700 dark:text-amber-400">
                <strong>Warning:</strong> The API key will only be displayed once after creation. Store it securely.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreatingKey(false)}>Cancel</Button>
            <Button className="bg-[var(--navy)] text-white hover:bg-[var(--navy-light)]" onClick={handleCreateKey}>
              <Key className="mr-2 h-4 w-4" /> Generate Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Webhook Dialog */}
      <Dialog open={creatingWebhook} onOpenChange={(o) => !o && setCreatingWebhook(false)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Webhook className="h-5 w-5" /> Create Webhook
            </DialogTitle>
            <DialogDescription>Configure a webhook endpoint to receive real-time event notifications.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Webhook Name *</Label>
              <Input value={webhookName} onChange={(e) => setWebhookName(e.target.value)} placeholder="e.g. HR Onboarding Events" />
            </div>
            <div className="space-y-1.5">
              <Label>Endpoint URL *</Label>
              <Input value={webhookUrl} onChange={(e) => setWebhookUrl(e.target.value)} placeholder="https://your-server.com/webhook" />
            </div>
            <div className="space-y-1.5">
              <Label>Events *</Label>
              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {WEBHOOK_EVENTS.map((event) => (
                  <button
                    key={event}
                    onClick={() => toggleWebhookEvent(event)}
                    className={`flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-left text-xs transition-colors ${webhookEvents.includes(event) ? 'border-[var(--gold)] bg-[var(--gold)]/10 text-[var(--navy)] dark:text-[var(--gold-light)]' : 'hover:bg-muted'}`}
                  >
                    <div className={`h-3.5 w-3.5 rounded border flex items-center justify-center ${webhookEvents.includes(event) ? 'bg-[var(--gold)] border-[var(--gold)]' : 'border-muted-foreground/30'}`}>
                      {webhookEvents.includes(event) && <CheckCircle2 className="h-2.5 w-2.5 text-[var(--navy)]" />}
                    </div>
                    {event}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreatingWebhook(false)}>Cancel</Button>
            <Button className="bg-[var(--navy)] text-white hover:bg-[var(--navy-light)]" onClick={handleCreateWebhook}>
              <Webhook className="mr-2 h-4 w-4" /> Create Webhook
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke API Key Dialog */}
      <AlertDialog open={!!revoking} onOpenChange={(o) => !o && setRevoking(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-700">Revoke API Key?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently revoke <strong>{revoking?.name}</strong>. All applications using this key will immediately lose access.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleRevoke}>
              <XCircle className="mr-1 h-4 w-4" /> Revoke Key
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Regenerate API Key Dialog */}
      <AlertDialog open={!!regeneratingKey} onOpenChange={(o) => !o && setRegeneratingKey(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Regenerate API Key?</AlertDialogTitle>
            <AlertDialogDescription>
              This will generate a new API key for <strong>{regeneratingKey?.name}</strong> and revoke the existing one.
              Any application using the current key will immediately lose access. Make sure to update your integrations with the new key.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-[var(--navy)] text-white hover:bg-[var(--navy-light)]" onClick={handleRegenerateKey}>
              <RotateCcw className="mr-1 h-4 w-4" /> Regenerate Key
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Revoke API Keys Dialog */}
      <AlertDialog open={bulkRevoking} onOpenChange={(o) => !o && setBulkRevoking(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-700">Bulk Revoke {selectedKeys.size} API Key{selectedKeys.size > 1 ? 's' : ''}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently revoke <strong>{selectedKeys.size} API key{selectedKeys.size > 1 ? 's' : ''}</strong>.
              All applications using these keys will immediately lose access. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleBulkRevoke}>
              <Ban className="mr-1 h-4 w-4" /> Revoke {selectedKeys.size} Key{selectedKeys.size > 1 ? 's' : ''}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Webhook Dialog */}
      <AlertDialog open={!!deletingWebhook} onOpenChange={(o) => !o && setDeletingWebhook(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-700">Delete Webhook?</AlertDialogTitle>
            <AlertDialogDescription>
              Permanently delete the <strong>{deletingWebhook?.name}</strong> webhook? Event notifications will stop immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => {
              if (!deletingWebhook) return
              setWebhooks((prev) => prev.filter((w) => w.id !== deletingWebhook.id))
              setDeletingWebhook(null)
              toast.success('Webhook deleted')
            }}>
              <Trash2 className="mr-1 h-4 w-4" /> Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
