// HP ENTERPRISE — Brand constants & domain types

export const BRAND = {
  name: 'HP ENTERPRISE',
  legalName: 'HP ENTERPRISE Safety Service & Man Power Supply',
  tagline: 'Safety Service & Man Power Supply',
  taglineFull: 'Safety Services \u2022 Manpower Supply \u2022 EHS Consultancy \u2022 Project Support',
  subTagline: 'Comprehensive Workforce Solutions For Every Project',
  navy: '#002B5C',
  navyDeep: '#001A3D',
  navyLight: '#0A4488',
  gold: '#D4AF37',
  goldLight: '#E8C96A',
  silver: '#C0C0C0',
  accent: '#0A4488',
  address: 'Bengaluru, Karnataka, India',
  phone: '+91 80737 48271',
  email: 'hpenterpriseofficial11@gmail.com',
  website: 'https://hpserve.site',
  gst: '29AAGCH4521K1ZP',
  cin: 'U72900KA2015PTC112233',
  logoPath: '/hp-logo.jpg',
  managingDirector: 'Hariprasad N P',
  ehsDirector: 'Rajesh S',
  mdPhone: '+91 80737 48271',
  ehsPhone: '+91 73377 92436',
}

export const SOCIAL = {
  website: 'https://hpserve.site',
  aiPreview: 'https://hphrms.netlify.app/app',
  email: 'hpenterpriseofficial11@gmail.com',
  whatsapp: 'https://wa.me/message/65PDYODAFJZAN1',
  instagram: 'https://www.instagram.com/hpenterpirse',
  threads: 'https://www.threads.com/@hpenterpriseofficial',
  linkedin: 'https://www.linkedin.com/in/hariprasad-np-4408a8423',
  facebook: 'https://www.facebook.com/share/1DNBdqGcvb/',
  twitter: 'https://x.com/hpenterpri5nww',
  youtube: 'https://www.youtube.com/@HPEnterpriseIndia',
  reddit: 'https://www.reddit.com/u/HPEnterpriseIndia/',
  recruitment: 'https://docs.google.com/forms/d/e/1FAIpQLSfxMyayr18xiVYf8L9MlZjxrRHfGpvzC7KAubf3fGUuUSNWtQ/viewform?usp=header',
} as const

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
  'nda', 'id_card', 'warning_letter',
  'promotion_letter', 'transfer_letter', 'confirmation_letter',
  'experience_letter', 'relieving_letter', 'no_due_certificate', 'full_final_settlement',
  'salary_slip',
]

export const DEPARTMENTS = [
  'Engineering', 'Projects', 'MEP', 'QA/QC', 'Planning', 'Billing',
  'Procurement', 'HR & Admin', 'Finance', 'Safety', 'Operations',
]

export type Role = 'OWNER' | 'SUPER_ADMIN' | 'HR_MANAGER' | 'EMPLOYEE' | 'CLIENT'

export const ROLE_LABELS: Record<string, string> = {
  OWNER: 'Owner',
  SUPER_ADMIN: 'Admin',
  HR_MANAGER: 'HR Manager',
  EMPLOYEE: 'Employee',
  CLIENT: 'Client',
}

// Role hierarchy: OWNER > SUPER_ADMIN > HR_MANAGER > EMPLOYEE
export const ROLE_RANK: Record<string, number> = {
  OWNER: 5,
  SUPER_ADMIN: 4,
  HR_MANAGER: 3,
  EMPLOYEE: 2,
  CLIENT: 1,
}

export function canManageRole(myRole: string, targetRole: string): boolean {
  return (ROLE_RANK[myRole] || 0) > (ROLE_RANK[targetRole] || 0)
}
