import { useEffect, useState } from "react"
import { ArrowLeft, HelpCircle, KeyRound, ScanFace } from "lucide-react"
import { listSecurityQuestions } from "../api/api"
import FaceCapture from "./FaceCapture"

export type ResetMethod = "key" | "question" | "face"
export type ResetMethodPayload = {
  reset_method: ResetMethod
  reset_key?: string
  security_answers?: { question_id: number; answer: string }[]
  face_image?: string
}

interface Props {
  onSubmit: (data: ResetMethodPayload) => void
  onBack: () => void
  buttonText: string
  disabled?: boolean
  errorMessage?: string
}

const methods = [
  { value: "key" as const, title: "Reset Key", description: "Use a private recovery key", Icon: KeyRound },
  { value: "question" as const, title: "Security Questions", description: "Answer three private questions", Icon: HelpCircle },
  { value: "face" as const, title: "Face Recognition", description: "Verify using your camera", Icon: ScanFace },
]

export default function ResetMethodForm({ onSubmit, onBack, buttonText, disabled, errorMessage }: Props) {
  const [method, setMethod] = useState<ResetMethod>("key")
  const [resetKey, setResetKey] = useState("")
  const [questions, setQuestions] = useState<{ id: number; question_text: string }[]>([])
  const [selected, setSelected] = useState(["", "", ""])
  const [answers, setAnswers] = useState(["", "", ""])
  const [faceImage, setFaceImage] = useState("")
  const [showCapture, setShowCapture] = useState(false)
  const [localError, setLocalError] = useState("")

  useEffect(() => {
    listSecurityQuestions().then(setQuestions).catch(() => setLocalError("Could not load security questions"))
  }, [])

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (method === "key") {
      if (!/^[A-Za-z0-9_-]{6,32}$/.test(resetKey)) {
        return setLocalError("Reset key must be 6-32 letters, numbers, hyphens, or underscores")
      }
      onSubmit({ reset_method: "key", reset_key: resetKey })
    } else if (method === "question") {
      const ids = selected.map(Number)
      if (ids.some((id) => !id) || new Set(ids).size !== 3) {
        return setLocalError("Choose three different security questions")
      }
      if (answers.some((answer) => answer.trim().length < 3)) {
        return setLocalError("Every security answer must be at least 3 characters")
      }
      onSubmit({
        reset_method: "question",
        security_answers: ids.map((question_id, index) => ({
          question_id,
          answer: answers[index].trim(),
        })),
      })
    } else {
      if (!faceImage) return setLocalError("Capture your face before creating the account")
      onSubmit({ reset_method: "face", face_image: faceImage })
    }
    setLocalError("")
  }

  const input = "w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 focus:outline-none"
  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid gap-2">
        {methods.map(({ value, title, description, Icon }) => (
          <button
            key={value} type="button" onClick={() => { setMethod(value); setLocalError("") }}
            className={`flex items-center gap-3 rounded-xl border-2 p-3 text-left transition ${
              method === value ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <span className={`rounded-lg p-2 ${method === value ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}><Icon size={18} /></span>
            <span><span className="block text-sm font-semibold text-slate-900">{title}</span><span className="block text-xs text-slate-500">{description}</span></span>
          </button>
        ))}
      </div>

      {method === "key" && (
        <div>
          <label className="mb-1 block text-sm font-semibold text-slate-700">Private Reset Key</label>
          <input className={input} value={resetKey} onChange={(e) => setResetKey(e.target.value)} placeholder="6-32 letters, numbers, - or _" />
          <p className="mt-1 text-xs text-slate-500">The key is securely hashed before storage.</p>
        </div>
      )}

      {method === "question" && [0, 1, 2].map((index) => (
        <div key={index} className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700">Security question {index + 1}</label>
          <select className={input} value={selected[index]} onChange={(e) => setSelected((current) => current.map((value, i) => i === index ? e.target.value : value))}>
            <option value="">Select a question</option>
            {questions.map((question) => <option key={question.id} value={question.id}>{question.question_text}</option>)}
          </select>
          <input type="password" className={input} value={answers[index]} placeholder="Private answer" onChange={(e) => setAnswers((current) => current.map((value, i) => i === index ? e.target.value : value))} />
        </div>
      ))}

      {method === "face" && (
        <div>
          {!faceImage && !showCapture && <button type="button" onClick={() => setShowCapture(true)} className="w-full rounded-xl border-2 border-dashed border-blue-300 py-3 font-medium text-blue-600 hover:bg-blue-50">Open Camera to Enroll Face</button>}
          {showCapture && !faceImage && <FaceCapture isDark={false} onCapture={(image) => { setFaceImage(image); setShowCapture(false) }} onCancel={() => setShowCapture(false)} buttonText="Capture & Use Face" />}
          {faceImage && (
            <div className="flex items-center gap-3 rounded-xl border bg-slate-50 p-3">
              <img src={faceImage} alt="Enrolled face" className="h-20 w-20 rounded-lg object-cover" />
              <div><p className="text-sm font-semibold text-slate-700">Face captured</p><button type="button" onClick={() => { setFaceImage(""); setShowCapture(true) }} className="mt-1 text-xs text-blue-600">Retake photo</button></div>
            </div>
          )}
        </div>
      )}

      {(localError || errorMessage) && <p className="text-sm text-rose-600">{localError || errorMessage}</p>}
      <div className="flex gap-3">
        <button type="button" onClick={onBack} disabled={disabled} className="flex items-center gap-2 rounded-xl border px-4 py-3"><ArrowLeft size={16} />Back</button>
        <button disabled={disabled} className="flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3 font-semibold text-white disabled:opacity-50">{buttonText}</button>
      </div>
    </form>
  )
}
