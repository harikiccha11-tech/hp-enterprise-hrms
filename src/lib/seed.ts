// Seed script — run with: bun run src/lib/seed.ts
import { db } from './db'
import { hashPassword } from './auth'

async function main() {
  console.log('Seeding HP ENTERPRISE Workforce...')

  // Settings
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
    'company.adminEmail': 'admin@hpenterprise.co.in',
  }
  for (const [k, v] of Object.entries(defaults)) {
    await db.setting.upsert({ where: { key: k }, update: {}, create: { key: k, value: v } })
  }

  // Owner (top-level — creates all other accounts)
  const ownerPass = await hashPassword('Owner@123')
  const owner = await db.user.upsert({
    where: { username: 'owner' },
    update: { passwordHash: ownerPass, mustResetPassword: false },
    create: {
      username: 'owner',
      email: 'owner@hpenterprise.co.in',
      passwordHash: ownerPass,
      role: 'OWNER',
      mustResetPassword: false,
    },
  })
  console.log('Owner:', owner.username, '(password: Owner@123)')

  // Super Admin (Admin)
  const adminPass = await hashPassword('Admin@123')
  const admin = await db.user.upsert({
    where: { username: 'superadmin' },
    update: { passwordHash: adminPass, mustResetPassword: false },
    create: {
      username: 'superadmin',
      email: 'admin@hpenterprise.co.in',
      passwordHash: adminPass,
      role: 'SUPER_ADMIN',
      mustResetPassword: false,
    },
  })
  console.log('Admin:', admin.username, '(password: Admin@123)')

  // HR Manager
  const hrPass = await hashPassword('Hrmanager@123')
  const hr = await db.user.upsert({
    where: { username: 'hrmanager' },
    update: { passwordHash: hrPass, mustResetPassword: false },
    create: {
      username: 'hrmanager',
      email: 'hr@hpenterprise.co.in',
      passwordHash: hrPass,
      role: 'HR_MANAGER',
      mustResetPassword: false,
    },
  })
  console.log('HR Manager:', hr.username, '(password: Hrmanager@123)')

  // A sample approved employee + login
  const empPass = await hashPassword('Employee@123')
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
        reviewedBy: admin.id,
        reviewedAt: new Date(),
      },
    })
  }

  // Link login user to employee
  let empUser = await db.user.findUnique({ where: { email: empEmail } })
  if (!empUser) {
    empUser = await db.user.create({
      data: {
        username: 'arjun.sharma',
        email: empEmail,
        passwordHash: empPass,
        role: 'EMPLOYEE',
        mustResetPassword: false,
      },
    })
    await db.employee.update({ where: { id: emp.id }, data: { userId: empUser.id } })
  }
  console.log('Employee login: arjun.sharma / Employee@123')

  // Leave balance
  await db.leaveBalance.upsert({
    where: { employeeId: emp.id },
    update: {},
    create: { employeeId: emp.id, casual: 12, sick: 12, earned: 15 },
  })

  // Create sample uploaded documents for Arjun (so admin view shows content)
  const existingDocs = await db.employeeDocument.count({ where: { employeeId: emp.id } })
  if (existingDocs === 0) {
    const { writeFile, mkdir } = await import('fs/promises')
    const path = await import('path')
    const UPLOAD_ROOT = path.join(process.cwd(), 'upload')
    const folder = path.join(UPLOAD_ROOT, 'employees', emp.id)
    await mkdir(folder, { recursive: true })
    // 1x1 placeholder PNG
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
    await db.employee.update({ where: { id: emp.id }, data: { documentsVerified: false, interviewStatus: 'PASSED', interviewNotes: 'Strong technical background in civil engineering. Recommended for hire.' } })
    console.log('Sample documents created for Arjun')
  }

  // Sample client + project
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
        mustResetPassword: false,
      },
    })
    console.log('Client login: infosys.client / Client@123')
  }

  // Project (idempotent)
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
    // Assign client to Arjun
    await db.employee.update({ where: { id: emp.id }, data: { assignedClientId: client.id } })
  }

  // Work Order (idempotent)
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
  }

  // Sample announcement (idempotent)
  const existingAnn = await db.announcement.findFirst({ where: { title: 'Diwali Holiday Notice' } })
  if (!existingAnn) {
    await db.announcement.create({
      data: {
        title: 'Diwali Holiday Notice',
        body: 'HP ENTERPRISE offices will remain closed on 1st November for Diwali. Wishing you and your family a prosperous festival.',
        audience: 'ALL',
      },
    })
  }

  // Attendance for today + a few days for the employee
  const today = new Date()
  for (let i = 0; i < 5; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const exists = await db.attendance.findUnique({ where: { employeeId_date: { employeeId: emp.id, date: d } } })
    if (!exists) {
      const punchIn = new Date(d); punchIn.setHours(9, 28, 0, 0)
      const punchOut = new Date(d); punchOut.setHours(18, 35, 0, 0)
      await db.attendance.create({
        data: {
          employeeId: emp.id,
          date: d,
          punchIn,
          punchOut,
          workingHours: 9.1,
          overtime: 0.1,
          lateArrival: false,
          status: 'PRESENT',
        },
      })
    }
  }

  console.log('Seed complete.')
}

main().catch((e) => { console.error(e); process.exit(1) }).finally(async () => { await db.$disconnect() })
