import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { getTemplates } from "../api"

const FALLBACK_TEMPLATES = [
  { id: "laptop", name: "Buy a Laptop", icon: "💻", description: "Compare laptops on price, performance, battery and build", criteria: ["price","performance","battery","build_quality","weight"], weights: { price:0.30, performance:0.30, battery:0.20, build_quality:0.10, weight:0.10 }, alternatives: [ {name:"Dell Inspiron",scores:{price:8,performance:7,battery:6,build_quality:7,weight:6}}, {name:"HP Pavilion",scores:{price:7,performance:8,battery:7,build_quality:7,weight:7}}, {name:"MacBook Air",scores:{price:3,performance:10,battery:9,build_quality:10,weight:9}}, {name:"Lenovo IdeaPad",scores:{price:9,performance:6,battery:7,build_quality:6,weight:8}} ], constraints:[{criteria:"price",operator:">=",value:5,priority:2}] },
  { id: "job", name: "Choose a Job Offer", icon: "💼", description: "Evaluate job offers on salary, growth, culture and location", criteria: ["salary","growth","work_life_balance","culture","location"], weights: { salary:0.30, growth:0.25, work_life_balance:0.20, culture:0.15, location:0.10 }, alternatives: [ {name:"Startup A",scores:{salary:6,growth:9,work_life_balance:5,culture:9,location:7}}, {name:"MNC Corp B",scores:{salary:9,growth:6,work_life_balance:7,culture:6,location:8}}, {name:"Mid-size Co C",scores:{salary:7,growth:7,work_life_balance:8,culture:7,location:6}} ], constraints:[] },
  { id: "college", name: "Pick a College", icon: "🎓", description: "Compare colleges on ranking, fees, placement and campus", criteria: ["ranking","fees_affordability","placement","campus_life","location"], weights: { ranking:0.30, fees_affordability:0.25, placement:0.25, campus_life:0.10, location:0.10 }, alternatives: [ {name:"College A",scores:{ranking:9,fees_affordability:5,placement:9,campus_life:8,location:7}}, {name:"College B",scores:{ranking:7,fees_affordability:8,placement:7,campus_life:7,location:8}}, {name:"College C",scores:{ranking:6,fees_affordability:9,placement:6,campus_life:6,location:9}} ], constraints:[] },
  { id: "flat", name: "Rent a Flat", icon: "🏠", description: "Compare flats on rent, location, size and amenities", criteria: ["affordability","location","size","amenities","safety"], weights: { affordability:0.35, location:0.25, size:0.15, amenities:0.15, safety:0.10 }, alternatives: [ {name:"City Centre Flat",scores:{affordability:4,location:10,size:6,amenities:8,safety:8}}, {name:"Suburbs Flat",scores:{affordability:8,location:6,size:9,amenities:6,safety:9}}, {name:"Mid-town Flat",scores:{affordability:6,location:8,size:7,amenities:7,safety:7}} ], constraints:[{criteria:"affordability",operator:">=",value:5,priority:1}] }
]

export default function Home({ onStart, user }) {
  const [templates, setTemplates] = useState(FALLBACK_TEMPLATES)
  const [selected, setSelected] = useState(null)
  const [nlpText, setNlpText] = useState("")

  useEffect(() => {
    getTemplates().then(r => setTemplates(r.data.templates)).catch(() => {})
  }, [])

  const handleStart = () => {
    if (selected) onStart(selected)
    else onStart({ criteria: [], weights: {}, alternatives: [], constraints: [] })
  }

  return (
    <div>

      {/* ── Hero section with aurora background ── */}
      <div className="aurora-bg" style={{ borderRadius: 16, marginBottom: 16, padding: "8px" }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          style={{ textAlign: "center", padding: "32px 0 24px" }}
        >
          <div style={{ fontSize: 48, marginBottom: 12 }}>🧠</div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "#1e293b", marginBottom: 8 }}>
            Multi-Criteria Decision Support
          </h1>
          <p style={{ color: "#64748b", fontSize: 15, maxWidth: 500, margin: "0 auto 8px" }}>
            AI-powered decision making — evaluate multiple options and find the best choice
          </p>
          {user && (
            <p style={{ color: "#4f46e5", fontSize: 14, marginTop: 8, fontWeight: 500 }}>
              Welcome back, {user.full_name}! 👋
            </p>
          )}
        </motion.div>
      </div>

      {/* ── Templates ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div className="card">
          <div className="section-label">Choose a decision template</div>
          <div className="template-grid">
            {templates.map(t => (
              <button
                key={t.id}
                className={`template-btn ${selected?.id === t.id ? "selected" : ""}`}
                onClick={() => setSelected(t)}
              >
                <div className="t-icon">{t.icon}</div>
                <div className="t-name">{t.name}</div>
                <div className="t-desc">{t.description}</div>
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── NLP input ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <div className="card">
          <div className="section-label">Or describe your decision in plain English</div>
          <input
            type="text"
            value={nlpText}
            onChange={e => setNlpText(e.target.value)}
            placeholder='e.g. "I want a laptop under ₹70k with good battery for coding"'
            style={{ width: "100%", marginBottom: 10 }}
          />
          <p style={{ fontSize: 12, color: "#718096" }}>
            💡 Type your decision and the system will guide you through the analysis.
          </p>
        </div>
      </motion.div>

      {/* ── Start button ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.6 }}
      >
        <button
          className="btn-primary"
          style={{ width: "100%", padding: "13px", fontSize: 15, justifyContent: "center" }}
          onClick={handleStart}
        >
          {selected ? `Start with "${selected.name}" →` : "Start from scratch →"}
        </button>
      </motion.div>

    </div>
  )
}