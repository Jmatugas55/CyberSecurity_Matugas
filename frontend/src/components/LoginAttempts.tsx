import { useEffect, useState } from "react"
import {
  getLoginAttempts,
  getBlockedUsers,
  unblockUser,
  resetFailedAttempts,
  resetSuccessAttempts,
  resetAllAttempts,
} from "../api/api"
import type { LoginSummary, BlockedUser, AttemptFilter } from "../types"

interface Props {
  isDark?: boolean
}

export default function LoginAttempts({ isDark = true }: Props) {
  const [attempts, setAttempts] = useState<LoginSummary[]>([])
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([])
  const [filter, setFilter] = useState<AttemptFilter>("all")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter])

  const loadData = async () => {
    setLoading(true)
    try {
      if (filter === "blocked") {
        const data = await getBlockedUsers()
        setBlockedUsers(data || [])
      } else {
        const serverFilter = filter === "all" ? "all" : filter
        const data = await getLoginAttempts(serverFilter)
        setAttempts(data || [])
      }
    } finally {
      setLoading(false)
    }
  }

  const handleUnblock = async (id: number) => {
    await unblockUser(id)
    loadData()
  }

  const handleReset = async (email: string) => {
    if (filter === "success") await resetSuccessAttempts(email)
    else if (filter === "failed") await resetFailedAttempts(email)
    else await resetAllAttempts(email)
    loadData()
  }

  // Hide rows that don't match the requested filter (success-only / failed-only).
  const visibleAttempts = attempts.filter((a) => {
    if (filter === "success") return a.success > 0 && a.failed === 0
    if (filter === "failed") return a.failed > 0 && a.success === 0
    return true // 'all'
  })

  const containerClass = isDark
    ? "w-full mx-auto bg-gray-900 text-white shadow-2xl rounded-2xl p-6 border border-gray-700"
    : "w-full mx-auto bg-white text-gray-900 shadow rounded-2xl p-6 border border-gray-200"

  const selectClass = isDark
    ? "bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
    : "bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:ring-2 focus:ring-blue-500 outline-none"

  return (
    <div className={containerClass}>
      <div className="flex flex-wrap justify-between items-center mb-6 gap-3">
        <h2 className="text-2xl font-bold">Login Attempts</h2>

        <div className="flex items-center gap-3">
          <label className={`text-sm ${isDark ? "text-gray-300" : "text-gray-700"}`}>Filter</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as AttemptFilter)}
            className={selectClass}
          >
            <option value="all">All</option>
            <option value="success">Success only</option>
            <option value="failed">Failed only</option>
            <option value="blocked">Blocked Users</option>
          </select>
        </div>
      </div>

      <div className={isDark ? "overflow-hidden rounded-xl border border-gray-700" : "overflow-hidden rounded-xl border border-gray-200"}>
        <table className="w-full text-left">
          <thead className={isDark ? "bg-gray-800 text-gray-300 text-sm" : "bg-gray-100 text-gray-800 text-sm"}>
            <tr>
              {filter === "blocked" ? (
                <>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Blocked Until</th>
                  <th className="px-4 py-3">Action</th>
                </>
              ) : (
                <>
                  <th className="px-4 py-3">Email</th>
                  {(filter === "all" || filter === "success") && <th className="px-4 py-3">Success</th>}
                  {(filter === "all" || filter === "failed") && <th className="px-4 py-3">Failed</th>}
                  <th className="px-4 py-3">Action</th>
                </>
              )}
            </tr>
          </thead>

          <tbody className={isDark ? "divide-y divide-gray-700" : "divide-y divide-gray-200"}>
            {loading && (
              <tr>
                <td colSpan={4} className={`px-4 py-6 text-center ${isDark ? "text-gray-300" : "text-gray-600"}`}>
                  Loading...
                </td>
              </tr>
            )}

            {!loading && filter === "blocked" && blockedUsers.length === 0 && (
              <tr>
                <td colSpan={4} className={`px-4 py-6 text-center ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                  No blocked users.
                </td>
              </tr>
            )}

            {filter === "blocked" &&
              blockedUsers.map((u) => (
                <tr key={u.id} className={isDark ? "hover:bg-gray-800 transition" : "hover:bg-gray-50 transition"}>
                  <td className={isDark ? "px-4 py-3 text-gray-200" : "px-4 py-3 text-gray-800"}>{u.id}</td>
                  <td className={isDark ? "px-4 py-3 text-gray-200" : "px-4 py-3 text-gray-800"}>{u.email}</td>
                  <td className={isDark ? "px-4 py-3 text-yellow-400" : "px-4 py-3 text-yellow-700"}>{u.blocked_until}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleUnblock(u.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded-lg text-sm hover:bg-red-600 transition"
                    >
                      Unblock
                    </button>
                  </td>
                </tr>
              ))}

            {!loading && filter !== "blocked" && visibleAttempts.length === 0 && (
              <tr>
                <td colSpan={4} className={`px-4 py-6 text-center ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                  No matching records.
                </td>
              </tr>
            )}

            {filter !== "blocked" &&
              visibleAttempts.map((a) => (
                <tr
                  key={a.email}
                  className={isDark ? "hover:bg-gray-800 transition" : "hover:bg-gray-50 transition"}
                >
                  <td className={isDark ? "px-4 py-3 text-gray-200" : "px-4 py-3 text-gray-800"}>{a.email}</td>
                  {(filter === "all" || filter === "success") && (
                    <td className={isDark ? "px-4 py-3 text-green-400 font-medium" : "px-4 py-3 text-green-700 font-medium"}>
                      {a.success}
                    </td>
                  )}
                  {(filter === "all" || filter === "failed") && (
                    <td className={isDark ? "px-4 py-3 text-red-400 font-medium" : "px-4 py-3 text-red-700 font-medium"}>
                      {a.failed}
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleReset(a.email)}
                      className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-700 transition"
                      title={
                        filter === "success"
                          ? "Clear success records"
                          : filter === "failed"
                          ? "Clear failed records"
                          : "Clear all records"
                      }
                    >
                      Reset
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
