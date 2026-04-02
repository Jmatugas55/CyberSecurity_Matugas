import { useState } from "react"
import type { FormEvent } from "react"
import { useLocation, Link, useNavigate } from "react-router-dom"
import Notification from "../components/Modal"
import { loginUser } from "../api/api"
import { Eye, EyeOff } from "lucide-react"
import login from '../images/login.png'

export default function Login() {
  const [notificationOpen, setNotificationOpen] = useState(false)
  const [notificationType, setNotificationType] = useState<"success" | "error">("success")
  const [notificationMessage, setNotificationMessage] = useState("")
  const navigate = useNavigate()
  const location = useLocation()
  const state = (location.state as any) || {}
  const prefillEmail = state.email || ""
  const prefillPassword = state.password || ""  

  const [email, setEmail] = useState(prefillEmail)
  const [password, setPassword] = useState(prefillPassword)
  const [showPassword, setShowPassword] = useState(false)

  const handleLogin = async (data: { email: string; password: string }) => {
    try {
      const res = await loginUser(data)
      const message = res.data?.message || "Logged in"
      setNotificationType("success")
      setNotificationMessage(`${message}`)
      setNotificationOpen(true)
      localStorage.setItem("userEmail", data.email)
      localStorage.setItem("userPassword", data.password)
      setTimeout(() => {
        navigate("/dashboard")
      }, 2000)
    } catch (err:any) {
      let message: string
      if (err.response) {
        message = err.response.data?.detail || "Login failed"
      } else if (err.request) {
        message = "Unable to contact server. Is the backend running?"
      } else {
        message = err.message || "Login failed"
      }
      setNotificationType("error")
      setNotificationMessage(message)
      setNotificationOpen(true)
    }
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    handleLogin({ email, password })
  }

  return (
    <div className="h-screen w-full flex">
       <div className="hidden md:block md:w-1/2 h-full">
        <img
          src={login}
          alt="Login Visual"
          className="w-full h-full object-cover"
        />
      </div>
      <div className="w-full md:w-1/2 flex items-center justify-center bg-white px-8">
        <div className="w-full max-w-md gap-5">
          <h1 className="text-3xl font-bold text-gray-800 text-center">
            Welcome Back
          </h1>
          <p className="text-gray-500 text-center mt-2 mb-8">
            Login to your account
          </p>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm text-gray-600">Email Address</label>
              <input
                type="email"
                placeholder="example@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="text-gray-700 mt-1 w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="text-gray-700 mt-1 w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                <span
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-1/2 right-4 transform -translate-y-1/2 text-gray-500 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </span>
              </div>         
            </div>
            <div className="flex flex-col gap-3">
              <div className="text-right ">
                <Link
                  to="/forgot"
                  state={{ email }}
                  className="text-sm text-blue-600 hover:underline underline"
                >
                  Forgot password?
                </Link>
                <button
                type="submit"
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-semibold shadow-md"
                >
                  Login
                </button>   
              </div>
              
            </div>
          </form>
         
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">No account yet?</p>
            <Link to="/register" className="text-blue-600 font-semibold hover:underline">
              Create an account
            </Link>
          </div>
        </div>
      </div>
   
      <Notification
        open={notificationOpen}
        type={notificationType}
        message={notificationMessage}
        onClose={() => setNotificationOpen(false)}
        duration={2000}
      />
    </div>
  )
}