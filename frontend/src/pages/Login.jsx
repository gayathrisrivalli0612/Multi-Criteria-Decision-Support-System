import { useState } from "react"
import { motion } from "framer-motion"
import { login } from "../api"

export default function Login({ onLogin, onGoSignup }) {
  const [email, setEmail]       = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState("")

  const handleLogin = async () => {
    setError("")
    if (!email || !password) return setError("Please fill in all fields.")

    setLoading(true)
    try {
      const res = await login({ email, password })
      localStorage.setItem("mcdss_token", res.data.token)
      localStorage.setItem("mcdss_user", JSON.stringify(res.data.user))
      onLogin(res.data.user)
    } catch (e) {
      setError(e.response?.data?.detail || "Login failed. Please try again.")
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
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1a1a2e", marginBottom: 6 }}>Welcome back</h1>
          <p style={{ color: "#94a3b8", fontSize: 14 }}>Sign in to your MCDSS account</p>
        </div>

        {/* Form card */}
        <div style={{ background: "#fff", border: "1px solid #e8ecf0", borderRadius: 20, padding: "32px 28px", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>

          {error && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#dc2626", marginBottom: 16 }}>
              ⚠️ {error}
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Email address</label>
            <input
              type="text"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{ width: "100%", padding: "10px 14px", fontSize: 14 }}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              style={{ width: "100%", padding: "10px 14px", fontSize: 14 }}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
            />
          </div>

          <button
            className="btn-primary"
            style={{ width: "100%", justifyContent: "center", padding: "12px", fontSize: 15 }}
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign in →"}
          </button>

          <div style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "#94a3b8" }}>
            Don't have an account?{" "}
            <button
              onClick={onGoSignup}
              style={{ background: "none", border: "none", color: "#4f46e5", fontWeight: 600, cursor: "pointer", fontSize: 13 }}
            >
              Sign up free
            </button>
          </div>
        </div>

        {/* Features */}
        <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 24, flexWrap: "wrap" }}>
          {["🧠 AI-powered", "📊 Visual results", "📄 PDF export"].map(f => (
            <span key={f} style={{ fontSize: 12, color: "#94a3b8" }}>{f}</span>
          ))}
        </div>
      </motion.div>
    </div>
  )
}