import { useState } from "react"
import { motion } from "framer-motion"
import { signup } from "../api"

export default function Signup({ onLogin, onGoLogin }) {
  const [fullName, setFullName] = useState("")
  const [email, setEmail]       = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm]   = useState("")
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState("")

  const handleSignup = async () => {
    setError("")
    if (!fullName || !email || !password || !confirm) return setError("Please fill in all fields.")
    if (password !== confirm) return setError("Passwords do not match.")
    if (password.length < 6) return setError("Password must be at least 6 characters.")

    setLoading(true)
    try {
      const res = await signup({ full_name: fullName, email, password })
      localStorage.setItem("mcdss_token", res.data.token)
      localStorage.setItem("mcdss_user", JSON.stringify(res.data.user))
      onLogin(res.data.user)
    } catch (e) {
      setError(e.response?.data?.detail || "Signup failed. Please try again.")
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f7fa" }}>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={{ width: "100%", maxWidth: 420, padding: "0 16px" }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 10 }}>🧠</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1a1a2e", marginBottom: 6 }}>Create your account</h1>
          <p style={{ color: "#94a3b8", fontSize: 14 }}>Start making smarter decisions today</p>
        </div>

        {/* Form card */}
        <div style={{ background: "#fff", border: "1px solid #e8ecf0", borderRadius: 20, padding: "32px 28px", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>

          {error && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#dc2626", marginBottom: 16 }}>
              ⚠️ {error}
            </div>
          )}

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Full name</label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Hruthika Marri"
              style={{ width: "100%", padding: "10px 14px", fontSize: 14 }}
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Email address</label>
            <input
              type="text"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{ width: "100%", padding: "10px 14px", fontSize: 14 }}
            />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              style={{ width: "100%", padding: "10px 14px", fontSize: 14 }}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Confirm password</label>
            <input
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Repeat your password"
              style={{ width: "100%", padding: "10px 14px", fontSize: 14 }}
              onKeyDown={e => e.key === "Enter" && handleSignup()}
            />
          </div>

          <button
            className="btn-primary"
            style={{ width: "100%", justifyContent: "center", padding: "12px", fontSize: 15 }}
            onClick={handleSignup}
            disabled={loading}
          >
            {loading ? "Creating account..." : "Create account →"}
          </button>

          <div style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "#94a3b8" }}>
            Already have an account?{" "}
            <button
              onClick={onGoLogin}
              style={{ background: "none", border: "none", color: "#4f46e5", fontWeight: 600, cursor: "pointer", fontSize: 13 }}
            >
              Sign in
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}