import LoginAttempts from "./components/LoginAttempts"
import Dashboard from "./pages/Dashboard"
import Login from "./pages/Login"
import Register from "./pages/Register"
import ForgotPassword from "./pages/ForgotPassword"
import {BrowserRouter, Route, Routes} from "react-router-dom"

function App() {

  return (
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Login />}  />
          <Route path="/register" element={<Register />}  />
          <Route path="/forgot" element={<ForgotPassword />}  />
          <Route path="/dashboard" element={<Dashboard />}  />
          <Route path="/loginAttempts" element={<LoginAttempts />}  />
        </Routes>
      </BrowserRouter>
  )
}

export default App
