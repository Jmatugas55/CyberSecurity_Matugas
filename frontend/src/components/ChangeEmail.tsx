import { useState } from "react"
import { verifyPasswordForChangeEmail, changeEmail } from "../api/api"

interface Props {
  open: boolean
  onClose: () => void
  currentEmail: string
  isDark: boolean
}

export default function ChangeEmail({ open, onClose, currentEmail, isDark }: Props) {
  const [step, setStep] = useState<1 | 2>(1)
  const [password, setPassword] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  if (!open) return null

  const card = isDark
    ? "bg-gray-900 text-gray-100 border-gray-700"
    : "bg-white text-gray-900 border-gray-200"

  const input = isDark
    ? "w-full px-3 py-2 rounded-lg bg-gray-800 text-white border border-gray-600 mb-3 focus:ring-2 focus:ring-blue-500 outline-none"
    : "w-full px-3 py-2 rounded-lg bg-white text-gray-900 border border-gray-300 mb-3 focus:ring-2 focus:ring-blue-500 outline-none"

  const subText = isDark ? "text-gray-300" : "text-gray-600"

  const verify = async () => {
    setError("")
    setLoading(true)
    try {
      const resp = await verifyPasswordForChangeEmail({ email: currentEmail, password })
      if (resp?.data?.verified) setStep(2)
    } catch (e) {
      const err = e as { response?: { data?: { detail?: string } } }
      setError(err?.response?.data?.detail || "Invalid password")
    } finally {
      setLoading(false)
    }
  }

  const submit = async () => {
    setError("")
    setLoading(true)
    try {
      await changeEmail({ current_email: currentEmail, password, new_email: newEmail })
      localStorage.setItem("userEmail", newEmail)
      onClose()
      setStep(1)
      setPassword("")
      setNewEmail("")
    } catch (e) {
      const err = e as { response?: { data?: { detail?: string } } }
      setError(err?.response?.data?.detail || "Failed to change email")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div className={`w-full max-w-md rounded-lg shadow-xl border p-6 ${card}`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Change Email</h3>
        </div>

        {step === 1 && (
          <div>
            <p className={`text-sm mb-3 ${subText}`}>Enter your current password to continue.</p>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={input}
              placeholder="Current password"
            />
            {error && <p className="text-sm text-red-400 mb-2">{error}</p>}
            <div className="flex justify-end gap-2">
              <button
                onClick={onClose}
                className={`px-3 py-1 rounded-lg ${
                  isDark ? "bg-gray-700 text-gray-200 hover:bg-gray-600" : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                }`}
              >
                Cancel
              </button>
              <button
                onClick={verify}
                disabled={loading}
                className="px-3 py-1 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {loading ? "Checking..." : "Verify"}
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <p className={`text-sm mb-3 ${subText}`}>Enter the new email address.</p>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className={input}
              placeholder="New email"
            />
            {error && <p className="text-sm text-red-400 mb-2">{error}</p>}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setStep(1)}
                className={`px-3 py-1 rounded-lg ${
                  isDark ? "bg-gray-700 text-gray-200 hover:bg-gray-600" : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                }`}
              >
                Back
              </button>
              <button
                onClick={submit}
                disabled={loading}
                className="px-3 py-1 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-60"
              >
                {loading ? "Saving..." : "Change Email"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
