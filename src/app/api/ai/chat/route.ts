import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// In-memory conversation store (keyed by userId)
const conversations = new Map<string, { role: string; content: string }[]>()

const SYSTEM_PROMPT = `You are HPAI, the intelligent AI HR assistant powered by HPHRMS — the next-generation AI Human Resource Management Platform by HP ENTERPRISE.

Tagline: Building Safer Tomorrow. Empowering Smarter Workplaces.

You help with:
- Leave policies, balances, and application procedures
- Payroll queries (salary breakdown, PF, ESI, professional tax)
- Attendance rules (punch-in/out timing, late grace, overtime)
- Document requests (offer letters, ID cards, salary slips, experience letters)
- Company policies and procedures
- Safety compliance and EHS requirements
- Project assignments and client coordination
- Recruitment and onboarding help
- HPHRMS features: AI HR Assistant, Employee Management, Recruitment & ATS, Attendance, Leave, Payroll, ESS, Shift & Roster, Document Management, Reports & Analytics

Company info:
- Website: https://hpserve.site
- HPHRMS AI Platform: https://hphrms.com
- Email: hpenterpriseofficial11@gmail.com
- Business Phone: +91 80737 48271
- HR Contact: +91 73377 92436
- WhatsApp: https://wa.me/message/65PDYODAFJZAN1
- GSTIN: 29ANZPH4067Q1ZS
- UDYAM: UDYAM-KR-10-0014648
- Managing Director: Hariprasad N P
- EHS Director: Rajesh S
- Head Office: JeevaGurunadan Building, Kalkere Market Road, Ramamurthy Nagar, Bengaluru – 560016, Karnataka, India
- Branch Office: Venkateshwara Nilaya Building, Behind Hanuman Mandir, Nagenahalli, Hosadurga Taluk, Chitradurga – 577515, Karnataka, India

Services: HR Management, Recruitment & Talent Acquisition, Manpower Supply, EHS Consultancy, Engineering & Project Support, Construction Labour Supply, Land Survey, Vendor Coordination, Payroll Management, Website Design & Development, Safety Training & Compliance.

Keep responses concise (2-4 sentences max unless asked for details). Be friendly but professional. Use bullet points for lists. If unsure, advise the user to contact HR at hpenterpriseofficial11@gmail.com or call +91 73377 92436.`

/* ─── Z.ai SDK (primary — always available locally, with retry) ─── */
async function callZai(messages: { role: string; content: string }[]): Promise<string> {
  const ZAI = (await import('z-ai-web-dev-sdk')).default
  // Retry up to 2 times with delay
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const zai = await ZAI.create()
      const completion = await zai.chat.completions.create({
        messages,
        thinking: { type: 'disabled' },
      })
      const text = completion.choices[0]?.message?.content
      if (text) return text
      throw new Error('Empty response from Z.ai')
    } catch (e) {
      console.error(`[HPAI] Z.ai attempt ${attempt + 1} failed:`, (e as Error)?.message)
      if (attempt === 1) throw e
      await new Promise((r) => setTimeout(r, 1000))
    }
  }
  throw new Error('Z.ai SDK failed after retries')
}

/* ─── Gemini direct API (fallback for Vercel) ─── */
async function callGemini(messages: { role: string; content: string }[]): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured')

  const geminiContents = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))
  const systemInstruction = messages.find((m) => m.role === 'system')

  const body: Record<string, unknown> = {
    contents: geminiContents,
    generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
  }
  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction.content }] }
  }

  // Try multiple model names
  const models = [
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-1.5-pro',
    'gemini-pro',
  ]

  for (const model of models) {
    try {
      const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + apiKey
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15000),
      })
      if (res.status === 404 || res.status === 400) continue
      if (!res.ok) {
        const errBody = await res.text()
        throw new Error('Gemini ' + res.status + ': ' + errBody.slice(0, 200))
      }
      const data = await res.json()
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
      if (text) return text
    } catch {
      continue
    }
  }
  throw new Error('All Gemini models failed')
}

/* ─── POST handler ─── */
export async function POST(req: NextRequest) {
  const cu = await getCurrentUser()
  if (!cu) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { message } = await req.json()
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }
    if (message.length > 2000) {
      return NextResponse.json({ error: 'Message too long' }, { status: 400 })
    }

    const userId = cu.user.id
    let history = conversations.get(userId) || [
      { role: 'system', content: SYSTEM_PROMPT },
    ]
    history.push({ role: 'user', content: message.trim() })
    if (history.length > 21) {
      history = [history[0], ...history.slice(-20)]
    }

    let aiResponse: string | undefined
    let lastError: Error | undefined

    // Strategy 1: Z.ai SDK (always available locally)
    try {
      aiResponse = await callZai(history)
    } catch (e) {
      lastError = e as Error
      console.error('[HPAI] Z.ai failed:', lastError?.message)
    }

    // Strategy 2: Gemini direct (fallback for Vercel)
    if (!aiResponse && process.env.GEMINI_API_KEY) {
      try {
        aiResponse = await callGemini(history)
      } catch (e) {
        lastError = e as Error
        console.error('[HPAI] Gemini failed:', lastError?.message)
      }
    }

    if (!aiResponse) {
      console.error('[HPAI] All providers failed')
      return NextResponse.json(
        { error: 'AI service is temporarily unavailable. Please try again in a moment.' },
        { status: 503 },
      )
    }

    // Clean up markdown fences
    aiResponse = aiResponse.replace(/^```(?:markdown|text)?\n?/i, '').replace(/\n?```$/i, '').trim()
    history.push({ role: 'assistant', content: aiResponse })
    conversations.set(userId, history)
    return NextResponse.json({ response: aiResponse })
  } catch (e: unknown) {
    console.error('[HPAI] Unhandled error:', e)
    return NextResponse.json({ error: 'AI service unavailable' }, { status: 503 })
  }
}

export async function DELETE() {
  const cu = await getCurrentUser()
  if (!cu) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (cu.user.id) conversations.delete(cu.user.id)
  return NextResponse.json({ ok: true })
}
