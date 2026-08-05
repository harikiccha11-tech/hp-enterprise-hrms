'use client'

import { cn } from '@/lib/utils'
import { MessageCircle, Linkedin, Facebook, Twitter, Mail, Share2 } from 'lucide-react'
import { useCallback, useMemo } from 'react'

export interface ShareButtonsProps {
  url?: string
  title?: string
  className?: string
}

const PLATFORMS = [
  {
    key: 'whatsapp' as const,
    label: 'WhatsApp',
    icon: MessageCircle,
    bg: 'bg-green-600 hover:bg-green-700',
    buildUrl: (u: string, t: string) =>
      `https://api.whatsapp.com/send?text=${encodeURIComponent(`${t} ${u}`)}`,
  },
  {
    key: 'linkedin' as const,
    label: 'LinkedIn',
    icon: Linkedin,
    bg: 'bg-sky-700 hover:bg-sky-800',
    buildUrl: (u: string, t: string) =>
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(u)}&title=${encodeURIComponent(t)}`,
  },
  {
    key: 'facebook' as const,
    label: 'Facebook',
    icon: Facebook,
    bg: 'bg-blue-600 hover:bg-blue-700',
    buildUrl: (u: string) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(u)}`,
  },
  {
    key: 'x' as const,
    label: 'X',
    icon: Twitter,
    bg: 'bg-foreground hover:bg-foreground/80',
    buildUrl: (u: string, t: string) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(t)}&url=${encodeURIComponent(u)}`,
  },
  {
    key: 'email' as const,
    label: 'Email',
    icon: Mail,
    bg: 'bg-[var(--navy)] hover:bg-[var(--navy-deep)]',
    buildUrl: (u: string, t: string) =>
      `mailto:?subject=${encodeURIComponent(t)}&body=${encodeURIComponent(`Check this out: ${u}`)}`,
  },
]

export function ShareButtons({ url, title, className }: ShareButtonsProps) {
  const canNativeShare = useMemo(
    () => typeof navigator !== 'undefined' && !!navigator.share,
    [],
  )

  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '')
  const shareTitle = title || (typeof document !== 'undefined' ? document.title : 'HP Enterprise')

  const handleNativeShare = useCallback(async () => {
    try {
      await navigator.share({ url: shareUrl, title: shareTitle })
    } catch {
      // User cancelled — ignore
    }
  }, [shareUrl, shareTitle])

  return (
    <div className={cn('flex items-center gap-2', className)} role="group" aria-label="Share">
      {canNativeShare ? (
        <button
          type="button"
          onClick={handleNativeShare}
          className="inline-flex h-8 items-center gap-1.5 rounded-full bg-[var(--navy)] px-3 text-xs font-medium text-white transition-colors hover:bg-[var(--navy-deep)]"
          aria-label="Share"
        >
          <Share2 className="h-3.5 w-3.5" />
          <span>Share</span>
        </button>
      ) : (
        PLATFORMS.map(({ key, label, icon: Icon, bg, buildUrl }) => (
          <a
            key={key}
            href={buildUrl(shareUrl, shareTitle)}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'inline-flex h-8 w-8 items-center justify-center rounded-full text-white transition-colors',
              bg,
            )}
            aria-label={`Share on ${label}`}
          >
            <Icon className="h-3.5 w-3.5" />
          </a>
        ))
      )}
    </div>
  )
}
