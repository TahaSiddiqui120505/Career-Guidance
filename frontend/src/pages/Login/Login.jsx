import { useState, useEffect } from "react"
import axios from "axios"
import { useNavigate, Link } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import "./Login.css"

const FEATURES = [
  { icon: "🧠", title: "AI Mock Interviews",   sub: "Practice with adaptive questions tailored to your role" },
  { icon: "📄", title: "Cover Letter Studio",  sub: "Generate and customise letters in seconds" },
  { icon: "🎤", title: "Voice & Video Mode",   sub: "Practise speaking and track filler words live" },
  { icon: "📈", title: "Progress Tracking",    sub: "See your score trends improve session by session" },
]

export default function Login() {
  const navigate  = useNavigate()
  const [email,    setEmail]    = useState("")
  const [password, setPassword] = useState("")
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState("")
  const [showPw,   setShowPw]   = useState(false)
  const [featIdx,  setFeatIdx]  = useState(0)

  useEffect(() => {
    // CSS loaded via import
    const t = setInterval(() => setFeatIdx(i => (i + 1) % FEATURES.length), 3200)
    return () => clearInterval(t)
  }, [])

  const login = async () => {
    if (!email.trim() || !password) { setError("Please fill in both fields."); return }
    setLoading(true); setError("")
    try {
      const res = await axios.post(`${(process.env.REACT_APP_API_URL || "http://127.0.0.1:8000").replace(/\/+$/, "")}/auth/login`, { email, password })
      localStorage.setItem("token",     res.data.token)
      localStorage.setItem("userName",  res.data.user?.name || email.split("@")[0])
      localStorage.setItem("userEmail", email)
      navigate("/dashboard")
    } catch (err) {
      setError(err.response?.data?.detail || "Incorrect email or password. Try again.")
    } finally {
      setLoading(false)
    }
  }

  const onKey = e => { if (e.key === "Enter") login() }

  return (
    <div className="auth-page">
      <div className="auth-orb" style={{ width:520, height:520, top:-120, left:-140, background:"rgba(124,111,250,0.12)", animation:"auth-orb1 9s ease-in-out infinite" }} />
      <div className="auth-orb" style={{ width:380, height:380, bottom:-80, left:"30%", background:"rgba(52,213,200,0.08)", animation:"auth-orb2 12s ease-in-out infinite" }} />
      <div className="auth-orb" style={{ width:280, height:280, top:"30%", right:-60, background:"rgba(124,111,250,0.07)", animation:"auth-orb3 10s ease-in-out infinite" }} />

      <div className="auth-left">
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:64 }}>
          <div style={{ width:42, height:42, borderRadius:12, background:"linear-gradient(135deg,#7c6ffa,#34d5c8)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:20, color:"#fff", fontFamily:"'Playfair Display',serif" }}>S</div>
          <span style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:700, color:"#fff" }}>SensAI</span>
        </div>

        <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(36px,3.5vw,52px)", color:"#fff", lineHeight:1.2, marginBottom:18 }}>
          Your AI-powered<br />
          <span style={{ background:"linear-gradient(135deg,#7c6ffa,#34d5c8)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>career coach</span>
        </h1>
        <p style={{ fontSize:17, color:"#5a6488", lineHeight:1.75, marginBottom:48, maxWidth:440 }}>
          Prepare smarter, interview better, and land the role you want — with AI that adapts to you.
        </p>

        <div style={{ position:"relative" }}>
          {FEATURES.map((f, i) => (
            <motion.div
              key={f.title}
              className="feat-card"
              initial={{ opacity:0, x:-20 }}
              animate={{ opacity: i === featIdx ? 1 : i === (featIdx+1)%FEATURES.length ? 0.45 : 0.2, x:0, scale: i === featIdx ? 1 : 0.97 }}
              transition={{ duration:0.5 }}>
              <div style={{ fontSize:26, flexShrink:0, marginTop:2 }}>{f.icon}</div>
              <div>
                <div style={{ fontSize:15.5, fontWeight:700, color: i === featIdx ? "#dde1f0" : "#6b7280", marginBottom:4 }}>{f.title}</div>
                <div style={{ fontSize:13.5, color: i === featIdx ? "#5a6488" : "#3a3f5c", lineHeight:1.6 }}>{f.sub}</div>
              </div>
              {i === featIdx && (
                <div style={{ marginLeft:"auto", width:8, height:8, borderRadius:"50%", background:"#7c6ffa", flexShrink:0, marginTop:6 }} />
              )}
            </motion.div>
          ))}
        </div>

        <div style={{ display:"flex", gap:8, marginTop:20 }}>
          {FEATURES.map((_,i) => (
            <div key={i} onClick={() => setFeatIdx(i)} style={{ width: i===featIdx?22:7, height:7, borderRadius:4, background: i===featIdx?"#7c6ffa":"#2a2d42", transition:"all .3s", cursor:"pointer" }} />
          ))}
        </div>
      </div>

      <div className="auth-right">
        <motion.div className="auth-card" initial={{ opacity:0, y:28 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }}>

          <div style={{ textAlign:"center", marginBottom:32 }}>
            <div style={{ width:52, height:52, borderRadius:14, background:"linear-gradient(135deg,rgba(124,111,250,0.15),rgba(52,213,200,0.08))", border:"1px solid rgba(124,111,250,0.22)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px", fontSize:24 }}>👋</div>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:26, color:"#fff", marginBottom:7 }}>Welcome back</h2>
            <p style={{ fontSize:14.5, color:"#5a6488" }}>Sign in to continue your prep</p>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div className="auth-err" initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}>
                ⚠️ {error}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="auth-inp-wrap">
            <span className="auth-ico">✉️</span>
            <input className="auth-inp" type="email" placeholder="Email address"
              value={email} onChange={e => { setEmail(e.target.value); setError("") }}
              onKeyDown={onKey} autoComplete="email" />
          </div>

          <div className="auth-inp-wrap">
            <span className="auth-ico">🔒</span>
            <input className="auth-inp" type={showPw ? "text" : "password"} placeholder="Password"
              value={password} onChange={e => { setPassword(e.target.value); setError("") }}
              onKeyDown={onKey} autoComplete="current-password"
              style={{ paddingRight:48 }} />
            <button className="pw-toggle" onClick={() => setShowPw(v => !v)} type="button">
              {showPw ? "🙈" : "👁️"}
            </button>
          </div>

          <motion.button className="auth-btn" onClick={login} disabled={loading}
            whileTap={{ scale:0.97 }} style={{ marginTop:8 }}>
            {loading
              ? <><span style={{ width:17, height:17, border:"2.5px solid rgba(255,255,255,0.25)", borderTopColor:"#fff", borderRadius:"50%", animation:"auth-spin .7s linear infinite", display:"inline-block" }} /> Signing in…</>
              : "Sign in →"}
          </motion.button>

          <div className="auth-divider">or</div>

          <div style={{ textAlign:"center" }}>
            <p style={{ fontSize:14.5, color:"#5a6488" }}>
              Don't have an account?{" "}
              <Link to="/register" style={{ color:"#a99dfc", fontWeight:700, textDecoration:"none" }}>
                Create one free →
              </Link>
            </p>
          </div>

          <p style={{ textAlign:"center", fontSize:12, color:"#3a3f5c", marginTop:24, lineHeight:1.7 }}>
            By continuing you agree to SensAI's terms of service.<br/>Your data is never sold.
          </p>
        </motion.div>
      </div>
    </div>
  )
}
