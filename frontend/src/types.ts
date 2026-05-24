export type Role = "doctor" | "patient"

export interface RegisterData {
  email: string
  password: string
  role: Role
  name: string
  specialization?: string
  contact_number?: string
  reset_method: "key" | "question" | "face"
  reset_key?: string
  security_question?: string
  security_answer?: string
}

export interface LoginAttempt {
  id: number
  email: string
  ip_address: string
  success: boolean
  attempt_time: string
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
  reset_method: "key" | "question" | "face"
  reset_key?: string
  security_question?: string
  security_answer?: string
  face_image?: string
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

export interface DoctorOut {
  id: number
  name: string
  specialization: string
  email?: string
}

export interface PatientOut {
  id: number
  name: string
  contact_number: string
  email?: string
  user_id?: number
}

export interface AppointmentOut {
  id: number
  doctor_id: number
  doctor_name: string
  specialization: string
  patient_id: number
  patient_name: string
  patient_contact: string
  appointment_date: string
  appointment_time: string
  diagnosis: string | null
  status: "pending" | "accepted" | "rejected" | "completed"
  created_at: string | null
}

export interface NotificationOut {
  id: number
  title: string
  message: string
  is_read: boolean
  created_at: string | null
}

export interface SessionUser {
  user_id: number
  email: string
  role: Role
  profile: { id: number; name: string; specialization?: string; contact_number?: string } | null
}
