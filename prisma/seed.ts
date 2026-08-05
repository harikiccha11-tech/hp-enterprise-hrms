import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const SALT = 12
const HP_ENTERPRISE_ACCOUNT_ID = 'acct_hp_enterprise'

async function main() {
  console.log('🌱 Seeding HPHRMS Enterprise database...')

  // ─── Account ───────────────────────────────────────
  const account = await prisma.account.upsert({
    where: { id: HP_ENTERPRISE_ACCOUNT_ID },
    update: {},
    create: {
      id: HP_ENTERPRISE_ACCOUNT_ID,
      organizationName: 'HP ENTERPRISE',
      accountType: 'hybrid',
      status: 'active',
      billingContactEmail: 'hpenterpriseofficial11@gmail.com',
      billingPhone: '+91 80737 48271',
      gstNumber: '29ANZPH4067Q1ZS',
      panNumber: 'ANZPH4067Q',
      billingAddress: 'Venkateshwara Nilaya Building, Behind Hanuman Mandir, Nagenahalli, Hosadurga Taluk, Chitradurga – 577515',
      city: 'Chitradurga',
      state: 'Karnataka',
      pincode: '577515',
      notes: 'HP Enterprise — Flagship account. Hybrid mode: HRMS SaaS + Manpower Supply.',
    },
  })
  console.log('  ✓ Account:', account.organizationName)

  // ─── Owner User ────────────────────────────────────
  const ownerPassword = await bcrypt.hash('Admin@2025', SALT)
  const owner = await prisma.user.upsert({
    where: { email: 'admin@hphrms.com' },
    update: {},
    create: {
      username: 'hpadmin',
      email: 'admin@hphrms.com',
      passwordHash: ownerPassword,
      role: 'OWNER',
      accountId: HP_ENTERPRISE_ACCOUNT_ID,
      clientRole: 'admin',
      mustResetPassword: false,
    },
  })
  console.log('  ✓ Owner:', owner.email)

  // ─── HR Manager ─────────────────────────────────────
  const hrPassword = await bcrypt.hash('Hr@2025', SALT)
  const hrManager = await prisma.user.upsert({
    where: { email: 'hr@hphrms.com' },
    update: {},
    create: {
      username: 'hrmanager',
      email: 'hr@hphrms.com',
      passwordHash: hrPassword,
      role: 'HR_MANAGER',
      accountId: HP_ENTERPRISE_ACCOUNT_ID,
      clientRole: 'hr',
      mustResetPassword: false,
    },
  })
  console.log('  ✓ HR Manager:', hrManager.email)

  // ─── Client Branding ───────────────────────────────
  await prisma.clientBranding.upsert({
    where: { accountId: HP_ENTERPRISE_ACCOUNT_ID },
    update: {},
    create: {
      accountId: HP_ENTERPRISE_ACCOUNT_ID,
      displayName: 'HPHRMS',
      primaryColor: '#16213E',
      accentColor: '#E8A33D',
      sidebarStyle: 'dark',
      hideHphrmsBranding: false,
      supportEmail: 'hpenterpriseofficial11@gmail.com',
      supportPhone: '+91 80737 48271',
    },
  })
  console.log('  ✓ Client Branding configured')

  // ─── Default Settings ─────────────────────────────
  await prisma.setting.upsert({
    where: { key: 'company_name' },
    update: {},
    create: { key: 'company_name', value: 'HP ENTERPRISE' },
  })
  await prisma.setting.upsert({
    where: { key: 'hphrms_url' },
    update: {},
    create: { key: 'hphrms_url', value: 'https://hphrms.com' },
  })
  await prisma.setting.upsert({
    where: { key: 'default_timezone' },
    update: {},
    create: { key: 'default_timezone', value: 'Asia/Kolkata' },
  })
  await prisma.setting.upsert({
    where: { key: 'currency' },
    update: {},
    create: { key: 'currency', value: 'INR' },
  })
  await prisma.setting.upsert({
    where: { key: 'date_format' },
    update: {},
    create: { key: 'date_format', value: 'DD/MM/YYYY' },
  })
  console.log('  ✓ Default settings configured')

  // ─── Default Departments ───────────────────────────
  const departments = [
    { name: 'Human Resources', code: 'HR' },
    { name: 'Finance & Accounts', code: 'FIN' },
    { name: 'Operations', code: 'OPS' },
    { name: 'EHS', code: 'EHS' },
    { name: 'Engineering', code: 'ENG' },
    { name: 'Recruitment', code: 'REC' },
    { name: 'IT', code: 'IT' },
    { name: 'Administration', code: 'ADM' },
  ]
  for (const dept of departments) {
    await prisma.department.upsert({
      where: { code: dept.code },
      update: {},
      create: { name: dept.name, code: dept.code, status: 'ACTIVE' },
    })
  }
  console.log('  ✓ Departments seeded:', departments.length)

  // ─── Default Designations ──────────────────────────
  const designations = [
    { title: 'Managing Director', level: 'C1', department: 'HR' },
    { title: 'Director', level: 'C2', department: 'HR' },
    { title: 'HR Manager', level: 'M1', department: 'HR' },
    { title: 'Finance Manager', level: 'M1', department: 'FIN' },
    { title: 'Operations Manager', level: 'M1', department: 'OPS' },
    { title: 'EHS Officer', level: 'M2', department: 'EHS' },
    { title: 'Site Engineer', level: 'L1', department: 'ENG' },
    { title: 'Recruiter', level: 'L2', department: 'REC' },
    { title: 'Site Supervisor', level: 'L2', department: 'OPS' },
    { title: 'Skilled Worker', level: 'L3', department: 'OPS' },
    { title: 'Semi-Skilled Worker', level: 'L4', department: 'OPS' },
    { title: 'Unskilled Worker', level: 'L5', department: 'OPS' },
  ]
  for (const desig of designations) {
    await prisma.designation.upsert({
      where: { title: desig.title },
      update: {},
      create: { ...desig, status: 'ACTIVE' },
    })
  }
  console.log('  ✓ Designations seeded:', designations.length)

  // ─── Default Subscription Plans ────────────────────
  const plans = [
    { name: 'Free', priceINR: 0, maxEmployees: 25, interval: 'MONTHLY', trialDays: 0, isPopular: false, features: 'Core HRMS, Attendance, Leave Management, Employee Self-Service', sortOrder: 0 },
    { name: 'Starter', priceINR: 2999, maxEmployees: 100, interval: 'MONTHLY', trialDays: 14, isPopular: false, features: 'Everything in Free + Payroll, Recruitment, Documents, AI Assistant (50 queries/mo)', sortOrder: 1 },
    { name: 'Professional', priceINR: 7999, maxEmployees: 500, interval: 'MONTHLY', trialDays: 14, isPopular: true, features: 'Everything in Starter + Client Portal, Timesheets, Invoicing, AI Assistant (500 queries/mo), White Label', sortOrder: 2 },
    { name: 'Enterprise', priceINR: 0, maxEmployees: null, interval: 'MONTHLY', trialDays: 30, isPopular: false, features: 'Everything in Professional + Unlimited AI, Dedicated Support, Custom Integrations, SLA, On-Premise Option', sortOrder: 3 },
  ]
  for (const plan of plans) {
    await prisma.subscriptionPlan.upsert({
      where: { name: plan.name },
      update: {},
      create: { ...plan, description: `HPHRMS ${plan.name} Plan`, status: 'ACTIVE' },
    })
  }
  console.log('  ✓ Subscription Plans seeded:', plans.length)

  // ─── Branch Offices ────────────────────────────────
  const branches = [
    { name: 'Head Office — Chitradurga', code: 'HO-CDG', address: 'Venkateshwara Nilaya Building, Behind Hanuman Mandir, Nagenahalli, Hosadurga Taluk', city: 'Chitradurga', state: 'Karnataka', pincode: '577515', phone: '+91 80737 48271', isHead: true },
    { name: 'Branch Office — Bengaluru', code: 'BR-BLR', address: 'Kalkere Market Road, Ramamurthy Nagar', city: 'Bengaluru', state: 'Karnataka', pincode: '560016', isHead: false },
  ]
  for (const branch of branches) {
    await prisma.branch.upsert({
      where: { code: branch.code },
      update: {},
      create: { ...branch, status: 'ACTIVE' },
    })
  }
  console.log('  ✓ Branches seeded:', branches.length)

  // ─── Welcome Notifications ─────────────────────────
  await prisma.notification.create({
    data: {
      accountId: HP_ENTERPRISE_ACCOUNT_ID,
      userId: owner.id,
      title: 'Welcome to HPHRMS Enterprise AI',
      body: 'Your workforce operating system is ready. Start by exploring the Dashboard, managing employees, or asking HPAI any question.',
      type: 'INFO',
      severity: 'info',
      channel: 'in_app',
      status: 'sent',
      sentAt: new Date(),
      read: false,
    },
  })
  console.log('  ✓ Welcome notification created')

  console.log('\n✅ Seed complete. HPHRMS Enterprise AI is production-ready.')
  console.log('   Admin: admin@hphrms.com / Admin@2025')
  console.log('   HR:    hr@hphrms.com / Hr@2025')
}

main()
  .catch((e) => { console.error('Seed failed:', e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
