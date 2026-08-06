'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useAuth } from '@/lib/store'
import { Landing } from '@/components/auth/Landing'
import { AdminLayout } from '@/components/admin/AdminLayout'
import { EmployeeLayout } from '@/components/employee/EmployeeLayout'
import { ClientLayout } from '@/components/client/ClientLayout'
import { CandidateLayout } from '@/components/candidate/CandidateLayout'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { motion } from 'framer-motion'
import {
  ShieldCheck, UserCircle, Building2, GraduationCap, LogOut,
  ArrowRight, type LucideIcon,
} from 'lucide-react'

/* ═══════════════════════════════════════════════════════
   PORTAL CONFIG
   ═══════════════════════════════════════════════════════ */
interface PortalDef {
  key: string
  name: string
  icon: LucideIcon
  desc: string
  gradient: string
}

const ALL_PORTALS: PortalDef[] = [
  {
    key: 'admin',
    name: 'Admin Console',
    icon: ShieldCheck,
    desc: 'Full HR management, recruitment, payroll, analytics, and system configuration',
    gradient: 'from-blue-900 to-indigo-900',
  },
  {
    key: 'employee',
    name: 'Employee Portal',
    icon: UserCircle,
    desc: 'Self-service: attendance, leave, payslips, documents, AI assistant, and more',
    gradient: 'from-emerald-800 to-teal-900',
  },
  {
    key: 'client',
    name: 'Client Portal',
    icon: Building2,
    desc: 'Company dashboard, workforce management, invoices, billing, and reports',
    gradient: 'from-amber-800 to-orange-900',
  },
  {
    key: 'candidate',
    name: 'Candidate Portal',
    icon: GraduationCap,
    desc: 'Browse jobs, track applications, interviews, resume builder, and AI career assistant',
    gradient: 'from-violet-800 to-purple-900',
  },
]

const PORTAL_ACCESS: Record<string, string[]> = {
  OWNER: ['admin', 'employee', 'client'],
  SUPER_ADMIN: ['admin', 'employee', 'client'],
  HR_MANAGER: ['admin', 'employee'],
  EMPLOYEE: ['employee'],
  CLIENT: ['client'],
  CANDIDATE: ['candidate'],
}

const PORTAL_STORAGE_KEY = 'hpe-selected-portal'

/* ═══════════════════════════════════════════════════════
   PORTAL SELECTOR COMPONENT
   ═══════════════════════════════════════════════════════ */
function PortalSelector({ user, onSelect, onLogout }: {
  user: { username: string; role: string }
  onSelect: (portal: string) => void
  onLogout: () => void
}) {
  const allowed = PORTAL_ACCESS[user.role] || []
  const portals = ALL_PORTALS.filter((p) => allowed.includes(p.key))

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F7F8FA' }}>
      {/* Gold bar */}
      <div className="h-1 hpe-gold-bar w-full" />

      <div className="flex-1 flex items-center justify-center px-4 py-12 sm:py-20">
        <div className="w-full max-w-5xl">
          {/* Branding */}
          <div className="text-center mb-10">
            <div className="flex justify-center mb-4">
              <BrandLogo />
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-2" style={{ color: '#002B5C' }}>
              Welcome back, {user.username}!
            </h1>
            <p className="text-sm sm:text-base" style={{ color: '#4A5673' }}>
              Select a portal to continue
            </p>
          </div>

          {/* Portal Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {portals.map((portal, i) => {
              const Icon = portal.icon
              return (
                <motion.div
                  key={portal.key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: i * 0.08 }}
                >
                  <Card className="overflow-hidden border hover:shadow-lg transition-all duration-300 group cursor-pointer h-full"
                    style={{ borderColor: '#E2E5EA' }}
                    onClick={() => onSelect(portal.key)}
                  >
                    {/* Gradient header strip */}
                    <div className={`h-2 bg-gradient-to-r ${portal.gradient}`} />
                    <CardContent className="p-5 sm:p-6 flex flex-col h-full">
                      <div className="flex items-start gap-3 mb-4">
                        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${portal.gradient} text-white shadow-md`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-base font-bold" style={{ color: '#16213E' }}>{portal.name}</h3>
                        </div>
                      </div>
                      <p className="text-sm leading-relaxed flex-1 mb-5" style={{ color: '#4A5673' }}>
                        {portal.desc}
                      </p>
                      <Button
                        className="w-full h-10 text-sm font-semibold rounded-lg text-white transition-all duration-200 group-hover:shadow-md"
                        style={{ background: '#002B5C' }}
                        onClick={(e) => { e.stopPropagation(); onSelect(portal.key) }}
                      >
                        Enter Portal
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>

          {/* Sign Out */}
          <div className="mt-10 text-center">
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-sm"
              style={{ color: '#4A5673' }}
              onClick={onLogout}
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════ */
export default function Page() {
  const { user, refresh, logout } = useAuth()
  const mounted = useRef(false)
  const [selectedPortal, setSelectedPortal] = useState<string | null>(null)
  const [portalChecked, setPortalChecked] = useState(false)

  // Silent auth check in background
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      refresh()
    }
  }, [refresh])

  // Check localStorage for saved portal — reads external store in callback
  useEffect(() => {
    const checkPortal = () => {
      if (user) {
        const saved = localStorage.getItem(PORTAL_STORAGE_KEY)
        const allowed = PORTAL_ACCESS[user.role] || []
        if (saved && allowed.includes(saved)) {
          setSelectedPortal(saved)
        }
        setPortalChecked(true)
      } else {
        setSelectedPortal(null)
        setPortalChecked(false)
      }
    }
    // Use microtask to defer setState out of the synchronous effect body
    const id = requestAnimationFrame(checkPortal)
    return () => cancelAnimationFrame(id)
  }, [user])

  // Listen for portal changes from layouts (Change Portal button)
  useEffect(() => {
    const handler = () => {
      setSelectedPortal(null)
      setPortalChecked(true)
    }
    window.addEventListener('hpe-portal-change', handler)
    return () => window.removeEventListener('hpe-portal-change', handler)
  }, [])

  const handleSelectPortal = useCallback((portal: string) => {
    localStorage.setItem(PORTAL_STORAGE_KEY, portal)
    setSelectedPortal(portal)
  }, [])

  const handleSignOutFromSelector = useCallback(async () => {
    localStorage.removeItem(PORTAL_STORAGE_KEY)
    await logout()
  }, [logout])

  // Render selected portal
  const renderPortal = (portal: string) => {
    const wrap = (content: React.ReactNode) => (
      <>
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <main id="main-content" role="main" tabIndex={-1}>
          {content}
        </main>
      </>
    )
    switch (portal) {
      case 'admin':
        return wrap(<AdminLayout />)
      case 'employee':
        return wrap(<EmployeeLayout />)
      case 'client':
        return wrap(<ClientLayout />)
      case 'candidate':
        return wrap(<CandidateLayout />)
      default:
        return null
    }
  }

  // Authenticated with a saved portal: render it
  if (user && selectedPortal) {
    return renderPortal(selectedPortal)
  }

  // Authenticated, portal checked, but no saved portal: show selector
  if (user && portalChecked && !selectedPortal) {
    return (
      <>
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <main id="main-content" role="main" tabIndex={-1}>
          <PortalSelector
            user={user}
            onSelect={handleSelectPortal}
            onLogout={handleSignOutFromSelector}
          />
        </main>
      </>
    )
  }

  // Default: Landing page
  return (
    <>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <main id="main-content" role="main" tabIndex={-1}>
        <Landing />
      </main>
    </>
  )
}
