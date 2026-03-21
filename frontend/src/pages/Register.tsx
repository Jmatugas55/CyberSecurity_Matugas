import { useState } from "react"
import { useNavigate } from "react-router-dom"
import AuthForm from "../components/AuthForm"
import { registerUser } from "../api/api"
import { Link } from "react-router-dom"
import cy from '../images/cy.webp'

export default function Register() {

  const navigate = useNavigate()

  const [modalOpen, setModalOpen] = useState(false)
  const [modalType, setModalType] = useState<"success" | "error">("success")
  const [modalMessage, setModalMessage] = useState("")
  const [loadingSuccess, setLoadingSuccess] = useState(false)

  const [passwordError, setPasswordError] = useState("")
  const [resetMethod, setResetMethod] = useState<"key" | "question">("key")
  const [resetKey, setResetKey] = useState("")
  const [securityQuestion, setSecurityQuestion] = useState("")
  const [securityAnswer, setSecurityAnswer] = useState("")
  const [keyError, setKeyError] = useState("")
  const [questionError, setQuestionError] = useState("")

  const handleRegister = async (data: { email: string; password: string }) => {

    setPasswordError("")
    setKeyError("")
    setQuestionError("")

    if (resetMethod === "key") {
      if (!resetKey.match(/^[A-Za-z0-9_-]{6,32}$/)) {
        setKeyError("Key must be 6-32 characters, letters/digits/-/_")
        return
      }
    } else {
      if (!securityQuestion.trim()) {
        setQuestionError("Security question cannot be empty")
        return
      }
      if (securityAnswer.trim().length < 3) {
        setQuestionError("Security answer must be at least 3 characters")
        return
      }
    }

    try {

      setLoadingSuccess(true)

      await registerUser({
        email: data.email,
        password: data.password,
        reset_method: resetMethod,
        reset_key: resetMethod === "key" ? resetKey : undefined,
        security_question: resetMethod === "question" ? securityQuestion : undefined,
        security_answer: resetMethod === "question" ? securityAnswer : undefined,
      })
      navigate("/login", { state: { email: data.email, password: data.password } })
      return

    } catch (err: any) {
      // distinguish between network failures and backend responses
      let msg: string | undefined
      if (err.response) {
        msg = err.response.data?.detail
        if (Array.isArray(msg)) {
          msg = msg.map((e: any) => e.msg).join(" ")
        }
      } else if (err.request) {
        msg = "Unable to contact server. Is the backend running?"
      } else {
        msg = err.message || "Registration failed"
      }
      msg = msg || "Registration failed"

      setPasswordError(msg)
      setModalType("error")
      setModalMessage(msg)
      setModalOpen(true)
    }

    setLoadingSuccess(false)
  }

 return (
    <div className="h-screen w-full flex">
      <div className="w-full md:w-1/2 flex items-center justify-center bg-white px-8 overflow-y-auto">
        <div className="w-full max-w-md py-10">

          <h1 className="text-3xl font-bold text-gray-800 text-center">
            Create Account
          </h1>

          <p className="text-gray-500 text-center mt-2 mb-8">
            Register to access the system
          </p>
          <div className="mb-5">
            <label className="text-sm text-gray-600">Reset Method</label>
            <select
              value={resetMethod}
              onChange={(e) => setResetMethod(e.target.value as "key" | "question")}
              className="text-gray-700 mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="key">Reset Key</option>
              <option value="question">Security Question</option>
            </select>
          </div>
          {resetMethod === "key" ? (
            <div className="mb-5">
              <label className="text-sm text-gray-600">Reset Key</label>
              <input
                type="text"
                value={resetKey}
                onChange={(e) => setResetKey(e.target.value)}
                placeholder="6-32 letters, digits, - or _"
                className="text-gray-700 mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              {keyError && <p className="text-red-500 text-sm mt-1">{keyError}</p>}
            </div>
          ) : (
            <div className="space-y-5 mb-5">
              <div>
                <label className="text-sm text-gray-600">Security Question</label>
                <select
                  value={securityQuestion}
                  onChange={(e) => setSecurityQuestion(e.target.value)}
                  className="text-gray-700 mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="">Select a security question</option>
                  <option value="What is your mother\'s maiden name?">What is your mother’s maiden name?</option>
                  <option value="What was your first pet\'s name?">What was your first pet’s name?</option>
                  <option value="What was the name of your first school?">What was the name of your first school?</option>
                  <option value="What is your favorite color?">What is your favorite color?</option>
                  <option value="What city were you born in?">What city were you born in?</option>
                </select>
              </div>

              <div>
                <label className="text-sm text-white-600">Security Answer</label>
                <input
                  type="text"
                  value={securityAnswer}
                  onChange={(e) => setSecurityAnswer(e.target.value)}
                  placeholder="Enter your answer"
                  className="mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none text-gray-700" 
                />
              </div>

              {questionError && ( 
                <p className="text-red-500 text-sm">{questionError}</p>
              )}
            </div>
          )}
          <AuthForm
            onSubmit={handleRegister}
            buttonText={loadingSuccess ? "Processing..." : "Register"}
            passwordError={passwordError}
            disabled={loadingSuccess}
            enablePasswordGeneration={true}
          />
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?
            </p>
            <Link
              to="/login"
              className="text-blue-600 font-semibold hover:underline"
            >
              Login here
            </Link>
          </div>

        </div>
      </div>
      <div className="hidden md:block md:w-1/2 h-full">
        <img
          src={cy}
          alt="Register Visual"
          className="w-full h-full object-cover"
        />
      </div>
      {modalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
          <div className="bg-white w-[90%] max-w-sm p-8 rounded-2xl shadow-xl text-center">

            {modalType === "success" && (
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}

            <h2 className="text-xl font-semibold mb-3">
              {modalType === "success" ? "Success" : "Error"}
            </h2>

            <p className="text-gray-600 mb-6">
              {modalMessage}
            </p>

            {modalType === "error" && (
              <button
                onClick={() => setModalOpen(false)}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
              >
                OK
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}