'use client'

import { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import {
  Loader2,
  CalendarIcon,
  CheckCircle2,
  X,
  Building2,
} from 'lucide-react'
import { format } from 'date-fns'

/* ─── Constants ──────────────────────────────────────── */

const INDUSTRIES = [
  'Construction', 'Manufacturing', 'IT', 'Healthcare', 'Education',
  'Logistics', 'Government', 'Engineering', 'Finance', 'Other',
]

const COMPANY_SIZES = [
  '1-10', '11-50', '51-200', '201-500', '501-1000', '1000+',
]

const MODULES = [
  'HRMS', 'Payroll', 'Attendance', 'Recruitment', 'AI Assistant',
  'EHS', 'Manpower', 'Analytics', 'All',
]

const PLANS = [
  'Starter', 'Standard', 'Professional', 'Business', 'Enterprise',
  'Enterprise Plus', 'Custom',
]

const DEMO_TIMES = [
  '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
  '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM',
]

/* ─── Types ──────────────────────────────────────────── */

interface FormState {
  companyName: string
  businessName: string
  industry: string
  gstNumber: string
  companySize: string
  employeeCount: string
  contactPerson: string
  designation: string
  email: string
  mobile: string
  state: string
  city: string
  country: string
  website: string
  currentHrSoftware: string
  modules: string[]
  plan: string
  demoDate: Date | undefined
  demoTime: string
  additionalRequirements: string
  agreed: boolean
}

export interface DemoRequestFormProps {
  onClose?: () => void
  embedded?: boolean
}

/* ─── Component ──────────────────────────────────────── */

export function DemoRequestForm({ onClose, embedded = false }: DemoRequestFormProps) {
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [dateOpen, setDateOpen] = useState(false)

  const initialForm: FormState = {
    companyName: '',
    businessName: '',
    industry: '',
    gstNumber: '',
    companySize: '',
    employeeCount: '',
    contactPerson: '',
    designation: '',
    email: '',
    mobile: '',
    state: '',
    city: '',
    country: 'India',
    website: '',
    currentHrSoftware: '',
    modules: [],
    plan: '',
    demoDate: undefined,
    demoTime: '',
    additionalRequirements: '',
    agreed: false,
  }

  const [form, setForm] = useState<FormState>(initialForm)

  const set = useCallback(
    (field: keyof FormState, value: string | boolean | Date | undefined) => {
      setForm((prev) => ({ ...prev, [field]: value }))
    },
    [],
  )

  const toggleModule = useCallback((mod: string) => {
    setForm((prev) => ({
      ...prev,
      modules: prev.modules.includes(mod)
        ? prev.modules.filter((m) => m !== mod)
        : [...prev.modules, mod],
    }))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.companyName.trim() || !form.contactPerson.trim() || !form.email.trim() || !form.mobile.trim()) {
      toast.error('Please fill in all required fields.')
      return
    }
    if (!form.agreed) {
      toast.error('You must agree to the Terms of Service and Privacy Policy.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/subscription/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'demo',
          companyName: form.companyName.trim(),
          contactName: form.contactPerson.trim(),
          email: form.email.trim().toLowerCase(),
          phone: form.mobile.trim(),
          plan: form.plan || 'professional',
          employeeCount: form.employeeCount || undefined,
          message: JSON.stringify({
            businessName: form.businessName,
            industry: form.industry,
            gstNumber: form.gstNumber,
            companySize: form.companySize,
            designation: form.designation,
            state: form.state,
            city: form.city,
            country: form.country,
            website: form.website,
            currentHrSoftware: form.currentHrSoftware,
            modules: form.modules,
            demoDate: form.demoDate ? format(form.demoDate, 'yyyy-MM-dd') : undefined,
            demoTime: form.demoTime,
            additionalRequirements: form.additionalRequirements,
          }),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to submit')
      setSubmitted(true)
      toast.success('Demo request submitted! Our team will contact you shortly.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  /* ─── Success state ─────────────────────────────── */
  if (submitted) {
    return (
      <div className={cn('flex flex-col items-center justify-center py-12 text-center', !embedded && 'min-h-[400px]')}>
        <div className="grid h-16 w-16 place-items-center rounded-full bg-emerald-100">
          <CheckCircle2 className="h-8 w-8 text-emerald-600" />
        </div>
        <h3 className="mt-4 text-xl font-bold text-[var(--navy)]">Demo Request Submitted!</h3>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          Thank you, {form.contactPerson}! Our team will reach out within 24 hours.
        </p>
        <Button variant="outline" className="mt-6" onClick={onClose}>
          Close
        </Button>
      </div>
    )
  }

  /* ─── Form ──────────────────────────────────────── */
  const inputCls = 'h-9 text-sm'

  const sectionTitle = (text: string) => (
    <p className="pt-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{text}</p>
  )

  const field = (label: string, required: boolean, id: string, children: React.ReactNode) => (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs font-medium">
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      {children}
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {!embedded && onClose && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--navy)]">
              <Building2 className="h-4 w-4 text-[var(--gold)]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--navy)]">Book a Live Demo</h2>
              <p className="text-xs text-muted-foreground">See HPHRMS AI in action</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="max-h-[70vh] space-y-5 overflow-y-auto scroll-thin pr-1">
        {sectionTitle('Company Details')}
        <div className="grid gap-4 sm:grid-cols-2">
          {field('Company Name', true, 'demo-company',
            <Input id="demo-company" value={form.companyName} onChange={(e) => set('companyName', e.target.value)} placeholder="Acme Corp" className={inputCls} />
          )}
          {field('Business Name', false, 'demo-business',
            <Input id="demo-business" value={form.businessName} onChange={(e) => set('businessName', e.target.value)} placeholder="Business / Trade name" className={inputCls} />
          )}
          {field('Industry', false, 'demo-industry',
            <Select value={form.industry} onValueChange={(v) => set('industry', v)}>
              <SelectTrigger id="demo-industry" className={cn('w-full', inputCls)}>
                <SelectValue placeholder="Select industry" />
              </SelectTrigger>
              <SelectContent>
                {INDUSTRIES.map((i) => (
                  <SelectItem key={i} value={i}>{i}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {field('GST Number', false, 'demo-gst',
            <Input id="demo-gst" value={form.gstNumber} onChange={(e) => set('gstNumber', e.target.value)} placeholder="Optional" className={inputCls} />
          )}
          {field('Company Size', false, 'demo-size',
            <Select value={form.companySize} onValueChange={(v) => set('companySize', v)}>
              <SelectTrigger id="demo-size" className={cn('w-full', inputCls)}>
                <SelectValue placeholder="Select size" />
              </SelectTrigger>
              <SelectContent>
                {COMPANY_SIZES.map((s) => (
                  <SelectItem key={s} value={s}>{s} employees</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {field('Employee Count', false, 'demo-emp',
            <Input id="demo-emp" type="number" min={1} value={form.employeeCount} onChange={(e) => set('employeeCount', e.target.value)} placeholder="e.g. 250" className={inputCls} />
          )}
        </div>

        {sectionTitle('Contact Person')}
        <div className="grid gap-4 sm:grid-cols-2">
          {field('Contact Person', true, 'demo-contact',
            <Input id="demo-contact" value={form.contactPerson} onChange={(e) => set('contactPerson', e.target.value)} placeholder="Full name" className={inputCls} />
          )}
          {field('Designation', false, 'demo-desig',
            <Input id="demo-desig" value={form.designation} onChange={(e) => set('designation', e.target.value)} placeholder="e.g. HR Manager" className={inputCls} />
          )}
          {field('Business Email', true, 'demo-email',
            <Input id="demo-email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="you@company.com" className={inputCls} />
          )}
          {field('Mobile Number', true, 'demo-mobile',
            <Input id="demo-mobile" type="tel" value={form.mobile} onChange={(e) => set('mobile', e.target.value)} placeholder="+91 98765 43210" className={inputCls} />
          )}
        </div>

        {sectionTitle('Location')}
        <div className="grid gap-4 sm:grid-cols-3">
          {field('State', false, 'demo-state',
            <Input id="demo-state" value={form.state} onChange={(e) => set('state', e.target.value)} placeholder="e.g. Karnataka" className={inputCls} />
          )}
          {field('City', false, 'demo-city',
            <Input id="demo-city" value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="e.g. Bengaluru" className={inputCls} />
          )}
          {field('Country', false, 'demo-country',
            <Input id="demo-country" value={form.country} onChange={(e) => set('country', e.target.value)} className={inputCls} />
          )}
        </div>

        {sectionTitle('More Details')}
        <div className="grid gap-4 sm:grid-cols-2">
          {field('Website', false, 'demo-web',
            <Input id="demo-web" value={form.website} onChange={(e) => set('website', e.target.value)} placeholder="https://company.com" className={inputCls} />
          )}
          {field('Current HR Software', false, 'demo-curr',
            <Input id="demo-curr" value={form.currentHrSoftware} onChange={(e) => set('currentHrSoftware', e.target.value)} placeholder="e.g. Zoho, Keka, None" className={inputCls} />
          )}
        </div>

        {field('Interested Modules', false, 'demo-mods', (
          <div className="grid grid-cols-3 gap-2">
            {MODULES.map((mod) => {
              const active = form.modules.includes(mod)
              return (
                <label
                  key={mod}
                  className={cn(
                    'flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-xs transition-colors',
                    active
                      ? 'border-[var(--navy)] bg-[var(--navy)]/5 text-[var(--navy)]'
                      : 'border-border hover:border-muted-foreground/40',
                  )}
                >
                  <Checkbox
                    checked={active}
                    onCheckedChange={() => toggleModule(mod)}
                    className="data-[state=checked]:bg-[var(--navy)] data-[state=checked]:border-[var(--navy)]"
                  />
                  {mod}
                </label>
              )
            })}
          </div>
        ))}

        {field('Preferred Subscription Plan', false, 'demo-plan', (
          <Select value={form.plan} onValueChange={(v) => set('plan', v)}>
            <SelectTrigger id="demo-plan" className={cn('w-full', inputCls)}>
              <SelectValue placeholder="Select plan" />
            </SelectTrigger>
            <SelectContent>
              {PLANS.map((p) => (
                <SelectItem key={p} value={p.toLowerCase()}>{p}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}

        {sectionTitle('Preferred Demo Schedule')}
        <div className="grid gap-4 sm:grid-cols-2">
          {field('Preferred Demo Date', false, 'demo-date', (
            <Popover open={dateOpen} onOpenChange={setDateOpen}>
              <PopoverTrigger asChild>
                <Button
                  id="demo-date"
                  type="button"
                  variant="outline"
                  className={cn('w-full justify-start gap-2 text-left font-normal', inputCls, !form.demoDate && 'text-muted-foreground')}
                >
                  <CalendarIcon className="h-4 w-4" />
                  {form.demoDate ? format(form.demoDate, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={form.demoDate}
                  onSelect={(d) => { set('demoDate', d); setDateOpen(false) }}
                  disabled={(d) => d.getTime() < Date.now()}
                />
              </PopoverContent>
            </Popover>
          ))}
          {field('Preferred Demo Time', false, 'demo-time', (
            <Select value={form.demoTime} onValueChange={(v) => set('demoTime', v)}>
              <SelectTrigger id="demo-time" className={cn('w-full', inputCls)}>
                <SelectValue placeholder="Select time" />
              </SelectTrigger>
              <SelectContent>
                {DEMO_TIMES.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}
        </div>

        {field('Additional Requirements', false, 'demo-reqs', (
          <Textarea
            id="demo-reqs"
            value={form.additionalRequirements}
            onChange={(e) => set('additionalRequirements', e.target.value)}
            placeholder="Any specific requirements or questions..."
            rows={3}
            className="text-sm"
          />
        ))}

        <div className="flex items-start gap-3">
          <Checkbox
            id="demo-agree"
            checked={form.agreed}
            onCheckedChange={(v) => set('agreed', !!v)}
            className="mt-0.5 data-[state=checked]:bg-[var(--navy)] data-[state=checked]:border-[var(--navy)]"
          />
          <Label htmlFor="demo-agree" className="text-xs leading-relaxed">
            I agree to the{' '}
            <a href="/terms" target="_blank" rel="noopener noreferrer" className="underline hover:text-[var(--navy)]">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-[var(--navy)]">
              Privacy Policy
            </a>
            <span className="ml-0.5 text-destructive">*</span>
          </Label>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <Button
          type="submit"
          disabled={loading || !form.agreed}
          className="gap-2 bg-[var(--navy)] hover:bg-[var(--navy-deep)]"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarIcon className="h-4 w-4" />}
          Submit Demo Request
        </Button>
        {onClose && (
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}
