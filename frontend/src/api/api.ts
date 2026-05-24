import axios from "axios"
import type {
  RegisterData,
  LoginData,
  ForgotPasswordData,
  DoctorOut,
  PatientOut,
  AppointmentOut,
  NotificationOut,
} from "../types"

const API = axios.create({
  baseURL: "http://127.0.0.1:8000",
})

export const registerUser = async (data: RegisterData) => {
  const response = await API.post("/register", data)
  return response.data
}

export const loginUser = async (data: LoginData) => {
  const response = await API.post("/login", data)
  return response
}

export const getLoginAttempts = async (filter?: string) => {
  let url = "/login-attempts"
  if (filter && filter !== "all") {
    url += `?filter=${filter}`
  }
  const response = await API.get(url)
  return response.data
}

export const deleteLoginAttempt = (id: number) =>
  API.delete(`/login-attempts/${id}`)

export const resetFailedAttempts = (email: string) =>
  API.post(`/login-attempts/reset-failed/${encodeURIComponent(email)}`)

export const resetSuccessAttempts = (email: string) =>
  API.post(`/login-attempts/reset-success/${encodeURIComponent(email)}`)

export const resetAllAttempts = (email: string) =>
  API.post(`/login-attempts/reset-all/${encodeURIComponent(email)}`)

export const getBlockedUsers = async () => {
  const resp = await API.get("/blocked-users")
  return resp.data
}

export const unblockUser = (id: number) =>
  API.post(`/unblock-user/${id}`)

export const requestPasswordReset = (data: ForgotPasswordData) =>
  API.post(`/forgot-password`, data)

export const getSecurityQuestion = (email: string) =>
  API.get(`/security-question`, { params: { email } })

export const getResetMethod = (email: string) =>
  API.get(`/reset-method`, { params: { email } })

export const resetPassword = (data: { email: string; token: string; new_password: string }) =>
  API.post(`/reset-password`, data)

export const verifyPasswordForChangeEmail = (data: { email: string; password: string }) =>
  API.post(`/change-email/verify`, data)

export const changeEmail = (data: { current_email: string; password: string; new_email: string }) =>
  API.post(`/change-email`, data)

export const enrollFace = (data: { email: string; face_image: string }) =>
  API.post(`/face/enroll`, data)

export const verifyFace = (data: { email: string; face_image: string }) =>
  API.post(`/face/verify`, data)

export const listDoctors = async (): Promise<DoctorOut[]> => (await API.get("/doctors")).data
export const listPatients = async (): Promise<PatientOut[]> => (await API.get("/patients")).data

export const getMe = async (email: string) =>
  (await API.get("/me", { params: { email } })).data

export const createAppointment = (
  patientEmail: string,
  body: { doctor_id: number; appointment_date: string; appointment_time: string; diagnosis?: string },
) => API.post(`/appointments?patient_email=${encodeURIComponent(patientEmail)}`, body)

export const listAppointments = async (
  role: "doctor" | "patient",
  email: string,
  status?: string,
): Promise<AppointmentOut[]> => {
  const params: Record<string, string> = { role, email }
  if (status) params.status = status
  return (await API.get("/appointments", { params })).data
}

export const updateAppointment = (id: number, body: { status?: string; diagnosis?: string }) =>
  API.patch(`/appointments/${id}`, body)

export const deleteAppointment = (id: number) => API.delete(`/appointments/${id}`)

export const listNotifications = async (email: string): Promise<NotificationOut[]> =>
  (await API.get("/notifications", { params: { email } })).data

export const markNotificationRead = (id: number) => API.post(`/notifications/${id}/read`)

export const markAllNotificationsRead = (email: string) =>
  API.post(`/notifications/read-all?email=${encodeURIComponent(email)}`)
