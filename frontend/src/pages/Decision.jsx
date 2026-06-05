import { useState } from "react"
import { analyseDecision } from "../api"

export default function Decision({ initialData, onResults, onBack }) {
  const init = initialData || {}
  const [alternatives, setAlternatives] = useState(
    init.alternatives || [
      { name: "", scores: {} },
      { name: "", scores: {} },
    ]
  )
  const [criteria, setCriteria] = useState(init.criteria || ["criteria1", "criteria2"])
  const [weights, setWeights] = useState(init.weights || {})
  const [constraints, setConstraints] = useState(init.constraints || [])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [inputMode, setInputMode] = useState("standard")

  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0)

  const updateScore = (altIdx, crit, val) => {
    const updated = [...alternatives]
    updated[altIdx] = { ...updated[altIdx], scores: { ...updated[altIdx].scores, [crit]: parseFloat(val) || 0 } }
    setAlternatives(updated)
  }

  const updateWeight = (crit, val) => {
    setWeights(prev => ({ ...prev, [crit]: parseFloat(val) / 100 }))
  }

  const addAlternative = () => setAlternatives([...alternatives, { name: "", scores: {} }])
  const removeAlternative = (i) => setAlternatives(alternatives.filter((_, idx) => idx !== i))

  const addConstraint = () => setConstraints([...constraints, { criteria: criteria[0], operator: ">=", value: 5, priority: 1 }])
  const removeConstraint = (i) => setConstraints(constraints.filter((_, idx) => idx !== i))

  const getLevelLabel = (score) => {
    if (score >= 9) return "Excellent"
    if (score >= 7) return "Good"
    if (score >= 5) return "Average"
    if (score >= 3) return "Poor"
    return "Very Poor"
  }

  const handleAnalyse = async () => {
    setError("")
    if (alternatives.some(a => !a.name.trim())) return setError("Please give every alternative a name.")
    if (Math.abs(totalWeight - 1) > 0.05) return setError(`Weights total ${Math.round(totalWeight * 100)}% — must be 100%.`)

    setLoading(true)
    try {
      const payload = {
        alternatives: alternatives.map(a => ({ name: a.name, scores: a.scores })),
        criteria,
        weights,
        constraints,
        pareto_criteria: criteria.slice(0, 2)
      }
      const res = await analyseDecision(payload)
      onResults(res.data)
    } catch (e) {
      setError("Backend error: " + (e.response?.data?.detail || e.message))
    }
    setLoading(false)
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <button className="btn-secondary" onClick={onBack}>← Back</button>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: "#fff" }}>
          {init.name || "New Decision"}
        </h2>
      </div>

      <div className="card" style={{ marginBottom: 12 }}>
        <div className="section-label">Input mode</div>
        <div style={{ display: "flex", gap: 8 }}>
          {["easy", "standard", "expert"].map(m => (
            <button
              key={m}
              onClick={() => setInputMode(m)}
              style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid", fontSize: 12, cursor: "pointer", background: inputMode === m ? "#4f46e5" : "transparent", borderColor: inputMode === m ? "#4f46e5" : "#2d3748", color: inputMode === m ? "#fff" : "#718096" }}
            >
              {m === "easy" ? "🟢 Easy" : m === "standard" ? "🔵 Standard" : "🟣 Expert"}
            </button>
          ))}
        </div>
        <p style={{ fontSize: 12, color: "#718096", marginTop: 8 }}>
          {inputMode === "easy" ? "Answer simple questions — no numbers needed" :
           inputMode === "standard" ? "Rate each option on sliders (1–10) with helpful tooltips" :
           "Enter scores directly as numbers"}
        </p>
      </div>

      <div className="card">
        <div className="section-label">Alternatives (options to compare)</div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "6px 8px", color: "#6366f1", fontWeight: 600, fontSize: 11 }}>Name</th>
                {criteria.map(c => (
                  <th key={c} style={{ textAlign: "center", padding: "6px 4px", color: "#6366f1", fontWeight: 600, fontSize: 11, minWidth: 70 }}>
                    {c.replace(/_/g, " ")}
                  </th>
                ))}
                <th></th>
              </tr>
            </thead>
            <tbody>
              {alternatives.map((alt, i) => (
                <tr key={i}>
                  <td style={{ padding: "4px 8px 4px 0" }}>
                    <input
                      type="text"
                      value={alt.name}
                      onChange={e => { const u = [...alternatives]; u[i] = { ...u[i], name: e.target.value }; setAlternatives(u) }}
                      placeholder={`Option ${i + 1}`}
                      style={{ width: 120 }}
                    />
                  </td>
                  {criteria.map(c => (
                    <td key={c} style={{ padding: "4px", textAlign: "center" }}>
                      {inputMode === "easy" ? (
                        <select
                          value={alt.scores[c] || 5}
                          onChange={e => updateScore(i, c, e.target.value)}
                          style={{ width: 90, fontSize: 12 }}
                        >
                          <option value={2}>Very Poor</option>
                          <option value={4}>Poor</option>
                          <option value={6}>Average</option>
                          <option value={8}>Good</option>
                          <option value={10}>Excellent</option>
                        </select>
                      ) : inputMode === "standard" ? (
                        <div>
                          <input
                            type="range"
                            min="1" max="10" step="1"
                            value={alt.scores[c] || 5}
                            onChange={e => updateScore(i, c, e.target.value)}
                            style={{ width: 70 }}
                          />
                          <div style={{ fontSize: 11, color: "#6366f1" }}>{alt.scores[c] || 5}/10</div>
                        </div>
                      ) : (
                        <input
                          type="number"
                          min="1" max="10"
                          value={alt.scores[c] || ""}
                          onChange={e => updateScore(i, c, e.target.value)}
                          style={{ width: 50, textAlign: "center" }}
                          placeholder="1-10"
                        />
                      )}
                    </td>
                  ))}
                  <td style={{ padding: "4px" }}>
                    {alternatives.length > 2 && (
                      <button className="btn-danger" onClick={() => removeAlternative(i)}>✕</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button className="btn-secondary" style={{ marginTop: 10, fontSize: 12 }} onClick={addAlternative}>
          + Add alternative
        </button>
      </div>

      <div className="card">
        <div className="section-label">Criteria weights — total: <span style={{ color: Math.abs(totalWeight - 1) < 0.05 ? "#6ee7b7" : "#fc8181" }}>{Math.round(totalWeight * 100)}%</span></div>
        {criteria.map(c => (
          <div key={c} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <span style={{ minWidth: 130, fontSize: 13, color: "#cbd5e0" }}>{c.replace(/_/g, " ")}</span>
            <input
              type="range" min="0" max="100" step="1"
              value={Math.round((weights[c] || 0) * 100)}
              onChange={e => updateWeight(c, e.target.value)}
              style={{ flex: 1 }}
            />
            <span style={{ minWidth: 38, fontSize: 13, fontWeight: 500, color: "#a5b4fc" }}>
              {Math.round((weights[c] || 0) * 100)}%
            </span>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="section-label">Hard constraints (optional)</div>
        {constraints.map((c, i) => (
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8, alignItems: "center", flexWrap: "wrap" }}>
            <select value={c.criteria} onChange={e => { const u=[...constraints]; u[i]={...u[i],criteria:e.target.value}; setConstraints(u) }}>
              {criteria.map(cr => <option key={cr} value={cr}>{cr.replace(/_/g," ")}</option>)}
            </select>
            <select value={c.operator} onChange={e => { const u=[...constraints]; u[i]={...u[i],operator:e.target.value}; setConstraints(u) }}>
              <option>{"<="}</option><option>{">="}</option><option>{"=="}</option>
            </select>
            <input type="number" min="1" max="10" value={c.value} onChange={e => { const u=[...constraints]; u[i]={...u[i],value:parseFloat(e.target.value)}; setConstraints(u) }} style={{ width: 60 }} />
            <span style={{ fontSize: 12, color: "#718096" }}>(score 1–10)</span>
            <button className="btn-danger" onClick={() => removeConstraint(i)}>Remove</button>
          </div>
        ))}
        <button className="btn-secondary" style={{ fontSize: 12 }} onClick={addConstraint}>+ Add constraint</button>
        <p style={{ fontSize: 12, color: "#718096", marginTop: 8 }}>
          Example: Price &gt;= 5 means eliminate options with price score below 5.
        </p>
      </div>

      {error && (
        <div style={{ background: "#7f1d1d", border: "1px solid #dc2626", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#fca5a5", marginBottom: 12 }}>
          ⚠️ {error}
        </div>
      )}

      <button className="btn-primary" style={{ width: "100%", padding: "12px", fontSize: 15, justifyContent: "center" }} onClick={handleAnalyse} disabled={loading}>
        {loading ? "🤖 Running AI analysis..." : "🧠 Analyse Decision →"}
      </button>
    </div>
  )
}