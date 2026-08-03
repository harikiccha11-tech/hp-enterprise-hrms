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

/* ─── Models to try on the Vercel AI Gateway (in priority order) ─── */
const GATEWAY_MODELS = [
  'google/gemini-2.0-flash-001',
  'google/gemini-2.0-flash',
  'google/gemini-3.6-flash',
  'openai/gpt-4o-mini',
  'openai/gpt-4o',
  'openai/gpt-5.4',
]

/* ─── Vercel AI Gateway (primary — works on Vercel & everywhere) ─── */
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
        body: JSON.stringify({
          model,
          messages,
          temperature: 0.7,
          max_tokens: 1024,
        }),
        signal: AbortSignal.timeout(20000),
      })

      if (res.status === 404 || res.status === 400) {
        const errBody = await res.text()
        console.warn('[HPAI] Gateway model ' + model + ' failed (' + res.status + '):', errBody.slice(0, 200))
        continue
      }

      if (!res.ok) {
        const errBody = await res.text()
        throw new Error('Gateway ' + res.status + ': ' + errBody.slice(0, 300))
      }

      const data = await res.json()
      const text = data?.choices?.[0]?.message?.content
      if (!text) throw new Error('Empty response from gateway')
      console.log('[HPAI] Gateway success via model:', model)
      return text
    } catch (e) {
      lastErr = e as Error
      console.warn('[HPAI] Gateway model ' + model + ' failed:', lastErr.message)
      // Only continue on 404/400 — other errors mean the gateway itself is broken
      const msg = lastErr.message || ''
      if (msg.includes('404') || msg.includes('400') || msg.includes('not available') || msg.includes('not found')) {
        continue
      }
      // For auth/network/timeout errors, still try next model
      continue
    }
  }
  throw lastErr || new Error('All gateway models failed')
}

/* ─── Gemini direct (fallback — needs valid GEMINI_API_KEY) ─── */
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
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' +
    apiKey

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  })

  if (!res.ok) {
    const errBody = await res.text()
    console.error('[HPAI] Gemini error:', res.status, errBody)
    throw new Error('Gemini returned ' + res.status + ': ' + errBody.slice(0, 200))
  }

  const data = await res.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('No response from Gemini')
  return text
}

/* ─── Z.ai SDK (only works in Z.ai sandbox, NOT on Vercel) ─── */
async function callZai(messages: { role: string; content: string }[]): Promise<string> {
  const ZAI = (await import('z-ai-web-dev-sdk')).default
  const zai = await ZAI.create()
  const completion = await zai.chat.completions.create({
    messages,
    thinking: { type: 'disabled' },
  })
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

    // Keep last 20 messages (10 turns) to stay within token limits
    if (history.length > 21) {
      history = [history[0], ...history.slice(-20)]
    }

    let aiResponse: string | undefined
    let lastError: Error | undefined
    const isVercel = typeof process.env.VERCEL !== 'undefined'

    // Strategy 1: Vercel AI Gateway (works everywhere, primary on Vercel)
    if (!aiResponse && process.env.AI_GATEWAY_API_KEY) {
      try {
        aiResponse = await callGateway(history)
      } catch (e) {
        lastError = e as Error
        console.error('[HPAI] Gateway failed:', lastError?.message)
      }
    }

    // Strategy 2: Gemini direct API (fallback if gateway key missing / fails)
    if (!aiResponse && process.env.GEMINI_API_KEY) {
      try {
        aiResponse = await callGemini(history)
        console.log('[HPAI] Response via Gemini direct')
      } catch (e) {
        lastError = e as Error
        console.error('[HPAI] Gemini failed:', lastError?.message)
      }
    }

    // Strategy 3: Z.ai SDK (Z.ai sandbox only — will fail on Vercel)
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

    // Clean up response — strip markdown code block wrappers
    aiResponse = aiResponse
      .replace(/^```(?:markdown|text)?\n?/i, '')
      .replace(/\n?```$/i, '')
      .trim()

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

/* ─── Debug endpoint (GET) ─── */
export async function GET() {
  const isVercel = typeof process.env.VERCEL !== 'undefined'
  const hasGatewayKey = !!process.env.AI_GATEWAY_API_KEY
  const hasGeminiKey = !!process.env.GEMINI_API_KEY
  const gatewayKeyPrefix = hasGatewayKey ? process.env.AI_GATEWAY_API_KEY!.slice(0, 8) + '...' : 'not set'
  const geminiKeyPrefix = hasGeminiKey ? process.env.GEMINI_API_KEY!.slice(0, 6) + '...' : 'not set'

  // Quick gateway test
  let gatewayTest = 'not tested'
  if (hasGatewayKey) {
    try {
      const res = await fetch('https://gateway.ai.vercel.com/v1/models', {
        headers: { Authorization: 'Bearer ' + process.env.AI_GATEWAY_API_KEY },
        signal: AbortSignal.timeout(10000),
      })
      gatewayTest = 'status ' + res.status + (res.ok ? ' (connected)' : ' (failed)')
      if (res.ok) {
        const data = await res.json()
        const models = (data?.data || []).slice(0, 5).map(function (m: any) { return m.id })
        gatewayTest += ' — models: ' + JSON.stringify(models)
      }
    } catch (e) {
      gatewayTest = 'error: ' + (e as Error).message
    }
  }

  return NextResponse.json({
    isVercel,
    env: {
      AI_GATEWAY_API_KEY: gatewayKeyPrefix,
      GEMINI_API_KEY: geminiKeyPrefix,
    },
    gatewayTest,
  })
}
