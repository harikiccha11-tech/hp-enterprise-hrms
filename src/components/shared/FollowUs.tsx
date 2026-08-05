'use client'

import { SOCIAL } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import {
  Globe,
  Monitor,
  Instagram,
  AtSign,
  Linkedin,
  Facebook,
  Twitter,
  Youtube,
  MessageCircle,
  type LucideIcon,
} from 'lucide-react'

interface SocialEntry {
  label: string
  href: string
  icon: LucideIcon
  hoverColor: string
}

const LINKS: SocialEntry[] = [
  { label: 'Website', href: SOCIAL.website, icon: Globe, hoverColor: 'hover:text-[var(--gold)]' },
  { label: 'HPHRMS', href: SOCIAL.hphrms, icon: Monitor, hoverColor: 'hover:text-[var(--gold)]' },
  { label: 'Instagram', href: SOCIAL.instagram, icon: Instagram, hoverColor: 'hover:text-pink-500' },
  { label: 'Threads', href: SOCIAL.threads, icon: AtSign, hoverColor: 'hover:text-foreground' },
  { label: 'LinkedIn', href: SOCIAL.linkedin, icon: Linkedin, hoverColor: 'hover:text-sky-600' },
  { label: 'Facebook', href: SOCIAL.facebook, icon: Facebook, hoverColor: 'hover:text-blue-600' },
  { label: 'X', href: SOCIAL.twitter, icon: Twitter, hoverColor: 'hover:text-foreground' },
  { label: 'YouTube', href: SOCIAL.youtube, icon: Youtube, hoverColor: 'hover:text-red-600' },
  { label: 'WhatsApp', href: SOCIAL.whatsapp, icon: MessageCircle, hoverColor: 'hover:text-green-600' },
  { label: 'Reddit', href: SOCIAL.reddit, icon: Globe, hoverColor: 'hover:text-orange-500' },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
}

export interface FollowUsProps {
  variant?: 'horizontal' | 'vertical' | 'grid' | 'inline'
  className?: string
  showLabels?: boolean
  heading?: string
}

export function FollowUs({
  variant = 'horizontal',
  className,
  showLabels = false,
  heading = 'Follow HP Enterprise',
}: FollowUsProps) {
  return (
    <section className={cn('flex flex-col', className)} aria-label={heading}>
      {heading && (
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--navy)]">
          {heading}
        </h3>
      )}

      <motion.div
        className={cn(
          variant === 'horizontal' && 'flex flex-wrap items-center gap-2',
          variant === 'vertical' && 'flex flex-col gap-1',
          variant === 'grid' && 'grid grid-cols-2 sm:grid-cols-3 gap-2',
          variant === 'inline' && 'flex flex-wrap items-center gap-1.5',
        )}
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        {LINKS.map(({ label, href, icon: Icon, hoverColor }) => (
          <motion.a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            variants={itemVariants}
            className={cn(
              'group inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted/60',
              hoverColor,
              variant === 'vertical' && 'w-full',
              variant === 'inline' && 'rounded-full px-2 py-1.5 text-xs',
            )}
            aria-label={`Follow on ${label}`}
          >
            <Icon className="h-4 w-4 shrink-0 transition-transform group-hover:scale-110" />
            {showLabels && <span>{label}</span>}
          </motion.a>
        ))}
      </motion.div>
    </section>
  )
}
