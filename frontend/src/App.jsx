import { useState, useEffect } from "react"
import Home from "./pages/Home"
import Decision from "./pages/Decision"
import Results from "./pages/Results"
import Login from "./pages/Login"
import Signup from "./pages/Signup"
import "./App.css"

export default function App() {
  const [page, setPage]               = useState("login")
  const [user, setUser]               = useState(null)
  const [decisionData, setDecisionData] = useState(null)
  const [results, setResults]         = useState(null)

  // Check if user is already logged in
  useEffect(() => {
    const savedUser = localStorage.getItem("mcdss_user")
    const token     = localStorage.getItem("mcdss_token")
    if (savedUser && token) {
      setUser(JSON.parse(savedUser))
      setPage("home")
    }
  }, [])

  const handleLogin = (userData) => {
    setUser(userData)
    setPage("home")
  }

  const handleLogout = () => {
    localStorage.removeItem("mcdss_token")
    localStorage.removeItem("mcdss_user")
    setUser(null)
    setPage("login")
    setResults(null)
    setDecisionData(null)
  }

  const goTo = (p) => setPage(p)

  // Show login/signup pages without navbar
  if (page === "login")  return <Login  onLogin={handleLogin} onGoSignup={() => goTo("signup")} />
  if (page === "signup") return <Signup onLogin={handleLogin} onGoLogin={() => goTo("login")} />

  return (
    <div className="app">
      <nav className="navbar">
        <div className="nav-brand">
          <span className="nav-icon">🧠</span>
          <span className="nav-title">MCDSS</span>
          <span className="nav-sub">Multi-Criteria Decision Support</span>
        </div>

        <div className="nav-steps">
          <button className={`nav-step ${page === "home" ? "active" : ""}`} onClick={() => goTo("home")}>1. Home</button>
          <span className="nav-arrow">›</span>
          <button className={`nav-step ${page === "decision" ? "active" : ""}`} onClick={() => decisionData && goTo("decision")}>2. Decision</button>
          <span className="nav-arrow">›</span>
          <button className={`nav-step ${page === "results" ? "active" : ""}`} onClick={() => results && goTo("results")}>3. Results</button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 13, color: "#64748b" }}>👋 {user?.full_name?.split(" ")[0]}</span>
          <button
            onClick={handleLogout}
            style={{ background: "transparent", border: "1px solid #e2e8f0", borderRadius: 20, padding: "5px 14px", fontSize: 12, color: "#94a3b8", cursor: "pointer" }}
          >
            Sign out
          </button>
        </div>
      </nav>

      <main className="main-content">
        {page === "home" && (
          <Home onStart={(data) => { setDecisionData(data); goTo("decision") }} user={user} />
        )}
        {page === "decision" && (
          <Decision
            initialData={decisionData}
            onResults={(r) => { setResults(r); goTo("results") }}
            onBack={() => goTo("home")}
          />
        )}
        {page === "results" && (
          <Results
            results={results}
            onBack={() => goTo("decision")}
            onNew={() => { setResults(null); setDecisionData(null); goTo("home") }}
          />
        )}
      </main>
    </div>
  )
}