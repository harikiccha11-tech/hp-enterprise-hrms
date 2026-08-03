import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// In-memory conversation store (keyed by userId)
const conversations = new Map<string, { role: string; content: string }[]>()

const SYSTEM_PROMPT = `You are HPAI, the intelligent HR assistant for HP ENTERPRISE Safety Service & Man Power Supply. You help with:
- Leave policies, balances, and application procedures
- Payroll queries (salary breakdown, PF, ESI, professional tax)
- Attendance rules (punch-in/out timing, late grace, overtime)
- Document requests (offer letters, ID cards, salary slips, experience letters)
- Company policies and procedures
- Safety compliance and EHS requirements
- Project assignments and client coordination

Keep responses concise (2-4 sentences max unless asked for details). Be friendly but professional. Use bullet points for lists. If unsure, advise the user to contact HR at hr@hpenterprise.co.in.`

/* ─── Gemini direct API (primary — works everywhere) ─── */
async function callGemini(messages: { role: string; content: string }[]): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured')

  const geminiContents = messages
    .filter(function (m) { return m.role !== 'system' })
    .map(function (m) {
      return { role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }
    })
  const systemInstruction = messages.find(function (m) { return m.role === 'system' })

  const body: Record<string, unknown> = {
    contents: geminiContents,
    generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
  }
  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction.content }] }
  }

  const url =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=' +
    apiKey

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  })

  if (!res.ok) {
    const errBody = await res.text()
    throw new Error('Gemini ' + res.status + ': ' + errBody.slice(0, 200))
  }

  const data = await res.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('No response from Gemini')
  return text
}

/* ─── Vercel AI Gateway (fallback) ─── */
const GATEWAY_MODELS = [
  'google/gemini-2.0-flash-001',
  'google/gemini-2.0-flash',
  'openai/gpt-4o-mini',
  'openai/gpt-4o',
]

async function callGateway(messages: { role: string; content: string }[]): Promise<string> {
  const apiKey = process.env.AI_GATEWAY_API_KEY
  if (!apiKey) throw new Error('AI_GATEWAY_API_KEY not configured')

  let lastErr: Error | undefined
  for (const model of GATEWAY_MODELS) {
    try {
      const res = await fetch('https://gateway.ai.vercel.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + apiKey,
        },
        body: JSON.stringify({ model, messages, temperature: 0.7, max_tokens: 1024 }),
        signal: AbortSignal.timeout(20000),
      })
      if (res.status === 404 || res.status === 400) continue
      if (!res.ok) {
        const errBody = await res.text()
        throw new Error('Gateway ' + res.status + ': ' + errBody.slice(0, 200))
      }
      const data = await res.json()
      const text = data?.choices?.[0]?.message?.content
      if (!text) throw new Error('Empty response')
      return text
    } catch (e) {
      lastErr = e as Error
      continue
    }
  }
  throw lastErr || new Error('All gateway models failed')
}

/* ─── Z.ai SDK (local sandbox only) ─── */
async function callZai(messages: { role: string; content: string }[]): Promise<string> {
  const ZAI = (await import('z-ai-web-dev-sdk')).default
  const zai = await ZAI.create()
  const completion = await zai.chat.completions.create({ messages, thinking: { type: 'disabled' } })
  return completion.choices[0]?.message?.content || 'No response from AI.'
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
    const isVercel = typeof process.env.VERCEL !== 'undefined'

    // Strategy 1: Gemini direct (primary — works everywhere)
    if (!aiResponse && process.env.GEMINI_API_KEY) {
      try {
        aiResponse = await callGemini(history)
        console.log('[HPAI] Response via Gemini')
      } catch (e) {
        lastError = e as Error
        console.error('[HPAI] Gemini failed:', lastError?.message)
      }
    }

    // Strategy 2: Vercel AI Gateway (fallback)
    if (!aiResponse && process.env.AI_GATEWAY_API_KEY) {
      try {
        aiResponse = await callGateway(history)
        console.log('[HPAI] Response via Gateway')
      } catch (e) {
        lastError = e as Error
        console.error('[HPAI] Gateway failed:', lastError?.message)
      }
    }

    // Strategy 3: Z.ai SDK (local only)
    if (!aiResponse && !isVercel) {
      try {
        aiResponse = await callZai(history)
        console.log('[HPAI] Response via Z.ai')
      } catch (e) {
        lastError = e as Error
        console.error('[HPAI] Z.ai failed:', lastError?.message)
      }
    }

    if (!aiResponse) {
      console.error('[HPAI] All providers failed:', lastError?.message)
      return NextResponse.json(
        { error: 'AI service unavailable. Please try again later.', debug: lastError?.message },
        { status: 503 },
      )
    }

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

/* ─── Debug endpoint ─── */
export async function GET() {
  const isVercel = typeof process.env.VERCEL !== 'undefined'
  const hasGemini = !!process.env.GEMINI_API_KEY
  const hasGateway = !!process.env.AI_GATEWAY_API_KEY
  let geminiTest = 'not tested'
  let geminiGenTest = 'not tested'
  if (hasGemini) {
    try {
      const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest?key=' + process.env.GEMINI_API_KEY, { signal: AbortSignal.timeout(10000) })
      geminiTest = 'status ' + res.status + (res.ok ? ' (available)' : ' (error)')
    } catch (e) { geminiTest = 'error: ' + (e as Error).message }
    // Test actual generation
    try {
      const genRes = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=' + process.env.GEMINI_API_KEY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: 'Say hi' }] }], generationConfig: { maxOutputTokens: 10 } }),
        signal: AbortSignal.timeout(15000),
      })
      const genData = await genRes.json()
      const genText = genData?.candidates?.[0]?.content?.parts?.[0]?.text
      geminiGenTest = genRes.ok ? ('OK: ' + (genText || 'empty')) : ('ERR ' + genRes.status + ': ' + JSON.stringify(genData?.error || {}).slice(0, 200))
    } catch (e) { geminiGenTest = 'error: ' + (e as Error).message }
  }
  return NextResponse.json({ isVercel, hasGemini, hasGateway, geminiTest, geminiGenTest })
}
