import { useEffect, useMemo, useState } from "react"
import { Navigate } from "react-router-dom"
import {
  FiShield,
  FiLock,
  FiPauseCircle,
  FiUsers,
  FiCalendar,
} from "react-icons/fi"
import DashboardShell from "../components/DashboardShell"
import LoginAttempts from "../components/LoginAttempts"
import ResetPasswordPanel from "../components/ResetPasswordPanel"
import ChangeEmail from "../components/ChangeEmail"
import NotificationsDrawer from "../components/NotificationsDrawer"
import Notification from "../components/Modal"
import {
  listAppointments,
  listPatients,
  updateAppointment,
  listNotifications,
} from "../api/api"
import { useTheme } from "../theme"
import { getSession } from "../session"
import type { AppointmentOut, PatientOut } from "../types"

type Panel = "appointments" | "patients" | "attempts" | "reset"

export default function DoctorDashboard() {
  const session = getSession()
  const { isDark } = useTheme()
  const [active, setActive] = useState<Panel>("appointments")
  const [appointments, setAppointments] = useState<AppointmentOut[]>([])
  const [patients, setPatients] = useState<PatientOut[]>([])
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [loading, setLoading] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [unread, setUnread] = useState(0)
  const [changeEmailOpen, setChangeEmailOpen] = useState(false)
  const [notif, setNotif] = useState({ open: false, type: "success" as "success" | "error", msg: "" })

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

  const loadAppointments = async () => {
    setLoading(true)
    try {
      const data = await listAppointments("doctor", userEmail, statusFilter)
      setAppointments(data)
    } finally {
      setLoading(false)
    }
  }

  const loadPatients = async () => {
    setLoading(true)
    try {
      const data = await listPatients()
      setPatients(data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (active === "appointments") loadAppointments()
    else if (active === "patients") loadPatients()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, statusFilter])

  if (!session || session.role !== "doctor") return <Navigate to="/" replace />

  const handleStatus = async (id: number, status: "accepted" | "rejected" | "completed") => {
    try {
      await updateAppointment(id, { status })
      setNotif({ open: true, type: "success", msg: `Appointment ${status}` })
      loadAppointments()
    } catch (err) {
      const e = err as { response?: { data?: { detail?: string } } }
      setNotif({ open: true, type: "error", msg: e.response?.data?.detail || "Failed to update" })
    }
  }

  const handleSaveDiagnosis = async (id: number, diagnosis: string) => {
    try {
      await updateAppointment(id, { diagnosis })
      setNotif({ open: true, type: "success", msg: "Diagnosis saved" })
      loadAppointments()
    } catch (err) {
      const e = err as { response?: { data?: { detail?: string } } }
      setNotif({ open: true, type: "error", msg: e.response?.data?.detail || "Failed to save" })
    }
  }

  const card = isDark
    ? "bg-gray-900 border border-gray-700 text-gray-100"
    : "bg-white border border-gray-200 text-gray-900"

  const subText = isDark ? "text-gray-300" : "text-gray-700"
  const muted = isDark ? "text-gray-400" : "text-gray-500"

  const navItems = [
    { key: "appointments", label: "Appointments", icon: <FiCalendar /> },
    { key: "patients", label: "Patients", icon: <FiUsers /> },
    { key: "attempts", label: "Login Attempts", icon: <FiShield /> },
    { key: "reset", label: "Reset Password", icon: <FiLock /> },
  ]

  return (
    <DashboardShell
      title={`Dr. ${session.profile?.name || ""}`.trim() || "Doctor Dashboard"}
      subtitle={session.profile?.specialization ? `${session.profile.specialization} • Doctor` : "Doctor"}
      navItems={navItems}
      active={active}
      onSelect={(k) => {
        if (k === "changeEmail") setChangeEmailOpen(true)
        else setActive(k as Panel)
      }}
      userInitial={userInitial}
      userLabel={session.profile?.name || userEmail}
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

      {active === "appointments" && (
        <div className={`rounded-2xl p-6 ${card}`}>
          <div className="flex flex-wrap justify-between items-center mb-4 gap-3">
            <h2 className="text-2xl font-bold">Appointments</h2>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`text-sm rounded-lg px-3 py-2 border ${isDark ? "bg-gray-800 border-gray-700 text-gray-100" : "bg-white border-gray-300 text-gray-800"}`}
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {loading && <p className={muted}>Loading...</p>}
          {!loading && appointments.length === 0 && <p className={muted}>No appointments.</p>}

          <div className="space-y-3">
            {appointments.map((a) => (
              <div key={a.id} className={`p-4 rounded-xl border ${isDark ? "bg-gray-800 border-gray-700" : "bg-gray-50 border-gray-200"}`}>
                <div className="flex flex-wrap justify-between gap-3">
                  <div>
                    <p className="font-semibold">{a.patient_name}</p>
                    <p className={`text-sm ${muted}`}>Contact: {a.patient_contact}</p>
                    <p className={`text-sm ${subText}`}>
                      {a.appointment_date} at {a.appointment_time}
                    </p>
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
                <DiagnosisEditor
                  initial={a.diagnosis || ""}
                  onSave={(d) => handleSaveDiagnosis(a.id, d)}
                  isDark={isDark}
                />
                <div className="flex flex-wrap gap-2 mt-3">
                  {a.status === "pending" && (
                    <>
                      <button
                        onClick={() => handleStatus(a.id, "accepted")}
                        className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-700"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleStatus(a.id, "rejected")}
                        className="bg-red-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-700"
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {a.status === "accepted" && (
                    <button
                      onClick={() => handleStatus(a.id, "completed")}
                      className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-700"
                    >
                      Mark Completed
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {active === "patients" && (
        <div className={`rounded-2xl p-6 ${card}`}>
          <h2 className="text-2xl font-bold mb-4">Registered Patients</h2>
          {loading && <p className={muted}>Loading...</p>}
          {!loading && patients.length === 0 && <p className={muted}>No patients yet.</p>}
          <div className="overflow-hidden rounded-xl border border-gray-300/30">
            <table className="w-full text-left">
              <thead className={isDark ? "bg-gray-800 text-gray-300 text-sm" : "bg-gray-100 text-gray-800 text-sm"}>
                <tr>
                  <th className="px-4 py-3">Patient ID</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Email</th>
                </tr>
              </thead>
              <tbody className={isDark ? "divide-y divide-gray-700" : "divide-y divide-gray-200"}>
                {patients.map((p) => (
                  <tr key={p.id} className={isDark ? "hover:bg-gray-800" : "hover:bg-gray-50"}>
                    <td className="px-4 py-3">{p.id}</td>
                    <td className="px-4 py-3 font-medium">{p.name}</td>
                    <td className="px-4 py-3">{p.contact_number}</td>
                    <td className="px-4 py-3">{p.email}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {active === "attempts" && <LoginAttempts isDark={isDark} />}

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

function DiagnosisEditor({
  initial,
  onSave,
  isDark,
}: {
  initial: string
  onSave: (text: string) => void
  isDark: boolean
}) {
  const [value, setValue] = useState(initial)
  const [editing, setEditing] = useState(false)

  if (!editing) {
    return (
      <div className="mt-2">
        <p className={`text-sm font-medium ${isDark ? "text-gray-200" : "text-gray-800"}`}>
          Diagnosis: <span className={isDark ? "text-gray-300" : "text-gray-600"}>{initial || "—"}</span>
        </p>
        <button onClick={() => setEditing(true)} className="text-xs text-blue-500 hover:underline mt-1">
          {initial ? "Edit" : "Add diagnosis"}
        </button>
      </div>
    )
  }

  return (
    <div className="mt-2">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={2}
        className={`w-full rounded-lg p-2 text-sm ${
          isDark ? "bg-gray-900 border border-gray-600 text-gray-100" : "bg-white border border-gray-300 text-gray-900"
        }`}
      />
      <div className="flex gap-2 mt-1">
        <button
          onClick={() => {
            onSave(value)
            setEditing(false)
          }}
          className="bg-blue-600 text-white text-xs px-2 py-1 rounded hover:bg-blue-700"
        >
          Save
        </button>
        <button
          onClick={() => {
            setValue(initial)
            setEditing(false)
          }}
          className="text-xs text-gray-500 hover:underline"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
