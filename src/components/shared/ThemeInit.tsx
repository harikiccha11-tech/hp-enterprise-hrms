'use client'
import { useEffect } from 'react'
import { useAppStore } from '@/lib/store'

export function ThemeInit() {
  const applyTheme = useAppStore((s) => s.applyTheme)

  useEffect(() => {
    applyTheme()
  }, [applyTheme])

  return null
}
