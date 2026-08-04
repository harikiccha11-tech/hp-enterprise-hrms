'use client'
import { useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import type { LangCode } from '@/lib/i18n'

export function ThemeInit() {
  const applyTheme = useAppStore((s) => s.applyTheme)
  const setLang = useAppStore((s) => s.setLang)
  const setDarkMode = useAppStore((s) => s.setDarkMode)
  const setThemeColors = useAppStore((s) => s.setThemeColors)

  useEffect(() => {
    // Sync language from localStorage
    const savedLang = (typeof window !== 'undefined' && localStorage.getItem('hpe-lang')) as LangCode | null
    if (savedLang) setLang(savedLang)

    // Sync dark mode from localStorage
    const savedDark = typeof window !== 'undefined' && localStorage.getItem('hpe-dark-mode')
    if (savedDark !== null) setDarkMode(savedDark === 'true')

    // Sync theme colors from localStorage
    const savedColors = typeof window !== 'undefined' && localStorage.getItem('hpe-theme-colors')
    if (savedColors) {
      try {
        setThemeColors(JSON.parse(savedColors))
      } catch {}
    }

    // Apply all theme settings to DOM
    applyTheme()
  }, [applyTheme, setLang, setDarkMode, setThemeColors])

  useEffect(() => {
    // Auto-recover from ChunkLoadError (Turbopack HMR stale chunks)
    const handler = (e: Event) => {
      const err = e as ErrorEvent
      if (err.message && (err.message.includes('ChunkLoadError') || err.message.includes('Failed to load chunk') || err.message.includes('Loading chunk'))) {
        console.warn('[HPHRMS] Chunk load error detected, reloading...')
        window.location.reload()
      }
    }
    // Also catch unhandled promise rejections (dynamic import failures)
    const rejectionHandler = (e: PromiseRejectionEvent) => {
    const msg = e.reason?.message || ''
    if (msg.includes('ChunkLoadError') || msg.includes('Failed to load chunk') || msg.includes('Loading chunk') || msg.includes('Loading CSS chunk')) {
      console.warn('[HPHRMS] Chunk load error detected, reloading...')
      window.location.reload()
    }
    }
    window.addEventListener('error', handler)
    window.addEventListener('unhandledrejection', rejectionHandler)
    return () => {
      window.removeEventListener('error', handler)
      window.removeEventListener('unhandledrejection', rejectionHandler)
    }
  }, [])

  return null
}
