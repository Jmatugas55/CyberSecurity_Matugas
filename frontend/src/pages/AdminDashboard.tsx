import { useEffect, useMemo, useState } from "react"
import { Navigate } from "react-router-dom"
import {
  FiActivity,
  FiCalendar,
  FiCheckCircle,
  FiClipboard,
  FiDatabase,
  FiEdit3,
  FiEye,
  FiPrinter,
  FiSearch,
  FiTrash2,
  FiUsers,
  FiX,
} from "react-icons/fi"
import DashboardShell from "../components/DashboardShell"
import NotificationsDrawer from "../components/NotificationsDrawer"
import {
  archiveAdminUser,
  assignCareRequest,
  assignPatient,
  getAdminSummary,
  getAdminUsers,
  getAuditLogs,
  listNotifications,
  listDoctorAppointmentsForAdmin,
  listAdminCareRequests,
  listAssignments,
  listSpecializations,
  updateAdminUser,
  updateCareRequestStatus,
} from "../api/api"
import { getSession } from "../session"
import { useTheme } from "../theme"
import type { AppointmentOut, CareRequestOut } from "../types"

type Panel = "overview" | "requests" | "doctors" | "patients" | "assignments" | "audit"
type UserRole = "doctor" | "patient"
type UserRow = {
  id: number
  user_id: number
  name: string
  email: string
  specialization?: string
  contact_number?: string
  status: string
}
type AuditLog = {
  id: number
  created_at: string
  email?: string | null
  username?: string | null
  role?: string | null
  action_type: string
  action_description?: string | null
  description?: string | null
  module?: string | null
  status: string
}

const statusTone: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  inactive: "bg-slate-100 text-slate-600 ring-slate-200",
  success: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  failed: "bg-rose-100 text-rose-700 ring-rose-200",
  pending: "bg-amber-100 text-amber-700 ring-amber-200",
  accepted: "bg-blue-100 text-blue-700 ring-blue-200",
  submitted: "bg-blue-100 text-blue-700 ring-blue-200",
  under_review: "bg-amber-100 text-amber-700 ring-amber-200",
  assigned: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  rejected: "bg-rose-100 text-rose-700 ring-rose-200",
  completed: "bg-indigo-100 text-indigo-700 ring-indigo-200",
  cancelled: "bg-slate-100 text-slate-600 ring-slate-200",
}

export default function AdminDashboard() {
  const session = getSession()
  const { isDark } = useTheme()
  const [active, setActive] = useState<Panel>("overview")
  const [summary, setSummary] = useState<Record<string, number>>({})
  const [rows, setRows] = useState<UserRow[]>([])
  const [assignments, setAssignments] = useState<Record<string, string | number>[]>([])
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [careRequests, setCareRequests] = useState<CareRequestOut[]>([])
  const [requestDoctors, setRequestDoctors] = useState<UserRow[]>([])
  const [specializations, setSpecializations] = useState<string[]>([])
  const [selectedRequest, setSelectedRequest] = useState<CareRequestOut | null>(null)
  const [editingUser, setEditingUser] = useState<UserRow | null>(null)
  const [appointmentDoctor, setAppointmentDoctor] = useState<UserRow | null>(null)
  const [doctorAppointments, setDoctorAppointments] = useState<AppointmentOut[]>([])
  const [doctorAppointmentStatus, setDoctorAppointmentStatus] = useState("all")
  const [doctorAppointmentsBusy, setDoctorAppointmentsBusy] = useState(false)
  const [requestDoctorId, setRequestDoctorId] = useState("")
  const [appointmentDate, setAppointmentDate] = useState("")
  const [appointmentTime, setAppointmentTime] = useState("")
  const [adminNotes, setAdminNotes] = useState("")
  const [requestStatus, setRequestStatus] = useState("submitted")
  const [requestBusy, setRequestBusy] = useState(false)
  const [userBusy, setUserBusy] = useState(false)
  const [search, setSearch] = useState("")
  const [auditDateStart, setAuditDateStart] = useState("")
  const [auditDateEnd, setAuditDateEnd] = useState("")
  const [auditPrintedAt, setAuditPrintedAt] = useState(() => new Date().toISOString())
  const [doctorEmail, setDoctorEmail] = useState("")
  const [patientEmail, setPatientEmail] = useState("")
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [unread, setUnread] = useState(0)
  const userEmail = session?.email || ""

  const section = isDark
    ? "border-slate-800 bg-slate-900/90 shadow-black/20"
    : "border-slate-200 bg-white shadow-slate-200/70"
  const muted = isDark ? "text-slate-400" : "text-slate-500"
  const input = isDark
    ? "border-slate-700 bg-slate-950 text-slate-100 placeholder:text-slate-500 focus:border-blue-400 focus:ring-blue-500/20"
    : "border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-100"

  const currentUserRole: UserRole = active === "doctors" ? "doctor" : "patient"

  const load = async () => {
    if (active === "overview") setSummary(await getAdminSummary(auditDateStart, auditDateEnd))
    if (active === "doctors" || active === "patients") {
      const result = await getAdminUsers(currentUserRole, search)
      setRows(result.items)
      if (currentUserRole === "doctor") {
        const items = await listSpecializations()
        setSpecializations(items.map((item) => item.name))
      }
    }
    if (active === "assignments") setAssignments(await listAssignments())
    if (active === "audit") setLogs((await getAuditLogs(search, auditDateStart, auditDateEnd)).items)
    if (active === "requests") {
      const [requests, doctors] = await Promise.all([
        listAdminCareRequests(requestStatus),
        getAdminUsers("doctor"),
      ])
      setCareRequests(requests)
      setRequestDoctors(doctors.items)
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load().catch(() => undefined)
    }, 0)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, search, requestStatus, auditDateStart, auditDateEnd])

  useEffect(() => {
    if (!appointmentDoctor) return
    void loadDoctorAppointments(appointmentDoctor, doctorAppointmentStatus)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doctorAppointmentStatus])

  const refreshUnread = async () => {
    if (!userEmail) return
    try {
      const data = await listNotifications(userEmail)
      setUnread(data.filter((item) => !item.is_read).length)
    } catch {
      setUnread(0)
    }
  }

  useEffect(() => {
    void refreshUnread()
    const timer = window.setInterval(() => void refreshUnread(), 15000)
    return () => window.clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userEmail])

  const recentActivities = useMemo(() => {
    const items = summary.recent_activities
    return Array.isArray(items) ? (items as AuditLog[]) : []
  }, [summary])

  if (!session || session.role !== "admin") return <Navigate to="/" replace />

  const navItems = [
    { key: "overview", label: "Overview", icon: <FiActivity /> },
    { key: "requests", label: "Patient Requests", icon: <FiClipboard /> },
    { key: "doctors", label: "Doctors", icon: <FiUsers /> },
    { key: "patients", label: "Patients", icon: <FiUsers /> },
    { key: "assignments", label: "Assignments", icon: <FiCalendar /> },
    { key: "audit", label: "Audit Logs", icon: <FiDatabase /> },
  ]

  const openEditUser = (row: UserRow) => setEditingUser({ ...row })

  const saveUser = async () => {
    if (!editingUser) return
    setUserBusy(true)
    try {
      await updateAdminUser(editingUser.user_id, {
        name: editingUser.name,
        email: editingUser.email,
        status: editingUser.status,
        specialization: currentUserRole === "doctor" ? editingUser.specialization : undefined,
        contact_number: currentUserRole === "patient" ? editingUser.contact_number : undefined,
      })
      setEditingUser(null)
      await load()
    } finally {
      setUserBusy(false)
    }
  }

  const archiveUser = async (row: UserRow) => {
    if (!confirm(`Delete ${row.name}'s account from active records?`)) return
    await archiveAdminUser(row.user_id)
    await load()
  }

  const loadDoctorAppointments = async (doctor: UserRow, status = doctorAppointmentStatus) => {
    setAppointmentDoctor(doctor)
    setDoctorAppointmentsBusy(true)
    try {
      setDoctorAppointments(await listDoctorAppointmentsForAdmin(doctor.id, status))
    } finally {
      setDoctorAppointmentsBusy(false)
    }
  }

  const printAuditLogs = () => {
    const printedAt = new Date().toISOString()
    const previousTitle = document.title
    setAuditPrintedAt(printedAt)
    document.title = `Cyberhealth Audit Logs - ${new Date(printedAt).toLocaleDateString()}`
    window.setTimeout(() => {
      window.print()
    }, 0)
    window.setTimeout(() => {
      document.title = previousTitle
    }, 250)
  }

  const clearAuditDateFilter = () => {
    setAuditDateStart("")
    setAuditDateEnd("")
  }

  return (
    <DashboardShell
      title="Cyberhealth Admin"
      subtitle="Operational command center for users, care requests, assignments, and security records"
      navItems={navItems}
      active={active}
      onSelect={(key) => {
        setSearch("")
        setActive(key as Panel)
      }}
      userInitial="A"
      userLabel={session.profile?.name || "Administrator"}
      userSub={session.email}
      unreadCount={unread}
      onClickBell={() => setDrawerOpen(true)}
    >
      <style>{`
        @page {
          size: A4 portrait;
          margin: 8mm;
        }
        @media print {
          html, body {
            width: 210mm !important;
            min-width: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #111827 !important;
            font-family: Arial, Helvetica, sans-serif !important;
          }
          body * { visibility: hidden !important; }
          #audit-print-area, #audit-print-area * { visibility: visible !important; }
          #audit-print-area {
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 194mm !important;
            max-width: 194mm !important;
            min-width: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            border: 0 !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            color: #111827 !important;
            background: #ffffff !important;
            overflow: visible !important;
          }
          .no-print { display: none !important; }
          .print-header {
            display: block !important;
            margin: 0 0 8mm !important;
            padding: 0 0 4mm !important;
            border-bottom: 2px solid #0f172a !important;
            color: #0f172a !important;
          }
          .print-table-wrap {
            width: 100% !important;
            max-width: 194mm !important;
            min-width: 0 !important;
            overflow: visible !important;
            border: 0 !important;
            border-radius: 0 !important;
          }
          .print-table {
            width: 100% !important;
            max-width: 194mm !important;
            min-width: 0 !important;
            border-collapse: collapse !important;
            table-layout: fixed !important;
            font-size: 9px !important;
            line-height: 1.3 !important;
            color: #111827 !important;
          }
          .print-table th {
            background: #0f172a !important;
            color: #ffffff !important;
            font-size: 9px !important;
            font-weight: 700 !important;
            text-transform: uppercase !important;
            letter-spacing: .03em !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .print-table th, .print-table td {
            border: 1px solid #94a3b8 !important;
            padding: 5px 6px !important;
            vertical-align: top !important;
            overflow-wrap: anywhere !important;
            word-break: break-word !important;
            white-space: normal !important;
          }
          .print-table td, .print-table td * {
            color: #111827 !important;
            background: transparent !important;
            box-shadow: none !important;
          }
          .print-table thead { display: table-header-group !important; }
          .print-table tr {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          .print-table tbody tr:nth-child(even) {
            background: #f8fafc !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      {active === "overview" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[
              ["patients", "Registered Patients", "Total patient profiles"],
              ["doctors", "Registered Doctors", "Active provider profiles"],
              ["appointments", "Appointments", "All scheduled visits"],
              ["pending", "Pending Requests", "Care requests needing review"],
              ["completed", "Completed Visits", "Finished appointments"],
              ["cancelled", "Cancelled / Rejected", "Closed without completion"],
            ].map(([key, label, helper]) => (
              <div key={key} className={`rounded-3xl border p-5 shadow-xl ${section}`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className={`text-sm font-medium ${muted}`}>{label}</p>
                    <p className="mt-2 text-4xl font-bold tracking-tight">{summary[key] ?? 0}</p>
                    <p className={`mt-2 text-xs ${muted}`}>{helper}</p>
                  </div>
                  <div className="rounded-2xl bg-blue-600/10 p-3 text-blue-500">
                    <FiActivity />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <section className={`rounded-3xl border p-6 shadow-xl ${section}`}>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">Recent System Activity</h2>
                <p className={`text-sm ${muted}`}>Latest administrative and authentication events.</p>
              </div>
              <div className="flex flex-wrap items-end gap-2">
                <label className={`text-xs font-semibold ${muted}`}>
                  Start date
                  <input type="date" value={auditDateStart} onChange={(e) => setAuditDateStart(e.target.value)} className={`mt-1 block rounded-xl border px-3 py-2 text-sm outline-none ring-4 ring-transparent transition ${input}`} />
                </label>
                <label className={`text-xs font-semibold ${muted}`}>
                  End date
                  <input type="date" value={auditDateEnd} onChange={(e) => setAuditDateEnd(e.target.value)} className={`mt-1 block rounded-xl border px-3 py-2 text-sm outline-none ring-4 ring-transparent transition ${input}`} />
                </label>
                {(auditDateStart || auditDateEnd) && (
                  <button onClick={clearAuditDateFilter} className="rounded-xl border border-slate-500/20 px-3 py-2 text-sm font-semibold">
                    Clear
                  </button>
                )}
              </div>
            </div>
            <div className="space-y-3">
              {recentActivities.length === 0 && <EmptyState message="No recent audit activity matches this date range." />}
              {recentActivities.map((item) => (
                <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-500/15 px-4 py-3">
                  <div>
                    <p className="font-semibold">{item.description || item.action_description || item.action_type}</p>
                    <p className={`text-sm ${muted}`}>{item.email || "anonymous"} - {formatDate(item.created_at)}</p>
                  </div>
                  <Badge value={item.status} />
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {active === "requests" && (
        <section className={`rounded-3xl border p-6 shadow-xl ${section}`}>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold">Patient Care Requests</h2>
              <p className={`text-sm ${muted}`}>Review intake details, triage urgency, and assign the right doctor.</p>
            </div>
            <select value={requestStatus} onChange={(e) => setRequestStatus(e.target.value)} className={`rounded-xl border px-3 py-2 outline-none ring-4 ring-transparent transition ${input}`}>
              <option value="all">All requests</option>
              <option value="submitted">Submitted</option>
              <option value="under_review">Under review</option>
              <option value="assigned">Assigned</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div className="grid gap-4">
            {careRequests.length === 0 && <EmptyState message="No care requests match this filter." />}
            {careRequests.map((item) => {
              const needsReassignment = item.status === "rejected" && !!item.appointment_id
              const canReview =
                item.status !== "assigned" &&
                item.status !== "cancelled" &&
                item.status !== "completed" &&
                (item.status !== "rejected" || needsReassignment)
              return (
              <article key={item.id} className="rounded-2xl border border-slate-500/15 p-5">
                <div className="flex flex-wrap justify-between gap-3">
                  <div>
                    <p className="text-lg font-bold">{item.patient_name}</p>
                    <p className={`text-sm ${muted}`}>{item.patient_contact}</p>
                  </div>
                  <Badge value={item.status} />
                </div>
                {needsReassignment && (
                  <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                    The assigned doctor rejected this appointment. Review this request and assign another doctor.
                  </div>
                )}
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <Info label="Main concern" value={item.chief_complaint} />
                  <Info label="Severity / urgency" value={`${item.severity} / ${item.urgency}`} />
                  <Info label="Suggested service" value={item.suggested_specialization} />
                  <Info label="Symptoms" value={item.symptoms} />
                  <Info label="Duration" value={item.symptom_duration || "Not provided"} />
                  <Info label="Preferred schedule" value={`${item.preferred_date || "No date"} ${item.preferred_time || ""}`} />
                </div>
                {canReview && (
                  <div className="mt-5 flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        setSelectedRequest(item)
                        const matching = requestDoctors.find((doctor) => doctor.specialization === item.suggested_specialization)
                        setRequestDoctorId(String(matching?.id || requestDoctors[0]?.id || ""))
                        setAppointmentDate(item.preferred_date || "")
                        setAppointmentTime(item.preferred_time?.slice(0, 5) || "")
                      }}
                      className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
                    >
                      {needsReassignment ? "Review & Reassign" : "Review & Assign"}
                    </button>
                    {!needsReassignment && (
                      <>
                        <button onClick={async () => { await updateCareRequestStatus(item.id, "under_review"); await load() }} className="rounded-xl border border-slate-500/20 px-4 py-2 text-sm font-semibold">
                          Mark Under Review
                        </button>
                        <button onClick={async () => { if (confirm("Reject this care request?")) { await updateCareRequestStatus(item.id, "rejected", "Please contact the hospital for further assistance."); await load() } }} className="rounded-xl border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-500">
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                )}
              </article>
              )
            })}
          </div>
        </section>
      )}

      {(active === "doctors" || active === "patients") && (
        <section className={`rounded-3xl border p-6 shadow-xl ${section}`}>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold capitalize">{active}</h2>
              <p className={`text-sm ${muted}`}>Manage profile details, account status, and active records.</p>
            </div>
            <div className="relative">
              <FiSearch className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 ${muted}`} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name or email" className={`w-72 rounded-xl border py-2 pl-10 pr-3 outline-none ring-4 ring-transparent transition ${input}`} />
            </div>
          </div>
          <div className="overflow-hidden rounded-2xl border border-slate-500/15">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className={isDark ? "bg-slate-950 text-slate-300" : "bg-slate-50 text-slate-600"}>
                <tr>
                  <th className="px-4 py-3 font-semibold">Name</th>
                  <th className="px-4 py-3 font-semibold">Email</th>
                  <th className="px-4 py-3 font-semibold">Details</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-500/15">
                {rows.length === 0 && (
                  <tr><td colSpan={5}><EmptyState message={`No ${active} found.`} /></td></tr>
                )}
                {rows.map((row) => (
                  <tr key={row.user_id} className={isDark ? "hover:bg-slate-800/60" : "hover:bg-slate-50"}>
                    <td className="px-4 py-4 font-semibold">{row.name}</td>
                    <td className={`px-4 py-4 ${muted}`}>{row.email}</td>
                    <td className="px-4 py-4">{row.specialization || row.contact_number || "Not provided"}</td>
                    <td className="px-4 py-4"><Badge value={row.status} /></td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-2">
                        {active === "doctors" && (
                          <button onClick={() => void loadDoctorAppointments(row)} className="inline-flex items-center gap-2 rounded-xl border border-indigo-200 px-3 py-2 font-semibold text-indigo-600 transition hover:bg-indigo-50">
                            <FiEye /> See Appointments
                          </button>
                        )}
                        <button onClick={() => openEditUser(row)} className="inline-flex items-center gap-2 rounded-xl border border-blue-200 px-3 py-2 font-semibold text-blue-600 transition hover:bg-blue-50">
                          <FiEdit3 /> Edit
                        </button>
                        <button onClick={() => void archiveUser(row)} className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-3 py-2 font-semibold text-rose-600 transition hover:bg-rose-50">
                          <FiTrash2 /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {active === "assignments" && (
        <section className={`rounded-3xl border p-6 shadow-xl ${section}`}>
          <div className="mb-5">
            <h2 className="text-2xl font-bold">Doctor-Patient Assignments</h2>
            <p className={`text-sm ${muted}`}>Link patients to doctors for managed follow-up care.</p>
          </div>
          <div className="mb-5 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
            <input type="email" value={doctorEmail} onChange={(e) => setDoctorEmail(e.target.value)} placeholder="Doctor email" className={`rounded-xl border px-3 py-2 outline-none ring-4 ring-transparent transition ${input}`} />
            <input type="email" value={patientEmail} onChange={(e) => setPatientEmail(e.target.value)} placeholder="Patient email" className={`rounded-xl border px-3 py-2 outline-none ring-4 ring-transparent transition ${input}`} />
            <button
              disabled={!doctorEmail.trim() || !patientEmail.trim()}
              onClick={async () => {
                await assignPatient(doctorEmail, patientEmail)
                setDoctorEmail("")
                setPatientEmail("")
                setAssignments(await listAssignments())
              }}
              className="rounded-xl bg-blue-600 px-5 py-2 font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Assign / Reassign
            </button>
          </div>
          <div className="space-y-3">
            {assignments.length === 0 && <EmptyState message="No assignments yet." />}
            {assignments.map((item) => (
              <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-500/15 px-4 py-3">
                <p className="font-semibold">{item.patient_name} assigned to Dr. {item.doctor_name}</p>
                <Badge value={String(item.status)} />
              </div>
            ))}
          </div>
        </section>
      )}

      {active === "audit" && (
        <section id="audit-print-area" className={`rounded-3xl border p-6 shadow-xl ${section}`}>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 no-print">
            <div>
              <h2 className="text-2xl font-bold">Audit Logs</h2>
              <p className={`text-sm ${muted}`}>Printable, high-contrast security and system activity records.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <FiSearch className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 ${muted}`} />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Filter logs" className={`w-72 rounded-xl border py-2 pl-10 pr-3 outline-none ring-4 ring-transparent transition ${input}`} />
              </div>
              <label className={`text-xs font-semibold ${muted}`}>
                Start date
                <input type="date" value={auditDateStart} onChange={(e) => setAuditDateStart(e.target.value)} className={`mt-1 block rounded-xl border px-3 py-2 text-sm outline-none ring-4 ring-transparent transition ${input}`} />
              </label>
              <label className={`text-xs font-semibold ${muted}`}>
                End date
                <input type="date" value={auditDateEnd} onChange={(e) => setAuditDateEnd(e.target.value)} className={`mt-1 block rounded-xl border px-3 py-2 text-sm outline-none ring-4 ring-transparent transition ${input}`} />
              </label>
              {(auditDateStart || auditDateEnd) && (
                <button onClick={clearAuditDateFilter} className="rounded-xl border border-slate-500/20 px-3 py-2 text-sm font-semibold">
                  Clear
                </button>
              )}
              <button onClick={printAuditLogs} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:bg-slate-800">
                <FiPrinter /> Print / PDF
              </button>
            </div>
          </div>

          <div className="print-header hidden">
            <div className="flex items-end justify-between gap-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">Cyberhealth Administration</p>
                <h1 className="mt-1 text-2xl font-bold text-slate-950">Audit Log Report</h1>
                <p className="mt-1 text-xs text-slate-600">Official system activity and security record</p>
              </div>
              <div className="text-right text-xs text-slate-700">
                <p><strong>Date printed:</strong> {formatDate(auditPrintedAt)}</p>
                <p className="mt-1"><strong>Date range:</strong> {formatAuditDateRange(auditDateStart, auditDateEnd)}</p>
                <p className="mt-1"><strong>Total records:</strong> {logs.length}</p>
              </div>
            </div>
          </div>

          <div className="print-table-wrap overflow-hidden rounded-2xl border border-slate-500/15">
            <table className="print-table w-full text-left text-sm">
              <colgroup>
                <col style={{ width: "20%" }} />
                <col style={{ width: "22%" }} />
                <col style={{ width: "16%" }} />
                <col style={{ width: "31%" }} />
                <col style={{ width: "11%" }} />
              </colgroup>
              <thead className={isDark ? "bg-slate-950 text-slate-300" : "bg-slate-50 text-slate-600"}>
                <tr>
                  <th className="px-4 py-3 font-semibold">Date & Time</th>
                  <th className="px-4 py-3 font-semibold">User</th>
                  <th className="px-4 py-3 font-semibold">Action</th>
                  <th className="px-4 py-3 font-semibold">Description</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-500/15">
                {logs.length === 0 && (
                  <tr><td colSpan={5}><EmptyState message="No audit logs found." /></td></tr>
                )}
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="px-4 py-4 font-medium">{formatDate(log.created_at)}</td>
                    <td className="px-4 py-4">{log.email || log.username || "anonymous"}</td>
                    <td className="px-4 py-4 font-semibold">{humanize(log.action_type)}</td>
                    <td className={`px-4 py-4 ${muted}`}>{log.action_description || log.description || "No description"}</td>
                    <td className="px-4 py-4"><Badge value={log.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm no-print">
          <div className={`w-full max-w-xl rounded-3xl border p-6 shadow-2xl ${section}`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-bold">Assign Request #{selectedRequest.id}</h3>
                <p className={`mt-1 text-sm ${muted}`}>Suggested specialization: {selectedRequest.suggested_specialization}</p>
              </div>
              <button onClick={() => setSelectedRequest(null)} className="rounded-full p-2 hover:bg-slate-500/10"><FiX /></button>
            </div>
            <div className="mt-5 space-y-4">
              <label className="block text-sm font-semibold">Doctor
                <select value={requestDoctorId} onChange={(e) => setRequestDoctorId(e.target.value)} className={`mt-2 w-full rounded-xl border px-3 py-2 outline-none ring-4 ring-transparent transition ${input}`}>
                  {requestDoctors
                    .slice()
                    .sort((a, b) => Number(b.specialization === selectedRequest.suggested_specialization) - Number(a.specialization === selectedRequest.suggested_specialization))
                    .map((doctor) => <option key={doctor.id} value={doctor.id}>{doctor.name} - {doctor.specialization}</option>)}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm font-semibold">Appointment date<input type="date" value={appointmentDate} onChange={(e) => setAppointmentDate(e.target.value)} className={`mt-2 w-full rounded-xl border px-3 py-2 outline-none ring-4 ring-transparent transition ${input}`} /></label>
                <label className="text-sm font-semibold">Appointment time<input type="time" value={appointmentTime} onChange={(e) => setAppointmentTime(e.target.value)} className={`mt-2 w-full rounded-xl border px-3 py-2 outline-none ring-4 ring-transparent transition ${input}`} /></label>
              </div>
              <label className="block text-sm font-semibold">Administrative notes<textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} rows={3} className={`mt-2 w-full rounded-xl border px-3 py-2 outline-none ring-4 ring-transparent transition ${input}`} /></label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setSelectedRequest(null)} className="rounded-xl border border-slate-500/20 px-4 py-2 font-semibold">Cancel</button>
              <button disabled={requestBusy || !requestDoctorId || !appointmentDate || !appointmentTime} onClick={async () => {
                setRequestBusy(true)
                try {
                  await assignCareRequest(selectedRequest.id, {
                    doctor_id: Number(requestDoctorId),
                    appointment_date: appointmentDate,
                    appointment_time: appointmentTime,
                    admin_notes: adminNotes || undefined,
                  })
                  setSelectedRequest(null)
                  setAdminNotes("")
                  await load()
                } finally {
                  setRequestBusy(false)
                }
              }} className="rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white shadow-lg shadow-blue-600/20 disabled:opacity-50">
                {requestBusy ? "Assigning..." : "Assign Doctor"}
              </button>
            </div>
          </div>
        </div>
      )}

      {appointmentDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm no-print">
          <div className={`max-h-[88vh] w-full max-w-5xl overflow-hidden rounded-3xl border shadow-2xl ${section}`}>
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-500/15 p-6">
              <div>
                <h3 className="text-2xl font-bold">Dr. {appointmentDoctor.name}'s Appointments</h3>
                <p className={`mt-1 text-sm ${muted}`}>
                  {appointmentDoctor.specialization || "No specialization"} - {doctorAppointments.length} record{doctorAppointments.length === 1 ? "" : "s"} shown
                </p>
              </div>
              <div className="flex items-center gap-2">
                <select value={doctorAppointmentStatus} onChange={(e) => setDoctorAppointmentStatus(e.target.value)} className={`rounded-xl border px-3 py-2 outline-none ring-4 ring-transparent transition ${input}`}>
                  <option value="all">All statuses</option>
                  <option value="pending">Pending</option>
                  <option value="accepted">Accepted</option>
                  <option value="completed">Completed</option>
                  <option value="rejected">Rejected</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <button
                  onClick={() => {
                    setAppointmentDoctor(null)
                    setDoctorAppointments([])
                    setDoctorAppointmentStatus("all")
                  }}
                  className="rounded-full p-2 hover:bg-slate-500/10"
                >
                  <FiX />
                </button>
              </div>
            </div>

            <div className="max-h-[62vh] overflow-auto p-6">
              {doctorAppointmentsBusy && <EmptyState message="Loading appointments..." />}
              {!doctorAppointmentsBusy && doctorAppointments.length === 0 && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-800">
                  <p className="font-bold">No appointments found for this doctor.</p>
                  <p className="mt-1 text-sm">This doctor has no loaded appointment records for the selected status.</p>
                </div>
              )}
              {!doctorAppointmentsBusy && doctorAppointments.length > 0 && (
                <div className="overflow-hidden rounded-2xl border border-slate-500/15">
                  <table className="w-full min-w-[780px] text-left text-sm">
                    <thead className={isDark ? "bg-slate-950 text-slate-300" : "bg-slate-50 text-slate-600"}>
                      <tr>
                        <th className="px-4 py-3 font-semibold">Date</th>
                        <th className="px-4 py-3 font-semibold">Time</th>
                        <th className="px-4 py-3 font-semibold">Patient</th>
                        <th className="px-4 py-3 font-semibold">Contact</th>
                        <th className="px-4 py-3 font-semibold">Reason / Diagnosis</th>
                        <th className="px-4 py-3 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-500/15">
                      {doctorAppointments.map((appointment) => (
                        <tr key={appointment.id} className={isDark ? "hover:bg-slate-800/60" : "hover:bg-slate-50"}>
                          <td className="px-4 py-4 font-semibold">{appointment.appointment_date}</td>
                          <td className="px-4 py-4">{appointment.appointment_time.slice(0, 5)}</td>
                          <td className="px-4 py-4">{appointment.patient_name}</td>
                          <td className={`px-4 py-4 ${muted}`}>{appointment.patient_contact}</td>
                          <td className="px-4 py-4">{appointment.diagnosis || "Not provided"}</td>
                          <td className="px-4 py-4"><Badge value={appointment.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm no-print">
          <div className={`w-full max-w-xl rounded-3xl border p-6 shadow-2xl ${section}`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-bold">Edit {currentUserRole === "doctor" ? "Doctor" : "Patient"}</h3>
                <p className={`mt-1 text-sm ${muted}`}>Update account and profile details.</p>
              </div>
              <button onClick={() => setEditingUser(null)} className="rounded-full p-2 hover:bg-slate-500/10"><FiX /></button>
            </div>
            <div className="mt-5 grid gap-4">
              <label className="text-sm font-semibold">Name<input value={editingUser.name} onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })} className={`mt-2 w-full rounded-xl border px-3 py-2 outline-none ring-4 ring-transparent transition ${input}`} /></label>
              <label className="text-sm font-semibold">Email<input type="email" value={editingUser.email} onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })} className={`mt-2 w-full rounded-xl border px-3 py-2 outline-none ring-4 ring-transparent transition ${input}`} /></label>
              {currentUserRole === "doctor" ? (
                <label className="text-sm font-semibold">Specialization
                  <select value={editingUser.specialization || ""} onChange={(e) => setEditingUser({ ...editingUser, specialization: e.target.value })} className={`mt-2 w-full rounded-xl border px-3 py-2 outline-none ring-4 ring-transparent transition ${input}`}>
                    <option value="">Select specialization</option>
                    {specializations.map((name) => <option key={name} value={name}>{name}</option>)}
                  </select>
                </label>
              ) : (
                <label className="text-sm font-semibold">Contact Number<input value={editingUser.contact_number || ""} onChange={(e) => setEditingUser({ ...editingUser, contact_number: e.target.value })} className={`mt-2 w-full rounded-xl border px-3 py-2 outline-none ring-4 ring-transparent transition ${input}`} /></label>
              )}
              <label className="text-sm font-semibold">Status
                <select value={editingUser.status} onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value })} className={`mt-2 w-full rounded-xl border px-3 py-2 outline-none ring-4 ring-transparent transition ${input}`}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button onClick={() => setEditingUser(null)} className="rounded-xl border border-slate-500/20 px-4 py-2 font-semibold">Cancel</button>
              <button disabled={userBusy || !editingUser.name.trim() || !editingUser.email.trim()} onClick={() => void saveUser()} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white shadow-lg shadow-blue-600/20 disabled:opacity-50">
                <FiCheckCircle /> {userBusy ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      <NotificationsDrawer
        open={drawerOpen}
        email={userEmail}
        onClose={() => setDrawerOpen(false)}
        onCountChange={setUnread}
      />
    </DashboardShell>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs font-semibold uppercase tracking-wide opacity-50">{label}</p><p className="mt-1 text-sm font-medium">{value}</p></div>
}

function Badge({ value }: { value: string }) {
  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold capitalize ring-1 ${statusTone[value] || "bg-slate-100 text-slate-700 ring-slate-200"}`}>
      {humanize(value)}
    </span>
  )
}

function EmptyState({ message }: { message: string }) {
  return <p className="px-4 py-10 text-center text-sm text-slate-500">{message}</p>
}

function humanize(value: string) {
  return value.replaceAll("_", " ")
}

function formatDate(value: string) {
  if (!value) return "N/A"
  return new Date(value).toLocaleString()
}

function formatAuditDateRange(start: string, end: string) {
  if (!start && !end) return "All dates"
  const formatDateOnly = (value: string) => new Date(`${value}T00:00:00`).toLocaleDateString()
  if (start && end) return `${formatDateOnly(start)} to ${formatDateOnly(end)}`
  if (start) return `From ${formatDateOnly(start)}`
  return `Until ${formatDateOnly(end)}`
}
