import { useEffect, useState } from "react"
import { useTheme } from "../theme"
import { listNotifications, markAllNotificationsRead, markNotificationRead } from "../api/api"
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

  const reload = async () => {
    if (!email) return
    setLoading(true)
    try {
      const data = await listNotifications(email)
      setItems(data)
      onCountChange?.(data.filter((n) => !n.is_read).length)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, email])

  // poll every 15s while mounted so updates from doctor reach the patient quickly
  useEffect(() => {
    if (!email) return
    const t = setInterval(reload, 15000)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email])

  if (!open) return null

  const panel = isDark
    ? "bg-gray-900 border border-gray-700 text-gray-100"
    : "bg-white border border-gray-200 text-gray-900"

  const itemCls = (read: boolean) =>
    `p-3 rounded-lg border ${
      isDark
        ? read
          ? "bg-gray-800 border-gray-700"
          : "bg-blue-900/40 border-blue-700"
        : read
        ? "bg-gray-50 border-gray-200"
        : "bg-blue-50 border-blue-200"
    }`

  const handleRead = async (id: number) => {
    await markNotificationRead(id)
    reload()
  }

  const handleReadAll = async () => {
    await markAllNotificationsRead(email)
    reload()
  }

  return (
    <div className="fixed inset-0 z-40 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        className={`relative h-full w-full max-w-md shadow-2xl flex flex-col ${panel}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`flex justify-between items-center p-4 border-b ${isDark ? "border-gray-700" : "border-gray-200"}`}>
          <h3 className="text-lg font-semibold">Notifications</h3>
          <div className="flex gap-2">
            <button
              onClick={handleReadAll}
              className="text-xs text-blue-500 hover:underline"
            >
              Mark all read
            </button>
            <button onClick={onClose} className="text-sm opacity-70 hover:opacity-100">
              ✕
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading && <p className="text-sm opacity-70">Loading...</p>}
          {!loading && items.length === 0 && <p className="text-sm opacity-70">No notifications.</p>}
          {items.map((n) => (
            <div key={n.id} className={itemCls(n.is_read)}>
              <div className="flex justify-between gap-2">
                <p className="font-medium">{n.title}</p>
                {!n.is_read && (
                  <button onClick={() => handleRead(n.id)} className="text-xs text-blue-500 hover:underline">
                    Mark read
                  </button>
                )}
              </div>
              <p className={`text-sm mt-1 ${isDark ? "text-gray-300" : "text-gray-700"}`}>{n.message}</p>
              {n.created_at && (
                <p className={`text-xs mt-1 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                  {new Date(n.created_at).toLocaleString()}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
