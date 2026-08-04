'use client'
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'

export type AccountType = 'hrms_saas' | 'manpower_supply' | 'hybrid'
export type ClientRole = 'admin' | 'hr' | 'manager' | 'employee' | 'viewer'

export interface Account {
  id: string
  organizationName: string
  accountType: AccountType
  status: 'active' | 'trial' | 'suspended'
  createdAt: string
}

export interface AccountUser {
  id: string
  email: string
  fullName: string
  clientRole: ClientRole
  department?: string
}

export interface AccountContextType {
  account: Account | null
  accountUser: AccountUser | null
  loading: boolean
  error: string | null
}

const AccountContext = createContext<AccountContextType | undefined>(undefined)

export function AccountProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<Account | null>(null)
  const [accountUser, setAccountUser] = useState<AccountUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchContext = async () => {
      try {
        const [accountRes, userRes] = await Promise.all([
          fetch('/api/auth/account'),
          fetch('/api/auth/user'),
        ])
        if (accountRes.ok) {
          const data = await accountRes.json()
          setAccount(data)
        }
        if (userRes.ok) {
          const data = await userRes.json()
          setAccountUser(data)
        }
      } catch (err) {
        console.error('Account context fetch error:', err)
        setError(err instanceof Error ? err.message : 'Failed to load account context')
      } finally {
        setLoading(false)
      }
    }
    fetchContext()
  }, [])

  return (
    <AccountContext.Provider value={{ account, accountUser, loading, error }}>
      {children}
    </AccountContext.Provider>
  )
}

export function useAccountContext() {
  const context = useContext(AccountContext)
  if (!context) {
    throw new Error('useAccountContext must be used within AccountProvider')
  }
  return context
}

export function formatAccountType(type: AccountType): string {
  const map: Record<AccountType, string> = {
    hrms_saas: 'HRMS Software',
    manpower_supply: 'Manpower Supply',
    hybrid: 'Hybrid (Both)',
  }
  return map[type]
}

export function formatClientRole(role: ClientRole): string {
  const map: Record<ClientRole, string> = {
    admin: 'Administrator',
    hr: 'HR Manager',
    manager: 'Manager',
    employee: 'Employee',
    viewer: 'Viewer',
  }
  return map[role]
}
