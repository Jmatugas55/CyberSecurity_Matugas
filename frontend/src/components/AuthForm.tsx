import React, { useMemo, useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import type { Role } from "../types"

export type RegisterBasics = {
  email: string
  password: string
  role: Role
  name: string
  specialization?: string
  contact_number?: string
}

interface Props {
  role: Role
  onRoleChange: (role: Role) => void
  onSubmit: (data: RegisterBasics) => void
  buttonText: string
  disabled?: boolean
  passwordError?: string
  initialEmail?: string
  initialPassword?: string
  enablePasswordGeneration?: boolean
}

export default function AuthForm({
  role,
  onRoleChange,
  onSubmit,
  buttonText,
  passwordError,
  disabled,
  initialEmail = "",
  initialPassword = "",
  enablePasswordGeneration = false,
}: Props) {
  const [name, setName] = useState("")
  const [specialization, setSpecialization] = useState("")
  const [contact, setContact] = useState("")

  const [email, setEmail] = useState(initialEmail)
  const [password, setPassword] = useState(initialPassword)
  const [confirmPassword, setConfirmPassword] = useState(initialPassword)
  const [submitError, setSubmitError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const handlePasswordChange = (value: string) => {
    const enc = new TextEncoder().encode(value)
    if (enc.length > 72) {
      const truncated = new TextDecoder().decode(enc.slice(0, 72))
      setPassword(truncated)
      return
    }
    setPassword(value)
  }

  const validatePwd = (pwd: string) => {
    if (pwd.length < 8) return "Password must be at least 8 characters"
    if (!/[A-Z]/.test(pwd)) return "Must include at least one uppercase letter"
    if (!/[a-z]/.test(pwd)) return "Must include at least one lowercase letter"
    if (!/[0-9]/.test(pwd)) return "Must include at least one number"
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) return "Must include a special character"
    return ""
  }

  const passwordIssue = useMemo(() => {
    if (!password && !confirmPassword) return ""
    const err = validatePwd(password)
    if (err) return err
    if (password !== confirmPassword) return "Passwords do not match"
    return ""
  }, [password, confirmPassword])

  const strengthLabel = useMemo(() => {
    if (!password) return ""
    let score = 0
    if (password.length >= 8) score++
    if (/[A-Z]/.test(password)) score++
    if (/[a-z]/.test(password)) score++
    if (/[0-9]/.test(password)) score++
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++
    if (score <= 2) return "Weak"
    if (score <= 4) return "Medium"
    return "Strong"
  }, [password])

  const strengthBar = useMemo(() => {
    if (strengthLabel === "Strong") return { width: "100%", color: "bg-emerald-500" }
    if (strengthLabel === "Medium") return { width: "66%", color: "bg-amber-400" }
    if (strengthLabel === "Weak") return { width: "33%", color: "bg-rose-500" }
    return { width: "0%", color: "bg-slate-300" }
  }, [strengthLabel])

  const generatePassword = () => {
    const length = 12
    const lower = "abcdefghijklmnopqrstuvwxyz"
    const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    const nums = "0123456789"
    const special = "!@#$%^&*()_+{}[]<>?,."
    const all = lower + upper + nums + special
    let pwd = ""
    pwd += lower[Math.floor(Math.random() * lower.length)]
    pwd += upper[Math.floor(Math.random() * upper.length)]
    pwd += nums[Math.floor(Math.random() * nums.length)]
    pwd += special[Math.floor(Math.random() * special.length)]
    for (let i = pwd.length; i < length; i++) pwd += all[Math.floor(Math.random() * all.length)]
    pwd = pwd.split("").sort(() => 0.5 - Math.random()).join("")
    setPassword(pwd)
    setConfirmPassword(pwd)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return setSubmitError("Full name is required")
    if (role === "doctor" && !specialization.trim())
      return setSubmitError("Specialization is required for doctors")
    if (role === "patient" && !contact.trim())
      return setSubmitError("Contact number is required for patients")

    const err = validatePwd(password)
    if (err) return setSubmitError(err)
    if (password !== confirmPassword) return setSubmitError("Passwords do not match")

    setSubmitError("")
    onSubmit({
      email: email.trim(),
      password,
      role,
      name: name.trim(),
      specialization: role === "doctor" ? specialization.trim() : undefined,
      contact_number: role === "patient" ? contact.trim() : undefined,
    })
  }

  const inputBase =
    "w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 focus:outline-none transition-all duration-200 shadow-inner hover:bg-white"

  const labelBase = "block text-sm font-semibold text-slate-700 mb-1.5"

  return (
    <form onSubmit={handleSubmit} className="space-y-5 w-full">
      <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-slate-100">
        {(["patient", "doctor"] as const).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => onRoleChange(r)}
            className={`py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
              role === r
                ? "bg-white text-blue-700 shadow-md ring-1 ring-blue-100"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {r === "patient" ? "Patient" : "Doctor"}
          </button>
        ))}
      </div>

      <div>
        <label className={labelBase}>Full Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder={role === "doctor" ? "e.g. Dr. Jane Doe" : "e.g. John Smith"}
          className={inputBase}
        />
      </div>

      {role === "doctor" ? (
        <div>
          <label className={labelBase}>Specialization</label>
          <input
            type="text"
            value={specialization}
            onChange={(e) => setSpecialization(e.target.value)}
            placeholder="e.g. Cardiology"
            className={inputBase}
          />
        </div>
      ) : (
        <div>
          <label className={labelBase}>Contact Number</label>
          <input
            type="text"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="e.g. 09171234567"
            className={inputBase}
          />
        </div>
      )}

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
            maxLength={72}
            onChange={(e) => handlePasswordChange(e.target.value)}
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

      <div>
        <label className={labelBase}>Confirm Password</label>
        <div className="relative">
          <input
            type={showConfirm ? "text" : "password"}
            placeholder="Re-enter password"
            value={confirmPassword}
            maxLength={72}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className={`${inputBase} pr-12`}
          />
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-500 hover:text-slate-700"
            aria-label={showConfirm ? "Hide password" : "Show password"}
          >
            {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
         {password && (
          <div className="mt-2">
            <div className="h-1 w-full rounded-full bg-slate-200 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${strengthBar.color}`}
                style={{ width: strengthBar.width }}
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Strength: <span className="font-semibold text-slate-700">{strengthLabel}</span>
            </p>
          </div>
        )}
        {enablePasswordGeneration && (
          <button
            type="button"
            className="text-xs font-medium text-blue-600 hover:text-blue-700 mt-2"
            onClick={generatePassword}
          >
            Generate strong password
          </button>
        )}
        
        {(submitError || passwordIssue || passwordError) && (
          <p className="text-rose-600 text-sm mt-2">
            {submitError || passwordIssue || passwordError}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={!!passwordIssue || !email || !password || !confirmPassword || disabled}
        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-3 rounded-xl font-semibold shadow-lg shadow-blue-200 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
      >
        {buttonText}
      </button>
    </form>
  )
}
