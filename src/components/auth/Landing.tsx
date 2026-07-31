'use client'
import { useState } from 'react'
import { useAuth } from '@/lib/store'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RegistrationForm } from '@/components/auth/RegistrationForm'
import { ForgotPasswordDialog } from '@/components/auth/ForgotPasswordDialog'
import { toast } from 'sonner'
import { Building2, ShieldCheck, Users, FileText, Clock, Wallet, ArrowRight, Lock, User as UserIcon } from 'lucide-react'
import { BRAND } from '@/lib/constants'

export function Landing() {
  const [mode, setMode] = useState<'home' | 'login' | 'register'>('home')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { setUser } = useAuth()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Login failed')
        return
      }
      setUser(data.user)
      toast.success(`Welcome back, ${data.user.username}!`)
    } catch {
      toast.error('Network error')
    } finally {
      setLoading(false)
    }
  }

  if (mode === 'register') return <RegistrationForm onBack={() => setMode('home')} />

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top nav */}
      <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur-md dark:bg-[var(--navy-deep)]/80">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <BrandLogo />
          <nav className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => setMode('login')}>Sign In</Button>
            <Button onClick={() => setMode('register')} className="bg-[var(--navy)] hover:bg-[var(--navy-light)]">
              Apply Now <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 hpe-sidebar-gradient" />
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 30%, #C9A961 0, transparent 40%), radial-gradient(circle at 80% 70%, #16306B 0, transparent 45%)' }} />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
          <div className="flex flex-col justify-center text-white">
            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-[var(--gold)]/40 bg-[var(--gold)]/10 px-3 py-1 text-xs font-semibold text-[var(--gold-light)]">
              <ShieldCheck className="h-3.5 w-3.5" /> Secure • Cloud-based • ISO 27001 Ready
            </span>
            <h1 className="mt-5 text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              HP ENTERPRISE <span className="text-gradient-gold">Safety & Manpower</span>
            </h1>
            <p className="mt-4 max-w-xl text-lg text-blue-100/90">
              A complete Workforce Management System for Safety Services & Man Power Supply — from onboarding to payroll, attendance tracking, document management, and real-time coordination between Admin and Employee portals.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" onClick={() => setMode('register')} className="hpe-gold-bar text-[var(--navy)] hover:opacity-90">
                Start Application <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => setMode('login')} className="border-white/30 bg-white/5 text-white hover:bg-white/10 hover:text-white">
                Employee / Admin Login
              </Button>
            </div>
            <div className="mt-10 grid grid-cols-3 gap-4 max-w-md">
              {[
                { v: '500+', l: 'Manpower Deployed' },
                { v: '15+', l: 'Project Types' },
                { v: '16', l: 'HR Documents' },
              ].map((s) => (
                <div key={s.l} className="rounded-lg border border-white/10 bg-white/5 p-3 text-center">
                  <p className="text-2xl font-black text-[var(--gold)]">{s.v}</p>
                  <p className="text-[11px] uppercase tracking-wide text-blue-100/70">{s.l}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Login card */}
          <div className="flex items-center justify-center">
            <Card className="w-full max-w-md border-0 shadow-2xl">
              <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-2xl text-[var(--navy)] dark:text-white">Sign in to your account</CardTitle>
                <p className="text-sm text-muted-foreground">Access the Admin panel or Employee self-service portal.</p>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="u">Username</Label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input id="u" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter your username" className="pl-9" autoComplete="username" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="p">Password</Label>
                      <ForgotPasswordDialog />
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input id="p" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="pl-9" autoComplete="current-password" />
                    </div>
                  </div>
                  <Button type="submit" disabled={loading} className="w-full bg-[var(--navy)] hover:bg-[var(--navy-light)]">
                    {loading ? 'Signing in…' : 'Sign In'}
                  </Button>
                </form>
                <div className="mt-5 rounded-lg border border-[var(--gold)]/30 bg-[var(--gold)]/5 p-3 text-center">
                  <p className="text-xs text-muted-foreground">
                    Credentials are issued privately by HR upon approval. <br/>Contact <span className="font-semibold text-[var(--navy)] dark:text-[var(--gold)]">hr@hpenterprise.co.in</span> if you need access.
                  </p>
                </div>
                <button onClick={() => setMode('register')} className="mt-4 w-full text-center text-sm text-[var(--navy)] hover:underline dark:text-[var(--gold)]">
                  New applicant? Submit your registration →
                </button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-[var(--navy)] dark:text-white">Everything your workforce needs</h2>
          <p className="mt-2 text-muted-foreground">Safety services, manpower supply, and complete workforce management.</p>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Users, t: 'Apply for a Job', d: 'Join HP ENTERPRISE — register with your details & documents. Our team verifies, interviews, and onboards you with auto account creation.' },
            { icon: ShieldCheck, t: 'Safety & Verification', d: 'EHS compliance, document verification, safety training records, and complete HR verification — all downloadable.' },
            { icon: Clock, t: 'Attendance & Leave', d: 'Punch in/out with location tracking, overtime, late marks, and leave applications with carry-forward balance.' },
            { icon: Wallet, t: 'Payroll & Documents', d: 'Automated monthly payroll (PF/ESI/LOP) plus 16+ branded HR letters — offer, appointment, ID card, salary slips.' },
          ].map((f) => (
            <div key={f.t} className="rounded-xl border bg-card p-6 lift">
              <div className="grid h-11 w-11 place-items-center rounded-lg hpe-navy">
                <f.icon className="h-5 w-5 text-[var(--gold)]" />
              </div>
              <h3 className="mt-4 font-bold text-[var(--navy)] dark:text-white">{f.t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t bg-white dark:bg-[var(--navy-deep)]">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-6 sm:flex-row sm:px-6">
          <BrandLogo size="sm" />
          <p className="text-xs text-muted-foreground text-center sm:text-right">
            © {new Date().getFullYear()} {BRAND.legalName}. All rights reserved. • {BRAND.address}
          </p>
        </div>
      </footer>
    </div>
  )
}
