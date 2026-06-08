import { useEffect, useRef, useState } from "react"
import { ScanFace, ShieldCheck } from "lucide-react"
import { verifyFace } from "../api/api"

interface Props {
  onCapture: (dataUrl: string) => void
  onCancel?: () => void
  isDark?: boolean
  buttonText?: string
  description?: string
  /**
   * When provided, the widget runs in scanner mode: it continuously grabs
   * frames and POSTs them to /face/verify against this email. As soon as the
   * backend reports a match, the matching frame is auto-captured.
   */
  scanEmail?: string
  /** Poll interval between verify attempts while scanning. Default 1800ms. */
  scanIntervalMs?: number
}

type ScanState =
  | { kind: "idle" }
  | { kind: "scanning"; hint?: string }
  | { kind: "no_face"; hint: string }
  | { kind: "no_match"; hint: string }
  | { kind: "match" }
  | { kind: "fatal"; hint: string }

export default function FaceCapture({
  onCapture,
  onCancel,
  isDark = true,
  buttonText = "Capture Face",
  description = "Look directly at the camera, ensure good lighting, then click Capture.",
  scanEmail,
  scanIntervalMs = 1800,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const onCaptureRef = useRef(onCapture)
  const [error, setError] = useState("")
  const [ready, setReady] = useState(false)
  const [scan, setScan] = useState<ScanState>({ kind: "idle" })
  const isScanner = Boolean(scanEmail)

  // Keep latest onCapture in a ref so the scan effect can call it without
  // re-running when the parent re-renders.
  useEffect(() => {
    onCaptureRef.current = onCapture
  }, [onCapture])

  useEffect(() => {
    let cancelled = false
    const start = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          setError("Camera API is not available in this browser.")
          return
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 480, height: 360, facingMode: "user" },
          audio: false,
        })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
          setReady(true)
        }
      } catch (e) {
        const err = e as { message?: string }
        setError(err?.message || "Unable to access camera. Please allow camera permissions.")
      }
    }
    start()
    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [])

  const grabFrame = (): string | null => {
    if (!videoRef.current) return null
    const video = videoRef.current
    if (!video.videoWidth || !video.videoHeight) return null
    const canvas = document.createElement("canvas")
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext("2d")
    if (!ctx) return null
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL("image/png")
  }

  // Scanner: poll /face/verify until a match is found.
  useEffect(() => {
    if (!isScanner || !ready || !scanEmail) return
    let cancelled = false
    let timer: number | undefined

    const tick = async () => {
      if (cancelled) return
      const frame = grabFrame()
      if (!frame) {
        timer = window.setTimeout(tick, scanIntervalMs)
        return
      }
      setScan((prev) => (prev.kind === "match" ? prev : { kind: "scanning", hint: prev.kind === "no_face" || prev.kind === "no_match" ? prev.hint : undefined }))
      try {
        const res = await verifyFace({ email: scanEmail, face_image: frame })
        if (cancelled) return
        if (res?.data?.verified) {
          setScan({ kind: "match" })
          onCaptureRef.current(frame)
          return
        }
        if (res?.data?.reason === "no_face") {
          setScan({ kind: "no_face", hint: "Position your face clearly inside the frame." })
        } else {
          setScan({ kind: "no_match", hint: "Face not matched yet. Keep looking at the camera." })
        }
      } catch (err) {
        if (cancelled) return
        const e = err as { response?: { status?: number; data?: { detail?: unknown } } }
        const status = e.response?.status
        const detail = e.response?.data?.detail
        const detailStr = typeof detail === "string" ? detail : ""
        if (status === 404) {
          setScan({ kind: "fatal", hint: "Account not found for this email." })
          return
        }
        if (status === 400 && detailStr.toLowerCase().includes("no face enrolled")) {
          setScan({ kind: "fatal", hint: "No face is enrolled for this account." })
          return
        }
        if (status === 400 && detailStr.toLowerCase().includes("no face detected")) {
          setScan({ kind: "no_face", hint: "Position your face inside the frame." })
        } else if (status === 401) {
          setScan({ kind: "no_match", hint: "Face doesn't match — keep looking at the camera." })
        } else {
          setScan({ kind: "no_match", hint: detailStr || "Scanning..." })
        }
      }
      if (!cancelled) {
        timer = window.setTimeout(tick, scanIntervalMs)
      }
    }

    tick()
    return () => {
      cancelled = true
      if (timer) window.clearTimeout(timer)
    }
  }, [isScanner, ready, scanEmail, scanIntervalMs])

  const manualCapture = () => {
    const frame = grabFrame()
    if (!frame) return
    onCaptureRef.current(frame)
  }

  const wrapClass = isDark
    ? "bg-slate-800 border-slate-700 text-slate-100"
    : "bg-white border-slate-200 text-slate-900"

  const scanBadge = (() => {
    if (!isScanner) return null
    if (scan.kind === "idle" || (scan.kind === "scanning" && !scan.hint))
      return { label: "Scanning...", tone: "info" as const }
    if (scan.kind === "scanning")
      return { label: scan.hint || "Scanning...", tone: "info" as const }
    if (scan.kind === "no_face") return { label: scan.hint, tone: "warn" as const }
    if (scan.kind === "no_match") return { label: scan.hint, tone: "info" as const }
    if (scan.kind === "match") return { label: "Face matched", tone: "success" as const }
    if (scan.kind === "fatal") return { label: scan.hint, tone: "error" as const }
    return null
  })()

  const toneClass = (tone: "info" | "warn" | "error" | "success") => {
    switch (tone) {
      case "success":
        return "bg-emerald-100 text-emerald-700 border-emerald-200"
      case "warn":
        return "bg-amber-100 text-amber-700 border-amber-200"
      case "error":
        return "bg-rose-100 text-rose-700 border-rose-200"
      default:
        return "bg-blue-100 text-blue-700 border-blue-200"
    }
  }

  return (
    <div className={`rounded-2xl border p-4 ${wrapClass}`}>
      <div className="flex items-center gap-2 mb-3">
        {isScanner ? <ScanFace size={16} className="text-blue-600" /> : null}
        <p className={`text-sm ${isDark ? "text-slate-300" : "text-slate-600"}`}>
          {isScanner
            ? "Look at the camera. We'll automatically capture when your face is recognized."
            : description}
        </p>
      </div>
      <div className="relative w-full overflow-hidden rounded-xl bg-black aspect-[4/3]">
        <video
          ref={videoRef}
          playsInline
          muted
          className="w-full h-full object-cover"
        />
        {/* scanner overlay frame */}
        {isScanner && ready && (
          <>
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="relative w-48 h-60 rounded-full border-2 border-white/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]" />
            </div>
            {scan.kind !== "match" && scan.kind !== "fatal" && (
              <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-[scanLine_2s_linear_infinite]" />
            )}
            {scan.kind === "match" && (
              <div className="absolute inset-0 flex items-center justify-center bg-emerald-900/40">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white text-emerald-700 font-semibold shadow-lg">
                  <ShieldCheck size={18} />
                  Match!
                </div>
              </div>
            )}
          </>
        )}
        {!ready && !error && (
          <div className="absolute inset-0 flex items-center justify-center text-white/80 text-sm">
            Starting camera...
          </div>
        )}
      </div>
      {error && <p className="text-rose-500 text-sm mt-2">{error}</p>}
      {scanBadge && (
        <div className={`mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${toneClass(scanBadge.tone)}`}>
          <span className="relative flex h-2 w-2">
            {scanBadge.tone === "info" && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
            )}
            <span
              className={`relative inline-flex rounded-full h-2 w-2 ${
                scanBadge.tone === "success"
                  ? "bg-emerald-500"
                  : scanBadge.tone === "warn"
                  ? "bg-amber-500"
                  : scanBadge.tone === "error"
                  ? "bg-rose-500"
                  : "bg-blue-500"
              }`}
            />
          </span>
          {scanBadge.label}
        </div>
      )}
      <div className="flex justify-end gap-2 mt-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className={`px-4 py-2 rounded-lg text-sm font-medium border ${
              isDark
                ? "border-slate-600 text-slate-200 hover:bg-slate-700"
                : "border-slate-300 text-slate-700 hover:bg-slate-100"
            }`}
          >
            Cancel
          </button>
        )}
        {!isScanner && (
          <button
            type="button"
            onClick={manualCapture}
            disabled={!ready}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {buttonText}
          </button>
        )}
      </div>
    </div>
  )
}
