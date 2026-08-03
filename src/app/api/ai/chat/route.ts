import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// In-memory conversation store (simple Map keyed by userId)
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

/** Call Gemini API directly via fetch */
async function callGemini(messages: { role: string; content: string }[]): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured')

  // Convert messages to Gemini format
  const geminiContents = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }))

  const systemInstruction = messages.find((m) => m.role === 'system')

  const body: Record<string, unknown> = {
    contents: geminiContents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1024,
    },
  }
  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction.content }] }
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000), // 15s timeout
  })

  if (!res.ok) {
    const errBody = await res.text()
    console.error('Gemini API error:', res.status, errBody)
    throw new Error(`Gemini API returned ${res.status}`)
  }

  const data = await res.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('No response text from Gemini')
  return text
}

/** Call Z.ai SDK (only works inside Z.ai sandbox) */
async function callZai(messages: { role: string; content: string }[]): Promise<string> {
  const ZAI = (await import('z-ai-web-dev-sdk')).default
  const zai = await ZAI.create()
  const completion = await zai.chat.completions.create({
    messages,
    thinking: { type: 'disabled' },
  })
  return completion.choices[0]?.message?.content || 'No response from AI.'
}

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

    // Keep last 20 messages (10 turns) to avoid token limits
    if (history.length > 21) {
      history = [history[0], ...history.slice(-20)]
    }

    let aiResponse: string | undefined
    let lastError: Error | undefined

    // Strategy 1: Gemini API (works on Vercel and everywhere)
    if (process.env.GEMINI_API_KEY) {
      try {
        aiResponse = await callGemini(history)
        console.log('[HPAI] Response via Gemini')
      } catch (e) {
        lastError = e as Error
        console.error('[HPAI] Gemini failed:', lastError?.message)
      }
    }

    // Strategy 2: Z.ai SDK (only works inside Z.ai sandbox)
    if (!aiResponse) {
      try {
        aiResponse = await callZai(history)
        console.log('[HPAI] Response via Z.ai')
      } catch (e) {
        lastError = e as Error
        console.error('[HPAI] Z.ai failed:', lastError?.message)
      }
    }

    if (!aiResponse) {
      console.error('[HPAI] All providers failed')
      return NextResponse.json(
        { error: 'AI service unavailable. Please try again later.' },
        { status: 503 }
      )
    }

    // Clean up response - remove markdown code blocks if model wraps in them
    aiResponse = aiResponse
      .replace(/^```(?:markdown|text)?\n?/i, '')
      .replace(/\n?```$/i, '')
      .trim()

    history.push({ role: 'assistant', content: aiResponse })
    conversations.set(userId, history)

    return NextResponse.json({ response: aiResponse })
  } catch (e: unknown) {
    console.error('HPAI error:', e)
    return NextResponse.json({ error: 'AI service unavailable' }, { status: 503 })
  }
}

export async function DELETE() {
  const cu = await getCurrentUser()
  if (!cu) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (cu.user.id) conversations.delete(cu.user.id)
  return NextResponse.json({ ok: true })
}
