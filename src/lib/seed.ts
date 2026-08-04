// Seed script — run with: npx tsx src/lib/seed.ts
// Dual-mode: Creates accounts, admin users, sample employees, site assignments
import { db } from './db'
import { hashPassword } from './auth'

export async function main() {
  console.log('🔄 Seeding HP ENTERPRISE HPHRMS (Dual-Mode)...')
  const today = new Date()

  // ============================================================
  // 1. SETTINGS (global)
  // ============================================================
  console.log('\n📝 Seeding settings...')
  const defaults: Record<string, string> = {
    'payroll.pfRate': '12',
    'payroll.pfEmployerRate': '12',
    'payroll.esiRate': '0.75',
    'payroll.esiEmployerRate': '3.25',
    'payroll.professionalTax': '200',
    'payroll.standardWorkingDays': '30',
    'payroll.workStartTime': '09:30',
    'payroll.workEndTime': '18:30',
    'payroll.lateGraceMinutes': '15',
    'payroll.overtimeRate': '1.5',
    'leave.casualAnnual': '12',
    'leave.sickAnnual': '12',
    'leave.earnedAnnual': '15',
    'leave.carryForwardCap': '30',
    'company.adminEmail': 'admin@hpenterprise.com',
  }
  for (const [k, v] of Object.entries(defaults)) {
    await db.setting.upsert({ where: { key: k }, update: {}, create: { key: k, value: v } })
  }
  console.log('  ✅ Settings seeded')

  // ============================================================
  // 2. ACCOUNTS (4 organizations)
  // ============================================================
  console.log('\n🏢 Seeding accounts...')

  const hpAccount = await db.account.upsert({
    where: { id: 'acct_hp_enterprise' },
    update: {},
    create: {
      id: 'acct_hp_enterprise',
      organizationName: 'HP Enterprise',
      accountType: 'hybrid',
      status: 'active',
    },
  })
  console.log(`  ✅ Account: ${hpAccount.organizationName} (${hpAccount.accountType})`)

  const acmeAccount = await db.account.upsert({
    where: { id: 'acct_acme_tech' },
    update: {},
    create: {
      id: 'acct_acme_tech',
      organizationName: 'Acme Technologies Pvt Ltd',
      accountType: 'hrms_saas',
      status: 'active',
    },
  })
  console.log(`  ✅ Account: ${acmeAccount.organizationName} (${acmeAccount.accountType})`)

  const buildAccount = await db.account.upsert({
    where: { id: 'acct_buildright' },
    update: {},
    create: {
      id: 'acct_buildright',
      organizationName: 'BuildRight Construction',
      accountType: 'manpower_supply',
      status: 'active',
    },
  })
  console.log(`  ✅ Account: ${buildAccount.organizationName} (${buildAccount.accountType})`)

  const metroAccount = await db.account.upsert({
    where: { id: 'acct_metro_retail' },
    update: {},
    create: {
      id: 'acct_metro_retail',
      organizationName: 'Metro Retail Chain',
      accountType: 'hybrid',
      status: 'active',
    },
  })
  console.log(`  ✅ Account: ${metroAccount.organizationName} (${metroAccount.accountType})`)

  // ============================================================
  // 3. ADMIN USERS (one per account + legacy admin)
  // ============================================================
  console.log('\n👤 Seeding admin users...')

  // --- HP Enterprise Admin ---
  const hpAdminPass = await hashPassword('HpEnterprise@2026')
  const hpAdmin = await db.user.upsert({
    where: { username: 'hpadmin' },
    update: { passwordHash: hpAdminPass, mustResetPassword: false, accountId: hpAccount.id, clientRole: 'admin' },
    create: {
      username: 'hpadmin',
      email: 'admin@hpenterprise.com',
      passwordHash: hpAdminPass,
      role: 'OWNER',
      clientRole: 'admin',
      accountId: hpAccount.id,
      mustResetPassword: false,
    },
  })
  // Link Employee record for HP admin
  let hpAdminEmp = await db.employee.findFirst({ where: { email: 'admin@hpenterprise.com' } })
  if (!hpAdminEmp) {
    hpAdminEmp = await db.employee.create({
      data: {
        status: 'APPROVED',
        fullName: 'HP Enterprise Admin',
        email: 'admin@hpenterprise.com',
        employeeType: 'internal',
        accountId: hpAccount.id,
        userId: hpAdmin.id,
        designation: 'System Administrator',
        department: 'Administration',
        employeeCode: 'HPE-ADMIN',
        joinDate: new Date('2024-01-01'),
        employmentType: 'Full-time',
      },
    })
  } else {
    await db.employee.update({ where: { id: hpAdminEmp.id }, data: { userId: hpAdmin.id, accountId: hpAccount.id, employeeType: 'internal' } })
  }
  console.log(`  ✅ HP Admin: ${hpAdmin.username} / HpEnterprise@2026`)

  // --- Legacy Admin (for backward compatibility) ---
  const legacyAdminPass = await hashPassword('Admin@123')
  const legacyAdmin = await db.user.upsert({
    where: { username: 'admin' },
    update: { passwordHash: legacyAdminPass, mustResetPassword: false, accountId: hpAccount.id, clientRole: 'admin' },
    create: {
      username: 'admin',
      email: 'admin@hphrms.com',
      passwordHash: legacyAdminPass,
      role: 'OWNER',
      clientRole: 'admin',
      accountId: hpAccount.id,
      mustResetPassword: false,
    },
  })
  let legacyAdminEmp = await db.employee.findFirst({ where: { email: 'admin@hphrms.com' } })
  if (!legacyAdminEmp) {
    legacyAdminEmp = await db.employee.create({
      data: {
        status: 'APPROVED',
        fullName: 'Legacy Admin',
        email: 'admin@hphrms.com',
        employeeType: 'internal',
        accountId: hpAccount.id,
        userId: legacyAdmin.id,
        designation: 'System Administrator',
        department: 'Administration',
        employeeCode: 'HPE-LADMIN',
        joinDate: new Date('2024-01-01'),
        employmentType: 'Full-time',
      },
    })
  } else {
    await db.employee.update({ where: { id: legacyAdminEmp.id }, data: { userId: legacyAdmin.id, accountId: hpAccount.id, employeeType: 'internal' } })
  }
  console.log(`  ✅ Legacy Admin: ${legacyAdmin.username} / Admin@123`)

  // --- Client A Admin (Acme Technologies) ---
  const acmeAdminPass = await hashPassword('AcmeTech@2026')
  const acmeAdmin = await db.user.upsert({
    where: { username: 'acmeadmin' },
    update: { passwordHash: acmeAdminPass, mustResetPassword: false, accountId: acmeAccount.id, clientRole: 'admin' },
    create: {
      username: 'acmeadmin',
      email: 'admin@acmetech.com',
      passwordHash: acmeAdminPass,
      role: 'SUPER_ADMIN',
      clientRole: 'admin',
      accountId: acmeAccount.id,
      mustResetPassword: false,
    },
  })
  let acmeAdminEmp = await db.employee.findFirst({ where: { email: 'admin@acmetech.com' } })
  if (!acmeAdminEmp) {
    acmeAdminEmp = await db.employee.create({
      data: {
        status: 'APPROVED',
        fullName: 'Acme Technologies Admin',
        email: 'admin@acmetech.com',
        employeeType: 'internal',
        accountId: acmeAccount.id,
        userId: acmeAdmin.id,
        designation: 'HR Head',
        department: 'Human Resources',
        employeeCode: 'ACT-ADMIN',
        joinDate: new Date('2024-03-01'),
        employmentType: 'Full-time',
      },
    })
  } else {
    await db.employee.update({ where: { id: acmeAdminEmp.id }, data: { userId: acmeAdmin.id, accountId: acmeAccount.id, employeeType: 'internal' } })
  }
  console.log(`  ✅ Acme Admin: ${acmeAdmin.username} / AcmeTech@2026`)

  // --- Client B Admin (BuildRight Construction) ---
  const buildAdminPass = await hashPassword('BuildRight@2026')
  const buildAdmin = await db.user.upsert({
    where: { username: 'buildadmin' },
    update: { passwordHash: buildAdminPass, mustResetPassword: false, accountId: buildAccount.id, clientRole: 'admin' },
    create: {
      username: 'buildadmin',
      email: 'admin@buildright.com',
      passwordHash: buildAdminPass,
      role: 'SUPER_ADMIN',
      clientRole: 'admin',
      accountId: buildAccount.id,
      mustResetPassword: false,
    },
  })
  let buildAdminEmp = await db.employee.findFirst({ where: { email: 'admin@buildright.com' } })
  if (!buildAdminEmp) {
    buildAdminEmp = await db.employee.create({
      data: {
        status: 'APPROVED',
        fullName: 'BuildRight Construction Admin',
        email: 'admin@buildright.com',
        employeeType: 'internal',
        accountId: buildAccount.id,
        userId: buildAdmin.id,
        designation: 'Operations Manager',
        department: 'Operations',
        employeeCode: 'BRC-ADMIN',
        joinDate: new Date('2024-02-15'),
        employmentType: 'Full-time',
      },
    })
  } else {
    await db.employee.update({ where: { id: buildAdminEmp.id }, data: { userId: buildAdmin.id, accountId: buildAccount.id, employeeType: 'internal' } })
  }
  console.log(`  ✅ BuildRight Admin: ${buildAdmin.username} / BuildRight@2026`)

  // --- Client C Admin (Metro Retail Chain) ---
  const metroAdminPass = await hashPassword('MetroRetail@2026')
  const metroAdmin = await db.user.upsert({
    where: { username: 'metroadmin' },
    update: { passwordHash: metroAdminPass, mustResetPassword: false, accountId: metroAccount.id, clientRole: 'admin' },
    create: {
      username: 'metroadmin',
      email: 'admin@metroretail.com',
      passwordHash: metroAdminPass,
      role: 'SUPER_ADMIN',
      clientRole: 'admin',
      accountId: metroAccount.id,
      mustResetPassword: false,
    },
  })
  let metroAdminEmp = await db.employee.findFirst({ where: { email: 'admin@metroretail.com' } })
  if (!metroAdminEmp) {
    metroAdminEmp = await db.employee.create({
      data: {
        status: 'APPROVED',
        fullName: 'Metro Retail Chain Admin',
        email: 'admin@metroretail.com',
        employeeType: 'internal',
        accountId: metroAccount.id,
        userId: metroAdmin.id,
        designation: 'Regional Manager',
        department: 'Management',
        employeeCode: 'MRC-ADMIN',
        joinDate: new Date('2024-04-01'),
        employmentType: 'Full-time',
      },
    })
  } else {
    await db.employee.update({ where: { id: metroAdminEmp.id }, data: { userId: metroAdmin.id, accountId: metroAccount.id, employeeType: 'internal' } })
  }
  console.log(`  ✅ Metro Admin: ${metroAdmin.username} / MetroRetail@2026`)

  // ============================================================
  // 4. SAMPLE EMPLOYEES — Client A (Acme Technologies — HRMS SaaS)
  // ============================================================
  console.log('\n👥 Seeding Client A employees (Acme Technologies — HRMS SaaS)...')

  // Rajesh Sharma — Senior Developer
  let rajesh = await db.employee.findFirst({ where: { email: 'rajesh.sharma@acmetech.com' } })
  if (!rajesh) {
    rajesh = await db.employee.create({
      data: {
        status: 'APPROVED',
        fullName: 'Rajesh Sharma',
        fatherName: 'Kishan Sharma',
        dob: new Date('1990-05-15'),
        gender: 'Male',
        mobile: '+91 98765 43211',
        email: 'rajesh.sharma@acmetech.com',
        address: '12, Koramangala 4th Block, Bengaluru, Karnataka 560034',
        aadhaar: 'XXXX-XXXX-9001',
        pan: 'ABCDS1234R',
        employeeType: 'internal',
        accountId: acmeAccount.id,
        designation: 'Senior Developer',
        department: 'Engineering',
        employeeCode: 'ACT-001',
        joinDate: new Date('2024-04-10'),
        employmentType: 'Full-time',
        salary: 85000,
        basic: 42500,
        hra: 17000,
        allowances: 8500,
        specialAllowance: 17000,
        reviewedBy: acmeAdmin.id,
        reviewedAt: new Date('2024-04-10'),
      },
    })
  }
  await db.leaveBalance.upsert({ where: { employeeId: rajesh.id }, update: {}, create: { employeeId: rajesh.id, casual: 12, sick: 12, earned: 15 } })
  console.log('  ✅ Rajesh Sharma — Senior Developer, Engineering')

  // Priya Patel — HR Executive
  let priyaPatel = await db.employee.findFirst({ where: { email: 'priya.patel@acmetech.com' } })
  if (!priyaPatel) {
    priyaPatel = await db.employee.create({
      data: {
        status: 'APPROVED',
        fullName: 'Priya Patel',
        fatherName: 'Dinesh Patel',
        dob: new Date('1993-11-20'),
        gender: 'Female',
        mobile: '+91 87654 32110',
        email: 'priya.patel@acmetech.com',
        address: '45, HSR Layout Sector 2, Bengaluru, Karnataka 560102',
        aadhaar: 'XXXX-XXXX-9002',
        pan: 'FGHDP5678P',
        employeeType: 'internal',
        accountId: acmeAccount.id,
        designation: 'HR Executive',
        department: 'HR',
        employeeCode: 'ACT-002',
        joinDate: new Date('2024-05-01'),
        employmentType: 'Full-time',
        salary: 55000,
        basic: 27500,
        hra: 11000,
        allowances: 5500,
        specialAllowance: 11000,
        reviewedBy: acmeAdmin.id,
        reviewedAt: new Date('2024-05-01'),
      },
    })
  }
  await db.leaveBalance.upsert({ where: { employeeId: priyaPatel.id }, update: {}, create: { employeeId: priyaPatel.id, casual: 12, sick: 12, earned: 15 } })
  console.log('  ✅ Priya Patel — HR Executive, HR')

  // Amit Kumar — Sales Manager
  let amitKumar = await db.employee.findFirst({ where: { email: 'amit.kumar@acmetech.com' } })
  if (!amitKumar) {
    amitKumar = await db.employee.create({
      data: {
        status: 'APPROVED',
        fullName: 'Amit Kumar',
        fatherName: 'Suresh Kumar',
        dob: new Date('1988-03-08'),
        gender: 'Male',
        mobile: '+91 76543 21098',
        email: 'amit.kumar@acmetech.com',
        address: '78, Whitefield Main Road, Bengaluru, Karnataka 560066',
        aadhaar: 'XXXX-XXXX-9003',
        pan: 'IJKLA9012K',
        employeeType: 'internal',
        accountId: acmeAccount.id,
        designation: 'Sales Manager',
        department: 'Sales',
        employeeCode: 'ACT-003',
        joinDate: new Date('2024-03-15'),
        employmentType: 'Full-time',
        salary: 75000,
        basic: 37500,
        hra: 15000,
        allowances: 7500,
        specialAllowance: 15000,
        reviewedBy: acmeAdmin.id,
        reviewedAt: new Date('2024-03-15'),
      },
    })
  }
  await db.leaveBalance.upsert({ where: { employeeId: amitKumar.id }, update: {}, create: { employeeId: amitKumar.id, casual: 12, sick: 12, earned: 15 } })
  console.log('  ✅ Amit Kumar — Sales Manager, Sales')

  // ============================================================
  // 5. SAMPLE EMPLOYEES — Client B (BuildRight Construction — Manpower Supply)
  // ============================================================
  console.log('\n👷 Seeding Client B employees (BuildRight Construction — Manpower Supply)...')

  // Suresh Yadav — Site Supervisor (deployed)
  let suresh = await db.employee.findFirst({ where: { email: 'suresh.yadav@buildright.com' } })
  if (!suresh) {
    suresh = await db.employee.create({
      data: {
        status: 'APPROVED',
        fullName: 'Suresh Yadav',
        fatherName: 'Ramu Yadav',
        dob: new Date('1985-09-10'),
        gender: 'Male',
        mobile: '+91 99876 54321',
        email: 'suresh.yadav@buildright.com',
        address: 'Village Rampur, Dist. Pune, Maharashtra 411001',
        aadhaar: 'XXXX-XXXX-9004',
        pan: 'MNOPS3456S',
        employeeType: 'hp_deployed',
        accountId: buildAccount.id,
        designation: 'Site Supervisor',
        department: 'Site Operations',
        employeeCode: 'BRC-001',
        joinDate: new Date('2024-06-01'),
        employmentType: 'Contract',
        salary: 25000,
        basic: 12500,
        hra: 5000,
        allowances: 2500,
        specialAllowance: 5000,
        reviewedBy: buildAdmin.id,
        reviewedAt: new Date('2024-06-01'),
      },
    })
  }
  console.log('  ✅ Suresh Yadav — Site Supervisor (hp_deployed)')

  // Ramesh Gowda — Electrician (deployed)
  let ramesh = await db.employee.findFirst({ where: { email: 'ramesh.gowda@buildright.com' } })
  if (!ramesh) {
    ramesh = await db.employee.create({
      data: {
        status: 'APPROVED',
        fullName: 'Ramesh Gowda',
        fatherName: 'Girish Gowda',
        dob: new Date('1991-12-25'),
        gender: 'Male',
        mobile: '+91 98765 11223',
        email: 'ramesh.gowda@buildright.com',
        address: '22, KR Puram, Bengaluru, Karnataka 560036',
        aadhaar: 'XXXX-XXXX-9005',
        pan: 'QRSTU7890R',
        employeeType: 'hp_deployed',
        accountId: buildAccount.id,
        designation: 'Electrician',
        department: 'Site Operations',
        employeeCode: 'BRC-002',
        joinDate: new Date('2024-06-15'),
        employmentType: 'Contract',
        salary: 18000,
        basic: 9000,
        hra: 3600,
        allowances: 1800,
        specialAllowance: 3600,
        reviewedBy: buildAdmin.id,
        reviewedAt: new Date('2024-06-15'),
      },
    })
  }
  console.log('  ✅ Ramesh Gowda — Electrician (hp_deployed)')

  // ============================================================
  // 6. SAMPLE EMPLOYEES — Client C (Metro Retail Chain — Hybrid)
  // ============================================================
  console.log('\n🏪 Seeding Client C employees (Metro Retail Chain — Hybrid)...')

  // --- Internal employees ---
  // Vikram Singh — Manager
  let vikram = await db.employee.findFirst({ where: { email: 'vikram.singh@metroretail.com' } })
  if (!vikram) {
    vikram = await db.employee.create({
      data: {
        status: 'APPROVED',
        fullName: 'Vikram Singh',
        fatherName: 'Harjeet Singh',
        dob: new Date('1987-07-14'),
        gender: 'Male',
        mobile: '+91 98123 45678',
        email: 'vikram.singh@metroretail.com',
        address: '56, MG Road, Connaught Place, New Delhi 110001',
        aadhaar: 'XXXX-XXXX-9006',
        pan: 'VWXYZ1234V',
        employeeType: 'internal',
        accountId: metroAccount.id,
        designation: 'Store Manager',
        department: 'Operations',
        employeeCode: 'MRC-001',
        joinDate: new Date('2024-01-10'),
        employmentType: 'Full-time',
        salary: 65000,
        basic: 32500,
        hra: 13000,
        allowances: 6500,
        specialAllowance: 13000,
        reviewedBy: metroAdmin.id,
        reviewedAt: new Date('2024-01-10'),
      },
    })
  }
  await db.leaveBalance.upsert({ where: { employeeId: vikram.id }, update: {}, create: { employeeId: vikram.id, casual: 12, sick: 12, earned: 15 } })
  console.log('  ✅ Vikram Singh — Store Manager (internal)')

  // Deepa Nair — Accountant
  let deepa = await db.employee.findFirst({ where: { email: 'deepa.nair@metroretail.com' } })
  if (!deepa) {
    deepa = await db.employee.create({
      data: {
        status: 'APPROVED',
        fullName: 'Deepa Nair',
        fatherName: 'Gopalakrishnan Nair',
        dob: new Date('1992-01-30'),
        gender: 'Female',
        mobile: '+91 98987 65432',
        email: 'deepa.nair@metroretail.com',
        address: '34, Janakpuri District Center, New Delhi 110058',
        aadhaar: 'XXXX-XXXX-9007',
        pan: 'DEEPN5678D',
        employeeType: 'internal',
        accountId: metroAccount.id,
        designation: 'Accountant',
        department: 'Finance',
        employeeCode: 'MRC-002',
        joinDate: new Date('2024-02-01'),
        employmentType: 'Full-time',
        salary: 45000,
        basic: 22500,
        hra: 9000,
        allowances: 4500,
        specialAllowance: 9000,
        reviewedBy: metroAdmin.id,
        reviewedAt: new Date('2024-02-01'),
      },
    })
  }
  await db.leaveBalance.upsert({ where: { employeeId: deepa.id }, update: {}, create: { employeeId: deepa.id, casual: 12, sick: 12, earned: 15 } })
  console.log('  ✅ Deepa Nair — Accountant (internal)')

  // Rahul Desai — Engineer
  let rahul = await db.employee.findFirst({ where: { email: 'rahul.desai@metroretail.com' } })
  if (!rahul) {
    rahul = await db.employee.create({
      data: {
        status: 'APPROVED',
        fullName: 'Rahul Desai',
        fatherName: 'Mohan Desai',
        dob: new Date('1994-06-18'),
        gender: 'Male',
        mobile: '+91 97654 32109',
        email: 'rahul.desai@metroretail.com',
        address: '89, Andheri West, Mumbai, Maharashtra 400058',
        aadhaar: 'XXXX-XXXX-9008',
        pan: 'RAHLD9012R',
        employeeType: 'internal',
        accountId: metroAccount.id,
        designation: 'Maintenance Engineer',
        department: 'Facilities',
        employeeCode: 'MRC-003',
        joinDate: new Date('2024-03-15'),
        employmentType: 'Full-time',
        salary: 55000,
        basic: 27500,
        hra: 11000,
        allowances: 5500,
        specialAllowance: 11000,
        reviewedBy: metroAdmin.id,
        reviewedAt: new Date('2024-03-15'),
      },
    })
  }
  await db.leaveBalance.upsert({ where: { employeeId: rahul.id }, update: {}, create: { employeeId: rahul.id, casual: 12, sick: 12, earned: 15 } })
  console.log('  ✅ Rahul Desai — Maintenance Engineer (internal)')

  // --- Deployed employees ---
  // Mohan Das — Welder
  let mohan = await db.employee.findFirst({ where: { email: 'mohan.das@metroretail.com' } })
  if (!mohan) {
    mohan = await db.employee.create({
      data: {
        status: 'APPROVED',
        fullName: 'Mohan Das',
        fatherName: 'Bhola Das',
        dob: new Date('1986-04-05'),
        gender: 'Male',
        mobile: '+91 91234 56789',
        email: 'mohan.das@metroretail.com',
        address: 'Village Sundarpur, Dist. Hooghly, West Bengal 712101',
        aadhaar: 'XXXX-XXXX-9009',
        pan: 'MOHND3456M',
        employeeType: 'hp_deployed',
        accountId: metroAccount.id,
        designation: 'Welder',
        department: 'Site Operations',
        employeeCode: 'MRC-004',
        joinDate: new Date('2024-07-01'),
        employmentType: 'Contract',
        salary: 20000,
        basic: 10000,
        hra: 4000,
        allowances: 2000,
        specialAllowance: 4000,
        reviewedBy: metroAdmin.id,
        reviewedAt: new Date('2024-07-01'),
      },
    })
  }
  console.log('  ✅ Mohan Das — Welder (hp_deployed)')

  // Kiran Reddy — Plumber
  let kiran = await db.employee.findFirst({ where: { email: 'kiran.reddy@metroretail.com' } })
  if (!kiran) {
    kiran = await db.employee.create({
      data: {
        status: 'APPROVED',
        fullName: 'Kiran Reddy',
        fatherName: 'Venkat Reddy',
        dob: new Date('1990-10-12'),
        gender: 'Male',
        mobile: '+91 92345 67890',
        email: 'kiran.reddy@metroretail.com',
        address: '15, Kukatpally, Hyderabad, Telangana 500085',
        aadhaar: 'XXXX-XXXX-9010',
        pan: 'KIRNR5678K',
        employeeType: 'hp_deployed',
        accountId: metroAccount.id,
        designation: 'Plumber',
        department: 'Site Operations',
        employeeCode: 'MRC-005',
        joinDate: new Date('2024-07-10'),
        employmentType: 'Contract',
        salary: 18000,
        basic: 9000,
        hra: 3600,
        allowances: 1800,
        specialAllowance: 3600,
        reviewedBy: metroAdmin.id,
        reviewedAt: new Date('2024-07-10'),
      },
    })
  }
  console.log('  ✅ Kiran Reddy — Plumber (hp_deployed)')

  // ============================================================
  // 7. SITE ASSIGNMENTS (for deployed employees)
  // ============================================================
  console.log('\n🏗️ Seeding site assignments...')

  // Client B — BuildRight Construction site assignments
  const existingBRC1 = await db.siteAssignment.findFirst({ where: { employeeId: suresh.id, accountId: buildAccount.id } })
  if (!existingBRC1) {
    await db.siteAssignment.create({
      data: {
        accountId: buildAccount.id,
        employeeId: suresh.id,
        siteName: 'Whitefield Township Project',
        location: 'Whitefield, Bengaluru, Karnataka',
        deploymentDate: new Date('2024-06-01'),
        expectedEndDate: new Date('2025-05-31'),
        dailyRate: 1500,
        status: 'active',
        createdByUserId: buildAdmin.id,
      },
    })
    console.log('  ✅ Site: Suresh Yadav → Whitefield Township Project (₹1,500/day)')
  }

  const existingBRC2 = await db.siteAssignment.findFirst({ where: { employeeId: ramesh.id, accountId: buildAccount.id } })
  if (!existingBRC2) {
    await db.siteAssignment.create({
      data: {
        accountId: buildAccount.id,
        employeeId: ramesh.id,
        siteName: 'Electra Towers MEP',
        location: 'Electronic City, Bengaluru, Karnataka',
        deploymentDate: new Date('2024-06-15'),
        expectedEndDate: new Date('2024-12-31'),
        dailyRate: 1100,
        status: 'active',
        createdByUserId: buildAdmin.id,
      },
    })
    console.log('  ✅ Site: Ramesh Gowda → Electra Towers MEP (₹1,100/day)')
  }

  // Client C — Metro Retail Chain site assignments
  const existingMRC1 = await db.siteAssignment.findFirst({ where: { employeeId: mohan.id, accountId: metroAccount.id } })
  if (!existingMRC1) {
    await db.siteAssignment.create({
      data: {
        accountId: metroAccount.id,
        employeeId: mohan.id,
        siteName: 'Metro Mall Noida Expansion',
        location: 'Sector 18, Noida, Uttar Pradesh',
        deploymentDate: new Date('2024-07-01'),
        expectedEndDate: new Date('2025-01-31'),
        dailyRate: 1200,
        status: 'active',
        createdByUserId: metroAdmin.id,
      },
    })
    console.log('  ✅ Site: Mohan Das → Metro Mall Noida Expansion (₹1,200/day)')
  }

  const existingMRC2 = await db.siteAssignment.findFirst({ where: { employeeId: kiran.id, accountId: metroAccount.id } })
  if (!existingMRC2) {
    await db.siteAssignment.create({
      data: {
        accountId: metroAccount.id,
        employeeId: kiran.id,
        siteName: 'Metro Warehouse Hyderabad',
        location: 'Gachibowli, Hyderabad, Telangana',
        deploymentDate: new Date('2024-07-10'),
        expectedEndDate: new Date('2025-02-28'),
        dailyRate: 1000,
        status: 'active',
        createdByUserId: metroAdmin.id,
      },
    })
    console.log('  ✅ Site: Kiran Reddy → Metro Warehouse Hyderabad (₹1,000/day)')
  }

  // ============================================================
  // 8. LEGACY DATA — HP Enterprise employees (Arjun, Priya)
  // ============================================================
  console.log('\n📋 Seeding HP Enterprise legacy employees...')

  const empPass = await hashPassword('Employee@123')

  // Arjun Sharma
  const empEmail = 'arjun.sharma@hpenterprise.co.in'
  let emp = await db.employee.findFirst({ where: { email: empEmail } })
  if (!emp) {
    emp = await db.employee.create({
      data: {
        status: 'APPROVED',
        fullName: 'Arjun Sharma',
        fatherName: 'Ramesh Sharma',
        motherName: 'Sunita Sharma',
        dob: new Date('1992-04-12'),
        gender: 'Male',
        bloodGroup: 'B+',
        mobile: '+91 98765 43210',
        email: empEmail,
        address: '42, MG Road, Indiranagar, Bengaluru, Karnataka 560038',
        emergencyContact: '+91 98000 12345',
        aadhaar: 'XXXX-XXXX-1234',
        pan: 'ABCDE1234F',
        uan: '101234567890',
        esic: '4321567890',
        bankHolder: 'Arjun Sharma',
        bankName: 'HDFC Bank',
        bankBranch: 'Indiranagar',
        bankAccount: '50100123456789',
        bankIfsc: 'HDFC0001234',
        educationJson: JSON.stringify([
          { qualification: 'B.E. Civil', specialization: 'Structural Engineering', college: 'RV College of Engineering', year: '2014' },
          { qualification: 'M.Tech', specialization: 'Construction Management', college: 'IIT Madras', year: '2016' },
        ]),
        currentDesignation: 'Senior Project Engineer',
        totalExperience: '9 Years',
        relevantExperience: '8 Years',
        currentCompany: 'L&T Construction',
        previousCompany: 'Shapoorji Pallonji',
        currentSalary: '850000',
        expectedSalary: '950000',
        noticePeriod: '30 Days',
        disciplines: 'Civil,Structural,QA/QC,Planning',
        projectTypes: 'Commercial,Residential,Industrial',
        skills: 'RCC,Steel Structure,AutoCAD,Primavera,MS Project',
        employeeCode: 'HPE-0001',
        designation: 'Senior Project Engineer',
        department: 'Projects',
        joinDate: new Date('2023-06-01'),
        employmentType: 'Full-time',
        salary: 80000,
        basic: 40000,
        hra: 16000,
        allowances: 8000,
        specialAllowance: 16000,
        employeeType: 'internal',
        accountId: hpAccount.id,
        reviewedBy: hpAdmin.id,
        reviewedAt: new Date(),
      },
    })
  }
  await db.leaveBalance.upsert({ where: { employeeId: emp.id }, update: {}, create: { employeeId: emp.id, casual: 12, sick: 12, earned: 15 } })
  let empUser = await db.user.findUnique({ where: { email: empEmail } })
  if (!empUser) {
    empUser = await db.user.create({
      data: {
        username: 'arjun.sharma',
        email: empEmail,
        passwordHash: empPass,
        role: 'EMPLOYEE',
        accountId: hpAccount.id,
        mustResetPassword: false,
      },
    })
    await db.employee.update({ where: { id: emp.id }, data: { userId: empUser.id } })
  }
  console.log('  ✅ Arjun Sharma — arjun.sharma / Employee@123')

  // Priya Patil
  const priyaEmail = 'priya.patil@hpenterprise.co.in'
  let priya = await db.employee.findFirst({ where: { email: priyaEmail } })
  if (!priya) {
    priya = await db.employee.create({
      data: {
        status: 'APPROVED',
        fullName: 'Priya Patil',
        fatherName: 'Dilip Patil',
        motherName: 'Meena Patil',
        dob: new Date('1995-08-22'),
        gender: 'Female',
        bloodGroup: 'O+',
        mobile: '+91 87654 32109',
        email: priyaEmail,
        address: '15, JP Nagar Phase 7, Bengaluru, Karnataka 560078',
        emergencyContact: '+91 99001 54321',
        aadhaar: 'XXXX-XXXX-5678',
        pan: 'FGHIJ5678K',
        uan: '101987654321',
        esic: '5678901234',
        bankHolder: 'Priya Patil',
        bankName: 'ICICI Bank',
        bankBranch: 'JP Nagar',
        bankAccount: '60100234567890',
        bankIfsc: 'ICIC0002345',
        educationJson: JSON.stringify([
          { qualification: 'B.Com', specialization: 'Accounting & Finance', college: 'Christ University', year: '2017' },
          { qualification: 'MBA HR', specialization: 'Human Resources', college: 'XIME Bangalore', year: '2019' },
        ]),
        currentDesignation: 'HR Executive',
        totalExperience: '5 Years',
        relevantExperience: '4 Years',
        currentCompany: 'Manpower Group',
        previousCompany: 'TeamLease Services',
        currentSalary: '550000',
        expectedSalary: '650000',
        noticePeriod: '15 Days',
        disciplines: 'HR,Administration,Compliance',
        projectTypes: 'All',
        skills: 'Payroll,Compliance,Recruitment,MS Office,Tally',
        employeeCode: 'HPE-0002',
        designation: 'HR Executive',
        department: 'HR & Admin',
        joinDate: new Date('2023-09-15'),
        employmentType: 'Full-time',
        salary: 55000,
        basic: 27500,
        hra: 11000,
        allowances: 5500,
        specialAllowance: 11000,
        employeeType: 'internal',
        accountId: hpAccount.id,
        reviewedBy: hpAdmin.id,
        reviewedAt: new Date(),
      },
    })
  }
  await db.leaveBalance.upsert({ where: { employeeId: priya.id }, update: {}, create: { employeeId: priya.id, casual: 12, sick: 12, earned: 15 } })
  let priyaUser = await db.user.findUnique({ where: { email: priyaEmail } })
  if (!priyaUser) {
    priyaUser = await db.user.create({
      data: {
        username: 'priya.patil',
        email: priyaEmail,
        passwordHash: empPass,
        role: 'EMPLOYEE',
        accountId: hpAccount.id,
        mustResetPassword: false,
      },
    })
    await db.employee.update({ where: { id: priya.id }, data: { userId: priyaUser.id } })
  }
  console.log('  ✅ Priya Patil — priya.patil / Employee@123')

  // ============================================================
  // 9. LEGACY DATA — Client, Project, WorkOrder, Announcement
  // ============================================================
  console.log('\n🔧 Seeding legacy client/project data...')

  let client = await db.client.findFirst({ where: { clientName: 'Infosys Limited' } })
  if (!client) {
    client = await db.client.create({
      data: {
        clientName: 'Infosys Limited',
        companyName: 'Infosys Ltd.',
        gst: '29AAACI4798L1ZB',
        email: 'procurement@infosys.com',
        phone: '+91 80 2852 0261',
        address: 'Electronics City, Hosur Road, Bengaluru 560100',
        contactsJson: JSON.stringify([{ name: 'Ravi Kumar', designation: 'Procurement Head', phone: '+91 9845012345', email: 'ravi.kumar@infosys.com' }]),
      },
    })
    console.log('  ✅ Client: Infosys Limited')
  }

  // CLIENT user for Infosys portal login
  const clientPass = await hashPassword('Client@123')
  let clientUser = await db.user.findUnique({ where: { username: 'infosys.client' } })
  if (!clientUser) {
    clientUser = await db.user.create({
      data: {
        username: 'infosys.client',
        email: 'client.infosys@hpenterprise.co.in',
        passwordHash: clientPass,
        role: 'CLIENT',
        clientId: client.id,
        accountId: hpAccount.id,
        mustResetPassword: false,
      },
    })
    console.log('  ✅ Client login: infosys.client / Client@123')
  }

  // Project
  let project = await db.project.findFirst({ where: { projectName: 'Infosys Campus Tower C — MEP & Finishing' } })
  if (!project) {
    project = await db.project.create({
      data: {
        projectName: 'Infosys Campus Tower C — MEP & Finishing',
        clientId: client.id,
        site: 'Electronics City, Bengaluru',
        startDate: new Date('2024-01-15'),
        status: 'ACTIVE',
        description: 'MEP works, interior fit-out and finishing for Tower C (14 floors).',
      },
    })
    const existingMember = await db.projectMember.findFirst({ where: { projectId: project.id, employeeId: emp.id } })
    if (!existingMember) {
      await db.projectMember.create({ data: { projectId: project.id, employeeId: emp.id, role: 'Site Engineer' } })
    }
    await db.employee.update({ where: { id: emp.id }, data: { assignedClientId: client.id } })
    console.log('  ✅ Project: Infosys Campus Tower C')
  }

  // Work Order
  const existingWO = await db.workOrder.findFirst({ where: { woNumber: 'WO-INFY-2024-014' } })
  if (!existingWO) {
    await db.workOrder.create({
      data: {
        woNumber: 'WO-INFY-2024-014',
        clientId: client.id,
        projectId: project.id,
        title: 'MEP & Finishing — Tower C',
        value: 4200000,
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-12-30'),
        status: 'OPEN',
      },
    })
    console.log('  ✅ Work Order: WO-INFY-2024-014')
  }

  // Announcement
  const existingAnn = await db.announcement.findFirst({ where: { title: 'Diwali Holiday Notice' } })
  if (!existingAnn) {
    await db.announcement.create({
      data: {
        title: 'Diwali Holiday Notice',
        body: 'HP ENTERPRISE offices will remain closed on 1st November for Diwali. Wishing you and your family a prosperous festival.',
        audience: 'ALL',
      },
    })
    console.log('  ✅ Announcement: Diwali Holiday Notice')
  }

  // ============================================================
  // 10. SAMPLE ATTENDANCE (Priya + Arjun, last 5 days)
  // ============================================================
  console.log('\n⏰ Seeding attendance records...')

  for (const e of [priya, emp]) {
    for (let i = 0; i < 5; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      d.setHours(0, 0, 0, 0)
      const exists = await db.attendance.findUnique({ where: { employeeId_date: { employeeId: e.id, date: d } } })
      if (!exists) {
        const punchIn = new Date(d); punchIn.setHours(9, 15 + (i * 3), 0, 0)
        const punchOut = new Date(d); punchOut.setHours(18, 20 + i, 0, 0)
        await db.attendance.create({
          data: {
            employeeId: e.id,
            accountId: hpAccount.id,
            date: d,
            punchIn,
            punchOut,
            workingHours: 9.0 + (i * 0.05),
            overtime: i > 2 ? 0.1 : 0.0,
            lateArrival: false,
            status: 'PRESENT',
          },
        })
      }
    }
  }
  console.log('  ✅ Attendance seeded for Arjun & Priya (last 5 days)')

  // ============================================================
 // 11. SAMPLE DOCUMENTS (Arjun — placeholder files)
 // ============================================================
  console.log('\n📄 Seeding sample documents for Arjun...')
  const existingDocs = await db.employeeDocument.count({ where: { employeeId: emp.id } })
  if (existingDocs === 0) {
    const { writeFile, mkdir } = await import('fs/promises')
    const path = await import('path')
    const UPLOAD_ROOT = path.join(process.cwd(), 'upload')
    const folder = path.join(UPLOAD_ROOT, 'employees', emp.id)
    await mkdir(folder, { recursive: true })
    const pngByte = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64')
    const sampleDocs = [
      { type: 'aadhaar', name: 'aadhaar.png' },
      { type: 'pan', name: 'pan.png' },
      { type: 'photo', name: 'photo.png' },
      { type: 'signature', name: 'signature.png' },
      { type: 'passbook', name: 'passbook.png' },
      { type: 'resume', name: 'resume.png' },
    ]
    for (const d of sampleDocs) {
      await writeFile(path.join(folder, d.name), pngByte)
      await db.employeeDocument.create({
        data: {
          employeeId: emp.id,
          documentType: d.type,
          fileName: d.name,
          filePath: `employees/${emp.id}/${d.name}`,
          mimeType: 'image/png',
          verified: d.type === 'aadhaar' || d.type === 'pan',
        },
      })
    }
    await db.employee.update({
      where: { id: emp.id },
      data: { documentsVerified: false, interviewStatus: 'PASSED', interviewNotes: 'Strong technical background in civil engineering. Recommended for hire.' },
    })
    console.log('  ✅ 6 sample documents created for Arjun')
  }

  // ============================================================
  // DONE
  // ============================================================
  console.log('\n' + '='.repeat(60))
  console.log('✅ SEED COMPLETE — Dual-Mode HPHRMS')
  console.log('='.repeat(60))
  console.log('\n📊 Summary:')
  console.log('  Accounts: 4 (HP Enterprise, Acme Tech, BuildRight, Metro Retail)')
  console.log('  Admin Users: 5 (hpadmin, admin, acmeadmin, buildadmin, metroadmin)')
  console.log('  Sample Employees: 10 (3 Acme, 2 BuildRight, 5 Metro, + 2 HP Enterprise legacy)')
  console.log('  Site Assignments: 4 (2 BuildRight, 2 Metro Retail)')
}

// Execute when run directly
main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
