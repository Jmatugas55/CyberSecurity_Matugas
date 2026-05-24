import type { ReactNode } from "react"
import { Link, useNavigate } from "react-router-dom"
import { FiLogOut, FiSun, FiMoon, FiBell } from "react-icons/fi"
import { useTheme } from "../theme"
import { clearSession } from "../session"

interface NavItem {
  key: string
  label: string
  icon: ReactNode
}

interface Props {
  title: string
  subtitle?: string
  navItems: NavItem[]
  active: string
  onSelect: (key: string) => void
  userInitial: string
  userLabel: string
  userSub: string
  unreadCount?: number
  onClickBell?: () => void
  children: ReactNode
}

export default function DashboardShell({
  title,
  subtitle,
  navItems,
  active,
  onSelect,
  userInitial,
  userLabel,
  userSub,
  unreadCount = 0,
  onClickBell,
  children,
}: Props) {
  const { isDark, toggle } = useTheme()
  const navigate = useNavigate()

  const handleLogout = () => {
    clearSession()
    navigate("/")
  }

  const root = isDark ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"
  const aside = isDark
    ? "bg-slate-900/95 border-r border-slate-800"
    : "bg-white border-r border-slate-200"
  const headerBorder = isDark ? "border-slate-800" : "border-slate-200"

  return (
    <div className={`flex min-h-screen transition-colors duration-300 ${root}`}>
      <aside className={`w-64 flex flex-col ${aside}`}>
        <div className={`p-5 flex items-center gap-3 border-b ${headerBorder}`}>
          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-md shadow-blue-200 flex items-center justify-center text-lg font-bold text-white">
            {userInitial}
          </div>
          <div className="overflow-hidden">
            <p className="font-semibold truncate text-sm">{userLabel}</p>
            <p className={`text-xs truncate ${isDark ? "text-slate-400" : "text-slate-500"}`}>{userSub}</p>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = active === item.key
            return (
              <button
                key={item.key}
                onClick={() => onSelect(item.key)}
                className={`flex items-center w-full gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-200"
                    : isDark
                    ? "text-slate-300 hover:bg-slate-800"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                {item.label}
              </button>
            )
          })}
        </nav>

        <Link
          to="/"
          onClick={(e) => {
            e.preventDefault()
            handleLogout()
          }}
          className={`flex items-center gap-3 px-3 py-2.5 m-3 rounded-xl text-sm font-medium transition ${
            isDark ? "text-rose-400 hover:bg-slate-800" : "text-rose-600 hover:bg-rose-50"
          }`}
        >
          <FiLogOut />
          Logout
        </Link>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto relative">
        <div className="absolute top-5 right-5 flex items-center gap-2">
          {onClickBell && (
            <button
              onClick={onClickBell}
              className={`relative p-2.5 rounded-xl transition ${
                isDark
                  ? "bg-slate-900 text-slate-200 hover:bg-slate-800 border border-slate-800"
                  : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 shadow-sm"
              }`}
              title="Notifications"
            >
              <FiBell />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-semibold rounded-full px-1.5 py-0.5 shadow">
                  {unreadCount}
                </span>
              )}
            </button>
          )}
          <button
            onClick={toggle}
            className={`p-2.5 rounded-xl transition ${
              isDark
                ? "bg-slate-900 text-amber-300 hover:bg-slate-800 border border-slate-800"
                : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 shadow-sm"
            }`}
            title="Toggle theme"
          >
            {isDark ? <FiSun /> : <FiMoon />}
          </button>
        </div>

        <div className="mb-8">
          <h1
            className={`text-3xl font-bold tracking-tight ${
              isDark ? "text-white" : "text-slate-900"
            }`}
          >
            {title}
          </h1>
          {subtitle && (
            <p className={`mt-1 ${isDark ? "text-slate-400" : "text-slate-500"}`}>{subtitle}</p>
          )}
        </div>

        {children}
      </main>
    </div>
  )
}
