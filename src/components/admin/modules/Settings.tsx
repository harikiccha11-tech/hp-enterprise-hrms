'use client'
import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { SectionTitle, EmptyState } from '@/components/shared'
import { toast } from 'sonner'
import { Settings as SettingsIcon, Save, Lock, Wallet, CalendarDays, Building2, RotateCcw } from 'lucide-react'
import { api } from '../lib'

const FIELDS: { group: string; icon: any; fields: { key: string; label: string; type?: 'number' | 'text' | 'time'; suffix?: string; hint?: string }[] }[] = [
  {
    group: 'Payroll', icon: Wallet,
    fields: [
      { key: 'payroll.pfRate', label: 'PF Rate', type: 'number', suffix: '%', hint: 'Employee contribution rate' },
      { key: 'payroll.esiRate', label: 'ESI Rate', type: 'number', suffix: '%', hint: 'Applicable if gross ≤ ₹21,000' },
      { key: 'payroll.professionalTax', label: 'Professional Tax', type: 'number', suffix: '₹', hint: 'Monthly flat deduction' },
      { key: 'payroll.standardWorkingDays', label: 'Standard Working Days', type: 'number', hint: 'Per month' },
      { key: 'payroll.workStartTime', label: 'Work Start Time', type: 'time' },
      { key: 'payroll.workEndTime', label: 'Work End Time', type: 'time' },
      { key: 'payroll.lateGraceMinutes', label: 'Late Grace (minutes)', type: 'number' },
      { key: 'payroll.overtimeRate', label: 'Overtime Rate', type: 'number', suffix: 'x', hint: 'Multiplier of hourly rate' },
    ],
  },
  {
    group: 'Leave', icon: CalendarDays,
    fields: [
      { key: 'leave.casualAnnual', label: 'Casual Leave (Annual)', type: 'number', suffix: 'days' },
      { key: 'leave.sickAnnual', label: 'Sick Leave (Annual)', type: 'number', suffix: 'days' },
      { key: 'leave.earnedAnnual', label: 'Earned Leave (Annual)', type: 'number', suffix: 'days' },
      { key: 'leave.carryForwardCap', label: 'Carry Forward Cap', type: 'number', suffix: 'days', hint: 'Max leave carried to next year' },
    ],
  },
  {
    group: 'Company', icon: Building2,
    fields: [
      { key: 'company.adminEmail', label: 'Admin Email', type: 'text', hint: 'Receives system alerts' },
    ],
  },
]

export function SettingsModule({ isSuperAdmin }: { isSuperAdmin: boolean }) {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [original, setOriginal] = useState<Record<string, string>>({})

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await api<{ settings: Record<string, string> }>('/api/admin/settings')
      setSettings(data.settings || {})
      setOriginal(data.settings || {})
    } catch (e: any) {
      toast.error(e.message || 'Failed to load settings')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const set = (k: string, v: string) => setSettings((s) => ({ ...s, [k]: v }))

  const save = async () => {
    setSaving(true)
    try {
      await api('/api/admin/settings', { method: 'PUT', body: JSON.stringify({ settings }) })
      toast.success('Settings saved')
      setOriginal(settings)
    } catch (e: any) {
      toast.error(e.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const reset = () => setSettings(original)

  const hasChanges = JSON.stringify(settings) !== JSON.stringify(original)

  if (!isSuperAdmin) {
    return (
      <div className="space-y-5">
        <SectionTitle title="Settings" desc="System configuration" />
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={Lock}
              title="Owner only"
              desc="System settings can only be modified by the Owner role."
            />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <SectionTitle
        title="Settings"
        desc="Configure payroll, leave & company-wide parameters"
        action={
          <div className="flex items-center gap-2">
            {hasChanges && (
              <Button variant="outline" onClick={reset} disabled={saving}>
                <RotateCcw className="mr-1 h-4 w-4" /> Reset
              </Button>
            )}
            <Button
              className="bg-[var(--navy)] text-white hover:bg-[var(--navy-light)]"
              onClick={save}
              disabled={saving || !hasChanges}
            >
              <Save className="mr-1 h-4 w-4" /> {saving ? 'Saving…' : 'Save Changes'}
            </Button>
          </div>
        }
      />

      <Alert className="border-[var(--gold)]/30 bg-[var(--gold)]/5">
        <SettingsIcon className="h-4 w-4 text-[#8a6f24]" />
        <AlertTitle className="text-[#8a6f24]">System Configuration</AlertTitle>
        <AlertDescription className="text-xs text-[#8a6f24]/80">
          These values are used by the payroll engine, attendance system, and leave management. Changes apply to all future computations.
        </AlertDescription>
      </Alert>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-64 w-full" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {FIELDS.map((group) => {
            const Icon = group.icon
            return (
              <Card key={group.group}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Icon className="h-4 w-4 text-[var(--gold)]" /> {group.group}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {group.fields.map((f) => (
                      <div key={f.key} className="space-y-1.5">
                        <Label htmlFor={f.key} className="text-xs">
                          {f.label}
                          {f.suffix && <span className="ml-1 text-muted-foreground">({f.suffix})</span>}
                        </Label>
                        <Input
                          id={f.key}
                          type={f.type || 'text'}
                          value={settings[f.key] ?? ''}
                          onChange={(e) => set(f.key, e.target.value)}
                          className={f.type === 'time' ? 'font-mono' : ''}
                        />
                        {f.hint && <p className="text-[10px] text-muted-foreground">{f.hint}</p>}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {hasChanges && (
        <div className="sticky bottom-4 z-20 mx-auto max-w-md">
          <div className="rounded-full border bg-card p-1 pl-4 shadow-lg">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium text-muted-foreground">Unsaved changes</p>
              <div className="flex items-center gap-1">
                <Button size="sm" variant="ghost" onClick={reset} disabled={saving}>Discard</Button>
                <Button size="sm" className="bg-[var(--navy)] text-white hover:bg-[var(--navy-light)]" onClick={save} disabled={saving}>
                  <Save className="mr-1 h-3.5 w-3.5" /> Save
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
