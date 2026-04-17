import { Link, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { FileText, Sparkles, Brain, BarChart2, LogOut, ArrowRight, Clock, Calendar } from "lucide-react"
import "./Dashboard.css"

const CARDS = [
  {
    to: "/resume",
    icon: FileText,
    color: "#7c6ffa",
    glow: "rgba(124,111,250,0.18)",
    border: "rgba(124,111,250,0.22)",
    title: "Resume Builder",
    desc: "10 templates · AI enhance · PDF export",
    tag: "Active", tagColor: "#7c6ffa",
    disabled: false,
  },
  {
    to: "/cover-letter",
    icon: Sparkles,
    color: "#34d5c8",
    glow: "rgba(52,213,200,0.15)",
    border: "rgba(52,213,200,0.2)",
    title: "Cover Letter",
    desc: "AI-tailored letters from your job description",
    tag: "Active", tagColor: "#34d5c8",
    disabled: false,
  },
  {
    to: "/interview",
    icon: Brain,
    color: "#f59e0b",
    glow: "rgba(245,158,11,0.15)",
    border: "rgba(245,158,11,0.18)",
    title: "Interview Prep",
    desc: "Mock interviews · Voice & video · AI scoring",
    tag: "Active", tagColor: "#f59e0b",
    disabled: false,
  },
  {
    to: "/scheduler",
    icon: Calendar,
    color: "#30c97e",
    glow: "rgba(48,201,126,0.15)",
    border: "rgba(48,201,126,0.18)",
    title: "Interview Scheduler",
    desc: "Set your date · Day-by-day prep plan · Offline",
    tag: "Active", tagColor: "#30c97e",
    disabled: false,
  },
  {
    to: "/insights",
    icon: BarChart2,
    color: "#a78bfa",
    glow: "rgba(167,139,250,0.15)",
    border: "rgba(167,139,250,0.18)",
    title: "Industry Insights",
    desc: "Salary trends, hot skills, hiring signals",
    tag: "Active", tagColor: "#a78bfa",
    disabled: false,
  },
]

const STATS = [
  { label: "Templates",     value: "10"   },
  { label: "AI Tools",      value: "4"    },
  { label: "Export Format", value: "PDF"  },
  { label: "Cost",          value: "Free" },
]

const fadeUp = (i = 0) => ({
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.45, ease: "easeOut" } },
})

export default function Dashboard() {
  const navigate  = useNavigate()
  const userName  = localStorage.getItem("userName") || "there"
  const hour      = new Date().getHours()
  const greeting  = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening"

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("userName")
    localStorage.removeItem("userEmail")
    navigate("/")
  }

  return (
    <div className="dash-page">
      <div className="dash-glow-1" aria-hidden />
      <div className="dash-glow-2" aria-hidden />

      {/* Topbar */}
      <motion.header className="dash-topbar" initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="dash-nav-logo">
          <div className="dash-logo-mark">S</div>
          <span className="dash-logo-text">SensAI</span>
        </div>
        <div className="dash-topbar-right">
          <div className="dash-user-badge">
            <div className="dash-user-avatar">{userName.charAt(0).toUpperCase()}</div>
            <span className="dash-user-name">{userName}</span>
          </div>
          <button className="dash-logout-btn" onClick={handleLogout} title="Log out">
            <LogOut size={16} />
          </button>
        </div>
      </motion.header>

      <div className="dash-content">

        {/* Hero greeting */}
        <motion.div className="dash-hero-row" initial="hidden" animate="show" variants={fadeUp(0)}>
          <div>
            <p className="dash-greeting-sub"><Clock size={13} style={{ marginRight: 5 }} />{greeting}, {userName} 👋</p>
            <h1 className="dash-greeting-h1">Your career dashboard</h1>
            <p className="dash-greeting-desc">Pick a tool below — or jump straight into your next session.</p>
          </div>
          <Link to="/interview">
            <motion.button
              className="dash-cta-btn"
              whileHover={{ scale: 1.04, boxShadow: "0 0 36px rgba(124,111,250,0.4)" }}
              whileTap={{ scale: 0.97 }}
            >
              Start Interview Prep <ArrowRight size={16} style={{ marginLeft: 6 }} />
            </motion.button>
          </Link>
        </motion.div>

        {/* Stats strip */}
        <motion.div className="dash-stats-row" initial="hidden" animate="show" variants={fadeUp(1)}>
          {STATS.map((s, i) => (
            <div key={i} className="dash-stat-card">
              <div className="dash-stat-value">{s.value}</div>
              <div className="dash-stat-label">{s.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Tool cards */}
        <motion.h2 className="dash-section-label" initial="hidden" animate="show" variants={fadeUp(2)}>Tools</motion.h2>

        <div className="dash-card-grid">
          {CARDS.map((card, i) => {
            const inner = (
              <motion.div
                key={i}
                className="dash-card"
                style={{ border: `1px solid ${card.border}`, opacity: card.disabled ? 0.5 : 1, cursor: card.disabled ? "not-allowed" : "pointer" }}
                initial="hidden"
                animate="show"
                variants={fadeUp(i * 0.5 + 2)}
                whileHover={!card.disabled ? { y: -6, boxShadow: `0 20px 60px ${card.glow}` } : {}}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div className="dash-card-icon" style={{ background: card.glow }}>
                    <card.icon size={24} color={card.color} />
                  </div>
                  <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, padding: "3px 10px", borderRadius: 20, background: card.glow, color: card.color }}>
                    {card.tag}
                  </span>
                </div>
                <h3 className="dash-card-title">{card.title}</h3>
                <p className="dash-card-desc">{card.desc}</p>
                {!card.disabled && (
                  <div style={{ display: "flex", alignItems: "center", fontSize: 13, fontWeight: 600, color: card.color }}>
                    Open <ArrowRight size={14} style={{ marginLeft: 4 }} />
                  </div>
                )}
              </motion.div>
            )
            return card.disabled
              ? <div key={i}>{inner}</div>
              : <Link to={card.to} key={i} style={{ textDecoration: "none" }}>{inner}</Link>
          })}
        </div>

      </div>
    </div>
  )
}
