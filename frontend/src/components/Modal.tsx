import { useEffect } from "react"
import { CheckCircle, XCircle } from "lucide-react"

interface Props {
  open: boolean
  type: "success" | "error"
  message: string
  onClose: () => void
  duration?: number
  align?: "left" | "right"
}

export default function Notification({
  open,
  type,
  message,
  onClose,
  duration = 1000,
  align = "left",
}: Props) {
  useEffect(() => {
    if (!open) return
    const timer = setTimeout(() => {
      onClose()
    }, duration)
    return () => clearTimeout(timer)
  }, [open, duration, onClose])

  if (!open) return null

  // Position the toast over the form column rather than over the image.
  // On mobile (no image pane) we keep it centered horizontally.
  const positionClass =
    align === "right"
      ? "left-1/2 right-4 -translate-x-0 md:left-auto md:right-6 md:translate-x-0"
      : "left-4 right-4 md:left-6 md:right-auto"

  return (
    <div
      className={`fixed top-6 ${positionClass} z-50 flex items-start gap-3 p-4 rounded-2xl shadow-2xl border min-w-[280px] max-w-sm md:max-w-md backdrop-blur-sm animate-[fadeSlide_300ms_ease-out] ${
        type === "success"
          ? "bg-white border-emerald-200 shadow-emerald-100"
          : "bg-white border-rose-200 shadow-rose-100"
      }`}
    >
      <div
        className={`flex items-center justify-center h-10 w-10 rounded-xl shrink-0 ${
          type === "success" ? "bg-emerald-100 text-emerald-600" : "bg-rose-100 text-rose-600"
        }`}
      >
        {type === "success" ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
      </div>

      <div className="flex-1">
        <p className={`text-sm font-semibold ${type === "success" ? "text-emerald-700" : "text-rose-700"}`}>
          {type === "success" ? "Success" : "Error"}
        </p>
        <p className="text-sm text-slate-600 mt-0.5">{message}</p>
      </div>
    </div>
  )
}