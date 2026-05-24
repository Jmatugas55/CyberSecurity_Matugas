import { useEffect, useState } from "react"
import { useNavigate, useLocation, useSearchParams } from "react-router-dom"
import { Eye, EyeOff, ArrowLeft, ShieldCheck } from "lucide-react"
import Notification from "../components/Modal"
import FaceCapture from "../components/FaceCapture"
import {
  requestPasswordReset,
  resetPassword,
  getSecurityQuestion,
  getResetMethod,
} from "../api/api"
import forgot from "../images/forgot.png"

type Method = "key" | "question" | "face"

type ApiError = {
  response?: { data?: { detail?: unknown } }
  request?: unknown
  message?: string
}

const initialForm = {
  email: "",
  method: "key" as Method,
  key: "",
  question: "",
  answer: "",
  faceImage: "",
  token: "",
  password: "",
  confirm: "",
}

export default function ForgotPassword() {
  const navigate = useNavigate()
  const location = useLocation()
  const passedEmail = (location.state as { email?: string } | null)?.email || ""
  const [searchParams, setSearchParams] = useSearchParams()
  const [form, setForm] = useState({ ...initialForm, email: passedEmail })
  const [notif, setNotif] = useState({ open: false, type: "success" as "success" | "error", msg: "" })
  const emailFixed = Boolean(passedEmail)
  const [status, setStatus] = useState({ loading: false, qError: "", validation: "", localError: "" })
  const [showCapture, setShowCapture] = useState(false)
  const [methodLocked, setMethodLocked] = useState(false)
  const [showPwd, setShowPwd] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const isResetStage = Boolean(form.token || searchParams.get("stage") === "reset")
  const show = (type: "success" | "error", msg: string) => setNotif({ open: true, type, msg })

  const validatePassword = (pwd: string) => {
    if (pwd.length < 8) return "Password must be at least 8 characters"
    if (!/[A-Z]/.test(pwd)) return "Must include at least one uppercase"
    if (!/[a-z]/.test(pwd)) return "Must include at least one lowercase"
    if (!/[0-9]/.test(pwd)) return "Must include at least one number"
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) return "Must include a special character"
    return ""
  }

  // When email is provided, fetch the user's chosen reset_method.
  useEffect(() => {
    if (!form.email.trim()) return
    let cancelled = false
    getResetMethod(form.email.trim())
      .then((res) => {
        if (cancelled) return
        const m = res.data?.reset_method as Method
        if (m === "key" || m === "question" || m === "face") {
          setForm((f) => ({ ...f, method: m }))
          setMethodLocked(true)
        }
      })
      .catch(() => {
        if (!cancelled) setMethodLocked(false)
      })
    return () => {
      cancelled = true
    }
  }, [form.email])

  useEffect(() => {
    if (form.token) setSearchParams({ stage: "reset" })
  }, [form.token, setSearchParams])

  useEffect(() => {
    if (form.method !== "question") return
    const email = form.email.trim()
    if (!email) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStatus((s) => ({ ...s, qError: "Enter email to load security question", loading: false }))
      return
    }
    let cancelled = false
    setStatus((s) => ({ ...s, loading: true, qError: "" }))
    getSecurityQuestion(email)
      .then((res) => {
        if (cancelled) return
        const q = res.data?.security_question || ""
        setForm((f) => ({ ...f, question: q }))
        setStatus((s) => ({ ...s, qError: q ? "" : "No security question found for this email" }))
      })
      .catch((err: ApiError) => {
        if (cancelled) return
        const detail = err?.response?.data?.detail
        setForm((f) => ({ ...f, question: "" }))
        setStatus((s) => ({
          ...s,
          qError: typeof detail === "string" ? detail : "Unable to load security question",
        }))
      })
      .finally(() => {
        if (!cancelled) setStatus((s) => ({ ...s, loading: false }))
      })
    return () => {
      cancelled = true
    }
  }, [form.method, form.email])

  const requestReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus((s) => ({ ...s, validation: "" }))
    const email = form.email.trim()
    if (!email) return setStatus((s) => ({ ...s, validation: "Email is required" }))

    const payload: Record<string, string> = { email, reset_method: form.method }

    if (form.method === "key") {
      const key = form.key.trim()
      if (!key) return setStatus((s) => ({ ...s, validation: "Reset key is required" }))
      if (!/^[A-Za-z0-9_-]{6,32}$/.test(key))
        return setStatus((s) => ({ ...s, validation: "Key must be 6-32 characters, letters/digits/-/_" }))
      payload.reset_key = key
    } else if (form.method === "question") {
      if (!form.question) return setStatus((s) => ({ ...s, validation: "Security question must be loaded first" }))
      if (!form.answer.trim()) return setStatus((s) => ({ ...s, validation: "Security answer is required" }))
      payload.security_question = form.question
      payload.security_answer = form.answer.trim()
    } else if (form.method === "face") {
      if (!form.faceImage) return setStatus((s) => ({ ...s, validation: "Please capture your face" }))
      payload.face_image = form.faceImage
    }

    try {
      const resp = await requestPasswordReset(payload as unknown as Parameters<typeof requestPasswordReset>[0])
      const token = resp.data?.token
      if (token) {
        setForm((f) => ({ ...f, token }))
        show("success", "Verification successful. Please enter your new password.")
      } else {
        show("error", "No token returned from server")
      }
    } catch (err) {
      const detail = (err as ApiError)?.response?.data?.detail
      show("error", typeof detail === "string" ? detail : "Unable to request reset")
    }
  }

  const resetSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const err = validatePassword(form.password)
    if (err) return setStatus((s) => ({ ...s, localError: err }))
    if (form.password !== form.confirm)
      return setStatus((s) => ({ ...s, localError: "Passwords do not match" }))
    setStatus((s) => ({ ...s, localError: "" }))

    try {
      await resetPassword({ email: form.email, token: form.token, new_password: form.password })
      show("success", "Password successfully reset, please login")
      setTimeout(() => navigate("/login", { state: { email: form.email, password: form.password } }), 1100)
    } catch (err) {
      const detail = (err as ApiError)?.response?.data?.detail
      show("error", typeof detail === "string" ? detail : "Reset failed")
    }
  }

  const inputBase =
    "w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all duration-200 shadow-inner hover:bg-white"
  const labelBase = "block text-sm font-semibold text-slate-700 mb-1.5"

  return (
    <div className="h-screen w-full flex bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-50">
      <div className="w-full md:w-1/2 flex items-center justify-center px-6 sm:px-10 py-8 overflow-y-auto">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl shadow-slate-300/40 border border-slate-100 p-8 sm:p-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-200 mb-4">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Forgot Password</h1>
            <p className="text-slate-500 mt-2">
              Verify with your chosen method, then set a new password
            </p>
          </div>

          <form onSubmit={isResetStage ? resetSubmit : requestReset} className="space-y-5 w-full">
            <div>
              <label className={labelBase}>Email Address</label>
              <input
                type="email"
                placeholder="example@email.com"
                value={form.email}
                onChange={(e) => {
                  if (!emailFixed) setForm((f) => ({ ...f, email: e.target.value }))
                }}
                required
                disabled={emailFixed}
                className={`${inputBase} ${emailFixed ? "bg-slate-100 text-slate-500" : ""}`}
              />
            </div>

            {!methodLocked && !isResetStage && (
              <div>
                <label className={labelBase}>Verification method</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["key", "question", "face"] as Method[]).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, method }))}
                      className={`py-2.5 rounded-xl text-xs font-semibold border transition-all duration-200 ${
                        form.method === method
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      {method === "key" ? "Reset Key" : method === "question" ? "Question" : "Face"}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {methodLocked && !isResetStage && (
              <div className="rounded-xl bg-blue-50 border border-blue-100 px-4 py-3">
                <p className="text-xs text-slate-600">
                  Detected reset method:{" "}
                  <span className="font-semibold text-blue-700">
                    {form.method === "key"
                      ? "Reset Key"
                      : form.method === "question"
                      ? "Security Question"
                      : "Face Recognition"}
                  </span>
                </p>
              </div>
            )}

            {!isResetStage && form.method === "key" && (
              <div>
                <label className={labelBase}>Reset key</label>
                <input
                  type="text"
                  value={form.key}
                  onChange={(e) => setForm((f) => ({ ...f, key: e.target.value }))}
                  placeholder="Enter reset key"
                  className={inputBase}
                />
              </div>
            )}

            {!isResetStage && form.method === "question" && (
              <div className="space-y-3">
                <div>
                  <label className={labelBase}>Security question</label>
                  {status.loading ? (
                    <p className="text-slate-600 text-sm">Loading your question...</p>
                  ) : form.question ? (
                    <p className="text-slate-800 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm">
                      {form.question}
                    </p>
                  ) : (
                    <p className="text-rose-600 text-sm">
                      {status.qError || "No security question available."}
                    </p>
                  )}
                </div>
                <div>
                  <label className={labelBase}>Security answer</label>
                  <input
                    type="text"
                    value={form.answer}
                    onChange={(e) => setForm((f) => ({ ...f, answer: e.target.value }))}
                    placeholder="Enter your security answer"
                    className={inputBase}
                  />
                </div>
              </div>
            )}

            {!isResetStage && form.method === "face" && (
              <div className="space-y-2">
                {!form.faceImage && !showCapture && (
                  <button
                    type="button"
                    onClick={() => setShowCapture(true)}
                    disabled={!form.email.trim()}
                    className="w-full py-3 rounded-xl border-2 border-dashed border-blue-300 text-blue-600 hover:bg-blue-50 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Open Camera to Scan
                  </button>
                )}
                {showCapture && !form.faceImage && (
                  <FaceCapture
                    isDark={false}
                    onCapture={(d) => {
                      setForm((f) => ({ ...f, faceImage: d }))
                      setShowCapture(false)
                    }}
                    onCancel={() => setShowCapture(false)}
                    scanEmail={form.email.trim() || undefined}
                  />
                )}
                {form.faceImage && (
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <img
                      src={form.faceImage}
                      alt="captured"
                      className="w-20 h-20 rounded-lg object-cover border border-slate-300"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-700">Face captured</p>
                      <button
                        type="button"
                        className="text-xs font-medium text-blue-600 hover:text-blue-700 mt-1"
                        onClick={() => {
                          setForm((f) => ({ ...f, faceImage: "" }))
                          setShowCapture(true)
                        }}
                      >
                        Retake photo
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {isResetStage && (
              <>
                <div>
                  <label className={labelBase}>Reset Token</label>
                  <input
                    type="text"
                    placeholder="Enter token"
                    value={form.token}
                    onChange={(e) => setForm((f) => ({ ...f, token: e.target.value }))}
                    required
                    className={inputBase}
                  />
                </div>
                <div>
                  <label className={labelBase}>New Password</label>
                  <div className="relative">
                    <input
                      type={showPwd ? "text" : "password"}
                      placeholder="Enter new password"
                      value={form.password}
                      onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                      required
                      className={`${inputBase} pr-12`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(!showPwd)}
                      className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-500 hover:text-slate-700"
                    >
                      {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className={labelBase}>Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      placeholder="Confirm new password"
                      value={form.confirm}
                      onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
                      required
                      className={`${inputBase} pr-12`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-500 hover:text-slate-700"
                    >
                      {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </>
            )}

            {status.validation && <p className="text-rose-600 text-sm">{status.validation}</p>}
            {status.localError && <p className="text-rose-600 text-sm">{status.localError}</p>}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 rounded-xl font-semibold shadow-lg shadow-blue-200 transition-all duration-300"
            >
              {isResetStage ? "Reset Password" : "Verify & Continue"}
            </button>
          </form>

          <button
            onClick={() => navigate(-1)}
            className="mt-6 flex items-center justify-center gap-1.5 mx-auto text-sm font-medium text-slate-500 hover:text-slate-700 transition"
          >
            <ArrowLeft size={16} />
            Back
          </button>
        </div>
      </div>

      <div className="hidden md:block md:w-1/2 h-full relative">
        <img src={forgot} alt="Forgot Visual" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 via-transparent to-indigo-900/30" />
        <div className="absolute bottom-10 left-10 right-10 text-white drop-shadow-lg">
          <p className="text-sm font-medium tracking-wider uppercase opacity-90">Account Recovery</p>
          <h2 className="text-3xl font-bold mt-2 leading-tight">
            Securely regain access to your account
          </h2>
        </div>
      </div>

      <Notification
        open={notif.open}
        type={notif.type}
        message={notif.msg}
        onClose={() => setNotif((n) => ({ ...n, open: false }))}
        duration={2000}
        align="left"
      />
    </div>
  )
}
