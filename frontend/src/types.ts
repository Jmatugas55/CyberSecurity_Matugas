export interface RegisterData {
  email: string
  password: string
  reset_method: "key" | "question"
  reset_key?: string
  security_question?: string
  security_answer?: string
}
export interface LoginAttempt {
  id: number
  email: string
  ip_address: string
  success: boolean
  attempt_time: string // or Date if parsed
}

export interface LoginSummary {
  email: string
  success: number
  failed: number
}
export interface LoginData {
  email: string
  password: string
}

export interface ForgotPasswordData {
  email: string
  reset_method: "key" | "question"
  reset_key?: string
  security_answer?: string
}

export interface ResetPasswordData {
  email: string
  token: string
  password: string
}

export interface BlockedUser {
  id: number
  email: string
  blocked_until: string
}

export type AttemptFilter = "all" | "failed" | "success" | "blocked"