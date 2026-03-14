import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Link } from "react-router-dom"
import { ArrowLeft, Calendar, Target, CheckCircle, Clock, Brain, Zap, BookOpen, Star, ChevronDown, ChevronUp } from "lucide-react"

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  .sch-page { min-height:100vh; background:#080a12; color:#dde1f0; font-family:'DM Sans',sans-serif; }
  .sch-topbar { display:flex; align-items:center; justify-content:space-between; padding:14px 28px; border-bottom:1px solid rgba(255,255,255,0.06); background:rgba(8,10,18,0.95); backdrop-filter:blur(14px); position:sticky; top:0; z-index:10; }
  .sch-body { max-width:960px; margin:0 auto; padding:40px 24px 80px; }
  .sch-inp { width:100%; padding:13px 16px; background:#1a1d2e; border:1.5px solid #2e3450; border-radius:10px; color:#fff; font-family:'DM Sans',sans-serif; font-size:15px; outline:none; transition:border-color .2s; }
  .sch-inp:focus { border-color:#7c6ffa; box-shadow:0 0 0 3px rgba(124,111,250,0.12); }
  .sch-inp::placeholder { color:#4a5070; }
  .day-card { background:#0c0e1a; border:1px solid #1e2235; border-radius:14px; overflow:hidden; margin-bottom:10px; transition:border-color .2s; }
  .day-card:hover { border-color:rgba(124,111,250,0.25); }
  .day-header { display:flex; align-items:center; gap:14px; padding:16px 20px; cursor:pointer; }
  .day-body { padding:0 20px 18px; display:none; }
  .day-body.open { display:block; }
  .task-row { display:flex; align-items:flex-start; gap:12px; padding:10px 0; border-bottom:1px solid rgba(255,255,255,0.04); }
  .task-row:last-child { border-bottom:none; }
  .task-check { width:20px; height:20px; border-radius:5px; border:1.5px solid #2e3450; background:#13152a; cursor:pointer; flex-shrink:0; margin-top:1px; display:flex; align-items:center; justify-content:center; transition:all .15s; }
  .task-check.done { background:#30c97e; border-color:#30c97e; }
  .sch-btn { display:flex; align-items:center; justify-content:center; gap:8px; padding:14px 28px; background:linear-gradient(135deg,#5b4fd4,#7c6ffa); border:none; border-radius:12px; color:#fff; font-family:'DM Sans',sans-serif; font-size:16px; font-weight:700; cursor:pointer; transition:opacity .2s; box-shadow:0 4px 24px rgba(124,111,250,0.3); }
  .sch-btn:hover { opacity:0.9; }
  @keyframes sch-spin { to { transform:rotate(360deg); } }
`

// ── Day plan generator (pure JS, zero API calls) ──────────────
const TYPE_COLORS = {
  behavioural: { color:"#7c6ffa", bg:"rgba(124,111,250,0.12)", label:"Behavioural", icon:"👥" },
  technical:   { color:"#34d5c8", bg:"rgba(52,213,200,0.12)",  label:"Technical",   icon:"⚙️" },
  case:        { color:"#f59e0b", bg:"rgba(245,158,11,0.12)",  label:"Case Study",  icon:"📋" },
  mcq:         { color:"#a78bfa", bg:"rgba(167,139,250,0.12)", label:"MCQ Drill",   icon:"🔢" },
  review:      { color:"#30c97e", bg:"rgba(48,201,126,0.12)",  label:"Full Review", icon:"🔁" },
  rest:        { color:"#5a6488", bg:"rgba(90,100,136,0.12)",  label:"Rest Day",    icon:"😴" },
}

const RESOURCES = {
  behavioural: ["Review your top 5 career stories", "Practise STAR structure out loud", "Prep for: Tell me about yourself, greatest weakness, conflict at work"],
  technical:   ["Revise core concepts for your role", "Practise explaining things simply", "Do 3 technical questions on SensAI"],
  case:        ["Study a framework: MECE, Issue Tree, 4Ps", "Walk through a case out loud", "Do 2 case study questions on SensAI"],
  mcq:         ["Do a 10-question MCQ drill on SensAI", "Review any wrong answers carefully", "Focus on definitions and key terminology"],
  review:      ["Do a full 10-question mixed mock on SensAI", "Export your report and identify top 3 gaps", "Re-practise your 2 weakest question types"],
  rest:        ["No prep today — let it consolidate", "Light reading about your target company is fine", "Get good sleep — it matters for performance"],
}

function buildPlan(daysUntil, jobRole, company) {
  const plan = []
  if (daysUntil <= 0) return plan

  const sequence = ["behavioural", "technical", "case", "mcq", "review", "rest"]

  for (let d = 0; d < daysUntil; d++) {
    const isLast  = d === daysUntil - 1
    const isRest  = daysUntil > 5 && d > 0 && d % 6 === 5
    const isFinal = isLast

    let focus
    if (isFinal)     focus = "review"
    else if (isRest) focus = "rest"
    else             focus = sequence[d % 5] // cycle through real types

    const meta = TYPE_COLORS[focus]
    const tasks = RESOURCES[focus].map(t => t.replace("your role", jobRole || "your role").replace("your target company", company || "your target company"))

    plan.push({
      day: d + 1,
      date: (() => {
        const dt = new Date()
        dt.setDate(dt.getDate() + d)
        return dt.toLocaleDateString("en-GB", { weekday:"short", day:"numeric", month:"short" })
      })(),
      focus, meta, tasks,
      isToday: d === 0,
      isFinal,
      sessionLink: focus !== "rest" ? `/interview` : null,
    })
  }
  return plan
}

const scoreColor = s => s >= 8 ? "#30c97e" : s >= 6 ? "#34d5c8" : s >= 4 ? "#f59e0b" : "#f05252"

export default function InterviewScheduler() {
  const [interviewDate, setInterviewDate] = useState("")
  const [jobRole,       setJobRole]       = useState("")
  const [company,       setCompany]       = useState("")
  const [plan,          setPlan]          = useState([])
  const [generated,     setGenerated]     = useState(false)
  const [openDays,      setOpenDays]      = useState({})
  const [doneTasks,     setDoneTasks]     = useState({})
  const [history,       setHistory]       = useState([])

  useEffect(() => {
    const id = "sch-css"
    if (!document.getElementById(id)) {
      const el = document.createElement("style"); el.id = id
      el.textContent = CSS; document.head.appendChild(el)
    }
    // load saved plan from localStorage
    const saved = localStorage.getItem("sch_plan")
    const savedDone = localStorage.getItem("sch_done")
    if (saved) {
      const p = JSON.parse(saved)
      setPlan(p.plan || []); setJobRole(p.jobRole || ""); setCompany(p.company || "")
      setInterviewDate(p.interviewDate || ""); setGenerated(true)
      const firstOpen = {}; firstOpen[0] = true; setOpenDays(firstOpen)
    }
    if (savedDone) setDoneTasks(JSON.parse(savedDone))
    // load session history for score context
    const email = localStorage.getItem("userEmail") || ""
    if (email) {
      import("axios").then(({ default: axios }) => {
        axios.get(`http://127.0.0.1:8000/interview/history/${email}`)
          .then(r => setHistory(r.data.sessions || [])).catch(() => {})
      })
    }
  }, [])

  const generate = () => {
    if (!interviewDate) return
    const today = new Date(); today.setHours(0,0,0,0)
    const target = new Date(interviewDate); target.setHours(0,0,0,0)
    const diff = Math.round((target - today) / (1000*60*60*24))
    if (diff < 1) { alert("Please pick a future date."); return }
    const p = buildPlan(Math.min(diff, 30), jobRole, company)
    setPlan(p); setGenerated(true)
    const firstOpen = {}; firstOpen[0] = true; setOpenDays(firstOpen)
    localStorage.setItem("sch_plan", JSON.stringify({ plan: p, jobRole, company, interviewDate }))
  }

  const toggleDay = i => setOpenDays(prev => ({ ...prev, [i]: !prev[i] }))

  const toggleTask = (dayIdx, taskIdx) => {
    const key = `${dayIdx}-${taskIdx}`
    setDoneTasks(prev => {
      const next = { ...prev, [key]: !prev[key] }
      localStorage.setItem("sch_done", JSON.stringify(next))
      return next
    })
  }

  const today = new Date(); today.setHours(0,0,0,0)
  const target = interviewDate ? (() => { const d = new Date(interviewDate); d.setHours(0,0,0,0); return d })() : null
  const daysLeft = target ? Math.max(0, Math.round((target - today) / (1000*60*60*24))) : null
  const avgScore = history.length ? (history.slice(0,5).reduce((a,s) => a + s.overall_score, 0) / Math.min(history.length,5)).toFixed(1) : null
  const totalDone = Object.values(doneTasks).filter(Boolean).length
  const totalTasks = plan.reduce((a,d) => a + d.tasks.length, 0)

  const minDate = new Date(); minDate.setDate(minDate.getDate() + 1)
  const minStr = minDate.toISOString().split("T")[0]

  return (
    <div className="sch-page">
      <header className="sch-topbar">
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <Link to="/dashboard" style={{ textDecoration:"none" }}>
            <button style={{ display:"flex", alignItems:"center", gap:7, padding:"9px 18px", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:9, color:"#9aa0b8", fontSize:14, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
              <ArrowLeft size={15} />Dashboard
            </button>
          </Link>
          <div style={{ width:1, height:22, background:"rgba(255,255,255,0.08)" }} />
          <div style={{ width:32, height:32, borderRadius:9, background:"linear-gradient(135deg,#7c6ffa,#34d5c8)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:15, color:"#fff" }}>S</div>
          <span style={{ fontFamily:"'Playfair Display',serif", fontSize:17, fontWeight:700, color:"#fff" }}>Interview Scheduler</span>
        </div>
        {daysLeft !== null && (
          <div style={{ display:"flex", alignItems:"center", gap:8, padding:"8px 18px", background:"rgba(124,111,250,0.1)", border:"1px solid rgba(124,111,250,0.25)", borderRadius:22 }}>
            <Clock size={15} color="#7c6ffa" />
            <span style={{ fontSize:15, fontWeight:700, color:"#a99dfc" }}>{daysLeft} day{daysLeft!==1?"s":""} to go</span>
          </div>
        )}
      </header>

      <div className="sch-body">

        {/* ── Setup card ── */}
        <motion.div style={{ background:"#0c0e1a", border:"1px solid #1e2235", borderRadius:20, padding:"32px", marginBottom:28 }}
          initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}>
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:28, color:"#fff", marginBottom:8 }}>📅 Interview Prep Scheduler</h1>
          <p style={{ fontSize:15, color:"#5a6488", marginBottom:28, lineHeight:1.7 }}>
            Enter your interview date and we'll build a personalised day-by-day prep plan. Your progress is saved automatically.
          </p>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14, marginBottom:20 }}>
            <div>
              <label style={{ fontSize:12, fontWeight:700, textTransform:"uppercase", letterSpacing:0.9, color:"#6b7280", display:"block", marginBottom:8 }}>Interview Date *</label>
              <input className="sch-inp" type="date" min={minStr}
                value={interviewDate} onChange={e => setInterviewDate(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:700, textTransform:"uppercase", letterSpacing:0.9, color:"#6b7280", display:"block", marginBottom:8 }}>Job Role</label>
              <input className="sch-inp" placeholder="e.g. Investment Banking Analyst"
                value={jobRole} onChange={e => setJobRole(e.target.value)} />
            </div>
            <div>
              <label style={{ fontSize:12, fontWeight:700, textTransform:"uppercase", letterSpacing:0.9, color:"#6b7280", display:"block", marginBottom:8 }}>Company</label>
              <input className="sch-inp" placeholder="e.g. Goldman Sachs"
                value={company} onChange={e => setCompany(e.target.value)} />
            </div>
          </div>

          <button className="sch-btn" onClick={generate}>
            <Calendar size={18} />
            {generated ? "Regenerate Plan" : "Build My Prep Plan"}
          </button>
        </motion.div>

        {/* ── Stats strip ── */}
        {generated && (
          <motion.div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:28 }}
            initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }}>
            {[
              { label:"Days until interview", value: daysLeft ?? "—", color:"#7c6ffa" },
              { label:"Tasks completed",  value: `${totalDone}/${totalTasks}`, color:"#30c97e" },
              { label:"Prep days planned", value: plan.length, color:"#34d5c8" },
              { label:"Recent avg score",  value: avgScore ? `${avgScore}/10` : "—", color: avgScore ? scoreColor(+avgScore) : "#5a6488" },
            ].map(s => (
              <div key={s.label} style={{ background:"#0c0e1a", border:"1px solid #1e2235", borderRadius:14, padding:"18px 20px" }}>
                <div style={{ fontSize:28, fontWeight:800, fontFamily:"'Playfair Display',serif", color:s.color }}>{s.value}</div>
                <div style={{ fontSize:13, color:"#5a6488", marginTop:4 }}>{s.label}</div>
              </div>
            ))}
          </motion.div>
        )}

        {/* ── Progress bar ── */}
        {generated && totalTasks > 0 && (
          <motion.div style={{ marginBottom:24 }} initial={{ opacity:0 }} animate={{ opacity:1 }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
              <span style={{ fontSize:13, color:"#5a6488" }}>Overall prep progress</span>
              <span style={{ fontSize:13, fontWeight:700, color:"#30c97e" }}>{Math.round((totalDone/totalTasks)*100)}%</span>
            </div>
            <div style={{ height:7, background:"#1e2235", borderRadius:4, overflow:"hidden" }}>
              <motion.div style={{ height:"100%", background:"linear-gradient(90deg,#7c6ffa,#30c97e)", borderRadius:4 }}
                initial={{ width:0 }} animate={{ width:`${(totalDone/totalTasks)*100}%` }} transition={{ duration:0.8 }} />
            </div>
          </motion.div>
        )}

        {/* ── Day plan ── */}
        {generated && plan.length > 0 && (
          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:22, color:"#fff", marginBottom:16 }}>
              Your {plan.length}-Day Prep Plan
            </h2>
            {plan.map((day, di) => {
              const isOpen = !!openDays[di]
              const dayDone = day.tasks.filter((_, ti) => doneTasks[`${di}-${ti}`]).length
              const allDone = dayDone === day.tasks.length

              return (
                <div key={di} className="day-card" style={{
                  borderColor: day.isToday ? `${day.meta.color}55` : allDone ? "rgba(48,201,126,0.25)" : "#1e2235",
                  background: day.isToday ? `rgba(${day.focus==="behavioural"?"124,111,250":day.focus==="technical"?"52,213,200":day.focus==="case"?"245,158,11":"167,139,250"},0.04)` : "#0c0e1a",
                }}>
                  <div className="day-header" onClick={() => toggleDay(di)}>
                    {/* Day number badge */}
                    <div style={{ width:42, height:42, borderRadius:11, background:day.meta.bg, border:`1px solid ${day.meta.color}40`, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <span style={{ fontSize:11, fontWeight:800, color:day.meta.color, textAlign:"center", lineHeight:1.2 }}>D{day.day}</span>
                    </div>

                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
                        <span style={{ fontSize:15, fontWeight:700, color:"#dde1f0" }}>{day.meta.icon} {day.meta.label}</span>
                        {day.isToday && <span style={{ fontSize:11, fontWeight:700, padding:"2px 10px", background:"rgba(124,111,250,0.15)", border:"1px solid rgba(124,111,250,0.3)", borderRadius:20, color:"#a99dfc" }}>TODAY</span>}
                        {day.isFinal && <span style={{ fontSize:11, fontWeight:700, padding:"2px 10px", background:"rgba(245,158,11,0.12)", border:"1px solid rgba(245,158,11,0.3)", borderRadius:20, color:"#f59e0b" }}>INTERVIEW DAY -1</span>}
                        {allDone && <span style={{ fontSize:11, fontWeight:700, padding:"2px 10px", background:"rgba(48,201,126,0.1)", border:"1px solid rgba(48,201,126,0.25)", borderRadius:20, color:"#30c97e" }}>✓ Done</span>}
                      </div>
                      <div style={{ fontSize:13, color:"#5a6488", marginTop:3 }}>{day.date} · {dayDone}/{day.tasks.length} tasks</div>
                    </div>

                    {/* Progress mini bar */}
                    <div style={{ width:60, height:5, background:"#1e2235", borderRadius:3, overflow:"hidden", flexShrink:0 }}>
                      <div style={{ height:"100%", background:day.meta.color, borderRadius:3, width:`${(dayDone/day.tasks.length)*100}%`, transition:"width .4s" }} />
                    </div>

                    {isOpen ? <ChevronUp size={16} color="#5a6488" /> : <ChevronDown size={16} color="#5a6488" />}
                  </div>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div initial={{ height:0, opacity:0 }} animate={{ height:"auto", opacity:1 }} exit={{ height:0, opacity:0 }} style={{ overflow:"hidden" }}>
                        <div style={{ padding:"0 20px 18px" }}>
                          {day.tasks.map((task, ti) => {
                            const done = !!doneTasks[`${di}-${ti}`]
                            return (
                              <div key={ti} className="task-row">
                                <div className={`task-check ${done?"done":""}`} onClick={() => toggleTask(di, ti)}>
                                  {done && <CheckCircle size={13} color="#fff" />}
                                </div>
                                <span style={{ fontSize:14.5, color: done ? "#4a5070" : "#c0c8e0", lineHeight:1.65, textDecoration: done ? "line-through" : "none", transition:"color .2s" }}>{task}</span>
                              </div>
                            )
                          })}
                          {day.sessionLink && (
                            <Link to={day.sessionLink} style={{ textDecoration:"none" }}>
                              <button style={{ marginTop:14, display:"flex", alignItems:"center", gap:8, padding:"9px 20px", background:`${day.meta.color}18`, border:`1px solid ${day.meta.color}40`, borderRadius:9, color:day.meta.color, fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
                                <Brain size={15} />Start {day.meta.label} session on SensAI →
                              </button>
                            </Link>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </motion.div>
        )}

        {/* ── Interview day tips ── */}
        {generated && (
          <motion.div style={{ marginTop:28, background:"rgba(124,111,250,0.05)", border:"1px solid rgba(124,111,250,0.18)", borderRadius:16, padding:"24px" }}
            initial={{ opacity:0 }} animate={{ opacity:1, transition:{ delay:0.3 } }}>
            <h3 style={{ fontSize:14, fontWeight:700, color:"#7c6ffa", textTransform:"uppercase", letterSpacing:0.9, marginBottom:16 }}>🏆 Interview Day Checklist</h3>
            {[
              "Sleep at least 7 hours the night before",
              "Review your top 3 STAR stories one final time — don't cram new material",
              "Research your interviewer on LinkedIn if you know who it is",
              "Prepare 3 thoughtful questions to ask them",
              "Arrive or log in 10 minutes early",
              "Slow down — most candidates speak too fast when nervous",
            ].map((tip, i) => (
              <div key={i} style={{ display:"flex", gap:12, marginBottom:10 }}>
                <div style={{ width:22, height:22, borderRadius:"50%", background:"rgba(124,111,250,0.14)", border:"1px solid rgba(124,111,250,0.3)", color:"#7c6ffa", fontSize:11, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{i+1}</div>
                <span style={{ fontSize:14.5, color:"#c0c8e0", lineHeight:1.65 }}>{tip}</span>
              </div>
            ))}
          </motion.div>
        )}

      </div>
    </div>
  )
}