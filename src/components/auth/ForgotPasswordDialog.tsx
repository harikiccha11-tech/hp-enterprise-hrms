'use client'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { useState } from 'react'

export function ForgotPasswordDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [username, setUsername] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit() {
    if (!username.trim()) {
      toast.error('Please enter your username')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Failed to reset password')
        return
      }
      toast.success(data.message, { duration: 10000 })
      onOpenChange(false)
      setUsername('')
    } catch {
      toast.error('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog data-auth="true" open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reset your password</DialogTitle>
          <DialogDescription>Enter your username. Your password will be reset to a temporary one.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Username</Label>
            <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="e.g. john.doe" />
          </div>
          <Button className="w-full bg-[var(--navy)] hover:bg-[var(--navy-light)]" onClick={submit} disabled={loading}>
            {loading ? 'Resetting…' : 'Reset Password'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
