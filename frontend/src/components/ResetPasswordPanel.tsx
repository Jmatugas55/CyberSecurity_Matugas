import { useState } from "react"
import type { FormEvent } from "react"
import { Link } from "react-router-dom"
import { changePassword } from "../api/api"

interface Props {
  currentPassword?: string
  onSavePassword?: (newPassword: string) => void
  isDark?: boolean
}

export default function ResetPasswordPanel({ onSavePassword, isDark = true }: Props) {
  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "New password and confirmation must match." })
      return
    }
    setBusy(true)
    try {
      await changePassword({ current_password: oldPassword, new_password: newPassword })
      onSavePassword?.(newPassword)
      setMessage({ type: "success", text: "Password successfully updated." })
      setOldPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (error) {
      const detail = (error as { response?: { data?: { detail?: string } } }).response?.data?.detail
      setMessage({ type: "error", text: detail || "Password update failed." })
    } finally {
      setBusy(false)
    }
  }

  const container = isDark
    ? "w-full max-w-xl p-6 bg-gray-800 rounded-xl border border-gray-700 text-white"
    : "w-full max-w-xl p-6 bg-white rounded-xl border border-gray-200 text-gray-900"
  const input = isDark
    ? "w-full px-3 py-2 rounded-lg border border-gray-600 bg-gray-900 text-white"
    : "w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-900"

  return (
    <div className={container}>
      <h3 className="text-2xl font-bold">Change Password</h3>
      <p className="mb-4 opacity-75">Your current password is verified securely by the server.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input className={input} type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} placeholder="Current password" required />
        <input className={input} type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New strong password" required />
        <input className={input} type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" required />
        {message && <p className={message.type === "error" ? "text-red-400" : "text-green-400"}>{message.text}</p>}
        <button disabled={busy} className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white py-2 rounded-lg font-semibold">
          {busy ? "Updating..." : "Update Password"}
        </button>
      </form>
      <p className="mt-4 text-sm opacity-75">
        Forgot your password? <Link to="/forgot" className="text-blue-400 underline">Use account recovery</Link>
      </p>
    </div>
  )
}
