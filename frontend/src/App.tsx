import type { ReactElement } from "react"
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import Login from "./pages/Login"
import Register from "./pages/Register"
import ForgotPassword from "./pages/ForgotPassword"
import DoctorDashboard from "./pages/DoctorDashboard"
import PatientDashboard from "./pages/PatientDashboard"
import { getRole } from "./session"
import { ThemeProvider } from "./theme"
import Homepage from "./pages/Homepage"
import AdminDashboard from "./pages/AdminDashboard"

function RequireRole({ role, children }: { role: "admin" | "doctor" | "patient"; children: ReactElement }) {
  const r = getRole()
  if (!r) return <Navigate to="/" replace />
  if (r !== role) return <Navigate to={`/${r}`} replace />
  return children
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot" element={<ForgotPassword />} />
          <Route
            path="/admin"
            element={
              <RequireRole role="admin">
                <AdminDashboard />
              </RequireRole>
            }
          />
          <Route
            path="/doctor"
            element={
              <RequireRole role="doctor">
                <DoctorDashboard />
              </RequireRole>
            }
          />
          <Route
            path="/patient"
            element={
              <RequireRole role="patient">
                <PatientDashboard />
              </RequireRole>
            }
          />
          {/* legacy */}
          <Route
            path="/dashboard"
            element={<RoleRedirect />}
          />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}

function RoleRedirect() {
  const r = getRole()
  if (!r) return <Navigate to="/" replace />
  return <Navigate to={`/${r}`} replace />
}
