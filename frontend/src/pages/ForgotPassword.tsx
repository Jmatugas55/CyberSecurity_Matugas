import { useState, useEffect } from "react"
import type { FormEvent } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import Modal from "../components/Modal"
import { requestPasswordReset, resetPassword, getSecurityQuestion } from "../api/api"
import cyb from '../images/cyb.jpg'

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [modalOpen, setModalOpen] = useState(false)
  const [modalType, setModalType] = useState<"success" | "error">("success")
  const [modalMessage, setModalMessage] = useState("")

  const [forgotEmail, setForgotEmail] = useState("")
  const [forgotMethod, setForgotMethod] = useState<"key" | "question">("key")
  const [forgotKey, setForgotKey] = useState("")
  const [securityQuestion, setSecurityQuestion] = useState("")
  const [securityAnswer, setSecurityAnswer] = useState("")
  const [questionLoading, setQuestionLoading] = useState(false)
  const [questionError, setQuestionError] = useState("")
  const [validationError, setValidationError] = useState("")

  const isResetStage = searchParams.get("stage") === "reset"

  const [resetToken, setResetToken] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmNewPassword, setConfirmNewPassword] = useState("")
  const [localError, setLocalError] = useState("")

  const validatePassword = (pwd: string) => {
    if (pwd.length < 8) return "Password must be at least 8 characters";
    if (!/[A-Z]/.test(pwd)) return "Must include at least one uppercase";
    if (!/[a-z]/.test(pwd)) return "Must include at least one lowercase";
    if (!/[0-9]/.test(pwd)) return "Must include at least one number";
    if (!/[!@#$%^&*(),.?\":{}|<>]/.test(pwd)) return "Must include a special character";
    return "";
  };

  useEffect(() => {
    if (resetToken) {
      setSearchParams({ stage: "reset" })
    }
  }, [resetToken, setSearchParams])

  useEffect(() => {
    if (forgotMethod !== "question") {
      setSecurityQuestion("")
      setQuestionError("")
      setQuestionLoading(false)
      return
    }

    if (!forgotEmail.trim()) {
      setSecurityQuestion("")
      setQuestionError("Enter email to load security question")
      return
    }

    setQuestionLoading(true)
    setQuestionError("")
    getSecurityQuestion(forgotEmail.trim())
      .then((resp) => {
        const q = resp.data?.security_question || ""
        setSecurityQuestion(q)
        if (!q) {
          setQuestionError("No security question found for this email")
        }
      })
      .catch((err: any) => {
        setSecurityQuestion("")
        const detail = err?.response?.data?.detail
        setQuestionError(
          typeof detail === "string" ? detail : "Unable to load security question"
        )
      })
      .finally(() => setQuestionLoading(false))
  }, [forgotMethod, forgotEmail])

  const handleForgotRequest = async (e: FormEvent) => {
    e.preventDefault()
    setValidationError("")

    if (!forgotEmail.trim()) {
      setValidationError("Email is required")
      return
    }

    const payload: any = { email: forgotEmail.trim(), reset_method: forgotMethod }

    if (forgotMethod === "key") {
      if (!forgotKey.trim()) {
        setValidationError("Reset key is required")
        return
      }
      if (!forgotKey.match(/^[A-Za-z0-9_-]{6,32}$/)) {
        setValidationError("Key must be 6-32 characters, letters/digits/-/_")
        return
      }
      payload.reset_key = forgotKey.trim()
    } else {
      if (!securityQuestion) {
        setValidationError("Security question must be loaded first")
        return
      }
      if (!securityAnswer.trim()) {
        setValidationError("Security answer is required")
        return
      }
      payload.security_question = securityQuestion
      payload.security_answer = securityAnswer.trim()
    }

    try {
      const resp = await requestPasswordReset(payload)
      if (resp.data?.token) {
        setResetToken(resp.data.token)
        setSearchParams({ stage: "reset" })
        setModalType("success")
        setModalMessage("Reset token issued; please enter new password")
        setModalOpen(true)
      } else {
        setModalType("error")
        setModalMessage("No token returned from server")
        setModalOpen(true)
      }
    } catch (err:any) {
      setModalType("error")
      const detail = err?.response?.data?.detail
      setModalMessage(
        typeof detail === "string" ? detail : JSON.stringify(detail) || "Unable to request reset"
      )
      setModalOpen(true)
    }
  }

  const handleResetSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const err = validatePassword(newPassword)
    if (err) {
      setLocalError(err)
      return
    }
    if (newPassword !== confirmNewPassword) {
      setLocalError("Passwords do not match")
      return
    }
    setLocalError("")
    try {
      await resetPassword({
        email: forgotEmail,
        token: resetToken,
        new_password: newPassword,
      })
      setModalType("success")
      setModalMessage("Password successfully reset, please login")
      setModalOpen(true)
      navigate("/login", { state: { email: forgotEmail, password: newPassword } })
      setForgotEmail("")
      setForgotKey("")
      setSecurityAnswer("")
      setResetToken("")
    } catch (err:any) {
      setModalType("error")
      {
        const detail = err?.response?.data?.detail
        setModalMessage(
          typeof detail === "string" ? detail : JSON.stringify(detail) || "Reset failed"
        )
      }
      setModalOpen(true)
    }
  }

  return (
    <div className="h-screen w-full flex">
      <div className="w-full md:w-1/2 flex items-center justify-center bg-white px-8">
        <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-center text-gray-800">Forgot Password</h1>
        <p className="text-gray-500 text-center mt-2 mb-8">
          Enter your email and verification method
        </p>
        <form
          onSubmit={resetToken ? handleResetSubmit : handleForgotRequest}
          className="space-y-5 w-full"
        >
          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">
              Email Address
            </label>
            <input
              type="email"
              placeholder="example@email.com"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              required
              className="text-black px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-sm text-gray-600 mb-1">
              Verification method
            </label>
            <div className="flex space-x-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="method"
                  value="key"
                  checked={forgotMethod === "key"}
                  onChange={() => setForgotMethod("key")}
                  className="form-radio"
                />
                <span className="ml-2 text-gray-800">Reset key</span>
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="method"
                  value="question"
                  checked={forgotMethod === "question"}
                  onChange={() => setForgotMethod("question")}
                  className="form-radio "
                />
                <span className="ml-2 text-gray-800">Security question</span>
              </label>
            </div>
          </div>

          {forgotMethod === "key" && (
            <div className="flex flex-col">
              <label className="text-sm text-gray-600 mb-1">Reset key</label>
              <input
                type="text"
                value={forgotKey}
                onChange={(e) => setForgotKey(e.target.value)}
                placeholder="Enter reset key"
                className="text-black px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          )}

          {forgotMethod === "question" && (
            <div className="space-y-3">
              <div className="flex flex-col">
                <label className="text-sm text-gray-600 mb-1">Security question</label>
                {questionLoading ? (
                  <p className="text-gray-700">Loading your question...</p>
                ) : securityQuestion ? (
                  <p className="text-black px-4 py-3 border border-gray-300 rounded-lg bg-gray-50">
                    {securityQuestion}
                  </p>
                ) : (
                  <p className="text-red-500">{questionError || "No security question available."}</p>
                )}
              </div>
              <div className="flex flex-col">
                <label className="text-sm text-gray-600 mb-1">Security answer</label>
                <input
                  type="text"
                  value={securityAnswer}
                  onChange={(e) => setSecurityAnswer(e.target.value)}
                  placeholder="Enter your security answer"
                  className="text-black px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          {(resetToken || isResetStage) && (
            <>
              <div className="flex flex-col">
                <label className="text-sm text-gray-600 mb-1">Reset Token</label>
                <input
                  type="text"
                  placeholder="Enter token"
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  required
                  className="text-black px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-sm text-gray-600 mb-1">New Password</label>
                <input
                  type="password"
                  placeholder="Enter new password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="text-black px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex flex-col">
                <label className="text-sm text-gray-600 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  required
                  className="text-black px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </>
          )}

          {validationError && (
            <p className="text-red-500 text-sm mt-1">{validationError}</p>
          )}
          {localError && (
            <p className="text-red-500 text-sm mt-1">{localError}</p>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-semibold"
          >
            {resetToken ? "Reset Password" : "Send Reset Token"}
          </button>
        </form>

        <p className="text-sm text-center mt-4">
          <span
            className="text-blue-600 hover:underline cursor-pointer text-md"
            onClick={() => navigate("/login")}
          >
            Back to login
          </span>
        </p>
      </div>
      <Modal
        open={modalOpen}
        type={modalType}
        message={modalMessage}
        onClose={() => setModalOpen(false)}
      />
    </div>
    <div className="hidden md:block md:w-1/2 h-full">
        <img
          src={cyb}
          alt="Login Visual"
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  )
}
