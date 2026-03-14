import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Link } from "react-router-dom"
import axios from "axios"
import * as mammoth from "mammoth"
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition"
import {
  ArrowLeft, Brain, Play, Clock, Lightbulb, CheckCircle, XCircle,
  AlertCircle, BarChart2, Download, RefreshCw, Star, Trophy,
  ArrowRight, Zap, RotateCcw, Mic, MicOff, Video, VideoOff,
  BookOpen, Target, TrendingUp, Activity, Volume2, Flame, Shield,
  FileUp, LayoutTemplate, Calendar
} from "lucide-react"

const API = "http://127.0.0.1:8000/interview"

const Q_TYPES  = ["behavioural", "technical", "case", "mcq"]
const DIFFS    = ["easy", "medium", "hard"]
const EXP_LVLS = ["fresher", "mid", "senior"]

const TYPE_META = {
  behavioural: { label: "Behavioural", color: "#7c6ffa", bg: "rgba(124,111,250,0.12)", icon: "👥" },
  technical:   { label: "Technical",   color: "#34d5c8", bg: "rgba(52,213,200,0.12)",  icon: "⚙️" },
  case:        { label: "Case Study",  color: "#f59e0b", bg: "rgba(245,158,11,0.12)",  icon: "📋" },
  mcq:         { label: "MCQ",         color: "#a78bfa", bg: "rgba(167,139,250,0.12)", icon: "🔢" },
}

const VERDICT_META = {
  "Strong":     { color: "#30c97e" },
  "Good":       { color: "#34d5c8" },
  "Needs Work": { color: "#f59e0b" },
  "Weak":       { color: "#f05252" },
}

const FRAMEWORKS = {
  behavioural: [
    { id:"star",  label:"STAR",  desc:"Situation · Task · Action · Result",
      template:"SITUATION:\n(Set the scene — where, when, what was happening)\n\nTASK:\n(What was your specific responsibility or goal)\n\nACTION:\n(Exactly what YOU did — use 'I', not 'we')\n\nRESULT:\n(Quantify the outcome — numbers, impact, what changed)" },
    { id:"soar",  label:"SOAR",  desc:"Situation · Obstacle · Action · Result",
      template:"SITUATION:\n(Context and background)\n\nOBSTACLE:\n(The specific challenge or problem you faced)\n\nACTION:\n(Steps you personally took to overcome it)\n\nRESULT:\n(What happened — include numbers if possible)" },
    { id:"carl",  label:"CARL",  desc:"Challenge · Action · Result · Learning",
      template:"CHALLENGE:\n(What was the difficulty or problem)\n\nACTION:\n(What did you do about it)\n\nRESULT:\n(What was the outcome)\n\nLEARNING:\n(What did you take away from this experience)" },
  ],
  technical: [
    { id:"pse",   label:"PSE",   desc:"Problem · Solution · Evaluation",
      template:"PROBLEM:\n(Define the technical problem precisely)\n\nSOLUTION:\n(Your approach — tools, methods, reasoning)\n\nEVALUATION:\n(Trade-offs considered, why this was the best approach, limitations)" },
    { id:"deep",  label:"Deep Dive", desc:"Concept · Mechanism · Example · Edge cases",
      template:"CONCEPT:\n(Define the concept in one clear sentence)\n\nMECHANISM:\n(How it works under the hood)\n\nEXAMPLE:\n(Concrete real-world example)\n\nEDGE CASES:\n(When does it break down or behave unexpectedly)" },
  ],
  case: [
    { id:"mece",  label:"MECE",  desc:"Mutually Exclusive · Collectively Exhaustive",
      template:"CLARIFY:\n(Restate the problem in your own words, ask 2-3 clarifying questions)\n\nSTRUCTURE:\n(List your MECE buckets — no overlaps, no gaps)\n\nANALYSIS:\n(Work through each bucket with data/logic)\n\nRECOMMENDATION:\n(Clear answer with 2-3 supporting reasons)" },
    { id:"4p",    label:"4Ps",   desc:"Product · Price · Place · Promotion",
      template:"PRODUCT:\n(What is being sold, its features, differentiation)\n\nPRICE:\n(Pricing strategy, positioning, margins)\n\nPLACE:\n(Distribution channels, geography, reach)\n\nPROMOTION:\n(Marketing, messaging, customer acquisition)" },
  ],
}

const FILLER_WORDS = ["um", "uh", "like", "so", "basically", "literally", "actually", "you know", "i mean", "kind of", "sort of", "right", "okay so"]

const scoreColor = s => s >= 8 ? "#30c97e" : s >= 6 ? "#34d5c8" : s >= 4 ? "#f59e0b" : "#f05252"

// ── CSS ───────────────────────────────────────────────────────
const GCSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;500;600;700&display=swap');
  * { box-sizing: border-box; }
  @keyframes iv-spin  { to { transform: rotate(360deg); } }
  @keyframes iv-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.7;transform:scale(1.12)} }
  @keyframes iv-ripple { 0%{transform:scale(1);opacity:.6} 100%{transform:scale(2.2);opacity:0} }
  .iv-inp {
    width:100%; padding:12px 15px;
    background:#1a1d2e !important; border:1.5px solid #2e3450;
    border-radius:10px; color:#fff !important;
    font-family:'DM Sans',sans-serif; font-size:15.5px;
    outline:none; transition:border-color .2s;
  }
  .iv-inp:focus { border-color:#7c6ffa; box-shadow:0 0 0 3px rgba(124,111,250,0.14); }
  .iv-inp::placeholder { color:#4a5070 !important; }
  .iv-inp:-webkit-autofill { -webkit-box-shadow:0 0 0 1000px #1a1d2e inset !important; -webkit-text-fill-color:#fff !important; }
  .iv-ta { resize:vertical; line-height:1.75; min-height:140px; }
  .mcq-opt {
    width:100%; display:flex; align-items:flex-start; gap:14px;
    padding:15px 18px; margin-bottom:10px;
    background:#13152a; border:1.5px solid #2e3450;
    border-radius:13px; color:#c0c8e0;
    font-family:'DM Sans',sans-serif; font-size:16px;
    text-align:left; cursor:pointer; transition:all .18s; outline:none;
  }
  .mcq-opt:hover:not(:disabled)  { border-color:#7c6ffa; background:rgba(124,111,250,0.08); color:#fff; }
  .mcq-opt.selected { border-color:#7c6ffa; background:rgba(124,111,250,0.15); color:#fff; }
  .mcq-opt.correct  { border-color:#30c97e; background:rgba(48,201,126,0.13);  color:#b8f5d8; }
  .mcq-opt.wrong    { border-color:#f05252; background:rgba(240,82,82,0.11);   color:#fca5a5; }
  .mcq-opt.reveal   { border-color:#30c97e; background:rgba(48,201,126,0.07);  color:#b8f5d8; }
  .mcq-letter {
    width:34px; height:34px; border-radius:9px; flex-shrink:0;
    background:rgba(255,255,255,0.07); border:1px solid rgba(255,255,255,0.12);
    display:flex; align-items:center; justify-content:center;
    font-weight:800; font-size:14px; color:#7a8096; transition:all .18s;
  }
  .mcq-opt.selected .mcq-letter { background:#7c6ffa; border-color:#7c6ffa; color:#fff; }
  .mcq-opt.correct  .mcq-letter { background:#30c97e; border-color:#30c97e; color:#fff; }
  .mcq-opt.wrong    .mcq-letter { background:#f05252; border-color:#f05252; color:#fff; }
  .mcq-opt.reveal   .mcq-letter { background:#30c97e; border-color:#30c97e; color:#fff; }
  .score-bar  { height:7px; border-radius:4px; background:#1e2235; overflow:hidden; }
  .score-fill { height:100%; border-radius:4px; transition:width 1.1s ease; }
  .star-seg   { flex:1; height:5px; border-radius:3px; transition:background .3s; }
  .mic-ring   { position:absolute; inset:-6px; border-radius:50%; border:2px solid #f05252; animation:iv-ripple 1.2s ease-out infinite; }
  .tab-btn    { padding:9px 18px; border-radius:8px; font-size:14px; font-weight:600; cursor:pointer; border:1.5px solid transparent; font-family:'DM Sans',sans-serif; transition:all .2s; }
  .tab-btn.active   { background:rgba(124,111,250,0.15); border-color:#7c6ffa; color:#a99dfc; }
  .tab-btn.inactive { background:transparent; border-color:rgba(255,255,255,0.08); color:#5a6488; }
  .tab-btn.inactive:hover { border-color:#7c6ffa; color:#a99dfc; }
  @keyframes iv-flame { 0%,100%{transform:scaleY(1) rotate(-1deg)} 50%{transform:scaleY(1.08) rotate(1deg)} }
  .devil-toggle { display:inline-flex; align-items:center; border-radius:9px; font-weight:600; cursor:pointer; font-family:'DM Sans',sans-serif; transition:all .2s; border:1.5px solid; }
  .devil-toggle.off { background:rgba(255,255,255,0.03); border-color:rgba(255,255,255,0.1); color:#5a6488; }
  .devil-toggle.on  { background:rgba(240,82,82,0.1);    border-color:rgba(240,82,82,0.4);  color:#f05252; }
  .devil-toggle:disabled { opacity:0.6; cursor:not-allowed; }
  /* ── PDF print styles for resume gap report ── */
  #resume-gaps-report { font-family:'DM Sans',sans-serif !important; }
  #resume-gaps-report * { -webkit-print-color-adjust:exact; print-color-adjust:exact; }
`

// ── Micro components ──────────────────────────────────────────
const Spin = () => <span style={{ width:16, height:16, border:"2px solid rgba(255,255,255,0.2)", borderTopColor:"#fff", borderRadius:"50%", animation:"iv-spin .7s linear infinite", display:"inline-block", marginRight:8, flexShrink:0, verticalAlign:"middle" }} />

const Toast = ({ msg, type="info" }) => {
  const bg = type === "success" ? "#30c97e" : type === "error" ? "#f05252" : "#7c6ffa"
  return (
    <AnimatePresence>
      {msg && (
        <motion.div style={{ position:"fixed", top:20, left:"50%", transform:"translateX(-50%)", background:"#13152a", border:`1px solid ${bg}40`, color:"#dde1f0", padding:"12px 26px", borderRadius:30, fontSize:15, zIndex:9999, boxShadow:"0 8px 30px rgba(0,0,0,0.5)", display:"flex", alignItems:"center", gap:9, whiteSpace:"nowrap" }}
          initial={{ opacity:0, y:-14 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}>
          <CheckCircle size={16} color={bg} />{msg}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

const Timer = ({ seconds }) => {
  const m = Math.floor(seconds / 60).toString().padStart(2,"0")
  const s = (seconds % 60).toString().padStart(2,"0")
  const warn = seconds <= 30
  return (
    <div style={{ display:"flex", alignItems:"center", gap:8, padding:"9px 20px", background:warn?"rgba(245,158,11,0.1)":"rgba(255,255,255,0.05)", border:`1px solid ${warn?"rgba(245,158,11,0.35)":"rgba(255,255,255,0.08)"}`, borderRadius:22 }}>
      <Clock size={15} color={warn?"#f59e0b":"#5a6488"} />
      <span style={{ fontSize:17, fontWeight:700, color:warn?"#f59e0b":"#dde1f0", fontFamily:"monospace" }}>{m}:{s}</span>
    </div>
  )
}

// ── STAR Coach bar ────────────────────────────────────────────
const STARCoach = ({ text }) => {
  const t = text.toLowerCase()
  const segments = [
    { key:"S", label:"Situation", hit: /(situation|context|background|was working|i was|we were|at the time|when i)/i.test(t) },
    { key:"T", label:"Task",      hit: /(task|goal|objective|responsible for|needed to|had to|my role|challenge)/i.test(t) },
    { key:"A", label:"Action",    hit: /(i decided|i took|i built|i led|i created|i implemented|action|i did|i worked|i spoke|i wrote)/i.test(t) },
    { key:"R", label:"Result",    hit: /(result|outcome|achieved|improved|increased|reduced|saved|led to|as a result|impact|success)/i.test(t) },
  ]
  const done = segments.filter(s => s.hit).length
  return (
    <div style={{ marginTop:8 }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
        <span style={{ fontSize:12, fontWeight:700, color:"#5a6488", textTransform:"uppercase", letterSpacing:0.8, fontFamily:"'DM Sans',sans-serif" }}>STAR structure</span>
        <span style={{ fontSize:12, color: done===4?"#30c97e":done>=2?"#f59e0b":"#5a6488", fontFamily:"'DM Sans',sans-serif" }}>{done}/4 components</span>
      </div>
      <div style={{ display:"flex", gap:4 }}>
        {segments.map(seg => (
          <div key={seg.key} style={{ flex:1, textAlign:"center" }}>
            <div className="star-seg" style={{ background:seg.hit?"#30c97e":"#1e2235", marginBottom:4 }} />
            <span style={{ fontSize:11, fontWeight:700, color:seg.hit?"#30c97e":"#4a5070", fontFamily:"'DM Sans',sans-serif" }}>{seg.key}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Filler word + WPM analyser ────────────────────────────────
const SpeechAnalysis = ({ transcript, startTime }) => {
  if (!transcript || transcript.length < 10) return null
  const words    = transcript.trim().split(/\s+/).filter(Boolean)
  const wc       = words.length
  const elapsed  = startTime ? Math.max(1, (Date.now() - startTime) / 60000) : 1
  const wpm      = Math.round(wc / elapsed)
  const fillers  = words.filter(w => FILLER_WORDS.includes(w.toLowerCase().replace(/[^a-z ]/g,"")))
  const fillerPct= Math.round((fillers.length / Math.max(wc,1)) * 100)
  const wpmColor = wpm < 100 ? "#f59e0b" : wpm > 180 ? "#f05252" : "#30c97e"
  const fillerColor = fillerPct > 10 ? "#f05252" : fillerPct > 5 ? "#f59e0b" : "#30c97e"
  const uniqueFillers = [...new Set(fillers.map(w => w.toLowerCase()))]
  return (
    <motion.div style={{ padding:"12px 16px", background:"rgba(52,213,200,0.06)", border:"1px solid rgba(52,213,200,0.18)", borderRadius:10, marginTop:10 }}
      initial={{ opacity:0, y:-6 }} animate={{ opacity:1, y:0 }}>
      <div style={{ fontSize:12, fontWeight:700, color:"#34d5c8", textTransform:"uppercase", letterSpacing:0.8, marginBottom:10, fontFamily:"'DM Sans',sans-serif" }}>Live speech analysis</div>
      <div style={{ display:"flex", gap:16, flexWrap:"wrap" }}>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:22, fontWeight:800, color:wpmColor, fontFamily:"'Playfair Display',serif" }}>{wpm}</div>
          <div style={{ fontSize:11, color:"#5a6488", fontFamily:"'DM Sans',sans-serif" }}>WPM</div>
          <div style={{ fontSize:10, color:"#4a5070", fontFamily:"'DM Sans',sans-serif" }}>{wpm<100?"too slow":wpm>180?"too fast":"good pace"}</div>
        </div>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:22, fontWeight:800, color:fillerColor, fontFamily:"'Playfair Display',serif" }}>{fillers.length}</div>
          <div style={{ fontSize:11, color:"#5a6488", fontFamily:"'DM Sans',sans-serif" }}>Fillers</div>
          <div style={{ fontSize:10, color:"#4a5070", fontFamily:"'DM Sans',sans-serif" }}>{fillerPct}% of words</div>
        </div>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:22, fontWeight:800, color:"#dde1f0", fontFamily:"'Playfair Display',serif" }}>{wc}</div>
          <div style={{ fontSize:11, color:"#5a6488", fontFamily:"'DM Sans',sans-serif" }}>Words</div>
        </div>
      </div>
      {uniqueFillers.length > 0 && (
        <div style={{ marginTop:8, display:"flex", flexWrap:"wrap", gap:5 }}>
          {uniqueFillers.map(f => (
            <span key={f} style={{ fontSize:11.5, padding:"2px 10px", background:"rgba(240,82,82,0.1)", border:"1px solid rgba(240,82,82,0.25)", borderRadius:20, color:"#fca5a5", fontFamily:"'DM Sans',sans-serif" }}>"{f}"</span>
          ))}
        </div>
      )}
    </motion.div>
  )
}

// ── Progress history mini chart ───────────────────────────────
const HistoryChart = ({ sessions }) => {
  if (!sessions || sessions.length === 0) return (
    <div style={{ textAlign:"center", padding:"30px 0", color:"#4a5070", fontSize:14, fontFamily:"'DM Sans',sans-serif" }}>
      No sessions yet — complete your first interview to see progress here.
    </div>
  )
  const last10 = sessions.slice(0,10).reverse()
  const max    = 10
  return (
    <div>
      <div style={{ display:"flex", alignItems:"flex-end", gap:8, height:80, marginBottom:10 }}>
        {last10.map((s,i) => (
          <div key={i} style={{ flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
            <div style={{ fontSize:10, color:scoreColor(s.overall_score), fontFamily:"'DM Sans',sans-serif", fontWeight:700 }}>{s.overall_score}</div>
            <div style={{ width:"100%", background: scoreColor(s.overall_score), borderRadius:"3px 3px 0 0", height:`${(s.overall_score/max)*60}px`, minHeight:4, transition:"height .5s ease" }} />
          </div>
        ))}
      </div>
      <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"#4a5070", fontFamily:"'DM Sans',sans-serif" }}>
        <span>oldest</span><span>most recent</span>
      </div>
      <div style={{ marginTop:14, display:"flex", flexDirection:"column", gap:8 }}>
        {sessions.slice(0,5).map((s,i) => (
          <div key={i} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 14px", background:"#0c0e1a", border:"1px solid #1e2235", borderRadius:10 }}>
            <div>
              <div style={{ fontSize:14, fontWeight:600, color:"#dde1f0", fontFamily:"'DM Sans',sans-serif" }}>{s.job_role}</div>
              <div style={{ fontSize:12, color:"#4a5070", fontFamily:"'DM Sans',sans-serif" }}>{s.difficulty} · {new Date(s.created_at).toLocaleDateString()}</div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontSize:18, fontWeight:800, color:scoreColor(s.overall_score), fontFamily:"'Playfair Display',serif" }}>{s.overall_score}/10</div>
              <div style={{ fontSize:11, color:scoreColor(s.overall_score), fontFamily:"'DM Sans',sans-serif" }}>{s.overall_verdict}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── MCQ Option component ──────────────────────────────────────
const MCQOption = ({ letter, text, state, onClick, onDoubleClick, disabled }) => {
  const cls = `mcq-opt ${state !== "idle" ? state : ""}`
  return (
    <button className={cls} onClick={!disabled ? onClick : undefined} onDoubleClick={!disabled ? onDoubleClick : undefined} disabled={disabled}>
      <span className="mcq-letter">{letter}</span>
      <span style={{ fontSize:16, lineHeight:1.6, paddingTop:4, flex:1 }}>{text}</span>
      {state === "correct" && <CheckCircle size={18} color="#30c97e" style={{ flexShrink:0, marginTop:7 }} />}
      {state === "wrong"   && <XCircle    size={18} color="#f05252" style={{ flexShrink:0, marginTop:7 }} />}
      {state === "reveal"  && <CheckCircle size={18} color="#30c97e" style={{ flexShrink:0, marginTop:7 }} />}
    </button>
  )
}

// ── Confetti burst ────────────────────────────────────────────
const Confetti = ({ show }) => {
  if (!show) return null
  const pieces = Array.from({ length: 22 }, (_, i) => ({
    x: Math.random() * 100, delay: Math.random() * 0.5,
    color: ["#7c6ffa","#34d5c8","#f59e0b","#30c97e","#f05252","#a78bfa"][i % 6],
    size: 6 + Math.random() * 8,
  }))
  return (
    <div style={{ position:"fixed", inset:0, pointerEvents:"none", zIndex:9998, overflow:"hidden" }}>
      {pieces.map((p,i) => (
        <motion.div key={i}
          style={{ position:"absolute", left:`${p.x}%`, top:-20, width:p.size, height:p.size, borderRadius:2, background:p.color }}
          initial={{ y:0, rotate:0, opacity:1 }}
          animate={{ y:"110vh", rotate:720, opacity:0 }}
          transition={{ duration:2 + Math.random(), delay:p.delay, ease:"easeIn" }}
        />
      ))}
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════
export default function InterviewPrep() {

  // inject CSS
  useEffect(() => {
    const id = "iv-style"
    if (document.getElementById(id)) return
    const el = document.createElement("style"); el.id = id
    el.textContent = GCSS; document.head.appendChild(el)
  }, [])

  // Load PDF.js for in-browser PDF text extraction
  useEffect(() => {
    const scriptId = "pdfjs-script"
    if (document.getElementById(scriptId)) return
    const script = document.createElement("script")
    script.id = scriptId
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"
    script.onload = () => {
      if (window["pdfjs-dist/build/pdf"]) {
        window["pdfjs-dist/build/pdf"].GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"
      }
    }
    document.head.appendChild(script)
  }, [])

  // ── Screen ─────────────────────────────────────────────────
  const [screen,       setScreen]       = useState("setup")   // setup | interview | summary
  const [activeTab,    setActiveTab]    = useState("interview") // interview | history

  // ── Setup ──────────────────────────────────────────────────
  const [jobRole,      setJobRole]      = useState("")
  const [expLevel,     setExpLevel]     = useState("mid")
  const [difficulty,   setDifficulty]   = useState("medium")
  const [numQ,         setNumQ]         = useState(8)
  const [selTypes,     setSelTypes]     = useState(["behavioural", "technical", "mcq"])
  const [jobDesc,      setJobDesc]      = useState("")

  // ── Interview state ─────────────────────────────────────────
  const [questions,    setQuestions]    = useState([])
  const [qIndex,       setQIndex]       = useState(0)
  const [answer,       setAnswer]       = useState("")
  const [mcqChoice,    setMcqChoice]    = useState(null)
  const [evaluation,   setEvaluation]   = useState(null)
  const [followUpAns,  setFollowUpAns]  = useState("")
  const [hint,         setHint]         = useState(null)
  const [showHint,     setShowHint]     = useState(false)
  const [showFU,       setShowFU]       = useState(false)
  const [sessionLog,   setSessionLog]   = useState([])

  // ── Timer ──────────────────────────────────────────────────
  const [timeLeft,     setTimeLeft]     = useState(120)
  const [timerOn,      setTimerOn]      = useState(false)
  const timerRef = useRef(null)

  // ── Voice (Web Speech API) ──────────────────────────────────
  const { transcript, listening, resetTranscript, browserSupportsSpeechRecognition } = useSpeechRecognition()
  const [voiceMode,    setVoiceMode]    = useState(false)
  const [speechStart,  setSpeechStart]  = useState(null)

  // ── Video ──────────────────────────────────────────────────
  const [videoOn,      setVideoOn]      = useState(false)
  const [videoStream,  setVideoStream]  = useState(null)
  const videoRef = useRef(null)

  // ── Progress & summary ─────────────────────────────────────
  const [summary,      setSummary]      = useState(null)
  const [history,      setHistory]      = useState([])
  const [showConfetti, setShowConfetti] = useState(false)


  // ── Framework templates ───────────────────────────────────────
  const [selFramework,   setSelFramework]   = useState(null)

  // ── Resume gap detector ────────────────────────────────────────
  const [resumeText,     setResumeText]     = useState("")
  const [resumeGaps,     setResumeGaps]     = useState(null)
  const [loadingGaps,    setLoadingGaps]    = useState(false)
  const [resumeFile,     setResumeFile]     = useState(null)
  const [resumeInputMode, setResumeInputMode] = useState("file") // "file" | "paste"
  const [extractingFile, setExtractingFile] = useState(false)
  const resumeFileRef = useRef(null)

  // Devil's Advocate state
  const [devilMode,      setDevilMode]      = useState(false)
  const [devilChallenge, setDevilChallenge] = useState(null)
  const [devilRound,     setDevilRound]     = useState(1)
  const [devilAnswer,    setDevilAnswer]    = useState("")
  const [loadingDevil,   setLoadingDevil]   = useState(false)

  // ── Loading ────────────────────────────────────────────────
  const [loadingQ,     setLoadingQ]     = useState(false)
  const [loadingEval,  setLoadingEval]  = useState(false)
  const [loadingHint,  setLoadingHint]  = useState(false)
  const [loadingSum,   setLoadingSum]   = useState(false)

  const [toast,        setToast]        = useState("")
  const [toastType,    setToastType]    = useState("info")
  const userEmail = localStorage.getItem("userEmail") || ""

  // ── Helpers ─────────────────────────────────────────────────
  const showToast = useCallback((m, t="info") => {
    setToast(m); setToastType(t); setTimeout(() => setToast(""), 3500)
  }, [])

  const currentQ  = questions[qIndex]
  const isMCQ     = currentQ?.type === "mcq"
  const tm        = currentQ ? TYPE_META[currentQ.type] : null
  const progress  = questions.length ? (qIndex / questions.length) * 100 : 0
  const wordCount = answer.trim().split(/\s+/).filter(Boolean).length

  // ── Keyboard shortcuts ──────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === "TEXTAREA" || e.target.tagName === "INPUT") return
      if (screen !== "interview") return
      if (e.key === "h" || e.key === "H") { if (!evaluation && !isMCQ) getHint() }
      if (e.key === "Enter" && !evaluation) evaluateAnswer()
      if (e.key === "n" || e.key === "N") { if (evaluation) nextQuestion() }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [screen, evaluation, isMCQ, answer, mcqChoice])

  // ── Timer effect ────────────────────────────────────────────
  useEffect(() => {
    if (timerOn && timeLeft > 0) {
      timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000)
    } else if (timerOn && timeLeft === 0) {
      setTimerOn(false); showToast("⏰ Time's up — submit your answer!", "error")
    }
    return () => clearTimeout(timerRef.current)
  }, [timerOn, timeLeft, showToast])

  const resetTimer = () => { clearTimeout(timerRef.current); setTimeLeft(120); setTimerOn(false) }

  // ── Voice: sync transcript → answer ─────────────────────────
  useEffect(() => {
    if (voiceMode && transcript) setAnswer(transcript)
  }, [transcript, voiceMode])

  const toggleVoice = () => {
    if (!browserSupportsSpeechRecognition) { showToast("Browser doesn't support voice — use Chrome.", "error"); return }
    if (listening) {
      SpeechRecognition.stopListening()
      setVoiceMode(false)
    } else {
      resetTranscript()
      SpeechRecognition.startListening({ continuous: true, interimResults: true })
      setVoiceMode(true)
      setSpeechStart(Date.now())
      showToast("🎤 Listening… speak your answer", "info")
    }
  }

  // ── Video ────────────────────────────────────────────────────
  const toggleVideo = async () => {
    if (videoOn) {
      videoStream?.getTracks().forEach(t => t.stop())
      setVideoStream(null); setVideoOn(false)
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
      setVideoStream(stream); setVideoOn(true)
      showToast("📹 Camera on — practice your eye contact", "info")
    } catch { showToast("Camera access denied.", "error") }
  }

  useEffect(() => {
    if (videoRef.current && videoStream) videoRef.current.srcObject = videoStream
  }, [videoStream])

  // cleanup video on unmount / screen change
  useEffect(() => {
    return () => { videoStream?.getTracks().forEach(t => t.stop()) }
  }, [videoStream])

  // ── Load history ─────────────────────────────────────────────
  useEffect(() => {
    if (!userEmail) return
    axios.get(`${API}/history/${userEmail}`).then(r => setHistory(r.data.sessions || [])).catch(() => {})
  }, [userEmail])

  // ── Generate questions ───────────────────────────────────────
  const generateQuestions = async () => {
    if (!jobRole.trim()) { showToast("Please enter a job role."); return }
    setLoadingQ(true)
    try {
      const res = await axios.post(`${API}/generate-questions`, {
        job_role: jobRole, question_types: selTypes, difficulty,
        num_questions: numQ, job_description: jobDesc || null, experience_level: expLevel,
      })
      setQuestions(res.data.questions); setQIndex(0); setAnswer(selFramework?.template || ""); setMcqChoice(null)
      setEvaluation(null); setHint(null); setShowHint(false); setShowFU(false)
      setSessionLog([]); setSummary(null); resetTimer(); setScreen("interview")
    } catch { showToast("Failed — is the backend running?", "error") }
    finally { setLoadingQ(false) }
  }

  // ── Evaluate ─────────────────────────────────────────────────
  const evaluateAnswer = async () => {
    if (isMCQ) {
      if (!mcqChoice) { showToast("Please select an option first."); return }
      setLoadingEval(true)
      try {
        const res = await axios.post(`${API}/evaluate-answer`, {
          job_role: jobRole, question: currentQ.question, q_type: currentQ.type,
          answer: mcqChoice, difficulty, is_mcq: true,
          correct_option: currentQ.correct_option, chosen_option: mcqChoice,
        })
        const ev = res.data.evaluation
        setEvaluation(ev); setTimerOn(false)
        if (ev.score >= 9) { setShowConfetti(true); setTimeout(() => setShowConfetti(false), 2500) }
      } catch { showToast("Evaluation failed.", "error") }
      finally { setLoadingEval(false) }
    } else {
      if (!answer.trim()) { showToast("Please write an answer first."); return }
      if (voiceMode) { SpeechRecognition.stopListening(); setVoiceMode(false) }
      setLoadingEval(true); setTimerOn(false)
      try {
        const res = await axios.post(`${API}/evaluate-answer`, {
          job_role: jobRole, question: currentQ.question, q_type: currentQ.type,
          answer, difficulty, is_mcq: false,
        })
        const ev = res.data.evaluation
        setEvaluation(ev)
        if (ev.score >= 9) { setShowConfetti(true); setTimeout(() => setShowConfetti(false), 2500) }
      } catch { showToast("Evaluation failed.", "error") }
      finally { setLoadingEval(false) }
    }
  }

  const getHint = async () => {
    setLoadingHint(true)
    try {
      const res = await axios.post(`${API}/get-hint`, { job_role: jobRole, question: currentQ.question, q_type: currentQ.type })
      setHint(res.data); setShowHint(true)
    } catch { showToast("Hint failed.", "error") }
    finally { setLoadingHint(false) }
  }

  const callDevil = async () => {
    if (!evaluation || isMCQ) return
    setLoadingDevil(true)
    try {
      const res = await axios.post(`${API}/devils-advocate`, {
        job_role: jobRole,
        question: currentQ.question,
        answer: answer,
        q_type: currentQ.type,
        round: devilRound,
      })
      setDevilChallenge(res.data)
      setDevilRound(r => Math.min(r + 1, 3))
    } catch { showToast("Devil mode failed.", "error") }
    finally { setLoadingDevil(false) }
  }


  const extractResumeFile = async (file) => {
    if (!file) return
    setExtractingFile(true)
    setResumeFile(file)
    try {
      const ext = file.name.split(".").pop().toLowerCase()
      if (ext === "pdf") {
        // Use PDF.js via CDN to extract text
        const arrayBuffer = await file.arrayBuffer()
        const pdfjsLib = window["pdfjs-dist/build/pdf"]
        if (!pdfjsLib) {
          // Fallback: tell user to paste text if PDF.js not loaded
          showToast("PDF parsing requires the page to fully load — try pasting text instead.", "error")
          setResumeInputMode("paste")
          setExtractingFile(false)
          return
        }
        pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
        let text = ""
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i)
          const content = await page.getTextContent()
          text += content.items.map(item => item.str).join(" ") + "\n"
        }
        setResumeText(text.trim())
        showToast(`✓ Extracted ${text.trim().split(/\s+/).length} words from ${file.name}`, "success")
      } else if (ext === "docx") {
        const arrayBuffer = await file.arrayBuffer()
        const result = await mammoth.extractRawText({ arrayBuffer })
        setResumeText(result.value.trim())
        showToast(`✓ Extracted ${result.value.trim().split(/\s+/).length} words from ${file.name}`, "success")
      } else {
        showToast("Please upload a PDF or Word (.docx) file.", "error")
      }
    } catch (err) {
      console.error(err)
      showToast("Could not read the file — try pasting your resume text instead.", "error")
      setResumeInputMode("paste")
    } finally {
      setExtractingFile(false)
    }
  }

  const fetchResumeGaps = async () => {
    if (!resumeText.trim()) { showToast("Please paste your resume text first.", "error"); return }
    setLoadingGaps(true); setResumeGaps(null)
    try {
      const res = await axios.post(`${API}/resume-gaps`, {
        resume_text: resumeText,
        job_role: jobRole || "the target role",
        difficulty,
      })
      setResumeGaps(res.data.analysis)
      showToast("Resume analysed — weak spots identified!", "success")
    } catch { showToast("Resume analysis failed.", "error") }
    finally { setLoadingGaps(false) }
  }

  const nextQuestion = () => {
    if (voiceMode) { SpeechRecognition.stopListening(); setVoiceMode(false); resetTranscript() }
    const entry = {
      question: currentQ.question, q_type: currentQ.type,
      answer: isMCQ ? `Selected: ${mcqChoice}` : answer,
      score: evaluation?.score || 0,
      feedback: evaluation ? `Verdict: ${evaluation.verdict}` : "Skipped",
      devil_challenge: devilChallenge?.challenge || null,
      devil_angle:     devilChallenge?.angle     || null,
      devil_answer:    devilAnswer                || null,
      devil_rounds:    devilChallenge ? Math.min(devilRound - 1, 3) : 0,
    }
    const newLog = [...sessionLog, entry]
    setSessionLog(newLog); setAnswer(selFramework?.template || ""); setMcqChoice(null); setEvaluation(null)
    setHint(null); setShowHint(false); setShowFU(false); setFollowUpAns(""); setDevilChallenge(null); setDevilRound(1); setDevilAnswer(""); resetTimer(); resetTranscript()
    if (qIndex + 1 >= questions.length) { fetchSummary(newLog) }
    else { setQIndex(i => i + 1) }
  }

  const fetchSummary = async (log) => {
    setLoadingSum(true); setScreen("summary")
    try {
      const res = await axios.post(`${API}/session-summary`, { job_role: jobRole, qa_pairs: log })
      const sum = res.data.summary
      setSummary(sum)
      // Save to MongoDB
      if (userEmail) {
        await axios.post(`${API}/save-session`, {
          user_email: userEmail, job_role: jobRole, difficulty,
          num_questions: numQ,
          overall_score: sum.overall_score,
          readiness_percentage: sum.readiness_percentage,
          overall_verdict: sum.overall_verdict,
          by_type: sum.by_type,
          qa_pairs: log,
          top_strengths: sum.top_strengths || [],
          key_gaps: sum.key_gaps || [],
        }).catch(() => {})
        // refresh history
        axios.get(`${API}/history/${userEmail}`).then(r => setHistory(r.data.sessions || [])).catch(() => {})
      }
    } catch { showToast("Summary failed.", "error") }
    finally { setLoadingSum(false) }
  }

  const exportResumeGapsPDF = async () => {
    if (!resumeGaps) return
    try {
      const html2pdf = (await import("html2pdf.js")).default
      const el = document.getElementById("resume-gaps-report")
      if (!el) { showToast("Report not ready yet.", "error"); return }
      html2pdf().set({
        margin: [12, 14],
        filename: `${(jobRole || "resume").replace(/\s+/g, "-")}-gap-analysis.pdf`,
        image: { type: "jpeg", quality: 0.97 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: "#080a12" },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      }).from(el).save()
      showToast("Downloading gap analysis PDF…", "success")
    } catch { showToast("PDF export failed.", "error") }
  }

  const exportPDF = async () => {
    if (!summary) return
    try {
      const html2pdf = (await import("html2pdf.js")).default
      html2pdf().set({
        margin:[10,12], filename:`${jobRole.replace(/\s+/g,"-")}-interview-report.pdf`,
        image:{ type:"jpeg", quality:0.97 },
        html2canvas:{ scale:2, useCORS:true },
        jsPDF:{ unit:"mm", format:"a4" },
      }).from(document.getElementById("iv-report")).save()
      showToast("Downloading PDF…", "success")
    } catch { showToast("PDF failed.", "error") }
  }

  const getMCQState = (letter) => {
    if (!evaluation) return letter === mcqChoice ? "selected" : "idle"
    if (letter === currentQ?.correct_option) return letter === mcqChoice ? "correct" : "reveal"
    if (letter === mcqChoice) return "wrong"
    return "idle"
  }

  const toggleType = t => setSelTypes(prev => prev.includes(t) ? (prev.length > 1 ? prev.filter(x => x !== t) : prev) : [...prev, t])

  // ══════════════════════════════════════════════════════════
  // SETUP SCREEN
  // ══════════════════════════════════════════════════════════
  if (screen === "setup") return (
    <div style={S.page}>
      <Toast msg={toast} type={toastType} />
      <header style={S.topbar}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <Link to="/dashboard" style={{ textDecoration:"none" }}>
            <button style={S.backBtn}><ArrowLeft size={15} style={{ marginRight:6 }} />Dashboard</button>
          </Link>
          <div style={S.divider} /><div style={S.logoMark}>S</div>
          <span style={S.logoText}>Interview Prep</span>
        </div>
        {/* Tab switcher */}
        <div style={{ display:"flex", gap:8 }}>
          <button className={`tab-btn ${activeTab==="interview"?"active":"inactive"}`} onClick={() => setActiveTab("interview")}>
            <Brain size={14} style={{ marginRight:6, verticalAlign:"middle" }} />Practice
          </button>
          <button className={`tab-btn ${activeTab==="resume"?"active":"inactive"}`} onClick={() => setActiveTab("resume")}>
            <FileUp size={14} style={{ marginRight:6, verticalAlign:"middle" }} />Resume Analyser
          </button>
          <button className={`tab-btn ${activeTab==="frameworks"?"active":"inactive"}`} onClick={() => setActiveTab("frameworks")}>
            <LayoutTemplate size={14} style={{ marginRight:6, verticalAlign:"middle" }} />Frameworks
          </button>
          <button className={`tab-btn ${activeTab==="history"?"active":"inactive"}`} onClick={() => setActiveTab("history")}>
            <TrendingUp size={14} style={{ marginRight:6, verticalAlign:"middle" }} />Progress
          </button>
        </div>
      </header>

      <div style={{ flex:1, overflowY:"auto", display:"flex", alignItems:"flex-start", justifyContent:"center", padding:"40px 24px" }}>

        {activeTab === "history" ? (
          <motion.div style={{ ...S.setupCard, maxWidth:720 }} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:24, color:"#fff", marginBottom:6 }}>Your Progress</h2>
            <p style={{ fontSize:14, color:"#5a6488", marginBottom:24 }}>Score history across all sessions</p>
            <HistoryChart sessions={history} />
          </motion.div>

        ) : activeTab === "resume" ? (
          <motion.div style={{ ...S.setupCard, maxWidth:800 }} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:8 }}>
              <div style={{ width:44, height:44, borderRadius:12, background:"rgba(52,213,200,0.1)", border:"1px solid rgba(52,213,200,0.2)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <FileUp size={22} color="#34d5c8" />
              </div>
              <div>
                <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:24, color:"#fff" }}>Resume Gap Detector</h2>
                <p style={{ fontSize:13.5, color:"#5a6488" }}>AI-powered · Upload your CV or paste text · Get predicted interview questions</p>
              </div>
            </div>

            <div style={{ marginTop:22, marginBottom:16 }}>
              <label style={S.lbl}>Job Role (optional — improves targeting)</label>
              <input className="iv-inp" style={{ marginTop:8 }} placeholder="e.g. Investment Banking Analyst"
                value={jobRole} onChange={e => setJobRole(e.target.value)} />
            </div>

            {/* ── Input mode toggle ── */}
            <div style={{ display:"flex", gap:8, marginBottom:16 }}>
              {[["file","📎 Upload File"],["paste","✏️ Paste Text"]].map(([mode,label]) => (
                <button key={mode} onClick={() => setResumeInputMode(mode)}
                  style={{ padding:"8px 18px", borderRadius:9, fontSize:13.5, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", transition:"all .15s",
                    background: resumeInputMode===mode ? "rgba(52,213,200,0.12)" : "rgba(255,255,255,0.03)",
                    border: `1.5px solid ${resumeInputMode===mode ? "#34d5c8" : "rgba(255,255,255,0.08)"}`,
                    color: resumeInputMode===mode ? "#34d5c8" : "#5a6488" }}>
                  {label}
                </button>
              ))}
            </div>

            {/* ── File upload mode ── */}
            {resumeInputMode === "file" && (
              <div style={{ marginBottom:16 }}>
                {/* Hidden real input */}
                <input ref={resumeFileRef} type="file" accept=".pdf,.docx,.doc"
                  style={{ display:"none" }}
                  onChange={e => { if (e.target.files[0]) extractResumeFile(e.target.files[0]) }} />

                {/* Drop zone */}
                <div
                  onClick={() => resumeFileRef.current?.click()}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) extractResumeFile(f) }}
                  style={{ border:"2px dashed rgba(52,213,200,0.3)", borderRadius:14, padding:"40px 24px", textAlign:"center", cursor:"pointer", background:"rgba(52,213,200,0.03)", transition:"all .2s", position:"relative" }}>
                  {extractingFile ? (
                    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:12 }}>
                      <span style={{ width:28, height:28, border:"3px solid rgba(52,213,200,0.2)", borderTopColor:"#34d5c8", borderRadius:"50%", animation:"iv-spin .8s linear infinite", display:"inline-block" }} />
                      <span style={{ fontSize:14.5, color:"#34d5c8" }}>Reading your file…</span>
                    </div>
                  ) : resumeFile && resumeText ? (
                    <div>
                      <div style={{ fontSize:32, marginBottom:10 }}>✅</div>
                      <div style={{ fontSize:15, fontWeight:700, color:"#30c97e", marginBottom:4 }}>{resumeFile.name}</div>
                      <div style={{ fontSize:13, color:"#5a6488", marginBottom:12 }}>{resumeText.trim().split(/\s+/).filter(Boolean).length} words extracted successfully</div>
                      <button onClick={e => { e.stopPropagation(); setResumeFile(null); setResumeText(""); setResumeGaps(null); if(resumeFileRef.current) resumeFileRef.current.value="" }}
                        style={{ fontSize:13, color:"#f05252", background:"rgba(240,82,82,0.08)", border:"1px solid rgba(240,82,82,0.25)", borderRadius:8, padding:"6px 14px", cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
                        Remove & upload different file
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontSize:38, marginBottom:12 }}>📄</div>
                      <div style={{ fontSize:15.5, fontWeight:700, color:"#dde1f0", marginBottom:6 }}>Drop your CV here or click to browse</div>
                      <div style={{ fontSize:13.5, color:"#5a6488", marginBottom:16 }}>Supports PDF and Word (.docx) files</div>
                      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:16 }}>
                        {[["📄","PDF"],["📝","Word .docx"]].map(([ico,lbl]) => (
                          <div key={lbl} style={{ display:"flex", alignItems:"center", gap:6, padding:"6px 14px", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:20 }}>
                            <span style={{ fontSize:14 }}>{ico}</span>
                            <span style={{ fontSize:12.5, color:"#7a8096" }}>{lbl}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Paste mode ── */}
            {resumeInputMode === "paste" && (
              <div style={{ marginBottom:16 }}>
                <label style={S.lbl}>Paste Your Resume Text *</label>
                <textarea className="iv-inp iv-ta" rows={10} style={{ marginTop:8, minHeight:200 }}
                  placeholder="Paste the full text of your CV / resume here. Copy from your Word doc or PDF."
                  value={resumeText} onChange={e => setResumeText(e.target.value)} />
                <div style={{ display:"flex", justifyContent:"flex-end", marginTop:5 }}>
                  <span style={{ fontSize:12, color:"#4a5070" }}>{resumeText.trim().split(/\s+/).filter(Boolean).length} words</span>
                </div>
              </div>
            )}

            <motion.button style={{ ...S.btnStart, maxWidth:320, margin:"0 auto", opacity:loadingGaps?0.7:1 }}
              onClick={fetchResumeGaps} disabled={loadingGaps} whileHover={!loadingGaps?{scale:1.02}:{}} whileTap={{scale:0.97}}>
              {loadingGaps ? <><Spin />Analysing your resume…</> : <><Target size={17} style={{marginRight:8}}/>Detect My Weak Spots</>}
            </motion.button>

            {resumeGaps && (
              <motion.div style={{ marginTop:28 }} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}>

                {/* ── Action bar: Download + Practise ── */}
                <div style={{ display:"flex", gap:10, marginBottom:22, flexWrap:"wrap" }}>
                  <motion.button
                    style={{ display:"flex", alignItems:"center", gap:8, padding:"12px 22px", background:"linear-gradient(135deg,#7c6ffa,#34d5c8)", border:"none", borderRadius:11, color:"#fff", fontSize:15, fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", boxShadow:"0 4px 20px rgba(124,111,250,0.3)" }}
                    onClick={exportResumeGapsPDF} whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}>
                    <Download size={16} />Download Report (PDF)
                  </motion.button>
                  <motion.button
                    style={{ display:"flex", alignItems:"center", gap:8, padding:"12px 22px", background:"rgba(48,201,126,0.1)", border:"1.5px solid rgba(48,201,126,0.3)", borderRadius:11, color:"#30c97e", fontSize:15, fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}
                    onClick={() => { setActiveTab("interview"); showToast("Set up a session targeting your weak spots!", "success") }}
                    whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}>
                    <Brain size={16} />Practise Weak Spots →
                  </motion.button>
                </div>

                {/* PDF-targetted wrapper */}
                <div id="resume-gaps-report" style={{ background:"#080a12", padding:"4px 0" }}>

                {/* Summary strip */}
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:20 }}>
                  <div style={{ background:"#0a0c18", border:"1px solid #1e2235", borderRadius:14, padding:"18px 20px" }}>
                    <div style={{ fontSize:12, fontWeight:700, color:"#5a6488", textTransform:"uppercase", letterSpacing:0.9, marginBottom:8 }}>Candidate Profile</div>
                    <p style={{ fontSize:14, color:"#c0c8e0", lineHeight:1.7 }}>{resumeGaps.candidate_summary}</p>
                  </div>
                  <div style={{ background:"#0a0c18", border:"1px solid #1e2235", borderRadius:14, padding:"18px 20px" }}>
                    <div style={{ fontSize:12, fontWeight:700, color:"#5a6488", textTransform:"uppercase", letterSpacing:0.9, marginBottom:8 }}>Interview Readiness</div>
                    <div style={{ fontSize:40, fontWeight:800, fontFamily:"'Playfair Display',serif", color:resumeGaps.overall_readiness>=70?"#30c97e":resumeGaps.overall_readiness>=40?"#f59e0b":"#f05252" }}>
                      {resumeGaps.overall_readiness}<span style={{ fontSize:18, color:"#4a5070" }}>%</span>
                    </div>
                    <div style={{ marginTop:8 }}>
                      <div style={{ fontSize:12, fontWeight:700, color:"#30c97e", marginBottom:6, textTransform:"uppercase", letterSpacing:0.8 }}>Strengths</div>
                      {resumeGaps.strengths?.map((s,i) => (
                        <div key={i} style={{ display:"flex", gap:8, marginBottom:5 }}>
                          <CheckCircle size={13} color="#30c97e" style={{ flexShrink:0, marginTop:2 }} />
                          <span style={{ fontSize:13, color:"#b8f5d8" }}>{s}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Gaps */}
                <div style={{ fontSize:12, fontWeight:700, color:"#f05252", textTransform:"uppercase", letterSpacing:0.9, marginBottom:12 }}>
                  ⚠️ Weak Spots — Questions They Will Ask
                </div>
                {resumeGaps.gaps?.map((gap, gi) => {
                  const sev = gap.severity === "high" ? { c:"#f05252", bg:"rgba(240,82,82,0.08)", border:"rgba(240,82,82,0.2)" }
                            : gap.severity === "medium" ? { c:"#f59e0b", bg:"rgba(245,158,11,0.07)", border:"rgba(245,158,11,0.18)" }
                            : { c:"#34d5c8", bg:"rgba(52,213,200,0.06)", border:"rgba(52,213,200,0.16)" }
                  return (
                    <div key={gi} style={{ background:sev.bg, border:`1px solid ${sev.border}`, borderRadius:14, padding:"18px 20px", marginBottom:12 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                        <span style={{ fontSize:11.5, fontWeight:700, padding:"3px 10px", background:`${sev.c}18`, border:`1px solid ${sev.c}40`, borderRadius:20, color:sev.c, textTransform:"uppercase", letterSpacing:0.8 }}>{gap.severity}</span>
                        <span style={{ fontSize:15.5, fontWeight:700, color:"#dde1f0" }}>{gap.gap}</span>
                      </div>
                      <p style={{ fontSize:14, color:"#8892b0", lineHeight:1.7, marginBottom:14 }}>{gap.explanation}</p>
                      <div style={{ fontSize:12, fontWeight:700, color:sev.c, textTransform:"uppercase", letterSpacing:0.8, marginBottom:8 }}>Questions they'll ask you:</div>
                      {gap.questions?.map((q,qi) => (
                        <div key={qi} style={{ display:"flex", gap:10, marginBottom:8 }}>
                          <span style={{ fontSize:13, fontWeight:700, color:sev.c, flexShrink:0 }}>Q{qi+1}</span>
                          <p style={{ fontSize:14, color:"#fecaca", fontStyle:"italic", lineHeight:1.65, margin:0 }}>"{q}"</p>
                        </div>
                      ))}
                      <div style={{ marginTop:12, padding:"10px 14px", background:"rgba(124,111,250,0.06)", border:"1px solid rgba(124,111,250,0.18)", borderRadius:9 }}>
                        <span style={{ fontSize:12, fontWeight:700, color:"#7c6ffa" }}>💡 Tip: </span>
                        <span style={{ fontSize:13.5, color:"#c0c8e0" }}>{gap.tip}</span>
                      </div>
                    </div>
                  )
                })}

                </div>{/* end #resume-gaps-report */}
              </motion.div>
            )}
          </motion.div>

        ) : activeTab === "frameworks" ? (
          <motion.div style={{ ...S.setupCard, maxWidth:800 }} initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:8 }}>
              <div style={{ width:44, height:44, borderRadius:12, background:"rgba(124,111,250,0.1)", border:"1px solid rgba(124,111,250,0.2)", display:"flex", alignItems:"center", justifyContent:"center" }}>
                <LayoutTemplate size={22} color="#7c6ffa" />
              </div>
              <div>
                <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:24, color:"#fff" }}>Answer Frameworks</h2>
                <p style={{ fontSize:13.5, color:"#5a6488" }}>Pick a framework before your session to structure your answers</p>
              </div>
            </div>

            {Object.entries(FRAMEWORKS).map(([qtype, fws]) => {
              const tm = TYPE_META[qtype] || TYPE_META.behavioural
              return (
                <div key={qtype} style={{ marginTop:24 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:tm.color, textTransform:"uppercase", letterSpacing:0.9, marginBottom:12 }}>
                    {tm.icon} {tm.label} Questions
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                    {fws.map(fw => {
                      const isSel = selFramework?.id === fw.id
                      return (
                        <div key={fw.id} style={{ background:isSel?tm.bg:"#0a0c18", border:`1px solid ${isSel?tm.color:"#1e2235"}`, borderRadius:14, overflow:"hidden", transition:"all .2s" }}>
                          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 20px", cursor:"pointer" }}
                            onClick={() => setSelFramework(isSel ? null : { ...fw, qtype })}>
                            <div>
                              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                                <span style={{ fontSize:15, fontWeight:700, color:isSel?tm.color:"#dde1f0" }}>{fw.label}</span>
                                <span style={{ fontSize:12.5, color:"#5a6488" }}>{fw.desc}</span>
                              </div>
                            </div>
                            <span style={{ fontSize:13, color:isSel?tm.color:"#4a5070", fontWeight:600 }}>{isSel?"▼ Selected":"▶ Preview"}</span>
                          </div>
                          {isSel && (
                            <div style={{ padding:"0 20px 20px" }}>
                              <pre style={{ fontSize:13.5, color:"#8892b0", lineHeight:1.8, whiteSpace:"pre-wrap", fontFamily:"'DM Sans',sans-serif", background:"rgba(0,0,0,0.2)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:10, padding:"14px 16px" }}>{fw.template}</pre>
                              <button style={{ marginTop:12, display:"flex", alignItems:"center", gap:8, padding:"10px 20px", background:`${tm.color}18`, border:`1px solid ${tm.color}40`, borderRadius:9, color:tm.color, fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}
                                onClick={() => { setActiveTab("interview"); showToast(`${fw.label} template ready — start a session and it'll pre-fill your answer!`, "success") }}>
                                <Brain size={15} />Use this template in my next session →
                              </button>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </motion.div>

        ) : (
          <motion.div style={S.setupCard} initial={{ opacity:0, y:24 }} animate={{ opacity:1, y:0 }}>
            <div style={{ textAlign:"center", marginBottom:36 }}>
              <div style={S.setupIcon}><Brain size={36} color="#7c6ffa" /></div>
              <h1 style={S.setupTitle}>Mock Interview Setup</h1>
              <p style={{ fontSize:16, color:"#5a6488", marginTop:10, lineHeight:1.65 }}>Configure your session — voice, video, and AI feedback all included</p>
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:22, marginBottom:30 }}>

              <div style={S.sf}>
                <label style={S.lbl}>Job Role *</label>
                <input className="iv-inp" placeholder="e.g. Investment Banking Analyst"
                  value={jobRole} onChange={e => setJobRole(e.target.value)} />
              </div>

              <div style={S.sf}>
                <label style={S.lbl}>Experience Level</label>
                <div style={{ display:"flex", gap:10 }}>
                  {EXP_LVLS.map(l => (
                    <button key={l} onClick={() => setExpLevel(l)} style={{ flex:1, padding:"12px 8px", background:expLevel===l?"rgba(124,111,250,0.15)":"rgba(255,255,255,0.03)", border:`1.5px solid ${expLevel===l?"#7c6ffa":"#2a2d42"}`, borderRadius:10, color:expLevel===l?"#c4bcfc":"#7a8096", fontSize:14.5, fontWeight:expLevel===l?700:400, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", textTransform:"capitalize" }}>{l}</button>
                  ))}
                </div>
              </div>

              <div style={S.sf}>
                <label style={S.lbl}>Difficulty</label>
                <div style={{ display:"flex", gap:10 }}>
                  {DIFFS.map(d => {
                    const c = d==="easy"?"#30c97e":d==="medium"?"#f59e0b":"#f05252"
                    return <button key={d} onClick={() => setDifficulty(d)} style={{ flex:1, padding:"12px 8px", background:difficulty===d?`${c}18`:"rgba(255,255,255,0.03)", border:`1.5px solid ${difficulty===d?c:"#2a2d42"}`, borderRadius:10, color:difficulty===d?c:"#7a8096", fontSize:14.5, fontWeight:difficulty===d?700:400, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", textTransform:"capitalize" }}>{d}</button>
                  })}
                </div>
              </div>

              <div style={S.sf}>
                <label style={S.lbl}>Questions — <span style={{ color:"#7c6ffa", fontWeight:700 }}>{numQ}</span></label>
                <input type="range" min={4} max={15} value={numQ} onChange={e => setNumQ(+e.target.value)} style={{ width:"100%", accentColor:"#7c6ffa", height:6 }} />
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:12.5, color:"#4a5070", marginTop:4 }}>
                  <span>4 (Quick)</span><span>10 (Standard)</span><span>15 (Deep)</span>
                </div>
              </div>

              <div style={S.sf}>
                <label style={S.lbl}>Question Types</label>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                  {Q_TYPES.map(t => {
                    const m = TYPE_META[t]; const sel = selTypes.includes(t)
                    return (
                      <button key={t} onClick={() => toggleType(t)} style={{ padding:"15px 10px", background:sel?m.bg:"rgba(255,255,255,0.03)", border:`1.5px solid ${sel?m.color:"#2a2d42"}`, borderRadius:12, cursor:"pointer", textAlign:"center", transition:"all .18s" }}>
                        <div style={{ fontSize:24, marginBottom:6 }}>{m.icon}</div>
                        <div style={{ fontSize:14, fontWeight:700, color:sel?m.color:"#7a8096", fontFamily:"'DM Sans',sans-serif" }}>{m.label}</div>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div style={S.sf}>
                <label style={S.lbl}>Job Description <span style={{ color:"#4a5070", fontWeight:400, textTransform:"none", fontSize:12 }}>(optional)</span></label>
                <textarea className="iv-inp iv-ta" rows={4} placeholder="Paste JD for targeted questions..." value={jobDesc} onChange={e => setJobDesc(e.target.value)} />
              </div>

              {/* Feature pills */}
              <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                {[
                  { icon:<Mic size={13}/>, label:"Voice answers" },
                  { icon:<Video size={13}/>, label:"Video mode" },
                  { icon:<Activity size={13}/>, label:"Speech analysis" },
                  { icon:<Target size={13}/>, label:"STAR coach" },
                  { icon:<TrendingUp size={13}/>, label:"Progress saved" },
                  { icon:<BookOpen size={13}/>, label:"Keyboard shortcuts" },
                  { icon:<Flame size={13}/>, label:"Devil's advocate" },
                ].map(f => (
                  <div key={f.label} style={{ display:"flex", alignItems:"center", gap:6, padding:"5px 12px", background:"rgba(124,111,250,0.07)", border:"1px solid rgba(124,111,250,0.18)", borderRadius:20 }}>
                    <span style={{ color:"#7c6ffa" }}>{f.icon}</span>
                    <span style={{ fontSize:12.5, color:"#9d94fb", fontFamily:"'DM Sans',sans-serif" }}>{f.label}</span>
                  </div>
                ))}
              </div>

            </div>

            <motion.button style={{ ...S.btnStart, opacity:loadingQ?0.7:1 }}
              onClick={generateQuestions} disabled={loadingQ}
              whileHover={!loadingQ?{ scale:1.02 }:{}} whileTap={{ scale:0.97 }}>
              {loadingQ ? <><Spin />Generating Questions…</> : <><Play size={18} style={{ marginRight:8 }} />Start Mock Interview</>}
            </motion.button>

            <p style={{ textAlign:"center", fontSize:12.5, color:"#4a5070", marginTop:14, fontFamily:"'DM Sans',sans-serif" }}>
              Shortcuts: <strong style={{ color:"#7c6ffa" }}>H</strong> = hint · <strong style={{ color:"#7c6ffa" }}>Enter</strong> = submit · <strong style={{ color:"#7c6ffa" }}>N</strong> = next
            </p>
          </motion.div>
        )}
      </div>
    </div>
  )

  // ══════════════════════════════════════════════════════════
  // SUMMARY SCREEN
  // ══════════════════════════════════════════════════════════
  if (screen === "summary") return (
    <div style={S.page}>
      <Toast msg={toast} type={toastType} />
      <header style={S.topbar}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <button style={S.backBtn} onClick={() => { setScreen("setup"); setQuestions([]); setSummary(null) }}>
            <RefreshCw size={14} style={{ marginRight:6 }} />New Session
          </button>
          <div style={S.divider} /><div style={S.logoMark}>S</div>
          <span style={S.logoText}>Report — {jobRole}</span>
        </div>
        {summary && (
          <motion.button style={{ ...S.topBtn, background:"linear-gradient(135deg,#7c6ffa,#34d5c8)", border:"none", color:"#fff", fontWeight:700 }}
            onClick={exportPDF} whileHover={{ scale:1.04 }} whileTap={{ scale:0.96 }}>
            <Download size={15} style={{ marginRight:6 }} />Export PDF
          </motion.button>
        )}
      </header>

      <div style={{ overflowY:"auto", flex:1, padding:"32px 0" }}>
        <div style={{ maxWidth:920, margin:"0 auto", padding:"0 30px" }} id="iv-report">
          {loadingSum ? (
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", paddingTop:100, gap:20 }}>
              <div style={{ width:60, height:60, border:"3px solid rgba(124,111,250,0.2)", borderTopColor:"#7c6ffa", borderRadius:"50%", animation:"iv-spin .8s linear infinite" }} />
              <p style={{ color:"#5a6488", fontSize:17 }}>Generating your performance report…</p>
            </div>
          ) : summary ? (
            <motion.div style={{ display:"flex", flexDirection:"column", gap:22 }} initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}>

              {/* Score hero */}
              <div style={{ background:"linear-gradient(135deg,#0f1124,#13152e)", border:"1px solid #1e2235", borderRadius:20, padding:"40px", textAlign:"center" }}>
                <div style={{ fontSize:78, fontWeight:800, fontFamily:"'Playfair Display',serif", color:scoreColor(summary.overall_score), lineHeight:1 }}>
                  {summary.overall_score}<span style={{ fontSize:32, color:"#4a5070" }}>/10</span>
                </div>
                <div style={{ marginTop:12, fontSize:22, fontWeight:700, color:"#dde1f0" }}>{summary.overall_verdict}</div>
                <div style={{ marginTop:12, fontSize:16, color:"#5a6488", maxWidth:600, margin:"14px auto 0", lineHeight:1.8 }}>{summary.overall_summary}</div>
                <div style={{ marginTop:30, maxWidth:440, margin:"30px auto 0" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", marginBottom:9 }}>
                    <span style={{ fontSize:14, color:"#5a6488" }}>Interview Readiness</span>
                    <span style={{ fontSize:14, fontWeight:700, color:scoreColor(summary.overall_score) }}>{summary.readiness_percentage}%</span>
                  </div>
                  <div className="score-bar">
                    <div className="score-fill" style={{ width:`${summary.readiness_percentage}%`, background:`linear-gradient(90deg,${scoreColor(summary.overall_score)},#7c6ffa)` }} />
                  </div>
                </div>
              </div>

              {/* By type */}
              {summary.by_type && (
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))", gap:14 }}>
                  {Object.entries(summary.by_type).filter(([,d]) => d && d.avg_score > 0).map(([type, data]) => {
                    const m = TYPE_META[type] || TYPE_META.technical
                    return (
                      <div key={type} style={{ background:"#0c0e1a", border:`1px solid ${m.color}28`, borderRadius:16, padding:"20px" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:9, marginBottom:12 }}>
                          <span style={{ fontSize:22 }}>{m.icon}</span>
                          <span style={{ fontSize:14, fontWeight:700, color:m.color }}>{m.label}</span>
                        </div>
                        <div style={{ fontSize:32, fontWeight:800, color:scoreColor(data.avg_score), fontFamily:"'Playfair Display',serif" }}>{data.avg_score}<span style={{ fontSize:16, color:"#4a5070" }}>/10</span></div>
                        <div className="score-bar" style={{ marginTop:10 }}>
                          <div className="score-fill" style={{ width:`${data.avg_score*10}%`, background:m.color }} />
                        </div>
                        <p style={{ fontSize:13.5, color:"#5a6488", marginTop:10, lineHeight:1.6 }}>{data.comment}</p>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Strengths & Gaps */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                {[
                  { title:"✦ Top Strengths", color:"#30c97e", bg:"rgba(48,201,126,0.05)", border:"rgba(48,201,126,0.18)", Icon:CheckCircle, items:summary.top_strengths },
                  { title:"⚡ Key Gaps",     color:"#f59e0b", bg:"rgba(245,158,11,0.05)",  border:"rgba(245,158,11,0.18)",  Icon:AlertCircle, items:summary.key_gaps },
                ].map(({ title, color, bg, border, Icon, items }) => (
                  <div key={title} style={{ background:bg, border:`1px solid ${border}`, borderRadius:16, padding:"22px" }}>
                    <h3 style={{ fontSize:12, fontWeight:700, color, textTransform:"uppercase", letterSpacing:0.9, marginBottom:16 }}>{title}</h3>
                    {items?.map((s,i) => (
                      <div key={i} style={{ display:"flex", gap:10, marginBottom:12 }}>
                        <Icon size={16} color={color} style={{ flexShrink:0, marginTop:2 }} />
                        <span style={{ fontSize:14.5, color:"#c0c8e0", lineHeight:1.65 }}>{s}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div style={{ background:"rgba(124,111,250,0.05)", border:"1px solid rgba(124,111,250,0.18)", borderRadius:16, padding:"24px" }}>
                <h3 style={{ fontSize:12, fontWeight:700, color:"#7c6ffa", textTransform:"uppercase", letterSpacing:0.9, marginBottom:18 }}>📚 Before Your Real Interview</h3>
                {summary.recommended_actions?.map((a,i) => (
                  <div key={i} style={{ display:"flex", gap:14, marginBottom:14 }}>
                    <div style={{ width:26, height:26, borderRadius:"50%", background:"rgba(124,111,250,0.14)", border:"1px solid rgba(124,111,250,0.3)", color:"#7c6ffa", fontSize:12, fontWeight:700, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{i+1}</div>
                    <span style={{ fontSize:15, color:"#c0c8e0", lineHeight:1.7 }}>{a}</span>
                  </div>
                ))}
              </div>

              {/* Q&A log */}
              <div>
                <h3 style={{ fontSize:12, fontWeight:700, color:"#5a6488", textTransform:"uppercase", letterSpacing:0.9, marginBottom:16 }}>Full Q&A Log</h3>
                <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                  {sessionLog.map((entry,i) => {
                    const m = TYPE_META[entry.q_type] || TYPE_META.technical
                    return (
                      <div key={i} style={{ background:"#0c0e1a", border:"1px solid #1e2235", borderRadius:14, padding:"18px 20px" }}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:10 }}>
                          <span style={{ fontSize:12.5, fontWeight:700, color:m.color, background:m.bg, padding:"4px 12px", borderRadius:20 }}>{m.icon} {m.label}</span>
                          <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                            {entry.devil_rounds > 0 && (
                              <span style={{ fontSize:11.5, padding:"3px 10px", background:"rgba(240,82,82,0.1)", border:"1px solid rgba(240,82,82,0.25)", borderRadius:20, color:"#f87171", fontWeight:700 }}>
                                😈 {entry.devil_rounds} devil round{entry.devil_rounds>1?"s":""}
                              </span>
                            )}
                            <span style={{ fontSize:16, fontWeight:700, color:scoreColor(entry.score) }}>{entry.score}/10</span>
                          </div>
                        </div>
                        <p style={{ fontSize:15.5, color:"#dde1f0", fontWeight:600, marginBottom:8, lineHeight:1.55 }}>Q{i+1}: {entry.question}</p>
                        <p style={{ fontSize:14, color:"#5a6488", lineHeight:1.7, marginBottom: entry.devil_challenge ? 12 : 0 }}><strong style={{ color:"#7a8096" }}>Answer:</strong> {entry.answer || <em>Skipped</em>}</p>
                        {entry.devil_challenge && (
                          <div style={{ marginTop:12, borderTop:"1px solid rgba(240,82,82,0.15)", paddingTop:12 }}>
                            <div style={{ display:"flex", gap:10, marginBottom:8 }}>
                              <span style={{ fontSize:20, flexShrink:0 }}>😈</span>
                              <div>
                                <div style={{ fontSize:11, fontWeight:700, color:"#f87171", textTransform:"uppercase", letterSpacing:0.8, marginBottom:5 }}>Devil's challenge · {entry.devil_angle}</div>
                                <p style={{ fontSize:13.5, color:"#fca5a5", fontStyle:"italic", lineHeight:1.65, margin:0 }}>"{entry.devil_challenge}"</p>
                              </div>
                            </div>
                            {entry.devil_answer && (
                              <div style={{ display:"flex", gap:10, marginLeft:30 }}>
                                <span style={{ fontSize:20, flexShrink:0 }}>🧑</span>
                                <div>
                                  <div style={{ fontSize:11, fontWeight:700, color:"#7c6ffa", textTransform:"uppercase", letterSpacing:0.8, marginBottom:5 }}>Your defence</div>
                                  <p style={{ fontSize:13.5, color:"#c0c8e0", lineHeight:1.65, margin:0 }}>{entry.devil_answer}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          ) : null}
        </div>
      </div>
    </div>
  )

  // ══════════════════════════════════════════════════════════
  // INTERVIEW SCREEN
  // ══════════════════════════════════════════════════════════
  return (
    <div style={S.page}>
      <Confetti show={showConfetti} />
      <Toast msg={toast} type={toastType} />

      <header style={S.topbar}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <button style={S.backBtn} onClick={() => { videoStream?.getTracks().forEach(t=>t.stop()); setScreen("setup") }}>
            <ArrowLeft size={15} style={{ marginRight:6 }} />Setup
          </button>
          <div style={S.divider} /><div style={S.logoMark}>S</div>
          <span style={S.logoText}>{jobRole}</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <Timer seconds={timeLeft} />
          <button style={S.topBtn} onClick={timerOn ? ()=>setTimerOn(false) : ()=>{ setTimeLeft(120); setTimerOn(true) }}>
            {timerOn ? "⏸ Pause" : "▶ Timer"}
          </button>
          {/* Video toggle */}
          <button style={{ ...S.topBtn, color: videoOn ? "#30c97e" : "#5a6488", borderColor: videoOn ? "rgba(48,201,126,0.35)" : "rgba(255,255,255,0.1)" }}
            onClick={toggleVideo} title="Toggle camera">
            {videoOn ? <Video size={15} /> : <VideoOff size={15} />}
          </button>
        </div>
      </header>

      {/* Progress bar */}
      <div style={{ height:3, background:"#1e2235", flexShrink:0 }}>
        <motion.div style={{ height:"100%", background:"linear-gradient(90deg,#7c6ffa,#34d5c8)" }}
          animate={{ width:`${progress}%` }} transition={{ duration:0.5 }} />
      </div>

      <div style={S.ivLayout}>

        {/* ── LEFT PANEL ── */}
        <div style={S.ivLeft}>

          {/* Video preview (top of left panel when on) */}
          <AnimatePresence>
            {videoOn && (
              <motion.div style={{ marginBottom:20, borderRadius:14, overflow:"hidden", position:"relative", background:"#0a0c18", border:"1px solid rgba(48,201,126,0.3)" }}
                initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:180 }} exit={{ opacity:0, height:0 }}>
                <video ref={videoRef} autoPlay muted playsInline style={{ width:"100%", height:180, objectFit:"cover", transform:"scaleX(-1)" }} />
                <div style={{ position:"absolute", top:10, left:12, display:"flex", alignItems:"center", gap:6, padding:"4px 10px", background:"rgba(0,0,0,0.6)", borderRadius:20 }}>
                  <div style={{ width:7, height:7, borderRadius:"50%", background:"#f05252", animation:"iv-pulse 1.2s ease-in-out infinite" }} />
                  <span style={{ fontSize:11.5, color:"#fff", fontFamily:"'DM Sans',sans-serif" }}>LIVE — watch your eye contact</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Q counter + type badge */}
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:22 }}>
            <span style={{ fontSize:15, color:"#5a6488" }}>
              Question <strong style={{ color:"#dde1f0", fontSize:16 }}>{qIndex+1}</strong>
              <span style={{ color:"#4a5070" }}> / {questions.length}</span>
            </span>
            {tm && <span style={{ fontSize:13, fontWeight:700, color:tm.color, background:tm.bg, padding:"5px 16px", borderRadius:20 }}>{tm.icon} {tm.label}</span>}
          </div>

          {/* Question text */}
          <motion.div key={`q-${qIndex}`} initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }}>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(20px,2.6vw,28px)", color:"#fff", lineHeight:1.5, marginBottom:14, fontWeight:700 }}>
              {currentQ?.question}
            </h2>
            {currentQ?.tip && !isMCQ && (
              <div style={{ padding:"12px 16px", background:"rgba(124,111,250,0.07)", border:"1px solid rgba(124,111,250,0.18)", borderRadius:11, marginBottom:20 }}>
                <p style={{ fontSize:14, color:"#9d94fb", margin:0, lineHeight:1.65 }}>
                  💡 <strong>Interviewer looks for:</strong> {currentQ.tip}
                </p>
              </div>
            )}
          </motion.div>

          {/* MCQ Options */}
          {isMCQ && currentQ?.options && (
            <motion.div key={`mcq-${qIndex}`} initial={{ opacity:0 }} animate={{ opacity:1 }} style={{ marginBottom:20 }}>
              {mcqChoice && !evaluation && (
                <motion.div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:12, padding:"8px 14px", background:"rgba(124,111,250,0.07)", border:"1px solid rgba(124,111,250,0.15)", borderRadius:9 }}
                  initial={{ opacity:0, y:-6 }} animate={{ opacity:1, y:0 }}>
                  <RotateCcw size={13} color="#7c6ffa" />
                  <span style={{ fontSize:13, color:"#7c6ffa" }}>Double-click to deselect</span>
                </motion.div>
              )}
              {Object.entries(currentQ.options).map(([letter, text]) => (
                <MCQOption key={letter} letter={letter} text={text} state={getMCQState(letter)} disabled={!!evaluation}
                  onClick={() => setMcqChoice(letter)}
                  onDoubleClick={() => { if (mcqChoice === letter) setMcqChoice(null) }} />
              ))}
              <AnimatePresence>
                {evaluation && currentQ.explanation && (
                  <motion.div style={{ padding:"14px 18px", background:"rgba(52,213,200,0.07)", border:"1px solid rgba(52,213,200,0.22)", borderRadius:12, marginTop:6 }}
                    initial={{ opacity:0, y:-6 }} animate={{ opacity:1, y:0 }}>
                    <p style={{ fontSize:15, color:"#99f6e4", margin:0, lineHeight:1.7 }}>
                      <strong style={{ color:"#34d5c8" }}>Explanation:</strong> {currentQ.explanation}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* Open-ended: hint + voice + textarea */}
          {!isMCQ && (
            <>
              {/* Hint + Voice toggle row */}
              <div style={{ display:"flex", gap:10, marginBottom:16, flexWrap:"wrap" }}>
                <button style={{ display:"inline-flex", alignItems:"center", gap:7, padding:"9px 16px", background:showHint?"rgba(245,158,11,0.1)":"rgba(255,255,255,0.04)", border:`1px solid ${showHint?"rgba(245,158,11,0.35)":"rgba(255,255,255,0.1)"}`, borderRadius:9, color:"#f59e0b", fontSize:14, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}
                  onClick={showHint ? ()=>setShowHint(false) : getHint} disabled={loadingHint}>
                  {loadingHint ? <Spin /> : <Lightbulb size={15} />}
                  {showHint ? "Hide Hint" : "Get a Hint (H)"}
                </button>

                {browserSupportsSpeechRecognition && (
                  <button style={{ display:"inline-flex", alignItems:"center", gap:7, padding:"9px 16px", position:"relative", background:listening?"rgba(240,82,82,0.1)":"rgba(255,255,255,0.04)", border:`1px solid ${listening?"rgba(240,82,82,0.35)":"rgba(255,255,255,0.1)"}`, borderRadius:9, color:listening?"#f05252":"#5a6488", fontSize:14, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}
                    onClick={toggleVoice} disabled={!!evaluation}>
                    {listening && <span className="mic-ring" />}
                    {listening ? <MicOff size={15} /> : <Mic size={15} />}
                    {listening ? "Stop Recording" : "Voice Answer"}
                  </button>
                )}
              </div>

              <AnimatePresence>
                {showHint && hint && (
                  <motion.div style={{ marginBottom:14, padding:"14px 18px", background:"rgba(245,158,11,0.07)", border:"1px solid rgba(245,158,11,0.2)", borderRadius:11 }}
                    initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}>
                    <p style={{ fontSize:14.5, color:"#fcd34d", margin:0, lineHeight:1.7 }}>{hint.hint}</p>
                    {hint.framework && <p style={{ fontSize:13.5, color:"#92400e", marginTop:8 }}>Framework: <strong style={{ color:"#f59e0b" }}>{hint.framework}</strong></p>}
                  </motion.div>
                )}
              </AnimatePresence>

              <div style={{ marginBottom:10 }}>
                <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:6 }}>
                  <label style={S.lbl}>Your Answer {listening && <span style={{ color:"#f05252", fontWeight:700 }}>● RECORDING</span>}</label>
                  {selFramework && (
                    <div style={{ display:"flex", alignItems:"center", gap:7 }}>
                      <span style={{ fontSize:12, padding:"3px 10px", background:"rgba(124,111,250,0.12)", border:"1px solid rgba(124,111,250,0.25)", borderRadius:20, color:"#a99dfc", fontWeight:600 }}>
                        📐 {selFramework.label} template
                      </span>
                      <button style={{ fontSize:12, color:"#5a6488", background:"none", border:"none", cursor:"pointer" }} onClick={() => { setSelFramework(null); setAnswer("") }}>✕ clear</button>
                    </div>
                  )}
                </div>
                <textarea className="iv-inp iv-ta" rows={8} style={{ marginTop:8, borderColor: listening ? "#f05252" : undefined }}
                  placeholder={currentQ?.type==="behavioural" ? "STAR: Situation → Task → Action → Result..." : currentQ?.type==="case" ? "Clarify → Framework → Solve step-by-step..." : "Explain with specific terminology and examples..."}
                  value={answer} onChange={e => { if (!voiceMode) setAnswer(e.target.value) }}
                  disabled={!!evaluation} readOnly={!!voiceMode} />
                <div style={{ display:"flex", justifyContent:"space-between", marginTop:6 }}>
                  <span style={{ fontSize:13, color:wordCount<20&&answer?"#f59e0b":"#4a5070" }}>
                    {wordCount<20&&answer?"⚠ Write more for a fair evaluation":""}
                  </span>
                  <span style={{ fontSize:13, color:"#4a5070" }}>{wordCount} words</span>
                </div>
              </div>

              {/* STAR coach for behavioural */}
              {currentQ?.type === "behavioural" && answer.length > 20 && <STARCoach text={answer} />}

              {/* Live speech analysis */}
              {voiceMode && transcript && <SpeechAnalysis transcript={transcript} startTime={speechStart} />}
            </>
          )}

          {/* Action buttons */}
          {!evaluation ? (
            <div style={{ display:"flex", gap:10, marginTop:14 }}>
              <motion.button style={{ flex:1, ...S.btnSubmit, opacity:loadingEval?0.7:1 }}
                onClick={evaluateAnswer} disabled={loadingEval}
                whileHover={!loadingEval?{ scale:1.02 }:{}} whileTap={{ scale:0.97 }}>
                {loadingEval ? <><Spin />Evaluating…</> : <><Zap size={16} style={{ marginRight:8 }} />Submit (Enter)</>}
              </motion.button>
              <button style={{ padding:"14px 22px", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)", borderRadius:11, color:"#5a6488", fontSize:15, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}
                onClick={nextQuestion}>Skip →</button>
            </div>
          ) : (
            <motion.button style={S.btnNext} onClick={nextQuestion}
              initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
              whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}>
              {qIndex+1 >= questions.length
                ? <><Trophy size={17} style={{ marginRight:8 }} />Finish & See Report</>
                : <>Next Question (N) <ArrowRight size={16} style={{ marginLeft:8 }} /></>}
            </motion.button>
          )}

          {/* ══ DEVIL'S ADVOCATE ══ inside ivLeft, below submit/next buttons ══ */}
          {!isMCQ && evaluation && (
            <motion.div
              initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.15 }}
              style={{ marginTop:24, border:"2px solid rgba(240,82,82,0.3)", borderRadius:16, overflow:"hidden", background:"rgba(15,8,8,0.5)" }}>

              {/* ── Header ── */}
              <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10, padding:"14px 20px", background:"rgba(240,82,82,0.07)", borderBottom:"1px solid rgba(240,82,82,0.16)" }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ width:34, height:34, borderRadius:9, background:"rgba(240,82,82,0.15)", border:"1px solid rgba(240,82,82,0.3)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>😈</div>
                  <div>
                    <div style={{ fontSize:13, fontWeight:800, color:"#f05252", textTransform:"uppercase", letterSpacing:1, fontFamily:"'DM Sans',sans-serif" }}>
                      Devil's Advocate
                      {devilRound > 1 && <span style={{ marginLeft:10, fontSize:11, fontWeight:700, padding:"2px 10px", background:"rgba(240,82,82,0.15)", border:"1px solid rgba(240,82,82,0.3)", borderRadius:20, color:"#f87171", verticalAlign:"middle" }}>Round {Math.min(devilRound-1,3)}/3</span>}
                    </div>
                    <div style={{ fontSize:12, color:"#9b4040", marginTop:1, fontFamily:"'DM Sans',sans-serif" }}>Optional — scroll down to stress-test your answer</div>
                  </div>
                </div>
                {/* Primary action in header */}
                {!devilChallenge && devilRound <= 3 && (
                  <button onClick={callDevil} disabled={loadingDevil}
                    style={{ display:"flex", alignItems:"center", gap:7, padding:"9px 18px", background:"linear-gradient(135deg,#b91c1c,#ef4444)", border:"none", borderRadius:10, color:"#fff", fontSize:13.5, fontWeight:700, cursor:loadingDevil?"not-allowed":"pointer", fontFamily:"'DM Sans',sans-serif", opacity:loadingDevil?0.7:1, flexShrink:0 }}>
                    {loadingDevil
                      ? <><span style={{ width:12,height:12,border:"2px solid rgba(255,255,255,0.3)",borderTopColor:"#fff",borderRadius:"50%",animation:"iv-spin .7s linear infinite",display:"inline-block" }} /> Thinking…</>
                      : "😈 Challenge my answer"}
                  </button>
                )}
              </div>

              {/* ── Idle state (not yet activated) ── */}
              {!devilChallenge && !loadingDevil && (
                <div style={{ padding:"16px 20px", display:"flex", alignItems:"center", gap:12 }}>
                  <span style={{ fontSize:13, color:"#7a4040", lineHeight:1.7, fontFamily:"'DM Sans',sans-serif" }}>
                    AI will find the weakest point in your answer and push back hard. Up to 3 escalating rounds. Everything saved in your report.
                  </span>
                </div>
              )}

              {/* ── Loading state ── */}
              {loadingDevil && (
                <div style={{ padding:"18px 20px", display:"flex", alignItems:"center", gap:12 }}>
                  <span style={{ width:16,height:16,border:"2px solid rgba(240,82,82,0.25)",borderTopColor:"#f05252",borderRadius:"50%",animation:"iv-spin .8s linear infinite",display:"inline-block",flexShrink:0 }} />
                  <span style={{ fontSize:14, color:"#9b4040", fontFamily:"'DM Sans',sans-serif" }}>Finding a weakness in your answer…</span>
                </div>
              )}

              {/* ── Active challenge thread ── */}
              {devilChallenge && (
                <div style={{ padding:"16px 20px", display:"flex", flexDirection:"column", gap:14 }}>

                  {/* AI challenge bubble */}
                  <div style={{ display:"flex", gap:12 }}>
                    <div style={{ width:32,height:32,borderRadius:9,background:"rgba(240,82,82,0.15)",border:"1px solid rgba(240,82,82,0.3)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0,marginTop:2 }}>😈</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <span style={{ fontSize:11,fontWeight:800,padding:"2px 10px",background:"rgba(240,82,82,0.15)",border:"1px solid rgba(240,82,82,0.3)",borderRadius:20,color:"#f87171",textTransform:"uppercase",letterSpacing:0.8,fontFamily:"'DM Sans',sans-serif",display:"inline-block",marginBottom:8 }}>
                        {devilChallenge.angle}
                      </span>
                      <div style={{ padding:"13px 16px",background:"rgba(240,82,82,0.06)",border:"1px solid rgba(240,82,82,0.18)",borderRadius:"0 12px 12px 12px" }}>
                        <p style={{ fontSize:15,color:"#fecaca",fontWeight:500,lineHeight:1.75,margin:0,fontStyle:"italic",wordBreak:"break-word" }}>
                          "{devilChallenge.challenge}"
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* User defence */}
                  <div style={{ display:"flex", gap:12 }}>
                    <div style={{ width:32,height:32,borderRadius:9,background:"rgba(124,111,250,0.12)",border:"1px solid rgba(124,111,250,0.25)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0,marginTop:2 }}>🧑</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <label style={{ fontSize:11,fontWeight:800,color:"#a99dfc",textTransform:"uppercase",letterSpacing:0.9,display:"block",marginBottom:7,fontFamily:"'DM Sans',sans-serif" }}>Your defence</label>
                      <textarea className="iv-inp iv-ta" rows={3}
                        style={{ borderColor:"rgba(124,111,250,0.25)",minHeight:80,background:"rgba(124,111,250,0.03)",fontSize:14.5 }}
                        placeholder="Defend your position, admit the flaw, or restructure your thinking…"
                        value={devilAnswer} onChange={e => setDevilAnswer(e.target.value)} />
                    </div>
                  </div>

                  {/* Bottom action row */}
                  <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
                    {devilRound <= 3 ? (
                      <button onClick={callDevil} disabled={loadingDevil || !devilAnswer.trim()}
                        style={{ display:"flex",alignItems:"center",gap:7,padding:"9px 18px",background:"rgba(240,82,82,0.09)",border:"1.5px solid rgba(240,82,82,0.3)",borderRadius:9,color:devilAnswer.trim()?"#f87171":"#6b2e2e",fontSize:13.5,fontWeight:700,cursor:(!loadingDevil&&devilAnswer.trim())?"pointer":"not-allowed",fontFamily:"'DM Sans',sans-serif",opacity:(!loadingDevil&&devilAnswer.trim())?1:0.5 }}>
                        {loadingDevil?"…":`🔥 Push harder — Round ${devilRound}`}
                      </button>
                    ) : (
                      <span style={{ fontSize:13,color:"#30c97e",fontWeight:700,fontFamily:"'DM Sans',sans-serif" }}>
                        💀 All 3 rounds done
                      </span>
                    )}
                    <span style={{ fontSize:12,color:"#6b2e2e",fontFamily:"'DM Sans',sans-serif",marginLeft:"auto" }}>
                      {devilRound<=3?`${4-devilRound} round${4-devilRound===1?"":"s"} remaining`:"Complete ✓"}
                    </span>
                  </div>

                </div>
              )}

              {/* ── Always-visible "I'm done" Next button inside devil section ── */}
              <div style={{ padding:"12px 20px", borderTop:"1px solid rgba(255,255,255,0.05)", background:"rgba(255,255,255,0.02)" }}>
                <motion.button style={{ ...S.btnNext, marginTop:0, background:"linear-gradient(135deg,#0f7a5a,#30c97e)" }}
                  onClick={nextQuestion} whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}>
                  {qIndex+1 >= questions.length
                    ? <><Trophy size={17} style={{ marginRight:8 }} />Finish & See Report</>
                    : <><span style={{ marginRight:8 }}>✓</span>Done — Next Question <ArrowRight size={16} style={{ marginLeft:8 }} /></>}
                </motion.button>
              </div>

            </motion.div>
          )}

        </div>

        {/* ── RIGHT PANEL: Evaluation ── */}
        <div style={S.ivRight}>
          <AnimatePresence mode="wait">
            {!evaluation ? (
              <motion.div key="waiting" style={{ display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", textAlign:"center", height:"100%", paddingTop:40 }}
                initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
                <div style={{ width:68, height:68, borderRadius:18, background:"rgba(124,111,250,0.08)", border:"1px solid rgba(124,111,250,0.15)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:18 }}>
                  <BarChart2 size={32} color="#7c6ffa" />
                </div>
                <p style={{ fontFamily:"'Playfair Display',serif", fontSize:20, color:"#dde1f0", marginBottom:12 }}>AI Feedback</p>
                <p style={{ fontSize:15, color:"#4a5070", lineHeight:1.7, maxWidth:280 }}>
                  {isMCQ ? "Select an option and click Submit." : "Write or speak your answer, then click Submit for a detailed score."}
                </p>
                <div style={{ marginTop:24, padding:"12px 16px", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)", borderRadius:10, width:"100%" }}>
                  <p style={{ fontSize:12.5, color:"#5a6488", margin:0, lineHeight:1.8, fontFamily:"'DM Sans',sans-serif" }}>
                    <strong style={{ color:"#7c6ffa" }}>H</strong> = hint<br/>
                    <strong style={{ color:"#7c6ffa" }}>Enter</strong> = submit<br/>
                    <strong style={{ color:"#7c6ffa" }}>N</strong> = next question
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div key="eval" style={{ display:"flex", flexDirection:"column", gap:14 }}
                initial={{ opacity:0, x:18 }} animate={{ opacity:1, x:0 }}>

                {/* Score */}
                <div style={{ background:"#0d0f1e", border:"1px solid #1e2235", borderRadius:16, padding:"24px", textAlign:"center" }}>
                  <div style={{ fontSize:58, fontWeight:800, color:scoreColor(evaluation.score), fontFamily:"'Playfair Display',serif", lineHeight:1 }}>
                    {evaluation.score}<span style={{ fontSize:24, color:"#4a5070" }}>/10</span>
                  </div>
                  <div style={{ marginTop:10, fontSize:17, fontWeight:600, color:VERDICT_META[evaluation.verdict]?.color||"#dde1f0" }}>{evaluation.verdict}</div>
                  <div className="score-bar" style={{ marginTop:14 }}>
                    <div className="score-fill" style={{ width:`${evaluation.score*10}%`, background:scoreColor(evaluation.score) }} />
                  </div>
                  {evaluation.score >= 9 && <div style={{ marginTop:10, fontSize:14, color:"#30c97e", fontWeight:700 }}>🎉 Excellent answer!</div>}
                </div>

                {/* Strengths */}
                {evaluation.strengths?.length > 0 && (
                  <div style={{ background:"rgba(48,201,126,0.05)", border:"1px solid rgba(48,201,126,0.15)", borderRadius:12, padding:"15px 17px" }}>
                    <div style={S.pl("#30c97e")}>✓ Strengths</div>
                    {evaluation.strengths.map((s,i) => (
                      <div key={i} style={{ display:"flex", gap:10, marginBottom:9 }}>
                        <CheckCircle size={15} color="#30c97e" style={{ flexShrink:0, marginTop:2 }} />
                        <span style={{ fontSize:14, color:"#b8f5d8", lineHeight:1.65 }}>{s}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Improvements */}
                {evaluation.improvements?.length > 0 && (
                  <div style={{ background:"rgba(245,158,11,0.05)", border:"1px solid rgba(245,158,11,0.15)", borderRadius:12, padding:"15px 17px" }}>
                    <div style={S.pl("#f59e0b")}>↑ Improvements</div>
                    {evaluation.improvements.map((s,i) => (
                      <div key={i} style={{ display:"flex", gap:10, marginBottom:9 }}>
                        <AlertCircle size={15} color="#f59e0b" style={{ flexShrink:0, marginTop:2 }} />
                        <span style={{ fontSize:14, color:"#fde68a", lineHeight:1.65 }}>{s}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Ideal points */}
                {!isMCQ && evaluation.ideal_points?.length > 0 && (
                  <div style={{ background:"rgba(52,213,200,0.05)", border:"1px solid rgba(52,213,200,0.15)", borderRadius:12, padding:"15px 17px" }}>
                    <div style={S.pl("#34d5c8")}>★ Top Answer Includes</div>
                    {evaluation.ideal_points.map((s,i) => (
                      <div key={i} style={{ display:"flex", gap:10, marginBottom:9 }}>
                        <Star size={13} color="#34d5c8" style={{ flexShrink:0, marginTop:3 }} />
                        <span style={{ fontSize:14, color:"#99f6e4", lineHeight:1.65 }}>{s}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Follow-up */}
                {!isMCQ && evaluation.follow_up_question && (
                  <div style={{ background:"rgba(124,111,250,0.05)", border:"1px solid rgba(124,111,250,0.18)", borderRadius:12, padding:"15px 17px" }}>
                    <div style={S.pl("#7c6ffa")}>⚡ Follow-up</div>
                    <p style={{ fontSize:14.5, color:"#dde1f0", fontWeight:500, marginBottom:10, lineHeight:1.6 }}>{evaluation.follow_up_question}</p>
                    {!showFU ? (
                      <button style={{ fontSize:13.5, color:"#7c6ffa", background:"rgba(124,111,250,0.1)", border:"1px solid rgba(124,111,250,0.25)", borderRadius:8, padding:"7px 16px", cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}
                        onClick={() => setShowFU(true)}>Answer follow-up →</button>
                    ) : (
                      <>
                        <textarea className="iv-inp iv-ta" rows={3} style={{ marginTop:8 }}
                          placeholder="Answer the follow-up..." value={followUpAns} onChange={e => setFollowUpAns(e.target.value)} />
                        {evaluation.follow_up_tip && <p style={{ fontSize:13, color:"#6b7280", marginTop:8, fontStyle:"italic", lineHeight:1.6 }}>Tip: {evaluation.follow_up_tip}</p>}
                      </>
                    )}
                  </div>
                )}

              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────
const S = {
  page:      { height:"100vh", background:"#080a12", color:"#dde1f0", fontFamily:"'DM Sans',sans-serif", display:"flex", flexDirection:"column", overflow:"hidden" },
  topbar:    { display:"flex", alignItems:"center", justifyContent:"space-between", padding:"14px 28px", borderBottom:"1px solid rgba(255,255,255,0.06)", background:"rgba(8,10,18,0.95)", backdropFilter:"blur(14px)", zIndex:10, flexShrink:0 },
  backBtn:   { display:"inline-flex", alignItems:"center", padding:"9px 18px", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:9, color:"#9aa0b8", fontSize:14, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" },
  divider:   { width:1, height:22, background:"rgba(255,255,255,0.08)" },
  logoMark:  { width:32, height:32, borderRadius:9, background:"linear-gradient(135deg,#7c6ffa,#34d5c8)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:15, color:"#fff" },
  logoText:  { fontFamily:"'Playfair Display',serif", fontSize:17, fontWeight:700, color:"#fff" },
  topBtn:    { display:"inline-flex", alignItems:"center", gap:7, padding:"9px 18px", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:9, color:"#9aa0b8", fontSize:14, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" },
  setupCard: { background:"#0c0e1a", border:"1px solid #1e2235", borderRadius:22, padding:"40px 36px", width:"100%", maxWidth:720 },
  setupIcon: { width:76, height:76, borderRadius:20, background:"rgba(124,111,250,0.08)", border:"1px solid rgba(124,111,250,0.18)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 22px" },
  setupTitle:{ fontFamily:"'Playfair Display',serif", fontSize:32, color:"#fff", fontWeight:700 },
  sf:        { display:"flex", flexDirection:"column", gap:10 },
  lbl:       { fontSize:12.5, fontWeight:700, textTransform:"uppercase", letterSpacing:1, color:"#6b7280", fontFamily:"'DM Sans',sans-serif" },
  btnStart:  { display:"flex", alignItems:"center", justifyContent:"center", width:"100%", padding:"16px", background:"linear-gradient(135deg,#5b4fd4,#7c6ffa)", border:"none", borderRadius:13, color:"#fff", fontSize:17, fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", boxShadow:"0 4px 28px rgba(124,111,250,0.35)" },
  ivLayout:  { display:"flex", flex:1, overflow:"hidden" },
  ivLeft:    { flex:1, overflowY:"auto", padding:"30px 34px", borderRight:"1px solid #1e2235" },
  ivRight:   { width:400, minWidth:360, overflowY:"auto", padding:"26px 24px", background:"#0a0c18", flexShrink:0 },
  btnSubmit: { display:"flex", alignItems:"center", justifyContent:"center", padding:"15px", background:"linear-gradient(135deg,#5b4fd4,#7c6ffa)", border:"none", borderRadius:12, color:"#fff", fontSize:16, fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", boxShadow:"0 4px 20px rgba(124,111,250,0.3)" },
  btnNext:   { display:"flex", alignItems:"center", justifyContent:"center", width:"100%", padding:"15px", marginTop:14, background:"linear-gradient(135deg,#0f7a5a,#30c97e)", border:"none", borderRadius:12, color:"#fff", fontSize:16, fontWeight:700, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", boxShadow:"0 4px 20px rgba(48,201,126,0.25)" },
  pl:        (c) => ({ fontSize:11.5, fontWeight:700, color:c, textTransform:"uppercase", letterSpacing:0.9, marginBottom:11, fontFamily:"'DM Sans',sans-serif" }),
}