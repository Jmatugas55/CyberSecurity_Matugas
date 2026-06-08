import { useState } from "react"
import { useLocation, Link, useNavigate } from "react-router-dom"
import Notification from "../components/Modal"
import { loginUser } from "../api/api"
import { Eye, EyeOff, LogIn } from "lucide-react"
import { saveSession } from "../session"
import loginImg from "../images/login.png"

type ApiError = {
  response?: { data?: { detail?: unknown } }
  request?: unknown
  message?: string
}

export default function Login() {
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [notificationType, setNotificationType] = useState<"success" | "error">("success")
  const [notificationMessage, setNotificationMessage] = useState("")
  const navigate = useNavigate()
  const location = useLocation()
  const state = (location.state as { email?: string; password?: string } | null) || {}
  const prefillEmail = state.email || ""
  const prefillPassword = state.password || ""

  const [email, setEmail] = useState(prefillEmail)
  const [password, setPassword] = useState(prefillPassword)
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    try {
      const res = await loginUser({ email, password })
      const data = res.data
      saveSession({
        user_id: data.user_id,
        email: data.email,
        role: data.role,
        profile: data.profile,
        access_token: data.access_token,
      })
      setNotificationType("success")
      setNotificationMessage(`Welcome back, ${data.profile?.name || data.email}`)
      setNotificationOpen(true)
      setTimeout(() => {
        navigate(`/${data.role}`)
      }, 800)
    } catch (err) {
      const e = err as ApiError
      const detail = e.response?.data?.detail
      const validationMessage = Array.isArray(detail)
        ? detail
            .map((item: { msg?: string; loc?: unknown[] }) =>
              `${item.loc?.at(-1) || "Field"}: ${item.msg || "Invalid value"}`,
            )
            .join(" ")
        : ""
      const message =
        validationMessage ||
        (typeof detail === "string" && detail) ||
        (e.request ? "Unable to contact server. Is the backend running?" : e.message) ||
        "Login failed"
      setNotificationType("error")
      setNotificationMessage(message)
      setNotificationOpen(true)
    } finally {
      setBusy(false)
    }
  }

  const inputBase =
    "w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all duration-200 shadow-inner hover:bg-white"
  const labelBase = "block text-sm font-semibold text-slate-700 mb-1.5"

  return (
    <div className="h-screen w-full flex bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-50">
      <div className="w-full md:w-1/2 flex items-center justify-center px-6 sm:px-10 py-8">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl shadow-slate-300/40 border border-slate-100 p-8 sm:p-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-200 mb-4">
              <LogIn className="h-6 w-6" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Welcome Back</h1>
            <p className="text-slate-500 mt-2">Login to your account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className={labelBase}>Email Address</label>
              <input
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={inputBase}
              />
            </div>
            <div>
              <label className={labelBase}>Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={`${inputBase} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-500 hover:text-slate-700"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <Link
                to="/forgot"
                state={{ email }}
                className="text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={busy}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 rounded-xl font-semibold shadow-lg shadow-blue-200 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {busy ? "Signing in..." : "Login"}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-slate-500">
              No account yet?{" "}
              <Link to="/register" className="text-blue-600 font-semibold hover:text-blue-700">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>

      <div className="hidden md:block md:w-1/2 h-full relative">
        <img src={loginImg} alt="Login Visual" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 via-transparent to-indigo-900/30" />
        <div className="absolute bottom-10 left-10 right-10 text-white drop-shadow-lg">
          <p className="text-sm font-medium tracking-wider uppercase opacity-90">Healthcare Portal</p>
          <h2 className="text-3xl font-bold mt-2 leading-tight">
            Connecting patients with the right care
          </h2>
        </div>
      </div>

      <Notification
        open={notificationOpen}
        type={notificationType}
        message={notificationMessage}
        onClose={() => setNotificationOpen(false)}
        duration={2000}
        align="left"
      />
    </div>
  )
}
