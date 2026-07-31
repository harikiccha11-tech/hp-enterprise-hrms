'use client'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { useState } from 'react'

export function ForgotPasswordDialog() {
  const [email, setEmail] = useState('')
  function submit() {
    toast.success('If an account exists for ' + email + ', a reset link has been sent to your registered email.')
  }
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="text-xs text-muted-foreground hover:text-[var(--navy)] dark:hover:text-[var(--gold)]">Forgot password?</button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset your password</DialogTitle>
          <DialogDescription>Enter your registered email. Our HR team will verify and send a reset link.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <Button className="w-full bg-[var(--navy)] hover:bg-[var(--navy-light)]" onClick={submit}>Send Reset Link</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
