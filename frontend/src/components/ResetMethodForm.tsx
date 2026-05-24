import { useState } from "react"
import { KeyRound, HelpCircle, ScanFace, ArrowLeft } from "lucide-react"
import FaceCapture from "./FaceCapture"

export type ResetMethod = "key" | "question" | "face"

export type ResetMethodPayload = {
  reset_method: ResetMethod
  reset_key?: string
  security_question?: string
  security_answer?: string
  face_image?: string
}

interface Props {
  onSubmit: (data: ResetMethodPayload) => void
  onBack: () => void
  buttonText: string
  disabled?: boolean
  errorMessage?: string
}

const methodOptions: { value: ResetMethod; title: string; description: string; Icon: typeof KeyRound }[] = [
  {
    value: "key",
    title: "Reset Key",
    description: "A personal recovery code only you know",
    Icon: KeyRound,
  },
  {
    value: "question",
    title: "Security Question",
    description: "Answer a memorable question to recover",
    Icon: HelpCircle,
  },
  {
    value: "face",
    title: "Face Recognition",
    description: "Use your camera to verify your identity",
    Icon: ScanFace,
  },
]

export default function ResetMethodForm({
  onSubmit,
  onBack,
  buttonText,
  disabled,
  errorMessage,
}: Props) {
  const [method, setMethod] = useState<ResetMethod>("key")
  const [resetKey, setResetKey] = useState("")
  const [securityQuestion, setSecurityQuestion] = useState("")
  const [securityAnswer, setSecurityAnswer] = useState("")
  const [faceImage, setFaceImage] = useState("")
  const [showCapture, setShowCapture] = useState(false)
  const [localError, setLocalError] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (method === "key") {
      if (!/^[A-Za-z0-9_-]{6,32}$/.test(resetKey)) {
        return setLocalError("Reset key must be 6-32 characters, letters/digits/-/_")
      }
    } else if (method === "question") {
      if (!securityQuestion.trim()) return setLocalError("Please select a security question")
      if (securityAnswer.trim().length < 3) return setLocalError("Security answer must be at least 3 characters")
    } else if (method === "face") {
      if (!faceImage) return setLocalError("Please capture your face before submitting")
    }
    setLocalError("")

    const payload: ResetMethodPayload = { reset_method: method }
    if (method === "key") payload.reset_key = resetKey
    if (method === "question") {
      payload.security_question = securityQuestion
      payload.security_answer = securityAnswer
    }
    if (method === "face") payload.face_image = faceImage

    onSubmit(payload)
  }

  const inputBase =
    "w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all duration-200 shadow-inner hover:bg-white"

  return (
    <form onSubmit={handleSubmit} className="space-y-5 w-full">
      <div className="space-y-2">
        <p className="text-sm font-medium text-slate-700">Choose a password recovery method</p>
        <div className="grid grid-cols-1 gap-2">
          {methodOptions.map(({ value, title, description, Icon }) => {
            const active = method === value
            return (
              <button
                key={value}
                type="button"
                onClick={() => setMethod(value)}
                className={`flex items-start gap-3 text-left p-3 rounded-xl border-2 transition-all duration-200 ${
                  active
                    ? "border-blue-500 bg-blue-50 shadow-sm"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <span
                  className={`mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-lg ${
                    active ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  <Icon size={18} />
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-semibold text-slate-900">{title}</span>
                  <span className="block text-xs text-slate-500">{description}</span>
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {method === "key" && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Reset Key</label>
          <input
            type="text"
            value={resetKey}
            onChange={(e) => setResetKey(e.target.value)}
            placeholder="6-32 letters, digits, - or _"
            className={inputBase}
          />
          <p className="text-xs text-slate-500 mt-1.5">
            Pick something memorable. You will need this key to recover your account.
          </p>
        </div>
      )}

      {method === "question" && (
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Security Question</label>
            <select
              value={securityQuestion}
              onChange={(e) => setSecurityQuestion(e.target.value)}
              className={inputBase}
            >
              <option value="">Select a security question</option>
              <option value="What is your mother's maiden name?">What is your mother's maiden name?</option>
              <option value="What was your first pet's name?">What was your first pet's name?</option>
              <option value="What was the name of your first school?">What was the name of your first school?</option>
              <option value="What is your favorite color?">What is your favorite color?</option>
              <option value="What city were you born in?">What city were you born in?</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Security Answer</label>
            <input
              type="text"
              value={securityAnswer}
              onChange={(e) => setSecurityAnswer(e.target.value)}
              placeholder="Enter your answer"
              className={inputBase}
            />
          </div>
        </div>
      )}

      {method === "face" && (
        <div className="space-y-2">
          {!faceImage && !showCapture && (
            <button
              type="button"
              onClick={() => setShowCapture(true)}
              className="w-full py-3 rounded-xl border-2 border-dashed border-blue-300 text-blue-600 hover:bg-blue-50 transition font-medium"
            >
              Open Camera to Enroll Face
            </button>
          )}
          {showCapture && !faceImage && (
            <FaceCapture
              isDark={false}
              onCapture={(d) => {
                setFaceImage(d)
                setShowCapture(false)
              }}
              onCancel={() => setShowCapture(false)}
              buttonText="Capture & Save"
              description="Position your face clearly within the frame and click Capture."
            />
          )}
          {faceImage && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <img src={faceImage} alt="captured" className="w-20 h-20 rounded-lg object-cover border border-slate-300" />
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-700">Face captured</p>
                <button
                  type="button"
                  className="text-xs font-medium text-blue-600 hover:text-blue-700 mt-1"
                  onClick={() => {
                    setFaceImage("")
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

      {(localError || errorMessage) && (
        <p className="text-rose-600 text-sm">{localError || errorMessage}</p>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={disabled}
          className="flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl border border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 transition disabled:opacity-50"
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <button
          type="submit"
          disabled={disabled}
          className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 rounded-xl font-semibold shadow-lg shadow-blue-200 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
        >
          {buttonText}
        </button>
      </div>
    </form>
  )
}
