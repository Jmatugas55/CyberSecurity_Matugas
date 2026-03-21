import axios from "axios"
import type { RegisterData, LoginData, ForgotPasswordData } from "../types"

const API = axios.create({
  baseURL: "http://127.0.0.1:8000"
})

export const registerUser = async (data: RegisterData) => {
  const response = await API.post("/register", data)
  return response.data
}

export const loginUser = async (data: LoginData) => {
  const response = await API.post("/login", data)
  return response 
}

export const getUsers = async () => {
  const response = await API.get("/users")
  return response
}

export const getLoginAttempts = async (filter?: string) => {
  let url = "/login-attempts"
  if (filter && filter !== "all") {
    url += `?filter=${filter}`
  }
  const response = await API.get(url)
  return response.data
}

export const deleteLoginAttempt = (id: number) =>
  API.delete(`/login-attempts/${id}`)

export const resetFailedAttempts = (email: string) =>
  API.post(`/login-attempts/reset-failed/${encodeURIComponent(email)}`)

export const getBlockedUsers = async () => {
  const resp = await API.get("/blocked-users")
  return resp.data
}

export const unblockUser = (id: number) =>
  API.post(`/unblock-user/${id}`)

export const requestPasswordReset = (data: ForgotPasswordData) =>
  API.post(`/forgot-password`, data)

export const getSecurityQuestion = (email: string) =>
  API.get(`/security-question`, { params: { email } })

export const resetPassword = (data: { email: string; token: string; new_password: string }) =>
  API.post(`/reset-password`, data)