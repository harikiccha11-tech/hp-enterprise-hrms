'use client'
import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { SectionTitle, EmptyState } from '@/components/shared'
import { useAppStore } from '@/lib/store'
import { LANGUAGES, t } from '@/lib/i18n'
import { BRAND, SOCIAL } from '@/lib/constants'
import { FollowUs } from '@/components/shared/FollowUs'
import { toast } from 'sonner'
import {
  Settings as SettingsIcon, Save, Lock, Wallet, CalendarDays, Building2,
  RotateCcw, Sun, Moon, Palette, Globe, CreditCard, Check, Sparkles,
  Users, FileText, Bot, HardDrive, Crown, ArrowDown, ArrowUp, Tag,
} from 'lucide-react'
import { api } from '../lib'

// ── Read-only display field helper ──────────────────────────────────────────
function ReadOnlyField({ label, value, href }: { label: string; value: string; href?: string }) {
  const display = (
    <div className="space-y-1">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <p className="text-sm font-medium break-all">{value}</p>
    </div>
  )
  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="block rounded-md p-2 -m-2 transition-colors hover:bg-muted/60">
        {display}
      </a>
    )
  }
  return display
}

// ── Payroll & Leave fields (original, minus Company group) ─────────────────
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
]

// ── Subscription plans data ────────────────────────────────────────────────
const PLANS = [
  {
    key: 'free',
    name: 'Free',
    price: 0,
    features: ['Up to 10 employees', '5 documents', 'No AI'],
    tier: 0,
  },
  {
    key: 'starter',
    name: 'Starter',
    price: 2999,
    features: ['Up to 50 employees', '50 documents', '50 AI queries'],
    tier: 1,
  },
  {
    key: 'professional',
    name: 'Professional',
    price: 7999,
    features: ['Up to 200 employees', '500 documents', '500 AI queries'],
    tier: 2,
  },
  {
    key: 'enterprise',
    name: 'Enterprise',
    price: 19999,
    features: ['Unlimited employees', 'Unlimited documents', 'Unlimited AI'],
    tier: 3,
  },
]
const CURRENT_PLAN = 'professional'
const CURRENT_TIER = PLANS.find((p) => p.key === CURRENT_PLAN)!.tier

// ── Usage stats ────────────────────────────────────────────────────────────
const USAGE = [
  { label: 'Employees', current: 1, max: 200, icon: Users },
  { label: 'Documents Generated', current: 0, max: 500, icon: FileText },
  { label: 'AI Queries (this month)', current: 0, max: 500, icon: Bot },
  { label: 'Storage Used', current: 2.1, max: 5120, icon: HardDrive, displayValue: '2.1 MB / 5 GB' },
]

export function SettingsModule({ isSuperAdmin, isOwner }: { isSuperAdmin: boolean; isOwner: boolean }) {
  const { darkMode, setDarkMode, themeColors, setThemeColors, lang, setLang } = useAppStore()
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

  const saveBranding = async () => {
    setSaving(true)
    try {
      const branding: Record<string, string> = {
        'brand.companyName': settings['brand.companyName'] || '',
        'brand.tagline': settings['brand.tagline'] || '',
        'company.adminEmail': settings['company.adminEmail'] || '',
      }
      await api('/api/admin/settings', { method: 'PUT', body: JSON.stringify({ settings: branding }) })
      toast.success('Branding settings saved')
      setOriginal((o) => ({ ...o, ...branding }))
    } catch (e: any) {
      toast.error(e.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  const reset = () => setSettings(original)
  const hasChanges = JSON.stringify(settings) !== JSON.stringify(original)
  const hasBrandingChanges =
    settings['brand.companyName'] !== original['brand.companyName'] ||
    settings['brand.tagline'] !== original['brand.tagline'] ||
    settings['company.adminEmail'] !== original['company.adminEmail']

  if (!isOwner) {
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
        desc="Configure payroll, appearance, subscription & branding"
      />

      <Tabs defaultValue="payroll" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="payroll" className="gap-1.5 text-xs sm:text-sm">
            <Wallet className="h-4 w-4" />
            <span className="hidden sm:inline">Payroll & Leave</span>
            <span className="sm:hidden">Payroll</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-1.5 text-xs sm:text-sm">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Appearance</span>
            <span className="sm:hidden">Theme</span>
          </TabsTrigger>
          <TabsTrigger value="branding" className="gap-1.5 text-xs sm:text-sm">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">Branding</span>
            <span className="sm:hidden">Brand</span>
          </TabsTrigger>
          <TabsTrigger value="subscription" className="gap-1.5 text-xs sm:text-sm">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Subscription</span>
            <span className="sm:hidden">Plan</span>
          </TabsTrigger>
        </TabsList>

        {/* ═══ TAB 1: Payroll & Leave ═══ */}
        <TabsContent value="payroll" className="mt-5 space-y-4">
          <Alert className="border-[var(--gold)]/30 bg-[var(--gold)]/5">
            <SettingsIcon className="h-4 w-4 text-[#8a6f24]" />
            <AlertTitle className="text-[#8a6f24]">System Configuration</AlertTitle>
            <AlertDescription className="text-xs text-[#8a6f24]/80">
              These values are used by the payroll engine, attendance system, and leave management. Changes apply to all future computations.
            </AlertDescription>
          </Alert>

          {loading ? (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-64 w-full" />)}
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
            <div className="flex items-center justify-end gap-2">
              <Button variant="outline" onClick={reset} disabled={saving}>
                <RotateCcw className="mr-1 h-4 w-4" /> Reset
              </Button>
              <Button
                className="bg-[var(--navy)] text-white hover:bg-[var(--navy-light)]"
                onClick={save}
                disabled={saving}
              >
                <Save className="mr-1 h-4 w-4" /> {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          )}
        </TabsContent>

        {/* ═══ TAB 2: Appearance ═══ */}
        <TabsContent value="appearance" className="mt-5 space-y-5">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

            {/* ── Theme Mode ── */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  {darkMode ? <Moon className="h-4 w-4 text-[var(--gold)]" /> : <Sun className="h-4 w-4 text-[var(--gold)]" />}
                  {t('theme.darkMode', lang)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">{darkMode ? 'Dark Mode' : 'Light Mode'}</Label>
                  <Switch checked={darkMode} onCheckedChange={setDarkMode} />
                </div>
                {/* Mini preview card */}
                <div className="rounded-lg border p-4 space-y-2 transition-colors duration-300"
                  style={{
                    backgroundColor: darkMode ? '#0A1F44' : '#FFFFFF',
                    borderColor: darkMode ? '#1B2F5A' : '#DDE3EE',
                  }}
                >
                  <div className="h-2 w-16 rounded-full" style={{ backgroundColor: darkMode ? '#D4AF37' : '#002B5C' }} />
                  <div className="h-1.5 w-24 rounded-full" style={{ backgroundColor: darkMode ? '#1B2F5A' : '#EEF1F8' }} />
                  <div className="h-1.5 w-20 rounded-full" style={{ backgroundColor: darkMode ? '#1B2F5A' : '#EEF1F8' }} />
                  <div className="flex gap-2 pt-1">
                    <div className="h-6 w-14 rounded-md text-[10px] flex items-center justify-center font-medium"
                      style={{ backgroundColor: darkMode ? '#D4AF37' : '#002B5C', color: darkMode ? '#061229' : '#FFFFFF' }}
                    >
                      Button
                    </div>
                    <div className="h-6 w-14 rounded-md text-[10px] flex items-center justify-center"
                      style={{ backgroundColor: darkMode ? '#16306B' : '#EEF1F8', color: darkMode ? '#E6EBF5' : '#0A1F44' }}
                    >
                      Cancel
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ── Brand Colors ── */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Palette className="h-4 w-4 text-[var(--gold)]" />
                  Brand Colors
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-end gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Primary Color</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={themeColors.primary}
                        onChange={(e) => setThemeColors({ ...themeColors, primary: e.target.value })}
                        className="w-12 h-12 rounded-lg cursor-pointer border border-border"
                      />
                      <Input value={themeColors.primary} readOnly className="w-28 font-mono text-xs" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Accent Color</Label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={themeColors.accent}
                        onChange={(e) => setThemeColors({ ...themeColors, accent: e.target.value })}
                        className="w-12 h-12 rounded-lg cursor-pointer border border-border"
                      />
                      <Input value={themeColors.accent} readOnly className="w-28 font-mono text-xs" />
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setThemeColors({ primary: '#002B5C', accent: '#D4AF37' })}
                  className="text-xs"
                >
                  <RotateCcw className="mr-1 h-3.5 w-3.5" /> Reset to Default
                </Button>
                {/* Live preview strip */}
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground">Preview</p>
                  <div className="flex gap-1 rounded-md overflow-hidden h-8">
                    <div className="flex-1" style={{ backgroundColor: themeColors.primary }} />
                    <div className="flex-1" style={{ backgroundColor: themeColors.accent }} />
                    <div className="flex-1" style={{ backgroundColor: themeColors.primary, opacity: 0.7 }} />
                    <div className="flex-1" style={{ backgroundColor: themeColors.accent, opacity: 0.5 }} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ── Language ── */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Globe className="h-4 w-4 text-[var(--gold)]" />
                  {t('theme.language', lang)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {LANGUAGES.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => setLang(l.code)}
                      className={
                        'flex items-center gap-3 rounded-lg border p-3 text-left transition-all hover:bg-muted/60' +
                        (lang === l.code ? ' border-[var(--gold)] bg-[var(--gold)]/5 ring-1 ring-[var(--gold)]/30' : ' border-border')
                      }
                    >
                      <span className="text-2xl leading-none">{l.flag}</span>
                      <div>
                        <p className="text-sm font-semibold">{l.native}</p>
                        <p className="text-xs text-muted-foreground">{l.label}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* ── HPHRMS Branding ── */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Tag className="h-4 w-4 text-[var(--gold)]" />
                  HPHRMS Branding
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="brand.companyName" className="text-xs">Company Name</Label>
                  <Input
                    id="brand.companyName"
                    value={settings['brand.companyName'] ?? ''}
                    onChange={(e) => set('brand.companyName', e.target.value)}
                    placeholder={BRAND.name}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="brand.tagline" className="text-xs">Tagline</Label>
                  <Input
                    id="brand.tagline"
                    value={settings['brand.tagline'] ?? ''}
                    onChange={(e) => set('brand.tagline', e.target.value)}
                    placeholder={BRAND.tagline}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="company.adminEmail" className="text-xs">Admin Email</Label>
                  <Input
                    id="company.adminEmail"
                    type="email"
                    value={settings['company.adminEmail'] ?? ''}
                    onChange={(e) => set('company.adminEmail', e.target.value)}
                    placeholder="hr@company.com"
                  />
                  <p className="text-[10px] text-muted-foreground">Receives system alerts and notifications</p>
                </div>
                <div className="flex justify-end">
                  <Button
                    className="bg-[var(--navy)] text-white hover:bg-[var(--navy-light)]"
                    onClick={saveBranding}
                    disabled={saving || !hasBrandingChanges}
                  >
                    <Save className="mr-1 h-4 w-4" /> {saving ? 'Saving...' : 'Save Branding'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ═══ TAB 3: Company Branding & Social Media ═══ */}
        <TabsContent value="branding" className="mt-5 space-y-5">
          <Alert className="border-[var(--gold)]/30 bg-[var(--gold)]/5">
            <Building2 className="h-4 w-4 text-[#8a6f24]" />
            <AlertTitle className="text-[#8a6f24]">Company Branding & Social Media</AlertTitle>
            <AlertDescription className="text-xs text-[#8a6f24]/80">
              These values are configured in application constants and displayed as read-only reference information.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">

            {/* ── Company Identity ── */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-[var(--gold)]" />
                  Company Identity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <ReadOnlyField label="Company Name" value={BRAND.name} />
                <ReadOnlyField label="Legal Name" value={BRAND.legalName} />
                <ReadOnlyField label="Tagline" value={BRAND.tagline} />
                <ReadOnlyField label="Full Tagline" value={BRAND.taglineFull} />
                <ReadOnlyField label="Website" value={BRAND.website} href={BRAND.website} />
              </CardContent>
            </Card>

            {/* ── Legal & Registration ── */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-[var(--gold)]" />
                  Legal & Registration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <ReadOnlyField label="GSTIN" value={BRAND.gstin} />
                <ReadOnlyField label="UDYAM Registration" value={BRAND.udyam} />
                <ReadOnlyField label="PAN" value={BRAND.pan} />
              </CardContent>
            </Card>

            {/* ── Office Addresses ── */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Globe className="h-4 w-4 text-[var(--gold)]" />
                  Office Addresses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Badge variant="outline" className="border-[var(--gold)]/40 text-[#8a6f24]">Head Office</Badge>
                    <p className="text-sm leading-relaxed text-muted-foreground">{BRAND.headOffice.full}</p>
                  </div>
                  <div className="space-y-2">
                    <Badge variant="outline" className="border-[var(--gold)]/40 text-[#8a6f24]">Branch Office</Badge>
                    <p className="text-sm leading-relaxed text-muted-foreground">{BRAND.branchOffice.full}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* ── Social Media Links ── */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Globe className="h-4 w-4 text-[var(--gold)]" />
                  Social Media & Online Presence
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  <ReadOnlyField label="Website" value={SOCIAL.website} href={SOCIAL.website} />
                  <ReadOnlyField label="HPHRMS Portal" value={SOCIAL.hphrms} href={SOCIAL.hphrms} />
                  <ReadOnlyField label="Email" value={SOCIAL.email} href={`mailto:${SOCIAL.email}`} />
                  <ReadOnlyField label="WhatsApp" value={SOCIAL.whatsapp} href={SOCIAL.whatsapp} />
                  <ReadOnlyField label="Instagram" value={SOCIAL.instagram} href={SOCIAL.instagram} />
                  <ReadOnlyField label="Threads" value={SOCIAL.threads} href={SOCIAL.threads} />
                  <ReadOnlyField label="LinkedIn" value={SOCIAL.linkedin} href={SOCIAL.linkedin} />
                  <ReadOnlyField label="Facebook" value={SOCIAL.facebook} href={SOCIAL.facebook} />
                  <ReadOnlyField label="X (Twitter)" value={SOCIAL.twitter} href={SOCIAL.twitter} />
                  <ReadOnlyField label="YouTube" value={SOCIAL.youtube} href={SOCIAL.youtube} />
                  <ReadOnlyField label="Reddit" value={SOCIAL.reddit} href={SOCIAL.reddit} />
                  <ReadOnlyField label="Recruitment Form" value={SOCIAL.recruitment} href={SOCIAL.recruitment} />
                </div>
                <FollowUs variant="grid" heading="Follow HP Enterprise" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ═══ TAB 4: Subscription ═══ */}
        <TabsContent value="subscription" className="mt-5 space-y-6">
          {/* Plans grid */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PLANS.map((plan) => {
              const isCurrent = plan.key === CURRENT_PLAN
              const isHigher = plan.tier > CURRENT_TIER
              return (
                <Card
                  key={plan.key}
                  className={
                    'relative flex flex-col transition-shadow' +
                    (isCurrent ? ' border-[var(--gold)] shadow-md shadow-[var(--gold)]/10' : '')
                  }
                >
                  {isCurrent && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                      <Badge className="bg-[var(--gold)] text-[var(--navy)] border-0 gap-1">
                        <Crown className="h-3 w-3" /> Current Plan
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{plan.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-1 flex-col gap-4">
                    <div>
                      <span className="text-3xl font-bold text-[var(--navy)] dark:text-white">
                        {plan.price === 0 ? 'Free' : `₹${plan.price.toLocaleString('en-IN')}`}
                      </span>
                      {plan.price > 0 && (
                        <span className="text-sm text-muted-foreground">/month</span>
                      )}
                    </div>
                    <ul className="flex-1 space-y-2">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm">
                          <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                          {f}
                        </li>
                      ))}
                    </ul>
                    {isCurrent ? (
                      <Button variant="outline" disabled className="w-full">
                        Current Plan
                      </Button>
                    ) : isHigher ? (
                      <Button
                        className="w-full bg-[var(--navy)] text-white hover:bg-[var(--navy-light)]"
                        onClick={() => toast.info('Subscription update requested. Our team will contact you shortly.')}
                      >
                        <ArrowUp className="mr-1 h-4 w-4" /> Upgrade
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => toast.info('Subscription update requested. Our team will contact you shortly.')}
                      >
                        <ArrowDown className="mr-1 h-4 w-4" /> Downgrade
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Usage section */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[var(--gold)]" />
                Usage
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {USAGE.map((u) => {
                const Icon = u.icon
                const pct = u.displayValue ? (u.current / u.max) * 100 : (u.current / u.max) * 100
                return (
                  <div key={u.label} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{u.label}</span>
                      </div>
                      <span className="text-muted-foreground text-xs">
                        {u.displayValue || `${u.current} / ${u.max}`}
                      </span>
                    </div>
                    <Progress value={pct} className="h-2" />
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {hasChanges && (
        <div className="sticky bottom-4 z-20 mx-auto max-w-md">
          <div className="rounded-full border bg-card p-1 pl-4 shadow-lg">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium text-muted-foreground">Unsaved changes</p>
              <div className="flex items-center gap-1">
                <Button size="sm" variant="ghost" onClick={reset} disabled={saving}>Discard</Button>
                <Button size="sm" className="bg-[var(--navy)] text-white hover:bg-[var(--navy-light)" onClick={save} disabled={saving}>
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
