import { useState } from "react"
import type { FormEvent } from "react"
import { Link } from "react-router-dom"

interface Props {
  currentPassword: string
  onSavePassword: (newPassword: string) => void
}

export default function ResetPasswordPanel({ currentPassword, onSavePassword }: Props) {
  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const validatePassword = (pwd: string) => {
    if (pwd.length < 8) return "Password must be at least 8 characters"
    if (!/[A-Z]/.test(pwd)) return "Must include at least one uppercase letter"
    if (!/[a-z]/.test(pwd)) return "Must include at least one lowercase letter"
    if (!/[0-9]/.test(pwd)) return "Must include at least one number"
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) return "Must include at least one special character"
    return ""
  }

  const handleResetSubmit = (e: FormEvent) => {
    e.preventDefault()
    setMessage(null)

    if (!oldPassword) {
      setMessage({ type: "error", text: "Current password is required." })
      return
    }
    if (oldPassword !== currentPassword) {
      setMessage({ type: "error", text: "Current password does not match." })
      return
    }

    const validationError = validatePassword(newPassword)
    if (validationError) {
      setMessage({ type: "error", text: validationError })
      return
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "New password and confirmation must match." })
      return
    }

    onSavePassword(newPassword)
    setMessage({ type: "success", text: "Password successfully updated." })
    setOldPassword("")
    setNewPassword("")
    setConfirmPassword("")
  }

  return (
    <div className="w-full max-w-xl p-6 bg-gray-800 rounded-xl shadow-lg border border-gray-700">
      <h3 className="text-2xl font-bold text-white mb-4">Reset Password</h3>
      <p className="mb-4 text-gray-300">Enter your current password and choose a new password.</p>
      <form onSubmit={handleResetSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-gray-200 mb-1">Current Password</label>
          <input
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-lg border border-gray-600 bg-gray-900 text-white placeholder-gray-500"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-200 mb-1">New Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-lg border border-gray-600 bg-gray-900 text-white placeholder-gray-500"
          />
        </div>
        <div>
          <label className="block text-sm text-gray-200 mb-1">Confirm New Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full px-3 py-2 rounded-lg border border-gray-600 bg-gray-900 text-white placeholder-gray-500"
          />
        </div>

        {message && (
          <p className={`text-sm ${message.type === "error" ? "text-red-400" : "text-green-400"}`}>{message.text}</p>
        )}

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold transition"
        >
          Update Password
        </button>
      </form>

      <p className="text-gray-300 mt-4 text-sm">
        Forgot your password?&nbsp;
        <Link to="/forgot" state={{ email: localStorage.getItem("userEmail") || "" }} className="text-blue-300 hover:text-blue-100 underline">
          go to reset method
        </Link>
      </p>
    </div>
  )
}
