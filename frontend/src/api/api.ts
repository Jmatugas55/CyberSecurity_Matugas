import axios from "axios"
import type {
  RegisterData,
  LoginData,
  ForgotPasswordData,
  DoctorOut,
  PatientOut,
  AppointmentOut,
  NotificationOut,
  CareRequestInput,
  CareRequestOut,
} from "../types"
import { clearSession, getToken } from "../session"

const API = axios.create({
  baseURL: "http://127.0.0.1:8000",
})

API.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && getToken()) clearSession()
    return Promise.reject(error)
  },
)

export const registerUser = async (data: RegisterData) => {
  const response = await API.post("/register", data)
  return response.data
}

export const loginUser = async (data: LoginData) => {
  const response = await API.post("/login", {
    email: data.email.trim().toLowerCase(),
    password: data.password,
  })
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

export const checkEmailAvailability = (email: string) =>
  API.get("/email-availability", { params: { email: email.trim().toLowerCase() } })

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

export const getMe = async () => (await API.get("/me")).data

export const listSpecializations = async (): Promise<{ id: number; name: string }[]> =>
  (await API.get("/specializations")).data

export const listSecurityQuestions = async (): Promise<{ id: number; question_text: string }[]> =>
  (await API.get("/security-questions")).data

export const changePassword = (data: { current_password: string; new_password: string }) =>
  API.post("/change-password", data)

export const createAppointment = (
  emailOrBody: string | { doctor_id: number; appointment_date: string; appointment_time: string; diagnosis?: string },
  maybeBody?: { doctor_id: number; appointment_date: string; appointment_time: string; diagnosis?: string },
) => API.post("/appointments", typeof emailOrBody === "string" ? maybeBody : emailOrBody)

export const listAppointments = async (
  roleOrStatus?: "doctor" | "patient" | string,
  _email?: string,
  legacyStatus?: string,
): Promise<AppointmentOut[]> => {
  const params: Record<string, string> = {}
  const status = legacyStatus ?? (roleOrStatus && !["doctor", "patient"].includes(roleOrStatus) ? roleOrStatus : undefined)
  if (status) params.status = status
  return (await API.get("/appointments", { params })).data
}

export const listDoctorAppointmentsForAdmin = async (
  doctorId: number,
  status?: string,
): Promise<AppointmentOut[]> => {
  const params: Record<string, string | number> = { doctor_id: doctorId }
  if (status && status !== "all") params.status = status
  return (await API.get("/appointments", { params })).data
}

export const updateAppointment = (id: number, body: { status?: string; diagnosis?: string }) =>
  API.patch(`/appointments/${id}`, body)

export const deleteAppointment = (id: number) => API.delete(`/appointments/${id}`)

export const listNotifications = async (_email?: string): Promise<NotificationOut[]> => {
  void _email
  return (await API.get("/notifications")).data
}

export const markNotificationRead = (id: number) => API.post(`/notifications/${id}/read`)

export const markAllNotificationsRead = (_email?: string) => {
  void _email
  return API.post("/notifications/read-all")
}

export const getAdminSummary = async () => (await API.get("/admin/summary")).data
export const getAdminUsers = async (role: "doctor" | "patient", search = "") =>
  (await API.get(`/admin/users/${role}`, { params: { search } })).data
export const archiveAdminUser = (userId: number) => API.delete(`/admin/users/${userId}`)
export const updateAdminUser = (userId: number, data: Record<string, unknown>) =>
  API.patch(`/admin/users/${userId}`, data)
export const listAssignments = async () => (await API.get("/admin/assignments")).data
export const assignPatient = (doctor_email: string, patient_email: string, notes = "") =>
  API.post("/admin/assignments", {
    doctor_email: doctor_email.trim().toLowerCase(),
    patient_email: patient_email.trim().toLowerCase(),
    notes,
  })
export const getAuditLogs = async (search = "") =>
  (await API.get("/admin/audit-logs", { params: { search } })).data

export const createCareRequest = (data: CareRequestInput) =>
  API.post("/care-requests", data)

export const listCareRequests = async (): Promise<CareRequestOut[]> =>
  (await API.get("/care-requests")).data

export const listAdminCareRequests = async (status = "all"): Promise<CareRequestOut[]> =>
  (await API.get("/admin/care-requests", { params: { status } })).data

export const assignCareRequest = (
  requestId: number,
  data: { doctor_id: number; appointment_date: string; appointment_time: string; admin_notes?: string },
) => API.post(`/admin/care-requests/${requestId}/assign`, data)

export const updateCareRequestStatus = (
  requestId: number,
  status: "under_review" | "rejected" | "cancelled",
  admin_notes?: string,
) => API.patch(`/admin/care-requests/${requestId}`, { status, admin_notes })
