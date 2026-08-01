'use client'
import { create } from 'zustand'
import type { AppUser } from '@/lib/types'
import type { LangCode } from '@/lib/i18n'

interface ThemeColors {
  primary: string
  accent: string
}

interface AppState {
  // Auth
  user: AppUser | null
  loading: boolean
  view: 'app' | 'login' | 'register'
  setUser: (u: AppUser | null) => void
  setLoading: (b: boolean) => void
  setView: (v: 'app' | 'login' | 'register') => void
  logout: () => Promise<void>
  refresh: () => Promise<void>
  // Language
  lang: LangCode
  setLang: (l: LangCode) => void
  // Theme
  darkMode: boolean
  setDarkMode: (d: boolean) => void
  toggleDarkMode: () => void
  themeColors: ThemeColors
  setThemeColors: (c: ThemeColors) => void
  applyTheme: () => void
  // HPAI
  hpaiOpen: boolean
  setHpaiOpen: (o: boolean) => void
  toggleHpai: () => void
}

function loadDarkMode(): boolean {
  if (typeof window === 'undefined') return false
  const saved = localStorage.getItem('hpe-dark-mode')
  if (saved !== null) return saved === 'true'
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function loadLang(): LangCode {
  if (typeof window === 'undefined') return 'en'
  return (localStorage.getItem('hpe-lang') as LangCode) || 'en'
}

function loadThemeColors(): ThemeColors {
  if (typeof window === 'undefined') return { primary: '#002B5C', accent: '#D4AF37' }
  try {
    const saved = localStorage.getItem('hpe-theme-colors')
    if (saved) return JSON.parse(saved)
  } catch {}
  return { primary: '#002B5C', accent: '#D4AF37' }
}

function applyColorsToDOM(primary: string, accent: string) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.style.setProperty('--navy', primary)
  root.style.setProperty('--navy-deep', darken(primary, 20))
  root.style.setProperty('--navy-light', lighten(primary, 30))
  root.style.setProperty('--gold', accent)
  root.style.setProperty('--gold-light', lighten(accent, 20))
  root.style.setProperty('--sidebar-primary', accent)
  root.style.setProperty('--ring', accent)
  root.style.setProperty('--chart-2', accent)
  // Update light mode chart colors
  root.style.setProperty('--chart-1', primary)
  // Update dark mode if active
  if (root.classList.contains('dark')) {
    root.style.setProperty('--primary', accent)
    root.style.setProperty('--primary-foreground', darken(accent, 70))
  } else {
    root.style.setProperty('--primary', primary)
    root.style.setProperty('--primary-foreground', '#FFFFFF')
  }
}

function darken(hex: string, pct: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = Math.max(0, (num >> 16) - Math.round(255 * pct / 100))
  const g = Math.max(0, ((num >> 8) & 0xff) - Math.round(255 * pct / 100))
  const b = Math.max(0, (num & 0xff) - Math.round(255 * pct / 100))
  return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`
}

function lighten(hex: string, pct: number): string {
  const num = parseInt(hex.replace('#', ''), 16)
  const r = Math.min(255, (num >> 16) + Math.round(255 * pct / 100))
  const g = Math.min(255, ((num >> 8) & 0xff) + Math.round(255 * pct / 100))
  const b = Math.min(255, (num & 0xff) + Math.round(255 * pct / 100))
  return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`
}

export const useAppStore = create<AppState>((set, get) => ({
  // Auth
  user: null,
  loading: true,
  view: 'app',
  setUser: (u) => set({ user: u, view: u ? 'app' : 'login' }),
  setLoading: (b) => set({ loading: b }),
  setView: (v) => set({ view: v }),
  logout: async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    set({ user: null, view: 'login' })
  },
  refresh: async () => {
    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        if (data.user) {
          set({ user: data.user, view: 'app', loading: false })
        } else {
          // Only clear user if there was one before (session expired)
          // Don't clear if initial load had no user
          set((s) => ({
            ...(s.user ? { user: null, view: 'login' as const } : {}),
            loading: false,
          }))
        }
      } else {
        set({ user: null, view: 'login', loading: false })
      }
    } catch {
      set({ user: null, view: 'login', loading: false })
    }
  },
  // Language
  lang: 'en' as LangCode,
  setLang: (l) => {
    localStorage.setItem('hpe-lang', l)
    document.documentElement.lang = l
    set({ lang: l })
  },
  // Theme
  darkMode: false,
  setDarkMode: (d) => {
    localStorage.setItem('hpe-dark-mode', String(d))
    if (d) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    // Reapply colors after dark mode toggle
    const { themeColors } = get()
    applyColorsToDOM(themeColors.primary, themeColors.accent)
    set({ darkMode: d })
  },
  toggleDarkMode: () => {
    const { darkMode } = get()
    get().setDarkMode(!darkMode)
  },
  themeColors: { primary: '#002B5C', accent: '#D4AF37' },
  setThemeColors: (c) => {
    localStorage.setItem('hpe-theme-colors', JSON.stringify(c))
    applyColorsToDOM(c.primary, c.accent)
    set({ themeColors: c })
  },
  applyTheme: () => {
    const state = get()
    // Apply dark mode
    if (state.darkMode) {
      document.documentElement.classList.add('dark')
    }
    // Apply language
    document.documentElement.lang = state.lang
    // Apply colors
    applyColorsToDOM(state.themeColors.primary, state.themeColors.accent)
  },
  // HPAI
  hpaiOpen: false,
  setHpaiOpen: (o) => set({ hpaiOpen: o }),
  toggleHpai: () => set((s) => ({ hpaiOpen: !s.hpaiOpen })),
}))

// Keep backward compat
export const useAuth = useAppStore
