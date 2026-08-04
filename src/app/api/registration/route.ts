import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { audit } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'
import { notify } from '@/lib/notify'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

export const runtime = 'nodejs'

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

const UPLOAD_ROOT = path.join(process.cwd(), 'upload')

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req)
    if (!checkRateLimit(`register:${ip}`, 3, 60 * 60 * 1000)) {
      return NextResponse.json({ error: 'Too many registration attempts. Please try again later.' }, { status: 429 })
    }

    const form = await req.formData()
    const get = (k: string) => (form.get(k) as string) || ''

    const fullName = get('fullName').trim()
    const email = get('email').trim().toLowerCase()
    if (!fullName || !email) {
      return NextResponse.json({ error: 'Full name and email are required' }, { status: 400 })
    }

    // duplicate email check (pending/approved)
    const existing = await db.employee.findFirst({ where: { email, status: { in: ['PENDING', 'APPROVED'] } } })
    if (existing) {
      return NextResponse.json({ error: 'An application with this email already exists' }, { status: 400 })
    }

    const educationRaw = get('education')
    let educationJson: string | null = null
    try {
      if (educationRaw) {
        const parsed = JSON.parse(educationRaw)
        educationJson = JSON.stringify(parsed)
      }
    } catch { educationJson = null }

    const dob = get('dob') ? new Date(get('dob')) : null

    const appliedPortal = get('appliedPortal') || null

    const employee = await db.employee.create({
      data: {
        status: 'PENDING',
        fullName,
        fatherName: get('fatherName') || null,
        motherName: get('motherName') || null,
        dob,
        gender: get('gender') || null,
        maritalStatus: get('maritalStatus') || null,
        nationality: get('nationality') || null,
        bloodGroup: get('bloodGroup') || null,
        mobile: get('mobile') || null,
        alternateMobile: get('alternateMobile') || null,
        email,
        address: get('address') || null,
        permanentAddress: get('permanentAddress') || null,
        emergencyContact: get('emergencyContact') || null,
        aadhaar: get('aadhaar') || null,
        pan: get('pan') || null,
        uan: get('uan') || null,
        esic: get('esic') || null,
        passport: get('passport') || null,
        drivingLicence: get('drivingLicence') || null,
        bankHolder: get('bankHolder') || null,
        bankName: get('bankName') || null,
        bankBranch: get('bankBranch') || null,
        bankAccount: get('bankAccount') || null,
        bankIfsc: get('bankIfsc') || null,
        educationJson,
        currentDesignation: get('currentDesignation') || null,
        totalExperience: get('totalExperience') || null,
        relevantExperience: get('relevantExperience') || null,
        currentCompany: get('currentCompany') || null,
        previousCompany: get('previousCompany') || null,
        currentSalary: get('currentSalary') || null,
        expectedSalary: get('expectedSalary') || null,
        noticePeriod: get('noticePeriod') || null,
        disciplines: get('disciplines') || null,
        projectTypes: get('projectTypes') || null,
        skills: get('skills') || null,
        appliedPortal,
      },
    })

    // Save uploaded files
    const folder = path.join(UPLOAD_ROOT, 'employees', employee.id)
    await mkdir(folder, { recursive: true })

    const fileFields = [
      'aadhaarFile', 'panFile', 'photoFile', 'signatureFile', 'passbookFile',
      'resumeFile', 'experienceFile', 'educationFile', 'salarySlipFile', 'relievingFile',
      'medicalFile', 'addressProofFile',
    ]
    const docTypeMap: Record<string, string> = {
      aadhaarFile: 'aadhaar', panFile: 'pan', photoFile: 'photo', signatureFile: 'signature',
      passbookFile: 'passbook', resumeFile: 'resume', experienceFile: 'experience_certificate',
      educationFile: 'education_certificate', salarySlipFile: 'salary_slip', relievingFile: 'relieving_letter',
      medicalFile: 'medical_certificate', addressProofFile: 'address_proof',
    }

    for (const field of fileFields) {
      const file = form.get(field) as File | null
      if (file && file.size > 0) {
        if (file.size > MAX_FILE_SIZE) {
          return NextResponse.json({ error: `File ${field} exceeds 5MB limit` }, { status: 400 })
        }
        if (!ALLOWED_MIME.has(file.type)) {
          return NextResponse.json({ error: `File ${field} has unsupported type: ${file.type}` }, { status: 400 })
        }
        const ext = path.extname(file.name) || '.bin'
        const docType = docTypeMap[field]
        const fileName = `${docType}${ext}`
        const filePath = path.join(folder, fileName)
        const buf = Buffer.from(await file.arrayBuffer())
        await writeFile(filePath, buf)
        await db.employeeDocument.create({
          data: {
            employeeId: employee.id,
            documentType: docType,
            fileName: file.name,
            filePath: `employees/${employee.id}/${fileName}`,
            mimeType: file.type,
          },
        })
      }
    }

    // Notify all admins + HR
    const admins = await db.user.findMany({ where: { role: { in: ['SUPER_ADMIN', 'HR_MANAGER'] } } })
    for (const a of admins) {
      await notify(
        a.id,
        'New Employee Application',
        `${fullName} has submitted a registration application${appliedPortal ? ` for ${appliedPortal}` : ''} pending review.`,
        'ANNOUNCEMENT',
        `/admin?tab=employees&sub=pending`,
      )
    }

    await audit(null, 'REGISTER', 'Employee', employee.id, `Application submitted by ${fullName} <${email}>`)

    return NextResponse.json({ ok: true, id: employee.id })
  } catch (e) {
    console.error('registration error', e)
    return NextResponse.json({ error: 'Registration failed. Please try again.' }, { status: 500 })
  }
}
