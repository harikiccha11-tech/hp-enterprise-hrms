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

  return null
}
