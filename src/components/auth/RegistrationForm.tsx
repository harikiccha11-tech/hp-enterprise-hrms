'use client'
import { useState } from 'react'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { BRAND, GENDERS, BLOOD_GROUPS, ENGINEERING_DISCIPLINES, PROJECT_TYPES, TECHNICAL_SKILLS } from '@/lib/constants'
import {
  ArrowLeft, ArrowRight, User, IdCard, Landmark, GraduationCap, Briefcase, Wrench,
  Upload, CheckCircle2, FileCheck2, Building2, ShieldCheck, Loader2, Plus, Trash2,
} from 'lucide-react'

const STEPS = [
  { id: 0, label: 'Personal', icon: User },
  { id: 1, label: 'Identity', icon: IdCard },
  { id: 2, label: 'Bank', icon: Landmark },
  { id: 3, label: 'Education', icon: GraduationCap },
  { id: 4, label: 'Experience', icon: Briefcase },
  { id: 5, label: 'Disciplines', icon: Wrench },
  { id: 6, label: 'Documents', icon: Upload },
]

interface Edu { qualification: string; specialization: string; college: string; year: string }

export function RegistrationForm({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  // personal
  const [p, setP] = useState({
    fullName: '', fatherName: '', motherName: '', dob: '', gender: '', bloodGroup: '',
    mobile: '', alternateMobile: '', email: '', address: '', emergencyContact: '',
  })
  // identity
  const [idn, setIdn] = useState({ aadhaar: '', pan: '', uan: '', esic: '', passport: '', drivingLicence: '' })
  // bank
  const [bank, setBank] = useState({ bankHolder: '', bankName: '', bankBranch: '', bankAccount: '', bankIfsc: '' })
  // education
  const [edu, setEdu] = useState<Edu[]>([{ qualification: '', specialization: '', college: '', year: '' }])
  // experience
  const [exp, setExp] = useState({
    currentDesignation: '', totalExperience: '', relevantExperience: '', currentCompany: '',
    previousCompany: '', currentSalary: '', expectedSalary: '', noticePeriod: '',
  })
  // disciplines
  const [disciplines, setDisciplines] = useState<string[]>([])
  const [projectTypes, setProjectTypes] = useState<string[]>([])
  const [skills, setSkills] = useState<string[]>([])
  // files
  const [files, setFiles] = useState<Record<string, File | null>>({})
  const [agreed, setAgreed] = useState(false)

  function set<K extends string>(setter: React.Dispatch<React.SetStateAction<any>>, key: string, val: any) {
    setter((prev: any) => ({ ...prev, [key]: val }))
  }

  function toggle(arr: string[], setArr: React.Dispatch<React.SetStateAction<string[]>>, v: string) {
    setArr(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v])
  }

  function validateStep(): string | null {
    if (step === 0) {
      if (!p.fullName.trim()) return 'Full name is required'
      if (!p.email.trim()) return 'Email is required'
      if (!p.mobile.trim()) return 'Mobile is required'
    }
    if (step === 1) {
      if (!idn.aadhaar.trim()) return 'Aadhaar is required'
      if (!idn.pan.trim()) return 'PAN is required'
    }
    if (step === 2) {
      if (!bank.bankHolder.trim()) return 'Account holder name is required'
      if (!bank.bankAccount.trim()) return 'Account number is required'
      if (!bank.bankIfsc.trim()) return 'IFSC is required'
    }
    return null
  }

  function next() {
    const err = validateStep()
    if (err) { toast.error(err); return }
    setStep((s) => Math.min(s + 1, STEPS.length - 1))
  }
  function prev() { setStep((s) => Math.max(s - 1, 0)) }

  async function submit() {
    if (!agreed) { toast.error('Please accept the declaration to submit'); return }
    if (!files.photoFile) { toast.error('Passport photo is required'); return }
    setSubmitting(true)
    try {
      const fd = new FormData()
      Object.entries(p).forEach(([k, v]) => fd.append(k, v))
      Object.entries(idn).forEach(([k, v]) => fd.append(k, v))
      Object.entries(bank).forEach(([k, v]) => fd.append(k, v))
      fd.append('education', JSON.stringify(edu))
      Object.entries(exp).forEach(([k, v]) => fd.append(k, v))
      fd.append('disciplines', disciplines.join(','))
      fd.append('projectTypes', projectTypes.join(','))
      fd.append('skills', skills.join(','))
      Object.entries(files).forEach(([k, f]) => { if (f) fd.append(k, f) })

      const res = await fetch('/api/registration', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || 'Submission failed'); return }
      setDone(true)
      toast.success('Application submitted successfully!')
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
        <Card className="max-w-lg w-full text-center border-0 shadow-xl">
          <CardContent className="pt-10 pb-10">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-500/10">
              <CheckCircle2 className="h-9 w-9 text-emerald-600" />
            </div>
            <h1 className="mt-5 text-2xl font-bold text-[var(--navy)]">Application Submitted!</h1>
            <p className="mt-2 text-muted-foreground">
              Thank you, {p.fullName.split(' ')[0]}. Your application has been received and is now pending review by our HR team. You will be notified at <span className="font-semibold text-[var(--navy)]">{p.email}</span> once your application is approved and your employee account is created.
            </p>
            <div className="mt-6 rounded-lg border border-dashed border-[var(--gold)]/40 bg-[var(--gold)]/5 p-4 text-left text-sm">
              <p className="font-semibold text-[#8a6f24] mb-1">What happens next?</p>
              <ol className="list-decimal space-y-1 pl-5 text-muted-foreground">
                <li>HR reviews your application & uploaded documents</li>
                <li>On approval, an Employee ID & login account is auto-created</li>
                <li>Offer Letter, Appointment Letter & ID Card are generated</li>
                <li>You receive credentials & a forced password-reset on first login</li>
              </ol>
            </div>
            <Button className="mt-6 bg-[var(--navy)] hover:bg-[var(--navy-light)]" onClick={onBack}>
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-40 border-b bg-white/90 backdrop-blur dark:bg-[var(--navy-deep)]/90">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <BrandLogo />
          <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft className="mr-1 h-4 w-4" /> Back to Home</Button>
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        {/* Stepper */}
        <div className="mb-8 overflow-x-auto scroll-thin">
          <div className="flex min-w-max items-center gap-1">
            {STEPS.map((s, i) => {
              const active = i === step
              const complete = i < step
              return (
                <div key={s.id} className="flex items-center">
                  <div className={cn('flex items-center gap-2 rounded-full px-3 py-1.5 transition', active ? 'hpe-navy text-white' : complete ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground')}>
                    {complete ? <CheckCircle2 className="h-4 w-4" /> : <s.icon className="h-4 w-4" />}
                    <span className="text-xs font-semibold">{s.label}</span>
                  </div>
                  {i < STEPS.length - 1 && <div className={cn('mx-1 h-0.5 w-6', complete ? 'bg-emerald-500' : 'bg-border')} />}
                </div>
              )
            })}
          </div>
        </div>

        <Card className="border shadow-sm">
          <CardContent className="p-6 sm:p-8">
            {/* STEP 0 — Personal */}
            {step === 0 && (
              <Section icon={User} title="Personal Details" desc="Tell us about yourself.">
                <Grid>
                  <Field label="Full Name *"><Input value={p.fullName} onChange={(e) => set(setP, 'fullName', e.target.value)} placeholder="As per Aadhaar" /></Field>
                  <Field label="Father's Name"><Input value={p.fatherName} onChange={(e) => set(setP, 'fatherName', e.target.value)} /></Field>
                  <Field label="Mother's Name"><Input value={p.motherName} onChange={(e) => set(setP, 'motherName', e.target.value)} /></Field>
                  <Field label="Date of Birth"><Input type="date" value={p.dob} onChange={(e) => set(setP, 'dob', e.target.value)} /></Field>
                  <Field label="Gender"><Select value={p.gender} onValueChange={(v) => set(setP, 'gender', v)}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{GENDERS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent></Select></Field>
                  <Field label="Blood Group"><Select value={p.bloodGroup} onValueChange={(v) => set(setP, 'bloodGroup', v)}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{BLOOD_GROUPS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent></Select></Field>
                  <Field label="Mobile *"><Input value={p.mobile} onChange={(e) => set(setP, 'mobile', e.target.value)} placeholder="+91 98765 43210" /></Field>
                  <Field label="Alternate Mobile"><Input value={p.alternateMobile} onChange={(e) => set(setP, 'alternateMobile', e.target.value)} /></Field>
                  <Field label="Email *" full><Input type="email" value={p.email} onChange={(e) => set(setP, 'email', e.target.value)} placeholder="you@example.com" /></Field>
                  <Field label="Address" full><Textarea value={p.address} onChange={(e) => set(setP, 'address', e.target.value)} rows={2} /></Field>
                  <Field label="Emergency Contact"><Input value={p.emergencyContact} onChange={(e) => set(setP, 'emergencyContact', e.target.value)} placeholder="Name & phone" /></Field>
                </Grid>
              </Section>
            )}

            {/* STEP 1 — Identity */}
            {step === 1 && (
              <Section icon={IdCard} title="Identity Details" desc="Statutory identification information.">
                <Grid>
                  <Field label="Aadhaar Number *"><Input value={idn.aadhaar} onChange={(e) => set(setIdn, 'aadhaar', e.target.value)} placeholder="XXXX XXXX XXXX" /></Field>
                  <Field label="PAN Number *"><Input value={idn.pan} onChange={(e) => set(setIdn, 'pan', e.target.value)} placeholder="ABCDE1234F" /></Field>
                  <Field label="UAN"><Input value={idn.uan} onChange={(e) => set(setIdn, 'uan', e.target.value)} /></Field>
                  <Field label="ESIC"><Input value={idn.esic} onChange={(e) => set(setIdn, 'esic', e.target.value)} /></Field>
                  <Field label="Passport (Optional)"><Input value={idn.passport} onChange={(e) => set(setIdn, 'passport', e.target.value)} /></Field>
                  <Field label="Driving Licence (Optional)"><Input value={idn.drivingLicence} onChange={(e) => set(setIdn, 'drivingLicence', e.target.value)} /></Field>
                </Grid>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <FileField label="Aadhaar Upload" field="aadhaarFile" files={files} setFiles={setFiles} />
                  <FileField label="PAN Upload" field="panFile" files={files} setFiles={setFiles} />
                  <FileField label="Passport Photo *" field="photoFile" files={files} setFiles={setFiles} />
                  <FileField label="Signature" field="signatureFile" files={files} setFiles={setFiles} />
                </div>
              </Section>
            )}

            {/* STEP 2 — Bank */}
            {step === 2 && (
              <Section icon={Landmark} title="Bank Details" desc="Salary will be credited to this account.">
                <Grid>
                  <Field label="Account Holder Name *"><Input value={bank.bankHolder} onChange={(e) => set(setBank, 'bankHolder', e.target.value)} /></Field>
                  <Field label="Bank Name"><Input value={bank.bankName} onChange={(e) => set(setBank, 'bankName', e.target.value)} /></Field>
                  <Field label="Branch"><Input value={bank.bankBranch} onChange={(e) => set(setBank, 'bankBranch', e.target.value)} /></Field>
                  <Field label="Account Number *"><Input value={bank.bankAccount} onChange={(e) => set(setBank, 'bankAccount', e.target.value)} /></Field>
                  <Field label="IFSC Code *"><Input value={bank.bankIfsc} onChange={(e) => set(setBank, 'bankIfsc', e.target.value)} placeholder="HDFC0001234" /></Field>
                </Grid>
                <div className="mt-6"><FileField label="Passbook / Cancelled Cheque" field="passbookFile" files={files} setFiles={setFiles} /></div>
              </Section>
            )}

            {/* STEP 3 — Education */}
            {step === 3 && (
              <Section icon={GraduationCap} title="Education" desc="Add your educational qualifications.">
                <div className="space-y-4">
                  {edu.map((e, i) => (
                    <div key={i} className="rounded-lg border p-4 relative">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-semibold text-[var(--navy)]">Qualification {i + 1}</span>
                        {edu.length > 1 && (
                          <Button variant="ghost" size="sm" onClick={() => setEdu(edu.filter((_, j) => j !== i))}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                        )}
                      </div>
                      <Grid>
                        <Field label="Qualification"><Input value={e.qualification} onChange={(ev) => { const n = [...edu]; n[i] = { ...n[i], qualification: ev.target.value }; setEdu(n) }} placeholder="B.E. Civil" /></Field>
                        <Field label="Specialization"><Input value={e.specialization} onChange={(ev) => { const n = [...edu]; n[i] = { ...n[i], specialization: ev.target.value }; setEdu(n) }} placeholder="Structural Engg" /></Field>
                        <Field label="College / University"><Input value={e.college} onChange={(ev) => { const n = [...edu]; n[i] = { ...n[i], college: ev.target.value }; setEdu(n) }} /></Field>
                        <Field label="Passing Year"><Input value={e.year} onChange={(ev) => { const n = [...edu]; n[i] = { ...n[i], year: ev.target.value }; setEdu(n) }} placeholder="2016" /></Field>
                      </Grid>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => setEdu([...edu, { qualification: '', specialization: '', college: '', year: '' }])}><Plus className="mr-1 h-4 w-4" /> Add Qualification</Button>
                </div>
                <div className="mt-6"><FileField label="Education Certificates" field="educationFile" files={files} setFiles={setFiles} /></div>
              </Section>
            )}

            {/* STEP 4 — Experience */}
            {step === 4 && (
              <Section icon={Briefcase} title="Experience" desc="Your professional background.">
                <Grid>
                  <Field label="Current Designation"><Input value={exp.currentDesignation} onChange={(e) => set(setExp, 'currentDesignation', e.target.value)} /></Field>
                  <Field label="Total Experience"><Input value={exp.totalExperience} onChange={(e) => set(setExp, 'totalExperience', e.target.value)} placeholder="9 Years" /></Field>
                  <Field label="Relevant Experience"><Input value={exp.relevantExperience} onChange={(e) => set(setExp, 'relevantExperience', e.target.value)} /></Field>
                  <Field label="Current Company"><Input value={exp.currentCompany} onChange={(e) => set(setExp, 'currentCompany', e.target.value)} /></Field>
                  <Field label="Previous Company"><Input value={exp.previousCompany} onChange={(e) => set(setExp, 'previousCompany', e.target.value)} /></Field>
                  <Field label="Current Salary (₹/yr)"><Input value={exp.currentSalary} onChange={(e) => set(setExp, 'currentSalary', e.target.value)} /></Field>
                  <Field label="Expected Salary (₹/yr)"><Input value={exp.expectedSalary} onChange={(e) => set(setExp, 'expectedSalary', e.target.value)} /></Field>
                  <Field label="Notice Period"><Input value={exp.noticePeriod} onChange={(e) => set(setExp, 'noticePeriod', e.target.value)} placeholder="30 Days" /></Field>
                </Grid>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <FileField label="Resume / CV" field="resumeFile" files={files} setFiles={setFiles} />
                  <FileField label="Experience Certificates" field="experienceFile" files={files} setFiles={setFiles} />
                  <FileField label="Last Salary Slip" field="salarySlipFile" files={files} setFiles={setFiles} />
                  <FileField label="Relieving Letter" field="relievingFile" files={files} setFiles={setFiles} />
                </div>
              </Section>
            )}

            {/* STEP 5 — Disciplines / Projects / Skills */}
            {step === 5 && (
              <Section icon={Wrench} title="Engineering Disciplines & Skills" desc="Select all that apply to your expertise.">
                <ChipGroup title="Engineering Disciplines" options={ENGINEERING_DISCIPLINES} selected={disciplines} onToggle={(v) => toggle(disciplines, setDisciplines, v)} />
                <ChipGroup title="Project Experience" options={PROJECT_TYPES} selected={projectTypes} onToggle={(v) => toggle(projectTypes, setProjectTypes, v)} />
                <ChipGroup title="Technical Skills" options={TECHNICAL_SKILLS} selected={skills} onToggle={(v) => toggle(skills, setSkills, v)} />
              </Section>
            )}

            {/* STEP 6 — Documents + submit */}
            {step === 6 && (
              <Section icon={FileCheck2} title="Review & Submit" desc="Confirm your declaration and submit the application.">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Summary label="Full Name" value={p.fullName} />
                  <Summary label="Email" value={p.email} />
                  <Summary label="Mobile" value={p.mobile} />
                  <Summary label="Aadhaar" value={idn.aadhaar} />
                  <Summary label="PAN" value={idn.pan} />
                  <Summary label="Bank A/C" value={bank.bankAccount} />
                  <Summary label="Experience" value={exp.totalExperience} />
                  <Summary label="Current Company" value={exp.currentCompany} />
                  <Summary label="Disciplines" value={disciplines.join(', ') || '—'} />
                  <Summary label="Skills" value={skills.join(', ') || '—'} />
                  <Summary label="Education Entries" value={String(edu.length)} />
                  <Summary label="Documents Attached" value={String(Object.values(files).filter(Boolean).length)} />
                </div>
                <label className="mt-6 flex items-start gap-3 rounded-lg border p-4 cursor-pointer hover:bg-muted/50">
                  <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--gold)]" />
                  <span className="text-sm text-muted-foreground">
                    I hereby declare that the information provided above is true and complete to the best of my knowledge. I understand that any false statement may lead to rejection of my application or termination of employment. I authorise HP ENTERPRISE to verify the documents and details submitted.
                  </span>
                </label>
              </Section>
            )}

            {/* Nav buttons */}
            <div className="mt-8 flex items-center justify-between border-t pt-6">
              <Button variant="outline" onClick={prev} disabled={step === 0}><ArrowLeft className="mr-1 h-4 w-4" /> Previous</Button>
              {step < STEPS.length - 1 ? (
                <Button onClick={next} className="bg-[var(--navy)] hover:bg-[var(--navy-light)]">Next <ArrowRight className="ml-1 h-4 w-4" /></Button>
              ) : (
                <Button onClick={submit} disabled={submitting} className="bg-[var(--gold)] text-[var(--navy)] hover:opacity-90">
                  {submitting ? <><Loader2 className="mr-1 h-4 w-4 animate-spin" /> Submitting…</> : <><ShieldCheck className="mr-1 h-4 w-4" /> Submit Application</>}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Building2 className="h-3.5 w-3.5" /> {BRAND.name} • GSTIN: {BRAND.gstin}
        </div>
      </div>
    </div>
  )
}

function Section({ icon: Icon, title, desc, children }: { icon: any; title: string; desc: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-lg hpe-navy"><Icon className="h-5 w-5 text-[var(--gold)]" /></div>
        <div>
          <h2 className="text-lg font-bold text-[var(--navy)] dark:text-white">{title}</h2>
          <p className="text-sm text-muted-foreground">{desc}</p>
        </div>
      </div>
      {children}
    </div>
  )
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={cn('space-y-1.5', full && 'sm:col-span-2')}>
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  )
}

function FileField({ label, field, files, setFiles }: { label: string; field: string; files: Record<string, File | null>; setFiles: React.Dispatch<React.SetStateAction<Record<string, File | null>>> }) {
  const f = files[field]
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed bg-muted/30 px-3 py-2.5 text-sm hover:bg-muted/60 transition">
        <Upload className="h-4 w-4 text-muted-foreground" />
        <span className="truncate flex-1">{f ? f.name : 'Choose file…'}</span>
        <input type="file" className="hidden" onChange={(e) => { const file = e.target.files?.[0] || null; setFiles((prev) => ({ ...prev, [field]: file })) }} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
      </label>
    </div>
  )
}

function ChipGroup({ title, options, selected, onToggle }: { title: string; options: string[]; selected: string[]; onToggle: (v: string) => void }) {
  return (
    <div className="mb-6">
      <p className="mb-2 text-sm font-semibold text-[var(--navy)] dark:text-white">{title}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const on = selected.includes(o)
          return (
            <button key={o} type="button" onClick={() => onToggle(o)} className={cn('rounded-full border px-3 py-1.5 text-xs font-medium transition', on ? 'hpe-navy text-white border-[var(--navy)]' : 'bg-card text-muted-foreground hover:border-[var(--gold)] hover:text-[var(--navy)]')}>
              {o}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-muted/30 px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-[var(--navy)] dark:text-white truncate">{value || '—'}</p>
    </div>
  )
}
