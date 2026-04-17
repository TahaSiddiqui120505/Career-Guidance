import { useState, useRef, useCallback } from "react"
import axios from "axios"
import html2pdf from "html2pdf.js"
import "./ResumeBuilder.css"

/* ══════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════ */

const stripBullets = (text = "") =>
  text.split("\n").map(l => l.replace(/^[\s•\-*#]+/, "").trim()).filter(Boolean).join("\n")

const toBullets = (text = "") =>
  text.split("\n").map(l => l.replace(/^[\s•\-*#]+/, "").trim()).filter(Boolean)
    .map((line, i) => <li key={i}>{line}</li>)

/* ══════════════════════════════════════════════════
   INLINE EDITABLE
══════════════════════════════════════════════════ */

const Editable = ({ value, onChange, multiline = false, style = {}, className = "" }) => {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft]     = useState(value)
  const ref = useRef(null)

  const start  = () => { setDraft(value); setEditing(true); setTimeout(() => ref.current?.focus(), 10) }
  const commit = () => { setEditing(false); if (draft !== value) onChange(draft) }
  const cancel = () => setEditing(false)

  if (!editing) {
    return (
      <span
        className="editable-field"
        onClick={start}
        style={{ ...style, cursor: "text", borderBottom: "1.5px dashed rgba(80,70,228,0.35)", display: "inline" }}
        title="Click to edit"
      >
        {value || <span style={{ opacity: 0.35 }}>Click to edit…</span>}
      </span>
    )
  }
  if (multiline) {
    return (
      <textarea
        ref={ref}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === "Escape") cancel() }}
        style={{ ...style, width: "100%", minHeight: 60, border: "1.5px solid #5046e4", borderRadius: 4, padding: "4px 6px", fontFamily: "inherit", fontSize: "inherit", lineHeight: "inherit", resize: "vertical", background: "rgba(80,70,228,0.06)", outline: "none" }}
        autoFocus
      />
    )
  }
  return (
    <input
      ref={ref}
      value={draft}
      onChange={e => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") cancel() }}
      style={{ ...style, border: "1.5px solid #5046e4", borderRadius: 4, padding: "2px 6px", fontFamily: "inherit", fontSize: "inherit", background: "rgba(80,70,228,0.06)", outline: "none", width: "100%" }}
      autoFocus
    />
  )
}

const EditableList = ({ value, onChange }) => {
  const lines    = value.split("\n").map(l => l.replace(/^[\s•\-*#]+/, "").trim()).filter(Boolean)
  const update   = (i, v) => { const c = [...lines]; c[i] = v; onChange(c.join("\n")) }
  const addLine  = () => onChange([...lines, "New item"].join("\n"))
  const removeLine = (i) => { const c = lines.filter((_, idx) => idx !== i); onChange(c.join("\n")) }

  return (
    <ul style={{ margin: 0, paddingLeft: 18, listStyle: "disc" }}>
      {lines.map((line, i) => (
        <li key={i} style={{ fontSize: 13, lineHeight: 1.65, marginBottom: 2, display: "flex", alignItems: "flex-start", gap: 4 }}>
          <span style={{ flex: 1 }}>
            <Editable value={line} onChange={v => update(i, v)} style={{ fontSize: 13, lineHeight: 1.65 }} />
          </span>
          <button onClick={() => removeLine(i)} style={{ fontSize: 10, color: "#f05252", background: "none", border: "none", cursor: "pointer", opacity: 0.5, padding: "0 2px", flexShrink: 0 }}>✕</button>
        </li>
      ))}
      <li style={{ listStyle: "none", marginTop: 4 }}>
        <button onClick={addLine} style={{ fontSize: 11, color: "#5046e4", background: "rgba(80,70,228,0.08)", border: "1px dashed rgba(80,70,228,0.35)", borderRadius: 4, padding: "2px 10px", cursor: "pointer" }}>+ add line</button>
      </li>
    </ul>
  )
}

const EditableProjects = ({ projects, onChange }) => {
  const update = (i, v) => { const c = [...projects]; c[i] = v; onChange(c) }
  const add    = () => onChange([...projects, "New project"])
  const remove = (i) => onChange(projects.filter((_, idx) => idx !== i))

  return (
    <ul style={{ margin: 0, paddingLeft: 18, listStyle: "disc" }}>
      {projects.filter(Boolean).map((p, i) => (
        <li key={i} style={{ fontSize: 13, lineHeight: 1.65, marginBottom: 2, display: "flex", alignItems: "flex-start", gap: 4 }}>
          <span style={{ flex: 1 }}>
            <Editable value={p} onChange={v => update(i, v)} style={{ fontSize: 13 }} />
          </span>
          <button onClick={() => remove(i)} style={{ fontSize: 10, color: "#f05252", background: "none", border: "none", cursor: "pointer", opacity: 0.5, padding: "0 2px", flexShrink: 0 }}>✕</button>
        </li>
      ))}
      <li style={{ listStyle: "none", marginTop: 4 }}>
        <button onClick={add} style={{ fontSize: 11, color: "#5046e4", background: "rgba(80,70,228,0.08)", border: "1px dashed rgba(80,70,228,0.35)", borderRadius: 4, padding: "2px 10px", cursor: "pointer" }}>+ add project</button>
      </li>
    </ul>
  )
}

/* ══════════════════════════════════════════════════
   SHARED SECTIONS
══════════════════════════════════════════════════ */

const Sections = ({ summary, experience, skills, projects, hClass = "sec-h", skipSkills = false, editable = false, onUpdate = () => {} }) => (
  <>
    {summary && (
      <div className="sec-block">
        <h2 className={hClass}>Professional Summary</h2>
        {editable
          ? <div className="sec-body"><Editable value={summary} onChange={v => onUpdate("summary", v)} multiline style={{ fontSize: 13, lineHeight: 1.7 }} /></div>
          : <p className="sec-body">{summary}</p>
        }
      </div>
    )}
    {experience && (
      <div className="sec-block">
        <h2 className={hClass}>Experience</h2>
        {editable
          ? <EditableList value={experience} onChange={v => onUpdate("experience", v)} />
          : <ul className="bul-list">{toBullets(experience)}</ul>
        }
      </div>
    )}
    {!skipSkills && skills && (
      <div className="sec-block">
        <h2 className={hClass}>Skills</h2>
        {editable
          ? <EditableList value={skills} onChange={v => onUpdate("skills", v)} />
          : <ul className="bul-list">{toBullets(skills)}</ul>
        }
      </div>
    )}
    {projects?.filter(Boolean).length > 0 && (
      <div className="sec-block">
        <h2 className={hClass}>Projects</h2>
        {editable
          ? <EditableProjects projects={projects} onChange={v => onUpdate("projects", v)} />
          : <ul className="bul-list">{projects.filter(Boolean).map((p, i) => <li key={i}>{p}</li>)}</ul>
        }
      </div>
    )}
  </>
)

/* ══════════════════════════════════════════════════
   10 TEMPLATES
══════════════════════════════════════════════════ */

const TplModern = ({ name, email, degree, editable, onUpdate, ...rest }) => (
  <div style={{ background: "#fff", minHeight: "100%" }}>
    <div style={{ padding: "38px 44px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 36, fontWeight: 700, color: "#5046e4", lineHeight: 1, letterSpacing: -0.5 }}>
            {editable ? <Editable value={name} onChange={v => onUpdate("name", v)} style={{ fontSize: 36, fontWeight: 700, color: "#5046e4", fontFamily: "'Playfair Display',serif" }} /> : name}
          </h1>
          {degree && <p style={{ fontSize: 13, color: "#666", marginTop: 7 }}>
            {editable ? <Editable value={degree} onChange={v => onUpdate("degree", v)} style={{ fontSize: 13, color: "#666" }} /> : degree}
          </p>}
        </div>
        {email && <p style={{ fontSize: 13, color: "#555", paddingTop: 4 }}>
          {editable ? <Editable value={email} onChange={v => onUpdate("email", v)} style={{ fontSize: 13, color: "#555" }} /> : email}
        </p>}
      </div>
      <div style={{ height: 3, margin: "14px 0 0", background: "linear-gradient(90deg,#5046e4,#38bdf8,transparent)", borderRadius: 2 }} />
    </div>
    <div style={{ padding: "6px 44px 44px" }}>
      <Sections {...rest} hClass="h-modern" editable={editable} onUpdate={onUpdate} />
    </div>
  </div>
)

const TplCorporate = ({ name, email, degree, editable, onUpdate, ...rest }) => (
  <div style={{ background: "#fff", minHeight: "100%" }}>
    <div style={{ background: "#162844", padding: "28px 36px" }}>
      <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 30, color: "#fff", fontWeight: 700, letterSpacing: -0.3 }}>
        {editable ? <Editable value={name} onChange={v => onUpdate("name", v)} style={{ fontSize: 30, color: "#fff", fontWeight: 700 }} /> : name}
      </h1>
      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", marginTop: 8 }}>
        {editable
          ? <><Editable value={email} onChange={v => onUpdate("email", v)} style={{ fontSize: 13, color: "rgba(255,255,255,0.65)" }} />  |  <Editable value={degree} onChange={v => onUpdate("degree", v)} style={{ fontSize: 13, color: "rgba(255,255,255,0.65)" }} /></>
          : [email, degree].filter(Boolean).join("  |  ")}
      </p>
    </div>
    <div style={{ padding: "18px 36px 44px" }}>
      <Sections {...rest} hClass="h-corporate" editable={editable} onUpdate={onUpdate} />
    </div>
  </div>
)

const TplHarvard = ({ name, email, degree, editable, onUpdate, ...rest }) => (
  <div style={{ background: "#fff", padding: "44px 48px", minHeight: "100%" }}>
    <div style={{ borderBottom: "2px solid #A51C30", paddingBottom: 14, marginBottom: 4 }}>
      <h1 style={{ fontFamily: "Georgia,serif", fontSize: 28, fontWeight: 700, color: "#111", letterSpacing: 0.2 }}>
        {editable ? <Editable value={name} onChange={v => onUpdate("name", v)} style={{ fontSize: 28, fontWeight: 700 }} /> : name}
      </h1>
      <p style={{ fontSize: 12.5, color: "#555", marginTop: 6, letterSpacing: 0.3 }}>
        {editable
          ? <><Editable value={email} onChange={v => onUpdate("email", v)} style={{ fontSize: 12.5 }} />  ·  <Editable value={degree} onChange={v => onUpdate("degree", v)} style={{ fontSize: 12.5 }} /></>
          : [email, degree].filter(Boolean).join("  ·  ")}
      </p>
    </div>
    <Sections {...rest} hClass="h-harvard" editable={editable} onUpdate={onUpdate} />
  </div>
)

const TplFaang = ({ name, email, degree, editable, onUpdate, ...rest }) => (
  <div style={{ background: "#fff", display: "flex", minHeight: "100%" }}>
    <div style={{ width: 5, background: "linear-gradient(180deg,#4285F4,#34A853,#FBBC05,#EA4335)", flexShrink: 0 }} />
    <div style={{ flex: 1, padding: "38px 40px 44px", fontFamily: "'Courier New',monospace" }}>
      <h1 style={{ fontSize: 26, fontWeight: 700, color: "#111", letterSpacing: -0.3 }}>
        {editable ? <Editable value={name} onChange={v => onUpdate("name", v)} style={{ fontSize: 26, fontWeight: 700 }} /> : name}
      </h1>
      <p style={{ fontSize: 12, color: "#444", marginTop: 6 }}>
        {editable
          ? <><Editable value={email} onChange={v => onUpdate("email", v)} style={{ fontSize: 12 }} />  //  <Editable value={degree} onChange={v => onUpdate("degree", v)} style={{ fontSize: 12 }} /></>
          : [email, degree].filter(Boolean).join("  //  ")}
      </p>
      <div style={{ height: 1, background: "#ddd", margin: "14px 0" }} />
      <Sections {...rest} hClass="h-faang" editable={editable} onUpdate={onUpdate} />
    </div>
  </div>
)

const TplBanking = ({ name, email, degree, editable, onUpdate, ...rest }) => (
  <div style={{ background: "#FAFAF8", padding: "50px 52px", minHeight: "100%", fontFamily: "Georgia,serif" }}>
    <div style={{ textAlign: "center", borderBottom: "2px solid #111", paddingBottom: 16, marginBottom: 4 }}>
      <h1 style={{ fontSize: 26, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "#111" }}>
        {editable ? <Editable value={name} onChange={v => onUpdate("name", v)} style={{ fontSize: 26, fontWeight: 700 }} /> : name}
      </h1>
      <p style={{ fontSize: 12, color: "#555", marginTop: 8, letterSpacing: 0.8 }}>
        {editable
          ? <><Editable value={email} onChange={v => onUpdate("email", v)} style={{ fontSize: 12 }} />   ·   <Editable value={degree} onChange={v => onUpdate("degree", v)} style={{ fontSize: 12 }} /></>
          : [email, degree].filter(Boolean).join("   ·   ")}
      </p>
    </div>
    <Sections {...rest} hClass="h-banking" editable={editable} onUpdate={onUpdate} />
  </div>
)

const TplAts = ({ name, email, degree, editable, onUpdate, ...rest }) => (
  <div style={{ background: "#fff", padding: "36px 40px", minHeight: "100%", fontFamily: "Arial,sans-serif" }}>
    <h1 style={{ fontSize: 20, fontWeight: 700, color: "#000" }}>
      {editable ? <Editable value={name} onChange={v => onUpdate("name", v)} style={{ fontSize: 20, fontWeight: 700 }} /> : name}
    </h1>
    <p style={{ fontSize: 12.5, color: "#333", marginTop: 5 }}>
      {editable
        ? <><Editable value={email} onChange={v => onUpdate("email", v)} style={{ fontSize: 12.5 }} /> | <Editable value={degree} onChange={v => onUpdate("degree", v)} style={{ fontSize: 12.5 }} /></>
        : [email, degree].filter(Boolean).join(" | ")}
    </p>
    <Sections {...rest} hClass="h-ats" editable={editable} onUpdate={onUpdate} />
  </div>
)

const TplCreative = ({ name, email, degree, skills, editable, onUpdate, ...rest }) => (
  <div style={{ display: "flex", minHeight: "100%", background: "#fff" }}>
    <div style={{ width: 210, flexShrink: 0, background: "#2c1d5e", padding: "30px 18px", color: "#fff" }}>
      <div style={{ width: 54, height: 54, borderRadius: "50%", background: "linear-gradient(135deg,#7c6ffa,#34d5c8)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Playfair Display',serif", fontSize: 24, color: "#fff", marginBottom: 14 }}>
        {name?.charAt(0) || "?"}
      </div>
      <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, color: "#fff", lineHeight: 1.25, wordBreak: "break-word" }}>
        {editable ? <Editable value={name} onChange={v => onUpdate("name", v)} style={{ fontSize: 18, color: "#fff" }} /> : name}
      </h1>
      {email  && <p style={{ fontSize: 11, color: "rgba(255,255,255,0.58)", marginTop: 7, wordBreak: "break-all" }}>
        {editable ? <Editable value={email} onChange={v => onUpdate("email", v)} style={{ fontSize: 11, color: "rgba(255,255,255,0.58)" }} /> : email}
      </p>}
      {degree && <p style={{ fontSize: 11, color: "rgba(255,255,255,0.58)", marginTop: 5 }}>
        {editable ? <Editable value={degree} onChange={v => onUpdate("degree", v)} style={{ fontSize: 11, color: "rgba(255,255,255,0.58)" }} /> : degree}
      </p>}
      {skills && <>
        <h3 style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1.2, color: "rgba(255,255,255,0.4)", margin: "22px 0 8px" }}>Skills</h3>
        <ul style={{ paddingLeft: 14, listStyle: "disc" }}>
          {toBullets(skills).map((li, i) => <li key={i} style={{ fontSize: 11.5, color: "rgba(255,255,255,0.76)", marginBottom: 5, lineHeight: 1.4 }}>{li.props.children}</li>)}
        </ul>
      </>}
    </div>
    <div style={{ flex: 1, padding: "26px 28px 44px" }}>
      <Sections {...rest} skills="" hClass="h-creative" skipSkills editable={editable} onUpdate={onUpdate} />
    </div>
  </div>
)

const TplMinimal = ({ name, email, degree, editable, onUpdate, ...rest }) => (
  <div style={{ background: "#fff", padding: "52px", minHeight: "100%" }}>
    <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 32, color: "#111", fontWeight: 700, letterSpacing: -0.5 }}>
      {editable ? <Editable value={name} onChange={v => onUpdate("name", v)} style={{ fontSize: 32, fontWeight: 700 }} /> : name}
    </h1>
    <p style={{ fontSize: 13, color: "#777", marginTop: 8 }}>
      {editable
        ? <><Editable value={email} onChange={v => onUpdate("email", v)} style={{ fontSize: 13, color: "#777" }} />  ·  <Editable value={degree} onChange={v => onUpdate("degree", v)} style={{ fontSize: 13, color: "#777" }} /></>
        : [email, degree].filter(Boolean).join("  ·  ")}
    </p>
    <div style={{ height: 1, background: "#e5e5e5", margin: "16px 0 4px" }} />
    <Sections {...rest} hClass="h-minimal" editable={editable} onUpdate={onUpdate} />
  </div>
)

const TplExecutive = ({ name, email, degree, editable, onUpdate, ...rest }) => (
  <div style={{ background: "#FDFCFA", minHeight: "100%" }}>
    <div style={{ textAlign: "center", padding: "44px 48px 24px" }}>
      <div style={{ width: 60, height: 1, background: "#c9a84c", margin: "0 auto 16px" }} />
      <h1 style={{ fontFamily: "'Playfair Display',serif", fontStyle: "italic", fontSize: 34, color: "#1a1208", letterSpacing: 0.5 }}>
        {editable ? <Editable value={name} onChange={v => onUpdate("name", v)} style={{ fontSize: 34 }} /> : name}
      </h1>
      <p style={{ fontSize: 12.5, color: "#8a7a5a", marginTop: 9, letterSpacing: 1.2 }}>
        {editable
          ? <><Editable value={email} onChange={v => onUpdate("email", v)} style={{ fontSize: 12.5 }} />   ·   <Editable value={degree} onChange={v => onUpdate("degree", v)} style={{ fontSize: 12.5 }} /></>
          : [email, degree].filter(Boolean).join("   ·   ")}
      </p>
      <div style={{ width: 60, height: 1, background: "#c9a84c", margin: "16px auto 0" }} />
    </div>
    <div style={{ padding: "0 50px 50px", textAlign: "left" }}>
      <Sections {...rest} hClass="h-executive" editable={editable} onUpdate={onUpdate} />
    </div>
  </div>
)

const TplTech = ({ name, email, degree, editable, onUpdate, ...rest }) => (
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
      <p style={{ color: "#58a6ff", fontSize: 13, marginBottom: 4 }}>
        # {editable ? <Editable value={name} onChange={v => onUpdate("name", v)} style={{ fontSize: 13, color: "#58a6ff" }} /> : name}
      </p>
      <p style={{ color: "#8b949e", fontSize: 12 }}>
        {editable
          ? <><Editable value={email} onChange={v => onUpdate("email", v)} style={{ fontSize: 12, color: "#8b949e" }} />  <Editable value={degree} onChange={v => onUpdate("degree", v)} style={{ fontSize: 12, color: "#8b949e" }} /></>
          : [email, degree].filter(Boolean).map(s => `> ${s}`).join("  ")}
      </p>
      <div style={{ height: 1, background: "#21262d", margin: "18px 0" }} />
      <Sections {...rest} hClass="h-tech" editable={editable} onUpdate={onUpdate} />
    </div>
  </div>
)

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
   SCORE PANEL
══════════════════════════════════════════════════ */

const scoreColor = (s) => s >= 75 ? "#30c97e" : s >= 50 ? "#f59e0b" : "#f05252"

const ScorePanel = ({ score, onClose }) => {
  if (!score) return null
  return (
    <div style={{ position: "fixed", right: 24, top: 80, width: 310, background: "#13151e", border: "1px solid #2e3245", borderRadius: 16, padding: "20px 22px", zIndex: 200, boxShadow: "0 24px 60px rgba(0,0,0,0.5)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: "#dde1f0", textTransform: "uppercase", letterSpacing: 0.8 }}>Resume Score</span>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "#6b7092", cursor: "pointer", fontSize: 16 }}>✕</button>
      </div>
      <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 52, fontWeight: 800, color: scoreColor(score.overall_score), lineHeight: 1, fontFamily: "Georgia,serif" }}>{score.overall_score}</div>
        <div>
          <div style={{ fontSize: 13, color: "#dde1f0", fontWeight: 600 }}>Overall Score</div>
          <div style={{ fontSize: 12, color: "#6b7092", marginTop: 2 }}>ATS Score: <span style={{ color: scoreColor(score.ats_score) }}>{score.ats_score}</span></div>
        </div>
      </div>
      {score.sections && Object.entries(score.sections).map(([k, v]) => (
        <div key={k} style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ fontSize: 11.5, color: "#8892b0", textTransform: "capitalize" }}>{k}</span>
            <span style={{ fontSize: 11.5, fontWeight: 700, color: scoreColor(v.score) }}>{v.score}</span>
          </div>
          <div style={{ height: 5, background: "#1e2235", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${v.score}%`, background: scoreColor(v.score), borderRadius: 3, transition: "width 0.8s ease" }} />
          </div>
          <div style={{ fontSize: 10.5, color: "#5a6488", marginTop: 3 }}>{v.feedback}</div>
        </div>
      ))}
      {score.top_issues?.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#f05252", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>⚠ Top Issues</div>
          {score.top_issues.map((issue, i) => <div key={i} style={{ fontSize: 12, color: "#fca5a5", marginBottom: 4 }}>· {issue}</div>)}
        </div>
      )}
      {score.quick_wins?.length > 0 && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#30c97e", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6 }}>✓ Quick Wins</div>
          {score.quick_wins.map((win, i) => <div key={i} style={{ fontSize: 12, color: "#b8f5d8", marginBottom: 4 }}>· {win}</div>)}
        </div>
      )}
    </div>
  )
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

  const [name,       setName]       = useState("")
  const [email,      setEmail]      = useState("")
  const [degree,     setDegree]     = useState("")
  const [summary,    setSummary]    = useState("")
  const [skills,     setSkills]     = useState("")
  const [experience, setExperience] = useState("")
  const [projects,   setProjects]   = useState([""])

  const [resume,       setResume]       = useState(false)
  const [loadingAI,    setLoadingAI]    = useState(false)
  const [loadingGen,   setLoadingGen]   = useState(false)
  const [loadingScore, setLoadingScore] = useState(false)
  const [activeTab,    setActiveTab]    = useState("basics")
  const [template,     setTemplate]     = useState("modern")
  const [toastMsg,     setToastMsg]     = useState("")
  const [editMode,     setEditMode]     = useState(false)
  const [scoreData,    setScoreData]    = useState(null)

  const [fontFamily, setFontFamily] = useState("Georgia, serif")
  const [fontSize,   setFontSize]   = useState(14)
  const [textColor,  setTextColor]  = useState("#111111")
  const [pageColor,  setPageColor]  = useState("#ffffff")

  const toast = (msg) => { setToastMsg(msg); setTimeout(() => setToastMsg(""), 3200) }

  const addProject    = () => setProjects([...projects, ""])
  const removeProject = (i) => setProjects(projects.filter((_, idx) => idx !== i))
  const updateProject = (i, v) => { const c = [...projects]; c[i] = v; setProjects(c) }

  const handleInlineUpdate = useCallback((field, value) => {
    if (field === "name")       setName(value)
    if (field === "email")      setEmail(value)
    if (field === "degree")     setDegree(value)
    if (field === "summary")    setSummary(value)
    if (field === "experience") setExperience(value)
    if (field === "skills")     setSkills(value)
    if (field === "projects")   setProjects(value)
  }, [])

  const generateResume = async () => {
    if (!name.trim()) { toast("Please enter your name first."); return }
    setLoadingGen(true)
    try {
      await axios.post("http://127.0.0.1:8000/resume/generate", { name, email, degree, summary, skills, experience, projects })
      setResume(true)
      toast("Resume generated! Click ✎ Edit to tweak text directly.")
    } catch {
      setResume(true)
      toast("Showing local preview — backend offline.")
    } finally { setLoadingGen(false) }
  }

  const enhanceResume = async () => {
    if (!summary && !experience && !skills) { toast("Add some content first!"); return }
    setLoadingAI(true)
    toast("AI is enhancing your resume…")
    try {
      const res = await axios.post("http://127.0.0.1:8000/resume/enhance", { name, email, degree, summary, skills, experience, projects })
      const d = res.data
      if (d.error) { toast("Enhancement failed: " + d.error); return }
      if (d.summary)    setSummary(stripBullets(d.summary))
      if (d.experience) setExperience(stripBullets(d.experience))
      if (d.skills)     setSkills(stripBullets(d.skills))
      if (d.projects)   setProjects(
        Array.isArray(d.projects)
          ? d.projects.map(p => stripBullets(String(p)))
          : [stripBullets(String(d.projects))]
      )
      setResume(true)
      toast("✦ AI enhancement applied!")
    } catch (err) {
      console.error(err)
      toast("Enhancement failed — check backend is running.")
    } finally { setLoadingAI(false) }
  }

  const scoreResume = async () => {
    if (!name.trim()) { toast("Generate your resume first."); return }
    setLoadingScore(true)
    try {
      const res = await axios.post("http://127.0.0.1:8000/resume/score", { name, email, degree, summary, skills, experience, projects })
      setScoreData(res.data)
    } catch {
      toast("Scoring failed — check backend.")
    } finally { setLoadingScore(false) }
  }

  const downloadPDF = () => {
    setEditMode(false)
    setTimeout(() => {
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
    }, 100)
  }

  const TplComponent = TEMPLATES[template]?.Component || TplModern
  const tplProps = { name, email, degree, summary, experience, skills, projects, editable: editMode, onUpdate: handleInlineUpdate }

  const TABS = [
    { id: "basics",     label: "Basics"     },
    { id: "experience", label: "Experience" },
    { id: "skills",     label: "Skills"     },
    { id: "projects",   label: "Projects"   },
    { id: "style",      label: "Style"      },
  ]

  return (
    <>
      {toastMsg && <div className="toast">{toastMsg}</div>}
      {scoreData && <ScorePanel score={scoreData} onClose={() => setScoreData(null)} />}

      <div className="app-shell">

        {/* LEFT PANEL */}
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
              <button key={t.id} className={`tab-btn ${activeTab === t.id ? "active" : ""}`} onClick={() => setActiveTab(t.id)}>{t.label}</button>
            ))}
          </nav>

          <div className="fields-scroll">
            {activeTab === "basics" && (
              <div className="fields-col">
                <Field label="Full Name">
                  <input className="inp" placeholder="e.g. Divit Shah" value={name} onChange={e => setName(e.target.value)} />
                </Field>
                <Field label="Email Address">
                  <input className="inp" placeholder="you@email.com" value={email} onChange={e => setEmail(e.target.value)} />
                </Field>
                <Field label="Degree / Education">
                  <input className="inp" placeholder="e.g. BSc Data Science, MIT" value={degree} onChange={e => setDegree(e.target.value)} />
                </Field>
                <Field label="Professional Summary" hint="2–4 sentences about your background and goals.">
                  <textarea className="inp ta" rows={5} placeholder="Motivated engineer with 2 years experience in..." value={summary} onChange={e => setSummary(e.target.value)} />
                </Field>
              </div>
            )}
            {activeTab === "experience" && (
              <div className="fields-col">
                <Field label="Work Experience" hint="Each new line becomes one bullet point on your resume.">
                  <textarea className="inp ta" rows={12} placeholder={"Financial Analyst at Acme Corp (2023–2024)\nBuilt DCF models for 20+ equity research pitches"} value={experience} onChange={e => setExperience(e.target.value)} />
                </Field>
              </div>
            )}
            {activeTab === "skills" && (
              <div className="fields-col">
                <Field label="Skills" hint="Each new line becomes one bullet. Group by category if you like.">
                  <textarea className="inp ta" rows={12} placeholder={"Python · SQL · Excel\nData Analysis · Power BI"} value={skills} onChange={e => setSkills(e.target.value)} />
                </Field>
              </div>
            )}
            {activeTab === "projects" && (
              <div className="fields-col">
                <Field label="Projects" hint="Each card is one project entry.">
                  {projects.map((project, index) => (
                    <div key={index} className="project-row">
                      <input className="inp project-inp" placeholder={`Project ${index + 1}`} value={project} onChange={e => updateProject(index, e.target.value)} />
                      {projects.length > 1 && <button className="remove-btn" onClick={() => removeProject(index)}>✕</button>}
                    </div>
                  ))}
                  <button className="add-btn" onClick={addProject}>+ Add Project</button>
                </Field>
              </div>
            )}
            {activeTab === "style" && (
              <div className="fields-col">
                <Field label="Font Family">
                  <select className="inp" value={fontFamily} onChange={e => setFontFamily(e.target.value)}>
                    <option value="Georgia, serif">Georgia (Classic)</option>
                    <option value="'Times New Roman', serif">Times New Roman</option>
                    <option value="'Courier New', monospace">Courier New (Technical)</option>
                    <option value="Arial, sans-serif">Arial (Modern Clean)</option>
                    <option value="Verdana, sans-serif">Verdana (Readable)</option>
                    <option value="Garamond, serif">Garamond (Elegant)</option>
                  </select>
                </Field>
                <Field label={`Font Size — ${fontSize}px`}>
                  <input type="range" min="11" max="18" value={fontSize} onChange={e => setFontSize(Number(e.target.value))} className="slider" />
                </Field>
                <Field label="Text Color">
                  <div className="color-row">
                    <input type="color" value={textColor} onChange={e => setTextColor(e.target.value)} className="color-swatch" />
                    <span className="color-val">{textColor}</span>
                  </div>
                </Field>
                <Field label="Page Background">
                  <div className="color-row">
                    <input type="color" value={pageColor} onChange={e => setPageColor(e.target.value)} className="color-swatch" />
                    <span className="color-val">{pageColor}</span>
                  </div>
                </Field>
                <div className="style-note">💡 Style changes apply live. Tech/Dark template ignores page background by design.</div>
              </div>
            )}
          </div>

          <div className="action-bar">
            <button className="btn-enhance" onClick={enhanceResume} disabled={loadingAI}>
              {loadingAI ? <><span className="spinner" /> Enhancing…</> : <><span>✦</span> Enhance with AI</>}
            </button>
            <button className="btn-generate" onClick={generateResume} disabled={loadingGen}>
              {loadingGen ? "Generating…" : "Preview Resume →"}
            </button>
          </div>
        </aside>

        {/* RIGHT PANEL */}
        <section className="right-panel">
          <div className="toolbar">
            <div className="toolbar-left">
              <span className="tb-label">Template</span>
              <div className="tpl-chip-group">
                {Object.entries(TEMPLATES).map(([key, { label }]) => (
                  <button key={key} className={`tpl-chip ${template === key ? "active" : ""}`} onClick={() => setTemplate(key)}>{label}</button>
                ))}
              </div>
            </div>
            <div className="toolbar-right">
              {resume && (
                <button
                  onClick={() => { setEditMode(e => !e); toast(editMode ? "Edit mode off" : "✎ Click any text on the resume to edit it directly!") }}
                  style={{ padding: "6px 14px", background: editMode ? "rgba(80,70,228,0.2)" : "rgba(255,255,255,0.05)", border: `1px solid ${editMode ? "#5046e4" : "rgba(255,255,255,0.12)"}`, borderRadius: 8, color: editMode ? "#a99dfc" : "#6b7092", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font)", whiteSpace: "nowrap" }}
                >
                  {editMode ? "✎ Editing" : "✎ Edit"}
                </button>
              )}
              {resume && (
                <button onClick={scoreResume} disabled={loadingScore}
                  style={{ padding: "6px 14px", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 8, color: "#f59e0b", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "var(--font)", whiteSpace: "nowrap" }}>
                  {loadingScore ? "Scoring…" : "⭐ Score"}
                </button>
              )}
              <button className="btn-dl" onClick={downloadPDF} disabled={!resume}>↓ PDF</button>
            </div>
          </div>

          {editMode && resume && (
            <div style={{ padding: "8px 18px", background: "rgba(80,70,228,0.1)", borderBottom: "1px solid rgba(80,70,228,0.2)", fontSize: 12, color: "#a99dfc", display: "flex", alignItems: "center", gap: 8 }}>
              <span>✎</span>
              <span><strong>Edit mode active</strong> — click any underlined text on the resume to edit it directly.</span>
              <button onClick={() => setEditMode(false)} style={{ marginLeft: "auto", background: "none", border: "none", color: "#7c6ffa", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Done editing</button>
            </div>
          )}

          <div className="preview-area">
            {!resume ? (
              <div className="empty-state">
                <div className="empty-icon">📄</div>
                <h3>Your resume will appear here</h3>
                <p>Fill in your details on the left, then click <strong>Preview Resume</strong></p>
                <div className="empty-steps">
                  <span>① Fill Basics</span><span className="arr">→</span>
                  <span>② Enhance with AI</span><span className="arr">→</span>
                  <span>③ Click ✎ Edit to fine-tune</span><span className="arr">→</span>
                  <span>④ Download PDF</span>
                </div>
              </div>
            ) : (
              <div id="resume-preview" className="resume-sheet" style={{ fontFamily, fontSize: fontSize + "px", color: textColor, backgroundColor: pageColor }}>
                <TplComponent {...tplProps} />
              </div>
            )}
          </div>
        </section>
      </div>
    </>
  )
}
