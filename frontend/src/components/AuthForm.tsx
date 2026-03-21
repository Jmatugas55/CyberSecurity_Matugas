import React, { useState, useEffect } from "react"
import {Eye, EyeOff} from "lucide-react"

interface Props {
  onSubmit: (data: { email: string; password: string }) => void
  buttonText: string
  disabled?: boolean
  passwordError?: string
  initialEmail?: string
  initialPassword?: string
  enablePasswordGeneration?: boolean
}

export default function AuthForm({
  onSubmit,
  buttonText,
  passwordError,
  disabled,
  initialEmail = "",
  initialPassword = "",
  enablePasswordGeneration = false,
}: Props) {

  const [email, setEmail] = useState(initialEmail)
  const [password, setPassword] = useState(initialPassword)
  const [confirmPassword, setConfirmPassword] = useState(initialPassword)
  const [localError, setLocalError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const validateClientPassword = (pwd: string) => {
    if (pwd.length < 8) return "Password must be at least 8 characters";
    if (!/[A-Z]/.test(pwd)) return "Must include at least one uppercase letter";
    if (!/[a-z]/.test(pwd)) return "Must include at least one lowercase letter";
    if (!/[0-9]/.test(pwd)) return "Must include at least one number";
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) return "Must include a special character";
    return "";
  };
  const passwordStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[a-z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[!@#$%^&*(),.?\":{}|<>]/.test(pwd)) score++;

    if (score <= 2) return "Weak";
    if (score === 3 || score === 4) return "Medium";
    return "Strong";
  };

  useEffect(() => {
    if (!password && !confirmPassword) {
      setLocalError("");
      return;
    }
    const enc = new TextEncoder().encode(password);
    if (enc.length > 72) {
      const truncated = new TextDecoder().decode(enc.slice(0, 72));
      setPassword(truncated);
      setConfirmPassword(truncated);
      setLocalError("Password too long, truncated to 72 bytes");
      return;
    }
    const err = validateClientPassword(password);
    if (err) {
      setLocalError(err);
      return;
    }
    if (password !== confirmPassword) {
      setLocalError("Passwords do not match");
      return;
    }
    setLocalError("");
  }, [password, confirmPassword]);

  const generatePassword = () => {
    const length = 12; 
    const lower = 'abcdefghijklmnopqrstuvwxyz';
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const nums = '0123456789';
    const special = '!@#$%^&*()_+{}[]<>?,.';
    const all = lower + upper + nums + special;
    let pwd = '';
    pwd += lower[Math.floor(Math.random() * lower.length)];
    pwd += upper[Math.floor(Math.random() * upper.length)];
    pwd += nums[Math.floor(Math.random() * nums.length)];
    pwd += special[Math.floor(Math.random() * special.length)];
    for (let i = pwd.length; i < length; i++) {
      pwd += all[Math.floor(Math.random() * all.length)];
    }
    pwd = pwd.split('').sort(() => 0.5 - Math.random()).join('');
    if (new TextEncoder().encode(pwd).length > 72) {
      pwd = pwd.slice(0, 72);
    }
    setPassword(pwd);
    setConfirmPassword(pwd);
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const err = validateClientPassword(password);
    if (err) {
      setLocalError(err);
      return;
    }

    if (password !== confirmPassword) {
      setLocalError("Passwords do not match");
      return;
    }

    setLocalError("");
    let outPwd = password
    const encoded = new TextEncoder().encode(outPwd)
    if (encoded.length > 72) {
      outPwd = new TextDecoder().decode(encoded.slice(0, 72))
    }

    onSubmit({
      email: email.trim(),
      password: outPwd
    })
  }

  return (

    <form
      onSubmit={handleSubmit}
      className="space-y-5 w-full"
    >

      <div className="flex flex-col">
        <label className="text-sm text-gray-600 mb-1">
          Email Address
        </label>

        <input
          type="email"
          placeholder="example@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="text-black px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
      </div>

      <div className="flex flex-col">
        <label className="text-sm text-gray-600 mb-1">
          Password
        </label>

        <div className="relative w-full">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            value={password}
            maxLength={72}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full text-black px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <span
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-600 bg-transparent outline-none shadow-none cursor-pointer"
                style={{ background: "none" }}
          >
            {showPassword ? <EyeOff /> : <Eye />}
          </span>
        </div>

        
      <div className="flex flex-col">
        <label className="text-sm text-gray-600 mb-1">
          Confirm Password
        </label>
        <div className="relative">
          <input
            type={showConfirm ? "text" : "password"}
            placeholder="Re-enter password"
            value={confirmPassword}
            maxLength={72}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="w-full text-black px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <span
            onClick={() => setShowConfirm(!showConfirm)}
            className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-600 cursor-pointer"
          >
            {showConfirm ? <EyeOff /> : <Eye />}
          </span>

          
      </div>

      {password && (
        <p className="text-xs italic text-gray-600">
          Strength: <span className="font-semibold">{passwordStrength(password)}</span>
        </p>
      )}

        </div>
      </div>

      {enablePasswordGeneration && (
          <button
            type="button"
            className="text-xs text-blue-500 hover:underline mt-1 w-full"
            onClick={generatePassword}
          >
            Generate strong password
          </button>
        )}

        {localError && (
          <p className="text-red-500 text-sm mt-1">
            {localError}
          </p>
        )}

        {passwordError && !localError && (
          <p className="text-red-500 text-sm mt-1">
            {passwordError}
          </p>
        )}
    
      <button
        type="submit"
        disabled={
          !!localError ||
          !email ||
          !password ||
          !confirmPassword ||
          disabled
        }
        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {buttonText}
      </button>
    </form> 
  )
}