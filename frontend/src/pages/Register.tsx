import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import AuthForm from "../components/AuthForm"
import type { RegisterBasics } from "../components/AuthForm"
import ResetMethodForm from "../components/ResetMethodForm"
import type { ResetMethodPayload } from "../components/ResetMethodForm"
import Notification from "../components/Modal"
import { checkEmailAvailability, registerUser } from "../api/api"
import registerImg from "../images/register.png"
import type { Role } from "../types"

type Step = "basics" | "reset"

export default function Register() {
  const navigate = useNavigate()
  const [role, setRole] = useState<Role>("patient")
  const [step, setStep] = useState<Step>("basics")
  const [basics, setBasics] = useState<RegisterBasics | null>(null)

  const [notificationOpen, setNotificationOpen] = useState(false)
  const [notificationType, setNotificationType] = useState<"success" | "error">("success")
  const [notificationMessage, setNotificationMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [basicsError, setBasicsError] = useState("")

  const showError = (msg: string) => {
    setNotificationType("error")
    setNotificationMessage(msg)
    setNotificationOpen(true)
  }

  const handleBasicsSubmit = async (data: RegisterBasics) => {
    setBasicsError("")
    setSubmitError("")

    // Basic email format check (defense-in-depth; AuthForm uses type="email").
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRe.test(data.email)) {
      const msg = "Please enter a valid email address."
      setBasicsError(msg)
      showError(msg)
      return
    }

    // Check whether the email is already registered before navigating.
    // /reset-method returns 200 if the user exists, 404 if not.
    setChecking(true)
    try {
      const response = await checkEmailAvailability(data.email)
      if (!response.data?.available) {
        const msg = "This email is already registered. Please use a different email or login instead."
        setBasicsError(msg)
        showError(msg)
        return
      }
      setBasics({ ...data, email: data.email.trim().toLowerCase() })
      setStep("reset")
      return
    } catch (err) {
      const e = err as {
        response?: { status?: number; data?: { detail?: unknown } }
        request?: unknown
        message?: string
      }
      const status = e.response?.status
      if (status === -1) {
        // Email is available — continue to step 2.
        setBasics(data)
        setStep("reset")
        return
      }
      // Network/other errors: surface and stay on step 1.
      const detail = e.response?.data?.detail
      const msg =
        (typeof detail === "string" && detail) ||
        (e.request ? "Unable to contact server. Is the backend running?" : e.message) ||
        "Could not verify email. Please try again."
      setBasicsError(msg)
      showError(msg)
    } finally {
      setChecking(false)
    }
  }

  const handleResetSubmit = async (reset: ResetMethodPayload) => {
    if (!basics) return
    setSubmitError("")
    setLoading(true)
    try {
      const payload: Record<string, unknown> = {
        ...basics,
        reset_method: reset.reset_method,
      }
      if (reset.reset_method === "key") payload.reset_key = reset.reset_key
      if (reset.reset_method === "question") payload.security_answers = reset.security_answers
      if (reset.reset_method === "face") payload.face_image = reset.face_image
      await registerUser(payload as unknown as Parameters<typeof registerUser>[0])

      setNotificationType("success")
      setNotificationMessage("Registration successful. Redirecting to login...")
      setNotificationOpen(true)
      localStorage.setItem("userEmail", basics.email)
      setTimeout(() => {
        navigate("/login", { state: { email: basics.email } })
      }, 1100)
    } catch (err) {
      const e = err as {
        response?: { data?: { detail?: unknown } }
        request?: unknown
        message?: string
      }
      let raw: unknown = e.response?.data?.detail
      if (Array.isArray(raw)) raw = (raw as { msg?: string }[]).map((x) => x.msg).join(" ")
      const msg =
        (typeof raw === "string" && raw) ||
        (e.request ? "Unable to contact server. Is the backend running?" : e.message) ||
        "Registration failed"
      setSubmitError(msg)
      setNotificationType("error")
      setNotificationMessage(msg)
      setNotificationOpen(true)
    } finally {
      setLoading(false)
    }
  }


  const formOnLeft = role === "patient"

  return (
    <div className="h-screen w-full overflow-hidden bg-gradient-to-br from-slate-100 via-blue-50 to-indigo-50">
      {/* Form pane */}
      <div
        className={`absolute top-0 h-full w-full md:w-1/2 transition-all duration-700 ease-in-out ${
          formOnLeft ? "md:left-0" : "md:left-1/2"
        } left-0`}
      >
        <div className="h-full flex items-center justify-center px-6 sm:px-10 py-6 overflow-y-auto">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl shadow-slate-300/40 border border-slate-100 p-8 sm:p-10 my-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-200 mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                {step === "basics" ? "Create Account" : "Account Recovery"}
              </h1>
              <p className="text-slate-500 mt-2">
                {step === "basics"
                  ? "Register to access the system"
                  : "Pick a method to recover your account later"}
              </p>
            </div>

            {/* Step indicator */}
            <div className="flex items-center gap-2 mb-6">
              <div className="flex-1 flex items-center gap-2">
                <span
                  className={`h-2 flex-1 rounded-full transition-colors duration-300 ${
                    step === "basics" ? "bg-blue-600" : "bg-blue-300"
                  }`}
                />
                <span className="text-xs font-medium text-slate-500">1</span>
              </div>
              <div className="flex-1 flex items-center gap-2">
                <span
                  className={`h-2 flex-1 rounded-full transition-colors duration-300 ${
                    step === "reset" ? "bg-blue-600" : "bg-slate-200"
                  }`}
                />
                <span className="text-xs font-medium text-slate-500">2</span>
              </div>
            </div>

            <div className="relative">
              <div
                key={step}
                className="animate-[fadeSlide_400ms_ease-out]"
              >
                {step === "basics" ? (
                  <AuthForm
                    role={role}
                    onRoleChange={setRole}
                    onSubmit={handleBasicsSubmit}
                    buttonText={checking ? "Checking email..." : "Continue"}
                    disabled={checking}
                    passwordError={basicsError}
                    enablePasswordGeneration={true}
                  />
                ) : (
                  <ResetMethodForm
                    onSubmit={handleResetSubmit}
                    onBack={() => setStep("basics")}
                    buttonText={loading ? "Creating account..." : "Create Account"}
                    disabled={loading}
                    errorMessage={submitError}
                  />
                )}
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-slate-500">
                Already have an account?{" "}
                <Link to="/login" className="text-blue-600 font-semibold hover:text-blue-700">
                  Login here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Image pane */}
      <div
        className={`hidden md:block absolute top-0 h-full w-1/2 transition-all duration-700 ease-in-out ${
          formOnLeft ? "left-1/2" : "left-0"
        }`}
      >
        <div className="relative h-full w-full overflow-hidden">
          <img src={registerImg} alt="Register Visual" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 via-transparent to-indigo-900/30" />
          <div className="absolute bottom-10 left-10 right-10 text-white drop-shadow-lg">
            <p className="text-black text-sm font-medium tracking-wider uppercase opacity-90">
              {role === "doctor" ? "For Healthcare Professionals" : "For Patients"}
            </p>
            <h2 className="text-3xl text-black font-bold mt-2 leading-tight">
              {role === "doctor"
                ? "Manage appointments with confidence"
                : "Find care, book with ease"}
            </h2>
          </div>
        </div>
      </div>

      <Notification
        open={notificationOpen}
        type={notificationType}
        message={notificationMessage}
        onClose={() => setNotificationOpen(false)}
        duration={2000}
        align={formOnLeft ? "left" : "right"}
      />
    </div>
  )
}
