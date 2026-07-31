'use client'
import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EmptyState } from '@/components/shared'
import { toast } from 'sonner'
import {
  User as UserIcon,
  Phone,
  MapPin,
  Heart,
  Droplet,
  Building2,
  CreditCard,
  Banknote,
  Briefcase,
  GraduationCap,
  Award,
  FileText,
  Save,
  Pencil,
  X,
  IdCard,
  Calendar,
  Mail,
} from 'lucide-react'
import { fmtDate } from '../lib'
import { BLOOD_GROUPS } from '@/lib/constants'

interface EmployeeDoc {
  id: string; documentType: string; fileName: string; filePath: string; uploadedAt: string
}
interface Employee {
  id: string; employeeCode: string | null; fullName: string; fatherName: string | null; motherName: string | null;
  dob: string | null; gender: string | null; bloodGroup: string | null; mobile: string | null; alternateMobile: string | null;
  email: string; address: string | null; emergencyContact: string | null;
  aadhaar: string | null; pan: string | null; uan: string | null; esic: string | null; passport: string | null; drivingLicence: string | null;
  bankHolder: string | null; bankName: string | null; bankBranch: string | null; bankAccount: string | null; bankIfsc: string | null;
  educationJson: string | null;
  currentDesignation: string | null; totalExperience: string | null; relevantExperience: string | null;
  currentCompany: string | null; previousCompany: string | null; currentSalary: string | null; expectedSalary: string | null;
  noticePeriod: string | null;
  disciplines: string | null; projectTypes: string | null; skills: string | null;
  designation: string | null; department: string | null; joinDate: string | null; employmentType: string | null; salary: number | null;
  documents: EmployeeDoc[]
}

interface EditFields {
  mobile: string; alternateMobile: string; address: string; emergencyContact: string; bloodGroup: string;
  bankHolder: string; bankName: string; bankBranch: string; bankAccount: string; bankIfsc: string;
}

export function MyProfile({ refreshKey }: { refreshKey: number }) {
  const [emp, setEmp] = useState<Employee | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState<EditFields | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/employee/profile', { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Failed')
      setEmp(json.employee)
    } catch (e: any) {
      toast.error(e.message || 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load, refreshKey])

  const startEdit = () => {
    if (!emp) return
    setForm({
      mobile: emp.mobile || '',
      alternateMobile: emp.alternateMobile || '',
      address: emp.address || '',
      emergencyContact: emp.emergencyContact || '',
      bloodGroup: emp.bloodGroup || '',
      bankHolder: emp.bankHolder || '',
      bankName: emp.bankName || '',
      bankBranch: emp.bankBranch || '',
      bankAccount: emp.bankAccount || '',
      bankIfsc: emp.bankIfsc || '',
    })
    setEditing(true)
  }

  const save = async () => {
    if (!form) return
    setSaving(true)
    try {
      const res = await fetch('/api/employee/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Save failed')
      setEmp(json.employee)
      setEditing(false)
      toast.success('Profile updated successfully')
    } catch (e: any) {
      toast.error(e.message || 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-28 w-full rounded-xl" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-72 w-full rounded-xl" />
          <Skeleton className="h-72 w-full rounded-xl" />
        </div>
      </div>
    )
  }

  if (!emp) {
    return <EmptyState icon={UserIcon} title="Profile not available" desc="Could not load your employee profile." />
  }

  let education: any[] = []
  try { education = emp.educationJson ? JSON.parse(emp.educationJson) : [] } catch {}

  const skills = emp.skills?.split(',').map(s => s.trim()).filter(Boolean) || []
  const disciplines = emp.disciplines?.split(',').map(s => s.trim()).filter(Boolean) || []
  const projectTypes = emp.projectTypes?.split(',').map(s => s.trim()).filter(Boolean) || []

  return (
    <div className="space-y-6">
      {/* Profile header */}
      <Card className="overflow-hidden border-0 shadow-lg">
        <div className="relative">
          <div className="absolute inset-0 hpe-sidebar-gradient" />
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 85% 10%, #C9A961 0, transparent 45%), radial-gradient(circle at 0% 100%, #16306B 0, transparent 50%)' }} />
          <CardContent className="relative flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="grid h-16 w-16 place-items-center rounded-xl bg-[var(--gold)] text-2xl font-black text-[var(--navy)] ring-4 ring-white/20">
                {emp.fullName.split(' ').slice(0, 2).map(s => s[0]?.toUpperCase()).join('')}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{emp.fullName}</h2>
                <p className="text-sm text-blue-100/90">{emp.designation || '—'} • {emp.department || '—'}</p>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-blue-100/70">
                  <span className="font-mono font-semibold text-[var(--gold-light)]">{emp.employeeCode || '—'}</span>
                  <span className="opacity-50">•</span>
                  <span>Joined {fmtDate(emp.joinDate)}</span>
                  <span className="opacity-50">•</span>
                  <span>{emp.employmentType || '—'}</span>
                </div>
              </div>
            </div>
            {!editing && (
              <Button onClick={startEdit} className="bg-[var(--gold)] text-[var(--navy)] hover:bg-[var(--gold-light)]">
                <Pencil className="mr-2 h-4 w-4" /> Edit Profile
              </Button>
            )}
          </CardContent>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Personal */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base"><UserIcon className="h-4 w-4 text-[var(--gold)]" /> Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <InfoRow icon={UserIcon} label="Father's Name" value={emp.fatherName} />
            <InfoRow icon={UserIcon} label="Mother's Name" value={emp.motherName} />
            <InfoRow icon={Calendar} label="Date of Birth" value={emp.dob ? fmtDate(emp.dob) : null} />
            <InfoRow icon={UserIcon} label="Gender" value={emp.gender} />
            <InfoRow icon={Mail} label="Email" value={emp.email} />
            {!editing ? (
              <>
                <InfoRow icon={Phone} label="Mobile" value={emp.mobile} />
                <InfoRow icon={Phone} label="Alternate Mobile" value={emp.alternateMobile} />
                <InfoRow icon={MapPin} label="Address" value={emp.address} />
                <InfoRow icon={Heart} label="Emergency Contact" value={emp.emergencyContact} />
                <InfoRow icon={Droplet} label="Blood Group" value={emp.bloodGroup} />
              </>
            ) : form && (
              <div className="space-y-3 pt-1">
                <Field label="Mobile">
                  <Input value={form.mobile} onChange={e => setForm({ ...form, mobile: e.target.value })} placeholder="10-digit mobile" />
                </Field>
                <Field label="Alternate Mobile">
                  <Input value={form.alternateMobile} onChange={e => setForm({ ...form, alternateMobile: e.target.value })} placeholder="Alternate number" />
                </Field>
                <Field label="Address">
                  <Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Residential address" />
                </Field>
                <Field label="Emergency Contact">
                  <Input value={form.emergencyContact} onChange={e => setForm({ ...form, emergencyContact: e.target.value })} placeholder="Name & phone" />
                </Field>
                <Field label="Blood Group">
                  <Select value={form.bloodGroup || '_'} onValueChange={v => setForm({ ...form, bloodGroup: v === '_' ? '' : v })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_">— Not set —</SelectItem>
                      {BLOOD_GROUPS.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Identity + Bank */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base"><IdCard className="h-4 w-4 text-[var(--gold)]" /> Identity & Government IDs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoRow icon={IdCard} label="Aadhaar" value={emp.aadhaar} />
              <InfoRow icon={IdCard} label="PAN" value={emp.pan} />
              <InfoRow icon={IdCard} label="UAN" value={emp.uan} />
              <InfoRow icon={IdCard} label="ESIC" value={emp.esic} />
              <InfoRow icon={IdCard} label="Passport" value={emp.passport} />
              <InfoRow icon={IdCard} label="Driving Licence" value={emp.drivingLicence} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base"><Banknote className="h-4 w-4 text-[var(--gold)]" /> Bank Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!editing ? (
                <>
                  <InfoRow icon={UserIcon} label="Account Holder" value={emp.bankHolder} />
                  <InfoRow icon={Building2} label="Bank Name" value={emp.bankName} />
                  <InfoRow icon={Building2} label="Branch" value={emp.bankBranch} />
                  <InfoRow icon={CreditCard} label="Account Number" value={emp.bankAccount} />
                  <InfoRow icon={CreditCard} label="IFSC Code" value={emp.bankIfsc} />
                </>
              ) : form && (
                <div className="space-y-3 pt-1">
                  <Field label="Account Holder"><Input value={form.bankHolder} onChange={e => setForm({ ...form, bankHolder: e.target.value })} /></Field>
                  <Field label="Bank Name"><Input value={form.bankName} onChange={e => setForm({ ...form, bankName: e.target.value })} /></Field>
                  <Field label="Branch"><Input value={form.bankBranch} onChange={e => setForm({ ...form, bankBranch: e.target.value })} /></Field>
                  <Field label="Account Number"><Input value={form.bankAccount} onChange={e => setForm({ ...form, bankAccount: e.target.value })} /></Field>
                  <Field label="IFSC Code"><Input value={form.bankIfsc} onChange={e => setForm({ ...form, bankIfsc: e.target.value })} /></Field>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit actions */}
      {editing && (
        <div className="sticky bottom-4 z-10 flex justify-end gap-2 rounded-xl border bg-card/95 p-3 shadow-lg backdrop-blur">
          <Button variant="outline" onClick={() => setEditing(false)} disabled={saving}>
            <X className="mr-2 h-4 w-4" /> Cancel
          </Button>
          <Button onClick={save} disabled={saving} className="bg-[var(--navy)] hover:bg-[var(--navy-light)]">
            <Save className="mr-2 h-4 w-4" /> {saving ? 'Saving…' : 'Save Changes'}
          </Button>
        </div>
      )}

      {/* Experience */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base"><Briefcase className="h-4 w-4 text-[var(--gold)]" /> Experience</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <InfoRow icon={Briefcase} label="Current Designation" value={emp.currentDesignation} />
          <InfoRow icon={Briefcase} label="Total Experience" value={emp.totalExperience} />
          <InfoRow icon={Briefcase} label="Relevant Experience" value={emp.relevantExperience} />
          <InfoRow icon={Building2} label="Current Company" value={emp.currentCompany} />
          <InfoRow icon={Building2} label="Previous Company" value={emp.previousCompany} />
          <InfoRow icon={Banknote} label="Current Salary" value={emp.currentSalary} />
          <InfoRow icon={Banknote} label="Expected Salary" value={emp.expectedSalary} />
          <InfoRow icon={Calendar} label="Notice Period" value={emp.noticePeriod} />
        </CardContent>
      </Card>

      {/* Education */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base"><GraduationCap className="h-4 w-4 text-[var(--gold)]" /> Education</CardTitle>
        </CardHeader>
        <CardContent>
          {education.length === 0 ? (
            <EmptyState icon={GraduationCap} title="No education records" />
          ) : (
            <ul className="space-y-3">
              {education.map((e, i) => (
                <li key={i} className="rounded-lg border bg-muted/30 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-[var(--navy)] dark:text-white">{e.qualification || '—'}</p>
                    {e.year && <span className="text-xs text-muted-foreground">{e.year}</span>}
                  </div>
                  {e.specialization && <p className="text-sm text-muted-foreground">{e.specialization}</p>}
                  {e.college && <p className="text-xs text-muted-foreground">{e.college}</p>}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Skills */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base"><Award className="h-4 w-4 text-[var(--gold)]" /> Skills & Disciplines</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <SkillGroup title="Engineering Disciplines" items={disciplines} />
          <SkillGroup title="Project Types" items={projectTypes} />
          <SkillGroup title="Technical Skills" items={skills} />
        </CardContent>
      </Card>

      {/* Documents */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base"><FileText className="h-4 w-4 text-[var(--gold)]" /> Uploaded Documents</CardTitle>
        </CardHeader>
        <CardContent>
          {emp.documents.length === 0 ? (
            <EmptyState icon={FileText} title="No documents uploaded" desc="Your uploaded documents will appear here." />
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2">
              {emp.documents.map((d) => (
                <li key={d.id} className="flex items-center gap-3 rounded-lg border bg-card p-3 lift">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-[var(--navy)]/10 text-[var(--navy)]">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold capitalize text-[var(--navy)] dark:text-white">{d.documentType.replace(/_/g, ' ')}</p>
                    <p className="truncate text-xs text-muted-foreground">{d.fileName} • {fmtDate(d.uploadedAt)}</p>
                  </div>
                  <a
                    href={`/api/uploads/${d.filePath.replace(/^\/+/, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-[var(--navy)] hover:underline dark:text-[var(--gold-light)]"
                  >
                    View
                  </a>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string | null | undefined }) {
  const v = value && String(value).trim() ? value : null
  return (
    <div className="flex items-start gap-3">
      <div className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-muted text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className={`text-sm ${v ? 'font-medium text-[var(--navy)] dark:text-white' : 'italic text-muted-foreground'}`}>{v || '—'}</p>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  )
}

function SkillGroup({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <p className="mb-2 text-[11px] uppercase tracking-wider text-muted-foreground">{title}</p>
      {items.length === 0 ? (
        <p className="text-sm italic text-muted-foreground">—</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {items.map((s, i) => (
            <span key={i} className="rounded-md border bg-muted/50 px-2 py-0.5 text-xs font-medium text-[var(--navy)] dark:text-blue-100">
              {s}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
