'use client'
import { useEffect, useRef } from 'react'
import { useAuth } from '@/lib/store'
import { Landing } from '@/components/auth/Landing'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { EmployeeLayout } from '@/components/employee/EmployeeLayout'
import { ClientLayout } from '@/components/client/ClientLayout'

export default function Page() {
  const { user, refresh } = useAuth()
  const mounted = useRef(false)

  // Silent auth check in background — no loading spinner, no blocking
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      refresh()
    }
  }, [refresh])

  // If authenticated, show the right portal instantly
  if (user) {
    if (user.role === 'CLIENT') {
      return (
        <>
          <a href="#main-content" className="skip-link">Skip to main content</a>
          <main id="main-content" role="main" tabIndex={-1}>
            <ClientLayout />
          </main>
        </>
      )
    }
    if (user.role === 'EMPLOYEE' || user.role === 'HR_MANAGER') {
      return (
        <>
          <a href="#main-content" className="skip-link">Skip to main content</a>
          <main id="main-content" role="main" tabIndex={-1}>
            <EmployeeLayout />
          </main>
        </>
      )
    }
    // OWNER, SUPER_ADMIN, HR_MANAGER
    return (
      <>
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <main id="main-content" role="main" tabIndex={-1}>
          <AdminLayout />
        </main>
      </>
    )
  }

  // Default: Landing page — renders instantly, no spinner
  return (
    <>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <main id="main-content" role="main" tabIndex={-1}>
        <Landing />
      </main>
    </>
  )
}