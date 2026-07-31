'use client'
import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Tabs, TabsList, TabsTrigger,
} from '@/components/ui/tabs'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SectionTitle, StatusBadge, EmptyState } from '@/components/shared'
import { toast } from 'sonner'
import {
  Users, Search, Eye, Check, X, Pencil, KeyRound, Lock, Unlock, Trash2, MoreVertical,
  FileText, Download, Copy, ShieldAlert, UserCheck, Briefcase, Mail, Phone, IdCard,
  GraduationCap, Award, MapPin, Heart, Droplet, Building2, CreditCard, Banknote,
  Calendar, Wallet, Clock, CheckCheck,
} from 'lucide-react'
import { DEPARTMENTS } from '@/lib/constants'
import { api, fmtDate, formatINR, initials, parseJSON } from '../lib'

interface EmployeeDoc {
  id: string; documentType: string; fileName: string; filePath: string; uploadedAt: string
  verified?: boolean; verifiedBy?: string | null; verifiedAt?: string | null; verifyNote?: string | null
}
interface GeneratedDoc {
  id: string; docType: string; title: string; generatedAt: string
}
interface Employee {
  id: string; employeeCode: string | null; status: string;
  fullName: string; fatherName: string | null; motherName: string | null;
  dob: string | null; gender: string | null; bloodGroup: string | null;
  mobile: string | null; alternateMobile: string | null; email: string;
  address: string | null; emergencyContact: string | null;
  aadhaar: string | null; pan: string | null; uan: string | null; esic: string | null;
  passport: string | null; drivingLicence: string | null;
  bankHolder: string | null; bankName: string | null; bankBranch: string | null;
  bankAccount: string | null; bankIfsc: string | null;
  educationJson: string | null;
  currentDesignation: string | null; totalExperience: string | null; relevantExperience: string | null;
  currentCompany: string | null; previousCompany: string | null; currentSalary: string | null;
  expectedSalary: string | null; noticePeriod: string | null;
  disciplines: string | null; projectTypes: string | null; skills: string | null;
  designation: string | null; department: string | null; joinDate: string | null;
  employmentType: string | null; salary: number | null;
  basic: number | null; hra: number | null; allowances: number | null; specialAllowance: number | null;
  rejectReason: string | null; createdAt: string;
  documents?: EmployeeDoc[]; generatedDocs?: GeneratedDoc[];
  user?: { locked: boolean; username: string } | null;
  interviewStatus?: string | null; interviewDate?: string | null; interviewNotes?: string | null;
  documentsVerified?: boolean;
  assignedClient?: { id: string; clientName: string } | null;
}

const STATUS_TABS = [
  { value: 'ALL', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
]

const DOC_LABELS: Record<string, string> = {
  aadhaar: 'Aadhaar Card',
  pan: 'PAN Card',
  photo: 'Passport Photo',
  signature: 'Signature',
  passbook: 'Bank Passbook',
  resume: 'Resume / CV',
  experience_certificate: 'Experience Certificate',
  education_certificate: 'Education Certificate',
  salary_slip: 'Salary Slip',
  relieving_letter: 'Relieving Letter',
}

export function Employees({ refreshKey, canDelete }: { refreshKey: number; canDelete: boolean }) {
  const [list, setList] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('ALL')
  const [q, setQ] = useState('')
  const [searchInput, setSearchInput] = useState('')

  // Detail / action dialogs
  const [viewing, setViewing] = useState<Employee | null>(null)
  const [viewingDocs, setViewingDocs] = useState<{ uploaded: EmployeeDoc[]; generated: GeneratedDoc[] }>({ uploaded: [], generated: [] })
  const [loadingDocs, setLoadingDocs] = useState(false)
  const [approving, setApproving] = useState<Employee | null>(null)
  const [rejecting, setRejecting] = useState<Employee | null>(null)
  const [editing, setEditing] = useState<Employee | null>(null)
  const [deleting, setDeleting] = useState<Employee | null>(null)
  const [resetting, setResetting] = useState<Employee | null>(null)
  const [lockToggling, setLockToggling] = useState<Employee | null>(null)
  const [creds, setCreds] = useState<{ username: string; tempPassword: string; empName: string } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (status !== 'ALL') params.set('status', status)
      if (q) params.set('q', q)
      const data = await api<{ employees: Employee[] }>(`/api/admin/employees?${params.toString()}`)
      setList(data.employees || [])
    } catch (e: any) {
      toast.error(e.message || 'Failed to load employees')
    } finally {
      setLoading(false)
    }
  }, [status, q])

  useEffect(() => { load() }, [load, refreshKey])

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => setQ(searchInput.trim()), 350)
    return () => clearTimeout(t)
  }, [searchInput])

  const openDetail = (emp: Employee) => {
    // Defer to allow dropdown menu to close first (Radix focus management)
    setTimeout(() => {
      setViewing(emp)
      setViewingDocs({ uploaded: [], generated: [] })
      setLoadingDocs(true)
      api<{ docs: GeneratedDoc[]; uploaded: EmployeeDoc[] }>(`/api/admin/employees/${emp.id}/documents`)
        .then((data) => {
          setViewingDocs({ uploaded: data.uploaded || [], generated: data.docs || [] })
        })
        .catch(() => {})
        .finally(() => setLoadingDocs(false))
    }, 50)
  }

  const copyCreds = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Copied to clipboard')
    } catch {
      toast.error('Copy failed — please copy manually')
    }
  }

  return (
    <div className="space-y-5">
      <SectionTitle
        title="Employees"
        desc="Review applications, manage employee records & credentials"
        action={
          list.length > 0 ? (
            <Button variant="outline" size="sm" onClick={() => {
              const cols = [
                { key: 'employeeCode', label: 'Code' },
                { key: 'fullName', label: 'Name' },
                { key: 'designation', label: 'Designation' },
                { key: 'department', label: 'Department' },
                { key: 'email', label: 'Email' },
                { key: 'mobile', label: 'Mobile' },
                { key: 'status', label: 'Status' },
                { key: 'employmentType', label: 'Type' },
              ]
              const esc = (s: string) => '"' + s.replace(/"/g, '""') + '"'
              let csv = cols.map(c => c.label).join(',') + '\n'
              for (const e of list) {
                csv += cols.map(c => {
                  const v = (e as any)[c.key]
                  return typeof v === 'string' ? esc(v) : (v ?? '')
                }).join(',') + '\n'
              }
              const blob = new Blob([csv], { type: 'text/csv' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url; a.download = `employees_${new Date().toISOString().slice(0, 10)}.csv`
              a.click(); URL.revokeObjectURL(url)
            }}>
              <Download className="mr-1.5 h-3.5 w-3.5" /> Export CSV
            </Button>
          ) : undefined
        }
      />

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Tabs value={status} onValueChange={setStatus}>
              <TabsList>
                {STATUS_TABS.map((t) => (
                  <TabsTrigger key={t.value} value={t.value} className="text-xs sm:text-sm">
                    {t.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by name, code, email, mobile…"
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : list.length === 0 ? (
            <EmptyState icon={Users} title="No employees found" desc="Try adjusting filters or search query" />
          ) : (
            <div className="max-h-[60vh] overflow-y-auto scroll-thin rounded-lg border">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-card">
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead className="hidden md:table-cell">Designation</TableHead>
                    <TableHead className="hidden lg:table-cell">Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.map((e) => (
                    <TableRow key={e.id} className="hover:bg-muted/40">
                      <TableCell className="font-mono text-xs">{e.employeeCode || '—'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-8 w-8 ring-1 ring-[var(--gold)]/30">
                            <AvatarFallback className="bg-[var(--navy)]/10 text-[10px] font-bold text-[var(--navy)]">
                              {initials(e.fullName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-[var(--navy)] dark:text-white">{e.fullName}</p>
                            <p className="truncate text-[11px] text-muted-foreground">{e.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm">{e.designation || e.currentDesignation || '—'}</TableCell>
                      <TableCell className="hidden lg:table-cell text-sm">{e.department || '—'}</TableCell>
                      <TableCell><StatusBadge status={e.status} /></TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {e.status === 'PENDING' && (
                            <>
                              <Button size="sm" variant="outline" className="h-8 gap-1 border-emerald-500/30 text-emerald-700 hover:bg-emerald-50"
                                onClick={() => setApproving(e)}
                              >
                                <Check className="h-3.5 w-3.5" /> Approve
                              </Button>
                              <Button size="sm" variant="outline" className="h-8 gap-1 border-red-500/30 text-red-700 hover:bg-red-50"
                                onClick={() => setRejecting(e)}
                              >
                                <X className="h-3.5 w-3.5" /> Reject
                              </Button>
                            </>
                          )}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0" aria-label="More actions">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => openDetail(e)}>
                                <Eye className="mr-2 h-4 w-4" /> View details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setEditing(e)}>
                                <Pencil className="mr-2 h-4 w-4" /> Edit
                              </DropdownMenuItem>
                              {e.status === 'APPROVED' && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem onClick={() => setResetting(e)}>
                                    <KeyRound className="mr-2 h-4 w-4" /> Reset password
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => setLockToggling(e)}>
                                    {e.user?.locked
                                      ? <><Unlock className="mr-2 h-4 w-4" /> Unlock account</>
                                      : <><Lock className="mr-2 h-4 w-4" /> Lock account</>}
                                  </DropdownMenuItem>
                                </>
                              )}
                              {canDelete && (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem className="text-red-600 focus:text-red-700" onClick={() => setDeleting(e)}>
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {!loading && list.length > 0 && (
            <p className="mt-3 text-xs text-muted-foreground">
              Showing {list.length} employee{list.length > 1 ? 's' : ''}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto scroll-thin">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Avatar className="h-10 w-10 ring-2 ring-[var(--gold)]/40">
                <AvatarFallback className="bg-[var(--navy)] text-[var(--gold)] text-sm font-bold">
                  {initials(viewing?.fullName || '')}
                </AvatarFallback>
              </Avatar>
              <div>
                <p>{viewing?.fullName}</p>
                <p className="text-xs font-normal text-muted-foreground">
                  {viewing?.employeeCode || 'Pending code'} • {viewing?.email}
                </p>
              </div>
            </DialogTitle>
            <DialogDescription className="sr-only">Full employee profile</DialogDescription>
          </DialogHeader>

          {viewing && <ProfileBody emp={viewing} docs={viewingDocs} loadingDocs={loadingDocs} onDocsChange={(d) => setViewingDocs(d)} />}

          <DialogFooter className="gap-2 sm:gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => exportEmployeeProfile(viewing, viewingDocs)}>
              <Download className="mr-1 h-4 w-4" /> Export Profile
            </Button>
            <Button variant="outline" onClick={() => setViewing(null)}>Close</Button>
            {viewing?.status === 'PENDING' && (
              <>
                <Button variant="outline" className="border-red-500/30 text-red-700 hover:bg-red-50"
                  onClick={() => { setRejecting(viewing); setViewing(null) }}
                >
                  <X className="mr-1 h-4 w-4" /> Reject
                </Button>
                <Button className="bg-[var(--navy)] text-white hover:bg-[var(--navy-light)]"
                  onClick={() => { setApproving(viewing); setViewing(null) }}
                >
                  <Check className="mr-1 h-4 w-4" /> Approve
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve Dialog */}
      {approving && (
        <ApproveDialog
          emp={approving}
          onClose={() => setApproving(null)}
          onSuccess={(c) => {
            setCreds({ username: c.username, tempPassword: c.tempPassword, empName: approving.fullName })
            setApproving(null)
            load()
          }}
        />
      )}

      {/* Reject Dialog */}
      {rejecting && (
        <RejectDialog
          emp={rejecting}
          onClose={() => setRejecting(null)}
          onSuccess={() => { setRejecting(null); load() }}
        />
      )}

      {/* Edit Dialog */}
      {editing && (
        <EditDialog
          emp={editing}
          onClose={() => setEditing(null)}
          onSuccess={() => { setEditing(null); load() }}
        />
      )}

      {/* Reset password confirmation */}
      <AlertDialog open={!!resetting} onOpenChange={(o) => !o && setResetting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset password?</AlertDialogTitle>
            <AlertDialogDescription>
              This will generate a new temporary password for <strong>{resetting?.fullName}</strong>. The employee must reset it on next login.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!resetting) return
                try {
                  const data = await api<{ tempPassword: string }>(`/api/admin/employees/${resetting.id}/reset-password`, { method: 'POST' })
                  setCreds({ username: resetting.user?.username || resetting.email, tempPassword: data.tempPassword, empName: resetting.fullName })
                  setResetting(null)
                  toast.success('Password reset successfully')
                } catch (e: any) {
                  toast.error(e.message || 'Reset failed')
                }
              }}
            >
              <KeyRound className="mr-1 h-4 w-4" /> Reset Password
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Lock/unlock confirmation */}
      <AlertDialog open={!!lockToggling} onOpenChange={(o) => !o && setLockToggling(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{lockToggling?.user?.locked ? 'Unlock account?' : 'Lock account?'}</AlertDialogTitle>
            <AlertDialogDescription>
              {lockToggling?.user?.locked
                ? `Unlock ${lockToggling?.fullName}'s login access. They will be able to sign in again.`
                : `Lock ${lockToggling?.fullName}'s login access. They will be unable to sign in until unlocked.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!lockToggling) return
                const action = lockToggling.user?.locked ? 'unlock' : 'lock'
                try {
                  await api(`/api/admin/employees/${lockToggling.id}/reset-password`, {
                    method: 'PATCH', body: JSON.stringify({ action }),
                  })
                  toast.success(`Account ${action === 'lock' ? 'locked' : 'unlocked'}`)
                  setLockToggling(null); load()
                } catch (e: any) {
                  toast.error(e.message || 'Action failed')
                }
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-700">Delete employee?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <strong>{deleting?.fullName}</strong> and their login account, attendance, documents, and related records. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={async () => {
                if (!deleting) return
                try {
                  await api(`/api/admin/employees/${deleting.id}`, { method: 'DELETE' })
                  toast.success('Employee deleted')
                  setDeleting(null); load()
                } catch (e: any) {
                  toast.error(e.message || 'Delete failed')
                }
              }}
            >
              <Trash2 className="mr-1 h-4 w-4" /> Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Credentials (success) Dialog */}
      <Dialog open={!!creds} onOpenChange={(o) => !o && setCreds(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[var(--navy)] dark:text-white">
              <UserCheck className="h-5 w-5 text-emerald-600" />
              Credentials Generated
            </DialogTitle>
            <DialogDescription>
              Login credentials for <strong>{creds?.empName}</strong>. Share securely with the employee.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
              <div className="flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                  <strong>Important:</strong> The employee must reset this temporary password on first login. Save these credentials securely — they will not be shown again.
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <CredField label="Username" value={creds?.username || ''} onCopy={() => copyCreds(creds?.username || '')} />
              <CredField label="Temporary Password" value={creds?.tempPassword || ''} onCopy={() => copyCreds(creds?.tempPassword || '')} mono />
            </div>
          </div>
          <DialogFooter>
            <Button
              className="bg-[var(--navy)] text-white hover:bg-[var(--navy-light)]"
              onClick={() => {
                copyCreds(`Username: ${creds?.username}\nTemporary Password: ${creds?.tempPassword}`)
              }}
            >
              <Copy className="mr-1 h-4 w-4" /> Copy both
            </Button>
            <Button variant="outline" onClick={() => setCreds(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ============================================================
// Sub-components
// ============================================================

function CredField({ label, value, onCopy, mono }: { label: string; value: string; onCopy: () => void; mono?: boolean }) {
  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className={`mt-0.5 truncate text-sm font-bold text-[var(--navy)] dark:text-white ${mono ? 'font-mono' : ''}`}>
            {value}
          </p>
        </div>
        <Button size="sm" variant="ghost" onClick={onCopy} className="h-8 w-8 p-0" aria-label={`Copy ${label}`}>
          <Copy className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 py-1.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-[var(--navy)] dark:text-white break-words">{value || '—'}</p>
      </div>
    </div>
  )
}

function PipelineStep({ label, active, done, pending }: { label: string; active: boolean; done: boolean; pending?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
      done ? 'bg-emerald-500/15 text-emerald-700 border border-emerald-500/30'
      : pending ? 'bg-amber-500/15 text-amber-700 border border-amber-500/30'
      : active ? 'bg-[var(--navy)]/10 text-[var(--navy)] border border-[var(--navy)]/20'
      : 'bg-muted text-muted-foreground border border-border'
    }`}>
      {done ? <Check className="h-3 w-3" /> : pending ? <Clock className="h-3 w-3" /> : null}
      {label}
    </span>
  )
}
function PipelineArrow() {
  return <span className="text-muted-foreground text-xs">→</span>
}

function Section({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border p-4">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-4 w-4 text-[var(--gold)]" />
        <h4 className="text-sm font-semibold text-[var(--navy)] dark:text-white">{title}</h4>
      </div>
      <div className="grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
        {children}
      </div>
    </div>
  )
}

function ProfileBody({ emp, docs, loadingDocs, onDocsChange }: { emp: Employee; docs: { uploaded: EmployeeDoc[]; generated: GeneratedDoc[] }; loadingDocs: boolean; onDocsChange: (d: { uploaded: EmployeeDoc[]; generated: GeneratedDoc[] }) => void }) {
  const education = parseJSON<{ qualification?: string; specialization?: string; college?: string; year?: string }[]>(emp.educationJson, [])
  const disciplines = emp.disciplines?.split(',').map((s) => s.trim()).filter(Boolean) || []
  const skills = emp.skills?.split(',').map((s) => s.trim()).filter(Boolean) || []

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={emp.status} />
        {emp.user?.locked && <Badge variant="outline" className="border-red-500/30 text-red-700"><Lock className="mr-1 h-3 w-3" /> Locked</Badge>}
        {emp.employmentType && <Badge variant="outline">{emp.employmentType}</Badge>}
        {emp.department && <Badge variant="outline">{emp.department}</Badge>}
        {emp.assignedClient && <Badge variant="outline" className="border-[var(--gold)]/40 text-[#8a6f24]"><Building2 className="mr-1 h-3 w-3" /> {emp.assignedClient.clientName}</Badge>}
      </div>

      {/* Hiring Pipeline */}
      <div className="rounded-lg border bg-muted/30 p-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">Hiring Pipeline</p>
        <div className="flex flex-wrap items-center gap-2">
          <PipelineStep label="Applied" active={true} done={true} />
          <PipelineArrow />
          <PipelineStep label="Docs Verified" active={true} done={!!emp.documentsVerified} />
          <PipelineArrow />
          <PipelineStep label="Interview" active={!!emp.interviewStatus} done={emp.interviewStatus === 'PASSED'} pending={emp.interviewStatus === 'SCHEDULED'} />
          <PipelineArrow />
          <PipelineStep label="Hired" active={emp.status === 'APPROVED'} done={emp.status === 'APPROVED'} />
          <PipelineArrow />
          <PipelineStep label="Client Assigned" active={!!emp.assignedClient} done={!!emp.assignedClient} />
        </div>
        {emp.interviewStatus && emp.interviewStatus !== 'NONE' && (
          <p className="mt-2 text-xs text-muted-foreground">
            Interview: <strong>{emp.interviewStatus}</strong>
            {emp.interviewDate ? ` on ${fmtDate(emp.interviewDate)}` : ''}
            {emp.interviewNotes ? ` — ${emp.interviewNotes}` : ''}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Section title="Personal" icon={Users}>
          <InfoRow icon={Users} label="Father's Name" value={emp.fatherName} />
          <InfoRow icon={Users} label="Mother's Name" value={emp.motherName} />
          <InfoRow icon={Calendar} label="Date of Birth" value={emp.dob ? fmtDate(emp.dob) : null} />
          <InfoRow icon={Users} label="Gender" value={emp.gender} />
          <InfoRow icon={Droplet} label="Blood Group" value={emp.bloodGroup} />
          <InfoRow icon={Phone} label="Mobile" value={emp.mobile} />
          <InfoRow icon={Phone} label="Alternate Mobile" value={emp.alternateMobile} />
          <InfoRow icon={Mail} label="Email" value={emp.email} />
          <InfoRow icon={MapPin} label="Address" value={emp.address} />
          <InfoRow icon={Heart} label="Emergency Contact" value={emp.emergencyContact} />
        </Section>

        <Section title="Identity" icon={IdCard}>
          <InfoRow icon={IdCard} label="Aadhaar" value={emp.aadhaar} />
          <InfoRow icon={IdCard} label="PAN" value={emp.pan} />
          <InfoRow icon={IdCard} label="UAN" value={emp.uan} />
          <InfoRow icon={IdCard} label="ESIC" value={emp.esic} />
          <InfoRow icon={IdCard} label="Passport" value={emp.passport} />
          <InfoRow icon={IdCard} label="Driving Licence" value={emp.drivingLicence} />
        </Section>

        <Section title="Bank Details" icon={Building2}>
          <InfoRow icon={CreditCard} label="Account Holder" value={emp.bankHolder} />
          <InfoRow icon={Banknote} label="Bank Name" value={emp.bankName} />
          <InfoRow icon={Building2} label="Branch" value={emp.bankBranch} />
          <InfoRow icon={CreditCard} label="Account Number" value={emp.bankAccount} />
          <InfoRow icon={CreditCard} label="IFSC" value={emp.bankIfsc} />
        </Section>

        <Section title="Employment" icon={Briefcase}>
          <InfoRow icon={Briefcase} label="Designation" value={emp.designation || emp.currentDesignation} />
          <InfoRow icon={Building2} label="Department" value={emp.department} />
          <InfoRow icon={Calendar} label="Join Date" value={emp.joinDate ? fmtDate(emp.joinDate) : null} />
          <InfoRow icon={Briefcase} label="Type" value={emp.employmentType} />
          <InfoRow icon={Wallet} label="Salary (CTC)" value={emp.salary ? formatINR(emp.salary) : null} />
          <InfoRow icon={Wallet} label="Basic" value={emp.basic ? formatINR(emp.basic) : null} />
          <InfoRow icon={Wallet} label="HRA" value={emp.hra ? formatINR(emp.hra) : null} />
          <InfoRow icon={Wallet} label="Allowances" value={emp.allowances ? formatINR(emp.allowances) : null} />
        </Section>

        <Section title="Experience" icon={Briefcase}>
          <InfoRow icon={Briefcase} label="Total Experience" value={emp.totalExperience} />
          <InfoRow icon={Briefcase} label="Relevant Experience" value={emp.relevantExperience} />
          <InfoRow icon={Building2} label="Current Company" value={emp.currentCompany} />
          <InfoRow icon={Building2} label="Previous Company" value={emp.previousCompany} />
          <InfoRow icon={Wallet} label="Current Salary" value={emp.currentSalary} />
          <InfoRow icon={Wallet} label="Expected Salary" value={emp.expectedSalary} />
          <InfoRow icon={Clock} label="Notice Period" value={emp.noticePeriod} />
        </Section>

        <Section title="Education & Skills" icon={GraduationCap}>
          {education.length > 0 ? (
            <div className="sm:col-span-2 space-y-2">
              {education.map((ed, i) => (
                <div key={i} className="rounded border p-2 text-xs">
                  <p className="font-semibold text-[var(--navy)] dark:text-white">
                    {ed.qualification || '—'}{ed.year ? ` (${ed.year})` : ''}
                  </p>
                  <p className="text-muted-foreground">
                    {[ed.specialization, ed.college].filter(Boolean).join(' • ')}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <InfoRow icon={GraduationCap} label="Education" value={null} />
          )}
          <div className="sm:col-span-2">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Disciplines</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {disciplines.length > 0 ? disciplines.map((d) => (
                <Badge key={d} variant="secondary" className="text-[10px]">{d}</Badge>
              )) : <span className="text-sm text-muted-foreground">—</span>}
            </div>
          </div>
          <div className="sm:col-span-2">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Skills</p>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {skills.length > 0 ? skills.map((s) => (
                <Badge key={s} variant="outline" className="text-[10px] border-[var(--gold)]/40 text-[#8a6f24]">{s}</Badge>
              )) : <span className="text-sm text-muted-foreground">—</span>}
            </div>
          </div>
        </Section>
      </div>

      {/* Documents */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Section title="Uploaded Documents — HR Verification" icon={FileText}>
          <div className="sm:col-span-2 space-y-1.5">
            {docs.uploaded.length === 0 ? (
              <p className="text-sm text-muted-foreground">No documents uploaded</p>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-2">
                  {emp.documentsVerified ? (
                    <Badge variant="outline" className="border-emerald-500/40 text-emerald-700 bg-emerald-50"><CheckCheck className="mr-1 h-3 w-3" /> All documents verified</Badge>
                  ) : (
                    <Badge variant="outline" className="border-amber-500/40 text-amber-700 bg-amber-50"><Clock className="mr-1 h-3 w-3" /> Verification pending — {docs.uploaded.filter(d => d.verified).length}/{docs.uploaded.length} verified</Badge>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {docs.uploaded.map((d) => {
                    const fileName = d.filePath.split('/').pop()
                    const url = `/api/uploads/employees/${emp.id}/${fileName}`
                    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(d.fileName)
                    const label = DOC_LABELS[d.documentType] || d.documentType
                    return (
                      <div key={d.id} className={`group flex items-center gap-2 rounded-lg border p-2 text-xs transition-colors ${d.verified ? 'border-emerald-500/30 bg-emerald-50/40' : 'hover:border-[var(--gold)] hover:bg-muted/60'}`}>
                        <a href={url} target="_blank" rel="noreferrer" className="flex items-center gap-2 flex-1 min-w-0">
                          {isImage ? (
                            <img src={url} alt={label} className="h-12 w-12 shrink-0 rounded object-cover border" />
                          ) : (
                            <div className="grid h-12 w-12 shrink-0 place-items-center rounded border bg-muted">
                              <FileText className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                          <span className="min-w-0 flex-1">
                            <span className="block truncate font-semibold text-[var(--navy)] dark:text-white">{label}</span>
                            <span className="block truncate text-muted-foreground">{d.fileName}</span>
                            {d.verified && <span className="block text-[10px] text-emerald-600 font-medium">✓ Verified{d.verifiedAt ? ` ${fmtDate(d.verifiedAt)}` : ''}</span>}
                          </span>
                        </a>
                        <Button
                          size="sm"
                          variant={d.verified ? 'outline' : 'default'}
                          className={`h-7 shrink-0 text-[10px] ${d.verified ? 'border-emerald-500/30 text-emerald-700' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}
                          onClick={async (e) => {
                            e.preventDefault()
                            try {
                              const res = await fetch(`/api/admin/employees/${emp.id}/verify-doc`, {
                                method: 'POST', headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ docId: d.id, verified: !d.verified }),
                              })
                              if (!res.ok) throw new Error('Failed')
                              toast.success(d.verified ? `${label} unverified` : `${label} verified`)
                              // reload docs
                              const data = await api<{ docs: GeneratedDoc[]; uploaded: EmployeeDoc[] }>(`/api/admin/employees/${emp.id}/documents`)
                              onDocsChange({ uploaded: data.uploaded || [], generated: data.docs || [] })
                            } catch (e: any) { toast.error(e.message || 'Failed') }
                          }}
                        >
                          {d.verified ? <><X className="mr-0.5 h-3 w-3" /> Unverify</> : <><Check className="mr-0.5 h-3 w-3" /> Verify</>}
                        </Button>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        </Section>
        <Section title="Generated Documents" icon={Award}>
          <div className="sm:col-span-2 space-y-1.5">
            {loadingDocs ? (
              <Skeleton className="h-8 w-full" />
            ) : docs.generated.length === 0 ? (
              <p className="text-sm text-muted-foreground">No documents generated yet</p>
            ) : (
              docs.generated.map((d) => (
                <a
                  key={d.id}
                  href={`/api/documents/${d.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between rounded border p-2 text-xs transition-colors hover:bg-muted/60"
                >
                  <span className="flex items-center gap-2 truncate">
                    <Award className="h-3.5 w-3.5 text-[var(--gold)]" />
                    <span className="truncate font-medium text-[var(--navy)] dark:text-white">{d.title}</span>
                  </span>
                  <span className="flex items-center gap-2 text-muted-foreground">
                    {fmtDate(d.generatedAt)}
                    <Download className="h-3.5 w-3.5 text-[var(--gold)]" />
                  </span>
                </a>
              ))
            )}
          </div>
        </Section>
      </div>

      {emp.status === 'REJECTED' && emp.rejectReason && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3">
          <p className="text-xs font-semibold text-red-700">Rejection Reason</p>
          <p className="mt-1 text-sm text-red-700/80">{emp.rejectReason}</p>
        </div>
      )}
    </div>
  )
}

function ApproveDialog({ emp, onClose, onSuccess }: {
  emp: Employee
  onClose: () => void
  onSuccess: (creds: { username: string; tempPassword: string }) => void
}) {
  const [designation, setDesignation] = useState(emp.currentDesignation || '')
  const [department, setDepartment] = useState(emp.department || 'Projects')
  const [salary, setSalary] = useState(String(emp.expectedSalary || '').replace(/[^0-9]/g, '') || '')
  const [joinDate, setJoinDate] = useState(new Date().toISOString().slice(0, 10))
  const [employmentType, setEmploymentType] = useState(emp.employmentType || 'Full-time')
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    if (!designation.trim() || !department || !salary || !joinDate) {
      toast.error('Please fill all required fields')
      return
    }
    setSaving(true)
    try {
      const data = await api<{ credentials: { username: string; tempPassword: string } }>(`/api/admin/employees/${emp.id}/approve`, {
        method: 'POST',
        body: JSON.stringify({
          designation: designation.trim(),
          department,
          salary: Number(salary),
          joinDate,
          employmentType,
        }),
      })
      toast.success(`${emp.fullName} approved successfully`)
      onSuccess(data.credentials)
    } catch (e: any) {
      toast.error(e.message || 'Approval failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-emerald-600" /> Approve Employee
          </DialogTitle>
          <DialogDescription>
            On approval, the system will generate an employee code, login credentials, and onboarding documents automatically.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="rounded-lg border p-3">
            <p className="text-xs text-muted-foreground">Approving</p>
            <p className="font-semibold text-[var(--navy)] dark:text-white">{emp.fullName}</p>
            <p className="text-xs text-muted-foreground">{emp.email}</p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="ap-designation">Designation *</Label>
              <Input id="ap-designation" value={designation} onChange={(e) => setDesignation(e.target.value)} placeholder="e.g. Project Engineer" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ap-dept">Department *</Label>
              <Select value={department} onValueChange={setDepartment}>
                <SelectTrigger id="ap-dept"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ap-salary">Monthly Salary (₹) *</Label>
              <Input id="ap-salary" type="number" value={salary} onChange={(e) => setSalary(e.target.value)} placeholder="e.g. 35000" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ap-join">Join Date *</Label>
              <Input id="ap-join" type="date" value={joinDate} onChange={(e) => setJoinDate(e.target.value)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="ap-type">Employment Type</Label>
              <Select value={employmentType} onValueChange={setEmploymentType}>
                <SelectTrigger id="ap-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Full-time">Full-time</SelectItem>
                  <SelectItem value="Contract">Contract</SelectItem>
                  <SelectItem value="Internship">Internship</SelectItem>
                  <SelectItem value="Part-time">Part-time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="rounded border border-emerald-500/30 bg-emerald-500/5 p-2.5 text-xs text-emerald-700">
            Salary structure (auto-calculated): Basic 50%, HRA 20%, Allowances 10%, Special 20%.
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button className="bg-emerald-600 text-white hover:bg-emerald-700" onClick={submit} disabled={saving}>
            {saving ? 'Approving…' : 'Approve & Generate Credentials'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function RejectDialog({ emp, onClose, onSuccess }: { emp: Employee; onClose: () => void; onSuccess: () => void }) {
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    if (!reason.trim()) { toast.error('Please provide a reason'); return }
    setSaving(true)
    try {
      await api(`/api/admin/employees/${emp.id}/reject`, {
        method: 'POST', body: JSON.stringify({ reason: reason.trim() }),
      })
      toast.success('Application rejected')
      onSuccess()
    } catch (e: any) {
      toast.error(e.message || 'Reject failed')
    } finally { setSaving(false) }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-700">
            <X className="h-5 w-5" /> Reject Application
          </DialogTitle>
          <DialogDescription>
            Reject <strong>{emp.fullName}</strong>'s application. A reason will be recorded for audit.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="rej-reason">Reason *</Label>
          <Textarea
            id="rej-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Provide a clear reason for rejection…"
            rows={4}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" onClick={submit} disabled={saving}>
            {saving ? 'Rejecting…' : 'Reject Application'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function EditDialog({ emp, onClose, onSuccess }: { emp: Employee; onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({
    fullName: emp.fullName || '',
    email: emp.email || '',
    mobile: emp.mobile || '',
    alternateMobile: emp.alternateMobile || '',
    address: emp.address || '',
    emergencyContact: emp.emergencyContact || '',
    designation: emp.designation || emp.currentDesignation || '',
    department: emp.department || '',
    employmentType: emp.employmentType || 'Full-time',
    salary: emp.salary ? String(emp.salary) : '',
    basic: emp.basic ? String(emp.basic) : '',
    hra: emp.hra ? String(emp.hra) : '',
    allowances: emp.allowances ? String(emp.allowances) : '',
    specialAllowance: emp.specialAllowance ? String(emp.specialAllowance) : '',
    bankHolder: emp.bankHolder || '',
    bankName: emp.bankName || '',
    bankBranch: emp.bankBranch || '',
    bankAccount: emp.bankAccount || '',
    bankIfsc: emp.bankIfsc || '',
    status: emp.status || 'PENDING',
  })
  const [saving, setSaving] = useState(false)

  const submit = async () => {
    setSaving(true)
    try {
      const payload: any = { id: emp.id }
      for (const [k, v] of Object.entries(form)) {
        if (v !== '' && v !== null && v !== undefined) {
          if (['salary', 'basic', 'hra', 'allowances', 'specialAllowance'].includes(k)) {
            payload[k] = Number(v)
          } else {
            payload[k] = v
          }
        }
      }
      await api('/api/admin/employees', { method: 'PATCH', body: JSON.stringify(payload) })
      toast.success('Employee updated')
      onSuccess()
    } catch (e: any) {
      toast.error(e.message || 'Update failed')
    } finally { setSaving(false) }
  }

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto scroll-thin">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pencil className="h-5 w-5" /> Edit Employee
          </DialogTitle>
          <DialogDescription>{emp.fullName} • {emp.employeeCode || 'Pending'}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Personal</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5"><Label>Full Name</Label><Input value={form.fullName} onChange={(e) => set('fullName', e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Email</Label><Input value={form.email} onChange={(e) => set('email', e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Mobile</Label><Input value={form.mobile} onChange={(e) => set('mobile', e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Alternate Mobile</Label><Input value={form.alternateMobile} onChange={(e) => set('alternateMobile', e.target.value)} /></div>
              <div className="space-y-1.5 sm:col-span-2"><Label>Address</Label><Input value={form.address} onChange={(e) => set('address', e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Emergency Contact</Label><Input value={form.emergencyContact} onChange={(e) => set('emergencyContact', e.target.value)} /></div>
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Employment</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5"><Label>Designation</Label><Input value={form.designation} onChange={(e) => set('designation', e.target.value)} /></div>
              <div className="space-y-1.5">
                <Label>Department</Label>
                <Select value={form.department} onValueChange={(v) => set('department', v)}>
                  <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    {DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Employment Type</Label>
                <Select value={form.employmentType} onValueChange={(v) => set('employmentType', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Full-time">Full-time</SelectItem>
                    <SelectItem value="Contract">Contract</SelectItem>
                    <SelectItem value="Internship">Internship</SelectItem>
                    <SelectItem value="Part-time">Part-time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => set('status', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                    <SelectItem value="TERMINATED">Terminated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Salary Structure (Monthly ₹)</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="space-y-1.5"><Label>CTC</Label><Input type="number" value={form.salary} onChange={(e) => set('salary', e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Basic</Label><Input type="number" value={form.basic} onChange={(e) => set('basic', e.target.value)} /></div>
              <div className="space-y-1.5"><Label>HRA</Label><Input type="number" value={form.hra} onChange={(e) => set('hra', e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Allowances</Label><Input type="number" value={form.allowances} onChange={(e) => set('allowances', e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Special Allow.</Label><Input type="number" value={form.specialAllowance} onChange={(e) => set('specialAllowance', e.target.value)} /></div>
            </div>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Bank Details</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5"><Label>Account Holder</Label><Input value={form.bankHolder} onChange={(e) => set('bankHolder', e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Bank Name</Label><Input value={form.bankName} onChange={(e) => set('bankName', e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Branch</Label><Input value={form.bankBranch} onChange={(e) => set('bankBranch', e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Account Number</Label><Input value={form.bankAccount} onChange={(e) => set('bankAccount', e.target.value)} /></div>
              <div className="space-y-1.5"><Label>IFSC</Label><Input value={form.bankIfsc} onChange={(e) => set('bankIfsc', e.target.value)} /></div>
            </div>
          </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button className="bg-[var(--navy)] text-white hover:bg-[var(--navy-light)]" onClick={submit} disabled={saving}>
            {saving ? 'Saving…' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Export employee profile as a printable HTML document (opens print dialog → save as PDF)
function exportEmployeeProfile(emp: Employee | null, docs: { uploaded: EmployeeDoc[]; generated: GeneratedDoc[] }) {
  if (!emp) return
  const education = parseJSON<any[]>(emp.educationJson, [])
  const disciplines = emp.disciplines?.split(',').filter(Boolean) || []
  const skills = emp.skills?.split(',').filter(Boolean) || []
  const win = window.open('', '_blank', 'width=900,height=700')
  if (!win) { toast.error('Pop-up blocked — please allow pop-ups to export'); return }
  const rows = (label: string, val: any) => `<tr><td style="padding:6px 10px;background:#f6f7fb;font-weight:600;color:#002B5C;width:35%;border:1px solid #dde3ee">${label}</td><td style="padding:6px 10px;border:1px solid #dde3ee">${val || '—'}</td></tr>`
  win.document.write(`<!DOCTYPE html><html><head><title>${emp.fullName} — Profile</title>
  <style>body{font-family:Arial,sans-serif;color:#0E1B33;margin:0;padding:40px}
  .head{background:#002B5C;color:#fff;padding:20px 30px;border-bottom:3px solid #D4AF37;margin:-40px -40px 24px}
  .head h1{margin:0;font-size:22px}.head p{margin:4px 0 0;color:#E8C96A;font-size:11px;letter-spacing:2px}
  h2{color:#002B5C;font-size:14px;margin:20px 0 8px;border-left:3px solid #D4AF37;padding-left:8px}
  table{width:100%;border-collapse:collapse;font-size:12px;margin-bottom:8px}
  .badge{display:inline-block;background:#002B5C;color:#D4AF37;padding:2px 8px;border-radius:10px;font-size:10px;margin:2px}
  .foot{margin-top:30px;border-top:1px solid #dde3ee;padding-top:10px;font-size:10px;color:#5A6A8A;text-align:center}
  </style></head><body>
  <div class="head"><h1>HP ENTERPRISE — Employee Profile</h1><p>SAFETY SERVICE &amp; MAN POWER SUPPLY</p></div>
  <h2>Employment</h2>
  <table>${rows('Employee Code', emp.employeeCode)}${rows('Full Name', emp.fullName)}${rows('Status', emp.status)}${rows('Designation', emp.designation || emp.currentDesignation)}${rows('Department', emp.department)}${rows('Join Date', emp.joinDate ? fmtDate(emp.joinDate) : '—')}${rows('Employment Type', emp.employmentType)}${rows('Salary (CTC)', emp.salary ? formatINR(emp.salary) : '—')}</table>
  <h2>Personal Details</h2>
  <table>${rows("Father's Name", emp.fatherName)}${rows("Mother's Name", emp.motherName)}${rows('Date of Birth', emp.dob ? fmtDate(emp.dob) : '—')}${rows('Gender', emp.gender)}${rows('Blood Group', emp.bloodGroup)}${rows('Mobile', emp.mobile)}${rows('Alternate Mobile', emp.alternateMobile)}${rows('Email', emp.email)}${rows('Address', emp.address)}${rows('Emergency Contact', emp.emergencyContact)}</table>
  <h2>Identity</h2>
  <table>${rows('Aadhaar', emp.aadhaar)}${rows('PAN', emp.pan)}${rows('UAN', emp.uan)}${rows('ESIC', emp.esic)}${rows('Passport', emp.passport)}${rows('Driving Licence', emp.drivingLicence)}</table>
  <h2>Bank Details</h2>
  <table>${rows('Account Holder', emp.bankHolder)}${rows('Bank Name', emp.bankName)}${rows('Branch', emp.bankBranch)}${rows('Account Number', emp.bankAccount)}${rows('IFSC', emp.bankIfsc)}</table>
  <h2>Experience</h2>
  <table>${rows('Current Designation', emp.currentDesignation)}${rows('Total Experience', emp.totalExperience)}${rows('Relevant Experience', emp.relevantExperience)}${rows('Current Company', emp.currentCompany)}${rows('Previous Company', emp.previousCompany)}${rows('Current Salary', emp.currentSalary)}${rows('Expected Salary', emp.expectedSalary)}${rows('Notice Period', emp.noticePeriod)}</table>
  <h2>Education</h2>
  <table>${education.length ? education.map((e:any,i:number)=>rows('Qualification '+(i+1), (e.qualification||'')+' '+(e.specialization||'')+' — '+(e.college||'')+' ('+(e.year||'')+')')).join('') : rows('Education', null)}</table>
  <h2>Disciplines &amp; Skills</h2>
  <p>${disciplines.map(d=>'<span class="badge">'+d+'</span>').join('')||'<span style="color:#999">—</span>'}</p>
  <p style="margin-top:8px">${skills.map(s=>'<span class="badge" style="background:#D4AF37;color:#002B5C">'+s+'</span>').join('')||'<span style="color:#999">—</span>'}</p>
  <h2>Uploaded Documents (${docs.uploaded.length})</h2>
  <table>${docs.uploaded.length ? docs.uploaded.map(d=>rows((DOC_LABELS[d.documentType]||d.documentType), d.fileName)).join('') : rows('Documents', 'None')}</table>
  <h2>Generated Documents (${docs.generated.length})</h2>
  <table>${docs.generated.length ? docs.generated.map(d=>rows(d.title, fmtDate(d.generatedAt))).join('') : rows('Documents', 'None')}</table>
  <div class="foot">HP ENTERPRISE Safety Service & Man Power Supply • Generated on ${new Date().toLocaleString('en-IN')} • Confidential</div>
  </body></html>`)
  win.document.close()
  setTimeout(() => { win.print() }, 500)
}
