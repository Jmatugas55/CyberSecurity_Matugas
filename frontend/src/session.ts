import type { Role, SessionUser } from "./types"

const KEY = "appSession"

export function saveSession(s: SessionUser) {
  localStorage.setItem(KEY, JSON.stringify(s))
  localStorage.setItem("userEmail", s.email)
  localStorage.setItem("userRole", s.role)
}

export function getSession(): SessionUser | null {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    return JSON.parse(raw) as SessionUser
  } catch {
    return null
  }
}

export function clearSession() {
  localStorage.removeItem(KEY)
  localStorage.removeItem("userEmail")
  localStorage.removeItem("userRole")
  localStorage.removeItem("userPassword")
}

export function getRole(): Role | null {
  const s = getSession()
  return s?.role ?? null
}
