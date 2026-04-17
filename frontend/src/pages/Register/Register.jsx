import { useState, useEffect } from "react"
import axios from "axios"
import { useNavigate, Link } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import "./Register.css"

const STEPS = [
  { icon:"🎯", label:"Tell us who you are" },
  { icon:"📬", label:"Add your email"       },
  { icon:"🔐", label:"Secure your account"  },
]

const PERKS = [
  "AI mock interviews tailored to your role",
  "Voice & video practice with live analysis",
  "Cover letters generated in seconds",
  "Score history & progress charts",
  "Devil's Advocate mode to stress-test answers",
]

function getPasswordStrength(pw) {
  if (!pw) return { score: 0, label: "", color: "#1e2235" }
  let score = 0
  if (pw.length >= 8)           score++
  if (/[A-Z]/.test(pw))         score++
  if (/[0-9]/.test(pw))         score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  const map = [
    { label:"",       color:"#1e2235" },
    { label:"Weak",   color:"#f05252" },
    { label:"Fair",   color:"#f59e0b" },
    { label:"Good",   color:"#34d5c8" },
    { label:"Strong", color:"#30c97e" },
  ]
  return { score, ...map[score] }
}

export default function Register() {
  const navigate   = useNavigate()
  const [name,     setName]     = useState("")
  const [email,    setEmail]    = useState("")
  const [password, setPassword] = useState("")
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState("")
  const [showPw,   setShowPw]   = useState(false)
  const [success,  setSuccess]  = useState(false)

  const pwStrength = getPasswordStrength(password)
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const nameValid  = name.trim().length >= 2

  useEffect(() => {
    // CSS loaded via import
  }, [])

  const register = async () => {
    if (!nameValid)          { setError("Please enter your full name (at least 2 characters)."); return }
    if (!emailValid)         { setError("Please enter a valid email address."); return }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return }
    setLoading(true); setError("")
    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL || "http://127.0.0.1:8000"}/auth/register`, { name, email, password })
      localStorage.setItem("token",     res.data.token)
      localStorage.setItem("userName",  res.data.user?.name || name)
      localStorage.setItem("userEmail", email)
      setSuccess(true)
      setTimeout(() => navigate("/dashboard"), 900)
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed. This email may already be in use.")
    } finally { setLoading(false) }
  }

  const onKey = e => { if (e.key === "Enter") register() }

  return (
    <div className="reg-page">
      <div className="reg-orb" style={{ width:480, height:480, top:-100, right:-80, background:"rgba(52,213,200,0.09)", animation:"reg-orb1 10s ease-in-out infinite" }} />
      <div className="reg-orb" style={{ width:420, height:420, bottom:-100, left:"20%", background:"rgba(124,111,250,0.09)", animation:"reg-orb2 13s ease-in-out infinite" }} />
      <div className="reg-orb" style={{ width:300, height:300, top:"40%", left:-80, background:"rgba(48,201,126,0.06)" }} />

      <div className="reg-left">
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:56 }}>
          <div style={{ width:42, height:42, borderRadius:12, background:"linear-gradient(135deg,#7c6ffa,#34d5c8)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:20, color:"#fff", fontFamily:"'Playfair Display',serif" }}>S</div>
          <span style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:700, color:"#fff" }}>SensAI</span>
        </div>

        <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(32px,3.2vw,48px)", color:"#fff", lineHeight:1.22, marginBottom:16 }}>
          Start your journey<br />
          <span style={{ background:"linear-gradient(135deg,#30c97e,#34d5c8)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>to your dream role</span>
        </h1>
        <p style={{ fontSize:16.5, color:"#5a6488", lineHeight:1.75, marginBottom:40, maxWidth:400 }}>
          Join thousands of candidates who improved their interview performance with AI-powered coaching.
        </p>

        <div style={{ marginBottom:40 }}>
          {STEPS.map((step, i) => (
            <div key={i} style={{ display:"flex", alignItems:"center", gap:14, marginBottom:16 }}>
              <div style={{ width:38, height:38, borderRadius:10, background:"rgba(48,201,126,0.08)", border:"1px solid rgba(48,201,126,0.18)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>{step.icon}</div>
              <div>
                <div style={{ fontSize:11.5, fontWeight:700, color:"#30c97e", textTransform:"uppercase", letterSpacing:0.9, marginBottom:2 }}>Step {i+1}</div>
                <div style={{ fontSize:14.5, color:"#8892b0" }}>{step.label}</div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(255,255,255,0.06)", borderRadius:16, padding:"6px 20px" }}>
          {PERKS.map((p, i) => (
            <div key={i} className="perk-row">
              <span style={{ color:"#30c97e", fontSize:16, flexShrink:0 }}>✓</span>{p}
            </div>
          ))}
        </div>
      </div>

      <div className="reg-right">
        <motion.div className="reg-card" initial={{ opacity:0, y:28 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.5 }}>
          <div style={{ textAlign:"center", marginBottom:30 }}>
            <AnimatePresence mode="wait">
              {success ? (
                <motion.div key="success" initial={{ scale:0 }} animate={{ scale:1 }} style={{ fontSize:48, marginBottom:14 }}>🎉</motion.div>
              ) : (
                <motion.div key="icon" style={{ width:52, height:52, borderRadius:14, background:"linear-gradient(135deg,rgba(48,201,126,0.12),rgba(52,213,200,0.08))", border:"1px solid rgba(48,201,126,0.22)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 16px", fontSize:24 }}>🚀</motion.div>
              )}
            </AnimatePresence>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:26, color:"#fff", marginBottom:7 }}>
              {success ? "You're in!" : "Create your account"}
            </h2>
            <p style={{ fontSize:14.5, color:"#5a6488" }}>
              {success ? "Redirecting to your dashboard…" : "Free forever · No credit card needed"}
            </p>
          </div>

          {!success && (
            <>
              <AnimatePresence>
                {error && (
                  <motion.div className="reg-err" initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}>
                    ⚠️ {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="reg-inp-wrap">
                <span className="reg-ico">👤</span>
                <input className={`reg-inp${nameValid && name ? " valid" : ""}`} type="text" placeholder="Full name"
                  value={name} onChange={e => { setName(e.target.value); setError("") }} onKeyDown={onKey} autoComplete="name" />
                {nameValid && name && <span className="reg-valid-ico" style={{ color:"#30c97e", fontSize:16 }}>✓</span>}
              </div>

              <div className="reg-inp-wrap">
                <span className="reg-ico">✉️</span>
                <input className={`reg-inp${emailValid ? " valid" : ""}`} type="email" placeholder="Email address"
                  value={email} onChange={e => { setEmail(e.target.value); setError("") }} onKeyDown={onKey} autoComplete="email" />
                {emailValid && <span className="reg-valid-ico" style={{ color:"#30c97e", fontSize:16 }}>✓</span>}
              </div>

              <div className="reg-inp-wrap">
                <span className="reg-ico">🔒</span>
                <input className="reg-inp" type={showPw ? "text" : "password"} placeholder="Create a password"
                  value={password} onChange={e => { setPassword(e.target.value); setError("") }}
                  onKeyDown={onKey} autoComplete="new-password" style={{ paddingRight:48 }} />
                <button className="pw-toggle" onClick={() => setShowPw(v => !v)} type="button">{showPw ? "🙈" : "👁️"}</button>
              </div>

              {password && (
                <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} style={{ marginBottom:16, marginTop:-8 }}>
                  <div className="pw-strength">
                    <div className="pw-strength-fill" style={{ width:`${pwStrength.score * 25}%`, background:pwStrength.color }} />
                  </div>
                  <div style={{ display:"flex", justifyContent:"flex-end", marginTop:5 }}>
                    <span style={{ fontSize:12, color:pwStrength.color, fontWeight:600 }}>{pwStrength.label}</span>
                  </div>
                </motion.div>
              )}

              <motion.button className="reg-btn" onClick={register} disabled={loading} whileTap={{ scale:0.97 }} style={{ marginTop:4 }}>
                {loading
                  ? <><span style={{ width:17, height:17, border:"2.5px solid rgba(255,255,255,0.25)", borderTopColor:"#fff", borderRadius:"50%", animation:"reg-spin .7s linear infinite", display:"inline-block" }} /> Creating account…</>
                  : "Create free account →"}
              </motion.button>

              <div style={{ textAlign:"center", marginTop:22 }}>
                <p style={{ fontSize:14.5, color:"#5a6488" }}>
                  Already have an account?{" "}
                  <Link to="/login" style={{ color:"#a99dfc", fontWeight:700, textDecoration:"none" }}>Sign in →</Link>
                </p>
              </div>
              <p style={{ textAlign:"center", fontSize:12, color:"#3a3f5c", marginTop:20, lineHeight:1.7 }}>
                By creating an account you agree to SensAI's terms.<br/>Your data is never sold.
              </p>
            </>
          )}
        </motion.div>
      </div>
    </div>
  )
}
