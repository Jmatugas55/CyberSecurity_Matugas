import { useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { ArrowLeft, Eye, EyeOff, HelpCircle, KeyRound, ScanFace, ShieldCheck } from "lucide-react"
import Notification from "../components/Modal"
import FaceCapture from "../components/FaceCapture"
import { getResetMethod, getSecurityQuestion, requestPasswordReset, resetPassword } from "../api/api"
import forgot from "../images/forgot.png"

type Method = "key" | "question" | "face"
type Question = { id: number; question_text: string; answer: string }

export default function ForgotPassword() {
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState((location.state as { email?: string } | null)?.email || "")
  const [method, setMethod] = useState<Method | null>(null)
  const [resetKey, setResetKey] = useState("")
  const [questions, setQuestions] = useState<Question[]>([])
  const [faceImage, setFaceImage] = useState("")
  const [showCapture, setShowCapture] = useState(false)
  const [token, setToken] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [notif, setNotif] = useState({ open: false, type: "success" as "success" | "error", message: "" })
  const show = (type: "success" | "error", message: string) => setNotif({ open: true, type, message })

  const detectMethod = async (event: React.FormEvent) => {
    event.preventDefault()
    setBusy(true)
    try {
      const response = await getResetMethod(email.trim())
      const selected = response.data?.reset_method as Method
      if (!["key", "question", "face"].includes(selected)) throw new Error("Unsupported recovery method")
      setMethod(selected)
      if (selected === "question") {
        const questionResponse = await getSecurityQuestion(email.trim())
        const rows = questionResponse.data?.questions || []
        if (rows.length !== 3) throw new Error("This account does not have three recovery questions configured")
        setQuestions(rows.map((row: { id: number; question_text: string }) => ({ ...row, answer: "" })))
      }
    } catch (error) {
      const detail = (error as { response?: { data?: { detail?: string } }; message?: string }).response?.data?.detail
      show("error", detail || (error as Error).message || "Could not load the recovery method")
    } finally {
      setBusy(false)
    }
  }

  const verifyRecovery = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!method) return
    if (method === "key" && !/^[A-Za-z0-9_-]{6,32}$/.test(resetKey)) {
      return show("error", "Enter your 6-32 character reset key")
    }
    if (method === "question" && questions.some((question) => question.answer.trim().length < 3)) {
      return show("error", "Answer all three security questions")
    }
    if (method === "face" && !faceImage) return show("error", "Scan your face before continuing")

    setBusy(true)
    try {
      const payload = {
        email: email.trim(),
        reset_method: method,
        ...(method === "key" ? { reset_key: resetKey } : {}),
        ...(method === "question" ? {
          security_answers: questions.map((question) => ({
            question_id: question.id,
            answer: question.answer,
          })),
        } : {}),
        ...(method === "face" ? { face_image: faceImage } : {}),
      }
      const response = await requestPasswordReset(payload)
      setToken(response.data.token)
      show("success", "Identity verified. Set your new password.")
    } catch (error) {
      const detail = (error as { response?: { data?: { detail?: string } } }).response?.data?.detail
      show("error", detail || "Recovery verification failed")
    } finally {
      setBusy(false)
    }
  }

  const finish = async (event: React.FormEvent) => {
    event.preventDefault()
    if (password !== confirm) return show("error", "Passwords do not match")
    setBusy(true)
    try {
      await resetPassword({ email, token, new_password: password })
      show("success", "Password reset successful")
      setTimeout(() => navigate("/login", { state: { email } }), 900)
    } catch (error) {
      const detail = (error as { response?: { data?: { detail?: string } } }).response?.data?.detail
      show("error", detail || "Password reset failed")
    } finally {
      setBusy(false)
    }
  }

  const resetDetectedMethod = () => {
    setMethod(null)
    setResetKey("")
    setQuestions([])
    setFaceImage("")
    setShowCapture(false)
  }

  const input = "w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none"
  const methodLabel = method === "key" ? "Reset Key" : method === "question" ? "Three Security Questions" : "Face Recognition"
  const MethodIcon = method === "key" ? KeyRound : method === "question" ? HelpCircle : ScanFace

  return (
    <div className="min-h-screen w-full flex bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-50">
      <div className="w-full md:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-3xl border bg-white p-8 shadow-2xl">
          <div className="text-center mb-7">
            <ShieldCheck className="mx-auto mb-3 text-blue-600" size={42} />
            <h1 className="text-3xl font-bold text-slate-900">Secure Recovery</h1>
            <p className="text-slate-500 mt-2">Use the recovery method selected during registration.</p>
          </div>

          {!method && !token && (
            <form onSubmit={detectMethod} className="space-y-4">
              <input className={input} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" required />
              <button disabled={busy} className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white disabled:opacity-60">
                {busy ? "Checking..." : "Continue"}
              </button>
            </form>
          )}

          {method && !token && (
            <form onSubmit={verifyRecovery} className="space-y-4">
              <div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 p-3">
                <MethodIcon className="text-blue-600" size={20} />
                <div><p className="text-sm font-semibold text-slate-800">{methodLabel}</p><p className="text-xs text-slate-500">Configured recovery method</p></div>
              </div>

              {method === "key" && (
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">Reset Key</label>
                  <input className={input} type="password" value={resetKey} onChange={(e) => setResetKey(e.target.value)} placeholder="Enter your private reset key" required />
                </div>
              )}

              {method === "question" && questions.map((question, index) => (
                <div key={question.id}>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">{question.question_text}</label>
                  <input className={input} type="password" value={question.answer} required onChange={(e) => setQuestions((current) => current.map((item, i) => i === index ? { ...item, answer: e.target.value } : item))} />
                </div>
              ))}

              {method === "face" && (
                <div>
                  {!faceImage && !showCapture && <button type="button" onClick={() => setShowCapture(true)} className="w-full rounded-xl border-2 border-dashed border-blue-300 py-3 font-medium text-blue-600 hover:bg-blue-50">Open Camera to Scan Face</button>}
                  {showCapture && !faceImage && (
                    <FaceCapture
                      isDark={false}
                      scanEmail={email.trim()}
                      onCapture={(image) => { setFaceImage(image); setShowCapture(false) }}
                      onCancel={() => setShowCapture(false)}
                    />
                  )}
                  {faceImage && (
                    <div className="flex items-center gap-3 rounded-xl border bg-slate-50 p-3">
                      <img src={faceImage} alt="Verified face" className="h-20 w-20 rounded-lg object-cover" />
                      <div><p className="text-sm font-semibold text-emerald-700">Face matched</p><button type="button" onClick={() => { setFaceImage(""); setShowCapture(true) }} className="text-xs text-blue-600">Scan again</button></div>
                    </div>
                  )}
                </div>
              )}

              <button disabled={busy} className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white disabled:opacity-60">{busy ? "Verifying..." : "Verify & Continue"}</button>
              <button type="button" onClick={resetDetectedMethod} className="w-full text-sm text-slate-500">Use another email</button>
            </form>
          )}

          {token && (
            <form onSubmit={finish} className="space-y-4">
              <div className="relative">
                <input className={input} type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New strong password" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-slate-500">{showPassword ? <EyeOff /> : <Eye />}</button>
              </div>
              <input className={input} type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Confirm password" required />
              <button disabled={busy} className="w-full rounded-xl bg-blue-600 py-3 font-semibold text-white disabled:opacity-60">{busy ? "Resetting..." : "Reset Password"}</button>
            </form>
          )}

          <button onClick={() => navigate(-1)} className="mx-auto mt-5 flex items-center gap-2 text-sm text-slate-500"><ArrowLeft size={16} />Back</button>
        </div>
      </div>
      <div className="hidden md:block md:w-1/2 relative">
        <img src={forgot} alt="Cyberhealth recovery" className="h-full w-full object-cover" />
      </div>
      <Notification open={notif.open} type={notif.type} message={notif.message} onClose={() => setNotif((value) => ({ ...value, open: false }))} />
    </div>
  )
}
