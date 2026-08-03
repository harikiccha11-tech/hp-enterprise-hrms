'use client'
/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useRef, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Camera, FlipHorizontal, Check, X, RotateCcw } from 'lucide-react'

interface SelfieCaptureProps {
  open: boolean
  action: 'punch_in' | 'punch_out'
  onSubmit: (selfieBase64: string) => void
  onCancel: () => void
}

export function SelfieCapture({ open, action, onSubmit, onCancel }: SelfieCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [captured, setCaptured] = useState<string | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const facingModeRef = useRef<'user' | 'environment'>('user')
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user')

  // Start camera when dialog opens
  useEffect(() => {
    if (!open) return
    let cancelled = false

    // Reset state via refs for non-render-dependent resets
    setCameraError(null)
    setCaptured(null)

    ;(async () => {
      try {
        streamRef.current?.getTracks().forEach(t => t.stop())
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facingModeRef.current, width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        })
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return }
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
      } catch {
        if (!cancelled) setCameraError('Camera access denied. Please allow camera permission and try again.')
      }
    })()

    return () => { cancelled = true; streamRef.current?.getTracks().forEach(t => t.stop()) }
  }, [open])

  // Restart camera when facing mode changes (only while open and not captured)
  useEffect(() => {
    if (!open || captured) return
    let cancelled = false

    ;(async () => {
      try {
        streamRef.current?.getTracks().forEach(t => t.stop())
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode, width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        })
        if (cancelled) { stream.getTracks().forEach(t => t.stop()); return }
        streamRef.current = stream
        if (videoRef.current) videoRef.current.srcObject = stream
      } catch {
        // Ignore flip errors
      }
    })()

    return () => { cancelled = true; streamRef.current?.getTracks().forEach(t => t.stop()) }
  }, [open, facingMode, captured])

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    if (facingMode === 'user') { ctx.translate(canvas.width, 0); ctx.scale(-1, 1) }
    ctx.drawImage(video, 0, 0)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.7)
    setCaptured(dataUrl)
    streamRef.current?.getTracks().forEach(t => t.stop())
  }

  const handleRetake = () => {
    setCaptured(null)
    // Camera will restart via the facingMode captured dependency
    setFacingMode(prev => {
      facingModeRef.current = prev
      return prev
    })
  }

  const handleFlip = () => {
    const next = facingMode === 'user' ? 'environment' : 'user'
    facingModeRef.current = next
    setFacingMode(next)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel() }}>
      <DialogContent className="max-w-sm p-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>{action === 'punch_in' ? 'Punch In Selfie' : 'Punch Out Selfie'}</DialogTitle>
          <DialogDescription>Take a selfie to confirm your {action === 'punch_in' ? 'punch in' : 'punch out'}</DialogDescription>
        </DialogHeader>
        <div className="relative bg-black aspect-[4/3] w-full">
          {captured ? (
            <img src={captured} alt="Captured selfie" className="h-full w-full object-cover" style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : undefined }} />
          ) : (
            <video ref={videoRef} autoPlay playsInline muted className={`h-full w-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`} />
          )}
          {cameraError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-6">
              <p className="text-center text-sm text-white">{cameraError}</p>
            </div>
          )}
          <canvas ref={canvasRef} className="hidden" />
          <div className="absolute left-0 right-0 top-0 flex items-center justify-between p-3">
            <Button size="icon" variant="secondary" className="h-9 w-9 rounded-full bg-black/40 text-white hover:bg-black/60 border-0" onClick={onCancel}>
              <X className="h-4 w-4" />
            </Button>
            {!captured && (
              <Button size="icon" variant="secondary" className="h-9 w-9 rounded-full bg-black/40 text-white hover:bg-black/60 border-0" onClick={handleFlip}>
                <FlipHorizontal className="h-4 w-4" />
              </Button>
            )}
          </div>
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-4 p-4">
            {!captured ? (
              <Button size="icon" className="h-16 w-16 rounded-full bg-white text-[var(--navy)] hover:bg-white/90 shadow-lg border-4 border-white/30 transition-transform active:scale-95" onClick={handleCapture} disabled={!!cameraError}>
                <Camera className="h-7 w-7" />
              </Button>
            ) : (
              <>
                <Button size="icon" variant="secondary" className="h-12 w-12 rounded-full bg-white/20 text-white hover:bg-white/30 border-0" onClick={handleRetake}>
                  <RotateCcw className="h-5 w-5" />
                </Button>
                <Button size="icon" className="h-16 w-16 rounded-full bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg border-4 border-white/30 transition-transform active:scale-95" onClick={() => { if (captured) onSubmit(captured) }}>
                  <Check className="h-7 w-7" />
                </Button>
              </>
            )}
          </div>
        </div>
        <div className="px-4 py-3 text-center">
          {captured ? (
            <><p className="text-sm font-medium text-foreground">Photo captured!</p><p className="text-xs text-muted-foreground mt-1">Tap ✓ to submit or retake</p></>
          ) : (
            <><p className="text-sm font-medium text-foreground">{action === 'punch_in' ? '📸 Take your punch-in selfie' : '📸 Take your punch-out selfie'}</p><p className="text-xs text-muted-foreground mt-1">Center your face and tap the camera button</p></>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
