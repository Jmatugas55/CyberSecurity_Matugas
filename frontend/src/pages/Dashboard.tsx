import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { FiShield, FiLogOut, FiLock } from "react-icons/fi";
import LoginAttempts from "../components/LoginAttempts";
import ResetPasswordPanel from "../components/ResetPasswordPanel";
import Notification from "../components/Modal";

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activePanel, setActivePanel] = useState<"attempts" | "reset">("attempts")
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [notificationType, setNotificationType] = useState<"success" | "error">("success")
  const [notificationMessage, setNotificationMessage] = useState("")

  const userEmail = useMemo(() => {
    return localStorage.getItem("userEmail") || "guest@example.com"
  }, [])

  const userPassword = useMemo(() => {
    return localStorage.getItem("userPassword") || ""
  }, [])

  const userInitial = userEmail ? userEmail.charAt(0).toUpperCase() : "U"

  const handleSavePassword = (newPassword: string) => {
    try {
      if (!newPassword || newPassword.length < 6) {
        throw new Error("Password must be at least 6 characters long.");
      }
      localStorage.setItem("userPassword", newPassword);

      setNotificationType("success");
      setNotificationMessage("Password updated successfully!");
      setNotificationOpen(true);

    } catch (error: any) {
      setNotificationType("error");
      setNotificationMessage(error.message || "Failed to update password.");
      setNotificationOpen(true);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-900 text-white">
      <aside
        className={`${sidebarOpen ? "w-64" : "w-20"} bg-gray-800 transition-all duration-300 flex flex-col`}
      >
        <div className="p-4 border-b border-gray-700 flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center text-xl font-bold">
            {userInitial}
          </div>
          {sidebarOpen && (
            <div>
              <p className="text-white font-semibold">{userEmail}</p>
              <p className="text-xs text-gray-300">Logged in</p>
            </div>
          )}
        </div>

        <nav className="flex-1 p-3 space-y-2">
          <button
            type="button"
            className={`flex items-center w-full gap-2 px-3 py-2 rounded-lg text-sm ${activePanel === "attempts" ? "bg-blue-500 text-white" : "text-gray-300 hover:bg-gray-700"}`}
            onClick={() => setActivePanel("attempts")}
          >
            <FiShield />
            {sidebarOpen && "Login Attempts"}
          </button>

          <button
            type="button"
            className={`flex items-center w-full gap-2 px-3 py-2 rounded-lg text-sm ${activePanel === "reset" ? "bg-blue-500 text-white" : "text-gray-300 hover:bg-gray-700"}`}
            onClick={() => setActivePanel("reset")}
          >
            <FiLock />
            {sidebarOpen && "Reset Password"}
          </button>
        </nav>

        <Link
          to="/"
          className="flex items-center gap-2 px-3 py-2 m-3 rounded-lg hover:bg-gray-700 text-red-400"
        >
          <FiLogOut />
          {sidebarOpen && "Logout"}
        </Link>

        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="m-3 p-2 bg-blue-500 rounded-full text-white self-center hover:bg-blue-600 transition"
          aria-label="Toggle sidebar"
        >
          {sidebarOpen ? "<" : ">"}
        </button>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-blue-400">Dashboard</h1>
          <p className="text-gray-300">Manage your account and review login attempts.</p>
        </div>

        {activePanel === "attempts" ? (
          <LoginAttempts />
        ) : (
          <ResetPasswordPanel currentPassword={userPassword} onSavePassword={handleSavePassword} />
        )}
      </main>
      <Notification
              open={notificationOpen}
              type={notificationType}
              message={notificationMessage}
              onClose={() => setNotificationOpen(false)}
              duration={2000}
            />
    </div>
  );
}
