import { useEffect, useState } from "react"
import { FiBell, FiCheck, FiCheckCircle, FiClock, FiX } from "react-icons/fi"
import { listNotifications, markAllNotificationsRead, markNotificationRead } from "../api/api"
import { useTheme } from "../theme"
import type { NotificationOut } from "../types"

interface Props {
  open: boolean
  email: string
  onClose: () => void
  onCountChange?: (unread: number) => void
}

export default function NotificationsDrawer({ open, email, onClose, onCountChange }: Props) {
  const { isDark } = useTheme()
  const [items, setItems] = useState<NotificationOut[]>([])
  const [loading, setLoading] = useState(false)
  const unreadCount = items.filter((item) => !item.is_read).length

  const reload = async () => {
    if (!email) return
    setLoading(true)
    try {
      const data = await listNotifications(email)
      setItems(data)
      onCountChange?.(data.filter((item) => !item.is_read).length)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) void reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, email])

  useEffect(() => {
    if (!email) return
    const timer = window.setInterval(() => void reload(), 15000)
    return () => window.clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email])

  if (!open) return null

  const panel = isDark
    ? "border border-slate-800 bg-slate-950 text-slate-100"
    : "border border-slate-200 bg-white text-slate-900"

  const itemClass = (read: boolean) =>
    `group rounded-2xl border p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 ${
      isDark
        ? read
          ? "border-slate-800 bg-slate-900/80"
          : "border-blue-500/40 bg-blue-950/40 shadow-blue-950/20"
        : read
        ? "border-slate-200 bg-slate-50"
        : "border-blue-200 bg-blue-50 shadow-blue-100/80"
    }`

  const handleRead = async (id: number) => {
    await markNotificationRead(id)
    void reload()
  }

  const handleReadAll = async () => {
    await markAllNotificationsRead(email)
    void reload()
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" />
      <div
        className={`relative flex h-full w-full max-w-md flex-col shadow-2xl ${panel}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={`border-b p-5 ${isDark ? "border-slate-800" : "border-slate-200"}`}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-xl text-white shadow-lg shadow-blue-600/25">
                <FiBell />
              </div>
              <div>
                <h3 className="text-xl font-black tracking-tight">Notifications</h3>
                <p className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                  {unreadCount > 0
                    ? `${unreadCount} unread update${unreadCount === 1 ? "" : "s"}`
                    : "All caught up"}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`rounded-full p-2 transition ${
                isDark
                  ? "text-slate-400 hover:bg-slate-800 hover:text-white"
                  : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              }`}
              aria-label="Close notifications"
            >
              <FiX />
            </button>
          </div>

          <div className="mt-5 flex items-center justify-between gap-3">
            <div
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${
                unreadCount > 0
                  ? "bg-blue-600/10 text-blue-500"
                  : isDark
                  ? "bg-emerald-500/10 text-emerald-300"
                  : "bg-emerald-50 text-emerald-700"
              }`}
            >
              {unreadCount > 0 ? <FiClock /> : <FiCheckCircle />}
              {unreadCount > 0 ? "Needs attention" : "No unread alerts"}
            </div>
            <button
              onClick={handleReadAll}
              disabled={unreadCount === 0}
              className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition ${
                unreadCount === 0
                  ? "cursor-not-allowed opacity-45"
                  : isDark
                  ? "bg-blue-500/10 text-blue-300 hover:bg-blue-500/20"
                  : "bg-blue-50 text-blue-700 hover:bg-blue-100"
              }`}
            >
              <FiCheck />
              Mark all read
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-5">
          {loading && (
            <div
              className={`rounded-2xl border p-5 text-sm font-semibold ${
                isDark
                  ? "border-slate-800 bg-slate-900 text-slate-300"
                  : "border-slate-200 bg-slate-50 text-slate-500"
              }`}
            >
              Loading notifications...
            </div>
          )}

          {!loading && items.length === 0 && (
            <div
              className={`rounded-3xl border p-8 text-center ${
                isDark ? "border-slate-800 bg-slate-900/70" : "border-slate-200 bg-slate-50"
              }`}
            >
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-blue-600/10 text-2xl text-blue-500">
                <FiBell />
              </div>
              <p className="mt-4 font-bold">No notifications yet</p>
              <p className={`mt-1 text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>
                New appointment and system updates will appear here.
              </p>
            </div>
          )}

          {items.map((notification) => (
            <div key={notification.id} className={itemClass(notification.is_read)}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex gap-3">
                  <span
                    className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                      notification.is_read
                        ? "bg-slate-400/50"
                        : "bg-blue-500 shadow-lg shadow-blue-500/40"
                    }`}
                  />
                  <div>
                    <p className="font-bold leading-snug">{notification.title}</p>
                    <p className={`mt-1 text-sm leading-relaxed ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                      {notification.message}
                    </p>
                  </div>
                </div>
                {!notification.is_read && (
                  <button
                    onClick={() => void handleRead(notification.id)}
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold transition ${
                      isDark
                        ? "bg-blue-500/10 text-blue-300 hover:bg-blue-500/20"
                        : "bg-white text-blue-700 shadow-sm hover:bg-blue-100"
                    }`}
                  >
                    Read
                  </button>
                )}
              </div>
              {notification.created_at && (
                <p className={`mt-3 text-xs font-semibold ${isDark ? "text-slate-500" : "text-slate-500"}`}>
                  {new Date(notification.created_at).toLocaleString()}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
