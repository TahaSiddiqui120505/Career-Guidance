import { useState, useRef, useCallback, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Link } from "react-router-dom"
import axios from "axios"
import "./CoverLetter.css"
import {
  Sparkles, ArrowLeft, Copy, Download,
  CheckCircle, FileText, Clock, ChevronDown, ChevronUp,
  Edit3, Wand2, User, Building2, Briefcase, AlignLeft,
  Globe, Mail
} from "lucide-react"

const TONES = [
  { id: "professional",  label: "Professional", desc: "Formal & polished"  },
  { id: "confident",     label: "Confident",    desc: "Bold & assertive"   },
  { id: "enthusiastic",  label: "Enthusiastic", desc: "Energetic & keen"   },
  { id: "concise",       label: "Concise",      desc: "Short & sharp"      },
  { id: "creative",      label: "Creative",     desc: "Story-driven hook"  },
]

const STYLES = [
  { id: "modern",    label: "Modern"    },
  { id: "classic",   label: "Classic"   },
  { id: "minimal",   label: "Minimal"   },
  { id: "executive", label: "Executive" },
  { id: "startup",   label: "Startup"   },
]

const SHEET_STYLES = {
  modern:    { wrap: { fontFamily: "Georgia, serif", padding: "52px 56px", background: "#fff", color: "#1a1a2e" }, header: { borderBottom: "3px solid #7c6ffa", paddingBottom: 18, marginBottom: 26 }, name: { fontSize: 22, fontWeight: 700, color: "#7c6ffa", letterSpacing: -0.5 }, contact: { fontSize: 12.5, color: "#555", marginTop: 5 }, body: { fontSize: 14.5, lineHeight: 2, color: "#2a2a3e" }, date: { fontSize: 13, color: "#888", marginBottom: 18 }, addr: { fontSize: 13.5, color: "#333", marginBottom: 22 } },
  classic:   { wrap: { fontFamily: "Times New Roman, serif", padding: "56px 60px", background: "#fffef8", color: "#1a1a1a" }, header: { borderBottom: "1px solid #333", paddingBottom: 14, marginBottom: 28 }, name: { fontSize: 20, fontWeight: 700, color: "#111", letterSpacing: 0.5, textTransform: "uppercase" }, contact: { fontSize: 12, color: "#555", marginTop: 5 }, body: { fontSize: 14, lineHeight: 1.95, color: "#222" }, date: { fontSize: 13, color: "#888", marginBottom: 16 }, addr: { fontSize: 13, color: "#333", marginBottom: 20 } },
  minimal:   { wrap: { fontFamily: "'DM Sans', sans-serif", padding: "60px 64px", background: "#fafafa", color: "#222" }, header: { marginBottom: 34 }, name: { fontSize: 18, fontWeight: 600, color: "#555", letterSpacing: 1, textTransform: "uppercase" }, contact: { fontSize: 12, color: "#777", marginTop: 6 }, body: { fontSize: 14, lineHeight: 2.1, color: "#333" }, date: { fontSize: 12.5, color: "#999", marginBottom: 16 }, addr: { fontSize: 13, color: "#444", marginBottom: 22 } },
  executive: { wrap: { fontFamily: "Garamond, Georgia, serif", padding: "60px 64px", background: "#fff", color: "#1a1010", borderTop: "6px solid #c9a84c" }, header: { marginBottom: 30 }, name: { fontSize: 24, fontWeight: 700, color: "#c9a84c", letterSpacing: -0.3, fontStyle: "italic" }, contact: { fontSize: 12.5, color: "#666", marginTop: 6 }, body: { fontSize: 15, lineHeight: 2, color: "#2a2010" }, date: { fontSize: 13, color: "#999", marginBottom: 18 }, addr: { fontSize: 13.5, color: "#333", marginBottom: 22 } },
  startup:   { wrap: { fontFamily: "'DM Sans', sans-serif", padding: "48px 52px", background: "#0f172a", color: "#e2e8f0" }, header: { borderBottom: "1px solid #334155", paddingBottom: 16, marginBottom: 26 }, name: { fontSize: 20, fontWeight: 700, color: "#38bdf8", letterSpacing: -0.3 }, contact: { fontSize: 12.5, color: "#94a3b8", marginTop: 5 }, body: { fontSize: 14, lineHeight: 2, color: "#cbd5e1" }, date: { fontSize: 13, color: "#64748b", marginBottom: 16 }, addr: { fontSize: 13, color: "#94a3b8", marginBottom: 20 } },
}

const Field = ({ label, hint, icon: Icon, children }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      {Icon && <Icon size={13} color="#6b7280" />}
      <label style={{ fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.9, color: "#6b7280", fontFamily: "'DM Sans',sans-serif" }}>{label}</label>
    </div>
    {hint && <p style={{ fontSize: 12, color: "#4a5070", margin: 0, lineHeight: 1.4, fontFamily: "'DM Sans',sans-serif" }}>{hint}</p>}
    {children}
  </div>
)

const wordCount = (s) => s.trim() ? s.trim().split(/\s+/).length : 0

const EditablePara = ({ text, style, onBlur }) => {
  const ref = useRef(null)
  useEffect(() => {
    if (ref.current && ref.current.innerText !== text) ref.current.innerText = text
  }, [text])
  return (
    <span ref={ref} contentEditable suppressContentEditableWarning className="cl-para"
      style={{ ...style, display: "block" }}
      onBlur={e => onBlur && onBlur(e.currentTarget.innerText)} />
  )
}

export default function CoverLetter() {
  const [fullName,       setFullName]       = useState("")
  const [email,          setEmail]          = useState("")
  const [phone,          setPhone]          = useState("")
  const [linkedin,       setLinkedin]       = useState("")
  const [hiringManager,  setHiringManager]  = useState("")
  const [jobRole,        setJobRole]        = useState("")
  const [companyName,    setCompanyName]    = useState("")
  const [industry,       setIndustry]       = useState("")
  const [jobDescription, setJobDescription] = useState("")
  const [userBackground, setUserBackground] = useState("")
  const [keyAchievement, setKeyAchievement] = useState("")
  const [tone,           setTone]           = useState("professional")
  const [letterStyle,    setLetterStyle]    = useState("modern")
  const [activeTab,      setActiveTab]      = useState("basics")
  const [paragraphs,     setParagraphs]     = useState([])
  const [loading,        setLoading]        = useState(false)
  const [history,        setHistory]        = useState([])
  const [showHist,       setShowHist]       = useState(false)
  const [toast,          setToast]          = useState("")
  const [copied,         setCopied]         = useState(false)

  const sheetRef  = useRef(null)
  const showToast = useCallback((msg) => { setToast(msg); setTimeout(() => setToast(""), 3200) }, [])
  const fullText  = paragraphs.join("\n\n")
  const hasResult = paragraphs.length > 0

  const generate = async () => {
    if (!jobRole.trim() || !industry.trim()) { showToast("Job Role and Industry are required."); return }
    setLoading(true)
    try {
      const res = await axios.post(`${(process.env.REACT_APP_API_URL || "http://127.0.0.1:8000").replace(/\/+$/, "")}/cover-letter/generate`, {
        full_name: fullName, email, phone, linkedin,
        hiring_manager: hiringManager, job_role: jobRole,
        company_name: companyName, industry,
        job_description: jobDescription, user_background: userBackground,
        key_achievement: keyAchievement, tone, letter_style: letterStyle,
      })
      const content = res.data.content || ""
      if (paragraphs.length) setHistory(h => [{ paras: [...paragraphs], ts: new Date().toLocaleTimeString() }, ...h.slice(0, 4)])
      setParagraphs(content.split(/\n{2,}/).map(p => p.trim()).filter(Boolean))
      showToast("✦ Generated! Click any paragraph to edit directly.")
    } catch (err) {
      console.error(err)
      showToast("Failed — is the backend running?")
    } finally { setLoading(false) }
  }

  const updatePara  = (i, text) => setParagraphs(prev => { const n = [...prev]; n[i] = text; return n })
  const copyText    = () => { navigator.clipboard.writeText(fullText); setCopied(true); setTimeout(() => setCopied(false), 2000); showToast("Copied!") }

  const downloadPDF = async () => {
    if (!hasResult) return
    try {
      const html2pdf = (await import("html2pdf.js")).default
      html2pdf().set({
        margin: [10, 12],
        filename: `${fullName || "cover-letter"}-${companyName || jobRole}.pdf`.replace(/\s+/g, "-"),
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      }).from(sheetRef.current).save()
      showToast("Downloading PDF…")
    } catch { showToast("PDF error — try TXT.") }
  }

  const downloadTxt = () => {
    const a = document.createElement("a")
    a.href = URL.createObjectURL(new Blob([fullText], { type: "text/plain" }))
    a.download = `${fullName || "cover-letter"}.txt`; a.click()
    showToast("Downloading TXT…")
  }

  const st = SHEET_STYLES[letterStyle]

  return (
    <div style={S.page}>
      <AnimatePresence>
        {toast && (
          <motion.div style={S.toast} initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <CheckCircle size={14} color="#34d5c8" style={{ marginRight: 7, flexShrink: 0 }} />{toast}
          </motion.div>
        )}
      </AnimatePresence>

      <header style={S.topbar}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link to="/dashboard" style={{ textDecoration: "none" }}>
            <button style={S.backBtn}><ArrowLeft size={14} style={{ marginRight: 5 }} />Dashboard</button>
          </Link>
          <div style={S.divider} />
          <div style={S.logoMark}>S</div>
          <span style={S.logoText}>Cover Letter Studio</span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {hasResult && <>
            <button style={S.topBtn} onClick={copyText}><Copy size={13} />{copied ? "Copied!" : "Copy"}</button>
            <button style={S.topBtn} onClick={downloadTxt}><FileText size={13} />TXT</button>
            <motion.button style={{ ...S.topBtn, ...S.topBtnAccent }} onClick={downloadPDF} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
              <Download size={13} />Download PDF
            </motion.button>
          </>}
        </div>
      </header>

      <div style={S.layout}>
        <aside style={S.left}>
          <div style={S.tabs}>
            {["basics", "details", "style"].map(t => (
              <button key={t} style={{ ...S.tab, ...(activeTab === t ? S.tabActive : {}) }} onClick={() => setActiveTab(t)}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          <div style={S.fields}>
            {activeTab === "basics" && <>
              <div style={S.sh}>About You</div>
              <Field label="Full Name" icon={User}><input className="cl-inp" placeholder="e.g. Divit Shah" value={fullName} onChange={e => setFullName(e.target.value)} /></Field>
              <Field label="Email" icon={Mail}><input className="cl-inp" type="email" placeholder="you@email.com" value={email} onChange={e => setEmail(e.target.value)} /></Field>
              <Field label="Phone"><input className="cl-inp" placeholder="+91 98765 43210" value={phone} onChange={e => setPhone(e.target.value)} /></Field>
              <Field label="LinkedIn / Portfolio" icon={Globe}><input className="cl-inp" placeholder="linkedin.com/in/yourname" value={linkedin} onChange={e => setLinkedin(e.target.value)} /></Field>
              <div style={{ ...S.sh, marginTop: 6 }}>The Role</div>
              <Field label="Job Role *" icon={Briefcase} hint="Required — be specific"><input className="cl-inp" placeholder="e.g. Investment Banking Analyst" value={jobRole} onChange={e => setJobRole(e.target.value)} /></Field>
              <Field label="Company Name" icon={Building2}><input className="cl-inp" placeholder="e.g. Goldman Sachs" value={companyName} onChange={e => setCompanyName(e.target.value)} /></Field>
              <Field label="Industry *" hint="Required"><input className="cl-inp" placeholder="e.g. Finance, Tech, Healthcare" value={industry} onChange={e => setIndustry(e.target.value)} /></Field>
              <Field label="Hiring Manager Name" icon={User} hint="Personalises the salutation"><input className="cl-inp" placeholder="Ms. Priya Mehta (optional)" value={hiringManager} onChange={e => setHiringManager(e.target.value)} /></Field>
            </>}

            {activeTab === "details" && <>
              <div style={S.sh}>Your Content</div>
              <Field label="Your Background" icon={User} hint="2–4 sentences about your experience & strengths">
                <textarea className="cl-inp cl-ta" rows={5} placeholder="CFA Level I candidate with 2 years of equity research..." value={userBackground} onChange={e => setUserBackground(e.target.value)} />
                <div style={S.wc}>{wordCount(userBackground)} words</div>
              </Field>
              <Field label="Key Achievement" hint="One result with numbers — makes you memorable">
                <textarea className="cl-inp cl-ta" rows={3} placeholder="Built a DCF model that identified 30% undervaluation…" value={keyAchievement} onChange={e => setKeyAchievement(e.target.value)} />
              </Field>
              <Field label="Job Description" icon={AlignLeft} hint="Paste the full JD for maximum personalisation">
                <textarea className="cl-inp cl-ta" rows={7} placeholder="Paste the job description here..." value={jobDescription} onChange={e => setJobDescription(e.target.value)} />
                <div style={S.wc}>{wordCount(jobDescription)} words pasted</div>
              </Field>
            </>}

            {activeTab === "style" && <>
              <div style={S.sh}>Tone</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {TONES.map(t => (
                  <button key={t.id} onClick={() => setTone(t.id)}
                    style={{ padding: "11px 12px", background: tone === t.id ? "rgba(124,111,250,0.14)" : "rgba(255,255,255,0.03)", border: `1.5px solid ${tone === t.id ? "#7c6ffa" : "#2a2d42"}`, borderRadius: 10, cursor: "pointer", textAlign: "left" }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: tone === t.id ? "#a99dfc" : "#c0c8e0", fontFamily: "'DM Sans',sans-serif" }}>{t.label}</div>
                    <div style={{ fontSize: 11.5, color: "#5a6488", marginTop: 2, fontFamily: "'DM Sans',sans-serif" }}>{t.desc}</div>
                  </button>
                ))}
              </div>
              <div style={{ ...S.sh, marginTop: 14 }}>Letter Style</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {STYLES.map(s => (
                  <button key={s.id} onClick={() => setLetterStyle(s.id)}
                    style={{ padding: "8px 16px", background: letterStyle === s.id ? "rgba(52,213,200,0.1)" : "rgba(255,255,255,0.03)", border: `1.5px solid ${letterStyle === s.id ? "#34d5c8" : "#2a2d42"}`, borderRadius: 20, color: letterStyle === s.id ? "#34d5c8" : "#7a8096", fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", fontWeight: letterStyle === s.id ? 600 : 400 }}>
                    {s.label}
                  </button>
                ))}
              </div>
              {hasResult && (
                <div style={{ marginTop: 10, padding: "11px 13px", background: "rgba(52,213,200,0.05)", border: "1px solid rgba(52,213,200,0.15)", borderRadius: 10 }}>
                  <p style={{ fontSize: 12.5, color: "#34d5c8", margin: 0, fontFamily: "'DM Sans',sans-serif" }}>✦ Style changes update the letter design instantly.</p>
                </div>
              )}
            </>}
          </div>

          <div style={S.genWrap}>
            {hasResult && (
              <div style={{ padding: "9px 12px", background: "rgba(124,111,250,0.07)", border: "1px solid rgba(124,111,250,0.18)", borderRadius: 9 }}>
                <p style={{ fontSize: 12.5, color: "#9d94fb", margin: 0, fontFamily: "'DM Sans',sans-serif" }}>✦ Click any paragraph in the preview to edit it directly</p>
              </div>
            )}
            <motion.button style={{ ...S.btnGen, opacity: loading ? 0.7 : 1 }} onClick={generate} disabled={loading}
              whileHover={!loading ? { scale: 1.02 } : {}} whileTap={{ scale: 0.97 }}>
              {loading ? <><span style={S.spinner} />Generating…</> : <><Wand2 size={16} />{hasResult ? "Regenerate" : "Generate Cover Letter"}</>}
            </motion.button>
            {hasResult && history.length > 0 && (
              <button style={S.btnHist} onClick={() => setShowHist(h => !h)}>
                <Clock size={12} style={{ marginRight: 5 }} />
                Version History ({history.length}) {showHist ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
              </button>
            )}
          </div>
        </aside>

        <section style={S.right}>
          {!hasResult ? (
            <motion.div style={S.empty} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div style={S.emptyIcon}><Sparkles size={34} color="#7c6ffa" /></div>
              <h3 style={S.emptyTitle}>Your cover letter will appear here</h3>
              <p style={S.emptySub}>Fill in your details and click <strong style={{ color: "#7c6ffa" }}>Generate</strong></p>
              <div style={S.emptySteps}>
                {["Fill Basics — role & company", "Add Details — background & JD", "Pick a Style & Tone", "Hit Generate ✦"].map((s, i) => (
                  <div key={i} style={S.emptyStep}><span style={S.stepNum}>{i + 1}</span>{s}</div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14 }} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
              <div style={S.toolbar}>
                <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                  <span style={S.toolLabel}>{STYLES.find(s => s.id === letterStyle)?.label} · {TONES.find(t => t.id === tone)?.label}</span>
                  <span style={S.wordBadge}>{wordCount(fullText)} words</span>
                  <span style={S.editHint}><Edit3 size={11} style={{ marginRight: 4 }} />Click paragraph to edit</span>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button style={S.toolBtn} onClick={copyText}><Copy size={12} />{copied ? "Copied!" : "Copy"}</button>
                  <button style={S.toolBtn} onClick={downloadTxt}><FileText size={12} />TXT</button>
                  <button style={{ ...S.toolBtn, ...S.toolBtnAccent }} onClick={downloadPDF}><Download size={12} />PDF</button>
                </div>
              </div>

              <AnimatePresence>
                {showHist && (
                  <motion.div style={S.histBox} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <div style={S.histTitle}>Version History — click Restore to go back</div>
                    {history.map((v, i) => (
                      <div key={i} style={S.histRow}>
                        <span style={{ fontSize: 12.5, color: "#6b7280", fontFamily: "'DM Sans',sans-serif" }}>v{history.length - i} — saved {v.ts}</span>
                        <button style={S.histBtn} onClick={() => { setParagraphs(v.paras); setShowHist(false); showToast("Version restored!") }}>Restore</button>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              <div style={S.sheetWrap}>
                <div ref={sheetRef} style={st.wrap}>
                  <div style={st.header}>
                    <div style={st.name}>{fullName || "Your Name"}</div>
                    <div style={{ ...st.contact, display: "flex", gap: 16, flexWrap: "wrap" }}>
                      {email    && <span>{email}</span>}
                      {phone    && <span>{phone}</span>}
                      {linkedin && <span>{linkedin}</span>}
                    </div>
                  </div>
                  <div style={st.date}>{new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</div>
                  {(hiringManager || companyName) && (
                    <div style={st.addr}>
                      {hiringManager && <div style={{ fontWeight: 600 }}>{hiringManager}</div>}
                      {companyName   && <div>{companyName}</div>}
                      {industry      && <div style={{ opacity: 0.6 }}>{industry}</div>}
                    </div>
                  )}
                  <div style={st.body}>
                    {paragraphs.map((para, i) => (
                      <EditablePara key={i} text={para}
                        style={{ ...st.body, marginBottom: i < paragraphs.length - 1 ? "1.5em" : 0 }}
                        onBlur={(text) => updatePara(i, text)} />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </section>
      </div>
    </div>
  )
}

const S = {
  page:         { minHeight: "100vh", height: "100vh", background: "#080a12", color: "#dde1f0", fontFamily: "'DM Sans',sans-serif", display: "flex", flexDirection: "column", overflow: "hidden" },
  toast:        { position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)", background: "#13152a", border: "1px solid #2e3245", color: "#dde1f0", padding: "10px 22px", borderRadius: 30, fontSize: 13.5, zIndex: 9999, boxShadow: "0 8px 30px rgba(0,0,0,0.5)", display: "flex", alignItems: "center", whiteSpace: "nowrap" },
  topbar:       { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(8,10,18,0.95)", backdropFilter: "blur(14px)", zIndex: 10, flexShrink: 0 },
  backBtn:      { display: "flex", alignItems: "center", padding: "7px 14px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#9aa0b8", fontSize: 13.5, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", fontWeight: 500 },
  divider:      { width: 1, height: 22, background: "rgba(255,255,255,0.08)" },
  logoMark:     { width: 30, height: 30, borderRadius: 8, background: "linear-gradient(135deg,#7c6ffa,#34d5c8)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, color: "#fff" },
  logoText:     { fontFamily: "'Playfair Display',serif", fontSize: 17, fontWeight: 700, color: "#fff" },
  topBtn:       { display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#9aa0b8", fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", fontWeight: 500 },
  topBtnAccent: { background: "linear-gradient(135deg,#7c6ffa,#34d5c8)", border: "none", color: "#fff", fontWeight: 600 },
  layout:       { display: "flex", flex: 1, overflow: "hidden" },
  left:         { width: 380, minWidth: 340, background: "#0c0e1a", borderRight: "1px solid #1e2235", display: "flex", flexDirection: "column", overflowY: "auto", flexShrink: 0 },
  tabs:         { display: "flex", borderBottom: "1px solid #1e2235", flexShrink: 0 },
  tab:          { flex: 1, padding: "13px 0", background: "none", border: "none", borderBottom: "2px solid transparent", color: "#5a6488", fontSize: 13.5, fontWeight: 500, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", transition: "all .2s" },
  tabActive:    { color: "#7c6ffa", borderBottom: "2px solid #7c6ffa", fontWeight: 600 },
  fields:       { padding: "16px 18px", display: "flex", flexDirection: "column", gap: 15, flex: 1 },
  sh:           { fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.1, color: "#5a6488", fontFamily: "'DM Sans',sans-serif" },
  wc:           { fontSize: 11.5, color: "#4a5070", textAlign: "right", marginTop: 3, fontFamily: "'DM Sans',sans-serif" },
  genWrap:      { padding: "12px 18px 18px", borderTop: "1px solid #1e2235", display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 },
  btnGen:       { display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", padding: "13px", background: "linear-gradient(135deg,#5b4fd4,#7c6ffa)", border: "none", borderRadius: 10, color: "#fff", fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", boxShadow: "0 4px 20px rgba(124,111,250,0.3)" },
  btnHist:      { display: "flex", alignItems: "center", justifyContent: "center", gap: 4, padding: "8px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, color: "#5a6488", fontSize: 12.5, cursor: "pointer", fontFamily: "'DM Sans',sans-serif" },
  spinner:      { width: 13, height: 13, border: "2px solid rgba(255,255,255,0.25)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin .7s linear infinite", display: "inline-block", marginRight: 6 },
  right:        { flex: 1, overflowY: "auto", padding: "22px 26px", display: "flex", flexDirection: "column" },
  empty:        { flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: 12, paddingTop: 30 },
  emptyIcon:    { width: 70, height: 70, borderRadius: 18, background: "rgba(124,111,250,0.08)", border: "1px solid rgba(124,111,250,0.18)", display: "flex", alignItems: "center", justifyContent: "center" },
  emptyTitle:   { fontFamily: "'Playfair Display',serif", fontSize: 22, color: "#dde1f0", fontWeight: 700 },
  emptySub:     { fontSize: 14, color: "#5a6488", fontFamily: "'DM Sans',sans-serif" },
  emptySteps:   { display: "flex", flexDirection: "column", gap: 11, marginTop: 18, alignItems: "flex-start" },
  emptyStep:    { display: "flex", alignItems: "center", gap: 11, fontSize: 13.5, color: "#6b7280", fontFamily: "'DM Sans',sans-serif" },
  stepNum:      { width: 24, height: 24, borderRadius: "50%", background: "rgba(124,111,250,0.1)", border: "1px solid rgba(124,111,250,0.28)", color: "#7c6ffa", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 },
  toolbar:      { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 },
  toolLabel:    { fontSize: 12, color: "#5a6488", fontWeight: 500, fontFamily: "'DM Sans',sans-serif" },
  wordBadge:    { fontSize: 11.5, padding: "3px 10px", background: "rgba(52,213,200,0.07)", border: "1px solid rgba(52,213,200,0.18)", borderRadius: 20, color: "#34d5c8", fontFamily: "'DM Sans',sans-serif" },
  editHint:     { display: "flex", alignItems: "center", fontSize: 11.5, color: "#7c6ffa", padding: "3px 10px", background: "rgba(124,111,250,0.07)", border: "1px solid rgba(124,111,250,0.18)", borderRadius: 20, fontFamily: "'DM Sans',sans-serif" },
  toolBtn:      { display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 7, color: "#9aa0b8", fontSize: 12.5, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", fontWeight: 500 },
  toolBtnAccent:{ background: "linear-gradient(135deg,#7c6ffa,#34d5c8)", border: "none", color: "#fff", fontWeight: 600 },
  histBox:      { background: "#0d0f1e", border: "1px solid #1e2235", borderRadius: 10, padding: "13px 16px", display: "flex", flexDirection: "column", gap: 10 },
  histTitle:    { fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.9, color: "#5a6488", fontFamily: "'DM Sans',sans-serif" },
  histRow:      { display: "flex", justifyContent: "space-between", alignItems: "center" },
  histBtn:      { fontSize: 12.5, padding: "4px 12px", background: "rgba(124,111,250,0.1)", border: "1px solid rgba(124,111,250,0.22)", borderRadius: 7, color: "#9d94fb", cursor: "pointer", fontFamily: "'DM Sans',sans-serif", fontWeight: 500 },
  sheetWrap:    { borderRadius: 3, boxShadow: "0 20px 70px rgba(0,0,0,0.7)", overflow: "hidden", marginBottom: 24 },
}
