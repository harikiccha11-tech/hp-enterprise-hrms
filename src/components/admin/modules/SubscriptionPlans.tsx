'use client'
import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { SectionTitle, EmptyState } from '@/components/shared'
import { toast } from 'sonner'
import { CreditCard, Plus, Pencil, Trash2, Star, Check } from 'lucide-react'
import { api } from '../lib'
import { formatINR } from '../lib'

interface Plan {
  id: string; name: string; description: string | null; priceINR: number | null
  priceUSD: number | null; interval: string; maxEmployees: number | null
  features: string | null; status: string; trialDays: number; sortOrder: number
  isPopular: boolean; createdAt: string
}

const EMPTY = { name: '', description: '', priceINR: '', priceUSD: '', interval: 'MONTHLY', maxEmployees: '', features: '', status: 'ACTIVE', trialDays: '14', sortOrder: '0', isPopular: false }

export function SubscriptionPlans({ refreshKey }: { refreshKey: number }) {
  const [list, setList] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Plan | null>(null)
  const [creating, setCreating] = useState(false)
  const [deleting, setDeleting] = useState<Plan | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api<{ items: Plan[] }>('/api/admin/subscription-plans')
      setList(data.items || [])
    } catch (e: any) { toast.error(e.message || 'Failed to load') } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load, refreshKey])

  return (
    <div className="space-y-5">
      <SectionTitle title="Subscription Plans" desc="Manage pricing and subscription tiers" action={
        <Button className="bg-[var(--navy)] text-white hover:bg-[var(--navy-light)]" onClick={() => setCreating(true)}><Plus className="mr-2 h-4 w-4" /> New Plan</Button>
      } />

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-80 w-full rounded-xl" />)}
        </div>
      ) : list.length === 0 ? (
        <EmptyState icon={CreditCard} title="No subscription plans" desc="Create your first pricing plan" />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {list.map((plan) => {
            const features: string[] = plan.features ? JSON.parse(plan.features) : []
            return (
              <Card key={plan.id} className={`relative ${plan.isPopular ? 'border-[var(--gold)] ring-2 ring-[var(--gold)]/30' : ''}`}>
                {plan.isPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-[var(--gold)] text-white border-0 px-3 py-1 text-xs"><Star className="mr-1 h-3 w-3" /> Popular</Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  {plan.description && <p className="text-sm text-muted-foreground">{plan.description}</p>}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <span className="text-3xl font-bold text-[var(--navy)] dark:text-white">{plan.priceINR != null ? formatINR(plan.priceINR) : 'Custom'}</span>
                    {plan.interval && <span className="text-sm text-muted-foreground">/{plan.interval.toLowerCase()}</span>}
                    {plan.priceUSD != null && <p className="text-xs text-muted-foreground mt-1">${plan.priceUSD}/{plan.interval?.toLowerCase()}</p>}
                  </div>
                  {plan.maxEmployees && <p className="text-center text-sm text-muted-foreground">Up to {plan.maxEmployees} employees</p>}
                  {plan.trialDays > 0 && <p className="text-center text-sm text-emerald-600 font-medium">{plan.trialDays}-day free trial</p>}
                  <ul className="space-y-1.5">
                    {features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm"><Check className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" /><span>{f}</span></li>
                    ))}
                  </ul>
                  <div className="flex items-center justify-between pt-2">
                    <Badge className={plan.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30' : 'bg-gray-500/10 text-gray-700 border-gray-500/30'}>{plan.status}</Badge>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setEditing(plan)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-600" onClick={() => setDeleting(plan)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {(creating || editing) && (
        <PlanFormDialog plan={editing} onClose={() => { setCreating(false); setEditing(null) }} onSuccess={() => { setCreating(false); setEditing(null); load() }} />
      )}

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-700">Delete plan?</AlertDialogTitle>
            <AlertDialogDescription>Permanently delete <strong>{deleting?.name}</strong>?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={async () => {
              if (!deleting) return
              try { await api('/api/admin/subscription-plans', { method: 'DELETE', body: JSON.stringify({ id: deleting.id }) }); toast.success('Deleted'); setDeleting(null); load() } catch (e: any) { toast.error(e.message) }
            }}><Trash2 className="mr-1 h-4 w-4" /> Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function PlanFormDialog({ plan, onClose, onSuccess }: { plan: Plan | null; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState(plan ? {
    name: plan.name, description: plan.description || '', priceINR: plan.priceINR ?? '', priceUSD: plan.priceUSD ?? '',
    interval: plan.interval, maxEmployees: plan.maxEmployees ?? '', features: plan.features || '',
    status: plan.status, trialDays: String(plan.trialDays), sortOrder: String(plan.sortOrder), isPopular: plan.isPopular,
  } : EMPTY)
  const [saving, setSaving] = useState(false)
  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async () => {
    if (!form.name.trim()) { toast.error('Plan name is required'); return }
    setSaving(true)
    try {
      const payload: any = {
        name: form.name.trim(), description: form.description || null,
        priceINR: form.priceINR ? Number(form.priceINR) : null,
        priceUSD: form.priceUSD ? Number(form.priceUSD) : null,
        interval: form.interval,
        maxEmployees: form.maxEmployees ? Number(form.maxEmployees) : null,
        features: form.features || null,
        status: form.status, trialDays: Number(form.trialDays) || 0,
        sortOrder: Number(form.sortOrder) || 0, isPopular: form.isPopular,
      }
      if (plan) { await api('/api/admin/subscription-plans', { method: 'PATCH', body: JSON.stringify({ id: plan.id, ...payload }) }); toast.success('Updated') }
      else { await api('/api/admin/subscription-plans', { method: 'POST', body: JSON.stringify(payload) }); toast.success('Created') }
      onSuccess()
    } catch (e: any) { toast.error(e.message) } finally { setSaving(false) }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" />{plan ? 'Edit Plan' : 'New Plan'}</DialogTitle>
          <DialogDescription>{plan ? 'Update subscription plan' : 'Create a new subscription plan'}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="space-y-1.5"><Label>Name *</Label><Input value={form.name} onChange={(e) => set('name', e.target.value)} /></div>
          <div className="space-y-1.5"><Label>Description</Label><Textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={2} /></div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5"><Label>Price (INR)</Label><Input type="number" value={form.priceINR} onChange={(e) => set('priceINR', e.target.value)} placeholder="0" /></div>
            <div className="space-y-1.5"><Label>Price (USD)</Label><Input type="number" value={form.priceUSD} onChange={(e) => set('priceUSD', e.target.value)} placeholder="0" /></div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Interval</Label>
              <Select value={form.interval} onValueChange={(v) => set('interval', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="MONTHLY">Monthly</SelectItem><SelectItem value="YEARLY">Yearly</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Max Employees</Label><Input type="number" value={form.maxEmployees} onChange={(e) => set('maxEmployees', e.target.value)} /></div>
            <div className="space-y-1.5"><Label>Trial Days</Label><Input type="number" value={form.trialDays} onChange={(e) => set('trialDays', e.target.value)} /></div>
          </div>
          <div className="space-y-1.5"><Label>Features (one per line)</Label><Textarea value={form.features} onChange={(e) => set('features', e.target.value)} rows={5} placeholder="Unlimited employees
Advanced analytics
Priority support" /></div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => set('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="ACTIVE">Active</SelectItem><SelectItem value="INACTIVE">Inactive</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5"><Label>Sort Order</Label><Input type="number" value={form.sortOrder} onChange={(e) => set('sortOrder', e.target.value)} /></div>
            <div className="space-y-1.5 flex items-end pb-0.5"><div className="flex items-center gap-2"><Switch checked={form.isPopular} onCheckedChange={(v) => set('isPopular', v)} /><Label>Popular</Label></div></div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button className="bg-[var(--navy)] text-white hover:bg-[var(--navy-light)]" onClick={submit} disabled={saving}>{saving ? 'Saving...' : plan ? 'Update' : 'Create'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}