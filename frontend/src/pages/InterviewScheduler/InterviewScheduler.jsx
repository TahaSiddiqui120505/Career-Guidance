import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Link } from "react-router-dom"
import axios from "axios"
import "./InterviewScheduler.css"
import {
  ArrowLeft, Calendar, CheckCircle, Clock, Brain, ArrowRight,
  ChevronDown, ChevronUp, Target, BookOpen, Zap, Star,
  TrendingUp, Award, RefreshCw, Play, Lock, AlertCircle
} from "lucide-react"

const API   = "http://127.0.0.1:8000"
const ADAPT = `${API}/adaptive`

// ── CSS ───────────────────────────────────────────────────────
// ── Static scheduler data ─────────────────────────────────────
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
  const sequence = ["behavioural","technical","case","mcq","review","rest"]
  for (let d = 0; d < daysUntil; d++) {
    const isFinal = d === daysUntil - 1
    const isRest  = daysUntil > 5 && d > 0 && d % 6 === 5
    let focus = isFinal ? "review" : isRest ? "rest" : sequence[d % 5]
    const meta  = TYPE_COLORS[focus]
    const tasks = RESOURCES[focus].map(t =>
      t.replace("your role", jobRole || "your role").replace("your target company", company || "your target company")
    )
    plan.push({
      day: d + 1,
      date: (() => {
        const dt = new Date(); dt.setDate(dt.getDate() + d)
        return dt.toLocaleDateString("en-GB", { weekday:"short", day:"numeric", month:"short" })
      })(),
      focus, meta, tasks, isToday: d === 0, isFinal,
      sessionLink: focus !== "rest" ? "/interview" : null,
    })
  }
  return plan
}

const scoreColor = s => s >= 75 ? "#30c97e" : s >= 50 ? "#f59e0b" : "#f05252"
const Spin = () => <span className="spin" />

const priorityMeta = {
  critical: { color:"#f05252", bg:"rgba(240,82,82,0.1)", border:"rgba(240,82,82,0.25)" },
  high:     { color:"#f59e0b", bg:"rgba(245,158,11,0.1)", border:"rgba(245,158,11,0.25)" },
  medium:   { color:"#34d5c8", bg:"rgba(52,213,200,0.1)", border:"rgba(52,213,200,0.25)" },
}

export default function InterviewScheduler() {
  // ── CSS inject ──
  useEffect(() => {
    const id = "sch-css"
    // CSS loaded via import
  }, [])

  // ── Active tab: "scheduler" | "adaptive" ──
  const [tab, setTab] = useState("scheduler")

  // ── Scheduler state ──
  const [interviewDate, setInterviewDate] = useState("")
  const [jobRole,       setJobRole]       = useState("")
  const [company,       setCompany]       = useState("")
  const [plan,          setPlan]          = useState([])
  const [generated,     setGenerated]     = useState(false)
  const [openDays,      setOpenDays]      = useState({})
  const [doneTasks,     setDoneTasks]     = useState({})
  const [history,       setHistory]       = useState([])

  // ── Adaptive learning state ──
  const [adaptTab,       setAdaptTab]       = useState("setup")
  const [adaptRole,      setAdaptRole]      = useState("")
  const [adaptCompany,   setAdaptCompany]   = useState("")
  const [adaptExp,       setAdaptExp]       = useState("mid")
  const [diagnostic,     setDiagnostic]     = useState(null)
  const [diagAnswers,    setDiagAnswers]    = useState({})
  const [diagSubmitted,  setDiagSubmitted]  = useState(false)
  const [learningProfile,setLearningProfile]= useState(null)
  const [topicProgress,  setTopicProgress]  = useState({})
  const [activeTopic,    setActiveTopic]    = useState(null)
  const [topicNotes,     setTopicNotes]     = useState(null)
  const [topicTest,      setTopicTest]      = useState(null)
  const [testAnswers,    setTestAnswers]    = useState({})
  const [testSubmitted,  setTestSubmitted]  = useState(false)
  const [testResult,     setTestResult]     = useState(null)
  const [savedProfiles,  setSavedProfiles]  = useState([])

  // ── Loading flags ──
  const [loadDiag,     setLoadDiag]     = useState(false)
  const [loadEval,     setLoadEval]     = useState(false)
  const [loadNotes,    setLoadNotes]    = useState(false)
  const [loadTest,     setLoadTest]     = useState(false)
  const [loadTestEval, setLoadTestEval] = useState(false)

  const userEmail = localStorage.getItem("userEmail") || ""

  useEffect(() => {
    const saved     = localStorage.getItem("sch_plan")
    const savedDone = localStorage.getItem("sch_done")
    if (saved) {
      const p = JSON.parse(saved)
      setPlan(p.plan||[]); setJobRole(p.jobRole||""); setCompany(p.company||"")
      setInterviewDate(p.interviewDate||""); setGenerated(true)
      setOpenDays({ 0: true })
    }
    if (savedDone) setDoneTasks(JSON.parse(savedDone))
    if (userEmail) {
      axios.get(`${API}/interview/history/${userEmail}`)
        .then(r => setHistory(r.data.sessions||[])).catch(()=>{})
      axios.get(`${ADAPT}/profiles/${userEmail}`)
        .then(r => setSavedProfiles(r.data.profiles||[])).catch(()=>{})
    }
  }, [userEmail])

  // ── Scheduler functions ──
  const generate = () => {
    if (!interviewDate) return
    const today  = new Date(); today.setHours(0,0,0,0)
    const target = new Date(interviewDate); target.setHours(0,0,0,0)
    const diff   = Math.round((target - today) / (1000*60*60*24))
    if (diff < 1) { alert("Please pick a future date."); return }
    const p = buildPlan(Math.min(diff, 30), jobRole, company)
    setPlan(p); setGenerated(true); setOpenDays({0:true})
    localStorage.setItem("sch_plan", JSON.stringify({plan:p, jobRole, company, interviewDate}))
  }
  const toggleDay  = i => setOpenDays(prev => ({...prev, [i]:!prev[i]}))
  const toggleTask = (di, ti) => setDoneTasks(prev => {
    const key  = `${di}-${ti}`
    const next = {...prev, [key]:!prev[key]}
    localStorage.setItem("sch_done", JSON.stringify(next))
    return next
  })

  const today2    = new Date(); today2.setHours(0,0,0,0)
  const targetDt  = interviewDate ? (() => { const d=new Date(interviewDate); d.setHours(0,0,0,0); return d })() : null
  const daysLeft  = targetDt ? Math.max(0, Math.round((targetDt - today2) / (1000*60*60*24))) : null
  const totalDone = Object.values(doneTasks).filter(Boolean).length
  const totalTasks= plan.reduce((a, d) => a + d.tasks.length, 0)
  const userAvg   = history.length
    ? (history.slice(0,5).reduce((a,s) => a+(s.overall_score||0), 0) / Math.min(history.length,5)).toFixed(1)
    : null
  const minDate = new Date(); minDate.setDate(minDate.getDate()+1)
  const minStr  = minDate.toISOString().split("T")[0]

  // ── Adaptive functions ──
  const startDiagnostic = async () => {
    if (!adaptRole.trim() || !adaptCompany.trim()) return
    setLoadDiag(true); setDiagnostic(null); setDiagAnswers({}); setDiagSubmitted(false)
    try {
      const r = await axios.post(`${ADAPT}/diagnostic/generate`, {
        job_role: adaptRole, company: adaptCompany,
        user_email: userEmail, experience_level: adaptExp,
      })
      setDiagnostic(r.data.diagnostic)
      setAdaptTab("diagnostic")
    } catch { alert("Failed to generate diagnostic. Is the backend running?") }
    finally { setLoadDiag(false) }
  }

  const loadExistingProfile = (profile) => {
    setAdaptRole(profile.job_role); setAdaptCompany(profile.company)
    setLearningProfile(profile.profile)
    setTopicProgress(profile.topic_progress||{})
    setAdaptTab("profile")
  }

  const submitDiagnostic = async () => {
    const qas = diagnostic.questions.map(q => ({
      question: q.question, q_type: q.q_type, answer: diagAnswers[q.id] || "",
    }))
    const unanswered = qas.filter(q => !q.answer.trim()).length
    if (unanswered > 0) { alert(`Please answer all questions (${unanswered} remaining).`); return }
    setLoadEval(true)
    try {
      const r = await axios.post(`${ADAPT}/diagnostic/evaluate`, {
        user_email: userEmail, job_role: adaptRole,
        company: adaptCompany, qa_pairs: qas, experience_level: adaptExp,
      })
      setLearningProfile(r.data.profile)
      setTopicProgress(r.data.topic_progress||{})
      setDiagSubmitted(true); setAdaptTab("profile")
      axios.get(`${ADAPT}/profiles/${userEmail}`)
        .then(r2 => setSavedProfiles(r2.data.profiles||[])).catch(()=>{})
    } catch { alert("Evaluation failed.") }
    finally { setLoadEval(false) }
  }

  const openTopic = async (topic) => {
    setActiveTopic(topic); setTopicNotes(null); setTopicTest(null)
    setTestAnswers({}); setTestSubmitted(false); setTestResult(null)
    setAdaptTab("notes"); setLoadNotes(true)
    try {
      const r = await axios.post(`${ADAPT}/notes/generate`, {
        user_email: userEmail, topic,
        job_role: adaptRole, company: adaptCompany,
        level: topicProgress[topic]?.priority === "critical" ? "hard" : "medium",
      })
      setTopicNotes(r.data.notes)
    } catch { alert("Failed to load notes.") }
    finally { setLoadNotes(false) }
  }

  const startTopicTest = async () => {
    setLoadTest(true); setTopicTest(null); setTestAnswers({})
    setTestSubmitted(false); setTestResult(null); setAdaptTab("test")
    try {
      const r = await axios.post(`${ADAPT}/test/generate`, {
        user_email: userEmail, topic: activeTopic,
        job_role: adaptRole, company: adaptCompany, num_questions: 5,
      })
      setTopicTest(r.data.test)
    } catch { alert("Failed to generate test.") }
    finally { setLoadTest(false) }
  }

  const submitTopicTest = async () => {
    const qas = topicTest.questions.map(q => ({
      question: q.question, q_type: q.q_type,
      answer: testAnswers[q.id] || "", chosen: testAnswers[q.id] || "",
    }))
    setLoadTestEval(true)
    try {
      const r = await axios.post(`${ADAPT}/test/evaluate`, {
        user_email: userEmail, topic: activeTopic,
        job_role: adaptRole, qa_pairs: qas,
      })
      setTestResult(r.data.result); setTestSubmitted(true); setAdaptTab("results")
      const pr = await axios.get(`${ADAPT}/profile/${userEmail}/${adaptRole}/${adaptCompany}`)
      if (pr.data.profile) {
        setTopicProgress(pr.data.profile.topic_progress||{})
        setLearningProfile(pr.data.profile.profile)
      }
    } catch { alert("Evaluation failed.") }
    finally { setLoadTestEval(false) }
  }

  const getMCQState = (qId, letter) => {
    if (!testSubmitted) return testAnswers[qId] === letter ? "sel" : ""
    const q = topicTest?.questions?.find(q => q.id === qId)
    if (!q) return ""
    if (letter === q.correct_option) return testAnswers[qId] === letter ? "correct" : "reveal"
    if (testAnswers[qId] === letter) return "wrong"
    return ""
  }

  // ─────────────────────────────────────────────────────────────
  return (
    <div className="sch-page">

      {/* ── Topbar ── */}
      <header className="sch-topbar">
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <Link to="/dashboard" style={{textDecoration:"none"}}>
            <button style={{display:"flex",alignItems:"center",gap:7,padding:"9px 18px",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:9,color:"#9aa0b8",fontSize:14,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>
              <ArrowLeft size={15}/>Dashboard
            </button>
          </Link>
          <div style={{width:1,height:22,background:"rgba(255,255,255,0.08)"}}/>
          <div style={{width:32,height:32,borderRadius:9,background:"linear-gradient(135deg,#7c6ffa,#34d5c8)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:15,color:"#fff"}}>S</div>
          <span style={{fontFamily:"'Playfair Display',serif",fontSize:17,fontWeight:700,color:"#fff"}}>
            {tab==="adaptive" ? "Adaptive Learning" : "Interview Scheduler"}
          </span>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button className={`sch-tab ${tab==="scheduler"?"on":"off"}`} onClick={()=>setTab("scheduler")}>
            <Calendar size={14} style={{marginRight:6,verticalAlign:"middle"}}/>Scheduler
          </button>
          <button className={`sch-tab ${tab==="adaptive"?"on":"off"}`} onClick={()=>setTab("adaptive")}>
            <Brain size={14} style={{marginRight:6,verticalAlign:"middle"}}/>Adaptive Learning
            <span style={{marginLeft:7,fontSize:10,padding:"1px 7px",background:"rgba(240,82,82,0.15)",border:"1px solid rgba(240,82,82,0.3)",borderRadius:20,color:"#f87171"}}>NEW</span>
          </button>
        </div>
      </header>

      <div className="sch-body">

        {/* ══════════════════════════════════════════════════════
            SCHEDULER TAB
        ══════════════════════════════════════════════════════ */}
        {tab === "scheduler" && (
          <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}>

            {/* Setup card */}
            <div className="sch-card" style={{marginBottom:24}}>
              <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:26,color:"#fff",marginBottom:6}}>📅 Interview Prep Scheduler</h1>
              <p style={{fontSize:14,color:"#5a6488",marginBottom:24,lineHeight:1.7}}>Enter your interview date and get a personalised day-by-day prep plan. Your progress is saved automatically.</p>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14,marginBottom:18}}>
                <div>
                  <label style={{fontSize:11.5,fontWeight:700,textTransform:"uppercase",letterSpacing:0.9,color:"#6b7280",display:"block",marginBottom:7}}>Interview Date *</label>
                  <input className="sch-inp" type="date" min={minStr} value={interviewDate} onChange={e=>setInterviewDate(e.target.value)}/>
                </div>
                <div>
                  <label style={{fontSize:11.5,fontWeight:700,textTransform:"uppercase",letterSpacing:0.9,color:"#6b7280",display:"block",marginBottom:7}}>Job Role</label>
                  <input className="sch-inp" placeholder="e.g. Investment Banking Analyst" value={jobRole} onChange={e=>setJobRole(e.target.value)}/>
                </div>
                <div>
                  <label style={{fontSize:11.5,fontWeight:700,textTransform:"uppercase",letterSpacing:0.9,color:"#6b7280",display:"block",marginBottom:7}}>Company</label>
                  <input className="sch-inp" placeholder="e.g. Goldman Sachs" value={company} onChange={e=>setCompany(e.target.value)}/>
                </div>
              </div>
              <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                <button className="sch-btn" onClick={generate}>
                  <Calendar size={16}/>{generated?"Regenerate Plan":"Build My Prep Plan"}
                </button>
                {jobRole && company && (
                  <button className="sch-btn green" onClick={()=>{setAdaptRole(jobRole);setAdaptCompany(company);setTab("adaptive")}}>
                    <Brain size={16}/>Also get AI learning plan →
                  </button>
                )}
              </div>
            </div>

            {/* Stats */}
            {generated && (
              <motion.div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:24}} initial={{opacity:0,y:14}} animate={{opacity:1,y:0}}>
                {[
                  {label:"Days until interview", value:daysLeft??"—",               color:"#7c6ffa"},
                  {label:"Tasks completed",       value:`${totalDone}/${totalTasks}`,color:"#30c97e"},
                  {label:"Prep days planned",     value:plan.length,                color:"#34d5c8"},
                  {label:"Recent avg score",      value:userAvg?`${userAvg}/10`:"—",color:userAvg?scoreColor(+userAvg*10):"#5a6488"},
                ].map((s,i)=>(
                  <div key={i} className="sch-card" style={{textAlign:"center"}}>
                    <div style={{fontSize:28,fontWeight:800,fontFamily:"'Playfair Display',serif",color:s.color}}>{s.value}</div>
                    <div style={{fontSize:12,color:"#5a6488",marginTop:4}}>{s.label}</div>
                  </div>
                ))}
              </motion.div>
            )}

            {/* Progress bar */}
            {generated && totalTasks > 0 && (
              <motion.div style={{marginBottom:22}} initial={{opacity:0}} animate={{opacity:1}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:7}}>
                  <span style={{fontSize:13,color:"#5a6488"}}>Overall prep progress</span>
                  <span style={{fontSize:13,fontWeight:700,color:"#30c97e"}}>{Math.round((totalDone/totalTasks)*100)}%</span>
                </div>
                <div className="progress-bar">
                  <motion.div className="progress-fill" style={{background:"linear-gradient(90deg,#7c6ffa,#30c97e)"}}
                    initial={{width:0}} animate={{width:`${(totalDone/totalTasks)*100}%`}} transition={{duration:.8}}/>
                </div>
              </motion.div>
            )}

            {/* Day plan */}
            {generated && plan.length > 0 && (
              <>
                <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:22,color:"#fff",marginBottom:16}}>Your {plan.length}-Day Prep Plan</h2>
                {plan.map((day,di)=>{
                  const isOpen  = !!openDays[di]
                  const dayDone = day.tasks.filter((_,ti)=>doneTasks[`${di}-${ti}`]).length
                  const allDone = dayDone===day.tasks.length
                  return (
                    <div key={di} className="day-card" style={{borderColor:day.isToday?`${day.meta.color}55`:allDone?"rgba(48,201,126,0.25)":"#1e2235"}}>
                      <div className="day-header" onClick={()=>toggleDay(di)}>
                        <div style={{width:42,height:42,borderRadius:11,background:day.meta.bg,border:`1px solid ${day.meta.color}40`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                          <span style={{fontSize:11,fontWeight:800,color:day.meta.color}}>D{day.day}</span>
                        </div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                            <span style={{fontSize:15,fontWeight:700,color:"#dde1f0"}}>{day.meta.icon} {day.meta.label}</span>
                            {day.isToday && <span className="badge" style={{background:"rgba(124,111,250,0.15)",border:"1px solid rgba(124,111,250,0.3)",color:"#a99dfc"}}>TODAY</span>}
                            {day.isFinal && <span className="badge" style={{background:"rgba(245,158,11,0.12)",border:"1px solid rgba(245,158,11,0.3)",color:"#f59e0b"}}>INTERVIEW DAY -1</span>}
                            {allDone && <span className="badge" style={{background:"rgba(48,201,126,0.1)",border:"1px solid rgba(48,201,126,0.25)",color:"#30c97e"}}>✓ Done</span>}
                          </div>
                          <div style={{fontSize:13,color:"#5a6488",marginTop:3}}>{day.date} · {dayDone}/{day.tasks.length} tasks</div>
                        </div>
                        <div style={{width:60,height:5,background:"#1e2235",borderRadius:3,overflow:"hidden",flexShrink:0}}>
                          <div style={{height:"100%",background:day.meta.color,borderRadius:3,width:`${(dayDone/day.tasks.length)*100}%`,transition:"width .4s"}}/>
                        </div>
                        {isOpen ? <ChevronUp size={16} color="#5a6488"/> : <ChevronDown size={16} color="#5a6488"/>}
                      </div>
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div initial={{height:0,opacity:0}} animate={{height:"auto",opacity:1}} exit={{height:0,opacity:0}} style={{overflow:"hidden"}}>
                            <div style={{padding:"0 20px 18px"}}>
                              {day.tasks.map((task,ti)=>{
                                const done = !!doneTasks[`${di}-${ti}`]
                                return (
                                  <div key={ti} className="task-row">
                                    <div className={`task-check ${done?"done":""}`} onClick={()=>toggleTask(di,ti)}>
                                      {done && <CheckCircle size={13} color="#fff"/>}
                                    </div>
                                    <span style={{fontSize:14.5,color:done?"#4a5070":"#c0c8e0",lineHeight:1.65,textDecoration:done?"line-through":"none"}}>{task}</span>
                                  </div>
                                )
                              })}
                              {day.sessionLink && (
                                <Link to={day.sessionLink} style={{textDecoration:"none"}}>
                                  <button style={{marginTop:14,display:"flex",alignItems:"center",gap:8,padding:"9px 20px",background:`${day.meta.color}18`,border:`1px solid ${day.meta.color}40`,borderRadius:9,color:day.meta.color,fontSize:13.5,fontWeight:700,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>
                                    <Brain size={15}/>Start {day.meta.label} session →
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
              </>
            )}

            {/* Interview day tips */}
            {generated && (
              <motion.div style={{marginTop:24,background:"rgba(124,111,250,0.05)",border:"1px solid rgba(124,111,250,0.18)",borderRadius:16,padding:"22px 24px"}} initial={{opacity:0}} animate={{opacity:1,transition:{delay:.3}}}>
                <h3 style={{fontSize:13,fontWeight:700,color:"#7c6ffa",textTransform:"uppercase",letterSpacing:0.9,marginBottom:16}}>🏆 Interview Day Checklist</h3>
                {["Sleep at least 7 hours the night before","Review your top 3 STAR stories — don't cram new material","Research your interviewer on LinkedIn if you know who it is","Prepare 3 thoughtful questions to ask them","Arrive or log in 10 minutes early","Slow down — most candidates speak too fast when nervous"].map((tip,i)=>(
                  <div key={i} style={{display:"flex",gap:12,marginBottom:10}}>
                    <div style={{width:22,height:22,borderRadius:"50%",background:"rgba(124,111,250,0.14)",border:"1px solid rgba(124,111,250,0.3)",color:"#7c6ffa",fontSize:11,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{i+1}</div>
                    <span style={{fontSize:14,color:"#c0c8e0",lineHeight:1.65}}>{tip}</span>
                  </div>
                ))}
              </motion.div>
            )}
          </motion.div>
        )}

        {/* ══════════════════════════════════════════════════════
            ADAPTIVE LEARNING TAB
        ══════════════════════════════════════════════════════ */}
        {tab === "adaptive" && (
          <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}}>

            {/* ── SETUP ── */}
            {adaptTab === "setup" && (
              <div>
                <div className="sch-card" style={{marginBottom:20}}>
                  <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
                    <div style={{width:48,height:48,borderRadius:13,background:"rgba(124,111,250,0.1)",border:"1px solid rgba(124,111,250,0.2)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                      <Brain size={24} color="#7c6ffa"/>
                    </div>
                    <div>
                      <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:24,color:"#fff",marginBottom:3}}>Adaptive Learning Engine</h2>
                      <p style={{fontSize:13.5,color:"#5a6488"}}>AI-powered personalised prep — diagnostic test → gap analysis → custom notes → targeted tests</p>
                    </div>
                  </div>

                  <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10,marginBottom:24}}>
                    {[
                      {icon:"🎯",title:"Diagnostic Test",    sub:"8 questions across key competencies"},
                      {icon:"📊",title:"Gap Analysis",       sub:"AI identifies exactly what you're missing"},
                      {icon:"📝",title:"Personalised Notes", sub:"Tailored study material per weak topic"},
                      {icon:"✅",title:"Topic Tests",        sub:"Test understanding, track mastery progress"},
                    ].map((s,i)=>(
                      <div key={i} style={{background:"#13152a",border:"1px solid #1e2235",borderRadius:12,padding:"14px",textAlign:"center"}}>
                        <div style={{fontSize:22,marginBottom:7}}>{s.icon}</div>
                        <div style={{fontSize:12.5,fontWeight:700,color:"#dde1f0",marginBottom:4}}>{s.title}</div>
                        <div style={{fontSize:11.5,color:"#5a6488",lineHeight:1.5}}>{s.sub}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
                    <div>
                      <label style={{fontSize:11.5,fontWeight:700,textTransform:"uppercase",letterSpacing:0.9,color:"#6b7280",display:"block",marginBottom:7}}>Target Job Role *</label>
                      <input className="sch-inp" placeholder="e.g. Investment Banking Analyst" value={adaptRole} onChange={e=>setAdaptRole(e.target.value)}/>
                    </div>
                    <div>
                      <label style={{fontSize:11.5,fontWeight:700,textTransform:"uppercase",letterSpacing:0.9,color:"#6b7280",display:"block",marginBottom:7}}>Target Company *</label>
                      <input className="sch-inp" placeholder="e.g. Goldman Sachs" value={adaptCompany} onChange={e=>setAdaptCompany(e.target.value)}/>
                    </div>
                  </div>
                  <div style={{marginBottom:18}}>
                    <label style={{fontSize:11.5,fontWeight:700,textTransform:"uppercase",letterSpacing:0.9,color:"#6b7280",display:"block",marginBottom:7}}>Experience Level</label>
                    <div style={{display:"flex",gap:10}}>
                      {["fresher","mid","senior"].map(l=>(
                        <button key={l} onClick={()=>setAdaptExp(l)} style={{flex:1,padding:"11px 8px",background:adaptExp===l?"rgba(124,111,250,0.15)":"rgba(255,255,255,0.03)",border:`1.5px solid ${adaptExp===l?"#7c6ffa":"#2a2d42"}`,borderRadius:10,color:adaptExp===l?"#c4bcfc":"#7a8096",fontSize:14,fontWeight:adaptExp===l?700:400,cursor:"pointer",fontFamily:"'DM Sans',sans-serif",textTransform:"capitalize"}}>{l}</button>
                      ))}
                    </div>
                  </div>
                  <button className="sch-btn" onClick={startDiagnostic} disabled={loadDiag||!adaptRole.trim()||!adaptCompany.trim()}>
                    {loadDiag ? <><Spin/>Generating diagnostic test…</> : <><Target size={16}/>Start Diagnostic Test</>}
                  </button>
                </div>

                {/* Saved profiles */}
                {savedProfiles.length > 0 && (
                  <div>
                    <h3 style={{fontSize:13,fontWeight:700,color:"#5a6488",textTransform:"uppercase",letterSpacing:0.9,marginBottom:12}}>Resume a Previous Learning Plan</h3>
                    {savedProfiles.map((p,i)=>(
                      <div key={i} className="sch-card" style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10,cursor:"pointer"}} onClick={()=>loadExistingProfile(p)}>
                        <div>
                          <div style={{fontSize:15,fontWeight:700,color:"#dde1f0"}}>{p.job_role} — {p.company}</div>
                          <div style={{fontSize:12.5,color:"#5a6488",marginTop:3}}>
                            {Object.keys(p.topic_progress||{}).length} topics · Last updated {new Date(p.last_updated).toLocaleDateString()}
                          </div>
                        </div>
                        <div style={{textAlign:"right"}}>
                          <div style={{fontSize:22,fontWeight:800,fontFamily:"'Playfair Display',serif",color:scoreColor(p.profile?.overall_score||0)}}>{p.profile?.overall_score||0}%</div>
                          <div style={{fontSize:12,color:"#5a6488"}}>{p.profile?.readiness_level||""}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── DIAGNOSTIC TEST ── */}
            {adaptTab === "diagnostic" && diagnostic && (
              <div>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20,flexWrap:"wrap",gap:10}}>
                  <div>
                    <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:24,color:"#fff",marginBottom:4}}>{diagnostic.test_title}</h2>
                    <p style={{fontSize:14,color:"#5a6488"}}>{diagnostic.instructions}</p>
                  </div>
                  <span className="badge" style={{background:"rgba(240,82,82,0.1)",border:"1px solid rgba(240,82,82,0.25)",color:"#f87171",fontSize:12,padding:"5px 14px"}}>
                    {diagnostic.questions?.length} Questions
                  </span>
                </div>

                <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:24}}>
                  {diagnostic.competency_areas?.map((c,i)=>(
                    <span key={i} className="badge" style={{background:"rgba(124,111,250,0.1)",border:"1px solid rgba(124,111,250,0.2)",color:"#a99dfc",padding:"4px 12px"}}>{c}</span>
                  ))}
                </div>

                {diagnostic.questions?.map((q,i)=>(
                  <div key={q.id} className="sch-card" style={{marginBottom:14}}>
                    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
                      <div style={{width:28,height:28,borderRadius:"50%",background:"rgba(124,111,250,0.12)",border:"1px solid rgba(124,111,250,0.25)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:"#7c6ffa",flexShrink:0}}>Q{q.id}</div>
                      <span className="badge" style={{background:"rgba(52,213,200,0.1)",border:"1px solid rgba(52,213,200,0.2)",color:"#34d5c8",textTransform:"capitalize"}}>{q.q_type}</span>
                      <span style={{fontSize:12,color:"#4a5070",marginLeft:"auto"}}>⏱ {q.time_hint}</span>
                    </div>
                    <p style={{fontSize:15.5,color:"#dde1f0",fontWeight:500,lineHeight:1.6,marginBottom:14}}>{q.question}</p>
                    <div style={{padding:"10px 14px",background:"rgba(124,111,250,0.05)",border:"1px solid rgba(124,111,250,0.15)",borderRadius:9,marginBottom:14}}>
                      <span style={{fontSize:12.5,color:"#7c6ffa",fontWeight:600}}>💡 Tip: </span>
                      <span style={{fontSize:13,color:"#8892b0"}}>{q.tip}</span>
                    </div>
                    {q.q_type === "mcq" && q.options ? (
                      Object.entries(q.options).map(([letter,text])=>(
                        <button key={letter} className={`mcq-opt ${diagAnswers[q.id]===letter?"sel":""}`}
                          onClick={()=>setDiagAnswers(prev=>({...prev,[q.id]:letter}))}>
                          <span style={{width:28,height:28,borderRadius:7,background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:13,flexShrink:0}}>{letter}</span>
                          <span style={{flex:1,fontSize:15}}>{text}</span>
                        </button>
                      ))
                    ) : (
                      <>
                        <textarea className="sch-inp sch-ta" rows={4}
                          placeholder="Write your answer here..."
                          value={diagAnswers[q.id]||""}
                          onChange={e=>setDiagAnswers(prev=>({...prev,[q.id]:e.target.value}))}/>
                        <div style={{display:"flex",justifyContent:"flex-end",marginTop:5}}>
                          <span style={{fontSize:12,color:"#4a5070"}}>{(diagAnswers[q.id]||"").trim().split(/\s+/).filter(Boolean).length} words</span>
                        </div>
                      </>
                    )}
                  </div>
                ))}

                <div style={{display:"flex",gap:10,marginTop:8}}>
                  <button className="sch-btn green" onClick={submitDiagnostic} disabled={loadEval}>
                    {loadEval ? <><Spin/>Analysing your answers…</> : <><Zap size={16}/>Submit & Get My Learning Plan</>}
                  </button>
                  <button style={{padding:"13px 20px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:11,color:"#5a6488",fontSize:14,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}} onClick={()=>setAdaptTab("setup")}>
                    ← Back
                  </button>
                </div>
              </div>
            )}

            {/* ── LEARNING PROFILE ── */}
            {adaptTab === "profile" && learningProfile && (
              <div>
                <div className="sch-card" style={{background:"linear-gradient(135deg,#0f1124,#13152e)",marginBottom:20}}>
                  <div style={{display:"grid",gridTemplateColumns:"auto 1fr",gap:24,alignItems:"center"}}>
                    <div style={{textAlign:"center"}}>
                      <div style={{fontSize:60,fontWeight:800,fontFamily:"'Playfair Display',serif",color:scoreColor(learningProfile.overall_score),lineHeight:1}}>
                        {learningProfile.overall_score}<span style={{fontSize:22,color:"#4a5070"}}>%</span>
                      </div>
                      <div style={{fontSize:13,fontWeight:700,color:scoreColor(learningProfile.overall_score),textTransform:"capitalize",marginTop:6}}>{learningProfile.readiness_level}</div>
                    </div>
                    <div>
                      <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:22,color:"#fff",marginBottom:6}}>{adaptRole} — {adaptCompany}</h2>
                      <p style={{fontSize:14,color:"#8892b0",lineHeight:1.75,marginBottom:12}}>{learningProfile.personalised_message}</p>
                      <p style={{fontSize:13.5,color:"#f59e0b",fontWeight:600}}>{learningProfile.interview_date_recommendation}</p>
                    </div>
                  </div>
                </div>

                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:20}}>
                  <div className="sch-card" style={{background:"rgba(48,201,126,0.05)",borderColor:"rgba(48,201,126,0.2)"}}>
                    <div style={{fontSize:12,fontWeight:700,color:"#30c97e",textTransform:"uppercase",letterSpacing:0.9,marginBottom:12}}>✓ Strong Areas</div>
                    {learningProfile.strong_areas?.map((s,i)=>(
                      <div key={i} style={{display:"flex",gap:10,marginBottom:8}}>
                        <CheckCircle size={15} color="#30c97e" style={{flexShrink:0,marginTop:2}}/>
                        <span style={{fontSize:14,color:"#b8f5d8",lineHeight:1.6}}>{s}</span>
                      </div>
                    ))}
                  </div>
                  <div className="sch-card" style={{background:"rgba(240,82,82,0.05)",borderColor:"rgba(240,82,82,0.2)"}}>
                    <div style={{fontSize:12,fontWeight:700,color:"#f05252",textTransform:"uppercase",letterSpacing:0.9,marginBottom:12}}>⚠ Critical Gaps</div>
                    {learningProfile.critical_gaps?.map((g,i)=>(
                      <div key={i} style={{display:"flex",gap:10,marginBottom:8}}>
                        <AlertCircle size={15} color="#f05252" style={{flexShrink:0,marginTop:2}}/>
                        <span style={{fontSize:14,color:"#fca5a5",lineHeight:1.6}}>{g}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <h3 style={{fontSize:13,fontWeight:700,color:"#5a6488",textTransform:"uppercase",letterSpacing:0.9,marginBottom:14}}>Your Personalised Learning Plan</h3>
                {learningProfile.learning_topics?.map((t,i)=>{
                  const pm      = priorityMeta[t.priority] || priorityMeta.medium
                  const prog    = topicProgress[t.topic] || {}
                  const mastery = prog.progress || 0
                  const mastered= mastery >= 75
                  return (
                    <div key={i} className="topic-card" style={{borderColor:mastered?"rgba(48,201,126,0.3)":pm.border}} onClick={()=>openTopic(t.topic)}>
                      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
                        <div style={{flex:1}}>
                          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4,flexWrap:"wrap"}}>
                            <span style={{fontSize:15.5,fontWeight:700,color:"#dde1f0"}}>{t.topic}</span>
                            <span className="badge" style={{background:pm.bg,border:`1px solid ${pm.border}`,color:pm.color,textTransform:"capitalize"}}>{t.priority}</span>
                            {mastered && <span className="badge" style={{background:"rgba(48,201,126,0.1)",border:"1px solid rgba(48,201,126,0.25)",color:"#30c97e"}}>✓ Mastered</span>}
                            {prog.notes_generated && !mastered && <span className="badge" style={{background:"rgba(52,213,200,0.1)",border:"1px solid rgba(52,213,200,0.2)",color:"#34d5c8"}}>Notes ready</span>}
                          </div>
                          <p style={{fontSize:13.5,color:"#5a6488",lineHeight:1.6}}>{t.reason}</p>
                        </div>
                        <div style={{textAlign:"right",flexShrink:0}}>
                          <div style={{fontSize:20,fontWeight:800,color:scoreColor(mastery),fontFamily:"'Playfair Display',serif"}}>{mastery}%</div>
                          <div style={{fontSize:12,color:"#5a6488"}}>{prog.tests_taken||0} tests taken</div>
                        </div>
                      </div>
                      <div className="progress-bar">
                        <motion.div className="progress-fill" style={{background:scoreColor(mastery)}}
                          initial={{width:0}} animate={{width:`${mastery}%`}} transition={{duration:.8}}/>
                      </div>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:10}}>
                        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                          {t.resources?.map((r,j)=>(
                            <span key={j} style={{fontSize:11,padding:"2px 9px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:20,color:"#5a6488"}}>{r}</span>
                          ))}
                        </div>
                        <span style={{fontSize:13,color:"#7c6ffa",fontWeight:600}}>Study notes + test →</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* ── NOTES ── */}
            {adaptTab === "notes" && (
              <div>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}>
                  <button style={{display:"flex",alignItems:"center",gap:7,padding:"8px 16px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:9,color:"#9aa0b8",fontSize:13.5,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}} onClick={()=>setAdaptTab("profile")}>
                    ← Back to plan
                  </button>
                  <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:22,color:"#fff"}}>{activeTopic}</h2>
                </div>

                {loadNotes && (
                  <div style={{display:"flex",alignItems:"center",gap:12,padding:"60px 0",justifyContent:"center"}}>
                    <Spin/><span style={{fontSize:15,color:"#5a6488"}}>Generating personalised notes…</span>
                  </div>
                )}

                {topicNotes && !loadNotes && (
                  <motion.div style={{display:"flex",flexDirection:"column",gap:16}} initial={{opacity:0,y:14}} animate={{opacity:1,y:0}}>
                    <div className="sch-card" style={{background:"rgba(124,111,250,0.05)",borderColor:"rgba(124,111,250,0.2)"}}>
                      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10,flexWrap:"wrap",gap:8}}>
                        <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:20,color:"#fff"}}>{topicNotes.topic}</h3>
                        <div style={{display:"flex",gap:8}}>
                          <span className="badge" style={{background:"rgba(124,111,250,0.12)",border:"1px solid rgba(124,111,250,0.25)",color:"#a99dfc"}}>⏱ {topicNotes.estimated_study_time}</span>
                          <span className="badge" style={{background:"rgba(245,158,11,0.1)",border:"1px solid rgba(245,158,11,0.25)",color:"#f59e0b"}}>Difficulty {topicNotes.difficulty_rating}/5</span>
                        </div>
                      </div>
                      <p style={{fontSize:15,color:"#c0c8e0",lineHeight:1.75,marginBottom:10}}>{topicNotes.summary}</p>
                      <div style={{padding:"10px 14px",background:"rgba(52,213,200,0.06)",border:"1px solid rgba(52,213,200,0.15)",borderRadius:9}}>
                        <span style={{fontSize:12.5,fontWeight:700,color:"#34d5c8"}}>Why it matters: </span>
                        <span style={{fontSize:13.5,color:"#8892b0"}}>{topicNotes.why_it_matters}</span>
                      </div>
                    </div>

                    <div className="sch-card">
                      <div style={{fontSize:12,fontWeight:700,color:"#34d5c8",textTransform:"uppercase",letterSpacing:0.9,marginBottom:14}}>📖 Key Concepts</div>
                      {topicNotes.key_concepts?.map((c,i)=>(
                        <div key={i} style={{marginBottom:18,paddingBottom:18,borderBottom:i<topicNotes.key_concepts.length-1?"1px solid rgba(255,255,255,0.05)":"none"}}>
                          <div style={{fontSize:15,fontWeight:700,color:"#dde1f0",marginBottom:6}}>{c.concept}</div>
                          <p style={{fontSize:14,color:"#8892b0",lineHeight:1.75,marginBottom:8}}>{c.explanation}</p>
                          <div style={{padding:"9px 14px",background:"rgba(52,213,200,0.05)",border:"1px solid rgba(52,213,200,0.12)",borderRadius:8}}>
                            <span style={{fontSize:12.5,fontWeight:700,color:"#34d5c8"}}>Example: </span>
                            <span style={{fontSize:13.5,color:"#8892b0"}}>{c.example}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                      <div className="sch-card">
                        <div style={{fontSize:12,fontWeight:700,color:"#7c6ffa",textTransform:"uppercase",letterSpacing:0.9,marginBottom:12}}>🎯 How Interviews Test This</div>
                        {topicNotes.interview_angles?.map((a,i)=>(
                          <div key={i} style={{display:"flex",gap:10,marginBottom:10}}>
                            <Star size={13} color="#7c6ffa" style={{flexShrink:0,marginTop:2}}/>
                            <span style={{fontSize:14,color:"#c0c8e0",lineHeight:1.65}}>{a}</span>
                          </div>
                        ))}
                      </div>
                      <div className="sch-card">
                        <div style={{fontSize:12,fontWeight:700,color:"#f59e0b",textTransform:"uppercase",letterSpacing:0.9,marginBottom:12}}>⚡ Quick Tips</div>
                        {topicNotes.quick_tips?.map((t,i)=>(
                          <div key={i} style={{display:"flex",gap:10,marginBottom:10}}>
                            <Zap size={13} color="#f59e0b" style={{flexShrink:0,marginTop:2}}/>
                            <span style={{fontSize:14,color:"#c0c8e0",lineHeight:1.65}}>{t}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="sch-card" style={{background:"rgba(240,82,82,0.04)",borderColor:"rgba(240,82,82,0.18)"}}>
                      <div style={{fontSize:12,fontWeight:700,color:"#f05252",textTransform:"uppercase",letterSpacing:0.9,marginBottom:12}}>⚠ Common Mistakes to Avoid</div>
                      {topicNotes.common_mistakes?.map((m,i)=>(
                        <div key={i} style={{display:"flex",gap:10,marginBottom:8}}>
                          <AlertCircle size={14} color="#f05252" style={{flexShrink:0,marginTop:2}}/>
                          <span style={{fontSize:14,color:"#fca5a5",lineHeight:1.65}}>{m}</span>
                        </div>
                      ))}
                    </div>

                    <div className="sch-card" style={{background:"rgba(48,201,126,0.04)",borderColor:"rgba(48,201,126,0.18)"}}>
                      <div style={{fontSize:12,fontWeight:700,color:"#30c97e",textTransform:"uppercase",letterSpacing:0.9,marginBottom:10}}>🧠 Practice Prompt</div>
                      <p style={{fontSize:15,color:"#dde1f0",fontWeight:500,lineHeight:1.7,fontStyle:"italic"}}>{topicNotes.practice_prompt}</p>
                    </div>

                    <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                      <button className="sch-btn green" onClick={startTopicTest}>
                        <Play size={16}/>Take the {activeTopic} Test
                      </button>
                      <button style={{padding:"13px 20px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:11,color:"#5a6488",fontSize:14,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}} onClick={()=>setAdaptTab("profile")}>
                        Back to plan
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {/* ── TOPIC TEST ── */}
            {adaptTab === "test" && (
              <div>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}>
                  <button style={{display:"flex",alignItems:"center",gap:7,padding:"8px 16px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:9,color:"#9aa0b8",fontSize:13.5,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}} onClick={()=>setAdaptTab("notes")}>
                    ← Back to notes
                  </button>
                  <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:22,color:"#fff"}}>{activeTopic} — Test</h2>
                </div>

                {loadTest && (
                  <div style={{display:"flex",alignItems:"center",gap:12,padding:"60px 0",justifyContent:"center"}}>
                    <Spin/><span style={{fontSize:15,color:"#5a6488"}}>Generating your test…</span>
                  </div>
                )}

                {topicTest && !loadTest && (
                  <motion.div initial={{opacity:0,y:14}} animate={{opacity:1,y:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:20,padding:"14px 18px",background:"rgba(124,111,250,0.06)",border:"1px solid rgba(124,111,250,0.18)",borderRadius:12}}>
                      <Clock size={18} color="#7c6ffa"/>
                      <div>
                        <div style={{fontSize:14,fontWeight:700,color:"#dde1f0"}}>{topicTest.questions?.length} questions · {topicTest.time_limit_minutes} minutes · {topicTest.total_marks} marks</div>
                        <div style={{fontSize:13,color:"#5a6488"}}>Passing score: {topicTest.passing_score} marks</div>
                      </div>
                    </div>

                    {topicTest.questions?.map((q,i)=>(
                      <div key={q.id} className="sch-card" style={{marginBottom:14}}>
                        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
                          <div style={{width:28,height:28,borderRadius:"50%",background:"rgba(124,111,250,0.12)",border:"1px solid rgba(124,111,250,0.25)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:"#7c6ffa",flexShrink:0}}>Q{q.id}</div>
                          <span className="badge" style={{background:"rgba(52,213,200,0.1)",border:"1px solid rgba(52,213,200,0.2)",color:"#34d5c8",textTransform:"capitalize"}}>{q.q_type}</span>
                          <span style={{fontSize:12,color:"#4a5070",marginLeft:"auto"}}>{q.marks} mark{q.marks>1?"s":""}</span>
                        </div>
                        <p style={{fontSize:15.5,color:"#dde1f0",fontWeight:500,lineHeight:1.6,marginBottom:14}}>{q.question}</p>

                        {q.q_type === "mcq" && q.options ? (
                          <>
                            {Object.entries(q.options).map(([letter,text])=>(
                              <button key={letter} className={`mcq-opt ${getMCQState(q.id,letter)}`}
                                onClick={()=>{ if(!testSubmitted) setTestAnswers(prev=>({...prev,[q.id]:letter})) }}
                                disabled={testSubmitted}>
                                <span style={{width:28,height:28,borderRadius:7,background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:13,flexShrink:0}}>{letter}</span>
                                <span style={{flex:1,fontSize:15}}>{text}</span>
                              </button>
                            ))}
                            {testSubmitted && (
                              <div style={{padding:"11px 14px",background:"rgba(52,213,200,0.06)",border:"1px solid rgba(52,213,200,0.18)",borderRadius:9,marginTop:6}}>
                                <span style={{fontSize:13,color:"#34d5c8",fontWeight:600}}>Explanation: </span>
                                <span style={{fontSize:13,color:"#8892b0"}}>{q.explanation}</span>
                              </div>
                            )}
                          </>
                        ) : (
                          <textarea className="sch-inp sch-ta" rows={4}
                            placeholder="Write your answer..."
                            value={testAnswers[q.id]||""}
                            onChange={e=>{ if(!testSubmitted) setTestAnswers(prev=>({...prev,[q.id]:e.target.value})) }}
                            disabled={testSubmitted}/>
                        )}
                      </div>
                    ))}

                    {!testSubmitted && (
                      <button className="sch-btn green" onClick={submitTopicTest} disabled={loadTestEval}>
                        {loadTestEval ? <><Spin/>Evaluating…</> : <><Award size={16}/>Submit Test</>}
                      </button>
                    )}
                  </motion.div>
                )}
              </div>
            )}

            {/* ── TEST RESULTS ── */}
            {adaptTab === "results" && testResult && (
              <div>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}>
                  <button style={{display:"flex",alignItems:"center",gap:7,padding:"8px 16px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:9,color:"#9aa0b8",fontSize:13.5,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}} onClick={()=>setAdaptTab("profile")}>
                    ← Back to plan
                  </button>
                  <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:22,color:"#fff"}}>{activeTopic} — Results</h2>
                </div>

                <motion.div style={{display:"flex",flexDirection:"column",gap:16}} initial={{opacity:0,y:14}} animate={{opacity:1,y:0}}>
                  <div className="sch-card" style={{textAlign:"center",background:"linear-gradient(135deg,#0f1124,#13152e)"}}>
                    <div style={{fontSize:70,fontWeight:800,fontFamily:"'Playfair Display',serif",color:scoreColor(testResult.score),lineHeight:1}}>
                      {testResult.score}<span style={{fontSize:28,color:"#4a5070"}}>/100</span>
                    </div>
                    <div style={{fontSize:18,fontWeight:700,color:scoreColor(testResult.score),marginTop:8}}>{testResult.verdict}</div>
                    <div style={{marginTop:14,display:"inline-flex",alignItems:"center",gap:7,padding:"6px 16px",background:testResult.passed?"rgba(48,201,126,0.12)":"rgba(240,82,82,0.1)",border:`1px solid ${testResult.passed?"rgba(48,201,126,0.3)":"rgba(240,82,82,0.25)"}`,borderRadius:20}}>
                      <span style={{fontSize:14,fontWeight:700,color:testResult.passed?"#30c97e":"#f05252"}}>{testResult.passed?"✓ Passed":"✗ Not Yet — Keep Practising"}</span>
                    </div>
                    <div style={{marginTop:16,fontSize:13.5,color:"#5a6488"}}>Topic mastery: <strong style={{color:scoreColor(testResult.topic_mastery)}}>{testResult.topic_mastery}%</strong></div>
                  </div>

                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
                    <div className="sch-card" style={{background:"rgba(48,201,126,0.05)",borderColor:"rgba(48,201,126,0.2)"}}>
                      <div style={{fontSize:12,fontWeight:700,color:"#30c97e",textTransform:"uppercase",letterSpacing:0.9,marginBottom:10}}>✓ Strengths</div>
                      {testResult.strengths?.map((s,i)=>(
                        <div key={i} style={{display:"flex",gap:10,marginBottom:8}}>
                          <CheckCircle size={14} color="#30c97e" style={{flexShrink:0,marginTop:2}}/>
                          <span style={{fontSize:14,color:"#b8f5d8",lineHeight:1.6}}>{s}</span>
                        </div>
                      ))}
                    </div>
                    <div className="sch-card" style={{background:"rgba(245,158,11,0.05)",borderColor:"rgba(245,158,11,0.2)"}}>
                      <div style={{fontSize:12,fontWeight:700,color:"#f59e0b",textTransform:"uppercase",letterSpacing:0.9,marginBottom:10}}>↑ Gaps</div>
                      {testResult.gaps?.map((g,i)=>(
                        <div key={i} style={{display:"flex",gap:10,marginBottom:8}}>
                          <AlertCircle size={14} color="#f59e0b" style={{flexShrink:0,marginTop:2}}/>
                          <span style={{fontSize:14,color:"#fde68a",lineHeight:1.6}}>{g}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="sch-card" style={{background:"rgba(124,111,250,0.05)",borderColor:"rgba(124,111,250,0.2)"}}>
                    <div style={{fontSize:12,fontWeight:700,color:"#7c6ffa",textTransform:"uppercase",letterSpacing:0.9,marginBottom:8}}>📌 What to do next</div>
                    <p style={{fontSize:15,color:"#c0c8e0",lineHeight:1.75}}>{testResult.next_action}</p>
                  </div>

                  <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                    {!testResult.passed && (
                      <button className="sch-btn" onClick={()=>{setAdaptTab("notes");setTopicTest(null);setTestAnswers({});setTestSubmitted(false);setTestResult(null)}}>
                        <BookOpen size={16}/>Re-study notes
                      </button>
                    )}
                    <button className="sch-btn green" onClick={()=>{setTopicTest(null);setTestAnswers({});setTestSubmitted(false);setTestResult(null);startTopicTest()}}>
                      <RefreshCw size={16}/>Retry test
                    </button>
                    <button style={{padding:"13px 20px",background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:11,color:"#5a6488",fontSize:14,cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}} onClick={()=>setAdaptTab("profile")}>
                      Back to all topics
                    </button>
                  </div>
                </motion.div>
              </div>
            )}

          </motion.div>
        )}
      </div>
    </div>
  )
} 