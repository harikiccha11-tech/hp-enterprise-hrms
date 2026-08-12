'use client'
import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
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
import { SectionTitle, EmptyState } from '@/components/shared'
import { toast } from 'sonner'
import {
  Truck, Plus, Search, Pencil, Trash2, Wrench, MapPin, Fuel, Gauge,
  CalendarDays, UserCheck, AlertTriangle, CheckCircle2, XCircle, Clock,
  Car, Users, ArrowUpRight, ArrowDownRight, ClipboardList, History,
  Settings,
} from 'lucide-react'

interface Vehicle {
  id: string
  registration: string
  type: string
  make: string
  model: string
  year: number
  driver: string | null
  status: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE' | 'IN_TRANSIT'
  location: string
  lastService: string
  nextService: string
  fuelType: string
  mileage: number
}

interface ServiceRecord {
  id: string
  vehicleReg: string
  type: string
  description: string
  scheduledDate: string
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE'
  cost: number
  vendor: string
}

const VEHICLE_TYPES = ['Sedan', 'SUV', 'Hatchback', 'Van', 'Truck', 'Bus', 'Pickup', 'Motorcycle']
const FUEL_TYPES = ['Petrol', 'Diesel', 'Electric', 'CNG', 'Hybrid']

function vehicleStatusColor(status: string) {
  const map: Record<string, string> = {
    ACTIVE: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30',
    IN_TRANSIT: 'bg-sky-500/10 text-sky-700 border-sky-500/30',
    MAINTENANCE: 'bg-amber-500/10 text-amber-700 border-amber-500/30',
    INACTIVE: 'bg-gray-500/10 text-gray-700 border-gray-500/30',
  }
  return map[status] || 'bg-gray-500/10 text-gray-700 border-gray-500/30'
}

function serviceStatusColor(status: string) {
  const map: Record<string, string> = {
    SCHEDULED: 'bg-sky-500/10 text-sky-700 border-sky-500/30',
    IN_PROGRESS: 'bg-amber-500/10 text-amber-700 border-amber-500/30',
    COMPLETED: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30',
    OVERDUE: 'bg-red-500/10 text-red-700 border-red-500/30',
  }
  return map[status] || 'bg-gray-500/10 text-gray-700 border-gray-500/30'
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function isOverdue(iso: string) {
  return new Date(iso) < new Date()
}

type VehicleFormState = {
  registration: string
  type: string
  make: string
  model: string
  year: string
  driver: string
  status: string
  location: string
  fuelType: string
  mileage: string
}

const EMPTY_VEHICLE: VehicleFormState = {
  registration: '', type: 'Sedan', make: '', model: '', year: '2024',
  driver: '', status: 'ACTIVE', location: '', fuelType: 'Diesel', mileage: '0',
}

export function FleetManagement({ refreshKey }: { refreshKey: number }) {
  const [loading, setLoading] = useState(true)
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [serviceRecords, setServiceRecords] = useState<ServiceRecord[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Vehicle | null>(null)
  const [deleting, setDeleting] = useState<Vehicle | null>(null)
  const [assigning, setAssigning] = useState<Vehicle | null>(null)
  const [scheduleService, setScheduleService] = useState(false)
  const [form, setForm] = useState<VehicleFormState>(EMPTY_VEHICLE)
  const [assignDriver, setAssignDriver] = useState('')

  useEffect(() => {
    // No backend API exists for fleet management
    const timer = setTimeout(() => setLoading(false), 400)
    return () => clearTimeout(timer)
  }, [])

  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      const matchSearch = !search ||
        v.registration.toLowerCase().includes(search.toLowerCase()) ||
        v.make.toLowerCase().includes(search.toLowerCase()) ||
        v.model.toLowerCase().includes(search.toLowerCase()) ||
        (v.driver && v.driver.toLowerCase().includes(search.toLowerCase()))
      const matchStatus = !statusFilter || v.status === statusFilter
      const matchType = !typeFilter || v.type === typeFilter
      return matchSearch && matchStatus && matchType
    })
  }, [vehicles, search, statusFilter, typeFilter, refreshKey])

  const stats = useMemo(() => {
    const total = vehicles.length
    const active = vehicles.filter((v) => v.status === 'ACTIVE' || v.status === 'IN_TRANSIT').length
    const maintenance = vehicles.filter((v) => v.status === 'MAINTENANCE').length
    const inactive = vehicles.filter((v) => v.status === 'INACTIVE').length
    const overdueServices = serviceRecords.filter((s) => s.status === 'OVERDUE').length
    return { total, active, maintenance, inactive, overdueServices }
  }, [vehicles, serviceRecords])

  const set = (k: keyof VehicleFormState, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const openCreate = () => { setForm(EMPTY_VEHICLE); setCreating(true) }
  const openEdit = (v: Vehicle) => {
    setForm({
      registration: v.registration, type: v.type, make: v.make, model: v.model,
      year: String(v.year), driver: v.driver || '', status: v.status, location: v.location,
      fuelType: v.fuelType, mileage: String(v.mileage),
    })
    setEditing(v)
  }

  const handleSave = () => {
    if (!form.registration.trim()) { toast.error('Registration number is required'); return }
    if (!form.make.trim()) { toast.error('Vehicle make is required'); return }
    if (editing) {
      setVehicles((prev) => prev.map((v) => v.id === editing.id ? {
        ...v, registration: form.registration, type: form.type, make: form.make, model: form.model,
        year: parseInt(form.year) || v.year, driver: form.driver || null, status: v.status,
        location: form.location, fuelType: form.fuelType, mileage: parseInt(form.mileage) || v.mileage,
      } : v))
      setEditing(null)
      toast.success('Vehicle updated successfully')
    } else {
      const newVehicle: Vehicle = {
        id: String(Date.now()),
        registration: form.registration, type: form.type, make: form.make, model: form.model,
        year: parseInt(form.year) || 2024, driver: form.driver || null, status: form.status as Vehicle['status'],
        location: form.location, lastService: new Date().toISOString(), nextService: new Date(Date.now() + 90 * 86400000).toISOString(),
        fuelType: form.fuelType, mileage: parseInt(form.mileage) || 0,
      }
      setVehicles([newVehicle, ...vehicles])
      setCreating(false)
      toast.success('Vehicle added successfully')
    }
  }

  const handleDelete = () => {
    if (!deleting) return
    setVehicles((prev) => prev.filter((v) => v.id !== deleting.id))
    setServiceRecords((prev) => prev.filter((s) => s.vehicleReg !== deleting.registration))
    setDeleting(null)
    toast.success('Vehicle removed from fleet')
  }

  const handleAssignDriver = () => {
    if (!assigning || !assignDriver.trim()) { toast.error('Driver name is required'); return }
    setVehicles((prev) => prev.map((v) => v.id === assigning.id ? { ...v, driver: assignDriver, status: 'ACTIVE' as const } : v))
    setAssigning(null)
    setAssignDriver('')
    toast.success(`Driver assigned to ${assigning.registration}`)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <SectionTitle title="Fleet Management" desc="Vehicle fleet tracking & maintenance" />
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}><CardContent className="p-4"><Skeleton className="h-20 w-full" /></CardContent></Card>
          ))
        }
        </div>
        <Card><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <SectionTitle
        title="Fleet Management"
        desc="Vehicle fleet tracking & maintenance"
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => {
              toast.info('Fleet management is available in the enterprise plan. Contact your account manager.')
            }}>
              <ClipboardList className="mr-2 h-4 w-4" /> Schedule Service
            </Button>
            <Button className="bg-[var(--navy)] text-white hover:bg-[var(--navy-light)]" onClick={openCreate}>
              <Plus className="mr-2 h-4 w-4" /> Add Vehicle
            </Button>
          </div>
        }
      />

      {/* Platform Notice */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--navy)]/10">
              <Settings className="h-5 w-5 text-[var(--navy)] dark:text-[var(--gold-light)]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--navy)] dark:text-white">Configuration available via platform settings</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Fleet management, vehicle tracking, and maintenance scheduling are managed through the enterprise SaaS platform.
                Contact your account manager to enable full fleet management capabilities.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fleet Status Summary Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Total Fleet</p>
                <p className="mt-1 text-2xl font-bold text-[var(--navy)] dark:text-white">{stats.total}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--navy)]/10">
                <Truck className="h-5 w-5 text-[var(--navy)] dark:text-[var(--gold-light)]" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Active</p>
                <p className="mt-1 text-2xl font-bold text-emerald-600">{stats.active}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Maintenance</p>
                <p className="mt-1 text-2xl font-bold text-amber-600">{stats.maintenance}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                <Wrench className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Inactive</p>
                <p className="mt-1 text-2xl font-bold text-gray-500">{stats.inactive}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-500/10">
                <XCircle className="h-5 w-5 text-gray-500" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-2 sm:col-span-1">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Overdue Service</p>
                <p className="mt-1 text-2xl font-bold text-red-600">{stats.overdueServices}</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vehicle Fleet Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Car className="h-4 w-4 text-[var(--gold)]" /> Vehicle Fleet
          </CardTitle>
        </CardHeader>
        <CardContent>
          {vehicles.length === 0 ? (
            <EmptyState
              icon={Truck}
              title="No vehicles registered"
              desc="Add a vehicle to start tracking your fleet. Vehicle registration, driver assignment, and maintenance scheduling will be available here."
            />
          ) : (
            <>
              <div className="mb-4 flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Search by registration, make, model, or driver..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Status</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="IN_TRANSIT">In Transit</SelectItem>
                    <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Types</SelectItem>
                    {VEHICLE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Registration</TableHead>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Driver</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Fuel</TableHead>
                      <TableHead>Mileage</TableHead>
                      <TableHead>Next Service</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVehicles.map((v) => (
                      <TableRow key={v.id}>
                        <TableCell>
                          <div className="font-mono text-sm font-medium">{v.registration}</div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <span className="font-medium">{v.make} {v.model}</span>
                            <p className="text-xs text-muted-foreground">{v.type} · {v.year}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {v.driver ? (
                            <div className="flex items-center gap-1.5">
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--navy)]/10">
                                <Users className="h-3 w-3 text-[var(--navy)] dark:text-[var(--gold-light)]" />
                              </div>
                              <span className="text-sm">{v.driver}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">Unassigned</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge className={vehicleStatusColor(v.status)}>
                            {v.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                            <span className="max-w-[140px] truncate">{v.location}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{v.fuelType}</TableCell>
                        <TableCell className="text-sm font-mono">{v.mileage.toLocaleString()} km</TableCell>
                        <TableCell>
                          <span className={`text-sm ${isOverdue(v.nextService) && v.status !== 'MAINTENANCE' ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                            {formatDate(v.nextService)}
                            {isOverdue(v.nextService) && v.status !== 'MAINTENANCE' && <AlertTriangle className="inline ml-1 h-3 w-3" />}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {!v.driver && (
                              <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-sky-600 hover:text-sky-700" onClick={() => { setAssigning(v); setAssignDriver('') }} aria-label="Assign driver" title="Assign driver">
                                <UserCheck className="h-3.5 w-3.5" />
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => openEdit(v)} aria-label="Edit">
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-600 hover:text-red-700" onClick={() => setDeleting(v)} aria-label="Delete">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {filteredVehicles.length === 0 && (
                      <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">No vehicles match your filters</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Service / Maintenance Scheduling */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Wrench className="h-4 w-4 text-[var(--gold)]" /> Service & Maintenance
          </CardTitle>
        </CardHeader>
        <CardContent>
          {serviceRecords.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="No service records"
              desc="Service and maintenance records will appear here once vehicles are registered and services are scheduled."
            />
          ) : (
            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Scheduled Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {serviceRecords.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-mono text-sm font-medium">{s.vehicleReg}</TableCell>
                      <TableCell><Badge variant="outline">{s.type}</Badge></TableCell>
                      <TableCell className="text-sm max-w-[200px] truncate">{s.description}</TableCell>
                      <TableCell className="text-sm">{formatDate(s.scheduledDate)}</TableCell>
                      <TableCell><Badge className={serviceStatusColor(s.status)}>{s.status.replace('_', ' ')}</Badge></TableCell>
                      <TableCell className="text-sm">{s.vendor}</TableCell>
                      <TableCell className="text-right text-sm font-medium">₹{s.cost.toLocaleString('en-IN')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Vehicle Dialog */}
      <Dialog open={creating || !!editing} onOpenChange={(o) => { if (!o) { setCreating(false); setEditing(null) } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" /> {editing ? 'Edit Vehicle' : 'Add Vehicle'}
            </DialogTitle>
            <DialogDescription>{editing ? 'Update vehicle details' : 'Add a new vehicle to the fleet'}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Registration Number *</Label>
              <Input value={form.registration} onChange={(e) => set('registration', e.target.value)} placeholder="e.g. KA-01-MX-1234" />
            </div>
            <div className="space-y-1.5">
              <Label>Vehicle Type *</Label>
              <Select value={form.type} onValueChange={(v) => set('type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{VEHICLE_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Make *</Label>
              <Input value={form.make} onChange={(e) => set('make', e.target.value)} placeholder="e.g. Toyota" />
            </div>
            <div className="space-y-1.5">
              <Label>Model</Label>
              <Input value={form.model} onChange={(e) => set('model', e.target.value)} placeholder="e.g. Fortuner" />
            </div>
            <div className="space-y-1.5">
              <Label>Year</Label>
              <Input type="number" value={form.year} onChange={(e) => set('year', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Fuel Type</Label>
              <Select value={form.fuelType} onValueChange={(v) => set('fuelType', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{FUEL_TYPES.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Mileage (km)</Label>
              <Input type="number" value={form.mileage} onChange={(e) => set('mileage', e.target.value)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Location</Label>
              <Input value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="e.g. Bangalore Office" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreating(false); setEditing(null) }}>Cancel</Button>
            <Button className="bg-[var(--navy)] text-white hover:bg-[var(--navy-light)]" onClick={handleSave}>
              {editing ? 'Update' : 'Add Vehicle'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Driver Dialog */}
      <Dialog open={!!assigning} onOpenChange={(o) => !o && setAssigning(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" /> Assign Driver
            </DialogTitle>
            <DialogDescription>
              Assign a driver to <strong>{assigning?.registration}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Driver *</Label>
              <Input
                value={assignDriver}
                onChange={(e) => setAssignDriver(e.target.value)}
                placeholder="Enter driver name"
              />
            </div>
            {assigning && (
              <div className="rounded-lg border bg-muted/50 p-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-muted-foreground">Vehicle:</span> <span className="font-medium">{assigning.make} {assigning.model}</span></div>
                  <div><span className="text-muted-foreground">Type:</span> <span className="font-medium">{assigning.type}</span></div>
                  <div><span className="text-muted-foreground">Fuel:</span> <span className="font-medium">{assigning.fuelType}</span></div>
                  <div><span className="text-muted-foreground">Location:</span> <span className="font-medium">{assigning.location}</span></div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssigning(null)}>Cancel</Button>
            <Button className="bg-[var(--navy)] text-white hover:bg-[var(--navy-light)]" onClick={handleAssignDriver}>
              <UserCheck className="mr-2 h-4 w-4" /> Assign Driver
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Vehicle Dialog */}
      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-700">Remove Vehicle?</AlertDialogTitle>
            <AlertDialogDescription>
              Permanently remove <strong>{deleting?.make} {deleting?.model}</strong> ({deleting?.registration}) from the fleet? All associated service records will also be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleDelete}>
              <Trash2 className="mr-1 h-4 w-4" /> Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
