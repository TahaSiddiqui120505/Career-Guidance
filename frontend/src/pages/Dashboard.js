import { Link, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { FileText, Sparkles, Brain, BarChart2, LogOut, ArrowRight, Clock, Calendar } from "lucide-react"

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
  show:   { opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.45, ease: "easeOut" } }
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
    <div style={S.page}>
      <div style={S.glow1} aria-hidden />
      <div style={S.glow2} aria-hidden />

      {/* Topbar */}
      <motion.header style={S.topbar} initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
        <div style={S.navLogo}>
          <div style={S.logoMark}>S</div>
          <span style={S.logoText}>SensAI</span>
        </div>
        <div style={S.topbarRight}>
          <div style={S.userBadge}>
            <div style={S.userAvatar}>{userName.charAt(0).toUpperCase()}</div>
            <span style={S.userName}>{userName}</span>
          </div>
          <button style={S.logoutBtn} onClick={handleLogout} title="Log out">
            <LogOut size={16} />
          </button>
        </div>
      </motion.header>

      <div style={S.content}>

        {/* Hero greeting */}
        <motion.div style={S.heroRow} initial="hidden" animate="show" variants={fadeUp(0)}>
          <div>
            <p style={S.greetingSub}><Clock size={13} style={{ marginRight: 5 }} />{greeting}, {userName} 👋</p>
            <h1 style={S.greetingH1}>Your career dashboard</h1>
            <p style={S.greetingDesc}>Pick a tool below — or jump straight into your next session.</p>
          </div>
          <Link to="/interview">
            <motion.button style={S.ctaBtn} whileHover={{ scale: 1.04, boxShadow: "0 0 36px rgba(124,111,250,0.4)" }} whileTap={{ scale: 0.97 }}>
              Start Interview Prep <ArrowRight size={16} style={{ marginLeft: 6 }} />
            </motion.button>
          </Link>
        </motion.div>

        {/* Stats strip */}
        <motion.div style={S.statsRow} initial="hidden" animate="show" variants={fadeUp(1)}>
          {STATS.map((s, i) => (
            <div key={i} style={S.statCard}>
              <div style={S.statValue}>{s.value}</div>
              <div style={S.statLabel}>{s.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Tool cards */}
        <motion.h2 style={S.sectionLabel} initial="hidden" animate="show" variants={fadeUp(2)}>Tools</motion.h2>

        <div style={S.cardGrid}>
          {CARDS.map((card, i) => {
            const inner = (
              <motion.div key={i}
                style={{ ...S.card, border: `1px solid ${card.border}`, opacity: card.disabled ? 0.5 : 1, cursor: card.disabled ? "not-allowed" : "pointer" }}
                initial="hidden" animate="show" variants={fadeUp(i * 0.5 + 2)}
                whileHover={!card.disabled ? { y: -6, boxShadow: `0 20px 60px ${card.glow}` } : {}}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ ...S.cardIcon, background: card.glow }}>
                    <card.icon size={24} color={card.color} />
                  </div>
                  <span style={{ fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, padding: "3px 10px", borderRadius: 20, background: card.glow, color: card.color }}>
                    {card.tag}
                  </span>
                </div>
                <h3 style={S.cardTitle}>{card.title}</h3>
                <p style={S.cardDesc}>{card.desc}</p>
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

const S = {
  page:        { minHeight: "100vh", background: "#080a12", color: "#dde1f0", fontFamily: "'DM Sans',sans-serif", position: "relative", overflow: "hidden" },
  glow1:       { position: "fixed", top: -200, left: -200, width: 600, height: 600, borderRadius: "50%", background: "#7c6ffa", opacity: 0.06, filter: "blur(120px)", pointerEvents: "none" },
  glow2:       { position: "fixed", bottom: -150, right: -150, width: 500, height: 500, borderRadius: "50%", background: "#34d5c8", opacity: 0.06, filter: "blur(100px)", pointerEvents: "none" },
  topbar:      { position: "relative", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 36px", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(8,10,18,0.8)", backdropFilter: "blur(12px)" },
  navLogo:     { display: "flex", alignItems: "center", gap: 10 },
  logoMark:    { width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg,#7c6ffa,#34d5c8)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 15, color: "#fff" },
  logoText:    { fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, color: "#fff" },
  topbarRight: { display: "flex", alignItems: "center", gap: 12 },
  userBadge:   { display: "flex", alignItems: "center", gap: 8, padding: "6px 14px", background: "rgba(255,255,255,0.05)", borderRadius: 20, border: "1px solid rgba(255,255,255,0.08)" },
  userAvatar:  { width: 26, height: 26, borderRadius: "50%", background: "linear-gradient(135deg,#7c6ffa,#34d5c8)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff" },
  userName:    { fontSize: 13, color: "#aab0cc" },
  logoutBtn:   { width: 34, height: 34, borderRadius: 8, background: "rgba(240,82,82,0.08)", border: "1px solid rgba(240,82,82,0.2)", color: "#f05252", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" },
  content:     { position: "relative", zIndex: 2, padding: "40px 36px", maxWidth: 1100, margin: "0 auto" },
  heroRow:     { display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 20, marginBottom: 32 },
  greetingSub: { display: "flex", alignItems: "center", fontSize: 13, color: "#5a6488", marginBottom: 8 },
  greetingH1:  { fontFamily: "'Playfair Display',serif", fontSize: "clamp(26px,4vw,38px)", fontWeight: 700, color: "#fff", letterSpacing: -0.5, lineHeight: 1.2 },
  greetingDesc:{ fontSize: 14, color: "#5a6488", marginTop: 8, maxWidth: 420 },
  ctaBtn:      { display: "flex", alignItems: "center", padding: "12px 24px", background: "linear-gradient(135deg,#7c6ffa,#34d5c8)", border: "none", borderRadius: 10, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans',sans-serif", boxShadow: "0 6px 24px rgba(124,111,250,0.25)", whiteSpace: "nowrap" },
  statsRow:    { display: "flex", gap: 12, marginBottom: 40, flexWrap: "wrap" },
  statCard:    { flex: "1 1 100px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "16px 20px", textAlign: "center" },
  statValue:   { fontFamily: "'Playfair Display',serif", fontSize: 24, fontWeight: 700, color: "#fff" },
  statLabel:   { fontSize: 11.5, color: "#4a5070", marginTop: 4, textTransform: "uppercase", letterSpacing: 0.6 },
  sectionLabel:{ fontSize: 11.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, color: "#4a5070", marginBottom: 16 },
  cardGrid:    { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 16 },
  card:        { background: "#0c0e1a", borderRadius: 16, padding: "24px", transition: "all .25s" },
  cardIcon:    { width: 48, height: 48, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  cardTitle:   { fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, color: "#e8eaf5", marginBottom: 8 },
  cardDesc:    { fontSize: 13, color: "#4a5070", lineHeight: 1.6, marginBottom: 16 },
}