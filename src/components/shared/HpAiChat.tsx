'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import { t } from '@/lib/i18n'
import { Sparkles, X, Send, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

/* ═══ Role-specific HPAI configuration ═══ */

const ROLE_WELCOME: Record<string, string> = {
  OWNER: 'Welcome! I am **HPAI** - your executive AI assistant. I can help with company analytics, workforce planning, revenue data, security reports, and system configuration. How can I assist you?',
  SUPER_ADMIN: 'Welcome! I am **HPAI** - your platform AI command center. I can help with multi-tenant management, revenue analytics, AI model management, white-label config, and platform-wide analytics. What would you like to explore?',
  HR_MANAGER: 'Welcome! I am **HPAI** - your HR command center AI. I can help with recruitment summaries, payroll validation, leave and attendance management, HR analytics, and performance reviews. How can I help you today?',
  EMPLOYEE: 'Welcome! I am **HPAI** - the best AI for HR and workforce management. I can help with leave policies, payroll queries, attendance rules, document requests, and company policies. How can I help you today?',
  CLIENT: 'Welcome! I am **HPAI** - your client portal AI assistant. I can help with workforce analytics, subscription and billing queries, project status, invoices, and service recommendations. How can I assist you today?',
  CANDIDATE: 'Welcome! I am **HPAI** - your AI career assistant. I can help with job matching, resume review, interview preparation, salary negotiation, and company research. How can I help you land your dream job?',
}

const ROLE_QUICK_ACTIONS: Record<string, { label: string; prompt: string }[]> = {
  OWNER: [
    { label: '📊 Company KPIs', prompt: 'Show me the key company KPIs and metrics for this month' },
    { label: '💰 Revenue Report', prompt: 'Generate a revenue summary for the current quarter' },
    { label: '👥 Workforce Overview', prompt: 'Give me a workforce headcount and deployment summary' },
    { label: '⚠️ Compliance Check', prompt: 'Run a compliance status check across all departments' },
  ],
  SUPER_ADMIN: [
    { label: '📈 Platform Stats', prompt: 'Show platform-wide statistics: total companies, users, API usage' },
    { label: '💰 MRR Report', prompt: 'Generate a monthly recurring revenue report with trends' },
    { label: '🤖 AI Usage', prompt: 'Show AI usage analytics across all tenants' },
    { label: '🏢 Pending Approvals', prompt: 'List all pending company approval requests' },
  ],
  HR_MANAGER: [
    { label: '📋 Recruitment Summary', prompt: 'Give me a summary of open positions and candidate pipeline' },
    { label: '💰 Payroll Validation', prompt: 'Validate this month\'s payroll for any discrepancies' },
    { label: '📊 Attendance Report', prompt: 'Generate an attendance summary for this week' },
    { label: '🎯 Performance', prompt: 'Show upcoming performance reviews and their status' },
  ],
  EMPLOYEE: [
    { label: '💰 Explain Payslip', prompt: 'Explain my latest payslip breakdown and deductions' },
    { label: '📋 Leave Balance', prompt: 'What is my current leave balance for all types?' },
    { label: '⏰ Attendance', prompt: 'Show my attendance summary for this month' },
    { label: '📄 Company Policy', prompt: 'What is the company policy on working from home?' },
  ],
  CLIENT: [
    { label: '👥 Workforce', prompt: 'Show workforce analytics for my deployed team' },
    { label: '💳 Subscription', prompt: 'What is my current subscription plan and usage?' },
    { label: '📊 Project Status', prompt: 'Give me a status update on all active projects' },
    { label: '📄 Invoice', prompt: 'Show my recent invoices and payment status' },
  ],
  CANDIDATE: [
    { label: '📝 Resume Tips', prompt: 'Review my resume and suggest improvements for a better chance' },
    { label: '🎤 Interview Prep', prompt: 'Give me tips for preparing for a technical interview' },
    { label: '💰 Salary Guide', prompt: 'What salary should I negotiate for my experience level?' },
    { label: '🎯 Job Match', prompt: 'What jobs match my skills and experience?' },
  ],
}

/** Render simple markdown: **bold** and bullet lines */
function renderMd(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>
    }
    return <span key={i}>{part}</span>
  })
}

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user'
  return (
    <div className={cn('flex w-full', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap break-words',
          isUser
            ? 'bg-[var(--navy)] text-white rounded-br-md'
            : 'bg-muted text-foreground rounded-bl-md'
        )}
      >
        {renderMd(msg.content)}
      </div>
    </div>
  )
}

export function HpAiChat() {
  const hpaiOpen = useAppStore((s) => s.hpaiOpen)
  const setHpaiOpen = useAppStore((s) => s.setHpaiOpen)
  const lang = useAppStore((s) => s.lang)
  const user = useAppStore((s) => s.user)
  const role = user?.role || 'EMPLOYEE'

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Role-specific quick actions
  const quickActions = ROLE_QUICK_ACTIONS[role] || ROLE_QUICK_ACTIONS.EMPLOYEE
  const welcomeText = ROLE_WELCOME[role] || ROLE_WELCOME.EMPLOYEE

  // Reset messages when panel opens
  useEffect(() => {
    if (hpaiOpen) {
      setMessages([])
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [hpaiOpen])

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, loading])

  const handleSend = useCallback(async () => {
    const trimmed = input.trim()
    if (!trimmed || loading) return

    const userMsg: Message = { role: 'user', content: trimmed }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed }),
        credentials: 'include',
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to get response')
      }
      const data = await res.json()
      setMessages((prev) => [...prev, { role: 'assistant', content: data.response }])
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setMessages((prev) => [...prev, { role: 'assistant', content: `⚠️ ${t('hpai.error', lang)}\n\n(${msg})` }])
    } finally {
      setLoading(false)
    }
  }, [input, loading, lang])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleClear = async () => {
    setMessages([])
    try {
      await fetch('/api/ai/chat', { method: 'DELETE' })
    } catch {}
  }

  const handleQuickAction = (prompt: string) => {
    setInput(prompt)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setHpaiOpen(!hpaiOpen)}
        aria-label="HPAI — Best AI Assistant"
        title="HPAI — Best AI Assistant"
        className={cn(
          'fixed bottom-20 right-4 z-[90] flex flex-col items-center justify-center gap-0.5 rounded-2xl shadow-lg transition-all duration-300 hover:scale-105 active:scale-95 px-2 py-2.5 sm:gap-1',
          'bg-gradient-to-br from-[var(--navy)] to-[var(--navy-light)]',
          !hpaiOpen && 'animate-hpai-pulse'
        )}
      >
        <Sparkles className="h-5 w-5 text-[var(--gold)]" />
        <span className="text-[9px] font-black tracking-wider text-[var(--gold)] leading-none">HPAI</span>
      </button>

      {/* Chat panel */}
      {hpaiOpen && (
        <div role="dialog" aria-label="HPAI — Best AI Assistant chat" className="fixed bottom-40 right-4 z-[90] flex w-[calc(100vw-2rem)] max-w-[400px] flex-col overflow-hidden rounded-2xl border bg-card shadow-xl sm:w-[400px]">
          {/* Header */}
          <div className="flex items-center justify-between bg-gradient-to-r from-[var(--navy)] to-[var(--navy-light)] px-4 py-3.5">
            <div className="flex items-center gap-2.5">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--gold)]/20">
                <Sparkles className="h-4 w-4 text-[var(--gold)]" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white leading-tight">HPAI</h2>
                <p className="text-[10px] font-medium text-[var(--gold-light)] leading-tight">Best AI for HR & Workforce</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleClear}
                className="grid h-7 w-7 place-items-center rounded-md text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                aria-label="Clear chat"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setHpaiOpen(false)}
                className="grid h-7 w-7 place-items-center rounded-md text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                aria-label="Close chat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages area */}
          <div
            ref={scrollRef}
            className="flex-1 max-h-[340px] overflow-y-auto scroll-thin px-4 py-3 space-y-3"
          >
            {messages.length === 0 && (
              <div className="space-y-3">
                <div className="text-[13px] text-muted-foreground whitespace-pre-wrap leading-relaxed">
                  {renderMd(welcomeText)}
                </div>
                {quickActions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {quickActions.map((action) => (
                      <button
                        key={action.label}
                        onClick={() => handleQuickAction(action.prompt)}
                        className="rounded-full border bg-background px-2.5 py-1 text-[11px] font-medium text-[var(--navy)] hover:bg-[var(--gold)]/10 hover:border-[var(--gold)]/40 transition-colors"
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {messages.map((msg, i) => (
              <MessageBubble key={i} msg={msg} />
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-md bg-muted px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-[var(--navy)] dark:bg-[var(--gold)] animate-bounce [animation-delay:0ms]" />
                    <span className="h-2 w-2 rounded-full bg-[var(--navy)] dark:bg-[var(--gold)] animate-bounce [animation-delay:150ms]" />
                    <span className="h-2 w-2 rounded-full bg-[var(--navy)] dark:bg-[var(--gold)] animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input area */}
          <div className="border-t px-3 py-2.5">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('hpai.placeholder', lang)}
                rows={1}
                className="flex-1 resize-none rounded-xl border bg-background px-3 py-2 text-[13px] leading-snug outline-none focus:ring-2 focus:ring-[var(--gold)]/50 max-h-20 min-h-[36px]"
                style={{ fieldSizing: 'content' } as React.CSSProperties}
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[var(--navy)] text-white disabled:opacity-40 hover:opacity-90 transition-opacity"
                aria-label="Send message"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
