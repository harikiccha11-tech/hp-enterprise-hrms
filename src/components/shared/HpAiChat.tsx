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

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

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
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to get response')
      }
      const data = await res.json()
      setMessages((prev) => [...prev, { role: 'assistant', content: data.response }])
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: t('hpai.error', lang) }])
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

  const welcomeText = t('hpai.welcome', lang)

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setHpaiOpen(!hpaiOpen)}
        aria-label={t('hpai.title', lang)}
        className={cn(
          'fixed bottom-20 right-4 z-50 grid h-14 w-14 place-items-center rounded-full shadow-lg transition-all duration-300 hover:scale-105 active:scale-95',
          'bg-gradient-to-br from-[var(--navy)] to-[var(--navy-light)]',
          !hpaiOpen && 'animate-hpai-pulse'
        )}
      >
        <Sparkles className="h-6 w-6 text-[var(--gold)]" />
      </button>

      {/* Chat panel */}
      {hpaiOpen && (
        <div className="fixed bottom-36 right-4 z-50 flex w-[calc(100vw-2rem)] max-w-[380px] flex-col overflow-hidden rounded-2xl border bg-card shadow-xl sm:w-[380px]">
          {/* Header */}
          <div className="flex items-center justify-between bg-gradient-to-r from-[var(--navy)] to-[var(--navy-light)] px-4 py-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[var(--gold)]" />
              <h2 className="text-sm font-bold text-white">{t('hpai.title', lang)}</h2>
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
              <div className="text-[13px] text-muted-foreground whitespace-pre-wrap leading-relaxed">
                {renderMd(welcomeText)}
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
