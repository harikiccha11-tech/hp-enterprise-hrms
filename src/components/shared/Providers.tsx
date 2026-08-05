'use client'
import { ReactNode } from 'react'
import { AccountProvider } from '@/lib/account-context'
import { ThemeInit } from '@/components/shared/ThemeInit'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AccountProvider>
      <ThemeInit />
      {children}
    </AccountProvider>
  )
}
