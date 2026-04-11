import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Link } from "react-router-dom"
import {
  ArrowLeft, TrendingUp, TrendingDown, Minus,
  Copy, Check, Zap, Search, Globe, BookOpen,
  ChevronRight, Sparkles, AlertCircle, RefreshCw,
  BarChart2, Mail, Star, Calendar, Users, DollarSign,
  Flame, Newspaper, Cpu, Target
} from "lucide-react"
import api from "../utils/api"

// ── Constants ─────────────────────────────────────────────────
const MARKETS = [
  { id: "US",        flag: "🇺🇸", label: "United States" },
  { id: "India",     flag: "🇮🇳", label: "India"         },
  { id: "UK",        flag: "🇬🇧", label: "United Kingdom"},
  { id: "Singapore", flag: "🇸🇬", label: "Singapore"     },
  { id: "UAE",       flag: "🇦🇪", label: "UAE"           },
  { id: "Global",    flag: "🌍",  label: "Global"        },
]

const SUGGESTED_ROLES = [
  "Investment Banking Analyst", "Software Engineer", "Management Consultant",
  "Data Scientist", "Product Manager", "Equity Research Analyst",
  "Private Equity Associate", "UX Designer", "DevOps Engineer",
  "Chartered Accountant", "Marketing Manager", "Risk Analyst",
  "ML Engineer", "Strategy Analyst", "Venture Capital Analyst",
  "Business Analyst", "Cloud Architect", "Quantitative Analyst",
]

const NEWS_FEEDS = [
  { title: "Goldman Sachs posts record advisory revenue for Q1 2025", source: "FT", time: "2h ago", url: "https://ft.com", tag: "Finance" },
  { title: "Big Tech hiring freeze shows signs of thawing in H2 2025", source: "Bloomberg", time: "5h ago", url: "https://bloomberg.com", tag: "Technology" },
  { title: "McKinsey announces 10% headcount increase in strategy practice", source: "WSJ", time: "1d ago", url: "https://wsj.com", tag: "Consulting" },
  { title: "India's startup ecosystem creates 200k+ new tech jobs in Q1", source: "ET", time: "1d ago", url: "https://economictimes.com", tag: "India" },
  { title: "AWS hiring 5,000 engineers globally across cloud teams", source: "TechCrunch", time: "2d ago", url: "https://techcrunch.com", tag: "Technology" },
  { title: "Singapore MAS grants new digital banking licences — hiring surge expected", source: "Straits Times", time: "2d ago", url: "https://straitstimes.com", tag: "Singapore" },
  { title: "Deloitte graduate intake up 18% — audit and advisory leading growth", source: "AccountancyAge", time: "3d ago", url: "https://accountancyage.com", tag: "Consulting" },
  { title: "HDFC, ICICI Bank expand wealth management teams across India", source: "Mint", time: "3d ago", url: "https://livemint.com", tag: "India" },
  { title: "Dubai DIFC firms on hiring spree for finance & compliance roles", source: "Gulf News", time: "4d ago", url: "https://gulfnews.com", tag: "UAE" },
  { title: "UK Big 4 firms face talent crunch — graduate offers up 12%", source: "AccountancyAge", time: "4d ago", url: "https://accountancyage.com", tag: "UK" },
  { title: "OpenAI, Anthropic, DeepMind collectively hiring 3,000+ AI researchers", source: "Wired", time: "5d ago", url: "https://wired.com", tag: "Technology" },
  { title: "Blackstone, KKR expand Asia-Pacific deal teams in Singapore and HK", source: "Bloomberg", time: "5d ago", url: "https://bloomberg.com", tag: "Finance" },
  { title: "BCG opens new delivery centre in Bengaluru, creating 800 consultant roles", source: "Business Standard", time: "6d ago", url: "https://business-standard.com", tag: "India" },
  { title: "London fintech sector sees record £12bn in VC funding in H1", source: "City A.M.", time: "1w ago", url: "https://cityam.com", tag: "UK" },
  { title: "Abu Dhabi sovereign funds double down on tech sector hiring", source: "Gulf News", time: "1w ago", url: "https://gulfnews.com", tag: "UAE" },
]

// ── Groq proxy helper (calls your own FastAPI backend) ────────
async function callAI(prompt) {
  const base = process.env.REACT_APP_API_URL || "http://localhost:8000"
  const response = await fetch(`${base}/insights/ai`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.detail || "Backend AI call failed")
  }
  const data = await response.json()
  return data.result
}

// ── CSS ───────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,700;9..144,900&family=Cabinet+Grotesk:wght@400;500;600;700;800&display=swap');
*, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
:root {
  --bg:#07080f; --surface:#0d0f1c; --surface2:#12152a;
  --border:#1c2038; --border2:#262b4a;
  --accent:#6c5ce7; --accent2:#a29bfe;
  --teal:#00cec9; --green:#00b894; --amber:#fdcb6e; --red:#e17055;
  --text:#e0e4f5; --muted:#6b728f; --subtle:#3a4060;
  --font:'Cabinet Grotesk',sans-serif; --display:'Fraunces',serif;
}
@keyframes ins-spin { to { transform:rotate(360deg); } }
@keyframes ins-pulse { 0%,100%{opacity:.6} 50%{opacity:1} }
@keyframes ins-slide-up { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
.ins-page { min-height:100vh; background:var(--bg); color:var(--text); font-family:var(--font); }
.ins-page::before {
  content:''; position:fixed; inset:0; pointer-events:none; z-index:0;
  background-image:linear-gradient(rgba(108,92,231,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(108,92,231,0.03) 1px,transparent 1px);
  background-size:40px 40px;
}
.ins-topbar { display:flex; align-items:center; justify-content:space-between; padding:14px 28px; border-bottom:1px solid var(--border); background:rgba(7,8,15,0.97); backdrop-filter:blur(20px); position:sticky; top:0; z-index:100; }
.ins-tabs-wrap { border-bottom:1px solid var(--border); background:rgba(7,8,15,0.90); backdrop-filter:blur(20px); position:sticky; top:57px; z-index:90; overflow-x:auto; scrollbar-width:none; }
.ins-tabs-wrap::-webkit-scrollbar { display:none; }
.ins-tabs-inner { display:flex; gap:4px; padding:10px 24px; min-width:max-content; max-width:1100px; margin:0 auto; }
.ins-body { max-width:1100px; margin:0 auto; padding:36px 24px 100px; position:relative; z-index:1; }
.ins-tab { padding:8px 15px; border-radius:8px; font-size:13px; font-weight:700; cursor:pointer; border:1.5px solid transparent; font-family:var(--font); transition:all .18s; white-space:nowrap; display:flex; align-items:center; gap:6px; }
.ins-tab.active   { background:rgba(108,92,231,0.14); border-color:var(--accent); color:var(--accent2); }
.ins-tab.inactive { background:transparent; border-color:var(--border); color:var(--subtle); }
.ins-tab.inactive:hover { border-color:var(--accent); color:var(--accent2); background:rgba(108,92,231,0.05); }
.ins-card { background:var(--surface); border:1px solid var(--border); border-radius:16px; padding:20px 22px; transition:border-color .2s; }
.ins-card:hover { border-color:var(--border2); }
.ins-inp { width:100%; padding:12px 15px 12px 42px; background:var(--surface2); border:1.5px solid var(--border2); border-radius:11px; color:var(--text); font-family:var(--font); font-size:14.5px; outline:none; transition:border-color .2s,box-shadow .2s; }
.ins-inp:focus { border-color:var(--accent); box-shadow:0 0 0 3px rgba(108,92,231,0.12); }
.ins-inp::placeholder { color:var(--subtle); }
.ins-inp-plain { padding-left:15px; }
.ins-ta { resize:vertical; min-height:90px; line-height:1.7; padding:12px 15px; }
.ins-btn { display:inline-flex; align-items:center; justify-content:center; gap:8px; padding:12px 22px; background:linear-gradient(135deg,#5b4fd4,#6c5ce7); border:none; border-radius:11px; color:#fff; font-family:var(--font); font-size:14.5px; font-weight:700; cursor:pointer; transition:opacity .18s,transform .12s; box-shadow:0 4px 20px rgba(108,92,231,0.28); white-space:nowrap; }
.ins-btn:hover:not(:disabled) { opacity:.9; transform:translateY(-1px); }
.ins-btn:active:not(:disabled) { transform:translateY(0); }
.ins-btn:disabled { opacity:.5; cursor:not-allowed; transform:none; }
.ins-btn-ghost { display:inline-flex; align-items:center; gap:7px; padding:9px 16px; background:rgba(255,255,255,0.04); border:1px solid var(--border2); border-radius:9px; color:var(--muted); font-size:13.5px; cursor:pointer; font-family:var(--font); font-weight:600; transition:all .18s; }
.ins-btn-ghost:hover { border-color:var(--accent); color:var(--accent2); }
.mkt-btn { padding:7px 13px; border-radius:8px; font-size:12.5px; font-weight:600; cursor:pointer; border:1.5px solid; font-family:var(--font); transition:all .15s; display:flex; align-items:center; gap:5px; }
.suggestion-chip { padding:5px 13px; border-radius:20px; font-size:12px; cursor:pointer; background:rgba(255,255,255,0.03); border:1px solid var(--border2); color:var(--subtle); font-family:var(--font); transition:all .14s; font-weight:500; }
.suggestion-chip:hover { border-color:var(--accent); color:var(--accent2); background:rgba(108,92,231,0.07); }
.heat-bar { height:6px; border-radius:4px; background:var(--surface2); overflow:hidden; }
.heat-fill { height:100%; border-radius:4px; transition:width 1.2s cubic-bezier(.16,1,.3,1); }
.empty-state { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:70px 20px; text-align:center; gap:12px; }
.error-banner { display:flex; align-items:center; gap:10px; padding:12px 18px; background:rgba(225,112,85,0.08); border:1px solid rgba(225,112,85,0.25); border-radius:11px; color:#e17055; font-size:13.5px; margin-bottom:16px; }
.field-label { font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:1px; color:var(--subtle); display:block; margin-bottom:7px; }
.news-card { display:flex; flex-direction:column; gap:8px; padding:15px 18px; background:var(--surface); border:1px solid var(--border); border-radius:13px; transition:border-color .18s,transform .18s; cursor:pointer; text-decoration:none; }
.news-card:hover { border-color:var(--accent); transform:translateY(-2px); }
.sec-head { font-family:var(--display); font-size:26px; font-weight:700; color:#fff; margin-bottom:4px; }
.sec-sub { font-size:14px; color:var(--muted); margin-bottom:22px; }
.stream-cursor { display:inline-block; width:2px; height:1em; background:var(--accent2); animation:ins-pulse 0.8s infinite; vertical-align:text-bottom; margin-left:2px; }
.progress-ring { transform:rotate(-90deg); }
`

// ── Helpers ───────────────────────────────────────────────────
const trendColor = t => ["up","easier"].includes(t) ? "var(--green)" : ["down","harder"].includes(t) ? "var(--red)" : "var(--amber)"
const scoreColor = s => s >= 8 ? "var(--green)" : s >= 6 ? "var(--teal)" : s >= 4 ? "var(--amber)" : "var(--red)"

const TrendIcon = ({ t }) =>
  t==="up"   || t==="easier" ? <TrendingUp   size={13} color="var(--green)"/> :
  t==="down" || t==="harder" ? <TrendingDown size={13} color="var(--red)"/>   :
                                <Minus        size={13} color="var(--amber)"/>

const Spin = ({ size = 16 }) => (
  <span style={{ width:size, height:size, border:"2px solid rgba(255,255,255,0.15)", borderTopColor:"#fff", borderRadius:"50%", animation:"ins-spin .75s linear infinite", display:"inline-block", flexShrink:0 }} />
)

const EmptyState = ({ icon, text, sub }) => (
  <div className="empty-state">
    <div style={{ fontSize:44 }}>{icon}</div>
    <div style={{ fontSize:17, fontWeight:700, color:"var(--text)" }}>{text}</div>
    <div style={{ fontSize:13.5, color:"var(--muted)", maxWidth:360, lineHeight:1.65 }}>{sub}</div>
  </div>
)

const LoadingBlock = ({ label = "Thinking…" }) => (
  <div style={{ display:"flex", gap:12, padding:"60px 0", justifyContent:"center", alignItems:"center" }}>
    <Spin size={18}/><span style={{ fontSize:14.5, color:"var(--muted)" }}>{label}</span>
  </div>
)

const ErrorBanner = ({ msg, onRetry }) => (
  <div className="error-banner">
    <AlertCircle size={16}/>
    <span>{msg}</span>
    {onRetry && (
      <button onClick={onRetry} style={{ marginLeft:"auto", background:"none", border:"none", color:"var(--red)", cursor:"pointer", fontSize:13, fontFamily:"var(--font)", fontWeight:700, textDecoration:"underline" }}>
        Retry
      </button>
    )}
  </div>
)

// ── Main Component ────────────────────────────────────────────
export default function IndustryInsights() {
  const [activeTab, setActiveTab] = useState("pulse")
  const [market, setMarket]       = useState("India")
  const [searchRole, setSearchRole] = useState("")

  // Market pulse & forecast
  const [pulse, setPulse]         = useState(null); const [loadingPulse, setLoadingPulse]       = useState(false); const [errPulse, setErrPulse]       = useState(null)
  const [forecast, setForecast]   = useState(null); const [loadingForecast, setLoadingForecast] = useState(false); const [errForecast, setErrForecast] = useState(null)

  // Data tabs
  const [salaryData, setSalaryData]       = useState(null); const [loadingSalary, setLoadingSalary]       = useState(false); const [errSalary, setErrSalary]       = useState(null)
  const [skillsData, setSkillsData]       = useState(null); const [loadingSkills, setLoadingSkills]       = useState(false); const [errSkills, setErrSkills]       = useState(null)
  const [employersData, setEmployersData] = useState(null); const [loadingEmployers, setLoadingEmployers] = useState(false); const [errEmployers, setErrEmployers] = useState(null)
  const [calendarData, setCalendarData]   = useState(null); const [loadingCalendar, setLoadingCalendar]   = useState(false); const [errCalendar, setErrCalendar]   = useState(null)

  // Role explainer
  const [roleQuery, setRoleQuery] = useState(""); const [roleData, setRoleData] = useState(null); const [loadingRole, setLoadingRole] = useState(false); const [errRole, setErrRole] = useState(null)

  // Cold email
  const [emailBg, setEmailBg]           = useState("")
  const [emailRole, setEmailRole]       = useState("")
  const [emailCompany, setEmailCompany] = useState("")
  const [emailTitle, setEmailTitle]     = useState("")
  const [emailType, setEmailType]       = useState("cold_email")
  const [emailResult, setEmailResult]   = useState(null)
  const [loadingEmail, setLoadingEmail] = useState(false)
  const [errEmail, setErrEmail]         = useState(null)
  const [copied, setCopied]             = useState(false)

  // Career path (new feature)
  const [pathRole, setPathRole]         = useState("")
  const [pathData, setPathData]         = useState(null)
  const [loadingPath, setLoadingPath]   = useState(false)
  const [errPath, setErrPath]           = useState(null)

  // Comparison (hits real backend)
  const [compRole, setCompRole]         = useState("")
  const [compData, setCompData]         = useState(null)
  const [loadingComp, setLoadingComp]   = useState(false)
  const [userSessions, setUserSessions] = useState([])

  // News
  const [newsFilter, setNewsFilter] = useState("All")

  const userEmail = localStorage.getItem("userEmail") || ""

  // ── Inject CSS ────────────────────────────────────────────
  useEffect(() => {
    const id = "sensai-ins-css"
    if (!document.getElementById(id)) {
      const el = document.createElement("style")
      el.id = id; el.textContent = CSS
      document.head.appendChild(el)
    }
    fetchPulse()
    fetchForecast()
    if (userEmail) {
      api.get(`/interview/history/${userEmail}`)
        .then(r => setUserSessions(r.data.sessions || []))
        .catch(() => {})
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Claude-powered API calls ──────────────────────────────
  const fetchPulse = async () => {
    setLoadingPulse(true); setErrPulse(null)
    try {
      const data = await callAI(
        `Generate a realistic hiring market pulse report for the current week (2025). Return JSON:
        {
          "week_summary": "2-3 sentence overview of hiring activity this week",
          "top_tip": "one actionable job-seeker tip for this week",
          "sectors": [
            { "name": "Technology", "trend": "up|down|flat", "signal": "1-2 sentence signal", "hot_roles": ["role1","role2","role3"] },
            { "name": "Finance & Banking", "trend": "...", "signal": "...", "hot_roles": [...] },
            { "name": "Consulting", "trend": "...", "signal": "...", "hot_roles": [...] },
            { "name": "Healthcare", "trend": "...", "signal": "...", "hot_roles": [...] },
            { "name": "Startups & VC", "trend": "...", "signal": "...", "hot_roles": [...] },
            { "name": "Product & Design", "trend": "...", "signal": "...", "hot_roles": [...] }
          ]
        }`
      )
      setPulse(data)
    } catch { setErrPulse("Could not load market pulse. Check your network connection.") }
    finally { setLoadingPulse(false) }
  }

  const fetchForecast = async () => {
    setLoadingForecast(true); setErrForecast(null)
    try {
      const data = await callAI(
        `Generate a realistic interview difficulty forecast for 2025. Return JSON:
        {
          "overall_verdict": "2-3 sentence verdict on overall hiring difficulty right now",
          "sectors": [
            { "sector": "Technology", "difficulty": "easier|harder|flat", "rounds_avg": 4, "change": "what changed and why", "tip": "actionable interview tip" },
            { "sector": "Investment Banking", "difficulty": "...", "rounds_avg": 5, "change": "...", "tip": "..." },
            { "sector": "Management Consulting", "difficulty": "...", "rounds_avg": 4, "change": "...", "tip": "..." },
            { "sector": "Data Science & AI", "difficulty": "...", "rounds_avg": 5, "change": "...", "tip": "..." },
            { "sector": "Product Management", "difficulty": "...", "rounds_avg": 4, "change": "...", "tip": "..." },
            { "sector": "Finance & Accounting", "difficulty": "...", "rounds_avg": 3, "change": "...", "tip": "..." }
          ]
        }`
      )
      setForecast(data)
    } catch { setErrForecast("Could not load difficulty forecast.") }
    finally { setLoadingForecast(false) }
  }

  const runSearch = (role) => {
    const q = (role || searchRole).trim()
    if (!q) return
    if      (activeTab === "salary")    fetchSalary(q)
    else if (activeTab === "skills")    fetchSkills(q)
    else if (activeTab === "employers") fetchEmployers(q)
    else if (activeTab === "calendar")  fetchCalendar(q)
  }

  const fetchSalary = async (role) => {
    setLoadingSalary(true); setSalaryData(null); setErrSalary(null)
    const mktObj = MARKETS.find(m => m.id === market)
    try {
      const data = await callAI(
        `Generate realistic salary benchmark data for "${role}" in ${mktObj.label} (2025). Return JSON:
        {
          "role": "${role}",
          "market": "${mktObj.label}",
          "currency_note": "currency and note e.g. USD (annual, pre-tax)",
          "market_context": "2-3 sentences about the compensation landscape for this role in this market",
          "entry": { "years_exp": "0-2 years", "range": "e.g. $60k–$85k", "note": "brief note about entry-level comp" },
          "mid": { "years_exp": "3-6 years", "range": "...", "note": "..." },
          "senior": { "years_exp": "7+ years", "range": "...", "note": "..." },
          "top_paying_companies": ["Company1","Company2","Company3","Company4","Company5"],
          "salary_tip": "specific salary negotiation tip for this role and market",
          "bonus_note": "typical bonus/variable pay structure for this role"
        }`
      )
      setSalaryData(data)
    } catch { setErrSalary("Could not fetch salary data.") }
    finally { setLoadingSalary(false) }
  }

  const fetchSkills = async (role) => {
    setLoadingSkills(true); setSkillsData(null); setErrSkills(null)
    const mktObj = MARKETS.find(m => m.id === market)
    try {
      const data = await callAI(
        `Generate the most in-demand skills for "${role}" in ${mktObj.label} (2025). Return JSON:
        {
          "role": "${role}",
          "market": "${mktObj.label}",
          "market_note": "1-2 sentences about what makes this market unique for this role",
          "rising_skill": "one emerging skill to watch",
          "skills": [
            { "skill": "Python", "category": "technical|soft|domain", "heat": 92, "why": "why this skill matters for this role right now" },
            ... 8 skills total
          ],
          "certifications": ["Cert1","Cert2","Cert3"]
        }`
      )
      setSkillsData(data)
    } catch { setErrSkills("Could not fetch skills data.") }
    finally { setLoadingSkills(false) }
  }

  const fetchEmployers = async (role) => {
    setLoadingEmployers(true); setEmployersData(null); setErrEmployers(null)
    const mktObj = MARKETS.find(m => m.id === market)
    try {
      const data = await callAI(
        `List top employers hiring "${role}" in ${mktObj.label} (2025). Return JSON:
        {
          "role": "${role}",
          "market": "${mktObj.label}",
          "employers": [
            {
              "name": "Company Name",
              "type": "company type e.g. MNC / Startup / Bank",
              "interview_format": "brief format description e.g. 3 rounds: HR screen, technical, final",
              "difficulty": "Easy|Medium|Hard|Very Hard",
              "culture_note": "1 sentence about culture or what they value",
              "prep_tip": "specific tip for getting an offer here"
            }
          ],
          "application_tip": "top tip for applying in this market"
        }
        Include 6-8 realistic, named employers.`
      )
      setEmployersData(data)
    } catch { setErrEmployers("Could not fetch employer data.") }
    finally { setLoadingEmployers(false) }
  }

  const fetchCalendar = async (role) => {
    setLoadingCalendar(true); setCalendarData(null); setErrCalendar(null)
    const mktObj = MARKETS.find(m => m.id === market)
    try {
      const data = await callAI(
        `Generate a hiring calendar / recruiting timeline for "${role}" in ${mktObj.label} (2025). Return JSON:
        {
          "role": "${role}",
          "market": "${mktObj.label}",
          "peak_season": "e.g. September–November for campus, January–March for lateral",
          "calendar_note": "2 sentences about the hiring cycle for this role/market",
          "timeline": [
            { "phase": "Phase name", "timing": "Month range", "action": "what to do during this phase" }
          ],
          "market_quirks": "any unusual hiring patterns or norms for this market",
          "networking_tip": "networking advice specific to breaking into this role"
        }
        Include 5-6 timeline phases.`
      )
      setCalendarData(data)
    } catch { setErrCalendar("Could not fetch calendar data.") }
    finally { setLoadingCalendar(false) }
  }

  const fetchRole = async () => {
    if (!roleQuery.trim()) return
    setLoadingRole(true); setRoleData(null); setErrRole(null)
    try {
      const data = await callAI(
        `Give a complete breakdown of the role "${roleQuery}". Return JSON:
        {
          "role": "${roleQuery}",
          "summary": "3-4 sentence overview of the role",
          "difficulty_to_get": "Easy|Moderate|Hard|Very Hard",
          "salary_range": { "entry": "e.g. $55k–$80k", "mid": "...", "senior": "..." },
          "day_in_life": ["task1","task2","task3","task4","task5"],
          "core_skills": ["skill1","skill2","skill3","skill4","skill5","skill6"],
          "how_to_break_in": ["step1","step2","step3","step4"],
          "exit_paths": ["path1","path2","path3","path4"],
          "pros": ["pro1","pro2","pro3"],
          "cons": ["con1","con2","con3"],
          "best_companies": ["company1","company2","company3","company4","company5"],
          "interview_rounds": 3,
          "interview_types": ["HR Screen","Technical","Case Study"]
        }`
      )
      setRoleData(data)
    } catch { setErrRole("Could not load role breakdown.") }
    finally { setLoadingRole(false) }
  }

  const generateEmail = async () => {
    if (!emailBg.trim() || !emailRole.trim() || !emailCompany.trim()) return
    setLoadingEmail(true); setEmailResult(null); setErrEmail(null)
    try {
      const data = await callAI(
        `Write a professional ${emailType === "linkedin_dm" ? "LinkedIn DM" : "cold email"} for a job seeker.
        Sender background: ${emailBg}
        Target role: ${emailRole}
        Target company: ${emailCompany}
        ${emailTitle ? `Target person's title: ${emailTitle}` : ""}
        
        Return JSON:
        {
          "type": "${emailType}",
          ${emailType === "cold_email" ? '"subject": "email subject line",' : ''}
          "message": "the full message text"
        }
        
        Make it concise, personalized, confident but not pushy. No generic phrases. Show genuine research into the company.`
      )
      setEmailResult(data)
    } catch { setErrEmail("Could not generate message.") }
    finally { setLoadingEmail(false) }
  }

  const fetchCareerPath = async () => {
    if (!pathRole.trim()) return
    setLoadingPath(true); setPathData(null); setErrPath(null)
    try {
      const data = await callAI(
        `Generate a realistic career progression path for someone aiming to become a "${pathRole}". Return JSON:
        {
          "target_role": "${pathRole}",
          "timeline_years": 8,
          "path": [
            { "title": "Entry Role Title", "years": "0-2 years", "salary": "e.g. $55k–$75k", "key_skills": ["skill1","skill2"], "milestone": "what to achieve here" },
            { "title": "Mid Role", "years": "2-5 years", "salary": "...", "key_skills": [...], "milestone": "..." },
            { "title": "${pathRole}", "years": "5-8 years", "salary": "...", "key_skills": [...], "milestone": "..." },
            { "title": "Senior / Leadership", "years": "8+ years", "salary": "...", "key_skills": [...], "milestone": "..." }
          ],
          "fast_track_tip": "how to accelerate this path",
          "common_mistake": "most common mistake people make on this path",
          "alternative_paths": ["alt path 1","alt path 2"]
        }`
      )
      setPathData(data)
    } catch { setErrPath("Could not generate career path.") }
    finally { setLoadingPath(false) }
  }

  const fetchComparison = async () => {
    if (!compRole.trim()) return
    setLoadingComp(true); setCompData(null)
    try {
      const r = await api.get(`/insights/platform-scores/${encodeURIComponent(compRole)}`)
      setCompData(r.data)
    } catch {}
    finally { setLoadingComp(false) }
  }

  const copyText = t => {
    navigator.clipboard.writeText(t)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const userAvg = userSessions.length
    ? (userSessions.slice(0,10).reduce((a,s) => a + (s.overall_score || 0), 0) / Math.min(userSessions.length, 10)).toFixed(1)
    : null

  const filteredNews = newsFilter === "All" ? NEWS_FEEDS : NEWS_FEEDS.filter(n => n.tag === newsFilter)
  const isDataTab    = ["salary","skills","employers","calendar"].includes(activeTab)
  const isLoading    = loadingSalary || loadingSkills || loadingEmployers || loadingCalendar
  const mktObj       = MARKETS.find(m => m.id === market)

  // ── Sub-components ────────────────────────────────────────
  const MarketSelector = () => (
    <div style={{ display:"flex", gap:7, flexWrap:"wrap" }}>
      {MARKETS.map(m => (
        <button key={m.id} className="mkt-btn"
          style={{ background:market===m.id?"rgba(108,92,231,0.14)":"rgba(255,255,255,0.03)", borderColor:market===m.id?"var(--accent)":"var(--border2)", color:market===m.id?"var(--accent2)":"var(--subtle)" }}
          onClick={() => setMarket(m.id)}>
          <span style={{ fontSize:14 }}>{m.flag}</span>{m.label}
        </button>
      ))}
    </div>
  )

  const SearchBar = ({ placeholder }) => (
    <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:24 }}>
      <div style={{ display:"flex", gap:10 }}>
        <div style={{ flex:1, position:"relative" }}>
          <Search size={15} color="var(--subtle)" style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}/>
          <input className="ins-inp" placeholder={placeholder}
            value={searchRole} onChange={e => setSearchRole(e.target.value)}
            onKeyDown={e => e.key==="Enter" && runSearch()} />
        </div>
        <button className="ins-btn" onClick={() => runSearch()} disabled={isLoading || !searchRole.trim()}>
          {isLoading ? <><Spin/>Loading…</> : <><Zap size={14}/>Search</>}
        </button>
      </div>
      <MarketSelector/>
      <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
        {SUGGESTED_ROLES.slice(0,12).map(r => (
          <button key={r} className="suggestion-chip" onClick={() => { setSearchRole(r); setTimeout(() => runSearch(r), 30) }}>{r}</button>
        ))}
      </div>
    </div>
  )

  const TABS = [
    { id:"pulse",    label:"Market Pulse",     icon:<BarChart2 size={13}/> },
    { id:"forecast", label:"Difficulty",        icon:<TrendingUp size={13}/> },
    { id:"salary",   label:"Salaries",          icon:<DollarSign size={13}/> },
    { id:"skills",   label:"Hot Skills",        icon:<Flame size={13}/> },
    { id:"employers",label:"Employers",         icon:<Users size={13}/> },
    { id:"calendar", label:"Calendar",          icon:<Calendar size={13}/> },
    { id:"path",     label:"Career Path",       icon:<Target size={13}/> },
    { id:"news",     label:"News",              icon:<Newspaper size={13}/> },
    { id:"role",     label:"Role Explainer",    icon:<Cpu size={13}/> },
    { id:"email",    label:"Cold Outreach",     icon:<Mail size={13}/> },
    { id:"compare",  label:"My Scores",         icon:<Star size={13}/> },
  ]

  const diffColor = d => d==="Very Hard"?"var(--red)":d==="Hard"?"var(--amber)":d==="Medium"?"var(--teal)":"var(--green)"

  return (
    <div className="ins-page">

      {/* ── Top bar ── */}
      <header className="ins-topbar">
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <Link to="/dashboard" style={{ textDecoration:"none" }}>
            <button className="ins-btn-ghost"><ArrowLeft size={14}/>Dashboard</button>
          </Link>
          <div style={{ width:1, height:22, background:"var(--border2)" }}/>
          <div style={{ width:32, height:32, borderRadius:9, background:"linear-gradient(135deg,#6c5ce7,#00cec9)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:14, color:"#fff" }}>S</div>
          <span style={{ fontFamily:"var(--display)", fontSize:17, fontWeight:700, color:"#fff" }}>Industry Insights</span>
        </div>
        {isDataTab && mktObj && (
          <div style={{ display:"flex", alignItems:"center", gap:7, padding:"6px 13px", background:"rgba(0,206,201,0.07)", border:"1px solid rgba(0,206,201,0.2)", borderRadius:22 }}>
            <Globe size={12} color="var(--teal)"/>
            <span style={{ fontSize:12.5, color:"var(--teal)", fontWeight:700 }}>{mktObj.flag} {market}</span>
          </div>
        )}
      </header>

      {/* ── Tabs ── */}
      <div className="ins-tabs-wrap">
        <div className="ins-tabs-inner">
          {TABS.map(t => (
            <button key={t.id} className={`ins-tab ${activeTab===t.id?"active":"inactive"}`} onClick={() => setActiveTab(t.id)}>
              {t.icon}{t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="ins-body">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} transition={{ duration:0.18 }}>

            {/* ══ MARKET PULSE ══ */}
            {activeTab === "pulse" && (
              <div>
                <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:24, flexWrap:"wrap", gap:12 }}>
                  <div>
                    <h2 className="sec-head">Market Pulse</h2>
                    <p className="sec-sub" style={{ margin:0 }}>Weekly hiring trends across major sectors</p>
                  </div>
                  <button className="ins-btn-ghost" onClick={fetchPulse} disabled={loadingPulse}><RefreshCw size={13}/>Refresh</button>
                </div>
                {errPulse && <ErrorBanner msg={errPulse} onRetry={fetchPulse}/>}
                {loadingPulse && <LoadingBlock label="Analysing the market…"/>}
                {!loadingPulse && pulse && (
                  <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                    <div className="ins-card" style={{ background:"rgba(108,92,231,0.06)", borderColor:"rgba(108,92,231,0.22)" }}>
                      <div style={{ fontSize:11, fontWeight:800, color:"var(--accent2)", textTransform:"uppercase", letterSpacing:1, marginBottom:10 }}>This Week</div>
                      <p style={{ fontSize:15.5, color:"var(--text)", lineHeight:1.8 }}>{pulse.week_summary}</p>
                      {pulse.top_tip && (
                        <div style={{ marginTop:14, padding:"10px 16px", background:"rgba(108,92,231,0.08)", borderRadius:10, display:"flex", gap:10 }}>
                          <span style={{ fontSize:16 }}>💡</span>
                          <span style={{ fontSize:13.5, color:"var(--accent2)", lineHeight:1.7 }}>{pulse.top_tip}</span>
                        </div>
                      )}
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(210px,1fr))", gap:10 }}>
                      {pulse.sectors?.map((s,i) => (
                        <motion.div key={i} className="ins-card" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.06 }}>
                          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:10 }}>
                            <span style={{ fontSize:14, fontWeight:700, color:"var(--text)" }}>{s.name}</span>
                            <div style={{ display:"flex", alignItems:"center", gap:4, padding:"3px 9px", background:`${trendColor(s.trend)}12`, border:`1px solid ${trendColor(s.trend)}28`, borderRadius:20 }}>
                              <TrendIcon t={s.trend}/><span style={{ fontSize:11, fontWeight:700, color:trendColor(s.trend), textTransform:"capitalize" }}>{s.trend}</span>
                            </div>
                          </div>
                          <p style={{ fontSize:12.5, color:"var(--muted)", lineHeight:1.65, marginBottom:10 }}>{s.signal}</p>
                          <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                            {s.hot_roles?.map((r,j) => <span key={j} style={{ fontSize:11, padding:"2px 8px", background:"rgba(0,206,201,0.07)", border:"1px solid rgba(0,206,201,0.18)", borderRadius:20, color:"var(--teal)" }}>{r}</span>)}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
                {!loadingPulse && !pulse && !errPulse && <EmptyState icon="📡" text="No data yet" sub="Click Refresh to load the latest market pulse"/>}
              </div>
            )}

            {/* ══ DIFFICULTY FORECAST ══ */}
            {activeTab === "forecast" && (
              <div>
                <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:24, flexWrap:"wrap", gap:12 }}>
                  <div>
                    <h2 className="sec-head">Interview Difficulty Forecast</h2>
                    <p className="sec-sub" style={{ margin:0 }}>Is it getting easier or harder to land interviews right now?</p>
                  </div>
                  <button className="ins-btn-ghost" onClick={fetchForecast} disabled={loadingForecast}><RefreshCw size={13}/>Refresh</button>
                </div>
                {errForecast && <ErrorBanner msg={errForecast} onRetry={fetchForecast}/>}
                {loadingForecast && <LoadingBlock label="Analysing interview landscape…"/>}
                {!loadingForecast && forecast && (
                  <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                    <div className="ins-card" style={{ background:"rgba(0,206,201,0.04)", borderColor:"rgba(0,206,201,0.2)" }}>
                      <p style={{ fontSize:15.5, color:"var(--text)", lineHeight:1.8 }}>{forecast.overall_verdict}</p>
                    </div>
                    {forecast.sectors?.map((s,i) => {
                      const c = trendColor(s.difficulty)
                      return (
                        <motion.div key={i} className="ins-card" style={{ display:"flex", alignItems:"flex-start", gap:16, flexWrap:"wrap" }} initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} transition={{ delay:i*0.07 }}>
                          <div style={{ minWidth:180 }}>
                            <div style={{ fontSize:15, fontWeight:700, color:"var(--text)", marginBottom:4 }}>{s.sector}</div>
                            <div style={{ fontSize:12, color:"var(--muted)" }}>Avg {s.rounds_avg} rounds</div>
                          </div>
                          <div style={{ display:"flex", alignItems:"center", gap:6, padding:"5px 13px", background:`${c}10`, border:`1.5px solid ${c}30`, borderRadius:22 }}>
                            <TrendIcon t={s.difficulty}/><span style={{ fontSize:13, fontWeight:700, color:c, textTransform:"capitalize" }}>{s.difficulty}</span>
                          </div>
                          <p style={{ fontSize:13.5, color:"#8892b0", flex:1, minWidth:160, lineHeight:1.65 }}>{s.change}</p>
                          <div style={{ padding:"8px 13px", background:"rgba(108,92,231,0.06)", border:"1px solid rgba(108,92,231,0.15)", borderRadius:9, fontSize:13, color:"var(--accent2)", maxWidth:240, lineHeight:1.6 }}>💡 {s.tip}</div>
                        </motion.div>
                      )
                    })}
                  </div>
                )}
                {!loadingForecast && !forecast && !errForecast && <EmptyState icon="🔮" text="No data yet" sub="Click Refresh to load the forecast"/>}
              </div>
            )}

            {/* ══ SALARY ══ */}
            {activeTab === "salary" && (
              <div>
                <h2 className="sec-head">Salary Benchmarks</h2>
                <p className="sec-sub">Compensation ranges for any role in any market</p>
                <SearchBar placeholder="e.g. Data Scientist, Investment Banking Analyst, Product Manager…"/>
                {errSalary && <ErrorBanner msg={errSalary}/>}
                {loadingSalary && <LoadingBlock label="Fetching salary benchmarks…"/>}
                {!salaryData && !loadingSalary && !errSalary && <EmptyState icon="💰" text="Search any role" sub="Works for any job title across 6 markets — from IB Analyst in New York to Data Scientist in Bangalore"/>}
                {salaryData && (
                  <motion.div style={{ display:"flex", flexDirection:"column", gap:14 }} initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }}>
                    <div className="ins-card" style={{ background:"rgba(0,184,148,0.04)", borderColor:"rgba(0,184,148,0.2)" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                        <span style={{ fontSize:24 }}>{mktObj?.flag}</span>
                        <div>
                          <div style={{ fontSize:17, fontWeight:700, color:"var(--text)" }}>{salaryData.role}</div>
                          <div style={{ fontSize:13, color:"var(--muted)" }}>{salaryData.market} · {salaryData.currency_note}</div>
                        </div>
                      </div>
                      <p style={{ fontSize:14, color:"#8892b0", lineHeight:1.75 }}>{salaryData.market_context}</p>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
                      {[["Entry Level", salaryData.entry,"var(--green)"],["Mid Level",salaryData.mid,"var(--teal)"],["Senior",salaryData.senior,"var(--amber)"]].map(([level,data,color]) => (
                        <div key={level} className="ins-card" style={{ textAlign:"center" }}>
                          <div style={{ fontSize:11, fontWeight:800, color:"var(--subtle)", textTransform:"uppercase", letterSpacing:0.9, marginBottom:8 }}>{level}</div>
                          <div style={{ fontSize:11, color:"var(--subtle)", marginBottom:10 }}>{data?.years_exp}</div>
                          <div style={{ fontSize:22, fontWeight:800, fontFamily:"var(--display)", color, marginBottom:8 }}>{data?.range}</div>
                          <p style={{ fontSize:12.5, color:"var(--muted)", lineHeight:1.6 }}>{data?.note}</p>
                        </div>
                      ))}
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                      <div className="ins-card">
                        <div style={{ fontSize:11, fontWeight:800, color:"var(--accent2)", textTransform:"uppercase", letterSpacing:0.9, marginBottom:12 }}>Top Paying Companies</div>
                        {salaryData.top_paying_companies?.map((c,i) => (
                          <div key={i} style={{ display:"flex", gap:10, marginBottom:9, alignItems:"center" }}>
                            <div style={{ width:22,height:22,borderRadius:"50%",background:"rgba(108,92,231,0.12)",border:"1px solid rgba(108,92,231,0.22)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:"var(--accent2)",flexShrink:0 }}>{i+1}</div>
                            <span style={{ fontSize:14, color:"var(--text)" }}>{c}</span>
                          </div>
                        ))}
                      </div>
                      <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                        <div className="ins-card">
                          <div style={{ fontSize:11, fontWeight:800, color:"var(--green)", textTransform:"uppercase", letterSpacing:0.9, marginBottom:10 }}>Negotiation Tip</div>
                          <p style={{ fontSize:13.5, color:"#b8f5d8", lineHeight:1.8 }}>{salaryData.salary_tip}</p>
                        </div>
                        {salaryData.bonus_note && (
                          <div className="ins-card">
                            <div style={{ fontSize:11, fontWeight:800, color:"var(--amber)", textTransform:"uppercase", letterSpacing:0.9, marginBottom:8 }}>Bonus & Variable Pay</div>
                            <p style={{ fontSize:13.5, color:"#ffeaa7", lineHeight:1.75 }}>{salaryData.bonus_note}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {/* ══ SKILLS ══ */}
            {activeTab === "skills" && (
              <div>
                <h2 className="sec-head">Hot Skills</h2>
                <p className="sec-sub">Most in-demand skills for any role in any market</p>
                <SearchBar placeholder="e.g. Software Engineer, Marketing Manager, Risk Analyst…"/>
                {errSkills && <ErrorBanner msg={errSkills}/>}
                {loadingSkills && <LoadingBlock label="Analysing in-demand skills…"/>}
                {!skillsData && !loadingSkills && !errSkills && <EmptyState icon="🔥" text="Search any role" sub="Get the top 8 most in-demand skills, certifications, and a rising skill to watch"/>}
                {skillsData && (
                  <motion.div style={{ display:"flex", flexDirection:"column", gap:14 }} initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }}>
                    <div className="ins-card" style={{ background:"rgba(253,203,110,0.04)", borderColor:"rgba(253,203,110,0.18)" }}>
                      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10 }}>
                        <div>
                          <div style={{ fontSize:15, fontWeight:700, color:"var(--text)", marginBottom:4 }}>{skillsData.role} · {mktObj?.flag} {skillsData.market}</div>
                          <p style={{ fontSize:13.5, color:"#8892b0" }}>{skillsData.market_note}</p>
                        </div>
                        {skillsData.rising_skill && (
                          <div style={{ display:"flex", alignItems:"center", gap:7, padding:"6px 14px", background:"rgba(108,92,231,0.1)", border:"1px solid rgba(108,92,231,0.25)", borderRadius:22 }}>
                            <span>🚀</span><span style={{ fontSize:13, color:"var(--accent2)", fontWeight:600 }}>Rising: {skillsData.rising_skill}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                      {skillsData.skills?.map((s,i) => {
                        const catColor = s.category==="technical" ? "var(--teal)" : s.category==="soft" ? "var(--accent2)" : "var(--amber)"
                        return (
                          <motion.div key={i} className="ins-card" initial={{ opacity:0, x:-12 }} animate={{ opacity:1, x:0 }} transition={{ delay:i*0.05 }}>
                            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                                <span style={{ fontSize:14.5, fontWeight:700, color:"var(--text)" }}>{s.skill}</span>
                                <span style={{ fontSize:10.5, padding:"2px 8px", background:`${catColor}10`, border:`1px solid ${catColor}25`, borderRadius:20, color:catColor, fontWeight:700 }}>{s.category}</span>
                              </div>
                              <span style={{ fontSize:14, fontWeight:800, color:s.heat>=85?"var(--red)":s.heat>=70?"var(--amber)":"var(--teal)" }}>{s.heat}%</span>
                            </div>
                            <div className="heat-bar" style={{ marginBottom:8 }}>
                              <div className="heat-fill" style={{ width:`${s.heat}%`, background:s.heat>=85?"linear-gradient(90deg,var(--amber),var(--red))":s.heat>=70?"linear-gradient(90deg,var(--teal),var(--amber))":"linear-gradient(90deg,var(--accent),var(--teal))" }}/>
                            </div>
                            <p style={{ fontSize:13, color:"var(--muted)", lineHeight:1.6 }}>{s.why}</p>
                          </motion.div>
                        )
                      })}
                    </div>
                    {skillsData.certifications?.length > 0 && (
                      <div className="ins-card">
                        <div style={{ fontSize:11, fontWeight:800, color:"var(--accent2)", textTransform:"uppercase", letterSpacing:0.9, marginBottom:10 }}>Recommended Certifications</div>
                        <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                          {skillsData.certifications.map((c,i) => <span key={i} style={{ fontSize:13, padding:"5px 14px", background:"rgba(108,92,231,0.08)", border:"1px solid rgba(108,92,231,0.2)", borderRadius:22, color:"var(--accent2)" }}>{c}</span>)}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            )}

            {/* ══ EMPLOYERS ══ */}
            {activeTab === "employers" && (
              <div>
                <h2 className="sec-head">Top Employers</h2>
                <p className="sec-sub">Who's hiring, interview formats, difficulty, and prep tips</p>
                <SearchBar placeholder="e.g. Product Manager India, Quant Analyst Singapore…"/>
                {errEmployers && <ErrorBanner msg={errEmployers}/>}
                {loadingEmployers && <LoadingBlock label="Finding top employers…"/>}
                {!employersData && !loadingEmployers && !errEmployers && <EmptyState icon="🏢" text="Search any role" sub="Find out which companies are actively hiring, how they interview, and how to prepare"/>}
                {employersData && (
                  <motion.div style={{ display:"flex", flexDirection:"column", gap:12 }} initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }}>
                    {employersData.application_tip && (
                      <div style={{ padding:"12px 18px", background:"rgba(108,92,231,0.06)", border:"1px solid rgba(108,92,231,0.18)", borderRadius:12, fontSize:14, color:"var(--accent2)", display:"flex", gap:10 }}>
                        <span>💡</span><span>{employersData.application_tip}</span>
                      </div>
                    )}
                    {employersData.employers?.map((e,i) => (
                      <motion.div key={i} className="ins-card" initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.06 }}>
                        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", flexWrap:"wrap", gap:10, marginBottom:12 }}>
                          <div>
                            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
                              <span style={{ fontSize:16, fontWeight:700, color:"var(--text)" }}>{e.name}</span>
                              <span style={{ fontSize:11, padding:"2px 9px", background:"rgba(0,206,201,0.08)", border:"1px solid rgba(0,206,201,0.2)", borderRadius:20, color:"var(--teal)", fontWeight:700 }}>{e.type}</span>
                            </div>
                            <p style={{ fontSize:13, color:"var(--muted)" }}>{e.culture_note}</p>
                          </div>
                          <div style={{ padding:"5px 13px", background:`${diffColor(e.difficulty)}10`, border:`1.5px solid ${diffColor(e.difficulty)}30`, borderRadius:22, fontSize:13, fontWeight:700, color:diffColor(e.difficulty) }}>
                            {e.difficulty}
                          </div>
                        </div>
                        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                          <div style={{ padding:"10px 14px", background:"rgba(0,0,0,0.2)", borderRadius:9 }}>
                            <div style={{ fontSize:10.5, fontWeight:800, color:"var(--subtle)", textTransform:"uppercase", letterSpacing:0.9, marginBottom:6 }}>Interview Format</div>
                            <p style={{ fontSize:13, color:"var(--text)", lineHeight:1.65 }}>{e.interview_format}</p>
                          </div>
                          <div style={{ padding:"10px 14px", background:"rgba(108,92,231,0.05)", borderRadius:9 }}>
                            <div style={{ fontSize:10.5, fontWeight:800, color:"var(--accent2)", textTransform:"uppercase", letterSpacing:0.9, marginBottom:6 }}>Prep Tip</div>
                            <p style={{ fontSize:13, color:"#c0c8e0", lineHeight:1.65 }}>{e.prep_tip}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </div>
            )}

            {/* ══ CALENDAR ══ */}
            {activeTab === "calendar" && (
              <div>
                <h2 className="sec-head">Hiring Calendar</h2>
                <p className="sec-sub">When to apply, when to network, and when to wait</p>
                <SearchBar placeholder="e.g. Investment Banking Analyst, Graduate Software Engineer…"/>
                {errCalendar && <ErrorBanner msg={errCalendar}/>}
                {loadingCalendar && <LoadingBlock label="Building your hiring calendar…"/>}
                {!calendarData && !loadingCalendar && !errCalendar && <EmptyState icon="📅" text="Search any role" sub="Get a month-by-month recruiting timeline so you never miss a deadline"/>}
                {calendarData && (
                  <motion.div style={{ display:"flex", flexDirection:"column", gap:14 }} initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }}>
                    <div className="ins-card" style={{ background:"rgba(0,206,201,0.04)", borderColor:"rgba(0,206,201,0.18)" }}>
                      <div style={{ fontSize:11, fontWeight:800, color:"var(--teal)", textTransform:"uppercase", letterSpacing:0.9, marginBottom:8 }}>Peak Season</div>
                      <div style={{ fontSize:16, fontWeight:700, color:"var(--text)", marginBottom:8 }}>{calendarData.peak_season}</div>
                      <p style={{ fontSize:13.5, color:"var(--muted)", lineHeight:1.75 }}>{calendarData.calendar_note}</p>
                    </div>
                    <div className="ins-card">
                      <div style={{ fontSize:11, fontWeight:800, color:"var(--accent2)", textTransform:"uppercase", letterSpacing:0.9, marginBottom:16 }}>Recruiting Timeline</div>
                      <div style={{ display:"flex", flexDirection:"column", gap:0 }}>
                        {calendarData.timeline?.map((phase,i) => (
                          <div key={i} style={{ display:"flex", gap:16, paddingBottom:i < calendarData.timeline.length-1 ? 20 : 0 }}>
                            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", flexShrink:0 }}>
                              <div style={{ width:20,height:20,borderRadius:"50%",background:"var(--accent)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:"#fff" }}>{i+1}</div>
                              {i < calendarData.timeline.length-1 && <div style={{ width:2,flex:1,background:"var(--border2)",marginTop:4 }}/>}
                            </div>
                            <div style={{ flex:1, paddingTop:1 }}>
                              <div style={{ fontSize:14, fontWeight:700, color:"var(--text)", marginBottom:2 }}>{phase.phase}</div>
                              <div style={{ fontSize:12, color:"var(--accent2)", marginBottom:4 }}>{phase.timing}</div>
                              <p style={{ fontSize:13, color:"var(--muted)", lineHeight:1.65 }}>{phase.action}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                      <div className="ins-card">
                        <div style={{ fontSize:11, fontWeight:800, color:"var(--teal)", textTransform:"uppercase", letterSpacing:0.9, marginBottom:8 }}>Market Quirks</div>
                        <p style={{ fontSize:13.5, color:"#8892b0", lineHeight:1.75 }}>{calendarData.market_quirks}</p>
                      </div>
                      <div className="ins-card">
                        <div style={{ fontSize:11, fontWeight:800, color:"var(--green)", textTransform:"uppercase", letterSpacing:0.9, marginBottom:8 }}>Networking Tip</div>
                        <p style={{ fontSize:13.5, color:"#b8f5d8", lineHeight:1.75 }}>🤝 {calendarData.networking_tip}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {/* ══ CAREER PATH (NEW) ══ */}
            {activeTab === "path" && (
              <div>
                <h2 className="sec-head">Career Path</h2>
                <p className="sec-sub">Your step-by-step roadmap to any dream role — with timelines, salaries, and milestones</p>
                <div style={{ display:"flex", gap:10, marginBottom:16 }}>
                  <div style={{ flex:1, position:"relative" }}>
                    <Target size={15} color="var(--subtle)" style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}/>
                    <input className="ins-inp" placeholder="e.g. VP of Engineering, Managing Director, Chief Data Officer…"
                      value={pathRole} onChange={e => setPathRole(e.target.value)} onKeyDown={e => e.key==="Enter" && fetchCareerPath()}/>
                  </div>
                  <button className="ins-btn" onClick={fetchCareerPath} disabled={loadingPath || !pathRole.trim()}>
                    {loadingPath ? <><Spin/>Mapping…</> : <><Sparkles size={14}/>Build Path</>}
                  </button>
                </div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:24 }}>
                  {["VP of Engineering","Managing Director IB","Partner at McKinsey","CTO","Chief Data Officer","Head of Product","Fund Manager","General Counsel"].map(r => (
                    <button key={r} className="suggestion-chip" onClick={() => { setPathRole(r); setTimeout(fetchCareerPath, 30) }}>{r}</button>
                  ))}
                </div>
                {errPath && <ErrorBanner msg={errPath}/>}
                {loadingPath && <LoadingBlock label="Mapping your career journey…"/>}
                {!pathData && !loadingPath && !errPath && <EmptyState icon="🗺️" text="Where do you want to be?" sub="Enter your dream role and get a realistic roadmap with timelines, salary progression, and key milestones"/>}
                {pathData && (
                  <motion.div style={{ display:"flex", flexDirection:"column", gap:14 }} initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }}>
                    <div className="ins-card" style={{ background:"rgba(108,92,231,0.06)", borderColor:"rgba(108,92,231,0.22)" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:11, color:"var(--subtle)", textTransform:"uppercase", letterSpacing:0.9, fontWeight:800, marginBottom:6 }}>Target Role</div>
                          <div style={{ fontSize:20, fontWeight:700, color:"#fff", fontFamily:"var(--display)" }}>{pathData.target_role}</div>
                        </div>
                        <div style={{ padding:"8px 18px", background:"rgba(0,184,148,0.1)", border:"1px solid rgba(0,184,148,0.25)", borderRadius:12, textAlign:"center" }}>
                          <div style={{ fontSize:24, fontWeight:800, color:"var(--green)", fontFamily:"var(--display)" }}>{pathData.timeline_years}</div>
                          <div style={{ fontSize:11, color:"var(--muted)", textTransform:"uppercase", letterSpacing:0.8 }}>Avg years</div>
                        </div>
                      </div>
                    </div>
                    {pathData.path?.map((step,i) => (
                      <motion.div key={i} className="ins-card" initial={{ opacity:0, x:-12 }} animate={{ opacity:1, x:0 }} transition={{ delay:i*0.08 }}
                        style={{ borderLeft:`3px solid ${i===pathData.path.length-1?"var(--accent)":"var(--border2)"}`, borderRadius:"0 16px 16px 0" }}>
                        <div style={{ display:"flex", alignItems:"flex-start", gap:14, flexWrap:"wrap" }}>
                          <div style={{ width:28,height:28,borderRadius:"50%",background:i===pathData.path.length-1?"var(--accent)":"var(--surface2)",border:`2px solid ${i===pathData.path.length-1?"var(--accent)":"var(--border2)"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:i===pathData.path.length-1?"#fff":"var(--subtle)",flexShrink:0 }}>{i+1}</div>
                          <div style={{ flex:1 }}>
                            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6, flexWrap:"wrap" }}>
                              <span style={{ fontSize:16, fontWeight:700, color: i===pathData.path.length-1?"var(--accent2)":"var(--text)" }}>{step.title}</span>
                              <span style={{ fontSize:11, color:"var(--subtle)", padding:"2px 9px", background:"rgba(255,255,255,0.04)", borderRadius:20, border:"1px solid var(--border2)" }}>{step.years}</span>
                              <span style={{ fontSize:12, fontWeight:700, color:"var(--green)" }}>{step.salary}</span>
                            </div>
                            <p style={{ fontSize:13.5, color:"var(--muted)", lineHeight:1.7, marginBottom:10 }}>{step.milestone}</p>
                            <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                              {step.key_skills?.map((sk,j) => <span key={j} style={{ fontSize:11, padding:"3px 10px", background:"rgba(0,206,201,0.07)", border:"1px solid rgba(0,206,201,0.18)", borderRadius:20, color:"var(--teal)" }}>{sk}</span>)}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                      <div className="ins-card">
                        <div style={{ fontSize:11, fontWeight:800, color:"var(--green)", textTransform:"uppercase", letterSpacing:0.9, marginBottom:8 }}>⚡ Fast Track Tip</div>
                        <p style={{ fontSize:13.5, color:"#b8f5d8", lineHeight:1.75 }}>{pathData.fast_track_tip}</p>
                      </div>
                      <div className="ins-card">
                        <div style={{ fontSize:11, fontWeight:800, color:"var(--red)", textTransform:"uppercase", letterSpacing:0.9, marginBottom:8 }}>⚠️ Common Mistake</div>
                        <p style={{ fontSize:13.5, color:"#fab1a0", lineHeight:1.75 }}>{pathData.common_mistake}</p>
                      </div>
                    </div>
                    {pathData.alternative_paths?.length > 0 && (
                      <div className="ins-card">
                        <div style={{ fontSize:11, fontWeight:800, color:"var(--accent2)", textTransform:"uppercase", letterSpacing:0.9, marginBottom:10 }}>Alternative Paths</div>
                        <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                          {pathData.alternative_paths.map((p,i) => (
                            <span key={i} style={{ fontSize:13, padding:"5px 14px", background:"rgba(108,92,231,0.08)", border:"1px solid rgba(108,92,231,0.2)", borderRadius:22, color:"var(--accent2)" }}>{p}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            )}

            {/* ══ NEWS ══ */}
            {activeTab === "news" && (
              <div>
                <h2 className="sec-head">Hiring News</h2>
                <p className="sec-sub">Latest updates from finance, tech, and consulting</p>
                <div style={{ display:"flex", gap:7, flexWrap:"wrap", marginBottom:20 }}>
                  {["All","Finance","Technology","Consulting","India","Singapore","UAE","UK"].map(tag => (
                    <button key={tag} className="mkt-btn"
                      style={{ background:newsFilter===tag?"rgba(108,92,231,0.14)":"rgba(255,255,255,0.03)", borderColor:newsFilter===tag?"var(--accent)":"var(--border2)", color:newsFilter===tag?"var(--accent2)":"var(--subtle)" }}
                      onClick={() => setNewsFilter(tag)}>{tag}</button>
                  ))}
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {filteredNews.map((n,i) => (
                    <motion.a key={i} href={n.url} target="_blank" rel="noopener noreferrer" className="news-card"
                      initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.04 }}>
                      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", gap:10 }}>
                        <span style={{ fontSize:14.5, fontWeight:600, color:"var(--text)", lineHeight:1.5, flex:1 }}>{n.title}</span>
                        <span style={{ fontSize:11, padding:"3px 10px", background:"rgba(108,92,231,0.1)", border:"1px solid rgba(108,92,231,0.2)", borderRadius:20, color:"var(--accent2)", flexShrink:0, fontWeight:700 }}>{n.tag}</span>
                      </div>
                      <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                        <span style={{ fontSize:12, color:"var(--accent2)", fontWeight:700 }}>{n.source}</span>
                        <span style={{ fontSize:12, color:"var(--subtle)" }}>·</span>
                        <span style={{ fontSize:12, color:"var(--subtle)" }}>{n.time}</span>
                        <ChevronRight size={12} color="var(--subtle)" style={{ marginLeft:"auto" }}/>
                      </div>
                    </motion.a>
                  ))}
                  {filteredNews.length === 0 && <EmptyState icon="📰" text="No news in this category" sub="Try a different filter above"/>}
                </div>
              </div>
            )}

            {/* ══ ROLE EXPLAINER ══ */}
            {activeTab === "role" && (
              <div>
                <h2 className="sec-head">Role Explainer</h2>
                <p className="sec-sub">Full breakdown of any role — day in the life, skills, salary, and how to break in</p>
                <div style={{ display:"flex", gap:10, marginBottom:16 }}>
                  <div style={{ flex:1, position:"relative" }}>
                    <Search size={15} color="var(--subtle)" style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}/>
                    <input className="ins-inp" placeholder="e.g. Equity Research Analyst, DevOps Engineer, Strategy Consultant…"
                      value={roleQuery} onChange={e => setRoleQuery(e.target.value)} onKeyDown={e => e.key==="Enter" && fetchRole()}/>
                  </div>
                  <button className="ins-btn" onClick={fetchRole} disabled={loadingRole || !roleQuery.trim()}>
                    {loadingRole ? <><Spin/>Analysing…</> : <><BookOpen size={14}/>Explain</>}
                  </button>
                </div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:24 }}>
                  {SUGGESTED_ROLES.slice(0,10).map(r => (
                    <button key={r} className="suggestion-chip" onClick={() => { setRoleQuery(r); setTimeout(fetchRole, 30) }}>{r}</button>
                  ))}
                </div>
                {errRole && <ErrorBanner msg={errRole}/>}
                {loadingRole && <LoadingBlock label="Building full role breakdown…"/>}
                {!roleData && !loadingRole && !errRole && <EmptyState icon="🤖" text="Search any role" sub="Get a complete breakdown — daily tasks, core skills, salary ranges, how to break in, and exit paths"/>}
                {roleData && (
                  <motion.div style={{ display:"flex", flexDirection:"column", gap:14 }} initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }}>
                    <div className="ins-card" style={{ background:"rgba(108,92,231,0.06)", borderColor:"rgba(108,92,231,0.22)" }}>
                      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10, marginBottom:12 }}>
                        <h3 style={{ fontFamily:"var(--display)", fontSize:22, color:"#fff" }}>{roleData.role}</h3>
                        <div style={{ display:"flex", gap:10, alignItems:"center" }}>
                          <span style={{ fontSize:12, padding:"4px 12px", background:"rgba(108,92,231,0.12)", border:"1px solid rgba(108,92,231,0.25)", borderRadius:20, color:"var(--accent2)", fontWeight:700, textTransform:"capitalize" }}>{roleData.difficulty_to_get} to break in</span>
                          <span style={{ fontSize:12, padding:"4px 12px", background:"rgba(0,206,201,0.08)", border:"1px solid rgba(0,206,201,0.2)", borderRadius:20, color:"var(--teal)", fontWeight:700 }}>{roleData.interview_rounds} rounds</span>
                        </div>
                      </div>
                      <p style={{ fontSize:15, color:"#c0c8e0", lineHeight:1.8, marginBottom:16 }}>{roleData.summary}</p>
                      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
                        {[["Entry",roleData.salary_range?.entry,"var(--green)"],["Mid",roleData.salary_range?.mid,"var(--teal)"],["Senior",roleData.salary_range?.senior,"var(--amber)"]].map(([l,v,c]) => (
                          <div key={l} style={{ textAlign:"center", padding:"10px", background:"rgba(0,0,0,0.25)", borderRadius:10 }}>
                            <div style={{ fontSize:10.5, color:"var(--subtle)", marginBottom:4, textTransform:"uppercase", letterSpacing:0.8 }}>{l}</div>
                            <div style={{ fontSize:16, fontWeight:800, color:c, fontFamily:"var(--display)" }}>{v}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                      <div className="ins-card">
                        <div style={{ fontSize:11, fontWeight:800, color:"var(--teal)", textTransform:"uppercase", letterSpacing:0.9, marginBottom:10 }}>Day in the Life</div>
                        {roleData.day_in_life?.map((t,i) => <div key={i} style={{ fontSize:13.5, color:"var(--text)", marginBottom:7, paddingLeft:12, borderLeft:"2px solid var(--teal)", lineHeight:1.5 }}>{t}</div>)}
                      </div>
                      <div className="ins-card">
                        <div style={{ fontSize:11, fontWeight:800, color:"var(--accent2)", textTransform:"uppercase", letterSpacing:0.9, marginBottom:10 }}>Core Skills</div>
                        <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
                          {roleData.core_skills?.map((s,i) => <span key={i} style={{ fontSize:13, padding:"4px 12px", background:"rgba(108,92,231,0.08)", border:"1px solid rgba(108,92,231,0.2)", borderRadius:20, color:"var(--accent2)" }}>{s}</span>)}
                        </div>
                      </div>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                      <div className="ins-card">
                        <div style={{ fontSize:11, fontWeight:800, color:"var(--green)", textTransform:"uppercase", letterSpacing:0.9, marginBottom:10 }}>How to Break In</div>
                        {roleData.how_to_break_in?.map((s,i) => (
                          <div key={i} style={{ display:"flex", gap:10, marginBottom:8 }}>
                            <div style={{ width:20,height:20,borderRadius:"50%",background:"rgba(0,184,148,0.12)",border:"1px solid rgba(0,184,148,0.25)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:800,color:"var(--green)",flexShrink:0 }}>{i+1}</div>
                            <span style={{ fontSize:13, color:"var(--text)", lineHeight:1.55 }}>{s}</span>
                          </div>
                        ))}
                      </div>
                      <div className="ins-card">
                        <div style={{ fontSize:11, fontWeight:800, color:"var(--amber)", textTransform:"uppercase", letterSpacing:0.9, marginBottom:10 }}>Exit Paths</div>
                        {roleData.exit_paths?.map((p,i) => <div key={i} style={{ fontSize:13.5, color:"#ffeaa7", marginBottom:7, display:"flex", gap:7, alignItems:"center" }}><ChevronRight size={12} color="var(--amber)"/>{p}</div>)}
                      </div>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                      <div className="ins-card">
                        <div style={{ fontSize:11, fontWeight:800, color:"var(--green)", textTransform:"uppercase", letterSpacing:0.9, marginBottom:10 }}>Pros</div>
                        {roleData.pros?.map((p,i) => <div key={i} style={{ fontSize:13.5, color:"#b8f5d8", marginBottom:7 }}>✓ {p}</div>)}
                      </div>
                      <div className="ins-card">
                        <div style={{ fontSize:11, fontWeight:800, color:"var(--red)", textTransform:"uppercase", letterSpacing:0.9, marginBottom:10 }}>Cons</div>
                        {roleData.cons?.map((c,i) => <div key={i} style={{ fontSize:13.5, color:"#fab1a0", marginBottom:7 }}>✗ {c}</div>)}
                      </div>
                    </div>
                    <div className="ins-card">
                      <div style={{ fontSize:11, fontWeight:800, color:"var(--accent2)", textTransform:"uppercase", letterSpacing:0.9, marginBottom:12 }}>Best Companies</div>
                      <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                        {roleData.best_companies?.map((c,i) => (
                          <span key={i} style={{ fontSize:13, padding:"5px 14px", background:"rgba(162,155,254,0.08)", border:"1px solid rgba(162,155,254,0.2)", borderRadius:22, color:"var(--accent2)" }}>{c}</span>
                        ))}
                      </div>
                      {roleData.interview_types && (
                        <div style={{ marginTop:14 }}>
                          <div style={{ fontSize:11, color:"var(--subtle)", textTransform:"uppercase", letterSpacing:0.8, fontWeight:800, marginBottom:8 }}>Interview Types</div>
                          <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
                            {roleData.interview_types.map((t,i) => <span key={i} style={{ fontSize:12.5, padding:"4px 12px", background:"rgba(0,206,201,0.07)", border:"1px solid rgba(0,206,201,0.18)", borderRadius:20, color:"var(--teal)" }}>{t}</span>)}
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {/* ══ COLD OUTREACH ══ */}
            {activeTab === "email" && (
              <div>
                <h2 className="sec-head">Cold Outreach Generator</h2>
                <p className="sec-sub">AI-written cold emails and LinkedIn DMs that actually get replies</p>
                <div style={{ display:"flex", flexDirection:"column", gap:14, marginBottom:20 }}>
                  <div>
                    <label className="field-label">Your Background</label>
                    <textarea className="ins-inp ins-ta ins-inp-plain" placeholder="e.g. Final-year engineering student with internship at Infosys, interested in investment banking…"
                      value={emailBg} onChange={e => setEmailBg(e.target.value)}/>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                    <div>
                      <label className="field-label">Target Role</label>
                      <input className="ins-inp ins-inp-plain" placeholder="e.g. Investment Banking Analyst" value={emailRole} onChange={e => setEmailRole(e.target.value)}/>
                    </div>
                    <div>
                      <label className="field-label">Target Company</label>
                      <input className="ins-inp ins-inp-plain" placeholder="e.g. Goldman Sachs" value={emailCompany} onChange={e => setEmailCompany(e.target.value)}/>
                    </div>
                  </div>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                    <div>
                      <label className="field-label">Recipient's Title (optional)</label>
                      <input className="ins-inp ins-inp-plain" placeholder="e.g. VP, Associate, Recruiter" value={emailTitle} onChange={e => setEmailTitle(e.target.value)}/>
                    </div>
                    <div>
                      <label className="field-label">Message Type</label>
                      <div style={{ display:"flex", gap:8 }}>
                        {[["cold_email","📧 Cold Email"],["linkedin_dm","💼 LinkedIn DM"]].map(([val,lbl]) => (
                          <button key={val} onClick={() => setEmailType(val)}
                            style={{ flex:1, padding:"12px", borderRadius:11, border:`1.5px solid ${emailType===val?"var(--accent)":"var(--border2)"}`, background:emailType===val?"rgba(108,92,231,0.1)":"rgba(255,255,255,0.02)", color:emailType===val?"var(--accent2)":"var(--subtle)", fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"var(--font)" }}>
                            {lbl}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                {errEmail && <ErrorBanner msg={errEmail}/>}
                <button className="ins-btn" onClick={generateEmail} disabled={loadingEmail || !emailBg.trim() || !emailRole.trim() || !emailCompany.trim()} style={{ marginBottom:20 }}>
                  {loadingEmail ? <><Spin/>Writing…</> : <><Sparkles size={14}/>Generate Message</>}
                </button>
                {emailResult && (
                  <motion.div style={{ background:"var(--surface)", border:"1px solid rgba(108,92,231,0.25)", borderRadius:16, overflow:"hidden" }} initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"13px 20px", background:"rgba(108,92,231,0.07)", borderBottom:"1px solid rgba(108,92,231,0.14)" }}>
                      <span style={{ fontSize:13, fontWeight:700, color:"var(--accent2)" }}>{emailResult.type==="linkedin_dm" ? "💼 LinkedIn DM" : "📧 Cold Email"}</span>
                      <button onClick={() => copyText(emailResult.message)} style={{ display:"flex", alignItems:"center", gap:7, padding:"6px 14px", background:copied?"rgba(0,184,148,0.1)":"rgba(255,255,255,0.04)", border:`1px solid ${copied?"rgba(0,184,148,0.3)":"var(--border2)"}`, borderRadius:8, color:copied?"var(--green)":"#9aa0b8", fontSize:13, cursor:"pointer", fontFamily:"var(--font)", fontWeight:600 }}>
                        {copied ? <><Check size={13}/>Copied!</> : <><Copy size={13}/>Copy</>}
                      </button>
                    </div>
                    {emailResult.subject && (
                      <div style={{ padding:"11px 20px", borderBottom:"1px solid var(--border)" }}>
                        <span style={{ fontSize:12, fontWeight:700, color:"var(--subtle)", textTransform:"uppercase", letterSpacing:0.8 }}>Subject: </span>
                        <span style={{ fontSize:14.5, color:"var(--text)" }}>{emailResult.subject}</span>
                      </div>
                    )}
                    <div style={{ padding:"18px 20px" }}>
                      <pre style={{ fontSize:14.5, color:"#c0c8e0", lineHeight:1.85, whiteSpace:"pre-wrap", fontFamily:"var(--font)", margin:0 }}>{emailResult.message}</pre>
                    </div>
                    <div style={{ padding:"12px 20px", borderTop:"1px solid var(--border)" }}>
                      <button className="ins-btn" style={{ maxWidth:190, padding:"9px 18px", fontSize:13.5 }} onClick={generateEmail}><RefreshCw size={12}/>Regenerate</button>
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {/* ══ MY SCORES ══ */}
            {activeTab === "compare" && (
              <div>
                <h2 className="sec-head">Your Scores vs Platform</h2>
                <p className="sec-sub">How do your SensAI scores compare to everyone else?</p>
                {userSessions.length > 0 ? (
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:24 }}>
                    {[
                      { label:"Recent avg",    value:`${userAvg}/10`,  color:scoreColor(+userAvg) },
                      { label:"Sessions done", value:userSessions.length, color:"var(--accent)" },
                      { label:"Best score",    value:`${Math.max(...userSessions.slice(0,10).map(s => s.overall_score || 0))}/10`, color:"var(--green)" },
                    ].map((s,i) => (
                      <div key={i} className="ins-card" style={{ textAlign:"center" }}>
                        <div style={{ fontSize:32, fontWeight:800, fontFamily:"var(--display)", color:s.color, marginBottom:6 }}>{s.value}</div>
                        <div style={{ fontSize:13, color:"var(--muted)" }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="ins-card" style={{ textAlign:"center", padding:"32px", marginBottom:22 }}>
                    <p style={{ fontSize:15, color:"var(--muted)", marginBottom:14 }}>Complete a mock interview first to see your scores here.</p>
                    <Link to="/interview"><button className="ins-btn" style={{ margin:"0 auto", maxWidth:220 }}>Start a session →</button></Link>
                  </div>
                )}
                <div style={{ marginBottom:14 }}>
                  <label className="field-label">Compare for role</label>
                  <div style={{ display:"flex", gap:10 }}>
                    <input className="ins-inp ins-inp-plain" style={{ flex:1 }} placeholder="e.g. Investment Banking Analyst, Software Engineer…"
                      value={compRole} onChange={e => setCompRole(e.target.value)} onKeyDown={e => e.key==="Enter" && fetchComparison()}/>
                    <button className="ins-btn" onClick={fetchComparison} disabled={loadingComp || !compRole.trim()}>
                      {loadingComp ? <Spin/> : <><Sparkles size={14}/>Compare</>}
                    </button>
                  </div>
                </div>
                {compData && compData.comparisons?.length > 0 && compData.comparisons.map((c,i) => (
                  <motion.div key={i} className="ins-card" style={{ marginBottom:10 }} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}>
                    <div style={{ fontSize:15.5, fontWeight:700, color:"var(--text)", marginBottom:12 }}>{c._id}</div>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:12 }}>
                      {[["Platform avg",`${c.avg_score?.toFixed(1)}/10`,scoreColor(c.avg_score)],["Readiness",`${Math.round(c.avg_readiness)}%`,"var(--accent)"],["Sessions",c.count,"var(--teal)"]].map(([l,v,col]) => (
                        <div key={l} style={{ textAlign:"center", padding:"12px", background:"rgba(0,0,0,0.2)", borderRadius:10 }}>
                          <div style={{ fontSize:22, fontWeight:800, fontFamily:"var(--display)", color:col }}>{v}</div>
                          <div style={{ fontSize:12, color:"var(--subtle)", marginTop:3 }}>{l}</div>
                        </div>
                      ))}
                    </div>
                    {userAvg && (
                      <div style={{ padding:"11px 16px", background:+userAvg>=c.avg_score?"rgba(0,184,148,0.07)":"rgba(253,203,110,0.07)", border:`1px solid ${+userAvg>=c.avg_score?"rgba(0,184,148,0.2)":"rgba(253,203,110,0.2)"}`, borderRadius:10, fontSize:14, color:+userAvg>=c.avg_score?"var(--green)":"var(--amber)" }}>
                        {+userAvg >= c.avg_score
                          ? `✓ You're ${(+userAvg - c.avg_score).toFixed(1)} above the platform average.`
                          : `You're ${(c.avg_score - +userAvg).toFixed(1)} below platform average — keep practising!`}
                      </div>
                    )}
                  </motion.div>
                ))}
                {compData && compData.comparisons?.length === 0 && (
                  <div className="ins-card" style={{ textAlign:"center", padding:"24px" }}>
                    <p style={{ fontSize:14, color:"var(--muted)" }}>No platform data yet for this role. Be the first!</p>
                  </div>
                )}
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

