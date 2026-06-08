export type Role = "admin" | "doctor" | "patient"

export interface SecurityAnswerInput {
  question_id: number
  answer: string
}

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
  security_answers?: SecurityAnswerInput[]
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
  security_answers?: SecurityAnswerInput[]
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
  status: "pending" | "accepted" | "rejected" | "completed" | "cancelled"
  created_at: string | null
}

export interface CareRequestInput {
  chief_complaint: string
  symptoms: string
  symptom_duration?: string
  severity: "mild" | "moderate" | "severe"
  urgency: "routine" | "soon" | "urgent"
  preferred_date?: string
  preferred_time?: string
  visit_type: "in_person" | "teleconsultation"
  known_conditions?: string
  current_medications?: string
  allergies?: string
  additional_notes?: string
}

export interface CareRequestOut extends CareRequestInput {
  id: number
  patient_id: number
  patient_name: string
  patient_contact: string
  doctor_id: number | null
  doctor_name: string | null
  appointment_id: number | null
  suggested_specialization: string
  admin_notes: string | null
  status: "submitted" | "under_review" | "assigned" | "rejected" | "cancelled" | "completed"
  created_at: string
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
  access_token: string
}
