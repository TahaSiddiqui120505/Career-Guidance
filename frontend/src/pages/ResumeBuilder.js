import { useState } from "react"
import axios from "axios"
import html2pdf from "html2pdf.js"

/* ══════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════ */

/** Strip any leading bullet chars the AI injects */
const stripBullets = (text = "") =>
  text.split("\n").map(l => l.replace(/^[\s•\-*#]+/, "").trim()).filter(Boolean).join("\n")

/** Render newline-text → <li> list with no double bullets */
const toBullets = (text = "") =>
  text.split("\n").map(l => l.replace(/^[\s•\-*#]+/, "").trim()).filter(Boolean)
    .map((line, i) => <li key={i}>{line}</li>)

/* ══════════════════════════════════════════════════
   SHARED SECTIONS — used by every template
══════════════════════════════════════════════════ */

const Sections = ({ summary, experience, skills, projects, hClass = "sec-h", skipSkills = false }) => (
  <>
    {summary && (
      <div className="sec-block">
        <h2 className={hClass}>Professional Summary</h2>
        <p className="sec-body">{summary}</p>
      </div>
    )}
    {experience && (
      <div className="sec-block">
        <h2 className={hClass}>Experience</h2>
        <ul className="bul-list">{toBullets(experience)}</ul>
      </div>
    )}
    {!skipSkills && skills && (
      <div className="sec-block">
        <h2 className={hClass}>Skills</h2>
        <ul className="bul-list">{toBullets(skills)}</ul>
      </div>
    )}
    {projects?.filter(Boolean).length > 0 && (
      <div className="sec-block">
        <h2 className={hClass}>Projects</h2>
        <ul className="bul-list">{projects.filter(Boolean).map((p, i) => <li key={i}>{p}</li>)}</ul>
      </div>
    )}
  </>
)

/* ══════════════════════════════════════════════════
   10 UPGRADED TEMPLATES
══════════════════════════════════════════════════ */

/* 1. MODERN — gradient accent bar, serif name */
const TplModern = ({ name, email, degree, ...rest }) => (
  <div style={{ background: "#fff", minHeight: "100%" }}>
    <div style={{ padding: "38px 44px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 36, fontWeight: 700, color: "#5046e4", lineHeight: 1, letterSpacing: -0.5 }}>{name}</h1>
          {degree && <p style={{ fontSize: 13, color: "#666", marginTop: 7 }}>{degree}</p>}
        </div>
        {email && <p style={{ fontSize: 13, color: "#555", paddingTop: 4 }}>{email}</p>}
      </div>
      <div style={{ height: 3, margin: "14px 0 0", background: "linear-gradient(90deg,#5046e4,#38bdf8,transparent)", borderRadius: 2 }} />
    </div>
    <div style={{ padding: "6px 44px 44px" }}>
      <Sections {...rest} hClass="h-modern" />
    </div>
  </div>
)

/* 2. CORPORATE — deep navy header */
const TplCorporate = ({ name, email, degree, ...rest }) => (
  <div style={{ background: "#fff", minHeight: "100%" }}>
    <div style={{ background: "#162844", padding: "28px 36px" }}>
      <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 30, color: "#fff", fontWeight: 700, letterSpacing: -0.3 }}>{name}</h1>
      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", marginTop: 8 }}>{[email, degree].filter(Boolean).join("  |  ")}</p>
    </div>
    <div style={{ padding: "18px 36px 44px" }}>
      <Sections {...rest} hClass="h-corporate" />
    </div>
  </div>
)

/* 3. HARVARD — left red sidebar rule, serif throughout */
const TplHarvard = ({ name, email, degree, ...rest }) => (
  <div style={{ background: "#fff", padding: "44px 48px", minHeight: "100%" }}>
    <div style={{ borderBottom: "2px solid #A51C30", paddingBottom: 14, marginBottom: 4 }}>
      <h1 style={{ fontFamily: "Georgia,serif", fontSize: 28, fontWeight: 700, color: "#111", letterSpacing: 0.2 }}>{name}</h1>
      <p style={{ fontSize: 12.5, color: "#555", marginTop: 6, letterSpacing: 0.3 }}>{[email, degree].filter(Boolean).join("  ·  ")}</p>
    </div>
    <Sections {...rest} hClass="h-harvard" />
  </div>
)

/* 4. FAANG — mono stack, left accent stripe */
const TplFaang = ({ name, email, degree, ...rest }) => (
  <div style={{ background: "#fff", display: "flex", minHeight: "100%" }}>
    <div style={{ width: 5, background: "linear-gradient(180deg,#4285F4,#34A853,#FBBC05,#EA4335)", flexShrink: 0 }} />
    <div style={{ flex: 1, padding: "38px 40px 44px", fontFamily: "'Courier New',monospace" }}>
      <h1 style={{ fontSize: 26, fontWeight: 700, color: "#111", letterSpacing: -0.3 }}>{name}</h1>
      <p style={{ fontSize: 12, color: "#444", marginTop: 6 }}>{[email, degree].filter(Boolean).join("  //  ")}</p>
      <div style={{ height: 1, background: "#ddd", margin: "14px 0" }} />
      <Sections {...rest} hClass="h-faang" />
    </div>
  </div>
)

/* 5. INVESTMENT BANKING — ultra-formal, ruled, serif */
const TplBanking = ({ name, email, degree, ...rest }) => (
  <div style={{ background: "#FAFAF8", padding: "50px 52px", minHeight: "100%", fontFamily: "Georgia,serif" }}>
    <div style={{ textAlign: "center", borderBottom: "2px solid #111", paddingBottom: 16, marginBottom: 4 }}>
      <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "#111" }}>{name}</h1>
      <p style={{ fontSize: 12, color: "#555", marginTop: 8, letterSpacing: 0.8 }}>{[email, degree].filter(Boolean).join("   ·   ")}</p>
    </div>
    <Sections {...rest} hClass="h-banking" />
  </div>
)

/* 6. ATS OPTIMISED — plain, clean, 100% machine-readable */
const TplAts = ({ name, email, degree, ...rest }) => (
  <div style={{ background: "#fff", padding: "36px 40px", minHeight: "100%", fontFamily: "Arial,sans-serif" }}>
    <h1 style={{ fontSize: 20, fontWeight: 700, color: "#000" }}>{name}</h1>
    <p style={{ fontSize: 12.5, color: "#333", marginTop: 5 }}>{[email, degree].filter(Boolean).join(" | ")}</p>
    <Sections {...rest} hClass="h-ats" />
  </div>
)

/* 7. CREATIVE SIDEBAR — coloured left panel with avatar */
const TplCreative = ({ name, email, degree, skills, ...rest }) => (
  <div style={{ display: "flex", minHeight: "100%", background: "#fff" }}>
    <div style={{ width: 210, flexShrink: 0, background: "#2c1d5e", padding: "30px 18px", color: "#fff" }}>
      <div style={{ width: 54, height: 54, borderRadius: "50%", background: "linear-gradient(135deg,#7c6ffa,#34d5c8)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Playfair Display',serif", fontSize: 24, color: "#fff", marginBottom: 14 }}>
        {name?.charAt(0) || "?"}
      </div>
      <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, color: "#fff", lineHeight: 1.25, wordBreak: "break-word" }}>{name}</h1>
      {email  && <p style={{ fontSize: 11, color: "rgba(255,255,255,0.58)", marginTop: 7, wordBreak: "break-all" }}>{email}</p>}
      {degree && <p style={{ fontSize: 11, color: "rgba(255,255,255,0.58)", marginTop: 5 }}>{degree}</p>}
      {skills && <>
        <h3 style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.2, color: "rgba(255,255,255,0.4)", margin: "22px 0 8px" }}>Skills</h3>
        <ul style={{ paddingLeft: 14, listStyle: "disc" }}>
          {toBullets(skills).map((li, i) => <li key={i} style={{ fontSize: 11.5, color: "rgba(255,255,255,0.76)", marginBottom: 5, lineHeight: 1.4 }}>{li.props.children}</li>)}
        </ul>
      </>}
    </div>
    <div style={{ flex: 1, padding: "26px 28px 44px" }}>
      <Sections {...rest} skills="" hClass="h-creative" skipSkills />
    </div>
  </div>
)

/* 8. MINIMAL CLEAN — restrained, lots of space */
const TplMinimal = ({ name, email, degree, ...rest }) => (
  <div style={{ background: "#fff", padding: "52px", minHeight: "100%" }}>
    <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 32, color: "#111", fontWeight: 700, letterSpacing: -0.5 }}>{name}</h1>
    <p style={{ fontSize: 13, color: "#777", marginTop: 8 }}>{[email, degree].filter(Boolean).join("  ·  ")}</p>
    <div style={{ height: 1, background: "#e5e5e5", margin: "16px 0 4px" }} />
    <Sections {...rest} hClass="h-minimal" />
  </div>
)

/* 9. EXECUTIVE — centred masthead, formal, serif */
const TplExecutive = ({ name, email, degree, ...rest }) => (
  <div style={{ background: "#FDFCFA", minHeight: "100%" }}>
    <div style={{ textAlign: "center", padding: "44px 48px 24px" }}>
      <div style={{ width: 60, height: 1, background: "#c9a84c", margin: "0 auto 16px" }} />
      <h1 style={{ fontFamily: "'Playfair Display',serif", fontStyle: "italic", fontSize: 34, color: "#1a1208", letterSpacing: 0.5 }}>{name}</h1>
      <p style={{ fontSize: 12.5, color: "#8a7a5a", marginTop: 9, letterSpacing: 1.2 }}>{[email, degree].filter(Boolean).join("   ·   ")}</p>
      <div style={{ width: 60, height: 1, background: "#c9a84c", margin: "16px auto 0" }} />
    </div>
    <div style={{ padding: "0 50px 50px", textAlign: "left" }}>
      <Sections {...rest} hClass="h-executive" />
    </div>
  </div>
)

/* 10. TECH PORTFOLIO — dark mode, terminal aesthetic */
const TplTech = ({ name, email, degree, ...rest }) => (
  <div style={{ background: "#0d1117", minHeight: "100%", padding: "38px 42px", fontFamily: "'Courier New',monospace", color: "#c9d1d9" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 6 }}>
      <div style={{ display: "flex", gap: 6 }}>
        <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#FF5F57" }} />
        <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#FFBD2E" }} />
        <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#28CA41" }} />
      </div>
      <span style={{ fontSize: 11, color: "#484f58" }}>resume.md — {name}</span>
    </div>
    <div style={{ borderTop: "1px solid #21262d", paddingTop: 24 }}>
      <p style={{ color: "#58a6ff", fontSize: 13, marginBottom: 4 }}># {name}</p>
      <p style={{ color: "#8b949e", fontSize: 12 }}>{[email, degree].filter(Boolean).map(s => `> ${s}`).join("  ")}</p>
      <div style={{ height: 1, background: "#21262d", margin: "18px 0" }} />
      <Sections {...rest} hClass="h-tech" />
    </div>
  </div>
)

/* Template registry */
const TEMPLATES = {
  modern:    { label: "Modern",       Component: TplModern    },
  corporate: { label: "Corporate",    Component: TplCorporate },
  harvard:   { label: "Harvard",      Component: TplHarvard   },
  faang:     { label: "FAANG",        Component: TplFaang     },
  banking:   { label: "IB / Finance", Component: TplBanking   },
  ats:       { label: "ATS Clean",    Component: TplAts       },
  creative:  { label: "Creative",     Component: TplCreative  },
  minimal:   { label: "Minimal",      Component: TplMinimal   },
  executive: { label: "Executive",    Component: TplExecutive },
  tech:      { label: "Tech / Dark",  Component: TplTech      },
}

/* ══════════════════════════════════════════════════
   FIELD WRAPPER
══════════════════════════════════════════════════ */

const Field = ({ label, hint, children }) => (
  <div className="field-wrap">
    <label className="field-label">{label}</label>
    {hint && <p className="field-hint">{hint}</p>}
    {children}
  </div>
)

/* ══════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════ */

export default function ResumeBuilder() {

  /* form */
  const [name,       setName]       = useState("")
  const [email,      setEmail]      = useState("")
  const [degree,     setDegree]     = useState("")
  const [summary,    setSummary]    = useState("")
  const [skills,     setSkills]     = useState("")
  const [experience, setExperience] = useState("")
  const [projects,   setProjects]   = useState([""])

  /* ui */
  const [resume,     setResume]     = useState(false)
  const [loadingAI,  setLoadingAI]  = useState(false)
  const [loadingGen, setLoadingGen] = useState(false)
  const [activeTab,  setActiveTab]  = useState("basics")
  const [template,   setTemplate]   = useState("modern")
  const [toastMsg,   setToastMsg]   = useState("")

  /* style (from original) */
  const [fontFamily, setFontFamily] = useState("Georgia, serif")
  const [fontSize,   setFontSize]   = useState(14)
  const [textColor,  setTextColor]  = useState("#111111")
  const [pageColor,  setPageColor]  = useState("#ffffff")

  /* toast helper */
  const toast = (msg) => { setToastMsg(msg); setTimeout(() => setToastMsg(""), 3000) }

  /* projects */
  const addProject    = () => setProjects([...projects, ""])
  const removeProject = (i) => setProjects(projects.filter((_, idx) => idx !== i))
  const updateProject = (i, v) => { const c = [...projects]; c[i] = v; setProjects(c) }

  /* generate */
  const generateResume = async () => {
    if (!name.trim()) { toast("Please enter your name first."); return }
    setLoadingGen(true)
    try {
      await axios.post("http://127.0.0.1:8000/resume/generate", { name, email, degree, summary, skills, experience, projects })
      setResume(true)
      toast("Resume generated!")
    } catch {
      setResume(true) // show local preview if backend down
      toast("Backend offline — showing local preview.")
    } finally { setLoadingGen(false) }
  }

  /* AI enhance */
  const enhanceResume = async () => {
    if (!summary && !experience && !skills) { toast("Add some content first!"); return }
    setLoadingAI(true)
    try {
      const res = await axios.post("http://127.0.0.1:8000/resume/enhance", { name, email, degree, summary, skills, experience, projects })
      const d = res.data
      if (d.summary)    setSummary(stripBullets(d.summary))
      if (d.experience) setExperience(stripBullets(d.experience))
      if (d.skills)     setSkills(stripBullets(d.skills))
      if (d.projects)   setProjects(
        Array.isArray(d.projects)
          ? d.projects.map(p => stripBullets(String(p)))
          : [stripBullets(String(d.projects))]
      )
      setResume(true)
      toast("AI enhancement applied!")
    } catch (err) {
      console.error(err)
      toast("AI enhancement failed — check backend.")
    } finally { setLoadingAI(false) }
  }

  /* PDF */
  const downloadPDF = () => {
    const el = document.getElementById("resume-preview")
    if (!el) return
    html2pdf().from(el).set({
      margin: 0.4,
      filename: `${name || "resume"}.pdf`,
      image: { type: "jpeg", quality: 1 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "in", format: "letter", orientation: "portrait" }
    }).save()
    toast("Downloading PDF…")
  }

  /* rich text */
  const bold      = () => document.execCommand("bold")
  const italic    = () => document.execCommand("italic")
  const underline = () => document.execCommand("underline")
  const highlight = (c) => document.execCommand("hiliteColor", false, c)

  const TplComponent = TEMPLATES[template]?.Component || TplModern
  const tplProps = { name, email, degree, summary, experience, skills, projects }

  const TABS = [
    { id: "basics",     label: "Basics"     },
    { id: "experience", label: "Experience" },
    { id: "skills",     label: "Skills"     },
    { id: "projects",   label: "Projects"   },
    { id: "style",      label: "Style"      },
  ]

  /* ─── RENDER ─── */
  return (
    <>
      <style>{CSS}</style>

      {/* Toast */}
      {toastMsg && <div className="toast">{toastMsg}</div>}

      <div className="app-shell">

        {/* ══ LEFT PANEL ══ */}
        <aside className="left-panel">

          <div className="lp-header">
            <div className="logo-pill">RB</div>
            <div>
              <h1 className="lp-title">Resume Builder</h1>
              <p className="lp-sub">Craft your story · Land the role</p>
            </div>
          </div>

          <nav className="tab-nav">
            {TABS.map(t => (
              <button key={t.id}
                className={`tab-btn ${activeTab === t.id ? "active" : ""}`}
                onClick={() => setActiveTab(t.id)}
              >{t.label}</button>
            ))}
          </nav>

          <div className="fields-scroll">

            {/* ── BASICS ── */}
            {activeTab === "basics" && (
              <div className="fields-col">
                <Field label="Full Name">
                  <input className="inp" placeholder="e.g. Divit Shah"
                    value={name} onChange={e => setName(e.target.value)} />
                </Field>
                <Field label="Email Address">
                  <input className="inp" placeholder="you@email.com"
                    value={email} onChange={e => setEmail(e.target.value)} />
                </Field>
                <Field label="Degree / Education">
                  <input className="inp" placeholder="e.g. BSc Data Science, MIT"
                    value={degree} onChange={e => setDegree(e.target.value)} />
                </Field>
                <Field label="Professional Summary" hint="2–4 sentences about your background and goals.">
                  <textarea className="inp ta" rows={5}
                    placeholder="CFA Level I candidate with strong interest in financial markets and data-driven investment analysis..."
                    value={summary} onChange={e => setSummary(e.target.value)} />
                </Field>
              </div>
            )}

            {/* ── EXPERIENCE ── */}
            {activeTab === "experience" && (
              <div className="fields-col">
                <Field label="Work Experience" hint="Each new line becomes one bullet point on your resume.">
                  <textarea className="inp ta" rows={12}
                    placeholder={"Financial Analyst at Acme Corp (2023–2024)\nBuilt DCF models for 20+ equity research pitches\nReduced reporting time 35% via Power BI automation\nPresented quarterly insights to C-suite stakeholders"}
                    value={experience} onChange={e => setExperience(e.target.value)} />
                </Field>
              </div>
            )}

            {/* ── SKILLS ── */}
            {activeTab === "skills" && (
              <div className="fields-col">
                <Field label="Skills" hint="Each new line becomes one bullet. Group by category if you like.">
                  <textarea className="inp ta" rows={12}
                    placeholder={"Python · SQL · Excel\nData Analysis · Power BI · Tableau\nFinancial Modeling · DCF Valuation\nEquity Research · Bloomberg Terminal"}
                    value={skills} onChange={e => setSkills(e.target.value)} />
                </Field>
              </div>
            )}

            {/* ── PROJECTS ── */}
            {activeTab === "projects" && (
              <div className="fields-col">
                <Field label="Projects" hint="Each card is one project entry. Describe the project and your impact.">
                  {projects.map((project, index) => (
                    <div key={index} className="project-row">
                      <input
                        className="inp project-inp"
                        placeholder={`Project ${index + 1} — e.g. Equity Research Dashboard · Analysed 50+ stocks via Bloomberg`}
                        value={project}
                        onChange={e => updateProject(index, e.target.value)}
                      />
                      {projects.length > 1 && (
                        <button className="remove-btn" onClick={() => removeProject(index)}>✕</button>
                      )}
                    </div>
                  ))}
                  <button className="add-btn" onClick={addProject}>+ Add Project</button>
                </Field>
              </div>
            )}

            {/* ── STYLE ── */}
            {activeTab === "style" && (
              <div className="fields-col">
                <Field label="Font Family">
                  <select className="inp" value={fontFamily} onChange={e => setFontFamily(e.target.value)}>
                    <option value="Georgia, serif">Georgia (Classic)</option>
                    <option value="'Times New Roman', serif">Times New Roman (Traditional)</option>
                    <option value="'Courier New', monospace">Courier New (Technical)</option>
                    <option value="Arial, sans-serif">Arial (Modern Clean)</option>
                    <option value="Verdana, sans-serif">Verdana (Readable)</option>
                    <option value="Garamond, serif">Garamond (Elegant)</option>
                  </select>
                </Field>
                <Field label={`Font Size — ${fontSize}px`}>
                  <input type="range" min="11" max="18" value={fontSize}
                    onChange={e => setFontSize(Number(e.target.value))} className="slider" />
                </Field>
                <Field label="Text Color">
                  <div className="color-row">
                    <input type="color" value={textColor}
                      onChange={e => setTextColor(e.target.value)} className="color-swatch" />
                    <span className="color-val">{textColor}</span>
                  </div>
                </Field>
                <Field label="Page Background">
                  <div className="color-row">
                    <input type="color" value={pageColor}
                      onChange={e => setPageColor(e.target.value)} className="color-swatch" />
                    <span className="color-val">{pageColor}</span>
                  </div>
                </Field>
                <div className="style-note">
                  💡 Style changes apply live to the preview. Note: Tech/Dark template ignores background color by design.
                </div>
              </div>
            )}

          </div>

          {/* ACTION BAR */}
          <div className="action-bar">
            <button className="btn-enhance" onClick={enhanceResume} disabled={loadingAI}>
              {loadingAI
                ? <><span className="spinner" /> Enhancing…</>
                : <><span>✦</span> Enhance with AI</>}
            </button>
            <button className="btn-generate" onClick={generateResume} disabled={loadingGen}>
              {loadingGen ? "Generating…" : "Preview Resume →"}
            </button>
          </div>

        </aside>

        {/* ══ RIGHT PANEL ══ */}
        <section className="right-panel">

          {/* TOOLBAR */}
          <div className="toolbar">
            <div className="toolbar-left">
              <span className="tb-label">Template</span>
              <div className="tpl-chip-group">
                {Object.entries(TEMPLATES).map(([key, { label }]) => (
                  <button key={key}
                    className={`tpl-chip ${template === key ? "active" : ""}`}
                    onClick={() => setTemplate(key)}
                  >{label}</button>
                ))}
              </div>
            </div>
            <div className="toolbar-right">
              <div className="format-btns">
                <button className="fmt-btn" onClick={bold}><b>B</b></button>
                <button className="fmt-btn" onClick={italic}><i>I</i></button>
                <button className="fmt-btn" onClick={underline}><u>U</u></button>
                <label className="fmt-btn color-label" title="Highlight">
                  <span>A</span>
                  <input type="color" className="hidden-color" onChange={e => highlight(e.target.value)} />
                </label>
              </div>
              <button className="btn-dl" onClick={downloadPDF} disabled={!resume}>↓ PDF</button>
            </div>
          </div>

          {/* PREVIEW */}
          <div className="preview-area">
            {!resume ? (
              <div className="empty-state">
                <div className="empty-icon">📄</div>
                <h3>Your resume will appear here</h3>
                <p>Fill in your details on the left, then click <strong>Preview Resume</strong></p>
                <div className="empty-steps">
                  <span>① Fill Basics</span>
                  <span className="arr">→</span>
                  <span>② Experience &amp; Skills</span>
                  <span className="arr">→</span>
                  <span>③ Enhance with AI</span>
                  <span className="arr">→</span>
                  <span>④ Download PDF</span>
                </div>
              </div>
            ) : (
              <div id="resume-preview" className="resume-sheet"
                style={{ fontFamily, fontSize: fontSize + "px", color: textColor, backgroundColor: pageColor }}>
                <TplComponent {...tplProps} />
              </div>
            )}
          </div>

        </section>
      </div>
    </>
  )
}

/* ══════════════════════════════════════════════════
   CSS
══════════════════════════════════════════════════ */

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,600&family=DM+Sans:wght@300;400;500;600&display=swap');

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg:       #0a0b10;
  --surf:     #13151e;
  --surf2:    #1a1d29;
  --border:   #242736;
  --border2:  #2e3245;
  --accent:   #7c6ffa;
  --alo:      rgba(124,111,250,0.12);
  --accent2:  #34d5c8;
  --text:     #dde1f0;
  --muted:    #6b7092;
  --green:    #30c97e;
  --red:      #f05252;
  --font:     'DM Sans', sans-serif;
}

body { background: var(--bg); font-family: var(--font); color: var(--text); }

/* LAYOUT */
.app-shell { display: flex; height: 100vh; overflow: hidden; }

/* TOAST */
.toast {
  position: fixed; top: 18px; left: 50%; transform: translateX(-50%);
  background: #1e2130; border: 1px solid var(--border2);
  color: var(--text); padding: 10px 22px; border-radius: 30px;
  font-size: 13px; font-family: var(--font); z-index: 9999;
  box-shadow: 0 8px 30px rgba(0,0,0,0.4);
  animation: fadeSlide 0.25s ease;
}
@keyframes fadeSlide { from { opacity: 0; transform: translateX(-50%) translateY(-8px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }

/* ── LEFT PANEL ── */
.left-panel {
  width: 400px; min-width: 360px;
  background: var(--surf);
  border-right: 1px solid var(--border);
  display: flex; flex-direction: column; overflow: hidden;
}
.lp-header {
  padding: 20px 22px 16px;
  display: flex; align-items: center; gap: 12px;
  border-bottom: 1px solid var(--border);
}
.logo-pill {
  width: 38px; height: 38px; border-radius: 9px; flex-shrink: 0;
  background: linear-gradient(135deg, var(--accent), var(--accent2));
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 14px; color: #fff;
}
.lp-title { font-size: 17px; font-weight: 600; letter-spacing: -0.3px; }
.lp-sub   { font-size: 11.5px; color: var(--muted); margin-top: 2px; }

/* TABS */
.tab-nav {
  display: flex; border-bottom: 1px solid var(--border); padding: 0 8px;
}
.tab-btn {
  flex: 1; padding: 10px 2px; border: none; background: none;
  color: var(--muted); font-family: var(--font); font-size: 12.5px; font-weight: 500;
  cursor: pointer; border-bottom: 2px solid transparent;
  transition: color .15s, border-color .15s; margin-bottom: -1px;
}
.tab-btn:hover { color: var(--text); }
.tab-btn.active { color: var(--accent); border-bottom-color: var(--accent); }

/* FIELDS */
.fields-scroll {
  flex: 1; overflow-y: auto; padding: 20px 22px;
  scrollbar-width: thin; scrollbar-color: var(--border2) transparent;
}
.fields-col { display: flex; flex-direction: column; gap: 18px; }
.field-wrap { display: flex; flex-direction: column; gap: 5px; }
.field-label {
  font-size: 11px; font-weight: 600; text-transform: uppercase;
  letter-spacing: 0.8px; color: var(--muted);
}
.field-hint { font-size: 12px; color: var(--muted); line-height: 1.5; }

.inp {
  width: 100%; padding: 10px 12px;
  background: var(--bg); border: 1px solid var(--border2);
  border-radius: 8px; color: var(--text);
  font-family: var(--font); font-size: 13.5px;
  transition: border-color .16s, box-shadow .16s;
  outline: none; resize: none; appearance: none;
}
.inp:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(124,111,250,0.14); }
.inp::placeholder { color: var(--muted); }
.ta { resize: vertical; line-height: 1.65; }

.project-row { display: flex; gap: 8px; align-items: stretch; }
.project-inp { flex: 1; }
.remove-btn {
  width: 36px; flex-shrink: 0;
  background: rgba(240,82,82,0.1); border: 1px solid rgba(240,82,82,0.22);
  color: var(--red); border-radius: 8px; cursor: pointer;
  font-size: 12px; display: flex; align-items: center; justify-content: center;
  transition: background .15s;
}
.remove-btn:hover { background: rgba(240,82,82,0.22); }
.add-btn {
  padding: 9px 16px; background: var(--alo);
  border: 1px dashed rgba(124,111,250,0.4); color: var(--accent);
  border-radius: 8px; font-family: var(--font); font-size: 13px; font-weight: 500;
  cursor: pointer; transition: background .15s; width: 100%;
}
.add-btn:hover { background: rgba(124,111,250,0.2); }

/* style tab */
.slider { width: 100%; accent-color: var(--accent); cursor: pointer; height: 5px; }
.color-row { display: flex; align-items: center; gap: 12px; }
.color-swatch {
  width: 42px; height: 34px; border-radius: 8px;
  border: 1px solid var(--border2); cursor: pointer; padding: 3px; background: none;
}
.color-val { font-size: 13px; color: var(--muted); font-family: monospace; }
.style-note {
  font-size: 12px; color: var(--muted); background: var(--surf2);
  border-radius: 8px; padding: 10px 12px; line-height: 1.5;
}

/* ACTION BAR */
.action-bar {
  padding: 14px 22px; border-top: 1px solid var(--border);
  display: flex; flex-direction: column; gap: 9px;
}
.btn-enhance, .btn-generate {
  width: 100%; padding: 11px 16px; border: none; border-radius: 9px;
  font-family: var(--font); font-size: 13.5px; font-weight: 600;
  cursor: pointer; transition: all .18s;
  display: flex; align-items: center; justify-content: center; gap: 8px;
}
.btn-enhance {
  background: linear-gradient(135deg,#3b35c4,var(--accent));
  color: #fff; box-shadow: 0 4px 16px rgba(124,111,250,0.25);
}
.btn-enhance:hover:not(:disabled) { filter: brightness(1.12); transform: translateY(-1px); }
.btn-enhance:disabled { opacity: .55; cursor: not-allowed; }
.btn-generate {
  background: linear-gradient(135deg,var(--accent2),#1c9e93);
  color: #fff; box-shadow: 0 4px 16px rgba(52,213,200,0.2);
}
.btn-generate:hover:not(:disabled) { filter: brightness(1.1); transform: translateY(-1px); }
.btn-generate:disabled { opacity: .55; cursor: not-allowed; }

.spinner {
  width: 13px; height: 13px; border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff; border-radius: 50%;
  animation: spin .7s linear infinite; display: inline-block;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* ── RIGHT PANEL ── */
.right-panel {
  flex: 1; display: flex; flex-direction: column;
  background: #0d0f16; overflow: hidden;
}

/* TOOLBAR */
.toolbar {
  padding: 10px 18px; display: flex; align-items: center;
  justify-content: space-between; border-bottom: 1px solid var(--border);
  background: var(--surf); gap: 10px; flex-wrap: wrap;
}
.toolbar-left  { display: flex; align-items: center; gap: 6px; flex: 1; min-width: 0; }
.toolbar-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
.tb-label {
  font-size: 10.5px; color: var(--muted); font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.6px; white-space: nowrap; margin-right: 2px;
}
.tpl-chip-group {
  display: flex; gap: 4px; overflow-x: auto;
  scrollbar-width: none; padding-bottom: 2px;
}
.tpl-chip-group::-webkit-scrollbar { display: none; }
.tpl-chip {
  padding: 4px 11px; border-radius: 20px; white-space: nowrap;
  border: 1px solid var(--border2); background: transparent;
  color: var(--muted); font-family: var(--font); font-size: 12px; font-weight: 500;
  cursor: pointer; transition: all .15s; flex-shrink: 0;
}
.tpl-chip:hover  { border-color: var(--accent); color: var(--accent); }
.tpl-chip.active { background: var(--accent); border-color: var(--accent); color: #fff; }

.format-btns { display: flex; gap: 4px; }
.fmt-btn {
  width: 29px; height: 29px; display: flex; align-items: center; justify-content: center;
  background: var(--surf2); border: 1px solid var(--border2);
  border-radius: 6px; color: var(--text); font-family: var(--font); font-size: 13px;
  cursor: pointer; transition: background .15s; position: relative;
}
.fmt-btn:hover { background: var(--border); }
.color-label { cursor: pointer; }
.hidden-color { position: absolute; opacity: 0; width: 100%; height: 100%; cursor: pointer; top:0; left:0; }
.btn-dl {
  padding: 6px 16px; background: var(--green); border: none;
  border-radius: 8px; color: #fff; font-family: var(--font);
  font-size: 13px; font-weight: 600; cursor: pointer; transition: all .18s; white-space: nowrap;
}
.btn-dl:hover:not(:disabled) { filter: brightness(1.1); transform: translateY(-1px); }
.btn-dl:disabled { opacity: .35; cursor: not-allowed; }

/* PREVIEW AREA */
.preview-area {
  flex: 1; overflow-y: auto; padding: 32px;
  display: flex; justify-content: center; align-items: flex-start;
}
.empty-state {
  display: flex; flex-direction: column; align-items: center;
  gap: 12px; margin-top: 70px; color: var(--muted); text-align: center;
}
.empty-icon { font-size: 54px; opacity: .3; margin-bottom: 4px; }
.empty-state h3 { font-size: 18px; font-weight: 600; color: var(--text); }
.empty-state p  { font-size: 14px; line-height: 1.6; max-width: 340px; }
.empty-steps {
  display: flex; flex-wrap: wrap; gap: 8px; justify-content: center;
  margin-top: 10px; font-size: 12px; color: var(--muted);
}
.empty-steps span { background: var(--surf2); padding: 5px 12px; border-radius: 20px; }
.empty-steps .arr { background: none; padding: 5px 0; }

/* RESUME SHEET */
.resume-sheet {
  width: 750px; min-height: 1050px;
  box-shadow: 0 24px 80px rgba(0,0,0,0.6);
  border-radius: 2px; overflow: hidden;
}

/* ── SHARED RESUME CONTENT ── */
.sec-block { margin-top: 18px; }
.sec-body  { font-size: 13px; line-height: 1.7; }
.bul-list  { margin: 0; padding-left: 18px; display: flex; flex-direction: column; gap: 3px; }
.bul-list li { font-size: 13px; line-height: 1.65; }

/* ── TEMPLATE HEADING STYLES ── */
.h-modern {
  font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px;
  color: #5046e4; padding-bottom: 5px; border-bottom: 1px solid #e4e1ff; margin-bottom: 8px;
}
.h-corporate {
  font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.3px;
  color: #162844; padding-bottom: 5px; border-bottom: 2px solid #162844; margin-bottom: 8px;
}
.h-harvard {
  font-family: Georgia, serif; font-size: 13px; font-weight: 700; color: #A51C30;
  text-transform: uppercase; letter-spacing: 0.8px;
  padding-bottom: 3px; border-bottom: 1px solid #A51C30; margin-bottom: 7px;
}
.h-faang {
  font-size: 11px; font-weight: 700; color: #4285F4; text-transform: uppercase;
  letter-spacing: 1.2px; padding-bottom: 4px;
  border-bottom: 1px solid #e8eaf0; margin-bottom: 7px;
  font-family: 'Courier New', monospace;
}
.h-banking {
  font-family: Georgia, serif; font-size: 12.5px; font-weight: 700; color: #111;
  text-transform: uppercase; letter-spacing: 1.5px;
  padding-bottom: 4px; border-bottom: 1.5px solid #111; margin-bottom: 8px;
}
.h-ats {
  font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px;
  color: #000; padding-bottom: 3px; border-bottom: 1px solid #999; margin-bottom: 7px;
}
.h-creative {
  font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.3px;
  color: #2c1d5e; padding-bottom: 5px; border-bottom: 1px solid #ddd4f7; margin-bottom: 8px;
}
.h-minimal {
  font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.3px;
  color: #333; padding-bottom: 4px; border-bottom: 1px solid #eee; margin-bottom: 7px;
}
.h-executive {
  font-family: 'Playfair Display', serif; font-style: italic;
  font-size: 15px; color: #c9a84c;
  padding-bottom: 4px; border-bottom: 1px solid #e8dfc8; margin-bottom: 8px;
}
.h-tech {
  font-family: 'Courier New', monospace;
  font-size: 12px; color: #58a6ff; margin-bottom: 8px;
}
.h-tech::before { content: "## "; color: #484f58; }
`