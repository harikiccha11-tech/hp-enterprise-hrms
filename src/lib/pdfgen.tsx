import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer'
import path from 'path'

export const NAVY = '#002B5C'
export const NAVY_DEEP = '#001A3D'
export const NAVY_LIGHT = '#0A4488'
export const GOLD = '#D4AF37'
export const GOLD_LIGHT = '#E8C96A'
export const SILVER = '#C0C0C0'
export const INK = '#0E1B33'
export const MUTED = '#5A6A8A'
export const LINE = '#DDE3EE'

// Absolute path to the logo (resolved at render time on the server)
const LOGO_PATH = path.join(process.cwd(), 'public', 'hp-logo.jpg')

export const brandStyles = StyleSheet.create({
  page: {
    fontFamily: 'Helvetica',
    fontSize: 10.5,
    color: INK,
    paddingTop: 0,
    paddingBottom: 60,
    paddingHorizontal: 56,
    lineHeight: 1.55,
  },
  headerBand: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: NAVY,
    paddingHorizontal: 56,
    paddingVertical: 22,
    marginHorizontal: -56,
    marginTop: -0,
    marginBottom: 26,
    borderBottomWidth: 3,
    borderBottomColor: GOLD,
  },
  logo: {
    color: '#FFFFFF',
    fontSize: 24,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: -0.5,
  },
  logoSub: {
    color: GOLD,
    fontSize: 8,
    letterSpacing: 3,
    fontFamily: 'Helvetica-Bold',
    marginTop: 2,
  },
  headerRight: { alignItems: 'flex-end' },
  headerTitle: { color: '#FFFFFF', fontSize: 11, fontFamily: 'Helvetica-Bold' },
  headerMuted: { color: GOLD_LIGHT, fontSize: 8, marginTop: 2 },
  goldRule: { height: 2, backgroundColor: GOLD, marginBottom: 18 },
  title: { fontSize: 17, fontFamily: 'Helvetica-Bold', color: NAVY, textAlign: 'center', marginBottom: 4, letterSpacing: 0.5 },
  subTitle: { fontSize: 9, color: MUTED, textAlign: 'center', marginBottom: 18, letterSpacing: 2 },
  refLine: { flexDirection: 'row', justifyContent: 'space-between', fontSize: 9, color: MUTED, marginBottom: 14 },
  body: { fontSize: 10.5, color: INK, marginBottom: 10 },
  bold: { fontFamily: 'Helvetica-Bold' },
  sectionTitle: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: NAVY, marginBottom: 6, marginTop: 12, borderLeftWidth: 3, borderLeftColor: GOLD, paddingLeft: 8 },
  table: { borderWidth: 1, borderColor: LINE, borderRadius: 4, marginBottom: 12 },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: LINE },
  rowLast: { flexDirection: 'row' },
  cell: { paddingVertical: 7, paddingHorizontal: 10, fontSize: 9.5 },
  cellKey: { width: '38%', backgroundColor: '#F6F7FB', fontFamily: 'Helvetica-Bold', color: NAVY },
  cellVal: { flex: 1 },
  signBlock: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 40, marginBottom: 10 },
  signCol: { width: '45%' },
  signLine: { marginTop: 44, borderTopWidth: 1, borderTopColor: INK, paddingTop: 4, fontSize: 9, color: MUTED },
  footer: { position: 'absolute', bottom: 24, left: 56, right: 56, borderTopWidth: 1, borderTopColor: LINE, paddingTop: 8, flexDirection: 'row', justifyContent: 'space-between', fontSize: 7.5, color: MUTED },
})

interface DocMeta {
  employeeCode?: string | null
  fullName: string
  designation?: string | null
  department?: string | null
  email?: string | null
  mobile?: string | null
  joinDate?: string
  salary?: number | null
  bloodGroup?: string | null
  dob?: string
  fatherName?: string | null
  address?: string | null
  basic?: number | null
  hra?: number | null
  allowances?: number | null
  specialAllowance?: number | null
}

function Header({ docTitle, refNo, date }: { docTitle: string; refNo: string; date: string }) {
  return (
    <View>
      <View style={brandStyles.headerBand}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Image src={LOGO_PATH} style={{ width: 48, height: 48, objectFit: 'contain', backgroundColor: '#FFFFFF', borderRadius: 4, padding: 2 }} />
          <View>
            <Text style={brandStyles.logo}>HP ENTERPRISE</Text>
            <Text style={brandStyles.logoSub}>SAFETY MANAGEMENT &amp; PROJECT SUPPORT</Text>
          </View>
        </View>
        <View style={brandStyles.headerRight}>
          <Text style={brandStyles.headerTitle}>{docTitle}</Text>
          <Text style={brandStyles.headerMuted}>Safety & Workforce Management</Text>
        </View>
      </View>
      <View style={brandStyles.refLine}>
        <Text>Ref: {refNo}</Text>
        <Text>Date: {date}</Text>
      </View>
    </View>
  )
}

function Footer() {
  return (
    <View style={brandStyles.footer} fixed>
      <Text>HP ENTERPRISE Safety Service & Man Power Supply • Plot 14, Tech Park Phase II, Whitefield, Bengaluru 560066</Text>
      <Text>hr@hpenterprise.co.in • www.hpenterprise.co.in • CIN: U72900KA2015PTC112233</Text>
    </View>
  )
}

const today = () => new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })

// ============ OFFER LETTER ============
export function OfferLetterDoc(m: DocMeta) {
  return (
    <Document>
      <Page size="A4" style={brandStyles.page}>
        <Header docTitle="Offer Letter" refNo={`HPE/HR/OFF/${m.employeeCode || 'APP'}/${new Date().getFullYear()}`} date={today()} />
        <Text style={brandStyles.body}>To,</Text>
        <Text style={brandStyles.body}><Text style={brandStyles.bold}>{m.fullName}</Text>{m.email ? `\n${m.email}` : ''}{m.mobile ? `\n${m.mobile}` : ''}</Text>
        <Text style={{ ...brandStyles.body, marginTop: 12 }}>
          Dear {m.fullName.split(' ')[0]},
        </Text>
        <Text style={brandStyles.body}>
          We are delighted to extend to you a formal offer of employment with <Text style={brandStyles.bold}>HP ENTERPRISE Safety Service & Man Power Supply</Text> Based on your interview and our assessment of your profile, we are confident that your skills and experience will be a valuable addition to our team.
        </Text>
        <Text style={brandStyles.sectionTitle}>Position & Joining</Text>
        <View style={brandStyles.table}>
          <View style={brandStyles.row}><Text style={{ ...brandStyles.cell, ...brandStyles.cellKey }}>Designation</Text><Text style={{ ...brandStyles.cell, ...brandStyles.cellVal }}>{m.designation || '—'}</Text></View>
          <View style={brandStyles.row}><Text style={{ ...brandStyles.cell, ...brandStyles.cellKey }}>Department</Text><Text style={{ ...brandStyles.cell, ...brandStyles.cellVal }}>{m.department || '—'}</Text></View>
          <View style={brandStyles.row}><Text style={{ ...brandStyles.cell, ...brandStyles.cellKey }}>Employee Code</Text><Text style={{ ...brandStyles.cell, ...brandStyles.cellVal }}>{m.employeeCode || '—'}</Text></View>
          <View style={brandStyles.row}><Text style={{ ...brandStyles.cell, ...brandStyles.cellKey }}>Date of Joining</Text><Text style={{ ...brandStyles.cell, ...brandStyles.cellVal }}>{m.joinDate || today()}</Text></View>
          <View style={brandStyles.row}><Text style={{ ...brandStyles.cell, ...brandStyles.cellKey }}>Employment Type</Text><Text style={{ ...brandStyles.cell, ...brandStyles.cellVal }}>Full-time (Permanent)</Text></View>
        </View>
        <Text style={brandStyles.sectionTitle}>Compensation</Text>
        <View style={brandStyles.table}>
          <View style={brandStyles.row}><Text style={{ ...brandStyles.cell, ...brandStyles.cellKey }}>Cost to Company (Annual)</Text><Text style={{ ...brandStyles.cell, ...brandStyles.cellVal }}>₹ {((m.salary || 0) * 12).toLocaleString('en-IN')}</Text></View>
          <View style={brandStyles.row}><Text style={{ ...brandStyles.cell, ...brandStyles.cellKey }}>Monthly Gross</Text><Text style={{ ...brandStyles.cell, ...brandStyles.cellVal }}>₹ {(m.salary || 0).toLocaleString('en-IN')}</Text></View>
        </View>
        <Text style={brandStyles.body}>
          You will be governed by the company's policies on confidentiality, code of conduct, leave, and disciplinary procedures. This offer is subject to satisfactory background verification and submission of all original documents at the time of joining.
        </Text>
        <Text style={brandStyles.body}>Kindly sign and return a copy of this letter as your token of acceptance.</Text>
        <View style={brandStyles.signBlock}>
          <View style={brandStyles.signCol}><Text style={brandStyles.signLine}>Candidate Signature</Text></View>
          <View style={brandStyles.signCol}><Text style={brandStyles.signLine}>For HP ENTERPRISE Safety Service & Man Power Supply</Text><Text style={{ fontSize: 9, color: NAVY, fontFamily: 'Helvetica-Bold', marginTop: 2 }}>Authorized Signatory</Text></View>
        </View>
        <Footer />
      </Page>
    </Document>
  )
}

// ============ APPOINTMENT LETTER ============
export function AppointmentLetterDoc(m: DocMeta) {
  return (
    <Document>
      <Page size="A4" style={brandStyles.page}>
        <Header docTitle="Appointment Letter" refNo={`HPE/HR/APT/${m.employeeCode || 'APP'}/${new Date().getFullYear()}`} date={today()} />
        <Text style={brandStyles.body}>To,</Text>
        <Text style={brandStyles.body}><Text style={brandStyles.bold}>{m.fullName}</Text>{m.email ? `\n${m.email}` : ''}</Text>
        <Text style={{ ...brandStyles.body, marginTop: 10 }}>
          Dear {m.fullName.split(' ')[0]},
        </Text>
        <Text style={brandStyles.body}>
          With reference to your offer of employment, we are pleased to formally appoint you as <Text style={brandStyles.bold}>{m.designation || 'Employee'}</Text> in the <Text style={brandStyles.bold}>{m.department || 'Operations'}</Text> department of HP ENTERPRISE Safety Service & Man Power Supply with effect from <Text style={brandStyles.bold}>{m.joinDate || today()}</Text>.
        </Text>
        <Text style={brandStyles.sectionTitle}>Terms of Appointment</Text>
        <View style={brandStyles.table}>
          <View style={brandStyles.row}><Text style={{ ...brandStyles.cell, ...brandStyles.cellKey }}>Employee Code</Text><Text style={{ ...brandStyles.cell, ...brandStyles.cellVal }}>{m.employeeCode || '—'}</Text></View>
          <View style={brandStyles.row}><Text style={{ ...brandStyles.cell, ...brandStyles.cellKey }}>Designation</Text><Text style={{ ...brandStyles.cell, ...brandStyles.cellVal }}>{m.designation || '—'}</Text></View>
          <View style={brandStyles.row}><Text style={{ ...brandStyles.cell, ...brandStyles.cellKey }}>Department</Text><Text style={{ ...brandStyles.cell, ...brandStyles.cellVal }}>{m.department || '—'}</Text></View>
          <View style={brandStyles.row}><Text style={{ ...brandStyles.cell, ...brandStyles.cellKey }}>Date of Joining</Text><Text style={{ ...brandStyles.cell, ...brandStyles.cellVal }}>{m.joinDate || today()}</Text></View>
          <View style={brandStyles.row}><Text style={{ ...brandStyles.cell, ...brandStyles.cellKey }}>Probation Period</Text><Text style={{ ...brandStyles.cell, ...brandStyles.cellVal }}>6 Months</Text></View>
          <View style={brandStyles.row}><Text style={{ ...brandStyles.cell, ...brandStyles.cellKey }}>Notice Period</Text><Text style={{ ...brandStyles.cell, ...brandStyles.cellVal }}>30 Days</Text></View>
          <View style={brandStyles.row}><Text style={{ ...brandStyles.cell, ...brandStyles.cellKey }}>Working Hours</Text><Text style={{ ...brandStyles.cell, ...brandStyles.cellVal }}>9:30 AM – 6:30 PM (Mon–Sat)</Text></View>
          <View style={brandStyles.row}><Text style={{ ...brandStyles.cell, ...brandStyles.cellKey }}>Monthly CTC</Text><Text style={{ ...brandStyles.cell, ...brandStyles.cellVal }}>₹ {(m.salary || 0).toLocaleString('en-IN')}</Text></View>
        </View>
        <Text style={brandStyles.body}>
          Your appointment is subject to the terms and conditions set out in the Employment Agreement, Non-Disclosure Agreement and the company's HR policy handbook. You shall maintain strict confidentiality of all company, client and project information during and after the course of your employment.
        </Text>
        <Text style={brandStyles.body}>We look forward to a long and mutually rewarding association.</Text>
        <View style={brandStyles.signBlock}>
          <View style={brandStyles.signCol}><Text style={brandStyles.signLine}>Employee Signature</Text></View>
          <View style={brandStyles.signCol}><Text style={brandStyles.signLine}>For HP ENTERPRISE Safety Service & Man Power Supply</Text><Text style={{ fontSize: 9, color: NAVY, fontFamily: 'Helvetica-Bold', marginTop: 2 }}>Head — Safety & Workforce Management</Text></View>
        </View>
        <Footer />
      </Page>
    </Document>
  )
}

// ============ ID CARD ============
export function IdCardDoc(m: DocMeta) {
  return (
    <Document>
      <Page size="A4" style={{ ...brandStyles.page, paddingTop: 60, paddingBottom: 40 }}>
        <View style={{ alignItems: 'center', marginBottom: 20 }}>
          <Image src={LOGO_PATH} style={{ width: 80, height: 80, objectFit: 'contain', marginBottom: 8 }} />
          <Text style={{ fontSize: 22, fontFamily: 'Helvetica-Bold', color: NAVY }}>HP ENTERPRISE</Text>
          <Text style={{ fontSize: 8, color: GOLD, letterSpacing: 3, fontFamily: 'Helvetica-Bold' }}>EMPLOYEE IDENTITY CARD</Text>
        </View>
        <View style={{ borderWidth: 2, borderColor: NAVY, borderRadius: 10, overflow: 'hidden', marginHorizontal: 80 }}>
          <View style={{ backgroundColor: NAVY, paddingVertical: 14, paddingHorizontal: 18, borderBottomWidth: 2, borderBottomColor: GOLD, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Image src={LOGO_PATH} style={{ width: 28, height: 28, objectFit: 'contain', backgroundColor: '#FFFFFF', borderRadius: 3 }} />
              <Text style={{ color: '#FFFFFF', fontFamily: 'Helvetica-Bold', fontSize: 14 }}>HP ENTERPRISE</Text>
            </View>
            <Text style={{ color: GOLD_LIGHT, fontSize: 7, letterSpacing: 2 }}>OFFICIAL ID</Text>
          </View>
          <View style={{ flexDirection: 'row', padding: 18 }}>
            <View style={{ width: 90, height: 110, backgroundColor: '#F6F7FB', borderWidth: 1, borderColor: LINE, borderRadius: 6, alignItems: 'center', justifyContent: 'center', marginRight: 16 }}>
              <Text style={{ fontSize: 9, color: MUTED, textAlign: 'center' }}>PHOTO</Text>
            </View>
            <View style={{ flex: 1, justifyContent: 'center' }}>
              <Text style={{ fontSize: 16, fontFamily: 'Helvetica-Bold', color: NAVY, marginBottom: 2 }}>{m.fullName}</Text>
              <Text style={{ fontSize: 10, color: GOLD, fontFamily: 'Helvetica-Bold', marginBottom: 8 }}>{m.designation || 'Employee'}</Text>
              <Text style={{ fontSize: 9, color: INK, marginBottom: 2 }}>Code: <Text style={{ fontFamily: 'Helvetica-Bold' }}>{m.employeeCode || '—'}</Text></Text>
              <Text style={{ fontSize: 9, color: INK, marginBottom: 2 }}>Dept: {m.department || '—'}</Text>
              <Text style={{ fontSize: 9, color: INK, marginBottom: 2 }}>Blood: {m.bloodGroup || '—'}</Text>
              <Text style={{ fontSize: 8, color: MUTED, marginTop: 4 }}>{m.mobile || ''}</Text>
            </View>
          </View>
          <View style={{ backgroundColor: NAVY_LIGHT, paddingVertical: 8, paddingHorizontal: 18, borderTopWidth: 1, borderTopColor: GOLD }}>
            <Text style={{ color: GOLD_LIGHT, fontSize: 7, textAlign: 'center', letterSpacing: 1 }}>IF FOUND, PLEASE RETURN TO HP ENTERPRISE Safety Service & Man Power Supply • PLOT 14, TECH PARK PHASE II, WHITEFIELD, BENGALURU 560066</Text>
          </View>
        </View>
        <Text style={{ fontSize: 8, color: MUTED, textAlign: 'center', marginTop: 16, marginHorizontal: 80 }}>
          This card is the property of HP ENTERPRISE Safety Service & Man Power Supply and must be returned upon separation. Valid until employment termination.
        </Text>
        <Footer />
      </Page>
    </Document>
  )
}

// ============ SALARY SLIP ============
export function SalarySlipDoc(m: DocMeta & { month: number; year: number; earnings: any[]; deductions: any[]; netPay: number; gross: number; totalDeductions: number; workingDays: number; presentDays: number; lopDays: number; pfNumber?: string; uan?: string; bankAccount?: string }) {
  const monthName = new Date(m.year, m.month - 1, 1).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
  return (
    <Document>
      <Page size="A4" style={{ ...brandStyles.page, paddingTop: 0 }}>
        <View style={brandStyles.headerBand}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <Image src={LOGO_PATH} style={{ width: 44, height: 44, objectFit: 'contain', backgroundColor: '#FFFFFF', borderRadius: 4, padding: 2 }} />
            <View>
              <Text style={brandStyles.logo}>HP ENTERPRISE</Text>
              <Text style={brandStyles.logoSub}>PAYSLIP • {monthName.toUpperCase()}</Text>
            </View>
          </View>
          <View style={brandStyles.headerRight}>
            <Text style={brandStyles.headerTitle}>Salary Slip</Text>
            <Text style={brandStyles.headerMuted}>{monthName}</Text>
          </View>
        </View>
        <View style={{ ...brandStyles.table, marginBottom: 14 }}>
          <View style={brandStyles.row}>
            <View style={{ ...brandStyles.cell, ...brandStyles.cellKey, width: '50%' }}>Employee Name</View>
            <View style={{ ...brandStyles.cell, ...brandStyles.cellVal, width: '50%' }}>{m.fullName}</View>
          </View>
          <View style={brandStyles.row}>
            <View style={{ ...brandStyles.cell, ...brandStyles.cellKey, width: '50%' }}>Employee Code</View>
            <View style={{ ...brandStyles.cell, ...brandStyles.cellVal, width: '50%' }}>{m.employeeCode || '—'}</View>
          </View>
          <View style={brandStyles.row}>
            <View style={{ ...brandStyles.cell, ...brandStyles.cellKey, width: '50%' }}>Designation / Department</View>
            <View style={{ ...brandStyles.cell, ...brandStyles.cellVal, width: '50%' }}>{m.designation || '—'} / {m.department || '—'}</View>
          </View>
          <View style={brandStyles.rowLast}>
            <View style={{ ...brandStyles.cell, ...brandStyles.cellKey, width: '50%' }}>Pay Period</View>
            <View style={{ ...brandStyles.cell, ...brandStyles.cellVal, width: '50%' }}>{monthName} • W.Days: {m.workingDays} • Present: {m.presentDays} • LOP: {m.lopDays}</View>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1, borderWidth: 1, borderColor: LINE, borderRadius: 4 }}>
            <View style={{ backgroundColor: NAVY, paddingVertical: 6, paddingHorizontal: 10 }}><Text style={{ color: GOLD_LIGHT, fontFamily: 'Helvetica-Bold', fontSize: 9, letterSpacing: 1 }}>EARNINGS</Text></View>
            {m.earnings.map((e: any, i: number) => (
              <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 10, paddingVertical: 6, borderBottomWidth: i === m.earnings.length - 1 ? 0 : 1, borderBottomColor: LINE }}>
                <Text style={{ fontSize: 9.5 }}>{e.label}</Text>
                <Text style={{ fontSize: 9.5, fontFamily: 'Helvetica-Bold' }}>₹ {Number(e.amount).toLocaleString('en-IN')}</Text>
              </View>
            ))}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 10, paddingVertical: 8, backgroundColor: '#F6F7FB' }}>
              <Text style={{ fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: NAVY }}>Gross Earnings</Text>
              <Text style={{ fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: NAVY }}>₹ {m.gross.toLocaleString('en-IN')}</Text>
            </View>
          </View>
          <View style={{ flex: 1, borderWidth: 1, borderColor: LINE, borderRadius: 4 }}>
            <View style={{ backgroundColor: NAVY, paddingVertical: 6, paddingHorizontal: 10 }}><Text style={{ color: GOLD_LIGHT, fontFamily: 'Helvetica-Bold', fontSize: 9, letterSpacing: 1 }}>DEDUCTIONS</Text></View>
            {m.deductions.map((d: any, i: number) => (
              <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 10, paddingVertical: 6, borderBottomWidth: i === m.deductions.length - 1 ? 0 : 1, borderBottomColor: LINE }}>
                <Text style={{ fontSize: 9.5 }}>{d.label}</Text>
                <Text style={{ fontSize: 9.5, fontFamily: 'Helvetica-Bold' }}>₹ {Number(d.amount).toLocaleString('en-IN')}</Text>
              </View>
            ))}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 10, paddingVertical: 8, backgroundColor: '#F6F7FB' }}>
              <Text style={{ fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: NAVY }}>Total Deductions</Text>
              <Text style={{ fontSize: 9.5, fontFamily: 'Helvetica-Bold', color: NAVY }}>₹ {m.totalDeductions.toLocaleString('en-IN')}</Text>
            </View>
          </View>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 14, backgroundColor: NAVY, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 6 }}>
          <Text style={{ color: GOLD_LIGHT, fontFamily: 'Helvetica-Bold', fontSize: 12 }}>NET PAY (In Words)</Text>
          <Text style={{ color: '#FFFFFF', fontFamily: 'Helvetica-Bold', fontSize: 14 }}>₹ {m.netPay.toLocaleString('en-IN')}</Text>
        </View>
        <Text style={{ fontSize: 8, color: MUTED, marginTop: 12 }}>
          UAN: {m.uan || '—'}    •    Bank A/C: {m.bankAccount || '—'}    •    This is a system-generated salary slip and does not require a signature.
        </Text>
        <Footer />
      </Page>
    </Document>
  )
}

// ============ GENERIC LETTER (experience, relieving, confirmation, etc.) ============
export function GenericLetterDoc(m: DocMeta & { docTitle: string; bodyParagraphs: string[]; signatory: string }) {
  return (
    <Document>
      <Page size="A4" style={brandStyles.page}>
        <Header docTitle={m.docTitle} refNo={`HPE/HR/${m.docTitle.replace(/\s/g, '').toUpperCase().slice(0, 6)}/${m.employeeCode || 'APP'}/${new Date().getFullYear()}`} date={today()} />
        <Text style={brandStyles.body}>To,</Text>
        <Text style={brandStyles.body}><Text style={brandStyles.bold}>{m.fullName}</Text>{m.employeeCode ? `\nEmp. Code: ${m.employeeCode}` : ''}</Text>
        <Text style={{ ...brandStyles.body, marginTop: 10 }}>{m.docTitle}</Text>
        <View style={brandStyles.goldRule} />
        {m.bodyParagraphs.map((p, i) => (
          <Text key={i} style={{ ...brandStyles.body, marginBottom: 10 }}>{p}</Text>
        ))}
        <View style={brandStyles.signBlock}>
          <View style={brandStyles.signCol} />
          <View style={brandStyles.signCol}><Text style={brandStyles.signLine}>For HP ENTERPRISE Safety Service & Man Power Supply</Text><Text style={{ fontSize: 9, color: NAVY, fontFamily: 'Helvetica-Bold', marginTop: 2 }}>{m.signatory}</Text></View>
        </View>
        <Footer />
      </Page>
    </Document>
  )
}
