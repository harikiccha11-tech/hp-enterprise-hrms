'use client'
import { create } from 'zustand'
import type { AppUser } from '@/lib/types'

interface AuthState {
  user: AppUser | null
  loading: boolean
  view: 'app' | 'login' | 'register'
  setUser: (u: AppUser | null) => void
  setLoading: (b: boolean) => void
  setView: (v: 'app' | 'login' | 'register') => void
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

export const useAuth = create<AuthState>((set) => ({
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
        set({ user: data.user, view: 'app', loading: false })
      } else {
        set({ user: null, view: 'login', loading: false })
      }
    } catch {
      set({ user: null, view: 'login', loading: false })
    }
  },
}))
