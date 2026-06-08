import { useEffect, useState } from "react"
import { Navigate } from "react-router-dom"
import { FiCalendar, FiClipboard, FiUser, FiLock, FiPauseCircle } from "react-icons/fi"
import DashboardShell from "../components/DashboardShell"
import ResetPasswordPanel from "../components/ResetPasswordPanel"
import ChangeEmail from "../components/ChangeEmail"
import NotificationsDrawer from "../components/NotificationsDrawer"
import Notification from "../components/Modal"
import {
  listDoctors,
  listAppointments,
  createAppointment,
  listNotifications,
  createCareRequest,
  listCareRequests,
} from "../api/api"
import { useTheme } from "../theme"
import { getSession } from "../session"
import type { AppointmentOut, CareRequestInput, CareRequestOut, DoctorOut } from "../types"

type Panel = "requestCare" | "myRequests" | "doctors" | "myAppointments" | "reset"

const emptyCareRequest: CareRequestInput = {
  chief_complaint: "",
  symptoms: "",
  symptom_duration: "",
  severity: "moderate",
  urgency: "routine",
  preferred_date: "",
  preferred_time: "",
  visit_type: "in_person",
  known_conditions: "",
  current_medications: "",
  allergies: "",
  additional_notes: "",
}

export default function PatientDashboard() {
  const session = getSession()
  const { isDark } = useTheme()
  const [active, setActive] = useState<Panel>("requestCare")
  const [doctors, setDoctors] = useState<DoctorOut[]>([])
  const [appointments, setAppointments] = useState<AppointmentOut[]>([])
  const [careRequests, setCareRequests] = useState<CareRequestOut[]>([])
  const [careForm, setCareForm] = useState<CareRequestInput>(emptyCareRequest)
  const [careBusy, setCareBusy] = useState(false)
  const [loading, setLoading] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [unread, setUnread] = useState(0)
  const [changeEmailOpen, setChangeEmailOpen] = useState(false)
  const [notif, setNotif] = useState({ open: false, type: "success" as "success" | "error", msg: "" })

  const [bookingDoctor, setBookingDoctor] = useState<DoctorOut | null>(null)
  const [bookingDate, setBookingDate] = useState("")
  const [bookingTime, setBookingTime] = useState("")
  const [bookingDiagnosis, setBookingDiagnosis] = useState("")
  const [bookingBusy, setBookingBusy] = useState(false)

  const userEmail = session?.email || ""
  const userInitial = (session?.profile?.name || userEmail).charAt(0).toUpperCase()

  useEffect(() => {
    refreshUnread()
    const t = setInterval(refreshUnread, 15000)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const refreshUnread = async () => {
    try {
      const data = await listNotifications(userEmail)
      setUnread(data.filter((n) => !n.is_read).length)
    } catch {
      /* ignore */
    }
  }

  const loadDoctors = async () => {
    setLoading(true)
    try {
      const data = await listDoctors()
      setDoctors(data)
    } finally {
      setLoading(false)
    }
  }

  const loadAppointments = async () => {
    setLoading(true)
    try {
      const data = await listAppointments("patient", userEmail)
      setAppointments(data)
    } finally {
      setLoading(false)
    }
  }

  const loadCareRequests = async () => {
    setLoading(true)
    try {
      setCareRequests(await listCareRequests())
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (active === "doctors") loadDoctors()
    else if (active === "myAppointments") loadAppointments()
    else if (active === "myRequests") loadCareRequests()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])

  if (!session || session.role !== "patient") return <Navigate to="/" replace />

  const submitBooking = async () => {
    if (!bookingDoctor) return
    if (!bookingDate || !bookingTime) {
      setNotif({ open: true, type: "error", msg: "Pick a date and time" })
      return
    }
    setBookingBusy(true)
    try {
      await createAppointment(userEmail, {
        doctor_id: bookingDoctor.id,
        appointment_date: bookingDate,
        appointment_time: bookingTime,
        diagnosis: bookingDiagnosis || undefined,
      })
      setNotif({ open: true, type: "success", msg: "Appointment requested." })
      setBookingDoctor(null)
      setBookingDate("")
      setBookingTime("")
      setBookingDiagnosis("")
    } catch (err) {
      const e = err as { response?: { data?: { detail?: string } } }
      setNotif({ open: true, type: "error", msg: e.response?.data?.detail || "Could not book" })
    } finally {
      setBookingBusy(false)
    }
  }

  const submitCareRequest = async (event: React.FormEvent) => {
    event.preventDefault()
    setCareBusy(true)
    try {
      await createCareRequest(careForm)
      setCareForm(emptyCareRequest)
      setNotif({ open: true, type: "success", msg: "Care request submitted for admin review." })
      setActive("myRequests")
    } catch (err) {
      const detail = (err as { response?: { data?: { detail?: string | { msg?: string }[] } } }).response?.data?.detail
      const message = Array.isArray(detail) ? detail.map((item) => item.msg).join(" ") : detail
      setNotif({ open: true, type: "error", msg: message || "Could not submit care request" })
    } finally {
      setCareBusy(false)
    }
  }

  const card = isDark
    ? "bg-gray-900 border border-gray-700 text-gray-100"
    : "bg-white border border-gray-200 text-gray-900"
  const subText = isDark ? "text-gray-300" : "text-gray-700"
  const muted = isDark ? "text-gray-400" : "text-gray-500"

  const navItems = [
    { key: "requestCare", label: "Request Care", icon: <FiClipboard /> },
    { key: "myRequests", label: "My Requests", icon: <FiClipboard /> },
    { key: "doctors", label: "Find a Doctor", icon: <FiUser /> },
    { key: "myAppointments", label: "My Appointments", icon: <FiCalendar /> },
    { key: "reset", label: "Reset Password", icon: <FiLock /> },
  ]

  return (
    <DashboardShell
      title={`Hello, ${session?.profile?.name || ""}`.trim() || "Patient Dashboard"}
      subtitle="Book an appointment and stay updated"
      navItems={navItems}
      active={active}
      onSelect={(k) => setActive(k as Panel)}
      userInitial={userInitial}
      userLabel={session?.profile?.name || userEmail}
      userSub={userEmail}
      unreadCount={unread}
      onClickBell={() => setDrawerOpen(true)}
    >
      <div className="flex justify-end mb-3">
        <button
          onClick={() => setChangeEmailOpen(true)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition ${
            isDark ? "text-gray-200 hover:bg-gray-800 border border-gray-700" : "text-gray-700 hover:bg-gray-100 border border-gray-200"
          }`}
        >
          <FiPauseCircle /> Change Email
        </button>
      </div>

      {active === "requestCare" && (
        <form onSubmit={submitCareRequest} className={`rounded-2xl p-6 ${card}`}>
          <div className="mb-5">
            <h2 className="text-2xl font-bold">Patient Care Request</h2>
            <p className={`mt-1 text-sm ${muted}`}>Provide accurate information for administrative triage. For emergencies, contact emergency services immediately.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <CareField label="Main concern or suspected illness" required>
              <input value={careForm.chief_complaint} onChange={(e) => setCareForm({ ...careForm, chief_complaint: e.target.value })} className={formInput(isDark)} placeholder="Example: recurring chest pain" required />
            </CareField>
            <CareField label="How long have symptoms been present?">
              <input value={careForm.symptom_duration} onChange={(e) => setCareForm({ ...careForm, symptom_duration: e.target.value })} className={formInput(isDark)} placeholder="Example: 3 days" />
            </CareField>
            <CareField label="Severity" required>
              <select value={careForm.severity} onChange={(e) => setCareForm({ ...careForm, severity: e.target.value as CareRequestInput["severity"] })} className={formInput(isDark)}>
                <option value="mild">Mild</option><option value="moderate">Moderate</option><option value="severe">Severe</option>
              </select>
            </CareField>
            <CareField label="How soon is care needed?" required>
              <select value={careForm.urgency} onChange={(e) => setCareForm({ ...careForm, urgency: e.target.value as CareRequestInput["urgency"] })} className={formInput(isDark)}>
                <option value="routine">Routine</option><option value="soon">Soon</option><option value="urgent">Urgent</option>
              </select>
            </CareField>
            <CareField label="Preferred date">
              <input type="date" value={careForm.preferred_date} onChange={(e) => setCareForm({ ...careForm, preferred_date: e.target.value })} className={formInput(isDark)} />
            </CareField>
            <CareField label="Preferred time">
              <input type="time" value={careForm.preferred_time} onChange={(e) => setCareForm({ ...careForm, preferred_time: e.target.value })} className={formInput(isDark)} />
            </CareField>
            <CareField label="Visit type">
              <select value={careForm.visit_type} onChange={(e) => setCareForm({ ...careForm, visit_type: e.target.value as CareRequestInput["visit_type"] })} className={formInput(isDark)}>
                <option value="in_person">In-person consultation</option><option value="teleconsultation">Teleconsultation</option>
              </select>
            </CareField>
            <CareField label="Known allergies">
              <input value={careForm.allergies} onChange={(e) => setCareForm({ ...careForm, allergies: e.target.value })} className={formInput(isDark)} placeholder="Medication, food, or environmental allergies" />
            </CareField>
          </div>
          <CareField label="Describe all symptoms" required>
            <textarea value={careForm.symptoms} onChange={(e) => setCareForm({ ...careForm, symptoms: e.target.value })} rows={4} className={formInput(isDark)} placeholder="Include location, frequency, triggers, fever, pain level, and relevant details" required />
          </CareField>
          <div className="grid gap-4 md:grid-cols-2">
            <CareField label="Known medical conditions">
              <textarea value={careForm.known_conditions} onChange={(e) => setCareForm({ ...careForm, known_conditions: e.target.value })} rows={3} className={formInput(isDark)} />
            </CareField>
            <CareField label="Current medications">
              <textarea value={careForm.current_medications} onChange={(e) => setCareForm({ ...careForm, current_medications: e.target.value })} rows={3} className={formInput(isDark)} />
            </CareField>
          </div>
          <CareField label="Additional notes">
            <textarea value={careForm.additional_notes} onChange={(e) => setCareForm({ ...careForm, additional_notes: e.target.value })} rows={3} className={formInput(isDark)} />
          </CareField>
          <button disabled={careBusy} className="mt-4 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white disabled:opacity-60">{careBusy ? "Submitting..." : "Submit for Admin Review"}</button>
        </form>
      )}

      {active === "myRequests" && (
        <div className={`rounded-2xl p-6 ${card}`}>
          <h2 className="text-2xl font-bold mb-4">My Care Requests</h2>
          {loading && <p className={muted}>Loading...</p>}
          {!loading && careRequests.length === 0 && <p className={muted}>No care requests submitted.</p>}
          <div className="space-y-3">
            {careRequests.map((request) => (
              <div key={request.id} className={`rounded-xl border p-4 ${isDark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-gray-50"}`}>
                <div className="flex flex-wrap justify-between gap-3">
                  <div>
                    <p className="font-semibold">{request.chief_complaint}</p>
                    <p className={`text-sm ${muted}`}>Suggested service: {request.suggested_specialization}</p>
                    <p className={`mt-1 text-sm ${subText}`}>{request.symptoms}</p>
                    {request.doctor_name && <p className="mt-2 text-sm font-medium text-blue-500">Assigned to Dr. {request.doctor_name}</p>}
                    {request.admin_notes && <p className={`mt-1 text-sm ${muted}`}>Admin note: {request.admin_notes}</p>}
                  </div>
                  <span className="h-fit rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">{request.status.replace("_", " ")}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {active === "doctors" && (
        <div className={`rounded-2xl p-6 ${card}`}>
          <h2 className="text-2xl font-bold mb-4">Available Doctors</h2>
          {loading && <p className={muted}>Loading...</p>}
          {!loading && doctors.length === 0 && <p className={muted}>No doctors registered yet.</p>}
          <div className="grid sm:grid-cols-2 gap-3">
            {doctors.map((d) => (
              <div key={d.id} className={`p-4 rounded-xl border ${isDark ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
                <p className="font-semibold">Dr. {d.name}</p>
                <p className={`text-sm ${subText}`}>{d.specialization}</p>
                <p className={`text-xs ${muted}`}>{d.email}</p>
                <button
                  onClick={() => setBookingDoctor(d)}
                  className="mt-3 bg-blue-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-700"
                >
                  Book Appointment
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {active === "myAppointments" && (
        <div className={`rounded-2xl p-6 ${card}`}>
          <h2 className="text-2xl font-bold mb-4">My Appointments</h2>
          {loading && <p className={muted}>Loading...</p>}
          {!loading && appointments.length === 0 && <p className={muted}>No appointments yet.</p>}
          <div className="space-y-3">
            {appointments.map((a) => (
              <div key={a.id} className={`p-4 rounded-xl border ${isDark ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
                <div className="flex flex-wrap justify-between gap-3">
                  <div>
                    <p className="font-semibold">Dr. {a.doctor_name}</p>
                    <p className={`text-sm ${muted}`}>{a.specialization}</p>
                    <p className={`text-sm ${subText}`}>
                      {a.appointment_date} at {a.appointment_time}
                    </p>
                    {a.diagnosis && (
                      <p className={`text-sm mt-1 ${subText}`}>
                        <span className="font-medium">Diagnosis:</span> {a.diagnosis}
                      </p>
                    )}
                  </div>
                  <span
                    className={`text-xs h-6 px-2 rounded-full font-medium self-start ${
                      a.status === "pending"
                        ? "bg-yellow-200 text-yellow-900"
                        : a.status === "accepted"
                        ? "bg-green-200 text-green-900"
                        : a.status === "rejected"
                        ? "bg-red-200 text-red-900"
                        : "bg-blue-200 text-blue-900"
                    }`}
                  >
                    {a.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {active === "reset" && (
        <ResetPasswordPanel isDark={isDark} />
      )}

      {/* booking modal */}
      {bookingDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div className={`w-full max-w-md rounded-xl shadow-xl p-6 ${card}`}>
            <h3 className="text-lg font-semibold mb-2">Book Dr. {bookingDoctor.name}</h3>
            <p className={`text-sm mb-3 ${muted}`}>{bookingDoctor.specialization}</p>
            <div className="space-y-2">
              <input
                type="date"
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border ${isDark ? "bg-gray-800 border-gray-600 text-gray-100" : "bg-white border-gray-300 text-gray-900"}`}
              />
              <input
                type="time"
                value={bookingTime}
                onChange={(e) => setBookingTime(e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border ${isDark ? "bg-gray-800 border-gray-600 text-gray-100" : "bg-white border-gray-300 text-gray-900"}`}
              />
              <textarea
                placeholder="Reason / symptoms (optional)"
                value={bookingDiagnosis}
                onChange={(e) => setBookingDiagnosis(e.target.value)}
                rows={3}
                className={`w-full px-3 py-2 rounded-lg border ${isDark ? "bg-gray-800 border-gray-600 text-gray-100" : "bg-white border-gray-300 text-gray-900"}`}
              />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setBookingDoctor(null)}
                className={`px-3 py-1 rounded-lg text-sm border ${isDark ? "border-gray-600 text-gray-200 hover:bg-gray-800" : "border-gray-300 text-gray-800 hover:bg-gray-100"}`}
              >
                Cancel
              </button>
              <button
                onClick={submitBooking}
                disabled={bookingBusy}
                className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-60"
              >
                {bookingBusy ? "Booking..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ChangeEmail
        open={changeEmailOpen}
        onClose={() => setChangeEmailOpen(false)}
        currentEmail={userEmail}
        isDark={isDark}
      />

      <NotificationsDrawer
        open={drawerOpen}
        email={userEmail}
        onClose={() => setDrawerOpen(false)}
        onCountChange={setUnread}
      />

      <Notification
        open={notif.open}
        type={notif.type}
        message={notif.msg}
        onClose={() => setNotif((n) => ({ ...n, open: false }))}
        duration={1800}
      />
    </DashboardShell>
  )
}

function CareField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return <label className="mb-4 block"><span className="mb-1.5 block text-sm font-semibold">{label}{required ? " *" : ""}</span>{children}</label>
}

function formInput(isDark: boolean) {
  return `w-full rounded-lg border px-3 py-2 ${isDark ? "border-gray-600 bg-gray-900 text-gray-100" : "border-gray-300 bg-white text-gray-900"}`
}
