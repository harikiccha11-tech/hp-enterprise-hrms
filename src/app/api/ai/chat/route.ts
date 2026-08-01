import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import ZAI from 'z-ai-web-dev-sdk'

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
      { role: 'assistant', content: SYSTEM_PROMPT },
    ]

    history.push({ role: 'user', content: message.trim() })

    // Keep last 20 messages (10 turns) to avoid token limits
    if (history.length > 21) {
      history = [history[0], ...history.slice(-20)]
    }

    const zai = await ZAI.create()
    const completion = await zai.chat.completions.create({
      messages: history,
      thinking: { type: 'disabled' },
    })

    const aiResponse = completion.choices[0]?.message?.content || 'Sorry, I could not process your request.'
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
