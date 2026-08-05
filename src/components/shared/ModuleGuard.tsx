'use client'
import { ReactNode } from 'react'
import { useAccountContext } from '@/lib/account-context'
import type { AccountType, ClientRole } from '@/lib/account-context'

interface ModuleGuardProps {
  accountTypes?: AccountType[]
  roles?: ClientRole[]
  children: ReactNode
  fallback?: ReactNode
}

export function ModuleGuard({ accountTypes, roles, children, fallback }: ModuleGuardProps) {
  const { account, accountUser, loading } = useAccountContext()

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!account || !accountUser) {
    return (
      <>
        {fallback || (
          <p className="text-muted-foreground">Session expired. Please log in again.</p>
        )}
      </>
    )
  }

  const typeAllowed = !accountTypes || accountTypes.includes(account.accountType)
  const roleAllowed = !roles || roles.includes(accountUser.clientRole)

  if (!typeAllowed || !roleAllowed) {
    return (
      <>
        {fallback || (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <p className="text-lg font-medium text-muted-foreground">Access Restricted</p>
            <p className="text-sm text-muted-foreground mt-1">
              This module is not available for your account type.
            </p>
          </div>
        )}
      </>
    )
  }

  return <>{children}</>
}
