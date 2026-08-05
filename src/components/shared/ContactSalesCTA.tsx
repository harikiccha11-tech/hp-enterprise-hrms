'use client'

import { cn } from '@/lib/utils'
import { SOCIAL, BRAND } from '@/lib/constants'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Phone, Calendar, Receipt, MessageCircle } from 'lucide-react'

export interface ContactSalesCTAProps {
  variant?: 'banner' | 'card' | 'inline'
  className?: string
}

export function ContactSalesCTA({ variant = 'banner', className }: ContactSalesCTAProps) {
  const handleAction = (action: string) => {
    window.dispatchEvent(new CustomEvent('hpe:cta', { detail: { action } }))
  }

  const sharedClass =
    variant === 'banner'
      ? 'border-white/30 text-white hover:bg-white/10'
      : variant === 'card'
        ? 'border-white/30 text-white hover:bg-white/10'
        : 'border-[var(--navy)] text-[var(--navy)] hover:bg-[var(--navy)]/5'

  const goldBtnClass =
    variant === 'inline'
      ? 'bg-[var(--navy)] text-white hover:bg-[var(--navy-deep)]'
      : 'bg-[var(--gold)] text-[var(--navy)] hover:bg-[var(--gold-light)]'

  const size = variant === 'inline' ? ('sm' as const) : ('default' as const)

  const buttons = (
    <>
      {/* Talk to Sales → phone call */}
      <Button variant="outline" size={size} asChild className={cn('gap-2 font-medium', sharedClass)}>
        <a href={`tel:${BRAND.phone}`}>
          <Phone className="h-4 w-4" />
          Talk to Sales
        </a>
      </Button>

      {/* Book Live Demo → custom event */}
      <Button
        variant="default"
        size={size}
        onClick={() => handleAction('book-demo')}
        className={cn('gap-2 font-medium', goldBtnClass)}
      >
        <Calendar className="h-4 w-4" />
        Book Live Demo
      </Button>

      {/* Request Enterprise Pricing → custom event */}
      <Button
        variant="outline"
        size={size}
        onClick={() => handleAction('request-pricing')}
        className={cn('gap-2 font-medium', sharedClass)}
      >
        <Receipt className="h-4 w-4" />
        Request Enterprise Pricing
      </Button>

      {/* Request Callback → WhatsApp */}
      <Button variant="outline" size={size} asChild className={cn('gap-2 font-medium', sharedClass)}>
        <a href={SOCIAL.whatsapp} target="_blank" rel="noopener noreferrer">
          <MessageCircle className="h-4 w-4" />
          Request Callback
        </a>
      </Button>
    </>
  )

  /* ── Banner variant ─────────────────────────────────── */
  if (variant === 'banner') {
    return (
      <section
        className={cn('relative overflow-hidden bg-[var(--navy)] py-16 sm:py-20', className)}
        aria-label="Contact Sales"
      >
        <div className="absolute inset-x-0 top-0 h-1 hpe-gold-bar" />
        <div className="mx-auto max-w-5xl px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              Ready to Transform Your HR Operations?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-white/70">
              Get in touch with our team to explore HPHRMS AI-powered solutions tailored for your enterprise.
            </p>
          </motion.div>
          <motion.div
            className="mt-8 flex flex-wrap items-center justify-center gap-3"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
          >
            {buttons}
          </motion.div>
        </div>
      </section>
    )
  }

  /* ── Card variant ───────────────────────────────────── */
  if (variant === 'card') {
    return (
      <div
        className={cn(
          'rounded-xl bg-gradient-to-br from-[var(--navy)] to-[var(--navy-deep)] p-6 sm:p-8',
          className,
        )}
      >
        <h3 className="text-xl font-bold text-white">Ready to Get Started?</h3>
        <p className="mt-2 text-sm text-white/70">
          Contact our team for a personalised demo, pricing, or callback.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">{buttons}</div>
      </div>
    )
  }

  /* ── Inline variant ─────────────────────────────────── */
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)} role="group" aria-label="Contact Sales">
      {buttons}
    </div>
  )
}
