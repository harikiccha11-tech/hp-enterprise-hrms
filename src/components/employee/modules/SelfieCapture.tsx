'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Camera, FlipHorizontal, Check, X, RotateCcw, ShieldAlert, RefreshCw, Loader2, SkipForward } from 'lucide-react'

interface SelfieCaptureProps {
  open: boolean
  action: 'punch_in' | 'punch_out'
  onSubmit: (selfieBase64: string) => void
  onCancel: () => void
}

function checkSecureContext(): boolean {
  if (typeof window === 'undefined') return false
  return window.isSecureContext
}

function checkCameraSupport(): boolean {
  if (typeof navigator === 'undefined') return false
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
}

export function SelfieCapture({ open, action, onSubmit, onCancel }: SelfieCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [captured, setCaptured] = useState<string | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [cameraLoading, setCameraLoading] = useState(false)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user')
  const facingModeRef = useRef<'user' | 'environment'>('user')
  const [retryCount, setRetryCount] = useState(0)

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => { t.stop(); t.enabled = false })
    streamRef.current = null
    if (videoRef.current) videoRef.current.srcObject = null
  }, [])

  const startCamera = useCallback(async (facing: 'user' | 'environment') => {
    setCameraLoading(true)
    setCameraError(null)
    setCaptured(null)
    stopStream()

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 720, min: 320 },
          height: { ideal: 960, min: 240 },
        },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setCameraLoading(false)
    } catch (err: unknown) {
      setCameraLoading(false)
      stopStream()
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.includes('NotAllowedError') || msg.includes('Permission') || msg.includes('denied')) {
        setCameraError('Camera permission was denied. Please allow camera access in your browser settings and try again.')
      } else if (msg.includes('NotFoundError') || msg.includes('Requested device not found')) {
        setCameraError('No camera found on this device. Please connect a camera and try again.')
      } else if (msg.includes('NotReadableError') || msg.includes('Could not start')) {
        setCameraError('Camera is already in use by another application. Please close it and try again.')
      } else if (msg.includes('secure') || msg.includes('HTTPS') || msg.includes('insecure')) {
        setCameraError('Camera access requires a secure (HTTPS) connection. Please use https:// in the URL.')
      } else {
        setCameraError('Could not access camera. Please check permissions and try again.')
      }
    }
  }, [stopStream])

  // Start camera when dialog opens
  useEffect(() => {
    if (!open) {
      stopStream()
      return
    }
    // Small delay to ensure dialog is mounted
    const timer = setTimeout(() => {
      startCamera(facingModeRef.current)
    }, 300)
    return () => { clearTimeout(timer); stopStream() }
  }, [open, stopStream, startCamera])

  // Restart camera when facing mode changes (only while open and not captured)
  useEffect(() => {
    if (!open || captured) return
    facingModeRef.current = facingMode
    const timer = setTimeout(() => startCamera(facingMode), 150)
    return () => { clearTimeout(timer) }
  }, [open, facingMode, captured, startCamera])

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth || 640
    canvas.height = video.videoHeight || 480
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    if (facingMode === 'user') { ctx.translate(canvas.width, 0); ctx.scale(-1, 1) }
    ctx.drawImage(video, 0, 0)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
    setCaptured(dataUrl)
    stopStream()
  }

  const handleRetake = () => {
    setCaptured(null)
    // Force restart camera after a small delay (captured = null triggers the effect)
    setTimeout(() => {
      startCamera(facingMode)
    }, 200)
  }

  const handleRetry = () => {
    setRetryCount(c => c + 1)
    setCameraError(null)
    startCamera(facingMode)
  }

  const handleFlip = () => {
    const next = facingMode === 'user' ? 'environment' : 'user'
    facingModeRef.current = next
    setFacingMode(next)
  }

  const handleSkip = () => {
    // Submit without selfie — still proceed with punch
    stopStream()
    onSubmit('')
  }

  const isSecure = checkSecureContext()
  const hasCamera = checkCameraSupport()

  const actionLabel = action === 'punch_in' ? 'Punch In' : 'Punch Out'

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { stopStream(); onCancel() } }}>
      <DialogContent className="max-w-sm p-0 overflow-hidden">
        <DialogHeader className="sr-only">
          <DialogTitle>{actionLabel} Selfie</DialogTitle>
          <DialogDescription>Take a selfie to confirm your {actionLabel.toLowerCase()}</DialogDescription>
        </DialogHeader>

        {/* Camera viewport */}
        <div className="relative bg-black aspect-[3/4] w-full">
          {/* Camera feed or captured image */}
          {!cameraError && (
            captured ? (
              <img
                src={captured}
                alt="Captured selfie"
                className="h-full w-full object-cover"
                style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : undefined }}
              />
            ) : (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`h-full w-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
              />
            )
          )}

          {/* Loading state */}
          {cameraLoading && !captured && !cameraError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 gap-3">
              <Loader2 className="h-8 w-8 text-white animate-spin" />
              <p className="text-sm text-white/80 font-medium">Starting camera…</p>
            </div>
          )}

          {/* Error state with actions */}
          {cameraError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 p-6 gap-4">
              <ShieldAlert className="h-10 w-10 text-amber-400" />
              <p className="text-center text-sm text-white leading-relaxed">{cameraError}</p>
              <div className="flex flex-col gap-2 w-full max-w-[200px]">
                <Button
                  size="sm"
                  className="w-full bg-white text-gray-900 hover:bg-white/90 font-semibold"
                  onClick={handleRetry}
                >
                  <RefreshCw className="mr-2 h-3.5 w-3.5" />
                  Try Again
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full border-white/30 text-white hover:bg-white/10 font-semibold"
                  onClick={handleSkip}
                >
                  <SkipForward className="mr-2 h-3.5 w-3.5" />
                  Continue Without Photo
                </Button>
              </div>
            </div>
          )}

          {/* No camera support */}
          {!hasCamera && open && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 p-6 gap-4">
              <ShieldAlert className="h-10 w-10 text-amber-400" />
              <p className="text-center text-sm text-white leading-relaxed">Camera is not supported in this browser or context.</p>
              <Button
                size="sm"
                className="bg-white text-gray-900 hover:bg-white/90 font-semibold"
                onClick={handleSkip}
              >
                <SkipForward className="mr-2 h-3.5 w-3.5" />
                Continue Without Photo
              </Button>
            </div>
          )}

          {/* Not secure context */}
          {!isSecure && open && hasCamera && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 p-6 gap-4">
              <ShieldAlert className="h-10 w-10 text-amber-400" />
              <p className="text-center text-sm text-white leading-relaxed">Camera requires a secure (HTTPS) connection.</p>
              <p className="text-center text-xs text-white/60">Please access this page using https://</p>
              <Button
                size="sm"
                className="bg-white text-gray-900 hover:bg-white/90 font-semibold"
                onClick={handleSkip}
              >
                <SkipForward className="mr-2 h-3.5 w-3.5" />
                Continue Without Photo
              </Button>
            </div>
          )}

          <canvas ref={canvasRef} className="hidden" />

          {/* Top controls */}
          <div className="absolute left-0 right-0 top-0 flex items-center justify-between p-3">
            <Button
              size="icon"
              variant="secondary"
              className="h-9 w-9 rounded-full bg-black/40 text-white hover:bg-black/60 border-0"
              onClick={() => { stopStream(); onCancel() }}
            >
              <X className="h-4 w-4" />
            </Button>
            {!captured && !cameraError && !cameraLoading && (
              <Button
                size="icon"
                variant="secondary"
                className="h-9 w-9 rounded-full bg-black/40 text-white hover:bg-black/60 border-0"
                onClick={handleFlip}
              >
                <FlipHorizontal className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Bottom controls */}
          {!cameraError && hasCamera && isSecure && (
            <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-4 p-4">
              {!captured ? (
                <Button
                  size="icon"
                  className="h-16 w-16 rounded-full bg-white text-[var(--navy)] hover:bg-white/90 shadow-lg border-4 border-white/30 transition-transform active:scale-95"
                  onClick={handleCapture}
                  disabled={!!cameraError || cameraLoading}
                >
                  <Camera className="h-7 w-7" />
                </Button>
              ) : (
                <>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-12 w-12 rounded-full bg-white/20 text-white hover:bg-white/30 border-0"
                    onClick={handleRetake}
                  >
                    <RotateCcw className="h-5 w-5" />
                  </Button>
                  <Button
                    size="icon"
                    className="h-16 w-16 rounded-full bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg border-4 border-white/30 transition-transform active:scale-95"
                    onClick={() => { if (captured) onSubmit(captured) }}
                  >
                    <Check className="h-7 w-7" />
                  </Button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Bottom instruction bar */}
        <div className="px-4 py-3 text-center">
          {captured ? (
            <>
              <p className="text-sm font-medium text-foreground">Photo captured!</p>
              <p className="text-xs text-muted-foreground mt-1">Tap ✓ to submit or retake</p>
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-foreground">
                {action === 'punch_in' ? '📸 Take your punch-in selfie' : '📸 Take your punch-out selfie'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Center your face and tap the camera button</p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
