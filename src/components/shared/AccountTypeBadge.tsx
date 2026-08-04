'use client'
import { useAccountContext, formatAccountType } from '@/lib/account-context'
import { Badge } from '@/components/ui/badge'

const ACCOUNT_COLORS: Record<string, string> = {
  hrms_saas: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  manpower_supply: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  hybrid: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
}

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  trial: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  suspended: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
}

export function AccountTypeBadge() {
  const { account } = useAccountContext()
  if (!account) return null

  return (
    <Badge variant="outline" className={ACCOUNT_COLORS[account.accountType] || ''}>
      {formatAccountType(account.accountType)}
    </Badge>
  )
}

export function AccountStatusBadge() {
  const { account } = useAccountContext()
  if (!account) return null

  return (
    <Badge variant="outline" className={STATUS_COLORS[account.status] || ''}>
      {account.status.charAt(0).toUpperCase() + account.status.slice(1)}
    </Badge>
  )
}
