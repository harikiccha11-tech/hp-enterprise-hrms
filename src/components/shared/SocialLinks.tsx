'use client'

import { SOCIAL } from '@/lib/constants'
import { cn } from '@/lib/utils'
import {
  Linkedin,
  Instagram,
  Facebook,
  Twitter,
  Youtube,
  MessageCircle,
  Globe,
  AtSign,
  Mail,
  type LucideIcon,
} from 'lucide-react'

/* ═══════════════════════════════════════════════════════
   Social link definition used by all variants
   ═══════════════════════════════════════════════════════ */
interface SocialLink {
  label: string
  href: string
  icon: LucideIcon
}

const LINKS: SocialLink[] = [
  { label: 'Website', href: SOCIAL.website, icon: Globe },
  { label: 'HPHRMS', href: SOCIAL.hphrms, icon: Globe },
  { label: 'Email', href: `mailto:${SOCIAL.email}`, icon: Mail },
  { label: 'WhatsApp', href: SOCIAL.whatsapp, icon: MessageCircle },
  { label: 'Instagram', href: SOCIAL.instagram, icon: Instagram },
  { label: 'Threads', href: SOCIAL.threads, icon: AtSign },
  { label: 'LinkedIn', href: SOCIAL.linkedin, icon: Linkedin },
  { label: 'Facebook', href: SOCIAL.facebook, icon: Facebook },
  { label: 'Twitter / X', href: SOCIAL.twitter, icon: Twitter },
  { label: 'YouTube', href: SOCIAL.youtube, icon: Youtube },
  { label: 'Reddit', href: SOCIAL.reddit, icon: Globe },
]

/* ═══════════════════════════════════════════════════════
   Variant renderers
   ═══════════════════════════════════════════════════════ */

/** Footer variant — vertical list, icon + label, muted → white on hover */
function FooterVariant({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-wrap gap-x-6 gap-y-2', className)}>
      {LINKS.map(({ label, href, icon: Icon }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 py-1.5 text-[13px] transition-colors hover:text-white"
          style={{ color: 'rgba(255,255,255,.62)' }}
        >
          <Icon className="h-3.5 w-3.5 shrink-0" />
          <span>{label}</span>
        </a>
      ))}
    </div>
  )
}

/** Icons variant — horizontal row, icon-only, compact buttons */
function IconsVariant({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {LINKS.map(({ label, href, icon: Icon }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          aria-label={label}
        >
          <Icon className="h-4 w-4" />
        </a>
      ))}
    </div>
  )
}

/** Inline variant — horizontal row of small icon + label links */
function InlineVariant({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-wrap items-center gap-x-5 gap-y-2', className)}>
      {LINKS.map(({ label, href, icon: Icon }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <Icon className="h-3 w-3 shrink-0" />
          <span>{label}</span>
        </a>
      ))}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   Public component
   ═══════════════════════════════════════════════════════ */

export interface SocialLinksProps {
  variant?: 'footer' | 'inline' | 'icons'
  className?: string
  showLabels?: boolean
}

export function SocialLinks({ variant = 'footer', className, showLabels }: SocialLinksProps) {
  // showLabels is accepted for API compatibility but each variant has its own label behavior
  void showLabels

  switch (variant) {
    case 'icons':
      return <IconsVariant className={className} />
    case 'inline':
      return <InlineVariant className={className} />
    case 'footer':
    default:
      return <FooterVariant className={className} />
  }
}
