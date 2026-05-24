import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { FiShield, FiLogOut, FiLock, FiSun, FiMoon, FiPauseCircle } from "react-icons/fi";
import LoginAttempts from "../components/LoginAttempts";
import ResetPasswordPanel from "../components/ResetPasswordPanel";
import Notification from "../components/Modal";
import ChangeEmail from "../components/ChangeEmail";

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activePanel, setActivePanel] = useState<"attempts" | "reset">("attempts");
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationType, setNotificationType] = useState<"success" | "error">("success");
  const [notificationMessage, setNotificationMessage] = useState("");
  const [isDark, setIsDark] = useState(true);

  const userEmail = useMemo(() => {
    return localStorage.getItem("userEmail") || "guest@example.com";
  }, []);

  const userPassword = useMemo(() => {
    return localStorage.getItem("userPassword") || "";
  }, []);

  const userInitial = userEmail ? userEmail.charAt(0).toUpperCase() : "U";

  const [changeEmailOpen, setChangeEmailOpen] = useState(false);

  const handleSavePassword = (newPassword: string) => {
    try {
      if (!newPassword || newPassword.length < 6) {
        throw new Error("Password must be at least 6 characters long.");
      }
      localStorage.setItem("userPassword", newPassword);

      setNotificationType("success");
      setNotificationMessage("Password updated successfully!");
      setNotificationOpen(true);
    } catch (error: unknown) {
      setNotificationType("error");
      setNotificationMessage((error as Error).message || "Failed to update password.");
      setNotificationOpen(true);
    }
  };

  return (
    <div
      className={`flex min-h-screen transition-colors duration-300 ${
        isDark ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"
      }`}
    >
      <aside
        className={`${
          sidebarOpen ? "w-64" : "w-20"
        } transition-all duration-300 flex flex-col ${
          isDark ? "bg-gray-800" : "bg-white border-r border-gray-200"
        }`}
      >
        <div
          className={`p-4 flex items-center gap-3 border-b ${
            isDark ? "border-gray-700" : "border-gray-200"
          }`}
        >
          <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center text-xl font-bold text-white">
            {userInitial}
          </div>
          {sidebarOpen && (
            <div>
              <p className="font-semibold">{userEmail}</p>
              <p className="text-xs opacity-70">Logged in</p>
            </div>
          )}
        </div>

        <nav className="flex-1 p-3 space-y-2">
          <button
            onClick={() => setActivePanel("attempts")}
            className={`flex items-center w-full gap-2 px-3 py-2 rounded-lg text-sm transition ${
              activePanel === "attempts"
                ? isDark
                  ? "bg-blue-500 text-white"
                  : "bg-gray-300 text-gray-900"
                : isDark
                ? "text-gray-300 hover:bg-gray-700"
                : "text-gray-700 hover:bg-gray-200"
            }`}
          >
            <FiShield />
            {sidebarOpen && "Login Attempts"}
          </button>

          <button
            onClick={() => setActivePanel("reset")}
            className={`flex items-center w-full gap-2 px-3 py-2 rounded-lg text-sm transition ${
              activePanel === "reset"
                ? isDark
                  ? "bg-blue-500 text-white"
                  : "bg-gray-300 text-gray-900"
                : isDark
                ? "text-gray-300 hover:bg-gray-700"
                : "text-gray-700 hover:bg-gray-200"
            }`}
          >
            <FiLock />
            {sidebarOpen && "Reset Password"}
          </button>

          <button
            onClick={() => setChangeEmailOpen(true)}
            className={`flex items-center w-full gap-2 px-3 py-2 rounded-lg text-sm transition ${
              isDark
                ? "text-gray-300 hover:bg-gray-700"
                : "text-gray-700 hover:bg-gray-200"
            }`}
          >
            <FiPauseCircle />
            {sidebarOpen && "Change Email"}
          </button>
        </nav>

        <Link
          to="/"
          className={`flex items-center gap-2 px-3 py-2 m-3 rounded-lg transition ${
            isDark
              ? "text-red-400 hover:bg-gray-700"
              : "text-red-500 hover:bg-gray-200"
          }`}
        >
          <FiLogOut />
          {sidebarOpen && "Logout"}
        </Link>

        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className={`m-3 p-2 rounded-full self-center transition ${
            isDark
              ? "bg-blue-500 text-white hover:bg-blue-600"
              : "bg-gray-300 text-gray-800 hover:bg-gray-400"
          }`}
        >
          {sidebarOpen ? "<" : ">"}
        </button>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto relative">
        <button
          onClick={() => setIsDark(!isDark)}
          className={`absolute top-5 right-5 p-2 rounded-full transition ${
            isDark
              ? "bg-blue-500 text-white hover:bg-blue-600"
              : "bg-gray-300 text-gray-800 hover:bg-gray-400"
          }`}
        >
          {isDark ? <FiSun /> : <FiMoon />}
        </button>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-blue-500">Dashboard</h1>
          <p className={isDark ? "text-gray-300" : "text-gray-600"}>
            Manage your account and review login attempts.
          </p>
        </div>

        {activePanel === "attempts" ? (
          <LoginAttempts isDark={isDark} />
        ) : (
          <ResetPasswordPanel
            currentPassword={userPassword}
            onSavePassword={handleSavePassword}
            isDark={isDark}
          />
        )}

        <ChangeEmail
          open={changeEmailOpen}
          onClose={() => setChangeEmailOpen(false)}
          currentEmail={userEmail}
          isDark={isDark}
        />
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