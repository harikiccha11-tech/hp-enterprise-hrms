import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'
import { BRAND, SOCIAL } from '@/lib/constants'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// In-memory conversation store (keyed by userId)
const conversations = new Map<string, { role: string; content: string }[]>()

const SYSTEM_PROMPT = `You are HPAI, the intelligent AI HR assistant powered by HPHRMS — the next-generation AI Human Resource Management Platform by ${BRAND.name}.

Tagline: ${BRAND.tagline}

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
- Website: ${BRAND.website}
- HPHRMS AI Platform: ${BRAND.hphrmsUrl}
- Email: ${SOCIAL.email}
- Business Phone: ${BRAND.phone}
- HR Contact: ${BRAND.hrPhone}
- WhatsApp: ${SOCIAL.whatsapp}
- GSTIN: ${BRAND.gstin}
- UDYAM: ${BRAND.udyam}
- Managing Director: ${BRAND.managingDirector}
- EHS Director: ${BRAND.ehsDirector}
- Head Office: ${BRAND.headOffice.full}
- Branch Office: ${BRAND.branchOffice.full}

Services: HR Management, Recruitment & Talent Acquisition, Manpower Supply, EHS Consultancy, Engineering & Project Support, Construction Labour Supply, Land Survey, Vendor Coordination, Payroll Management, Website Design & Development, Safety Training & Compliance.

Keep responses concise (2-4 sentences max unless asked for details). Be friendly but professional. Use bullet points for lists. If unsure, advise the user to contact HR at ${SOCIAL.email} or call ${BRAND.hrPhone}.`

/** Graceful fallback when all AI providers are down — users should never see a raw error. */
function getFallbackResponse(userMessage: string): string {
  const msg = (userMessage || '').toLowerCase().trim()

  // Greeting patterns
  if (/^(hi|hello|hey|good morning|good afternoon|good evening|howdy|namaste|namaskara)\b/.test(msg)) {
    return 'Hello! 👋 Welcome to HPHRMS. I\'m HPAI, your HR assistant. How can I help you today? You can ask me about leave, payroll, attendance, policies, or any HR-related queries.'
  }

  // Leave related
  if (/leave|holiday|vacation|time.?off|casual.?leave|sick.?leave|earned.?leave|cl|sl|el|pl/.test(msg)) {
    return `For leave-related queries, please reach out to HR at **${BRAND.hrPhone}** or email **${SOCIAL.email}**. You can also check your leave balance and apply through the HPHRMS portal. Would you like information about a specific leave type?`
  }

  // Payroll related
  if (/salary|pay|payroll|pf|esi|tax|payslip|wage|compensation|ctc|deduction/.test(msg)) {
    return `For payroll queries (salary breakdown, PF, ESI, professional tax), please contact HR at **${BRAND.hrPhone}** or email **${SOCIAL.email}**. Salary slips are available on the HPHRMS portal under the ESS section.`
  }

  // Attendance related
  if (/attendance|punch|late|overtime|shift|roster|check.?in|check.?out|biometric/.test(msg)) {
    return `For attendance-related queries (punch-in/out timing, late grace, overtime, shifts), please contact HR at **${BRAND.hrPhone}** or check the HPHRMS portal. Your attendance records are available in the Attendance section.`
  }

  // Document related
  if (/document|letter|certificate|offer|id.?card|experience|salary.?slip/.test(msg)) {
    return `For document requests (offer letters, ID cards, salary slips, experience letters), please reach out to HR at **${SOCIAL.email}** or call **${BRAND.hrPhone}**. Many documents are also available for download from the HPHRMS portal.`
  }

  // Generic helpful fallback
  return `I'm currently experiencing high demand, but I'm still here to help! For immediate assistance, please contact our HR team:\n\n- 📧 **Email:** ${SOCIAL.email}\n- 📞 **Phone:** ${BRAND.hrPhone}\n- 💬 **WhatsApp:** [Chat with us](${SOCIAL.whatsapp})\n\nYou can also explore the HPHRMS portal at [hphrms.com](${BRAND.hphrmsUrl}) for self-service options. Please try asking me again in a moment!`
}

/** Detailed error logging — avoids silently swallowing unknown error shapes */
function logError(label: string, e: unknown) {
  if (e instanceof Error) {
    console.error(`[HPAI] ${label}:`, e.message, '\n', e.stack)
  } else {
    console.error(`[HPAI] ${label}:`, JSON.stringify(e, null, 2))
  }
}

/** Add a timeout to any promise */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms),
    ),
  ])
}

/* ─── Z.ai SDK (primary — always available locally, with retry) ─── */
async function callZai(messages: { role: string; content: string }[]): Promise<string> {
  let ZAI: any
  try {
    // @ts-expect-error z-ai-web-dev-sdk dynamic import
    const mod = await import('z-ai-web-dev-sdk')
    ZAI = (mod as any).default || mod
  } catch (importErr) {
    logError('Z.ai SDK import failed', importErr)
    throw new Error('Z.ai SDK could not be imported')
  }

  if (typeof ZAI?.create !== 'function') {
    throw new Error('Z.ai SDK: create() function not found on module')
  }

  // Retry up to 3 times with exponential backoff + jitter
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const zai = await withTimeout(ZAI.create(), 10000, 'ZAI.create()')

      if (!zai?.chat?.completions?.create) {
        throw new Error('Z.ai SDK: chat.completions.create not available on instance')
      }

      const completion = await withTimeout(
        zai.chat.completions.create({
          messages,
        }),
        30000,
        'Z.ai chat completion',
      )

      const text = completion?.choices?.[0]?.message?.content
      if (text && text.trim().length > 0) return text.trim()
      throw new Error('Empty response from Z.ai')
    } catch (e) {
      logError(`Z.ai attempt ${attempt + 1}/3 failed`, e)
      if (attempt === 2) throw e
      // Exponential backoff: 1s, 2s
      const delay = Math.min(1000 * Math.pow(2, attempt), 3000) + Math.random() * 500
      await new Promise((r) => setTimeout(r, delay))
    }
  }
  throw new Error('Z.ai SDK failed after all retries')
}

/* ─── Gemini direct API (fallback) ─── */
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

  const models = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro']

  for (const model of models) {
    try {
      const url =
        'https://generativelanguage.googleapis.com/v1beta/models/' +
        model +
        ':generateContent?key=' +
        apiKey
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
    } catch (e) {
      logError(`Gemini model ${model} failed`, e)
      continue
    }
  }
  throw new Error('All Gemini models failed')
}

/* ─── POST handler ─── */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req)

  // Rate limit check
  if (!checkRateLimit(`chat:${ip}`, 30, 60 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many chat requests. Please try again later.' }, { status: 429 })
  }

  // Require authentication for AI chat
  let userId: string
  try {
    const cu = await getCurrentUser()
    if (!cu?.user?.id) {
      return NextResponse.json({ error: 'Authentication required for AI chat' }, { status: 401 })
    }
    userId = cu.user.id
  } catch {
    return NextResponse.json({ error: 'Authentication required for AI chat' }, { status: 401 })
  }

  try {
    const { message } = await req.json()
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }
    if (message.length > 2000) {
      return NextResponse.json({ error: 'Message too long' }, { status: 400 })
    }

    let history = conversations.get(userId) || [
      { role: 'assistant', content: SYSTEM_PROMPT },
    ]
    history.push({ role: 'user', content: message.trim() })
    if (history.length > 21) {
      history = [history[0], ...history.slice(-20)]
    }

    // Convert system→assistant format for z-ai-web-dev-sdk compatibility
    const sdkMessages = history.map((m) => ({
      role: m.role === 'system' ? 'assistant' : m.role,
      content: m.content,
    }))

    let aiResponse: string | undefined
    let usedFallback = false

    // Strategy 1: Z.ai SDK (primary)
    try {
      aiResponse = await callZai(sdkMessages)
    } catch (e) {
      logError('Z.ai primary failed', e)
    }

    // Strategy 2: Gemini direct (fallback — only if API key is configured)
    if (!aiResponse && process.env.GEMINI_API_KEY) {
      try {
        aiResponse = await callGemini(sdkMessages)
      } catch (e) {
        logError('Gemini fallback failed', e)
      }
    }

    // Strategy 3: Graceful hardcoded fallback — users should NEVER see an error
    if (!aiResponse) {
      console.warn('[HPAI] All AI providers failed, using hardcoded fallback response')
      aiResponse = getFallbackResponse(message)
      usedFallback = true
    }

    // Clean up markdown fences
    aiResponse = aiResponse
      .replace(/^```(?:markdown|text)?\n?/i, '')
      .replace(/\n?```$/i, '')
      .trim()

    history.push({ role: 'assistant', content: aiResponse })
    conversations.set(userId, history)

    return NextResponse.json({ response: aiResponse, fallback: usedFallback || undefined })
  } catch (e: unknown) {
    logError('Unhandled error in POST handler', e)
    return NextResponse.json({ error: 'AI service unavailable' }, { status: 503 })
  }
}

export async function DELETE() {
  try {
    const cu = await getCurrentUser()
    if (cu?.user?.id) conversations.delete(cu.user.id)
    else conversations.delete('anonymous-visitor')
  } catch {
    conversations.delete('anonymous-visitor')
  }
  return NextResponse.json({ ok: true })
}
