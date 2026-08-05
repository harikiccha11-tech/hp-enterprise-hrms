'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { BRAND } from '@/lib/constants'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Mail, Loader2, Sparkles } from 'lucide-react'
import { FollowUs } from './FollowUs'

export interface NewsletterSectionProps {
  variant?: 'dark' | 'light'
  className?: string
}

export function NewsletterSection({ variant = 'dark', className }: NewsletterSectionProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [loading, setLoading] = useState(false)

  const isDark = variant === 'dark'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim()) {
      toast.error('Please fill in your name and email.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/subscription/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'newsletter',
          contactName: name.trim(),
          email: email.trim().toLowerCase(),
          companyName: company.trim() || undefined,
          plan: 'newsletter',
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to subscribe')
      toast.success('You are subscribed! Welcome to HPHRMS AI updates.')
      setName('')
      setEmail('')
      setCompany('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section
      className={cn(
        'relative overflow-hidden py-16 sm:py-20',
        isDark ? 'bg-[var(--navy)] text-white' : 'bg-white text-foreground',
        className,
      )}
      aria-label="Newsletter"
    >
      {/* Decorative accent line */}
      <div className="absolute inset-x-0 top-0 h-1 hpe-gold-bar" />

      <div className="mx-auto max-w-3xl px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-[var(--gold)]/15 px-3 py-1 text-xs font-semibold text-[var(--gold-light)]">
            <Sparkles className="h-3.5 w-3.5" />
            Newsletter
          </div>

          <h2 className="text-2xl font-bold sm:text-3xl">
            Stay Updated with HPHRMS AI
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed opacity-80">
            Receive product updates, AI features, enterprise HR insights, webinars, release notes, and company announcements.
          </p>
        </motion.div>

        <motion.form
          onSubmit={handleSubmit}
          className="mt-8 space-y-3"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="text-left">
              <Label htmlFor="nl-name" className={cn('mb-1 text-xs', isDark ? 'text-white/70' : 'text-muted-foreground')}>
                Name
              </Label>
              <Input
                id="nl-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
                className={cn(
                  'h-9 rounded-md border-white/20 bg-white/10 text-white placeholder:text-white/40 focus-visible:border-[var(--gold)] focus-visible:ring-[var(--gold)]/30',
                  !isDark && 'bg-background text-foreground placeholder:text-muted-foreground border-border',
                )}
              />
            </div>
            <div className="text-left">
              <Label htmlFor="nl-email" className={cn('mb-1 text-xs', isDark ? 'text-white/70' : 'text-muted-foreground')}>
                Business Email
              </Label>
              <Input
                id="nl-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
                className={cn(
                  'h-9 rounded-md border-white/20 bg-white/10 text-white placeholder:text-white/40 focus-visible:border-[var(--gold)] focus-visible:ring-[var(--gold)]/30',
                  !isDark && 'bg-background text-foreground placeholder:text-muted-foreground border-border',
                )}
              />
            </div>
            <div className="text-left">
              <Label htmlFor="nl-company" className={cn('mb-1 text-xs', isDark ? 'text-white/70' : 'text-muted-foreground')}>
                Company Name
              </Label>
              <Input
                id="nl-company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Company (optional)"
                className={cn(
                  'h-9 rounded-md border-white/20 bg-white/10 text-white placeholder:text-white/40 focus-visible:border-[var(--gold)] focus-visible:ring-[var(--gold)]/30',
                  !isDark && 'bg-background text-foreground placeholder:text-muted-foreground border-border',
                )}
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="h-10 w-full rounded-md bg-[var(--gold)] font-semibold text-[var(--navy)] hover:bg-[var(--gold-light)] sm:w-auto sm:px-8"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Mail className="h-4 w-4" />
            )}
            Subscribe
          </Button>
        </motion.form>

        <motion.div
          className="mt-12"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <FollowUs
            variant="horizontal"
            showLabels
            heading=""
            className="justify-center"
          />
        </motion.div>
      </div>
    </section>
  )
}
