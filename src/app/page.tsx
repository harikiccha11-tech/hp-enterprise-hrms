'use client'
import { useEffect } from 'react'
import { useAuth } from '@/lib/store'
import { Landing } from '@/components/auth/Landing'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { EmployeeLayout } from '@/components/employee/EmployeeLayout'
import { BrandLogo } from '@/components/brand/BrandLogo'

export default function Page() {
  const { user, loading, view, refresh } = useAuth()

  useEffect(() => {
    refresh()
  }, [refresh])

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
        <div className="animate-pulse">
          <BrandLogo size="lg" />
        </div>
        <div className="h-1 w-40 overflow-hidden rounded-full bg-muted">
          <div className="h-full w-1/2 animate-[loading_1.2s_ease-in-out_infinite] hpe-gold-bar" />
        </div>
        <p className="text-sm text-muted-foreground">Loading HP Enterprise HRMS…</p>
        <style>{`@keyframes loading{0%{transform:translateX(-100%)}100%{transform:translateX(200%)}}`}</style>
      </div>
    )
  }

  if (!user || view !== 'app') {
    return <Landing />
  }

  if (user.role === 'OWNER' || user.role === 'SUPER_ADMIN' || user.role === 'HR_MANAGER') {
    return <AdminLayout />
  }
  return <EmployeeLayout />
}
