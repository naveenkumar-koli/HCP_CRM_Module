import { useRef, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setField, setForm, resetForm, setSaving } from "./interactionSlice";
import {
  addMessage,
  setLoading,
  setSummary,
  setFollowupSuggestion,
  setSentimentAnalysis,
} from "./aiSlice";

const API = "http://127.0.0.1:8000";

/* ─────────────────────────────────────────
   Color Themes
───────────────────────────────────────── */
const LIGHT = {
  bg: "#F0F4FF",
  card: "#FFFFFF",
  border: "#DDE3F0",
  primary: "#2563EB",
  primaryDark: "#1D4ED8",
  primaryLight: "#EFF6FF",
  text: "#0F172A",
  muted: "#64748B",
  success: "#059669",
  successBg: "#ECFDF5",
  successBorder: "#A7F3D0",
  warning: "#D97706",
  warningBg: "#FFFBEB",
  warningBorder: "#FCD34D",
  negative: "#DC2626",
  negativeBg: "#FEF2F2",
  aiMsg: "#EFF6FF",
  userMsg: "#F1F5F9",
  navBg: "#1E3A8A",
  inputBg: "#FAFBFF",
  tableAlt: "#FAFBFF",
  statBg: "#FFFFFF",
};

const DARK = {
  bg: "#0F172A",
  card: "#1E293B",
  border: "#334155",
  primary: "#3B82F6",
  primaryDark: "#2563EB",
  primaryLight: "#1E3A5F",
  text: "#F1F5F9",
  muted: "#94A3B8",
  success: "#10B981",
  successBg: "#064E3B",
  successBorder: "#065F46",
  warning: "#F59E0B",
  warningBg: "#1C1002",
  warningBorder: "#92400E",
  negative: "#EF4444",
  negativeBg: "#450A0A",
  aiMsg: "#1E3A5F",
  userMsg: "#334155",
  navBg: "#020617",
  inputBg: "#0F172A",
  tableAlt: "#162033",
  statBg: "#1E293B",
};

/* ─────────────────────────────────────────
   Shared Input Components
───────────────────────────────────────── */
const Label = ({ children, C }) => (
  <div style={{
    fontWeight: 600, fontSize: 12, marginBottom: 5,
    color: C.muted, textTransform: "uppercase", letterSpacing: "0.05em",
  }}>
    {children}
  </div>
);

const makeInputStyle = (C) => ({
  width: "100%", padding: "9px 12px",
  border: "1.5px solid " + C.border, borderRadius: 8,
  fontFamily: "Inter, sans-serif", fontSize: 14,
  color: C.text, background: C.inputBg,
  boxSizing: "border-box", outline: "none",
  transition: "border-color 0.15s",
});

const Input = ({ C, ...p }) => <input {...p} style={makeInputStyle(C)} />;
const Select = ({ C, ...p }) => <select {...p} style={makeInputStyle(C)} />;
const Textarea = ({ C, ...p }) => (
  <textarea {...p} style={{ ...makeInputStyle(C), minHeight: 80, resize: "vertical" }} />
);

/* ─────────────────────────────────────────
   Sentiment Badge
───────────────────────────────────────── */
function SentimentBadge({ value, C }) {
  const map = {
    Positive: { bg: C.successBg, color: C.success, icon: "😊" },
    Neutral:  { bg: C.card,      color: C.muted,   icon: "😐" },
    Negative: { bg: C.negativeBg, color: C.negative, icon: "😟" },
  };
  const s = map[value] || map["Neutral"];
  return (
    <span style={{
      background: s.bg, color: s.color,
      borderRadius: 20, padding: "2px 10px",
      fontSize: 12, fontWeight: 600,
    }}>
      {s.icon} {value}
    </span>
  );
}

/* ─────────────────────────────────────────
   AI Panel
───────────────────────────────────────── */
function AiPanel({ C }) {
  const dispatch = useDispatch();
  const { messages, loading, summary, followupSuggestion } = useSelector((s) => s.ai);
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!input.trim()) return;
    const msg = input.trim();
    setInput("");
    dispatch(addMessage({ role: "user", text: msg }));
    dispatch(setLoading(true));
    try {
      const res = await fetch(API + "/ai_chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg }),
      });
      const data = await res.json();
      if (data.interaction) {
        dispatch(setForm(data.interaction));
        dispatch(addMessage({ role: "ai", text: "✅ Form filled from your description." }));
      }
      if (data.summary) dispatch(setSummary(data.summary));
      if (data.sentiment_analysis) {
        dispatch(setSentimentAnalysis(data.sentiment_analysis));
        const sa = data.sentiment_analysis;
        dispatch(addMessage({
          role: "ai",
          text: `🧠 Sentiment: ${sa.overall_sentiment} (${Math.round((sa.confidence || 0) * 100)}% confidence) — Engagement: ${sa.engagement_level}`,
        }));
      }
      if (data.followup_suggestion) dispatch(setFollowupSuggestion(data.followup_suggestion));
      if (data.error) dispatch(addMessage({ role: "ai", text: "❌ " + (data.details || data.error) }));
    } catch {
      dispatch(addMessage({ role: "ai", text: "❌ Backend not reachable. Is uvicorn running?" }));
    }
    dispatch(setLoading(false));
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  return (
    <div style={{
      background: C.card, border: "1.5px solid " + C.border,
      borderRadius: 14, padding: 20,
      display: "flex", flexDirection: "column", gap: 12,
      height: "100%", boxSizing: "border-box",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{
          background: C.primary, borderRadius: 10,
          width: 36, height: 36,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18,
        }}>🤖</div>
        <div style={{ fontWeight: 700, fontSize: 15, color: C.text }}>AI Assistant</div>
      </div>

      {/* Tip */}
      <div style={{
        background: C.primaryLight, border: "1px solid " + C.border,
        borderRadius: 8, padding: "8px 12px", fontSize: 12, color: C.primary,
      }}>
        💡 Describe the visit in plain English — the AI fills the form automatically.
      </div>

      {/* Messages */}
      <div style={{
        flex: 1, overflowY: "auto",
        display: "flex", flexDirection: "column", gap: 8,
        minHeight: 180, maxHeight: 240,
      }}>
        {messages.map((m, i) => (
          <div key={i} style={{
            background: m.role === "ai" ? C.aiMsg : C.userMsg,
            borderRadius: 10, padding: "8px 12px", fontSize: 13,
            color: C.text, alignSelf: m.role === "ai" ? "flex-start" : "flex-end",
            maxWidth: "90%",
          }}>
            <span style={{ fontWeight: 600, color: m.role === "ai" ? C.primary : C.muted }}>
              {m.role === "ai" ? "AI" : "You"}:{" "}
            </span>
            {m.text}
          </div>
        ))}
        {loading && (
          <div style={{
            background: C.aiMsg, borderRadius: 10,
            padding: "8px 12px", fontSize: 13, color: C.muted, alignSelf: "flex-start",
          }}>
            <span style={{ fontWeight: 600, color: C.primary }}>AI: </span>⏳ Thinking...
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <textarea
        placeholder="e.g. Met Dr. Sharma today, discussed Product X efficacy, shared brochure, doctor seemed very interested..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKey}
        style={{
          ...makeInputStyle(C), minHeight: 70, resize: "none", fontSize: 13,
        }}
      />

      <button id="ai-log-btn" onClick={send} disabled={loading} style={{
        padding: "10px", background: loading ? C.muted : C.primary,
        color: "#fff", border: "none", borderRadius: 8,
        fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 14,
        cursor: loading ? "not-allowed" : "pointer", transition: "background 0.2s",
      }}>
        {loading ? "⏳ Thinking..." : "🤖 AI Log (Enter)"}
      </button>

      {/* Summary Card */}
      {summary && (
        <div style={{
          background: C.successBg, border: "1px solid " + C.successBorder,
          borderRadius: 10, padding: "10px 14px", fontSize: 13,
        }}>
          <div style={{ fontWeight: 700, color: C.success, marginBottom: 4 }}>📋 AI Summary</div>
          <div style={{ color: C.text, lineHeight: 1.5 }}>{summary}</div>
        </div>
      )}

      {/* Follow-up Card */}
      {followupSuggestion && (
        <div style={{
          background: C.warningBg, border: "1px solid " + C.warningBorder,
          borderRadius: 10, padding: "10px 14px", fontSize: 13,
        }}>
          <div style={{
            fontWeight: 700, color: C.warning, marginBottom: 6,
            display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span>🎯 Follow-up Suggestions</span>
            {followupSuggestion.priority && (
              <span style={{
                fontSize: 11, background: C.warningBg,
                border: "1px solid " + C.warningBorder, borderRadius: 20,
                padding: "1px 8px", color: C.warning,
              }}>
                {followupSuggestion.priority} Priority
              </span>
            )}
          </div>
          <ul style={{ margin: 0, paddingLeft: 16, color: C.text, lineHeight: 1.7 }}>
            {Array.isArray(followupSuggestion.suggestions)
              ? followupSuggestion.suggestions.map((s, i) => <li key={i}>{s}</li>)
              : <li>{String(followupSuggestion.suggestions || "")}</li>
            }
          </ul>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   Interaction History Tab
───────────────────────────────────────── */
function HistoryTab({ C }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHistory = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch(API + "/interactions");
      const data = await res.json();
      setRecords(Array.isArray(data) ? data.reverse() : []);
    } catch {
      setError("Could not fetch history. Is the backend running?");
    }
    setLoading(false);
  };

  useEffect(() => { fetchHistory(); }, []);

  const thStyle = {
    padding: "10px 14px", textAlign: "left",
    fontSize: 11, fontWeight: 700, color: C.muted,
    textTransform: "uppercase", letterSpacing: "0.06em",
    borderBottom: "2px solid " + C.border, whiteSpace: "nowrap",
    background: C.card,
  };
  const tdStyle = {
    padding: "12px 14px", fontSize: 13, color: C.text,
    borderBottom: "1px solid " + C.border, verticalAlign: "top",
  };

  if (loading) return (
    <div style={{ textAlign: "center", padding: 60, color: C.muted, fontSize: 15 }}>
      ⏳ Loading interaction history...
    </div>
  );
  if (error) return (
    <div style={{ textAlign: "center", padding: 60, color: C.negative, fontSize: 15 }}>
      ❌ {error}
    </div>
  );
  if (records.length === 0) return (
    <div style={{ textAlign: "center", padding: 60, color: C.muted, fontSize: 15 }}>
      📭 No interactions logged yet. Use the Log tab to add one!
    </div>
  );

  return (
    <div>
      {/* Stats Row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 20 }}>
        {[
          { label: "Total Interactions", value: records.length, icon: "📊" },
          { label: "Unique HCPs", value: new Set(records.map((r) => r.hcp_name)).size, icon: "👨‍⚕️" },
          { label: "Positive Sentiments", value: records.filter((r) => r.sentiment === "Positive").length, icon: "😊" },
        ].map((stat) => (
          <div key={stat.label} style={{
            background: C.statBg, border: "1.5px solid " + C.border,
            borderRadius: 12, padding: "16px 20px",
          }}>
            <div style={{ fontSize: 22 }}>{stat.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: C.primary, lineHeight: 1.2 }}>{stat.value}</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Refresh */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
        <button id="refresh-history-btn" onClick={fetchHistory} style={{
          padding: "7px 16px", background: C.primaryLight,
          color: C.primary, border: "1.5px solid " + C.border,
          borderRadius: 8, fontFamily: "Inter, sans-serif",
          fontWeight: 600, fontSize: 13, cursor: "pointer",
        }}>
          🔄 Refresh
        </button>
      </div>

      {/* Table */}
      <div style={{
        background: C.card, border: "1.5px solid " + C.border,
        borderRadius: 14, overflow: "hidden",
      }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["#", "HCP Name", "Type", "Date", "Sentiment", "Topics Discussed", "Follow-up Actions"].map(h => (
                <th key={h} style={thStyle}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {records.map((r, i) => (
              <tr key={r.id} style={{ background: i % 2 === 0 ? C.tableAlt : C.card }}>
                <td style={{ ...tdStyle, color: C.muted, fontWeight: 600 }}>{records.length - i}</td>
                <td style={{ ...tdStyle, fontWeight: 600 }}>{r.hcp_name || "—"}</td>
                <td style={tdStyle}>
                  <span style={{
                    background: C.primaryLight, color: C.primary,
                    borderRadius: 20, padding: "2px 9px", fontSize: 12, fontWeight: 600,
                  }}>
                    {r.interaction_type || "Meeting"}
                  </span>
                </td>
                <td style={{ ...tdStyle, whiteSpace: "nowrap", color: C.muted }}>{r.date || "—"}</td>
                <td style={tdStyle}><SentimentBadge value={r.sentiment || "Neutral"} C={C} /></td>
                <td style={{ ...tdStyle, maxWidth: 240 }}>
                  <div style={{
                    overflow: "hidden", textOverflow: "ellipsis",
                    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                  }}>
                    {r.topics_discussed || "—"}
                  </div>
                </td>
                <td style={{ ...tdStyle, maxWidth: 200 }}>
                  <div style={{
                    overflow: "hidden", textOverflow: "ellipsis",
                    display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                    color: C.muted,
                  }}>
                    {r.followup_actions || r.summary || "—"}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Main App
───────────────────────────────────────── */
export default function App() {
  const dispatch = useDispatch();
  const form = useSelector((s) => s.interaction.form);
  const saving = useSelector((s) => s.interaction.saving);
  const [activeTab, setActiveTab] = useState("log");
  const [saveSuccess, setSaveSuccessLocal] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });

  const C = darkMode ? DARK : LIGHT;

  const toggleDark = () => {
    setDarkMode((prev) => {
      localStorage.setItem("darkMode", String(!prev));
      return !prev;
    });
  };

  const set = (k, v) => dispatch(setField({ key: k, value: v }));

  const save = async () => {
    dispatch(setSaving(true));
    try {
      await fetch(API + "/log_interaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      dispatch(resetForm());
      setSaveSuccessLocal(true);
      setTimeout(() => setSaveSuccessLocal(false), 3000);
    } catch {}
    dispatch(setSaving(false));
  };

  const tabStyle = (tab) => ({
    padding: "10px 22px", border: "none",
    borderBottom: activeTab === tab ? "3px solid #fff" : "3px solid transparent",
    background: "transparent",
    color: activeTab === tab ? "#fff" : "rgba(255,255,255,0.65)",
    fontFamily: "Inter, sans-serif",
    fontWeight: activeTab === tab ? 700 : 500,
    fontSize: 14, cursor: "pointer", transition: "all 0.15s",
  });

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "Inter, sans-serif", color: C.text }}>

      {/* ── Top Nav ── */}
      <div style={{
        background: C.navBg, padding: "0 32px",
        display: "flex", alignItems: "center", gap: 32,
        boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
      }}>
        <div style={{ color: "#fff", fontWeight: 800, fontSize: 16, padding: "14px 0" }}>
          💊 AI CRM <span style={{ fontWeight: 400, opacity: 0.7 }}>· HCP Module</span>
        </div>

        <div style={{ display: "flex", gap: 4, flex: 1 }}>
          <button id="tab-log" style={tabStyle("log")} onClick={() => setActiveTab("log")}>
            📝 Log Interaction
          </button>
          <button id="tab-history" style={tabStyle("history")} onClick={() => setActiveTab("history")}>
            📋 History
          </button>
        </div>

        {/* Dark Mode Toggle */}
        <button
          id="dark-mode-toggle"
          onClick={toggleDark}
          title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          style={{
            background: "rgba(255,255,255,0.12)",
            border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: 8, padding: "6px 14px",
            color: "#fff", fontFamily: "Inter, sans-serif",
            fontWeight: 600, fontSize: 13, cursor: "pointer",
            display: "flex", alignItems: "center", gap: 6,
            transition: "background 0.2s",
          }}
        >
          {darkMode ? "☀️ Light" : "🌙 Dark"}
        </button>
      </div>

      {/* ── Page Content ── */}
      <div style={{ padding: "28px 32px", maxWidth: 1300, margin: "0 auto" }}>

        {/* ── LOG TAB ── */}
        {activeTab === "log" && (
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 400px",
            gap: 20, alignItems: "start",
          }}>
            {/* LEFT — Form */}
            <div style={{
              background: C.card, padding: 24, borderRadius: 14,
              border: "1.5px solid " + C.border,
            }}>
              <h2 style={{ margin: "0 0 20px", fontSize: 18, fontWeight: 700, color: C.text }}>
                Log HCP Interaction
              </h2>

              {saveSuccess && (
                <div style={{
                  background: C.successBg, border: "1px solid " + C.successBorder,
                  borderRadius: 8, padding: "10px 14px", marginBottom: 16,
                  color: C.success, fontWeight: 600, fontSize: 13,
                }}>
                  ✅ Interaction saved successfully!
                </div>
              )}

              <Label C={C}>HCP Name</Label>
              <Input C={C} id="hcp-name" placeholder="Search or enter doctor name..."
                value={form.hcp_name || ""} onChange={(e) => set("hcp_name", e.target.value)} />

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 14 }}>
                <div>
                  <Label C={C}>Interaction Type</Label>
                  <Select C={C} id="interaction-type"
                    value={form.interaction_type || "Meeting"}
                    onChange={(e) => set("interaction_type", e.target.value)}>
                    <option>Meeting</option>
                    <option>Call</option>
                    <option>Email</option>
                    <option>Conference</option>
                    <option>Visit</option>
                  </Select>
                </div>
                <div>
                  <Label C={C}>Date</Label>
                  <Input C={C} id="date" type="date"
                    value={form.date || ""} onChange={(e) => set("date", e.target.value)} />
                </div>
              </div>

              <div style={{ marginTop: 14 }}>
                <Label C={C}>Time</Label>
                <Input C={C} id="time" type="time"
                  value={form.time || ""} onChange={(e) => set("time", e.target.value)} />
              </div>

              <div style={{ marginTop: 14 }}>
                <Label C={C}>Attendees</Label>
                <Input C={C} id="attendees" placeholder="Enter names separated by commas..."
                  value={form.attendees || ""} onChange={(e) => set("attendees", e.target.value)} />
              </div>

              <div style={{ marginTop: 14 }}>
                <Label C={C}>Topics Discussed</Label>
                <Textarea C={C} id="topics-discussed"
                  placeholder="Key discussion points, products, questions raised..."
                  value={form.topics_discussed || ""}
                  onChange={(e) => set("topics_discussed", e.target.value)} />
              </div>

              <div style={{ marginTop: 14 }}>
                <Label C={C}>Materials Shared</Label>
                <Input C={C} id="materials-shared" placeholder="Brochure, clinical study, leaflet..."
                  value={form.materials_shared || ""}
                  onChange={(e) => set("materials_shared", e.target.value)} />
              </div>

              <div style={{ marginTop: 14 }}>
                <Label C={C}>Samples Distributed</Label>
                <Input C={C} id="samples-distributed" placeholder="Sample name and quantity..."
                  value={form.samples_distributed || ""}
                  onChange={(e) => set("samples_distributed", e.target.value)} />
              </div>

              <div style={{ marginTop: 14 }}>
                <Label C={C}>Observed HCP Sentiment</Label>
                <Select C={C} id="sentiment"
                  value={form.sentiment || "Neutral"}
                  onChange={(e) => set("sentiment", e.target.value)}>
                  <option>Positive</option>
                  <option>Neutral</option>
                  <option>Negative</option>
                </Select>
              </div>

              <div style={{ marginTop: 14 }}>
                <Label C={C}>Outcome</Label>
                <Textarea C={C} id="outcome"
                  placeholder="Key outcomes, agreements, doctor's decisions..."
                  value={form.outcome || ""}
                  onChange={(e) => set("outcome", e.target.value)} />
              </div>

              <div style={{ marginTop: 14 }}>
                <Label C={C}>Follow-up Actions</Label>
                <Textarea C={C} id="followup-actions"
                  placeholder="Next steps, scheduled follow-ups..."
                  value={form.followup_actions || ""}
                  onChange={(e) => set("followup_actions", e.target.value)} />
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                <button id="save-interaction-btn" onClick={save} style={{
                  flex: 1, padding: "11px", background: C.primary, color: "#fff",
                  border: "none", borderRadius: 8, fontFamily: "Inter, sans-serif",
                  fontWeight: 700, fontSize: 14, cursor: "pointer",
                }}>
                  {saving ? "💾 Saving..." : "💾 Save Interaction"}
                </button>
                <button id="reset-form-btn" onClick={() => dispatch(resetForm())} style={{
                  padding: "11px 18px", background: C.bg, color: C.muted,
                  border: "1.5px solid " + C.border, borderRadius: 8,
                  fontFamily: "Inter, sans-serif", fontWeight: 600, fontSize: 14, cursor: "pointer",
                }}>
                  🗑 Clear
                </button>
              </div>
            </div>

            {/* RIGHT — AI Panel */}
            <AiPanel C={C} />
          </div>
        )}

        {/* ── HISTORY TAB ── */}
        {activeTab === "history" && <HistoryTab C={C} />}
      </div>
    </div>
  );
}