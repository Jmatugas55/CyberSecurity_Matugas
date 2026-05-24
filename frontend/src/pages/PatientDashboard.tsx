import { useEffect, useMemo, useState } from "react"
import { Navigate } from "react-router-dom"
import { FiCalendar, FiUser, FiLock, FiPauseCircle } from "react-icons/fi"
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
} from "../api/api"
import { useTheme } from "../theme"
import { getSession } from "../session"
import type { AppointmentOut, DoctorOut } from "../types"

type Panel = "doctors" | "myAppointments" | "reset"

export default function PatientDashboard() {
  const session = getSession()
  const { isDark } = useTheme()
  const [active, setActive] = useState<Panel>("doctors")
  const [doctors, setDoctors] = useState<DoctorOut[]>([])
  const [appointments, setAppointments] = useState<AppointmentOut[]>([])
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
  const userPassword = useMemo(() => localStorage.getItem("userPassword") || "", [])
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

  useEffect(() => {
    if (active === "doctors") loadDoctors()
    else if (active === "myAppointments") loadAppointments()
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

  const card = isDark
    ? "bg-gray-900 border border-gray-700 text-gray-100"
    : "bg-white border border-gray-200 text-gray-900"
  const subText = isDark ? "text-gray-300" : "text-gray-700"
  const muted = isDark ? "text-gray-400" : "text-gray-500"

  const navItems = [
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
        <ResetPasswordPanel
          currentPassword={userPassword}
          onSavePassword={(np) => {
            localStorage.setItem("userPassword", np)
            setNotif({ open: true, type: "success", msg: "Password updated locally" })
          }}
          isDark={isDark}
        />
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
