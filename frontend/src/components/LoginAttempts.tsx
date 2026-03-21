import { useEffect, useState } from "react"
import {
  getLoginAttempts,
  getBlockedUsers,
  unblockUser,
  resetFailedAttempts,
} from "../api/api"
import type { LoginSummary, BlockedUser, AttemptFilter } from "../types"
import { FaHome } from "react-icons/fa"
import { useNavigate } from "react-router-dom"

export default function LoginAttempts() {
  const [attempts, setAttempts] = useState<LoginSummary[]>([])
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([])
  const [filter, setFilter] = useState<AttemptFilter>("all")
  const navigate = useNavigate()

  useEffect(() => {
    loadData()
  }, [filter])

  const loadData = async () => {
    if (filter === "blocked") {
      const data = await getBlockedUsers()
      setBlockedUsers(data || [])
    } else {
      const data = await getLoginAttempts("all") // fetch all, filter locally
      setAttempts(data || [])
    }
  }

  const handleUnblock = async (id: number) => {
    await unblockUser(id)
    loadData()
  }

  const handleReset = async (email: string) => {
    await resetFailedAttempts(email)
    loadData()
  }

  // Filter attempts based on selected filter
  const filteredAttempts = attempts.filter((a) => {
    if (filter === "all") return true
    if (filter === "success") return a.success > 0
    if (filter === "failed") return a.failed > 0
    return true
  })

  return (
    <div className="w-full max-w-6xl mx-auto bg-gray-900 text-white shadow-2xl rounded-2xl p-6 border border-gray-700 mt-8">

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-5">
          <span
            className="text-gray-300 bg-transparent border-none outline-none shadow-none p-0 hover:bg-transparent cursor-pointer text-3xl"
            onClick={() => navigate(-1)}
          >
            <FaHome />
          </span>
          <h2 className="text-2xl font-bold">Login Attempts</h2>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-gray-300 text-sm">Filter</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as AttemptFilter)}
            className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="all">All</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
            <option value="blocked">Blocked Users</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-700">
        <table className="w-full text-left">
          <thead className="bg-gray-800 text-gray-300 text-sm">
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

          <tbody className="divide-y divide-gray-700">
            {filter === "blocked" &&
              blockedUsers.map((u) => (
                <tr key={u.id} className="hover:bg-gray-800 transition">
                  <td className="px-4 py-3 text-gray-200">{u.id}</td>
                  <td className="px-4 py-3 text-gray-200">{u.email}</td>
                  <td className="px-4 py-3 text-yellow-400">{u.blocked_until}</td>
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

            {filter !== "blocked" &&
              filteredAttempts.map((a) => (
                <tr key={a.email} className="hover:bg-gray-800 transition">
                  <td className="px-4 py-3 text-gray-200">{a.email}</td>
                  {(filter === "all" || filter === "success") && (
                    <td className="px-4 py-3 text-green-400 font-medium">{a.success}</td>
                  )}
                  {(filter === "all" || filter === "failed") && (
                    <td className="px-4 py-3 text-red-400 font-medium">{a.failed}</td>
                  )}
                  <td className="px-4 py-3">
                    {filter === "failed" && (
                      <button
                        onClick={() => handleReset(a.email)}
                        className="bg-blue-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-blue-700 transition"
                      >
                        Reset
                      </button>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}