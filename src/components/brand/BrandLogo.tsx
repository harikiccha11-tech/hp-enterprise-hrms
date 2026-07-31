'use client'
import { cn } from '@/lib/utils'
import Image from 'next/image'

export function BrandLogo({ className, size = 'md', showText = true, variant = 'default' }: {
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showText?: boolean
  variant?: 'default' | 'light'
}) {
  const dims = size === 'xl' ? 56 : size === 'lg' ? 48 : size === 'sm' ? 36 : 42
  const text = size === 'xl' ? 'text-2xl' : size === 'lg' ? 'text-xl' : size === 'sm' ? 'text-base' : 'text-lg'
  const sub = size === 'xl' ? 'text-[11px]' : size === 'lg' ? 'text-[10px]' : 'text-[9px]'
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div
        className={cn('relative shrink-0 rounded-lg overflow-hidden bg-white shadow-sm ring-1 ring-[var(--gold)]/30')}
        style={{ width: dims, height: dims }}
      >
        <Image
          src="/hp-logo.jpg"
          alt="HP ENTERPRISE Logo"
          fill
          className="object-contain"
          sizes={`${dims}px`}
          priority
        />
      </div>
      {showText && (
        <div className="leading-none">
          <div className={cn('font-extrabold tracking-tight', text, variant === 'light' ? 'text-white' : 'text-[var(--navy)] dark:text-white')}>
            HP <span className="text-gradient-gold">ENTERPRISE</span>
          </div>
          <div className={cn('uppercase tracking-[0.15em] text-muted-foreground mt-0.5 font-semibold', sub)}>
            Safety & Manpower
          </div>
        </div>
      )}
    </div>
  )
}
