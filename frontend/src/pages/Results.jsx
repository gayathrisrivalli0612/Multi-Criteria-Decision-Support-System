import { useState, useEffect } from "react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, ScatterChart, Scatter, XAxis as XA, YAxis as YA } from "recharts"

export default function Results({ results, onBack, onNew }) {
  const [whatifWeights, setWhatifWeights] = useState({})
  const [whatifWinner, setWhatifWinner] = useState("")
  const [activeTab, setActiveTab] = useState("overview")

  if (!results) return <div style={{ color: "#718096", padding: 40, textAlign: "center" }}>No results yet.</div>

  const rec = results.recommendation || {}
  const utilScores = results.co1_utility_scores || []
  const search = results.co2_search_results || {}
  const csp = results.co3_constraints || {}
  const co4 = results.co4_decision || {}
  const trace = results.reasoning_trace || []
  const stateSpace = results.co1_state_space || {}

  const barData = utilScores
    .sort((a, b) => b.utility_score - a.utility_score)
    .map(a => ({ name: a.name, score: a.utility_score, passed: a.passed_constraints }))

  const COLORS = ["#10b981", "#4f46e5", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"]

  const algos = ["bfs", "dfs", "astar", "ucs"]
    .filter(k => search[k])
    .map(k => ({ ...search[k], key: k }))
  const maxTime = Math.max(...algos.map(a => a.time_ms || 0.001))

  const sensitivity = co4.sensitivity?.insights || []
  const pareto = co4.pareto?.pareto_front || []
  const confidence = co4.confidence || {}
  const minimax = co4.minimax || {}

  useEffect(() => {
    if (co4.sensitivity?.insights?.length) {
      const w = {}
      co4.sensitivity.insights.forEach(s => { w[s.criteria] = s.current_weight_pct })
      setWhatifWeights(w)
      setWhatifWinner(rec.winner)
    }
  }, [results])

  const updateWhatif = (criteria, newPct) => {
    const updated = { ...whatifWeights, [criteria]: parseFloat(newPct) }
    setWhatifWeights(updated)
    const total = Object.values(updated).reduce((a, b) => a + b, 0)
    const normWeights = {}
    Object.keys(updated).forEach(k => { normWeights[k] = updated[k] / total })
    const scores = utilScores.map(a => {
      let s = 0
      a.trace.forEach(t => { s += (normWeights[t.criteria] || 0) * t.score })
      return { name: a.name, score: s, passed: a.passed_constraints }
    })
    const valid = scores.filter(s => s.passed)
    if (valid.length) setWhatifWinner(valid.sort((a, b) => b.score - a.score)[0].name)
  }

  const tabs = ["overview", "algorithms", "constraints", "sensitivity", "trace"]

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
        <button className="btn-secondary" onClick={onBack}>← Back</button>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: "#fff", flex: 1 }}>Analysis Results</h2>
        <button className="btn-secondary" onClick={onNew}>🏠 New Decision</button>
      </div>

      <div className="winner-card">
        <div style={{ fontSize: 13, color: "#6ee7b7", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>🏆 Recommended</div>
        <div style={{ fontSize: 28, fontWeight: 700, color: "#fff", marginBottom: 6 }}>{rec.winner}</div>
        <div style={{ fontSize: 14, color: "#6ee7b7" }}>
          Utility Score: <strong>{rec.utility_score}</strong> / 10 &nbsp;•&nbsp; Confidence: <strong>{rec.confidence}%</strong>
        </div>
        <div style={{ marginTop: 12, maxWidth: 300, margin: "12px auto 0" }}>
          <div className="progress-wrap">
            <div className="progress-fill" style={{ width: `${rec.confidence}%`, background: "#10b981" }}></div>
          </div>
        </div>
        {rec.warning && <div style={{ marginTop: 10, fontSize: 12, color: "#fcd34d" }}>⚠️ {rec.warning}</div>}
      </div>

      <div className="grid-4" style={{ marginBottom: 16 }}>
        <div className="metric-card"><div className="metric-label">Alternatives</div><div className="metric-value">{utilScores.length}</div></div>
        <div className="metric-card"><div className="metric-label">Eliminated</div><div className="metric-value" style={{ color: "#ef4444" }}>{utilScores.filter(a => !a.passed_constraints).length}</div></div>
        <div className="metric-card"><div className="metric-label">Best algorithm</div><div className="metric-value" style={{ fontSize: 16 }}>{search.winner || "A*"}</div></div>
        <div className="metric-card"><div className="metric-label">Criteria</div><div className="metric-value">{utilScores[0]?.trace?.length || 0}</div></div>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {tabs.map(t => (
          <button key={t} onClick={() => setActiveTab(t)} style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid", fontSize: 12, cursor: "pointer", background: activeTab === t ? "#4f46e5" : "transparent", borderColor: activeTab === t ? "#4f46e5" : "#2d3748", color: activeTab === t ? "#fff" : "#718096", textTransform: "capitalize" }}>
            {t === "overview" ? "📊 Overview" : t === "algorithms" ? "🔍 Algorithms" : t === "constraints" ? "⚙️ Constraints" : t === "sensitivity" ? "📈 Sensitivity" : "📋 Trace"}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <>
          <div className="card">
            <div className="section-label">Score comparison</div>
            {barData.map((d, i) => (
              <div key={d.name} className="bar-row">
                <span className="bar-name">{d.name}</span>
                <div className="bar-wrap">
                  <div className="bar-fill" style={{ width: `${d.passed ? d.score * 10 : 20}%`, background: d.passed ? COLORS[i % COLORS.length] : "#374151", color: d.passed ? "#fff" : "#9ca3af" }}>
                    {d.passed ? d.score.toFixed(2) : "❌ eliminated"}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {pareto.length > 0 && (
            <div className="card">
              <div className="section-label">Pareto front — {co4.pareto?.x_axis} vs {co4.pareto?.y_axis}</div>
              <ResponsiveContainer width="100%" height={200}>
                <ScatterChart>
                  <XA dataKey="x" name={co4.pareto?.x_axis} type="number" domain={[0,10]} label={{ value: co4.pareto?.x_axis, position: "bottom", fill: "#718096", fontSize: 11 }} tick={{ fill: "#718096", fontSize: 11 }} />
                  <YA dataKey="y" name={co4.pareto?.y_axis} type="number" domain={[0,10]} label={{ value: co4.pareto?.y_axis, angle: -90, position: "left", fill: "#718096", fontSize: 11 }} tick={{ fill: "#718096", fontSize: 11 }} />
                  <Tooltip cursor={{ strokeDasharray: "3 3" }} contentStyle={{ background: "#1a1d2e", border: "1px solid #2d3748", fontSize: 12 }} formatter={(v, n, p) => [v, p.payload.name]} />
                  <Scatter data={pareto} fill="#10b981" />
                </ScatterChart>
              </ResponsiveContainer>
              <p style={{ fontSize: 12, color: "#718096", marginTop: 6 }}>{co4.pareto?.explanation}</p>
            </div>
          )}

          <div className="card">
            <div className="section-label">What-if simulator — drag to see live result</div>
            {Object.keys(whatifWeights).slice(0, 3).map(c => (
              <div key={c} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <span style={{ minWidth: 130, fontSize: 13, color: "#cbd5e0" }}>{c.replace(/_/g, " ")}</span>
                <input type="range" min="0" max="80" step="1" value={whatifWeights[c] || 0} onChange={e => updateWhatif(c, e.target.value)} style={{ flex: 1 }} />
                <span style={{ minWidth: 38, fontSize: 13, fontWeight: 500, color: "#a5b4fc" }}>{Math.round(whatifWeights[c] || 0)}%</span>
              </div>
            ))}
            <div style={{ marginTop: 10, padding: "10px 14px", background: "#0f1117", borderRadius: 8, border: "1px solid #2d3748" }}>
              <span style={{ fontSize: 13, color: "#718096" }}>Result with adjusted weights: </span>
              <span style={{ fontSize: 15, fontWeight: 600, color: whatifWinner === rec.winner ? "#10b981" : "#f59e0b" }}>{whatifWinner}</span>
              {whatifWinner !== rec.winner && <span style={{ fontSize: 12, color: "#fcd34d", marginLeft: 8 }}>⚠️ Result changed!</span>}
            </div>
          </div>
        </>
      )}

      {activeTab === "algorithms" && (
        <div className="card">
          <div className="section-label">CO2 — Algorithm race</div>
          <p style={{ fontSize: 13, color: "#718096", marginBottom: 14 }}>All 4 search algorithms ran simultaneously. Fastest & most optimal wins.</p>
          {algos.map((a, i) => (
            <div key={a.algorithm} className="algo-row">
              <span style={{ fontWeight: 600, color: a.algorithm === search.winner ? "#10b981" : "#cbd5e0" }}>{a.algorithm}</span>
              <div style={{ background: "#2d3748", borderRadius: 4, height: 20, overflow: "hidden" }}>
                <div style={{ height: 20, borderRadius: 4, background: a.algorithm === search.winner ? "#10b981" : "#4f46e5", width: `${(a.time_ms / maxTime) * 100}%`, minWidth: "4px", transition: "width 1s" }}></div>
              </div>
              <span style={{ fontSize: 12, color: "#718096" }}>{a.time_ms}ms</span>
              <span>{a.algorithm === search.winner ? <span className="badge badge-pass">🏆 Winner</span> : <span style={{ fontSize: 12, color: "#718096" }}>{a.nodes_visited} nodes</span>}</span>
            </div>
          ))}
          <div style={{ marginTop: 14, padding: "10px 14px", background: "#0f1117", borderRadius: 8, fontSize: 13, color: "#718096" }}>
            <strong style={{ color: "#a5b4fc" }}>Traversal order (A*):</strong> {search.astar?.traversal_order?.join(" → ")}
          </div>
          <p style={{ fontSize: 12, color: "#718096", marginTop: 10 }}>{search.astar?.explanation}</p>
        </div>
      )}

      {activeTab === "constraints" && (
        <>
          <div className="card">
            <div className="section-label">CO3 — Constraint violation report</div>
            {(csp.violation_report || []).map(r => (
              <div key={r.alternative} style={{ marginBottom: 14, padding: "10px 14px", background: "#0f1117", borderRadius: 8, border: `1px solid ${r.passed ? "#065f46" : "#7f1d1d"}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{r.alternative}</span>
                  <span className={r.passed ? "badge badge-pass" : "badge badge-fail"}>{r.status}</span>
                </div>
                {r.checks?.map((c, i) => (
                  <div key={i} style={{ fontSize: 12, color: "#718096", marginBottom: 3, display: "flex", gap: 6 }}>
                    <span>{c.status === "passed" ? "✅" : "❌"}</span>
                    <span>{c.reason}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div className="card">
            <div className="section-label">CO3 — Backtracking trace</div>
            {(csp.backtrack_result?.backtrack_trace || []).map((step, i) => (
              <div key={i} style={{ fontSize: 13, color: step.includes("✅") ? "#6ee7b7" : step.includes("❌") ? "#fca5a5" : "#718096", padding: "4px 0", borderBottom: "1px solid #1e2535" }}>
                {step}
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === "sensitivity" && (
        <>
          {co4.sensitivity?.summary && (
            <div className="warning-box">⚠️ {co4.sensitivity.summary}</div>
          )}
          <div className="card">
            <div className="section-label">CO4 — Sensitivity analysis — flip points</div>
            <p style={{ fontSize: 13, color: "#718096", marginBottom: 12 }}>How much each criteria weight would need to change to flip the result.</p>
            {sensitivity.map(s => (
              <div key={s.criteria} className="sens-row">
                <span style={{ minWidth: 130, color: "#cbd5e0" }}>{s.criteria.replace(/_/g, " ")}</span>
                <div className="sens-wrap">
                  <div className="sens-fill" style={{ width: `${Math.min(s.current_weight_pct, 100)}%` }}></div>
                </div>
                <span style={{ minWidth: 38, color: "#a5b4fc" }}>{s.current_weight_pct}%</span>
                <span style={{ fontSize: 12, color: s.flip_change_pct < 20 ? "#ef4444" : "#718096", minWidth: 80, textAlign: "right" }}>
                  flip: {s.flip_change_pct}%
                </span>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="section-label">CO4 — Minimax decision tree ({minimax.tree_nodes?.length || 0} nodes explored)</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {(minimax.tree_nodes || []).map((n, i) => (
                <div key={i} style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${n.selected ? "#10b981" : "#2d3748"}`, background: n.selected ? "#064e3b" : "#0f1117", fontSize: 12 }}>
                  <div style={{ fontWeight: 600, color: n.selected ? "#6ee7b7" : "#cbd5e0" }}>{n.name}</div>
                  <div style={{ color: "#718096" }}>{n.player} · {n.score}</div>
                  {n.selected && <div style={{ color: "#10b981", fontSize: 11 }}>✓ Selected</div>}
                </div>
              ))}
            </div>
            <p style={{ fontSize: 12, color: "#718096", marginTop: 10 }}>{minimax.explanation}</p>
          </div>

          <div className="card">
            <div className="section-label">CO4 — Confidence ranking</div>
            {(confidence.ranking || []).map((r, i) => (
              <div key={r.name} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <span style={{ minWidth: 24, fontSize: 13, color: "#718096" }}>#{i + 1}</span>
                <span style={{ flex: 1, fontSize: 13 }}>{r.name}</span>
                <div style={{ flex: 2, background: "#2d3748", borderRadius: 4, height: 16, overflow: "hidden" }}>
                  <div style={{ height: 16, background: i === 0 ? "#10b981" : "#4f46e5", width: `${r.score * 10}%`, transition: "width 1s" }}></div>
                </div>
                <span style={{ minWidth: 36, fontSize: 13, fontWeight: 600, color: i === 0 ? "#10b981" : "#a5b4fc" }}>{r.score}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === "trace" && (
        <div className="card">
          <div className="section-label">Full AI reasoning trace</div>
          {trace.map((step, i) => (
            <div key={i} className="trace-item">
              <span style={{ fontSize: 16 }}>{step.includes("✅") ? "✅" : step.includes("🏆") ? "🏆" : "→"}</span>
              <span>{step.replace("✅ ", "").replace("🏆 ", "")}</span>
            </div>
          ))}

          <div style={{ marginTop: 16 }}>
            <div className="section-label">CO1 — State space summary</div>
            <div className="grid-2" style={{ gap: 8 }}>
              {[
                ["Total states", stateSpace.total_states],
                ["Total criteria", stateSpace.total_criteria],
                ["Transitions", stateSpace.transitions],
                ["Goal", stateSpace.goal],
              ].map(([k, v]) => (
                <div key={k} style={{ background: "#0f1117", padding: "8px 12px", borderRadius: 8, border: "1px solid #2d3748" }}>
                  <div style={{ fontSize: 11, color: "#718096" }}>{k}</div>
                  <div style={{ fontSize: 13, color: "#cbd5e0", marginTop: 2 }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
        <button className="btn-secondary" style={{ flex: 1 }} onClick={onBack}>← Re-analyse</button>
        <button className="btn-primary" style={{ flex: 1, justifyContent: "center" }} onClick={() => alert("PDF export — connect backend endpoint to generate report!")}>
          📄 Download PDF Report
        </button>
      </div>
    </div>
  )
}