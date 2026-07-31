// HP Enterprise HRMS — Brand constants & domain types

export const BRAND = {
  name: 'HP Enterprise',
  legalName: 'HP Enterprise Pvt. Ltd.',
  tagline: 'Safety Management & Project Support Services',
  taglineFull: 'EHS Consultancy • Manpower • Land Survey • Vendor Coordination',
  subTagline: 'Project Support From Planning To Handover',
  navy: '#002B5C',
  navyDeep: '#001A3D',
  navyLight: '#0A4488',
  gold: '#D4AF37',
  goldLight: '#E8C96A',
  silver: '#C0C0C0',
  accent: '#0A4488',
  address: 'Plot 14, Tech Park Phase II, Whitefield, Bengaluru, Karnataka 560066',
  phone: '+91 80 4567 8900',
  email: 'hr@hpenterprise.co.in',
  website: 'www.hpenterprise.co.in',
  gst: '29AAGCH4521K1ZP',
  cin: 'U72900KA2015PTC112233',
  logoPath: '/hp-logo.jpg',
}

export const NAVY = BRAND.navy
export const GOLD = BRAND.gold
export const SILVER = BRAND.silver

// Employee code generation: HPE-XXXX
export function formatEmployeeCode(n: number): string {
  return `HPE-${String(n).padStart(4, '0')}`
}

export const ENGINEERING_DISCIPLINES = [
  'EHS', 'Safety', 'Civil', 'Structural', 'Interior Fit-Out', 'Finishing',
  'Mechanical', 'MEP', 'Electrical', 'HVAC', 'Plumbing', 'Fire Fighting',
  'Fire Alarm (FAPA)', 'ELV', 'BMS', 'QA/QC', 'Planning', 'Billing',
  'Quantity Surveying', 'Commissioning', 'Maintenance', 'Industrial', 'Other',
]

export const PROJECT_TYPES = [
  'Commercial', 'Residential', 'Industrial', 'Hospital', 'Hotel', 'Airport',
  'Mall', 'Warehouse', 'Factory', 'Metro', 'Data Center', 'Oil & Gas',
  'Power Plant', 'Infrastructure', 'Government Projects',
]

export const TECHNICAL_SKILLS = [
  'RCC', 'Basement', 'Steel Structure', 'HVAC', 'Electrical', 'Plumbing',
  'Fire Fighting', 'Fire Alarm', 'ELV', 'BMS', 'Testing & Commissioning',
  'AutoCAD', 'Revit', 'Primavera', 'Excel', 'MS Project', 'Other',
]

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
export const GENDERS = ['Male', 'Female', 'Other']

export const LEAVE_TYPES = [
  { code: 'CL', label: 'Casual Leave' },
  { code: 'SL', label: 'Sick Leave' },
  { code: 'EL', label: 'Earned Leave' },
  { code: 'PL', label: 'Privilege Leave' },
  { code: 'LOP', label: 'Loss of Pay' },
  { code: 'WFH', label: 'Work From Home' },
]

export const DOCUMENT_TYPES = [
  'offer_letter', 'appointment_letter', 'joining_letter', 'employment_agreement',
  'nda', 'id_card', 'salary_slip', 'attendance_sheet', 'warning_letter',
  'promotion_letter', 'transfer_letter', 'confirmation_letter',
  'experience_letter', 'relieving_letter', 'no_due_certificate', 'full_final_settlement',
]

export const DEPARTMENTS = [
  'Engineering', 'Projects', 'MEP', 'QA/QC', 'Planning', 'Billing',
  'Procurement', 'HR & Admin', 'Finance', 'Safety', 'Operations',
]

export type Role = 'OWNER' | 'SUPER_ADMIN' | 'HR_MANAGER' | 'EMPLOYEE'

export const ROLE_LABELS: Record<string, string> = {
  OWNER: 'Owner',
  SUPER_ADMIN: 'Admin',
  HR_MANAGER: 'HR Manager',
  EMPLOYEE: 'Employee',
}

// Role hierarchy: OWNER > SUPER_ADMIN > HR_MANAGER > EMPLOYEE
export const ROLE_RANK: Record<string, number> = {
  OWNER: 4,
  SUPER_ADMIN: 3,
  HR_MANAGER: 2,
  EMPLOYEE: 1,
}

export function canManageRole(myRole: string, targetRole: string): boolean {
  return (ROLE_RANK[myRole] || 0) > (ROLE_RANK[targetRole] || 0)
}
