import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Link } from "react-router-dom"
import axios from "axios"
import {
  ArrowLeft, TrendingUp, TrendingDown, Minus, BarChart2,
  Mail, Star, RefreshCw, Copy, Check, Zap, ArrowRight,
  Search, Globe, MapPin
} from "lucide-react"

const API = "http://127.0.0.1:8000/insights"

const MARKETS = [
  { id:"US",        flag:"🇺🇸", label:"United States" },
  { id:"India",     flag:"🇮🇳", label:"India"          },
  { id:"UK",        flag:"🇬🇧", label:"United Kingdom" },
  { id:"Singapore", flag:"🇸🇬", label:"Singapore"      },
  { id:"UAE",       flag:"🇦🇪", label:"UAE"            },
  { id:"Global",    flag:"🌍", label:"Global Avg"      },
]

const SUGGESTED_ROLES = [
  "Investment Banking Analyst", "Software Engineer", "Management Consultant",
  "Data Scientist", "Product Manager", "Equity Research Analyst",
  "Private Equity Associate", "UX Designer", "DevOps Engineer",
  "Chartered Accountant", "Marketing Manager", "HR Business Partner",
  "Risk Analyst", "ML Engineer", "Strategy Analyst",
  "Venture Capital Analyst", "Business Analyst", "Cloud Architect",
]

const NEWS_FEEDS = [
  { title:"Goldman Sachs posts record advisory revenue for Q1", source:"FT", time:"2h ago", url:"https://ft.com", tag:"Finance" },
  { title:"Big Tech hiring freeze shows signs of thawing in H2", source:"Bloomberg", time:"5h ago", url:"https://bloomberg.com", tag:"Technology" },
  { title:"McKinsey announces 10% headcount increase in strategy practice", source:"WSJ", time:"1d ago", url:"https://wsj.com", tag:"Consulting" },
  { title:"India's startup ecosystem creates 200k+ new tech jobs in Q1", source:"ET", time:"1d ago", url:"https://economictimes.com", tag:"India" },
  { title:"AWS hiring 5,000 engineers globally across cloud teams", source:"TechCrunch", time:"2d ago", url:"https://techcrunch.com", tag:"Technology" },
  { title:"Singapore MAS grants new digital banking licences — hiring surge expected", source:"Straits Times", time:"2d ago", url:"https://straitstimes.com", tag:"Singapore" },
  { title:"Deloitte graduate intake up 18% — audit and advisory leading growth", source:"AccountancyAge", time:"3d ago", url:"https://accountancyage.com", tag:"Consulting" },
  { title:"HDFC, ICICI Bank expand wealth management teams across India", source:"Mint", time:"3d ago", url:"https://livemint.com", tag:"India" },
  { title:"Dubai DIFC firms on hiring spree for finance & compliance roles", source:"Gulf News", time:"4d ago", url:"https://gulfnews.com", tag:"UAE" },
  { title:"UK Big 4 firms face talent crunch — grad offers up 12%", source:"AccountancyAge", time:"4d ago", url:"https://accountancyage.com", tag:"UK" },
]

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=DM+Sans:wght@400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  @keyframes ins-spin { to { transform: rotate(360deg); } }
  .ins-page { min-height:100vh; background:#080a12; color:#dde1f0; font-family:'DM Sans',sans-serif; }
  .ins-topbar { display:flex; align-items:center; justify-content:space-between; padding:14px 28px; border-bottom:1px solid rgba(255,255,255,0.06); background:rgba(8,10,18,0.95); backdrop-filter:blur(14px); position:sticky; top:0; z-index:10; }
  .ins-body { max-width:1100px; margin:0 auto; padding:32px 24px 80px; }
  .ins-tab { padding:8px 16px; border-radius:8px; font-size:13.5px; font-weight:600; cursor:pointer; border:1.5px solid transparent; font-family:'DM Sans',sans-serif; transition:all .2s; white-space:nowrap; }
  .ins-tab.active   { background:rgba(124,111,250,0.15); border-color:#7c6ffa; color:#a99dfc; }
  .ins-tab.inactive { background:transparent; border-color:rgba(255,255,255,0.08); color:#5a6488; }
  .ins-tab.inactive:hover { border-color:#7c6ffa; color:#a99dfc; }
  .ins-card { background:#0c0e1a; border:1px solid #1e2235; border-radius:16px; padding:20px 22px; }
  .ins-inp { width:100%; padding:12px 15px 12px 42px; background:#1a1d2e; border:1.5px solid #2e3450; border-radius:10px; color:#fff; font-family:'DM Sans',sans-serif; font-size:15px; outline:none; transition:border-color .2s; }
  .ins-inp:focus { border-color:#7c6ffa; box-shadow:0 0 0 3px rgba(124,111,250,0.12); }
  .ins-inp::placeholder { color:#4a5070; }
  .ins-inp-plain { padding-left:15px; }
  .ins-ta { resize:vertical; min-height:90px; line-height:1.7; }
  .ins-btn { display:flex; align-items:center; justify-content:center; gap:8px; padding:12px 22px; background:linear-gradient(135deg,#5b4fd4,#7c6ffa); border:none; border-radius:11px; color:#fff; font-family:'DM Sans',sans-serif; font-size:15px; font-weight:700; cursor:pointer; transition:opacity .2s; box-shadow:0 4px 20px rgba(124,111,250,0.28); white-space:nowrap; }
  .ins-btn:hover:not(:disabled) { opacity:.9; }
  .ins-btn:disabled { opacity:.6; cursor:not-allowed; }
  .heat-bar { height:7px; border-radius:4px; background:#1e2235; overflow:hidden; }
  .heat-fill { height:100%; border-radius:4px; transition:width 1.1s ease; }
  .mkt-btn { padding:7px 14px; border-radius:8px; font-size:13px; font-weight:600; cursor:pointer; border:1.5px solid; font-family:'DM Sans',sans-serif; transition:all .18s; display:flex; align-items:center; gap:5px; }
  .suggestion-chip { padding:5px 13px; border-radius:20px; font-size:12.5px; cursor:pointer; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.08); color:#5a6488; font-family:'DM Sans',sans-serif; transition:all .15s; }
  .suggestion-chip:hover { border-color:#7c6ffa; color:#a99dfc; background:rgba(124,111,250,0.07); }
  .empty-state { display:flex; flex-direction:column; align-items:center; justify-content:center; padding:60px 20px; text-align:center; gap:12px; }
`

const scoreColor = s => s >= 8 ? "#30c97e" : s >= 6 ? "#34d5c8" : s >= 4 ? "#f59e0b" : "#f05252"
const trendColor = t => ["up","easier"].includes(t) ? "#30c97e" : ["down","harder"].includes(t) ? "#f05252" : "#f59e0b"
const TrendIcon = ({ t }) => t==="up"||t==="easier" ? <TrendingUp size={13} color="#30c97e"/> : t==="down"||t==="harder" ? <TrendingDown size={13} color="#f05252"/> : <Minus size={13} color="#f59e0b"/>
const Spin = () => <span style={{ width:16,height:16,border:"2px solid rgba(255,255,255,0.2)",borderTopColor:"#fff",borderRadius:"50%",animation:"ins-spin .7s linear infinite",display:"inline-block",flexShrink:0 }} />
const EmptyState = ({ icon, text, sub }) => (
  <div className="empty-state">
    <div style={{ fontSize:40 }}>{icon}</div>
    <div style={{ fontSize:17, fontWeight:600, color:"#dde1f0" }}>{text}</div>
    <div style={{ fontSize:14, color:"#5a6488", maxWidth:340 }}>{sub}</div>
  </div>
)

export default function IndustryInsights() {
  const [activeTab, setActiveTab] = useState("pulse")
  const [market, setMarket] = useState("US")

  // Shared search input across data tabs
  const [searchRole, setSearchRole] = useState("")

  // Market pulse & forecast
  const [pulse, setPulse] = useState(null); const [loadingPulse, setLoadingPulse] = useState(false)
  const [forecast, setForecast] = useState(null); const [loadingForecast, setLoadingForecast] = useState(false)

  // Dynamic data tabs
  const [salaryData, setSalaryData] = useState(null); const [loadingSalary, setLoadingSalary] = useState(false)
  const [skillsData, setSkillsData] = useState(null); const [loadingSkills, setLoadingSkills] = useState(false)
  const [employersData, setEmployersData] = useState(null); const [loadingEmployers, setLoadingEmployers] = useState(false)
  const [calendarData, setCalendarData] = useState(null); const [loadingCalendar, setLoadingCalendar] = useState(false)

  // Role explainer
  const [roleQuery, setRoleQuery] = useState(""); const [roleData, setRoleData] = useState(null); const [loadingRole, setLoadingRole] = useState(false)

  // Cold email
  const [emailBg, setEmailBg] = useState(""); const [emailRole, setEmailRole] = useState(""); const [emailCompany, setEmailCompany] = useState("")
  const [emailTitle, setEmailTitle] = useState(""); const [emailType, setEmailType] = useState("cold_email")
  const [emailResult, setEmailResult] = useState(null); const [loadingEmail, setLoadingEmail] = useState(false); const [copied, setCopied] = useState(false)

  // Comparison
  const [compRole, setCompRole] = useState(""); const [compData, setCompData] = useState(null); const [loadingComp, setLoadingComp] = useState(false)
  const [userSessions, setUserSessions] = useState([])
  const [newsFilter, setNewsFilter] = useState("All")

  const userEmail = localStorage.getItem("userEmail") || ""

  useEffect(() => {
    const id = "ins-css"
    if (!document.getElementById(id)) {
      const el = document.createElement("style"); el.id = id
      el.textContent = CSS; document.head.appendChild(el)
    }
    fetchPulse(); fetchForecast()
    if (userEmail) {
      axios.get(`http://127.0.0.1:8000/interview/history/${userEmail}`)
        .then(r => setUserSessions(r.data.sessions || [])).catch(() => {})
    }
  }, [])

  const fetchPulse = async () => {
    setLoadingPulse(true)
    try { const r = await axios.get(`${API}/market-pulse`); setPulse(r.data.pulse) } catch {} finally { setLoadingPulse(false) }
  }
  const fetchForecast = async () => {
    setLoadingForecast(true)
    try { const r = await axios.get(`${API}/difficulty-forecast`); setForecast(r.data.forecast) } catch {} finally { setLoadingForecast(false) }
  }

  const runSearch = async (role) => {
    const q = (role || searchRole).trim()
    if (!q) return
    if (activeTab === "salary") fetchSalary(q)
    else if (activeTab === "skills") fetchSkills(q)
    else if (activeTab === "employers") fetchEmployers(q)
    else if (activeTab === "calendar") fetchCalendar(q)
  }

  const fetchSalary = async (role) => {
    setLoadingSalary(true); setSalaryData(null)
    try { const r = await axios.post(`${API}/salary`, { role, market }); setSalaryData(r.data.salary) } catch {} finally { setLoadingSalary(false) }
  }
  const fetchSkills = async (role) => {
    setLoadingSkills(true); setSkillsData(null)
    try { const r = await axios.post(`${API}/skills`, { role, market }); setSkillsData(r.data.skills) } catch {} finally { setLoadingSkills(false) }
  }
  const fetchEmployers = async (role) => {
    setLoadingEmployers(true); setEmployersData(null)
    try { const r = await axios.post(`${API}/employers`, { role, market }); setEmployersData(r.data.employers) } catch {} finally { setLoadingEmployers(false) }
  }
  const fetchCalendar = async (role) => {
    setLoadingCalendar(true); setCalendarData(null)
    try { const r = await axios.post(`${API}/hiring-calendar`, { role, market }); setCalendarData(r.data.calendar) } catch {} finally { setLoadingCalendar(false) }
  }
  const fetchRole = async () => {
    if (!roleQuery.trim()) return
    setLoadingRole(true); setRoleData(null)
    try { const r = await axios.post(`${API}/role-explainer`, { role: roleQuery }); setRoleData(r.data.explainer) } catch {} finally { setLoadingRole(false) }
  }
  const generateEmail = async () => {
    if (!emailBg.trim() || !emailRole.trim() || !emailCompany.trim()) return
    setLoadingEmail(true); setEmailResult(null)
    try {
      const r = await axios.post(`${API}/cold-email`, { sender_background: emailBg, target_role: emailRole, target_company: emailCompany, target_person_title: emailTitle, email_type: emailType })
      setEmailResult(r.data)
    } catch {} finally { setLoadingEmail(false) }
  }
  const fetchComparison = async () => {
    if (!compRole.trim()) return
    setLoadingComp(true); setCompData(null)
    try { const r = await axios.get(`${API}/platform-scores/${encodeURIComponent(compRole)}`); setCompData(r.data) } catch {} finally { setLoadingComp(false) }
  }
  const copyText = (t) => { navigator.clipboard.writeText(t); setCopied(true); setTimeout(() => setCopied(false), 2000) }

  const userAvg = userSessions.length ? (userSessions.slice(0,10).reduce((a,s) => a+(s.overall_score||0), 0) / Math.min(userSessions.length,10)).toFixed(1) : null
  const filteredNews = newsFilter === "All" ? NEWS_FEEDS : NEWS_FEEDS.filter(n => n.tag === newsFilter)
  const isDataTab = ["salary","skills","employers","calendar"].includes(activeTab)
  const isLoading = loadingSalary || loadingSkills || loadingEmployers || loadingCalendar

  // ── Market Selector ──
  const MarketSelector = () => (
    <div style={{ display:"flex", gap:7, flexWrap:"wrap" }}>
      {MARKETS.map(m => (
        <button key={m.id} className="mkt-btn"
          style={{ background:market===m.id?"rgba(124,111,250,0.14)":"rgba(255,255,255,0.03)", borderColor:market===m.id?"#7c6ffa":"rgba(255,255,255,0.09)", color:market===m.id?"#a99dfc":"#5a6488" }}
          onClick={() => setMarket(m.id)}>
          <span style={{ fontSize:15 }}>{m.flag}</span>{m.label}
        </button>
      ))}
    </div>
  )

  // ── Universal Search Bar (for data tabs) ──
  const SearchBar = ({ placeholder }) => (
    <div style={{ display:"flex", flexDirection:"column", gap:12, marginBottom:24 }}>
      <div style={{ display:"flex", gap:10 }}>
        <div style={{ flex:1, position:"relative" }}>
          <Search size={16} color="#4a5070" style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }} />
          <input className="ins-inp" placeholder={placeholder}
            value={searchRole} onChange={e => setSearchRole(e.target.value)}
            onKeyDown={e => e.key==="Enter" && runSearch()} />
        </div>
        <button className="ins-btn" onClick={() => runSearch()} disabled={isLoading || !searchRole.trim()}>
          {isLoading ? <><Spin />Loading…</> : <><Zap size={15}/>Search</>}
        </button>
      </div>

      {/* Market selector */}
      <MarketSelector />

      {/* Suggestion chips */}
      <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
        {SUGGESTED_ROLES.slice(0,12).map(r => (
          <button key={r} className="suggestion-chip" onClick={() => { setSearchRole(r); runSearch(r) }}>{r}</button>
        ))}
      </div>
    </div>
  )

  const TABS = [
    { id:"pulse",     label:"📡 Market Pulse"    },
    { id:"forecast",  label:"🔮 Difficulty"       },
    { id:"salary",    label:"💰 Salaries"         },
    { id:"skills",    label:"🔥 Hot Skills"       },
    { id:"employers", label:"🏢 Top Employers"    },
    { id:"calendar",  label:"📅 Hiring Calendar" },
    { id:"news",      label:"📰 News"            },
    { id:"role",      label:"🤖 Role Explainer"  },
    { id:"email",     label:"✉️ Cold Outreach"    },
    { id:"compare",   label:"📊 My Scores"       },
  ]

  return (
    <div className="ins-page">
      <header className="ins-topbar">
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          <Link to="/dashboard" style={{ textDecoration:"none" }}>
            <button style={{ display:"flex", alignItems:"center", gap:7, padding:"9px 18px", background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:9, color:"#9aa0b8", fontSize:14, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
              <ArrowLeft size={15}/>Dashboard
            </button>
          </Link>
          <div style={{ width:1, height:22, background:"rgba(255,255,255,0.08)" }}/>
          <div style={{ width:32, height:32, borderRadius:9, background:"linear-gradient(135deg,#7c6ffa,#34d5c8)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:15, color:"#fff" }}>S</div>
          <span style={{ fontFamily:"'Playfair Display',serif", fontSize:17, fontWeight:700, color:"#fff" }}>Industry Insights</span>
        </div>
        {isDataTab && (
          <div style={{ display:"flex", alignItems:"center", gap:8, padding:"6px 14px", background:"rgba(52,213,200,0.07)", border:"1px solid rgba(52,213,200,0.2)", borderRadius:22 }}>
            <Globe size={13} color="#34d5c8"/>
            <span style={{ fontSize:13, color:"#34d5c8", fontWeight:600 }}>{MARKETS.find(m=>m.id===market)?.flag} {market}</span>
          </div>
        )}
      </header>

      {/* Tab nav */}
      <div style={{ borderBottom:"1px solid rgba(255,255,255,0.06)", padding:"0 24px", overflowX:"auto", background:"rgba(8,10,18,0.8)", scrollbarWidth:"none" }}>
        <div style={{ display:"flex", gap:5, padding:"10px 0", minWidth:"max-content", maxWidth:1100, margin:"0 auto" }}>
          {TABS.map(t => (
            <button key={t.id} className={`ins-tab ${activeTab===t.id?"active":"inactive"}`} onClick={() => setActiveTab(t.id)}>{t.label}</button>
          ))}
        </div>
      </div>

      <div className="ins-body">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} transition={{ duration:0.2 }}>

            {/* ══ MARKET PULSE ══ */}
            {activeTab === "pulse" && (
              <div>
                <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:22, flexWrap:"wrap", gap:12 }}>
                  <div>
                    <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:26, color:"#fff", marginBottom:4 }}>Market Pulse</h2>
                    <p style={{ fontSize:14, color:"#5a6488" }}>Weekly hiring trends across major sectors</p>
                  </div>
                  <button style={{ display:"flex", alignItems:"center", gap:7, padding:"9px 16px", background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.1)", borderRadius:9, color:"#5a6488", fontSize:13.5, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }} onClick={fetchPulse}>
                    <RefreshCw size={14}/>Refresh
                  </button>
                </div>
                {loadingPulse ? (
                  <div style={{ display:"flex", gap:12, padding:"60px 0", justifyContent:"center" }}><Spin/><span style={{ fontSize:15, color:"#5a6488" }}>Loading…</span></div>
                ) : pulse ? (
                  <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                    <div className="ins-card" style={{ background:"rgba(124,111,250,0.06)", borderColor:"rgba(124,111,250,0.2)" }}>
                      <div style={{ fontSize:11.5, fontWeight:700, color:"#7c6ffa", textTransform:"uppercase", letterSpacing:0.9, marginBottom:8 }}>This Week</div>
                      <p style={{ fontSize:15.5, color:"#dde1f0", lineHeight:1.75 }}>{pulse.week_summary}</p>
                      {pulse.top_tip && <div style={{ marginTop:14, padding:"10px 16px", background:"rgba(124,111,250,0.08)", borderRadius:9, display:"flex", gap:10 }}><span style={{ fontSize:16 }}>💡</span><span style={{ fontSize:14, color:"#a99dfc", lineHeight:1.7 }}>{pulse.top_tip}</span></div>}
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:10 }}>
                      {pulse.sectors?.map((s,i) => (
                        <div key={i} className="ins-card">
                          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:9 }}>
                            <span style={{ fontSize:14, fontWeight:700, color:"#dde1f0" }}>{s.name}</span>
                            <div style={{ display:"flex", alignItems:"center", gap:5, padding:"3px 10px", background:`${trendColor(s.trend)}12`, border:`1px solid ${trendColor(s.trend)}28`, borderRadius:20 }}>
                              <TrendIcon t={s.trend}/><span style={{ fontSize:11, fontWeight:700, color:trendColor(s.trend), textTransform:"capitalize" }}>{s.trend}</span>
                            </div>
                          </div>
                          <p style={{ fontSize:13, color:"#5a6488", lineHeight:1.65, marginBottom:10 }}>{s.signal}</p>
                          <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
                            {s.hot_roles?.map((r,j) => <span key={j} style={{ fontSize:11, padding:"2px 9px", background:"rgba(52,213,200,0.07)", border:"1px solid rgba(52,213,200,0.18)", borderRadius:20, color:"#34d5c8" }}>{r}</span>)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            {/* ══ DIFFICULTY FORECAST ══ */}
            {activeTab === "forecast" && (
              <div>
                <div style={{ marginBottom:22 }}>
                  <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:26, color:"#fff", marginBottom:4 }}>Interview Difficulty Forecast</h2>
                  <p style={{ fontSize:14, color:"#5a6488" }}>Is it getting easier or harder to get interviews right now?</p>
                </div>
                {loadingForecast ? (
                  <div style={{ display:"flex", gap:12, padding:"60px 0", justifyContent:"center" }}><Spin/><span style={{ fontSize:15, color:"#5a6488" }}>Analysing…</span></div>
                ) : forecast ? (
                  <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                    <div className="ins-card" style={{ background:"rgba(52,213,200,0.05)", borderColor:"rgba(52,213,200,0.2)" }}>
                      <p style={{ fontSize:15.5, color:"#dde1f0", lineHeight:1.75 }}>{forecast.overall_verdict}</p>
                    </div>
                    {forecast.sectors?.map((s,i) => {
                      const c = trendColor(s.difficulty)
                      return (
                        <div key={i} className="ins-card" style={{ display:"flex", alignItems:"center", gap:16, flexWrap:"wrap" }}>
                          <div style={{ minWidth:190 }}>
                            <div style={{ fontSize:15, fontWeight:700, color:"#dde1f0", marginBottom:3 }}>{s.sector}</div>
                            <div style={{ fontSize:12.5, color:"#5a6488" }}>Avg {s.rounds_avg} rounds</div>
                          </div>
                          <div style={{ display:"flex", alignItems:"center", gap:6, padding:"5px 14px", background:`${c}10`, border:`1.5px solid ${c}30`, borderRadius:22 }}>
                            <TrendIcon t={s.difficulty}/><span style={{ fontSize:13, fontWeight:700, color:c, textTransform:"capitalize" }}>{s.difficulty}</span>
                          </div>
                          <p style={{ fontSize:13.5, color:"#8892b0", flex:1, minWidth:180, lineHeight:1.65 }}>{s.change}</p>
                          <div style={{ padding:"8px 14px", background:"rgba(124,111,250,0.06)", border:"1px solid rgba(124,111,250,0.15)", borderRadius:9, fontSize:13, color:"#a99dfc", maxWidth:240 }}>💡 {s.tip}</div>
                        </div>
                      )
                    })}
                  </div>
                ) : null}
              </div>
            )}

            {/* ══ SALARY ══ */}
            {activeTab === "salary" && (
              <div>
                <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:26, color:"#fff", marginBottom:4 }}>Salary Benchmarks</h2>
                <p style={{ fontSize:14, color:"#5a6488", marginBottom:20 }}>Search any role in any market — AI generates current compensation ranges</p>
                <SearchBar placeholder="Search any role — e.g. Data Scientist, Chartered Accountant, Product Manager…" />
                {loadingSalary && <div style={{ display:"flex", gap:12, padding:"50px 0", justifyContent:"center" }}><Spin/><span style={{ fontSize:15, color:"#5a6488" }}>Fetching salary data…</span></div>}
                {!salaryData && !loadingSalary && <EmptyState icon="💰" text="Search any role above" sub="Works for any job title in any of the 6 markets — from IB Analyst in New York to Data Scientist in Bangalore" />}
                {salaryData && (
                  <motion.div style={{ display:"flex", flexDirection:"column", gap:14 }} initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }}>
                    <div className="ins-card" style={{ background:"rgba(48,201,126,0.05)", borderColor:"rgba(48,201,126,0.2)" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10 }}>
                        <span style={{ fontSize:22 }}>{MARKETS.find(m=>m.id===market)?.flag}</span>
                        <div>
                          <div style={{ fontSize:17, fontWeight:700, color:"#dde1f0" }}>{salaryData.role}</div>
                          <div style={{ fontSize:13, color:"#5a6488" }}>{salaryData.market} · {salaryData.currency_note}</div>
                        </div>
                      </div>
                      <p style={{ fontSize:14, color:"#8892b0", lineHeight:1.7 }}>{salaryData.market_context}</p>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
                      {[
                        { level:"Entry Level", data:salaryData.entry, color:"#30c97e" },
                        { level:"Mid Level",   data:salaryData.mid,   color:"#34d5c8" },
                        { level:"Senior",      data:salaryData.senior,color:"#f59e0b" },
                      ].map(({ level, data, color }) => (
                        <div key={level} className="ins-card" style={{ textAlign:"center" }}>
                          <div style={{ fontSize:11.5, fontWeight:700, color:"#5a6488", textTransform:"uppercase", letterSpacing:0.8, marginBottom:8 }}>{level}</div>
                          <div style={{ fontSize:11, color:"#4a5070", marginBottom:10 }}>{data?.years_exp}</div>
                          <div style={{ fontSize:22, fontWeight:800, fontFamily:"'Playfair Display',serif", color, marginBottom:8 }}>{data?.range}</div>
                          <p style={{ fontSize:12.5, color:"#5a6488", lineHeight:1.6 }}>{data?.note}</p>
                        </div>
                      ))}
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                      <div className="ins-card">
                        <div style={{ fontSize:11.5, fontWeight:700, color:"#7c6ffa", textTransform:"uppercase", letterSpacing:0.8, marginBottom:10 }}>Top Paying Companies</div>
                        {salaryData.top_paying_companies?.map((c,i) => (
                          <div key={i} style={{ display:"flex", gap:10, marginBottom:8 }}>
                            <div style={{ width:20,height:20,borderRadius:"50%",background:"rgba(124,111,250,0.12)",border:"1px solid rgba(124,111,250,0.22)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:"#a99dfc",flexShrink:0 }}>{i+1}</div>
                            <span style={{ fontSize:14, color:"#c0c8e0" }}>{c}</span>
                          </div>
                        ))}
                      </div>
                      <div className="ins-card">
                        <div style={{ fontSize:11.5, fontWeight:700, color:"#30c97e", textTransform:"uppercase", letterSpacing:0.8, marginBottom:10 }}>Negotiation Tip</div>
                        <p style={{ fontSize:14, color:"#b8f5d8", lineHeight:1.75 }}>{salaryData.salary_tip}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {/* ══ SKILLS ══ */}
            {activeTab === "skills" && (
              <div>
                <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:26, color:"#fff", marginBottom:4 }}>Hot Skills</h2>
                <p style={{ fontSize:14, color:"#5a6488", marginBottom:20 }}>In-demand skills for any role in any market</p>
                <SearchBar placeholder="Search any role — e.g. Software Engineer, Marketing Manager, Risk Analyst…" />
                {loadingSkills && <div style={{ display:"flex", gap:12, padding:"50px 0", justifyContent:"center" }}><Spin/><span style={{ fontSize:15, color:"#5a6488" }}>Analysing skills…</span></div>}
                {!skillsData && !loadingSkills && <EmptyState icon="🔥" text="Search any role above" sub="Get the top 8 most in-demand skills, certifications, and a rising skill to watch" />}
                {skillsData && (
                  <motion.div style={{ display:"flex", flexDirection:"column", gap:14 }} initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }}>
                    <div className="ins-card" style={{ background:"rgba(245,158,11,0.05)", borderColor:"rgba(245,158,11,0.2)" }}>
                      <div style={{ fontSize:15, fontWeight:700, color:"#dde1f0", marginBottom:4 }}>{skillsData.role} · {MARKETS.find(m=>m.id===market)?.flag} {skillsData.market}</div>
                      <p style={{ fontSize:13.5, color:"#8892b0" }}>{skillsData.market_note}</p>
                      {skillsData.rising_skill && (
                        <div style={{ marginTop:10, display:"inline-flex", alignItems:"center", gap:7, padding:"5px 14px", background:"rgba(124,111,250,0.1)", border:"1px solid rgba(124,111,250,0.25)", borderRadius:20 }}>
                          <span style={{ fontSize:13 }}>🚀</span>
                          <span style={{ fontSize:13, color:"#a99dfc", fontWeight:600 }}>Rising skill: {skillsData.rising_skill}</span>
                        </div>
                      )}
                    </div>
                    <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                      {skillsData.skills?.map((s,i) => (
                        <div key={i} className="ins-card">
                          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                              <span style={{ fontSize:14.5, fontWeight:600, color:"#dde1f0" }}>{s.skill}</span>
                              <span style={{ fontSize:11, padding:"2px 8px", background:s.category==="technical"?"rgba(52,213,200,0.08)":s.category==="soft"?"rgba(124,111,250,0.08)":"rgba(245,158,11,0.08)", border:`1px solid ${s.category==="technical"?"rgba(52,213,200,0.2)":s.category==="soft"?"rgba(124,111,250,0.2)":"rgba(245,158,11,0.2)"}`, borderRadius:20, color:s.category==="technical"?"#34d5c8":s.category==="soft"?"#a99dfc":"#f59e0b" }}>{s.category}</span>
                            </div>
                            <span style={{ fontSize:14, fontWeight:700, color:s.heat>=85?"#f05252":s.heat>=70?"#f59e0b":"#34d5c8" }}>{s.heat}%</span>
                          </div>
                          <div className="heat-bar" style={{ marginBottom:8 }}>
                            <div className="heat-fill" style={{ width:`${s.heat}%`, background:s.heat>=85?"linear-gradient(90deg,#f59e0b,#f05252)":s.heat>=70?"linear-gradient(90deg,#34d5c8,#f59e0b)":"linear-gradient(90deg,#7c6ffa,#34d5c8)" }} />
                          </div>
                          <p style={{ fontSize:13, color:"#5a6488", lineHeight:1.6 }}>{s.why}</p>
                        </div>
                      ))}
                    </div>
                    {skillsData.certifications?.length > 0 && (
                      <div className="ins-card">
                        <div style={{ fontSize:11.5, fontWeight:700, color:"#7c6ffa", textTransform:"uppercase", letterSpacing:0.8, marginBottom:10 }}>Recommended Certifications</div>
                        <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                          {skillsData.certifications.map((c,i) => <span key={i} style={{ fontSize:13, padding:"5px 14px", background:"rgba(124,111,250,0.08)", border:"1px solid rgba(124,111,250,0.2)", borderRadius:22, color:"#a99dfc" }}>{c}</span>)}
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
                <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:26, color:"#fff", marginBottom:4 }}>Top Employers</h2>
                <p style={{ fontSize:14, color:"#5a6488", marginBottom:20 }}>Who's hiring for any role, in any market</p>
                <SearchBar placeholder="Search any role — e.g. Product Manager India, Quant Analyst Singapore…" />
                {loadingEmployers && <div style={{ display:"flex", gap:12, padding:"50px 0", justifyContent:"center" }}><Spin/><span style={{ fontSize:15, color:"#5a6488" }}>Finding employers…</span></div>}
                {!employersData && !loadingEmployers && <EmptyState icon="🏢" text="Search any role above" sub="Get top 6 employers with interview formats, difficulty ratings, and specific prep tips" />}
                {employersData && (
                  <motion.div style={{ display:"flex", flexDirection:"column", gap:14 }} initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }}>
                    <div className="ins-card" style={{ background:"rgba(52,213,200,0.05)", borderColor:"rgba(52,213,200,0.2)" }}>
                      <div style={{ fontSize:15, fontWeight:700, color:"#dde1f0", marginBottom:4 }}>{employersData.role} · {MARKETS.find(m=>m.id===market)?.flag} {employersData.market}</div>
                      <p style={{ fontSize:13.5, color:"#8892b0" }}>{employersData.hiring_note}</p>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))", gap:12 }}>
                      {employersData.employers?.map((e,i) => {
                        const diffColor = e.difficulty==="Very Hard"?"#f05252":e.difficulty==="Hard"?"#f59e0b":e.difficulty==="Medium"?"#34d5c8":"#30c97e"
                        return (
                          <div key={i} className="ins-card">
                            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
                              <div style={{ width:40,height:40,borderRadius:10,background:"rgba(124,111,250,0.1)",border:"1px solid rgba(124,111,250,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:800,color:"#a99dfc",flexShrink:0 }}>{e.name.slice(0,2).toUpperCase()}</div>
                              <div>
                                <div style={{ fontSize:15, fontWeight:700, color:"#dde1f0" }}>{e.name}</div>
                                <div style={{ fontSize:12.5, color:"#5a6488" }}>{e.rounds} rounds · <span style={{ color:diffColor }}>{e.difficulty}</span></div>
                              </div>
                            </div>
                            <div style={{ fontSize:13, color:"#34d5c8", marginBottom:8, padding:"4px 12px", background:"rgba(52,213,200,0.07)", border:"1px solid rgba(52,213,200,0.15)", borderRadius:20, display:"inline-block" }}>{e.interview_style}</div>
                            <p style={{ fontSize:13, color:"#8892b0", lineHeight:1.65, marginBottom:10 }}>{e.known_for}</p>
                            <div style={{ padding:"9px 12px", background:"rgba(124,111,250,0.06)", border:"1px solid rgba(124,111,250,0.15)", borderRadius:9 }}>
                              <span style={{ fontSize:12, fontWeight:700, color:"#7c6ffa" }}>💡 </span>
                              <span style={{ fontSize:13, color:"#a99dfc" }}>{e.tip}</span>
                            </div>
                            <Link to="/interview" style={{ textDecoration:"none" }}>
                              <button style={{ width:"100%", marginTop:10, padding:"8px", background:"rgba(124,111,250,0.08)", border:"1px solid rgba(124,111,250,0.18)", borderRadius:9, color:"#a99dfc", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
                                Practice {e.name} style →
                              </button>
                            </Link>
                          </div>
                        )
                      })}
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {/* ══ HIRING CALENDAR ══ */}
            {activeTab === "calendar" && (
              <div>
                <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:26, color:"#fff", marginBottom:4 }}>Hiring Calendar</h2>
                <p style={{ fontSize:14, color:"#5a6488", marginBottom:20 }}>When to apply for any role in any market</p>
                <SearchBar placeholder="Search any role — e.g. Investment Banking Analyst India, Graduate Scheme UK…" />
                {loadingCalendar && <div style={{ display:"flex", gap:12, padding:"50px 0", justifyContent:"center" }}><Spin/><span style={{ fontSize:15, color:"#5a6488" }}>Loading calendar…</span></div>}
                {!calendarData && !loadingCalendar && <EmptyState icon="📅" text="Search any role above" sub="Get application windows, peak months, recruitment phases, and networking tips for any role in any market" />}
                {calendarData && (
                  <motion.div style={{ display:"flex", flexDirection:"column", gap:14 }} initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }}>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12 }}>
                      {[
                        { label:"Application Window", value:calendarData.application_window, color:"#7c6ffa" },
                        { label:"Peak Month",          value:calendarData.peak_month,         color:"#f59e0b" },
                        { label:"Cycle Type",          value:calendarData.cycle_type,         color:"#34d5c8" },
                      ].map(s => (
                        <div key={s.label} className="ins-card" style={{ textAlign:"center" }}>
                          <div style={{ fontSize:22, fontWeight:800, fontFamily:"'Playfair Display',serif", color:s.color, textTransform:"capitalize" }}>{s.value}</div>
                          <div style={{ fontSize:12, color:"#5a6488", marginTop:5, textTransform:"uppercase", letterSpacing:0.8 }}>{s.label}</div>
                        </div>
                      ))}
                    </div>
                    <div className="ins-card">
                      <div style={{ fontSize:11.5, fontWeight:700, color:"#34d5c8", textTransform:"uppercase", letterSpacing:0.8, marginBottom:14 }}>Recruitment Phases</div>
                      {calendarData.timeline?.map((phase,i) => (
                        <div key={i} style={{ display:"flex", gap:14, marginBottom:14, paddingBottom:14, borderBottom:i<calendarData.timeline.length-1?"1px solid rgba(255,255,255,0.05)":"none" }}>
                          <div style={{ width:28,height:28,borderRadius:"50%",background:"rgba(124,111,250,0.12)",border:"1px solid rgba(124,111,250,0.25)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"#a99dfc",flexShrink:0 }}>{i+1}</div>
                          <div>
                            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:4 }}>
                              <span style={{ fontSize:14.5, fontWeight:700, color:"#dde1f0" }}>{phase.phase}</span>
                              <span style={{ fontSize:12, color:"#7c6ffa", padding:"2px 9px", background:"rgba(124,111,250,0.1)", border:"1px solid rgba(124,111,250,0.2)", borderRadius:20 }}>{phase.timing}</span>
                            </div>
                            <p style={{ fontSize:13.5, color:"#8892b0", lineHeight:1.65 }}>{phase.action}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                      <div className="ins-card">
                        <div style={{ fontSize:11.5, fontWeight:700, color:"#f59e0b", textTransform:"uppercase", letterSpacing:0.8, marginBottom:8 }}>Market Quirks</div>
                        <p style={{ fontSize:14, color:"#c0c8e0", lineHeight:1.75 }}>{calendarData.market_quirks}</p>
                      </div>
                      <div className="ins-card">
                        <div style={{ fontSize:11.5, fontWeight:700, color:"#30c97e", textTransform:"uppercase", letterSpacing:0.8, marginBottom:8 }}>Networking Tip</div>
                        <p style={{ fontSize:14, color:"#b8f5d8", lineHeight:1.75 }}>{calendarData.networking_tip}</p>
                        <div style={{ marginTop:12, fontSize:13, color:"#4a5070" }}>
                          Start prep <span style={{ color:"#dde1f0", fontWeight:600 }}>{calendarData.prep_start}</span> before your deadline.
                        </div>
                        <Link to="/scheduler" style={{ textDecoration:"none" }}>
                          <button style={{ marginTop:10, display:"flex", alignItems:"center", gap:7, padding:"8px 16px", background:"rgba(48,201,126,0.08)", border:"1px solid rgba(48,201,126,0.2)", borderRadius:9, color:"#30c97e", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
                            Build prep plan <ArrowRight size={13}/>
                          </button>
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {/* ══ NEWS ══ */}
            {activeTab === "news" && (
              <div>
                <div style={{ marginBottom:20 }}>
                  <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:26, color:"#fff", marginBottom:4 }}>Industry News</h2>
                  <p style={{ fontSize:14, color:"#5a6488", marginBottom:16 }}>Latest headlines relevant to your job search</p>
                  <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                    {["All","Finance","Technology","Consulting","India","UK","UAE","Singapore"].map(f => (
                      <button key={f} className="mkt-btn"
                        style={{ background:newsFilter===f?"rgba(124,111,250,0.14)":"rgba(255,255,255,0.03)", borderColor:newsFilter===f?"#7c6ffa":"rgba(255,255,255,0.09)", color:newsFilter===f?"#a99dfc":"#5a6488", padding:"6px 14px" }}
                        onClick={() => setNewsFilter(f)}>{f}</button>
                    ))}
                  </div>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                  {filteredNews.map((n,i) => (
                    <motion.a key={i} href={n.url} target="_blank" rel="noreferrer" style={{ textDecoration:"none" }}
                      initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.04 }}>
                      <div className="ins-card" style={{ cursor:"pointer" }}
                        onMouseEnter={e=>e.currentTarget.style.borderColor="rgba(124,111,250,0.3)"}
                        onMouseLeave={e=>e.currentTarget.style.borderColor="#1e2235"}>
                        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:12 }}>
                          <div style={{ flex:1 }}>
                            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:7, flexWrap:"wrap" }}>
                              <span style={{ fontSize:11, fontWeight:700, padding:"2px 9px", background:"rgba(124,111,250,0.1)", border:"1px solid rgba(124,111,250,0.2)", borderRadius:20, color:"#a99dfc" }}>{n.tag}</span>
                              <span style={{ fontSize:12, color:"#4a5070" }}>{n.source} · {n.time}</span>
                            </div>
                            <p style={{ fontSize:15, color:"#dde1f0", fontWeight:500, lineHeight:1.55 }}>{n.title}</p>
                          </div>
                          <ArrowRight size={14} color="#4a5070" style={{ flexShrink:0, marginTop:4 }}/>
                        </div>
                      </div>
                    </motion.a>
                  ))}
                </div>
              </div>
            )}

            {/* ══ ROLE EXPLAINER ══ */}
            {activeTab === "role" && (
              <div>
                <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:26, color:"#fff", marginBottom:4 }}>Role Explainer</h2>
                <p style={{ fontSize:14, color:"#5a6488", marginBottom:20 }}>What does this job actually involve? Full breakdown of any role.</p>
                <div style={{ display:"flex", gap:10, marginBottom:20 }}>
                  <div style={{ flex:1, position:"relative" }}>
                    <Search size={16} color="#4a5070" style={{ position:"absolute", left:13, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}/>
                    <input className="ins-inp" placeholder="e.g. Investment Banking Analyst, Chartered Accountant, DevOps Engineer…"
                      value={roleQuery} onChange={e => setRoleQuery(e.target.value)} onKeyDown={e => e.key==="Enter" && fetchRole()} />
                  </div>
                  <button className="ins-btn" onClick={fetchRole} disabled={loadingRole}>
                    {loadingRole ? <><Spin/>Loading…</> : <><Zap size={15}/>Explain</>}
                  </button>
                </div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:20 }}>
                  {SUGGESTED_ROLES.slice(0,10).map(r => <button key={r} className="suggestion-chip" onClick={() => { setRoleQuery(r); setTimeout(fetchRole, 50) }}>{r}</button>)}
                </div>
                {loadingRole && <div style={{ display:"flex", gap:12, padding:"50px 0", justifyContent:"center" }}><Spin/><span style={{ fontSize:15, color:"#5a6488" }}>Generating breakdown…</span></div>}
                {!roleData && !loadingRole && <EmptyState icon="🤖" text="Search any role above" sub="Get a full breakdown — day in the life, skills, salary, how to break in, and exit opportunities" />}
                {roleData && (
                  <motion.div style={{ display:"flex", flexDirection:"column", gap:14 }} initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }}>
                    <div className="ins-card" style={{ background:"rgba(124,111,250,0.06)", borderColor:"rgba(124,111,250,0.22)" }}>
                      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:10, marginBottom:10 }}>
                        <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:22, color:"#fff" }}>{roleData.role}</h3>
                        <span style={{ fontSize:12, padding:"4px 12px", background:"rgba(124,111,250,0.12)", border:"1px solid rgba(124,111,250,0.25)", borderRadius:20, color:"#a99dfc", fontWeight:600 }}>{roleData.difficulty_to_get}</span>
                      </div>
                      <p style={{ fontSize:15, color:"#c0c8e0", lineHeight:1.75, marginBottom:14 }}>{roleData.summary}</p>
                      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10 }}>
                        {[["Entry",roleData.salary_range?.entry,"#30c97e"],["Mid",roleData.salary_range?.mid,"#34d5c8"],["Senior",roleData.salary_range?.senior,"#f59e0b"]].map(([l,v,c]) => (
                          <div key={l} style={{ textAlign:"center", padding:"10px", background:"rgba(0,0,0,0.2)", borderRadius:10 }}>
                            <div style={{ fontSize:11, color:"#5a6488", marginBottom:4, textTransform:"uppercase", letterSpacing:0.8 }}>{l}</div>
                            <div style={{ fontSize:15, fontWeight:700, color:c }}>{v}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                      <div className="ins-card">
                        <div style={{ fontSize:11.5, fontWeight:700, color:"#34d5c8", textTransform:"uppercase", letterSpacing:0.8, marginBottom:10 }}>Day in the Life</div>
                        {roleData.day_in_life?.map((t,i) => (
                          <div key={i} style={{ display:"flex", gap:10, marginBottom:8 }}>
                            <div style={{ width:20,height:20,borderRadius:"50%",background:"rgba(52,213,200,0.1)",border:"1px solid rgba(52,213,200,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:"#34d5c8",flexShrink:0 }}>{i+1}</div>
                            <span style={{ fontSize:13.5, color:"#c0c8e0", lineHeight:1.6 }}>{t}</span>
                          </div>
                        ))}
                      </div>
                      <div className="ins-card">
                        <div style={{ fontSize:11.5, fontWeight:700, color:"#7c6ffa", textTransform:"uppercase", letterSpacing:0.8, marginBottom:10 }}>Core Skills</div>
                        {roleData.core_skills?.map((s,i) => (
                          <div key={i} style={{ display:"flex", gap:10, marginBottom:8 }}>
                            <Star size={13} color="#7c6ffa" style={{ flexShrink:0, marginTop:2 }}/>
                            <span style={{ fontSize:13.5, color:"#c0c8e0", lineHeight:1.6 }}>{s}</span>
                          </div>
                        ))}
                      </div>
                      <div className="ins-card">
                        <div style={{ fontSize:11.5, fontWeight:700, color:"#30c97e", textTransform:"uppercase", letterSpacing:0.8, marginBottom:8 }}>How to Break In</div>
                        <p style={{ fontSize:13.5, color:"#c0c8e0", lineHeight:1.75, marginBottom:8 }}>{roleData.how_to_break_in}</p>
                        <div style={{ fontSize:12.5, color:"#5a6488" }}>Interview format: <span style={{ color:"#8892b0" }}>{roleData.interview_format}</span></div>
                      </div>
                      <div className="ins-card">
                        <div style={{ fontSize:11.5, fontWeight:700, color:"#f59e0b", textTransform:"uppercase", letterSpacing:0.8, marginBottom:10 }}>Exit Opportunities</div>
                        {roleData.exit_opportunities?.map((e,i) => (
                          <div key={i} style={{ display:"flex", gap:10, marginBottom:8 }}>
                            <ArrowRight size={13} color="#f59e0b" style={{ flexShrink:0, marginTop:2 }}/>
                            <span style={{ fontSize:13.5, color:"#c0c8e0", lineHeight:1.6 }}>{e}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {/* ══ COLD EMAIL ══ */}
            {activeTab === "email" && (
              <div>
                <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:26, color:"#fff", marginBottom:4 }}>Cold Outreach Generator</h2>
                <p style={{ fontSize:14, color:"#5a6488", marginBottom:20 }}>AI writes a personalised cold email or LinkedIn DM.</p>
                <div style={{ display:"flex", gap:8, marginBottom:18 }}>
                  {[["cold_email","📧 Cold Email"],["linkedin_dm","💼 LinkedIn DM"]].map(([v,l]) => (
                    <button key={v} className="mkt-btn"
                      style={{ background:emailType===v?"rgba(124,111,250,0.14)":"rgba(255,255,255,0.03)", borderColor:emailType===v?"#7c6ffa":"rgba(255,255,255,0.09)", color:emailType===v?"#a99dfc":"#5a6488", padding:"8px 16px" }}
                      onClick={() => setEmailType(v)}>{l}</button>
                  ))}
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14 }}>
                  <div>
                    <label style={{ fontSize:11.5, fontWeight:700, textTransform:"uppercase", letterSpacing:0.9, color:"#6b7280", display:"block", marginBottom:7 }}>Target Role *</label>
                    <input className="ins-inp ins-inp-plain" placeholder="e.g. Investment Banking Analyst" value={emailRole} onChange={e => setEmailRole(e.target.value)} />
                  </div>
                  <div>
                    <label style={{ fontSize:11.5, fontWeight:700, textTransform:"uppercase", letterSpacing:0.9, color:"#6b7280", display:"block", marginBottom:7 }}>Target Company *</label>
                    <input className="ins-inp ins-inp-plain" placeholder="e.g. Goldman Sachs, Infosys, HSBC" value={emailCompany} onChange={e => setEmailCompany(e.target.value)} />
                  </div>
                </div>
                <div style={{ marginBottom:14 }}>
                  <label style={{ fontSize:11.5, fontWeight:700, textTransform:"uppercase", letterSpacing:0.9, color:"#6b7280", display:"block", marginBottom:7 }}>Recipient Title <span style={{ color:"#3a3f5c", fontWeight:400, textTransform:"none" }}>(optional)</span></label>
                  <input className="ins-inp ins-inp-plain" placeholder="e.g. VP of Investment Banking, Campus Recruiter" value={emailTitle} onChange={e => setEmailTitle(e.target.value)} />
                </div>
                <div style={{ marginBottom:18 }}>
                  <label style={{ fontSize:11.5, fontWeight:700, textTransform:"uppercase", letterSpacing:0.9, color:"#6b7280", display:"block", marginBottom:7 }}>Your Background *</label>
                  <textarea className="ins-inp ins-inp-plain ins-ta" rows={3} placeholder="e.g. Final-year Finance student at Delhi University, 2 internships in equity research, interest in IB…"
                    value={emailBg} onChange={e => setEmailBg(e.target.value)} />
                </div>
                <button className="ins-btn" onClick={generateEmail} disabled={loadingEmail}>
                  {loadingEmail ? <><Spin/>Writing…</> : <><Mail size={16}/>Generate Message</>}
                </button>
                {emailResult && (
                  <motion.div style={{ marginTop:20, background:"#0c0e1a", border:"1px solid rgba(124,111,250,0.25)", borderRadius:16, overflow:"hidden" }} initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"13px 20px", background:"rgba(124,111,250,0.07)", borderBottom:"1px solid rgba(124,111,250,0.14)" }}>
                      <span style={{ fontSize:13, fontWeight:700, color:"#a99dfc" }}>{emailResult.type==="linkedin_dm"?"💼 LinkedIn DM":"📧 Cold Email"}</span>
                      <button onClick={() => copyText(emailResult.message)}
                        style={{ display:"flex", alignItems:"center", gap:7, padding:"6px 14px", background:copied?"rgba(48,201,126,0.1)":"rgba(255,255,255,0.04)", border:`1px solid ${copied?"rgba(48,201,126,0.3)":"rgba(255,255,255,0.1)"}`, borderRadius:8, color:copied?"#30c97e":"#9aa0b8", fontSize:13, cursor:"pointer", fontFamily:"'DM Sans',sans-serif" }}>
                        {copied ? <><Check size={13}/>Copied!</> : <><Copy size={13}/>Copy</>}
                      </button>
                    </div>
                    {emailResult.subject && <div style={{ padding:"11px 20px", borderBottom:"1px solid #1e2235" }}><span style={{ fontSize:12, fontWeight:700, color:"#5a6488", textTransform:"uppercase", letterSpacing:0.8 }}>Subject: </span><span style={{ fontSize:14.5, color:"#dde1f0" }}>{emailResult.subject}</span></div>}
                    <div style={{ padding:"18px 20px" }}>
                      <pre style={{ fontSize:14.5, color:"#c0c8e0", lineHeight:1.8, whiteSpace:"pre-wrap", fontFamily:"'DM Sans',sans-serif", margin:0 }}>{emailResult.message}</pre>
                    </div>
                    <div style={{ padding:"12px 20px", borderTop:"1px solid #1e2235" }}>
                      <button className="ins-btn" style={{ maxWidth:180, padding:"9px 18px", fontSize:14 }} onClick={generateEmail}><RefreshCw size={13}/>Regenerate</button>
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {/* ══ MY SCORES ══ */}
            {activeTab === "compare" && (
              <div>
                <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:26, color:"#fff", marginBottom:4 }}>Your Scores vs Platform</h2>
                <p style={{ fontSize:14, color:"#5a6488", marginBottom:20 }}>How do your SensAI scores compare to everyone else?</p>
                {userSessions.length > 0 ? (
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:24 }}>
                    {[
                      { label:"Recent avg", value:`${userAvg}/10`, color:scoreColor(+userAvg) },
                      { label:"Sessions done", value:userSessions.length, color:"#7c6ffa" },
                      { label:"Best score", value:`${Math.max(...userSessions.slice(0,10).map(s=>s.overall_score||0))}/10`, color:"#30c97e" },
                    ].map((s,i) => (
                      <div key={i} className="ins-card" style={{ textAlign:"center" }}>
                        <div style={{ fontSize:32, fontWeight:800, fontFamily:"'Playfair Display',serif", color:s.color, marginBottom:6 }}>{s.value}</div>
                        <div style={{ fontSize:13, color:"#5a6488" }}>{s.label}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="ins-card" style={{ textAlign:"center", padding:"32px", marginBottom:22 }}>
                    <p style={{ fontSize:15, color:"#5a6488", marginBottom:14 }}>Complete a mock interview first to see your scores here.</p>
                    <Link to="/interview"><button className="ins-btn" style={{ margin:"0 auto", maxWidth:220 }}>Start a session →</button></Link>
                  </div>
                )}
                <div style={{ marginBottom:14 }}>
                  <label style={{ fontSize:11.5, fontWeight:700, textTransform:"uppercase", letterSpacing:0.9, color:"#6b7280", display:"block", marginBottom:8 }}>Compare for role</label>
                  <div style={{ display:"flex", gap:10 }}>
                    <input className="ins-inp ins-inp-plain" style={{ flex:1 }} placeholder="e.g. Investment Banking Analyst, Software Engineer…"
                      value={compRole} onChange={e => setCompRole(e.target.value)} onKeyDown={e => e.key==="Enter" && fetchComparison()} />
                    <button className="ins-btn" onClick={fetchComparison} disabled={loadingComp}>
                      {loadingComp ? <Spin/> : <><BarChart2 size={15}/>Compare</>}
                    </button>
                  </div>
                </div>
                {compData && compData.comparisons?.length > 0 && compData.comparisons.map((c,i) => (
                  <motion.div key={i} className="ins-card" style={{ marginBottom:10 }} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}>
                    <div style={{ fontSize:15.5, fontWeight:700, color:"#dde1f0", marginBottom:12 }}>{c._id}</div>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:12 }}>
                      {[["Platform avg",`${c.avg_score?.toFixed(1)}/10`,scoreColor(c.avg_score)],["Platform readiness",`${Math.round(c.avg_readiness)}%`,"#7c6ffa"],["Total sessions",c.count,"#34d5c8"]].map(([l,v,col]) => (
                        <div key={l} style={{ textAlign:"center", padding:"12px", background:"rgba(0,0,0,0.2)", borderRadius:10 }}>
                          <div style={{ fontSize:22, fontWeight:800, fontFamily:"'Playfair Display',serif", color:col }}>{v}</div>
                          <div style={{ fontSize:12, color:"#4a5070", marginTop:3 }}>{l}</div>
                        </div>
                      ))}
                    </div>
                    {userAvg && (
                      <div style={{ padding:"11px 16px", background:+userAvg>=c.avg_score?"rgba(48,201,126,0.07)":"rgba(245,158,11,0.07)", border:`1px solid ${+userAvg>=c.avg_score?"rgba(48,201,126,0.2)":"rgba(245,158,11,0.2)"}`, borderRadius:10, fontSize:14, color:+userAvg>=c.avg_score?"#30c97e":"#f59e0b" }}>
                        {+userAvg>=c.avg_score ? `✓ You're ${(+userAvg-c.avg_score).toFixed(1)} above the platform average.` : `You're ${(c.avg_score-+userAvg).toFixed(1)} below platform average — keep practising!`}
                      </div>
                    )}
                  </motion.div>
                ))}
                {compData && compData.comparisons?.length === 0 && (
                  <div className="ins-card" style={{ textAlign:"center", padding:"24px" }}>
                    <p style={{ fontSize:14, color:"#5a6488" }}>No platform data yet for this role. Be the first!</p>
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