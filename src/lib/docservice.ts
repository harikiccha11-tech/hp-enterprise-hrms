import { db } from './db'
import { renderToBuffer } from '@react-pdf/renderer'
import {
  OfferLetterDoc, AppointmentLetterDoc, IdCardDoc, SalarySlipDoc, GenericLetterDoc,
} from './pdfgen'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

const UPLOAD_ROOT = path.join(process.cwd(), 'upload')

export async function generateDocument(employeeId: string, docType: string, generatedBy: string, extra?: any) {
  const emp = await db.employee.findUnique({ where: { id: employeeId } })
  if (!emp) throw new Error('Employee not found')

  // accountId is required for tenant isolation
  const accountId = emp.accountId
  if (!accountId) throw new Error('Employee has no account association')

  const meta = {
    employeeCode: emp.employeeCode,
    fullName: emp.fullName,
    designation: emp.designation,
    department: emp.department,
    email: emp.email,
    mobile: emp.mobile,
    joinDate: emp.joinDate ? emp.joinDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }) : undefined,
    salary: emp.salary,
    bloodGroup: emp.bloodGroup,
    dob: emp.dob ? emp.dob.toLocaleDateString('en-IN') : undefined,
    fatherName: emp.fatherName,
    address: emp.address,
    basic: emp.basic,
    hra: emp.hra,
    allowances: emp.allowances,
    specialAllowance: emp.specialAllowance,
  }

  let buffer: Buffer
  let title = ''
  switch (docType) {
    case 'offer_letter':
      buffer = await renderToBuffer(OfferLetterDoc(meta)); title = 'Offer Letter'; break
    case 'appointment_letter':
      buffer = await renderToBuffer(AppointmentLetterDoc(meta)); title = 'Appointment Letter'; break
    case 'id_card':
      buffer = await renderToBuffer(IdCardDoc(meta)); title = 'Employee ID Card'; break
    case 'salary_slip':
      buffer = await renderToBuffer(SalarySlipDoc({ ...meta, ...extra })); title = `Salary Slip — ${extra.month}/${extra.year}`; break
    case 'experience_letter':
      buffer = await renderToBuffer(GenericLetterDoc({
        ...meta, docTitle: 'Experience Letter', signatory: 'Head — Safety & Workforce Management',
        bodyParagraphs: [
          `This is to certify that ${emp.fullName} was employed with HP ENTERPRISE Safety Service & Man Power Supply as ${emp.designation || 'Employee'} in the ${emp.department || 'Operations'} department.`,
          emp.joinDate ? `During the tenure of service from ${emp.joinDate.toLocaleDateString('en-IN')} to ${new Date().toLocaleDateString('en-IN')}, we found ${emp.fullName.split(' ')[0]} to be sincere, dedicated and professional in their conduct.` : '',
          'We wish them all the very best in their future endeavors.',
        ],
      })); title = 'Experience Letter'; break
    case 'confirmation_letter':
      buffer = await renderToBuffer(GenericLetterDoc({
        ...meta, docTitle: 'Confirmation Letter', signatory: 'Head — Safety & Workforce Management',
        bodyParagraphs: [
          `We are pleased to confirm your services as ${emp.designation || 'Employee'} with HP ENTERPRISE Safety Service & Man Power Supply on successful completion of your probation period.`,
          'All terms and conditions of your appointment letter shall continue to apply. Your revised compensation and benefits shall be communicated separately.',
          'We look forward to your continued contribution to the growth of the organization.',
        ],
      })); title = 'Confirmation Letter'; break
    case 'promotion_letter':
      buffer = await renderToBuffer(GenericLetterDoc({
        ...meta, docTitle: 'Promotion Letter', signatory: 'Head — Safety & Workforce Management',
        bodyParagraphs: [
          `Consequent upon your performance review, management is pleased to promote you to the role of ${emp.designation || 'Senior Employee'} effective ${new Date().toLocaleDateString('en-IN')}.`,
          'Your revised compensation structure is annexed. Please accept our congratulations on your well-deserved promotion.',
        ],
      })); title = 'Promotion Letter'; break
    case 'relieving_letter':
      buffer = await renderToBuffer(GenericLetterDoc({
        ...meta, docTitle: 'Relieving Letter', signatory: 'Head — Safety & Workforce Management',
        bodyParagraphs: [
          `As per your resignation, this is to inform that you are hereby relieved from the services of HP ENTERPRISE Safety Service & Man Power Supply with effect from the closing hours of ${new Date().toLocaleDateString('en-IN')}.`,
          'Your full & final settlement has been processed as per company policy. Please return all company assets and clear any outstanding dues.',
        ],
      })); title = 'Relieving Letter'; break
    case 'joining_letter':
      buffer = await renderToBuffer(GenericLetterDoc({
        ...meta, docTitle: 'Joining Letter', signatory: 'Head — Safety & Workforce Management',
        bodyParagraphs: [
          `Welcome to HP ENTERPRISE Safety Service & Man Power Supply! You are hereby appointed as ${emp.designation || 'Employee'} and your joining is confirmed effective ${emp.joinDate ? emp.joinDate.toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN')}.`,
          'Please report to the HR desk on your first working day at 9:30 AM with all original documents for verification.',
        ],
      })); title = 'Joining Letter'; break
    case 'nda':
      buffer = await renderToBuffer(GenericLetterDoc({
        ...meta, docTitle: 'Non-Disclosure Agreement', signatory: 'Authorized Signatory',
        bodyParagraphs: [
          `This Non-Disclosure Agreement is entered into between HP ENTERPRISE Safety Service & Man Power Supply and ${emp.fullName}.`,
          'The employee agrees to hold all confidential information — including but not limited to client data, project drawings, financials, trade secrets and intellectual property — in strict confidence during and after the term of employment.',
          'Any breach of this agreement shall entitle the company to initiate appropriate legal and disciplinary action.',
        ],
      })); title = 'Non-Disclosure Agreement'; break
    case 'employment_agreement':
      buffer = await renderToBuffer(GenericLetterDoc({
        ...meta, docTitle: 'Employment Agreement', signatory: 'Authorized Signatory',
        bodyParagraphs: [
          `This Employment Agreement is made between HP ENTERPRISE Safety Service & Man Power Supply ("Company") and ${emp.fullName} ("Employee") effective ${emp.joinDate ? emp.joinDate.toLocaleDateString('en-IN') : new Date().toLocaleDateString('en-IN')}.`,
          'The employee shall perform duties as assigned, abide by company policies, maintain confidentiality and adhere to the code of conduct at all times.',
          'Either party may terminate this agreement with a 30-day written notice. The terms herein are binding as per applicable Indian labor laws.',
        ],
      })); title = 'Employment Agreement'; break
    case 'transfer_letter':
      buffer = await renderToBuffer(GenericLetterDoc({
        ...meta, docTitle: 'Transfer Letter', signatory: 'Head — Safety & Workforce Management',
        bodyParagraphs: [
          `This is to inform you that you have been transferred to a new project/site as part of organizational requirement, effective ${new Date().toLocaleDateString('en-IN')}.`,
          'Detailed reporting instructions will be shared by your project manager. All other terms of employment remain unchanged.',
        ],
      })); title = 'Transfer Letter'; break
    case 'warning_letter':
      buffer = await renderToBuffer(GenericLetterDoc({
        ...meta, docTitle: 'Warning Letter', signatory: 'Head — Safety & Workforce Management',
        bodyParagraphs: [
          `This letter serves as a formal warning regarding your recent conduct/performance which is not in line with company expectations.`,
          'You are advised to take corrective action immediately. Further lapses may lead to strict disciplinary action as per company policy.',
        ],
      })); title = 'Warning Letter'; break
    case 'no_due_certificate':
      buffer = await renderToBuffer(GenericLetterDoc({
        ...meta, docTitle: 'No Due Certificate', signatory: 'Head — Safety & Workforce Management',
        bodyParagraphs: [
          `This is to certify that ${emp.fullName} has no dues pending with any department of HP ENTERPRISE Safety Service & Man Power Supply as on ${new Date().toLocaleDateString('en-IN')}.`,
          'All company assets have been returned and accounts settled.',
        ],
      })); title = 'No Due Certificate'; break
    case 'full_final_settlement':
      buffer = await renderToBuffer(GenericLetterDoc({
        ...meta, docTitle: 'Full & Final Settlement', signatory: 'Head — Finance',
        bodyParagraphs: [
          `This statement represents the full and final settlement of ${emp.fullName} as on ${new Date().toLocaleDateString('en-IN')}.`,
          'All salary, leave encashment, gratuity (if applicable) and recoveries have been computed as per company policy and statutory norms.',
          'The net payable amount has been credited to your registered bank account.',
        ],
      })); title = 'Full & Final Settlement'; break
    default:
      throw new Error('Unknown document type: ' + docType)
  }

  const folder = path.join(UPLOAD_ROOT, 'employees', employeeId)
  await mkdir(folder, { recursive: true })
  const fileName = `${docType}_${Date.now()}.pdf`
  const filePath = path.join(folder, fileName)
  await writeFile(filePath, buffer)

  const doc = await db.generatedDocument.create({
    data: {
      accountId,
      employeeId,
      documentType: docType,
      title,
      storagePath: `employees/${employeeId}/${fileName}`,
      generatedByUserId: generatedBy,
    },
  })
  return doc
}
