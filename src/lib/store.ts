'use client'
import { create } from 'zustand'
import type { AppUser } from '@/lib/types'
import type { LangCode } from '@/lib/i18n'

/* ═══════════════════════════════════════════════════════
   DATA CACHE — stale-while-revalidate for instant loads
   ═══════════════════════════════════════════════════════ */

interface CacheEntry<T = unknown> {
  data: T
  ts: number
  key: string
}

const CACHE_TTL = 30_000 // 30s stale threshold
const _cache = new Map<string, CacheEntry>()

function cacheGet<T = unknown>(key: string): T | null {
  const e = _cache.get(key)
  if (!e) return null
  // Return cached data even if stale (for instant render)
  return e.data as T
}

function cacheSet(key: string, data: unknown) {
  _cache.set(key, { data, ts: Date.now(), key })
}

function cacheInvalidate(pattern?: string) {
  if (!pattern) { _cache.clear(); return }
  for (const k of _cache.keys()) { if (k.includes(pattern)) _cache.delete(k) }
}

/**
 * cachedFetch — returns cached data immediately if available,
 * then fetches fresh data in the background (stale-while-revalidate).
 * Returns { data, fresh, fromCache }
 */
export async function cachedFetch<T = unknown>(
  key: string,
  url: string,
  opts?: RequestInit,
): Promise<{ data: T | null; fresh: boolean; fromCache: boolean }> {
  const cached = cacheGet<T>(key)
  if (cached) {
    // Fire fresh fetch in background, don't await
    fetch(url, { ...opts, cache: 'no-store' })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) cacheSet(key, d) })
      .catch(() => {})
    return { data: cached, fresh: false, fromCache: true }
  }
  // No cache — must fetch
  try {
    const res = await fetch(url, { ...opts, cache: 'no-store' })
    if (res.ok) {
      const data = await res.json()
      cacheSet(key, data)
      return { data, fresh: true, fromCache: false }
    }
  } catch {}
  return { data: null, fresh: false, fromCache: false }
}

/**
 * prefetch — fires requests in the background, populating cache.
 * Call this right after login so data is ready when user clicks modules.
 */
export function prefetch(keys: string[], url: string, opts?: RequestInit) {
  const anyCached = keys.some(k => _cache.has(k))
  if (anyCached) return // Already have some data
  fetch(url, { ...opts, cache: 'no-store' })
    .then(r => r.ok ? r.json() : null)
    .then(d => { if (d) keys.forEach(k => cacheSet(k, d)) })
    .catch(() => {})
}

export { cacheSet, cacheGet, cacheInvalidate }

/* ═══════════════════════════════════════════════════════
   THEME HELPERS
   ═══════════════════════════════════════════════════════ */

interface ThemeColors { primary: string; accent: string }

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
  root.style.setProperty('--chart-1', primary)
  if (root.classList.contains('dark')) {
    root.style.setProperty('--primary', accent)
    root.style.setProperty('--primary-foreground', darken(accent, 70))
  } else {
    root.style.setProperty('--primary', primary)
    root.style.setProperty('--primary-foreground', '#FFFFFF')
  }
}

/* ═══════════════════════════════════════════════════════
   APP STORE
   ═══════════════════════════════════════════════════════ */

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

export const useAppStore = create<AppState>((set, get) => ({
  // Auth — loading starts false for instant render
  user: null,
  loading: false,
  view: 'app',
  setUser: (u) => set({ user: u, view: u ? 'app' : 'login' }),
  setLoading: (b) => set({ loading: b }),
  setView: (v) => set({ view: v }),
  logout: async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    cacheInvalidate() // Clear all cache on logout
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
    if (state.darkMode) document.documentElement.classList.add('dark')
    document.documentElement.lang = state.lang
    applyColorsToDOM(state.themeColors.primary, state.themeColors.accent)
  },
  // HPAI
  hpaiOpen: false,
  setHpaiOpen: (o) => set({ hpaiOpen: o }),
  toggleHpai: () => set((s) => ({ hpaiOpen: !s.hpaiOpen })),
}))

// Keep backward compat
export const useAuth = useAppStore
